import SyntaxItem from '../../src/types/SyntaxItem';

export class Variable extends SyntaxItem {
   name: string;
   value: string;
   type: string;
}

export class Import extends SyntaxItem {
   name: AsOperator | string;
   source: string;
}

export class AsOperator extends SyntaxItem {
   localName: string;
   importName: string;
}

export class Export extends SyntaxItem {
   name: string;
   default: string | undefined;
}

export class ExportDefault extends SyntaxItem {
   name: string;
}

export class Type extends SyntaxItem {
   name: string;
   value: string;
}

export class While extends SyntaxItem {

}

export class For extends SyntaxItem {

}

export class IfElse extends SyntaxItem {

}

export class Class extends SyntaxItem {

}

export class FunctionDeclare extends SyntaxItem {

}

export class InterfaceDeclare extends SyntaxItem {

}

export class EnumDeclare extends SyntaxItem {

}

export class Operation extends SyntaxItem {

}

export class LineComment extends SyntaxItem {

}

export class MultilineComment extends SyntaxItem {

}

export class FunctionDeclaration extends SyntaxItem {

}

export class FunctionExpretion extends SyntaxItem {

}

export class FunctionArrow extends SyntaxItem {

}

export class ObjectProperty extends SyntaxItem {

}

export class ObjectMethod extends SyntaxItem {

}

export class ClassProperty extends SyntaxItem {

}

export class ClassMethod extends SyntaxItem {

}

export class FunctionParam extends SyntaxItem {

}

export class InterfaceProperty extends SyntaxItem {

}

export class InterfaceMethod extends SyntaxItem {

}

export class ArrayDeclare extends SyntaxItem {

}

export class ObjectDeclare extends SyntaxItem {

}

export class Rest extends SyntaxItem {

}

export class TernarOperator extends SyntaxItem {

}

export class Any extends SyntaxItem {

}