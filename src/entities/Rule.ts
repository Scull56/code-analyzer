import { RulePartPrimitive, RulePartNamed, RulePartScope, RulePartContent, RulePartKeyword, RulePartTag } from "./RulePart";
import { PartType, type IContentablePart, IRulePart } from '../types/RulePart';
import SyntaxItem from "../types/SyntaxItem";

enum EndType {
   scope,
   logicScope,
   part,
   or,
   orPart,
   comma
}

// * добавить спец символ пустого пространства

/**
 * Rule accorging to which will checked a character sequence
 * 
 * @prop {string}       name - string with an identifyer for use in $rule() construction
 * @prop {IRulePart[]}   parts - transformed pattern string into rule's parts for processing code
 */
export default class Rule<T extends SyntaxItem>{
   name: string;
   parts: IRulePart[] = [];

   public static breakets: Map<string, string> = new Map([
      ['{', '}'],
      ['[', ']'],
      ['(', ')'],
      // tabs
      ['&', '#']
   ])

   private static keySymbols = ['(', ')', '{', '}', '[', ']', '$', '|', '&', '#', ',', ' ']

   private static openKeySymbols = ['[', '(', '{', '&']

   private static closeKeySymbols = [']', ')', '}', '#']

   private static keyWords = ['string', 'text', 'number', 'boolean', 'rule', 'iter', 'tag', 'set', 'event']

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
      let ends: EndType[] = [EndType.scope]
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

      let currentScope: IContentablePart

      // created objects of scopes
      let partObj: IRulePart

      for (i; i < pattern.length; i++) {

         // default preocess symbol how start of keyword
         mode = PartType.keyword

         current = pattern[i] as string

         if (current == ' ') {

            continue
         }

         if (!shield) {

            if (current == '/') {

               shield = true

               continue
            }

            if (Rule.closeKeySymbols.indexOf(current) > -1) {

               closeScope()

               continue
            }

            if (Rule.openKeySymbols.indexOf(current) > -1) {

               mode = PartType.scope
            }

            if (current == ',') {

               if (scopes[scopes.length - 1] instanceof RulePartTag) {

                  mode = PartType.tag
               }
            }

            if (current == '|') {

               mode = PartType.or
            }

            if (current == '$') {

               ++i

               current = pattern[i] as string
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

                              case 'tag':
                                 mode = PartType.tag
                                 break;

                              case 'set':
                                 mode = PartType.set
                                 break;

                              case 'event':
                                 mode = PartType.event
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
         }

         switch (mode as any) {

            case PartType.keyword:

               let string = ''

               for (i; i < pattern.length; i++) {

                  current = pattern[i] as string

                  // if process word, add to string all, except this symbols, if they are not shielded or space
                  if ((shield || Rule.keySymbols.indexOf(current) == -1)) {

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

                     current = pattern[i] as string

                     break
                  }
               }

               addInScope(new RulePartKeyword(string))

               break

            case PartType.logicScope:

               let scope = new RulePartContent(PartType.logicScope, [])

               addInScope(scope)
               addScope(scope, EndType.logicScope)

               break

            case PartType.prev:
            case PartType.next:
            case PartType.noPrev:
            case PartType.noNext:
            case PartType.oneMore:
            case PartType.zeroMore:
            case PartType.maybe:

               currentScope = scopes[scopes.length - 1] as IContentablePart

               let partContent: IRulePart[] = []

               // for < > <! and >! must added in content part of pattern placed before it special symbols
               if (mode as PartType != PartType.oneMore &&
                  mode as PartType != PartType.zeroMore &&
                  mode as PartType != PartType.maybe) {

                  partContent = [
                     currentScope.content[currentScope.content.length - 1] as IRulePart
                  ]

                  currentScope.content.pop()
               }

               type t =
                  PartType.prev |
                  PartType.next |
                  PartType.noPrev |
                  PartType.noNext |
                  PartType.oneMore |
                  PartType.zeroMore |
                  PartType.maybe

               partObj = new RulePartContent(mode as t, partContent)

               addInScope(partObj)
               addScope(partObj as RulePartContent, current == '(' ? EndType.scope : EndType.part)

               if (current != '(') {

                  // reduce iterator for processed new part of pattern in new iteration
                  --i
               }

               break

            case PartType.or:

               let end = ends[ends.length - 1]

               if (end == EndType.scope || end == EndType.logicScope) {

                  let content: IRulePart[] = [...(scopes[scopes.length - 1] as IContentablePart).content];

                  // add all processed parts of pattern in current scope and add they in new or scope, in array
                  partObj = new RulePartContent(PartType.or, content)

                  // replace $() to or scope, finded previous scope
                  if (end == EndType.logicScope) {

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
               if (end == EndType.orPart) {

                  scopes.pop()
                  ends.pop()
               }

               // make num or_part
               let orPart = new RulePartContent(PartType.orPart, [])

               addInScope(orPart)
               addScope(orPart, EndType.orPart)

               break

            case PartType.string:
            case PartType.number:
            case PartType.boolean:
            case PartType.text:

               partObj = new RulePartPrimitive(mode as PartType.string | PartType.number | PartType.boolean | PartType.text)

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

                     let content: IRulePart[] = names.map(name => {
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

            case PartType.set:

               break

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
               addScope(partObj as RulePartNamed, current == ')' ? EndType.scope : EndType.part)

               break;

            case PartType.iter:

               if (current == '(' || current == ':') {

                  partObj = new RulePartContent(PartType.iter, [])

                  addInScope(partObj)
                  addScope(partObj as RulePartContent, current == '(' ? EndType.scope : EndType.part)
               }

               break

            case PartType.scope:

               partObj = new RulePartScope(current, [])

               addInScope(partObj)
               addScope(partObj as RulePartScope, EndType.scope)

               break;

            case PartType.tag:

               let currentPartScope = scopes[scopes.length - 1] as RulePartTag

               // if current tag part already was processed, continue process tagName, attrValue and tagContent
               if (currentPartScope.type == PartType.tag) {

                  let tagPartContent: IRulePart[] = []

                  let tagPart: IContentablePart = {
                     content: tagPartContent
                  }

                  if (currentPartScope.attrValue.length == 0) {

                     currentPartScope.attrValue = tagPartContent
                  }
                  else if (currentPartScope.content.length == 0) {

                     currentPartScope.content = tagPartContent
                  }
                  else {

                     // throw error
                  }

                  addScope(tagPart, EndType.comma)
               }
               // else extract from string breakets of tag
               else if (current == '(') {

                  partObj = new RulePartTag([], [])

                  addInScope(partObj)
                  addScope(partObj as RulePartContent, EndType.scope)
               }
               else {
                  // throw error
               }

               break;

            case PartType.event:

               break
            default:
               break
         }
      }

      this.parts = mainScope.content

      function addScope(scope: IContentablePart, endMode: EndType) {

         // delete prev comma part
         if (endMode == EndType.comma && ends[ends.length - 1] == EndType.comma) {

            scopes.pop()
            ends.pop()
         }

         scopes.push(scope)
         ends.push(endMode)

         // consider breakets only if need close scope  
         if (endMode == EndType.scope || endMode == EndType.logicScope) {

            breakets.push(current)
         }
      }

      function addInScope(part: IRulePart) {

         (scopes[scopes.length - 1] as IContentablePart).content.push(part)

         // close scope if in content current scope need add only next placed part of pattern

         if (ends[ends.length - 1] == EndType.part) {

            closeScope()
         }
      }

      function closeScope() {

         switch (ends[ends.length - 1]) {

            // delete or_part and or scope, comma and it's container
            case EndType.comma:
            case EndType.orPart:

               scopes.pop()
               scopes.pop()
               ends.pop()
               ends.pop()

               break

            // close scope if was finded corresponding to it close breaket
            case EndType.scope:
            case EndType.logicScope:

               if (Rule.breakets.get(breakets[breakets.length - 1] as string) == current) {

                  breakets.pop()
                  scopes.pop()
                  ends.pop()
               }
               else {

                  //throw error
               }

               break

            // close all scopes, which need close after processing after it placed pattern parts
            case EndType.part:

               scopes.pop()
               ends.pop()

               if (ends[ends.length - 1] == EndType.part) {

                  closeScope()
               }

               break

            default:
               break
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