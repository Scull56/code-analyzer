import { RulePart, RulePartNamed, RulePartScope, RulePartContent, RulePartKeyword } from "./RulePart";
import { PartType, type IContentablePart, IRulePart } from '../types/RulePart';
import SyntaxItem from "../types/SyntaxItem";

enum EndsType {
   scope,
   logicScope,
   part,
   or,
   orPart
}

/**
 * Rule accorging to which will checked a character sequence
 * 
 * @prop {string}       name - string with an identifyer for use in $rule() construction
 * @prop {RulePart[]}   parts - transformed pattern string into rule's parts for processing code
 */
export default class Rule<T extends SyntaxItem>{
   name: string;
   parts: RulePart[] = [];

   public static breakets: Map<string, string> = new Map([
      ['{', '}'],
      ['[', ']'],
      ['(', ')'],
      // tags
      ['^', '^'],
      // tabs
      ['&', '&']
   ])

   private static keySymbols = ['(', ')', '{', '}', '[', ']', '$', '|', '&', '^']

   private static keyWords = ['string', 'text', 'number', 'boolean', 'rule', 'iter']

   /**
    * Constructor of Rule class
    * 
    * @typeParam T         match's type - class, which implements SyntaxItem interface and contain params for write variables
    * @param {string}      name - string with an identifyer for use in $rule() construction
    * @param {string}      pattern - string with regular expression to check character sequences
    */
   constructor(name: string, pattern: string) {

      this.name = name

      // Tokenization of patten's string

      // scope - it's object containing inforamtion about type of check and property content where store processed by it items

      let mainScope = new RulePartContent(PartType.main, [])
      // process the last item in the list
      let scopes: IContentablePart[] = [mainScope]
      // take the last item of list and associated with precessed scope
      let ends: EndsType[] = [EndsType.scope]
      // store breakets what would understand which scope closed
      let breakets: string[] = []
      // define how interpret precessed symbol
      let mode: PartType | undefined = undefined;
      // store info about whether the character being processed was escaped
      let shield = false
      // iterator for pattern's string
      let i = 0
      // current symbol
      let current: string

      // created objects of scopes
      let partObj: RulePart

      for (i; i < pattern.length; i++) {

         // default preocess symbol how start of keyword
         mode = PartType.keyword

         current = pattern[i] as string

         if (current == ' ') {

            continue
         }

         if (current == '/' && !shield) {

            shield = true

            ++i
         }

         if ([']', ')', '}', '&', '^'].indexOf(current) > -1) {

            if (current == '&' || current == '^') {

               let lastEnd = breakets[breakets.length - 1];

               if (lastEnd == '&' || lastEnd == '^') {

                  closeScope()

                  continue
               }
            }
            else {

               closeScope()

               continue
            }
         }

         if (['[', '(', '{', '&', '^'].indexOf(current) > -1) {

            mode = PartType.scope
         }

         if (!shield) {

            if (current == '|') {

               mode = PartType.or
            }

            if (current == '$') {

               ++i
            }
         }

         if (mode === undefined) {

            if (['?', '>', '<', '+', '*'].indexOf(current) > -1) {

               if ((current == '<' || current == '>') && pattern[i + 1] == '!') {

                  mode = current + pattern[i + 1] == '<!' ? PartType.noPrev : PartType.noNext

                  i += 2
               }
               else {

                  mode = current == '<' ? PartType.prev : PartType.next

                  ++i
               }
            }
            else if (current == '(') {

               mode = PartType.logicScope
            }
            else {

               let string = ''

               let keywords: string[] = Rule.keyWords;

               for (let j = i; j < pattern.length; j++) {

                  string += pattern[j]

                  // add one character each iteration and look at which keywords start with this character set until there is one suitable variant left
                  keywords = keywords.filter(keyword => keyword.indexOf(string) == 0)

                  if (keywords.length == 1) {

                     let keyword: string = keywords[0] as string

                     let check = true

                     // compare the correctness of the sequence of characters in the pattern string and the keyword, starting from the last character where the previous check was stopped
                     for (++j; j - i < keyword.length; j++) {

                        if (pattern[j] != keyword[j - i]) {

                           check = false

                           break
                        }
                     }

                     if (check) {

                        switch (keyword) {
                           case 'string':
                              mode = PartType.string
                              break;

                           case 'text':
                              mode = PartType.text
                              break;

                           case 'number':
                              mode = PartType.number
                              break;

                           case 'boolean':
                              mode = PartType.boolean
                              break;

                           case 'rule':
                              mode = PartType.rule
                              break;

                           case 'iter':
                              mode = PartType.iter
                              break;

                           default:
                              break;
                        }


                        i = j

                        break
                     }
                     else {

                        keywords.pop()
                     }
                  }

                  // if none keyword was not defined, mean was define name of variable in which need put results of pattern checks 
                  if (keywords.length == 0) {

                     mode = PartType.var

                     break
                  }
               }
            }
         }

         switch (mode as any) {

            case PartType.keyword:

               let string = ''

               for (i; i < pattern.length; i++) {

                  current = pattern[i] as string

                  // if process word, add to string all, except this symbols, if they are not shielded or space
                  if ((Rule.keySymbols.indexOf(current) == -1 || (current == '$' || current == '|') && shield) && current != ' ') {

                     if (current == '/' && !shield) {

                        shield = true
                     }
                     else {

                        string += current

                        if (shield) {

                           shield = false
                        }
                     }
                  }
                  else {

                     // reduce iterator to process special symbol in next iteration of loop
                     --i

                     break
                  }
               }

               addInScope(new RulePartKeyword(string))

               break

            // if in pattern used $()
            case PartType.logicScope:

               let scope = new RulePartContent(mode, [])

               addInScope(scope)
               addScope(scope, EndsType.logicScope)

               break

            case PartType.prev:
            case PartType.next:
            case PartType.noPrev:
            case PartType.noNext:
            case PartType.oneMore:
            case PartType.zeroMore:
            case PartType.maybe:

               let currentScope = scopes[scopes.length - 1] as IContentablePart

               let content: RulePart[] = []

               // for < > <! and >! must added in content part of pattern placed before it special symbols
               if (mode as PartType != PartType.oneMore &&
                  mode as PartType != PartType.zeroMore &&
                  mode as PartType != PartType.maybe) {

                  content = [
                     currentScope.content[currentScope.content.length - 1] as IRulePart
                  ]

                  // delete added part of pattern from processed scope
                  currentScope.content.pop()
               }

               partObj = new RulePartContent(mode, content)

               addInScope(partObj)
               addScope(partObj as RulePartContent, current == '(' ? EndsType.scope : EndsType.part)

               if (current != '(') {

                  // reduce iterator for processed new part of pattern in new iteration
                  --i
               }

               break

            case PartType.or:

               let end = ends[ends.length - 1]

               if (end == EndsType.scope || end == EndsType.logicScope) {

                  let content: RulePart[] = [...(scopes[scopes.length - 1] as IContentablePart).content];

                  // add all processed parts of pattern in current scope and add they in new or scope, in array
                  partObj = new RulePartContent(mode, content)

                  // replace $() to or scope, finded previous scope
                  if (end == EndsType.logicScope) {

                     let prevScope = scopes[scopes.length - 2] as IContentablePart

                     prevScope.content.pop()
                     prevScope.content.push(partObj)
                  }
                  // else replace current scope's content to array with new or scope
                  else {

                     (scopes[scopes.length - 1] as IContentablePart).content = [partObj]
                  }

                  // make the or scope current 
                  scopes.push(partObj as RulePartContent)
               }

               //delete or_part to start new or_part
               if (end == EndsType.orPart) {

                  scopes.pop()
                  ends.pop()
               }

               // make num or_part
               let orPart = new RulePartContent(PartType.orPart, [])

               addInScope(orPart)
               addScope(orPart, EndsType.orPart)

               break

            case PartType.string:
            case PartType.number:
            case PartType.boolean:
            case PartType.text:

               partObj = new RulePart(mode)

               // when defined this mode for process, made current symbol is next, which placed after define this special words, that's why reduce iterator
               --i

               addInScope(partObj)

               break

            case PartType.rule:

               // for define rule must place (
               if (current == '(') {

                  let string = ''

                  let names: string[] = []

                  // start from next symbol add names of rules
                  ++i

                  for (i; i < pattern.length; i++) {

                     current = pattern[i] as string

                     if (current == '|') {

                        names.push(string)

                        string = ''

                        continue

                     }

                     if (current == ')') {

                        names.push(string)

                        break
                     }

                     string += current
                  }

                  if (names.length > 1) {

                     let content: RulePart[] = names.map(name => {
                        return new RulePartContent(PartType.orPart, [
                           new RulePartNamed(PartType.rule, name, [])
                        ])
                     })

                     partObj = new RulePartContent(PartType.or, content)
                  }
                  else {

                     partObj = new RulePartNamed(PartType.rule, names[0] as string, [])
                  }

                  addInScope(partObj)
               }

               break;

            case PartType.var:

               let varName = ''

               // define variable name
               for (i; i < pattern.length; i++) {

                  current = pattern[i] as string

                  if (current != '(' || current as string != ':') {

                     varName += current
                  }
                  else {

                     break
                  }
               }

               partObj = new RulePartNamed(PartType.var, varName, [])

               addInScope(partObj)
               addScope(partObj as RulePartNamed, current == ')' ? EndsType.scope : EndsType.part)

               break;

            case PartType.iter:

               if (current == ')' || current == ':') {

                  partObj = new RulePartContent(PartType.iter, [])

                  addInScope(partObj)
                  addScope(partObj as RulePartContent, current == ')' ? EndsType.scope : EndsType.part)
               }

               break

            case PartType.scope:

               partObj = new RulePartScope(PartType.scope, current, [])

               addInScope(partObj)
               addScope(partObj as RulePartScope, EndsType.scope)

               break;

            default:
               break;
         }
      }

      this.parts = mainScope.content

      function addScope(scope: IContentablePart, endMode: EndsType) {

         scopes.push(scope)
         ends.push(endMode)

         // consider breakets only if need close scope  
         if (endMode == EndsType.scope || endMode == EndsType.logicScope) {

            breakets.push(current)
         }
      }

      function addInScope(part: RulePart) {

         (scopes[scopes.length - 1] as IContentablePart).content.push(part)

         // close scope if in content current scope need add only next placed part of pattern
         if (ends[ends.length - 1] == EndsType.scope) {

            closeScope()
         }
      }

      function closeScope() {

         // delete or_part and or scope
         if (ends[ends.length - 1] == EndsType.orPart) {

            scopes.pop()
            scopes.pop()
            ends.pop()
            ends.pop()
         }

         // close scope if was finded corresponding to it close breaket
         if (ends[ends.length - 1] == EndsType.scope || ends[ends.length - 1] == EndsType.logicScope) {

            if (Rule.breakets.get(breakets[breakets.length - 1] as string) == current) {

               breakets.pop()
               scopes.pop()
               ends.pop()
            }
            else {

               //throw error
            }
         }

         // close all scopes, which need close after processing after it placed pattern parts
         if (ends[ends.length - 1] == EndsType.part) {

            scopes.pop()
            ends.pop()

            if (ends[ends.length - 1] == EndsType.part) {

               closeScope()
            }
         }
      }
   }

   /**
    * Method for creating match
    * 
    * @param {any}   data - object with match's info 
    * @returns {T}   match - object with variables, start and end indexes, and string
    */
   createMatch(data: any): T {

      let match: any = {};

      for (let item of data) {

         match[item] = data[item]
      }

      return match as T
   }
}