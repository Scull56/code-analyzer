import Rule from "./Rule";
import { RulePartContent, RulePartKeyword, RulePartNamed, RulePartScope, RulePartTag } from "./RulePart";
import { IRulePart, PartType, type IContentablePart } from "../types/RulePart";
import { removeArrElem } from '../utils/data';
import type ReservedList from "../types/ReservedList";
import MatchGroups from "./MatchGroups";
import type SyntaxItem from "../types/SyntaxItem";

interface Match {
   type: PartType,
   start: number,
   end: number,
   value: string
}

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
   // list of validation results that contains base group matches and matches for rule match variables
   strings: Match[][] = [[]]
   // list of validity checks parts of rules 
   checks: boolean[] = [true]
   // list of object for scopesQueues
   matchesArr: Match[][] = [[]]
   // list of part ?, which are now processed
   permissibles: [] = []

   constructor(rule: Rule<any>, mainPartIter: number) {
      this.name = rule.name
      this.parts.push(new RulePartContent(PartType.main, rule.parts))
      this.iters.push(mainPartIter)
   }
}

class ScopeInfo {
   start: number
   end: number
   rules: RuleInfo[]
   index: number
   matches: SyntaxItem[]

   constructor(start: number, end: number, rules: RuleInfo[], index: number, matches: SyntaxItem[]) {
      this.start = start
      this.end = end
      this.rules = rules
      this.index = index
      this.matches = matches
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
   matches: SyntaxItem[]
   errors: MatchError[]
}

/**
 * Set of rules that can be used to parse code
 */
export default class RuleSet {
   rules: Rule<any>[] = []
   reserved: ReservedList

   /**
    * Constructor of RuleSet class
    * 
    * @param {Rule<any>[]}    rules - array of rules with which code will processed
    * @param {ReservedList}   reserved - object with reserved symbols and words
    */
   constructor(rules: Rule<SyntaxItem>[], reserved: ReservedList) {

      this.addRule(rules)
      this.reserved = reserved
   }

   addRule(rules: Rule<any>[]) {

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

      // list of text's areas for processing text by nesting level
      let scopesQueue: ScopeInfo[] = [new ScopeInfo(0, code.length, [], 0, result.matches)]

      let scope: ScopeInfo

      let iters: number[]
      let parts: IContentablePart[]
      let indexes: number[]
      let variables: object[]
      let strings: Match[][]
      let checks: boolean[]
      let matchesArr: Match[][]
      let permissibles: []

      // process the code while there are areas of text
      while (scopesQueue.length > 0) {

         scope = scopesQueue[scopesQueue.length - 1] as ScopeInfo

         // init data object for every rules
         if (scope.rules.length == 0) {

            scope.rules = this.rules.map(rule => new RuleInfo(rule, (scopesQueue[0] as ScopeInfo).start))
         }

         // select the most appropriate rule one by one
         for (let j = scope.index; j < scope.rules.length; j++) {

            rule = scope.rules[j] as RuleInfo

            iters = rule.iters
            parts = rule.parts
            indexes = rule.indexes
            variables = rule.variables
            strings = rule.strings
            checks = rule.checks
            matchesArr = rule.matchesArr
            permissibles = rule.permissibles

            // process rule while rule's main scope in pattern wasn't delete or pattern pass validity check
            // if there are more rules that might fit, the occurrence of a validation error will remove the given rule from the list as unsuitable
            while (parts.length > 0 && (checks[0] || scope.rules.length == 1)) {

               // if current symbol is enter or backspace, skip it
               let symbol = code[iters[iters.length - 1] as number]

               // if the current part of the rule passes the test 
               if (checks[checks.length - 1]) {

                  // if the current part of the rule has not yet been fully processed, process it's nested part of rule
                  if (indexes[indexes.length - 1] as number <= (parts[parts.length - 1] as IContentablePart).content.length - 1) {

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


                           addMatch(rule, u, word)

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

                           addScope()

                           break

                        case PartType.next:
                        case PartType.noNext:

                           // move rule parts in next or noNext part in end for correct processing
                           let content = (part as RulePartContent).content

                           let target = content[0]

                           content.shift()
                           content.push(target as IRulePart)

                           addScope()

                           break

                        case PartType.string:

                           let breaket = code[iters[iters.length - 1] as number]

                           if (this.reserved.stringDefiners.indexOf(breaket as string) > -1) {

                              let string = ''

                              let u: number = iters[iters.length - 1] as number

                              let check = false

                              for (u; u < code.length; u++) {

                                 if (code[u] != breaket || code[u - 1] == '\\') {

                                    string += code[u]
                                 }
                                 else {

                                    check = true

                                    break
                                 }
                              }

                              if (check) {

                                 addMatch(rule, u, string)
                              }
                              else {

                                 addMatch(rule, iters[iters.length - 1] as number, breaket as string)

                                 checks[checks.length - 1] = false
                              }
                           }
                           else {

                              addMatch(rule, iters[iters.length - 1] as number, breaket as string)

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

                           addMatch(rule, l, number)

                           break

                        case PartType.text:

                           let text: string = ''

                           let end: number

                           let nextPart: IRulePart | undefined = (parts[parts.length - 1] as IContentablePart).content[indexes[indexes.length - 1] as number + 1]

                           let iter = iters[iters.length - 1] as number

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

                                       breakWords.push((nextPart as RulePartTag).openBreaket)

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

                              let minIndex = breakIndexes.sort((a, b) => a - b)[0] as number

                              text = code.slice(iter, minIndex)

                              end = minIndex
                           }
                           else {

                              let breakSymbol

                              let i = 1

                              let scope = parts[parts.length - i]

                              while (!(scope instanceof RulePartScope || scope instanceof RulePartTag)) {

                                 if (parts.length == i) {

                                    break
                                 }

                                 ++i

                                 scope = parts[parts.length - i]
                              }

                              if (scope instanceof RulePartScope) {

                                 if (scope.breaket == '(' || scope.breaket == '{' || scope.breaket == '[') {

                                    end = code.indexOf(Rule.breakets.get(scope.breaket) as string, iter)

                                    text = code.slice(iter, end)
                                 }

                                 if (scope.breaket == '&') {


                                 }
                              }
                              else if (scope instanceof RulePartTag) {

                                 for (let i = 0; i < code.length; i++) {



                                 }

                              } else {

                                 let scope = scopesQueue[scopesQueue.length - 1] as ScopeInfo

                                 end = scope.end

                                 text = code.slice(iters[iters.length - 1], end)
                              }
                           }

                           addMatch(rule, end, text)

                           break

                        case PartType.rule:

                           let partRule = this.rules.find(rule => (part as RulePartNamed).name == rule.name)

                           if (partRule) {

                              (part as RulePartNamed).content.push(...partRule.parts)

                              addScope()
                           }
                           else {

                              // throw exception
                           }

                           break

                        case PartType.scope:

                           if ((part as RulePartScope).breaket == '&') {

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
                           else {

                              symbol = code[iters[iters.length - 1] as number]

                              if ((symbol == '{' || symbol == '[' || symbol == '(') && (part as RulePartScope).) {

                                 breakets.push(symbol)
                              }
                              else {

                                 // throw error
                              }
                           }

                           addScope()

                           break

                        case PartType.tag:

                           addScope()
                           break
                        default:
                           break
                     }
                  }
                  // if current part of rule was processed already
                  else {

                     part = pattern[pattern.length - 1]

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
               if (rules.length > 1) {

                  break
               }
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

         iters.push(iters[iters.length - 1])
         pattern.push(part)
         indexes.push(0)
         checks.push(true)
         strings.push([])
         matchesArr.push([])
         variables.push({})
      }

      function addMatch(rule: RuleInfo, end: number, value: string) {

         let match: Match = {
            type: mode,
            start: rule.iters[rule.iters.length - 1],
            end,
            value
         }

         rule.strings[rule.strings.length - 1].push(match)

         rule.iters[rule.iters.length - 1] = end
      }

      function closeScope() {

         strings[strings.length - 2].push(...strings[strings.length - 1])
         matchesArr[matchesArr.length - 2].push(...matchesArr[matchesArr.length - 1])
         iters[iters.length - 2] = iters[iters.length - 1]

         for (let key in variables[variables.length - 1]) {

            if (variables[variables.length - 2][key]) {

               variables[variables.length - 2][key].push(...variables[variables.length - 1][key])
            }
            else {

               variables[variables.length - 2][key] = variables[variables.length - 1][key]
            }
         }

         // delete data of this part of rule for processing next part of rule on next iteration of loop
         pattern.pop()
         indexes.pop()
         strings.pop()
         checks.pop()
         iters.pop()
         matchesArr.pop()
         variables.pop()
      }

      return result
   }
}