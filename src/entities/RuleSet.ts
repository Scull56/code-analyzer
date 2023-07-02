import Rule from "./Rule";
import { RulePartContent, RulePartKeyword, RulePartNamed, RulePartScope, RulePartTag } from "./RulePart";
import { IRulePart, PartType, type IContentablePart } from "../types/RulePart";
import { removeArrElem } from '../utils/data';
import type ReservedList from "../types/ReservedList";
import MatchGroups from "./MatchGroups";
import { IMatch } from "../types/Match";
import { TagMatch } from "./Match";
import type ISyntaxItem from "../types/SyntaxItem";

class RuleInfo {
   name: string
   // list of text's iterators of rules
   iters: number[] = []
   // list of parts of rules, which have content
   parts: IContentablePart[] = []
   // list of indexes of parts of rules, which have content
   indexes: number[] = [0]
   // list of objects with variables, which part contain inside
   variables: object[] = [{}]
   // list of matches of parts
   matches: IMatch[][] = [[]]
   // list of validity checks parts of rules 
   checks: boolean[] = [true]
   // list of part ?, which are now processed
   permissibles: [] = []

   constructor(rule: Rule<ISyntaxItem>, mainPartIter: number) {
      this.name = rule.name
      this.parts.push(new RulePartContent(PartType.main, rule.parts))
      this.iters.push(mainPartIter)
   }
}

class ScopeInfo {
   start: number
   end: number
   rules: RuleInfo[] = []
   index: number = 0
   matches: ISyntaxItem[] = []

   constructor(start: number, end: number) {
      this.start = start
      this.end = end
   }
}

interface MatchError {
   string: string
   replacement: string,
   parts: [][],
   start: number,
   end: number
}

export interface RuleMatches {
   groups: MatchGroups
   matches: ISyntaxItem[]
   errors: MatchError[]
}

/**
 * Set of rules that can be used to parse code
 */
export default class RuleSet {
   rules: Rule<ISyntaxItem>[] = []
   reserved: ReservedList

   /**
    * Constructor of RuleSet class
    * 
    * @param {Rule<ISyntaxItem>[]}    rules - array of rules with which code will processed
    * @param {ReservedList}   reserved - object with reserved symbols and words
    */
   constructor(rules: Rule<ISyntaxItem>[], reserved: ReservedList) {

      this.addRule(rules)
      this.reserved = reserved
   }

   addRule(rules: Rule<ISyntaxItem>[]) {

      this.rules.push(...rules)
   }

   match(code: string): RuleMatches {

      // method return ordered and grouped matches and list of errors
      let result: RuleMatches = {
         groups: new MatchGroups(),
         matches: [],
         errors: []
      }

      // add arrays for all groups of base matches and rules
      this.rules.forEach(rule => result.groups.rules[rule.name] = [])

      // current rule
      let rule: RuleInfo

      // current part of rule
      let part: IRulePart

      // how process current part of rule
      let mode: PartType

      // if a number is placed, it means that the tab area has been opened. If a line starting with < was inserted, this is a tag, otherwise the string means () {} []
      let breakets: (string | number)[] = []

      // if was added new scope in queue, set true for continue main while loop
      let newScope = false

      // list of text's areas for processing text by nesting level
      let scopesQueue: ScopeInfo[] = [new ScopeInfo(0, code.length)]

      result.matches = (scopesQueue[0] as ScopeInfo).matches

      let scope: ScopeInfo

      let iters: number[]
      let parts: IContentablePart[]
      let indexes: number[]
      let variables: object[]
      let matches: IMatch[][]
      let checks: boolean[]
      let permissibles: []

      // process the code while there are areas of text
      while (scopesQueue.length > 0) {

         scope = scopesQueue[scopesQueue.length - 1] as ScopeInfo

         // init data object for every rules
         if (scope.rules.length == 0) {

            scope.rules = this.rules.map(rule => new RuleInfo(rule, scope.start))
         }

         // select the most appropriate rule one by one
         for (let j = scope.index; j < scope.rules.length; j++) {

            rule = scope.rules[j] as RuleInfo

            iters = rule.iters
            parts = rule.parts
            indexes = rule.indexes
            variables = rule.variables
            matches = rule.matches
            checks = rule.checks
            permissibles = rule.permissibles

            // process rule while rule's main scope in pattern wasn't delete or pattern pass validity check
            // if there are more rules that might fit, the occurrence of a validation error will remove the given rule from the list as unsuitable
            while (parts.length > 0 && (checks[0] || scope.rules.length == 1)) {

               // if current symbol is enter or backspace, skip it
               let symbol = code[iters[iters.length - 1] as number]

               // if the current part of the rule passes the test 
               if (checks[checks.length - 1]) {

                  // if the current part of the rule has not yet been fully processed, process it's nested part of rule
                  if (indexes[indexes.length - 1] as number < (parts[parts.length - 1] as IContentablePart).content.length) {

                     part = (parts[parts.length - 1] as IContentablePart).content[indexes[indexes.length - 1] as number] as IRulePart
                     mode = part.type

                     // define how process this part of rule
                     switch (mode as any) {

                        case PartType.boolean:
                        case PartType.keyword:

                           let word = ''

                           let u: number = iters[iters.length - 1] as number

                           for (u; u < code.length; u++) {

                              if (this.reserved.keySymbols.indexOf(code[u] as string) > -1) {

                                 // validation fails if the current character is one of the reserved characters and the length of the specified keyword is not equal to the word in the code
                                 if ((part as RulePartKeyword).name.length != word.length) {

                                    checks[checks.length - 1] = false

                                    break
                                 }
                              }
                              else {

                                 // validation falls if the current character is not equal character in the defined keyword at same position
                                 if ((part as RulePartKeyword).name[u - (iters[iters.length - 1] as number)] != code[u]) {

                                    checks[checks.length - 1] = false

                                    // read remaining characters of keyword in code
                                    for (u; u < code.length; u++) {

                                       if (this.reserved.keySymbols.indexOf(code[u] as string) > -1) {

                                          break
                                       }
                                       else {

                                          word += code[u]
                                       }
                                    }

                                    break
                                 }
                                 else {

                                    word += code[u]
                                 }
                              }
                           }

                           --u

                           if (mode as PartType == PartType.boolean &&
                              this.reserved.booleans.indexOf(word) == -1) {

                              checks[checks.length - 1] = false
                           }


                           addMatch(rule, u)

                           break

                        case PartType.var:
                        case PartType.logicScope:
                        case PartType.oneMore:
                        case PartType.zeroMore:
                        case PartType.maybe:
                        case PartType.or:
                        case PartType.iter:
                        case PartType.orPart:
                        case PartType.prev:
                        case PartType.noPrev:

                           addContaintable(part as RulePartContent)

                           break

                        case PartType.next:
                        case PartType.noNext:

                           // move rule parts in next or noNext part in end for correct processing
                           let content = (part as RulePartContent).content

                           let target = content[0]

                           content.shift()
                           content.push(target as IRulePart)

                           addContaintable(part as RulePartContent)

                           break

                        case PartType.string:

                           let b: number = iters[iters.length - 1] as number

                           let breaket = code[b]

                           if (this.reserved.stringDefiners.indexOf(breaket as string) > -1) {

                              let string = ''

                              let check = false

                              for (b; b < code.length; b++) {

                                 if (code[b] != breaket || code[b - 1] == '\\') {

                                    string += code[b]
                                 }
                                 else {

                                    check = true

                                    break
                                 }
                              }

                              if (check) {

                                 addMatch(rule, b)
                              }
                              else {

                                 addMatch(rule, iters[iters.length - 1] as number)

                                 checks[checks.length - 1] = false
                              }
                           }
                           else {

                              addMatch(rule, iters[iters.length - 1] as number)

                              checks[checks.length - 1] = false
                           }

                           break

                        // * реализовать возможность считывания не только простых чисел, но и чисел в бинарном виде и в экспотенциальной форме
                        case PartType.number:

                           let l: number = iters[iters.length - 1] as number

                           let number = ''
                           let double = false

                           for (l; l < code.length; l++) {

                              if (this.reserved.keySymbols.indexOf(code[l] as string) > -1) {

                                 if (number.length == 0) {

                                    checks[checks.length - 1] = false
                                 }

                                 break
                              }

                              if (this.reserved.numbers.indexOf(code[l] as string) == -1 &&
                                 code[l] != this.reserved.decimalSeparator) {

                                 checks[checks.length - 1] = false

                                 break
                              }

                              if (code[l] == this.reserved.decimalSeparator && !double) {

                                 double = true
                              }
                              else {

                                 break
                              }

                              number += code[l]
                           }

                           addMatch(rule, l)

                           break

                        case PartType.text:

                           let iter = iters[iters.length - 1] as number

                           let end: number = iter

                           let nextPart: IRulePart | undefined = (parts[parts.length - 1] as IContentablePart).content[indexes[indexes.length - 1] as number + 1]

                           if (nextPart) {

                              let breakWords: string[] = []

                              let nextMode: PartType = nextPart.type

                              while (breakWords.length) {

                                 switch (nextMode as any) {

                                    case PartType.keyword:

                                       breakWords.push((nextPart as RulePartKeyword).name)

                                       break

                                    // * пока не знаю можно ли это обработать
                                    case PartType.text:
                                       // throw error
                                       break

                                    case PartType.boolean:

                                       breakWords.push(...this.reserved.booleans)

                                       break

                                    case PartType.number:

                                       breakWords.push(...this.reserved.numbers)

                                       break

                                    case PartType.string:

                                       breakWords.push(...this.reserved.stringDefiners)

                                       break

                                    case PartType.var:
                                    case PartType.iter:
                                    case PartType.logicScope:
                                    case PartType.oneMore:
                                    case PartType.zeroMore:
                                    case PartType.maybe:
                                    case PartType.prev:
                                    case PartType.noPrev:

                                       nextPart = (nextPart as RulePartContent).content[0]

                                       break

                                    case PartType.tag:

                                       breakWords.push(this.reserved.endOpenBreaket)

                                       break

                                    case PartType.next:
                                    case PartType.noNext:

                                       nextPart = (nextPart as RulePartContent).content[1]

                                       break

                                    case PartType.rule:

                                       let nextRule = this.rules.find(rule => rule.name == (nextPart as RulePartNamed).name)

                                       if (nextRule) {

                                          nextPart = nextRule.parts[0]
                                       }
                                       else {
                                          // throw error undefined rule
                                       }

                                       break

                                    // * пока выкидываю error, но в будущем можно сделаить нормальную обработку. однако для пользователя это всё равно будет нежелательным, алгоритм может требовать много ресурсов
                                    case PartType.or:

                                       // throw error

                                       break

                                    case PartType.scope:

                                       breakWords.push((nextPart as RulePartScope).breaket)

                                       break

                                    default:
                                       break;
                                 }
                              }

                              let breakIndexes: number[] = breakWords.map(item => code.indexOf(item, iter))

                              end = breakIndexes.sort((a, b) => a - b)[0] as number
                           }
                           else {

                              let i = 1

                              let scope = parts[parts.length - i]

                              while (!(scope instanceof RulePartScope || scope instanceof RulePartTag)) {

                                 if (parts.length == i) {

                                    break
                                 }

                                 ++i

                                 scope = parts[parts.length - i]
                              }

                              if (!(scope instanceof RulePartScope || scope instanceof RulePartTag)) {

                                 let scopeInfo = scopesQueue[scopesQueue.length - 1] as ScopeInfo

                                 let scopeRule = scopeInfo.rules[scopeInfo.index] as RuleInfo

                                 scope = scopeRule.parts[scopeRule.parts.length - 1]
                              }

                              if (scope instanceof RulePartScope) {

                                 if (scope.breaket == '(' || scope.breaket == '{' || scope.breaket == '[') {

                                    end = code.indexOf(Rule.breakets.get(scope.breaket) as string, iter)
                                 }

                                 if (scope.breaket == '&') {

                                    let currentTabCounts = breakets[breakets.length - 1] as number

                                    let tabIndex = iter

                                    while (true) {

                                       tabIndex = code.indexOf('/n', tabIndex) + 1;

                                       if (tabIndex == -1) {

                                          end = code.length - 1

                                          break
                                       }

                                       let tabCount = 0;

                                       let repeat = false;

                                       while (true) {

                                          if (code[tabIndex + tabCount] == ' ') {

                                             ++tabCount
                                          }
                                          else if (code[tabIndex + tabCount] == '/n') {

                                             repeat = true

                                             break
                                          }
                                          else {

                                             break
                                          }
                                       }

                                       if (repeat) {

                                          tabIndex += tabCount + 1

                                          continue
                                       }

                                       if (tabCount <= currentTabCounts) {

                                          end = tabIndex

                                          break
                                       }
                                    }
                                 }
                              }

                              if (scope instanceof RulePartTag) {

                                 end = code.indexOf(this.reserved.endOpenBreaket, iter)
                              }
                           }

                           addMatch(rule, end)

                           break

                        case PartType.rule:

                           let partRule = this.rules.find(rule => (part as RulePartNamed).name == rule.name)

                           if (partRule) {

                              (part as RulePartNamed).content.push(...partRule.parts)

                              addContaintable(part as RulePartContent)
                           }
                           else {

                              // throw exception
                           }

                           break

                        case PartType.scope:

                           let scopePart = part as RulePartScope

                           if (scopePart.breaket == '&') {

                              let i = iters[iters.length - 1] as number

                              for (i; i < code.length; i++) {

                                 if (code[i] == '/n') {

                                    ++i

                                    break
                                 }
                              }

                              let spacesCount = 0

                              for (i; i < code.length; i++) {

                                 if (code[i] != ' ') {

                                    iters[iters.length - 1] = i

                                    break
                                 }

                                 ++spacesCount
                              }

                              let lastTabSpacesCount: number | undefined

                              for (let i = breakets.length; i >= 0; i--) {

                                 if (typeof breakets[i] == 'number') {

                                    lastTabSpacesCount = breakets[i] as number

                                    break
                                 }
                              }

                              if (lastTabSpacesCount != undefined) {

                                 if (spacesCount - lastTabSpacesCount != (this.reserved?.spaces as number)) {

                                    // throw error
                                 }
                              }

                              breakets.push(spacesCount)
                           }

                           if ((symbol == '{' || symbol == '[' || symbol == '(') && scopePart.breaket == symbol) {

                              breakets.push(symbol)
                           }

                           if (scopePart.content.length > 0) {

                              addScope()
                           }

                           addContaintable(scopePart)

                           break

                        case PartType.tag:

                           let tagPart = part as RulePartTag

                           let currentMatches = matches[matches.length - 1] as IMatch[]

                           let match = currentMatches[currentMatches.length - 1] as IMatch

                           let i = iters[iters.length - 1] as number

                           if (!(match instanceof TagMatch)) {

                              let openBreaket = code.slice(i, i + this.reserved.startOpenBreaket.length)

                              if (openBreaket != this.reserved.startOpenBreaket) {
                                 // throw error
                              }

                              for (i; i < code.length; i++) {
                                 if (code[i] != ' ') {
                                    break
                                 }
                              }

                              let tagName = ''

                              for (i; i < code.length; i++) {
                                 if (code[i] == ' ') {
                                    break
                                 }

                                 tagName += code[i]
                              }

                              addMatch<TagMatch>(rule, iters[iters.length - 1] as number)

                              match = currentMatches[currentMatches.length - 1] as TagMatch

                              (match as TagMatch).tagName = tagName
                           }

                           for (i; i < code.length; i++) {
                              if (code[i] != ' ') {
                                 break
                              }
                           }

                           // считать имя атрибута
                           // добавить в content текущего part attrValue правила
                           // при закрытии contantble part возобновить его обраотку и добавить полученный match в Map
                           // повторить здесь до тех пор, пока не обнаружим startCloseBreaket

                           let attrName



                           let index: number = 0

                           for (let i = 0; i < this.reserved.startOpenBreaket.length; i++) {

                              index = iters[iters.length - 1] as number + i

                              if (code[index] != undefined) {

                                 symbols += code[index]
                              }
                              else {

                                 break
                              }
                           }

                           if (symbols == this.reserved.startOpenBreaket) {


                           }
                           else {
                              // throw error
                           }

                           addContaintable(part as RulePartTag)

                           break

                        default:
                           break
                     }
                  }
                  // if current part of rule was processed already
                  else {

                     part = parts[parts.length - 1]

                     // process part ?, which is facing the current part, if it is
                     let currentPermissible = permissibles[permissibles.length - 1]

                     if (currentPermissible) {

                        // ignore part ?, if it was first check by current part

                        if (currentPermissible.mode == 'second') {

                           // create error for all parts ?
                        }

                        queues[j].permissibles = []
                        permissibles = queues[j].permissibles
                     }

                     // define how process this part of rule
                     switch (part.type) {

                        case 'or_part':

                           indexes[indexes.length - 2] = pattern[pattern.length - 2].content.length

                           closeScope()

                           break

                        case '>':
                        case '<':
                        case 'or':
                        case '?':
                        case 'scope_$':

                           closeScope()

                           break

                        case '+':
                        case '*':

                           // repeat checks again
                           indexes[indexes.length - 1] = 0

                           // wrap matchess in array
                           strings[strings.lenght - 1] = [strings[strings.lenght - 1]]

                           break

                        case '<!':
                        case '>!':

                           checks[checks.length - 1] = false
                           checks[checks.length - 2] = false

                           break

                        case 'var':

                           variables[variables.length - 2][part.name] = strings[strings.length - 1]

                           closeScope()

                           break

                        case 'rule':

                           let partRule = this.rules.find(rule => part.name == rule.name)

                           if (partRule) {

                              let match = partRule.createMatch(
                                 variables[variables.length - 1],
                                 strings[strings.length - 1],
                                 iters[iters.length - 2],
                                 iters[iters.length - 1]
                              )

                              variables[variables.length - 1] = {}

                              strings[variables.length - 1] = match

                              closeScope()
                           }

                           break

                        case 'iter':

                           symbol = code[iters[iters.length - 1]]

                           let i = iters[iters.length - 1]

                           for (i; i < scopesQueue[0].end; i++) {

                              if (symbol == ' ' || symbol == '\n') {

                                 continue
                              }
                              else {

                                 break
                              }
                           }

                           if (code[i] == ',') {

                              for (i; i < scopesQueue[0].end; i++) {

                                 if (symbol == ' ' || symbol == '\n') {

                                    continue
                                 }
                                 else {

                                    break
                                 }
                              }

                              iters[iters.length - 1] = i
                           }

                           let parentPart = pattern[pattern.length - 2]

                           if (code[i] == this.parenthesis[parentPart.breaket]) {

                              closeScope()
                           }

                           break

                        case 'scope':

                           if (code[iters[iters.length - 1]] == this.parenthesis[part.breaket]) {

                              closeScope()
                           }
                           else {

                              // createBaseError()
                           }

                           break

                        default:
                           break
                     }
                  }

                  // let the current part of the rule know that its current nested part of the rule has been processed by increasing the index
                  ++indexes[indexes.length - 1]
               }
               // if the current rule part fails the test before all its nested rule parts have been processed
               else {

                  let i = 1

                  part = pattern[pattern.length - 1].content[indexes[indexes.length - 1]]

                  let parts = []

                  let flag = true

                  while (pattern[pattern.lenght - i] && flag) {

                     part = pattern[pattern.length - i]

                     if (part.type != '?') {

                        // if part fail check first time after check part ?, check text by current part second time, starting from a place in the text where the type of verification coincides with this part of the rule
                        let currentPermissible = permissibles[permissibles.lenght - 1]

                        if (currentPermissible) {

                           let index = currentPermissible.index

                           while (true) {

                              let string = ''

                              let i = index

                              while (true) {

                                 if (code[i] == ' ' || code[i] == '/n') {

                                    ++i

                                    continue
                                 }

                                 if (this.keySymbols.indexOf(code[i]) >= 0) {

                                    if (this.keySymbols.indexOf(string[0]) == -1) {


                                    }

                                    break
                                 }

                                 string += code[i]

                                 ++i
                              }

                              // define type of part of text
                              let type

                              switch (string) {

                                 case '"':
                                 case '`':
                                 case "'":

                                    type = 'string'

                                    break;

                                 case '(':
                                 case '{':
                                 case "[":

                                    type = 'scope'

                                    break;

                                 case '0':
                                 case '1':
                                 case '2':
                                 case '3':
                                 case '4':
                                 case '5':
                                 case '6':
                                 case '7':
                                 case '8':
                                 case '9':

                                    type = 'number'

                                    break;

                                 case 'true':
                                 case 'false':

                                    type = 'boolean'

                                    break;

                                 default:

                                    type = 'word'

                                    break;
                              }

                              // if type of part of text 
                              if (type != part.type) {

                                 index = i
                              }
                              else {

                                 break
                              }
                           }
                        }
                     }

                     // define how process this error
                     switch (part.type) {

                        case '+':
                        case '*':

                           let string = strings[strings.lenght - i]

                           if (part.type == '+' && !Array.isArray(string[0])) {

                              part.unshift(part.type)
                           }
                           else if (typeof string[string.lenght - 1] == 'string' && typeof string[string.lenght - 2] == 'string') {

                              part.unshift(part.type)
                           }
                           else {

                              flag = false
                           }

                           // мы должны записывать ошибки из-за которых произошел выход из цикла
                           // хто позволит например отследить момент, когда для разделения двух операций не был использован enter или ;

                           break

                        case '?':

                           // add data for processing to list
                           permissibles.push({
                              part,
                              mode: 'first',
                              index: iters[iters.lenght - 1]
                           })

                           // save initial iter for processing current part of text by next part of rule
                           let prevIter = iters[iters.lenght - 2]

                           closeScope()

                           iters[iters.lenght - 1] = prevIter

                           // сначала текущее слово проверяем выражением ?
                           // если удачно, то идём дальше, иначе проверяем текущее слово следующим выражением после ?
                           // если проверка удачна, то ошибки нет, иначе проверяем этим выражением следующюу партию слов 
                           // если они проходят проверку, то ошибка относится к набору слов из первой проверки и к выражению ?, иначе ошибку можно отнести и к вражению ? и к следующему за ним

                           // * сделать так, что бы для каждого уровня создавался массив для добавления частей ? и если на данном уровне вложенности идут подряд такие части, то они все сохранятся для ошибки

                           break

                        case '>':
                           break

                        case '<':
                           break

                        case '>!':
                           break

                        case '<!':
                           break

                        case 'or':
                           break

                        case 'or_part':
                           break

                        case 'var':
                           break

                        case 'rule':
                           break

                        case 'scope':
                           break;

                        default:
                           break;
                     }

                     ++i
                  }

                  if (flag) {

                     let currentStrings = strings[strings.lenght - 1]
                     let string = currentStrings[currentStrings.lenght - 1]

                     let data = {
                        string,
                        replacement: part,
                        parts: [pattern[pattern.length - 1]],
                        start: iters[iters.lenght - 1] - string.lenght,
                        end: iters[iters.lenght - 1]
                     }

                     errors.push(data)
                  }
               }

               // if there are more rules that might fit, stop process current rule
               if (scope.rules.length > 1) {

                  break
               }
            }

            if (newScope) {

               newScope = false

               scope.index = j

               break
            }

            // delete rule if it fails the test and there are more rules that might fit
            if (!(scope.rules[j] as RuleInfo).checks[0] && scope.rules.length > 1) {

               scope.rules = removeArrElem(scope.rules, j)

               --j
            }

            // if the rule check for the code section was completed, create match and add it in matches groups and list
            if (scope.rules.length == 1) {

               (scope.rules[j] as RuleInfo).variables.start = scopesQueue[0]


               let match = rules[j].createMatch(variables, strings, scopesQueue[0].start, iters[0])

               result.groups.rules[rules[j].name].push(match)
               result.matches[result.matches.length - 1].push(match)

               // shift iterator of text for process next part of code
               scopesQueue[0].start = iters[0]

               break
            }

            // generate an undefined character or keyword error if no rule was matched
            if (scope.rules.length == 0) {

               let string = ''

               let i = scopesQueue[0].start

               let symbol = code[i]

               let mode

               switch (symbol) {

                  case '"':
                  case "'":
                  case '`':

                     mode = 'string'

                     for (i; i < scopesQueue[0].end; i++) {

                        if (code[i] != symbol) {

                           string += code[i]
                        }
                        else {

                           break
                        }

                     }

                     break

                  case '{':
                  case '[':
                  case '(':

                     mode = 'scope'

                     let breakets = []

                     for (i; i < scopesQueue[0].start; i++) {

                        if (code[i] == '(' || code[i] == '[' || code[i] == '{') {

                           breakets.push(symbol)
                        }
                        else if (code[i] == ')' || code[i] == ']' || code[i] == '}') {

                           if (this.parenthesis[breakets[breakets.length - 1]] == code[i]) {

                              breakets.pop()

                              if (breakets.length == 0) {

                                 break
                              }
                           }
                           else {

                              // createBaseSyntaxError()
                           }
                        }
                        else {

                           string += code[i]
                        }
                     }

                     break

                  case '':
                     break

                  default:
                     break
               }

               createBaseSyntaxError(mode, string, scopesQueue[0].start, i)

               scopesQueue[0].start = i

               break
            }
         }
      }

      function addScope() {

         let start = iters[iters.length - 1] as number;

         let info = new ScopeInfo(start, code.length);

         scopesQueue.push(info)
      }

      function addContaintable(part: IContentablePart) {

         iters.push(iters[iters.length - 1] as number)
         parts.push(part)
         indexes.push(0)
         checks.push(true)
         matches.push([])
         variables.push({})
      }

      function addMatch<T extends IMatch>(rule: RuleInfo, end: number) {

         let start = rule.iters[rule.iters.length - 1] as number;

         let match = {
            type: mode,
            start,
            end,
            value: code.slice(start, end)
         } as T;

         (rule.matches[rule.matches.length - 1] as IMatch[]).push(match)

         rule.iters[rule.iters.length - 1] = end
      }

      function closeScope() {

         let prevMatches = matches[matches.length - 2] as IMatch[]

         prevMatches.push(...matches[matches.length - 1] as IMatch[])

         iters[iters.length - 2] = iters[iters.length - 1] as number

         for (let key in variables[variables.length - 1]) {

            let prevVariables = variables[variables.length - 2] as any
            let currentVariables = variables[variables.length - 1] as any

            if (prevVariables[key]) {

               prevVariables[key].push(...currentVariables[key])
            }
            else {

               prevVariables[key] = currentVariables[key]
            }
         }

         // delete data of this part of rule for processing next part of rule on next iteration of loop
         parts.pop()
         indexes.pop()
         matches.pop()
         checks.pop()
         iters.pop()
         variables.pop()
      }

      return result
   }
}