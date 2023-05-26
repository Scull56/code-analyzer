import type ReservedList from "src/libs/codeValidator/types/ReservedList"

let reserved: ReservedList = {
   simpleTypes: ['boolean', 'byte', 'char', 'double', 'float', 'number', 'long', 'short'],
   complexTypes: ['function', 'class', 'interface', 'enum'],
   definers: ['let', 'var', 'const'],
   mofifyers: ['private', 'protected', 'public', 'static'],
   keyWords: ['abstract', 'import', 'new', 'yeld', 'from', 'default', 'export', 'extends', 'final', 'implements', 'super', 'throw', 'instance of'],
   booleans: ['true', 'false'],
   iterators: [',', '.', '?.', '|'],
   assignmentOperations: [':', '='],
   mathOperators: ['+', '-', '/', '*', '%', '**'],
   compareOperators: ['>', '<', '==', '===', '||', '??', '>=', '<='],
   numbers: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
   decimalSeparator: '.',
   keySymbols: [';', ',', '.', '?.', '|', '{', '(', '[', ':', ';', '}', ')', '],', '>', '<', '==', '===', '||', '??', '>=', '<=', '=', '+', '-', '/', '*', '%', '**', ' ', '"', "'", '`', '/', '\n'],
   endSymbols: [';'],
   stringDefiners: ['"', "'", '`']
}

export default reserved