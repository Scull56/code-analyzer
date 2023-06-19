/**
 * Object with reserved symbols and words
 * 
 * @prop {string[]} simpleTypes - keywords for define simple types
 * @prop {string[]} complexTypes - keywords for define complex types
 * @prop {string[]} definers - keywords for define untyped variables (for example let, var, const)
 * @prop {string[]} mofifyers - keywords for define access modifiers
 * @prop {string[]} keyWords - any keywords
 * @prop {string[]} booleans - keywords for define boolean primitives
 * @prop {string[]} iterator - keysymbol which use for separation of enum members
 * @prop {string[]} assignment - keysymbols for assigment values
 * @prop {string[]} mathOperators - keysymbols for math operators
 * @prop {string[]} compare - keysymbols for math compare 
 * @prop {string[]} numbers - keysymbols for number primitive
 * @prop {string[]} decimalSeparator - keysymbol of decimal separator
 * @prop {string[]} stringDefiners - keysymbols for define string primitive
 * @prop {string[]} keySymbols - all key symbols
 * @prop {string[]} endSymbols - all key words
 */
export default interface ReservedList {
   simpleTypes: string[]
   complexTypes: string[]
   definers: string[]
   mofifyers: string[]
   keyWords: string[]
   booleans: string[]
   iterator: string
   assignment: string[]
   mathOperators: string[]
   compare: string[]
   numbers: string[]
   decimalSeparator: string
   stringDefiners: string[]
   keySymbols: string[]
   endSymbols: string[]
   spaces?: number
}