import RuleSet from 'src/libs/codeValidator/entities/RuleSet';
import Rule from '../../../libs/codeValidator/entities/Rule';
import type { Import, AsOperator, Export, While, For, IfElse, Class, FunctionDeclaration, FunctionExpretion, FunctionArrow, InterfaceDeclare, Operation, Any, EnumDeclare, Variable, LineComment, MultilineComment, ClassProperty, ClassMethod, InterfaceProperty, InterfaceMethod, FunctionParam, ObjectProperty, ObjectMethod, ArrayDeclare, ObjectDeclare, Rest, TernarOperator } from './js_lang';
import reserved from './js_reserved';

let scriptRules = [
   new Rule<Import>('import', 'import $name( { $iter( $rule(as) ) } | $rule(as) | $text ) from $source:$string'),
   new Rule<AsOperator>('as', '$importName:$text $?( as $localName:$text )'),
   new Rule<Export>('export', 'export $?($default(default)$value($text|$rule(operation))'),
   new Rule<While>('while', 'while($rule(operation)|$text){}'),
   new Rule<For>('for', 'for($?($rule(operation)|$text);$($rule(operation)|$text);$?$rule(operation)){}'),
   new Rule<IfElse>('ifElse', 'if($rule(operation)|$text){}$?($*(else$?(if($rule(operation)|$text)){}))'),
   new Rule<Class>('class', 'class $name($text){$*$rule(objectMethod|classProperty)}'),
   new Rule<FunctionDeclaration>('functionDeclaration', 'function $name($text)($iter($rule(functionParam))){}'),
   new Rule<FunctionExpretion>('functionExpretion', 'function($iter($rule(functionParam))){}'),
   new Rule<FunctionArrow>('functionArrow', '($iter($rule(functionParam)))=>{}'),
   new Rule<InterfaceDeclare>('interface', 'interface $name($text){$*$rule(interfaceMethod|interfaceProperty)}'),
   new Rule<Operation>('operation', '$rule(any)$?($(>|<|<=|>=|==|===|!=|+|-|/|*|**|/|/||&&)$<$rule(any))'),
   new Rule<Any>('any', '$text|$number|$boolean'),
   new Rule<EnumDeclare>('enum', 'enum $name($text){$iter($text$?(=$rule($any)))}'),
   new Rule<Variable>('variable', '$(var|let|const) $($name($text)$?(:$type($text))|$rule(rest))=$value($rule(any|operation))$(\n|;|\b)'),
   new Rule<LineComment>('lineComment', '\/\/\/\/$text\n'),
   new Rule<MultilineComment>('multilineComment', '\/\/*$text*\/\/'),
   new Rule<ClassProperty>('classProperty', '$?(static)$?(readonly|public|protected)$name($text)$?(:$text)$?(=$value($rule(any)))$(\n|;|\b)'),
   new Rule<ClassMethod>('classMethod', '$?(static)$?(readonly|public|protected)$name($text)($iter($rule(functionParam)))$?(:$text){}$(\n|;|\b})'),
   new Rule<InterfaceProperty>('interfaceProperty', '$?(readonly|public|protected)$name($text)$?(:$text)$(\n|;|\b})'),
   new Rule<InterfaceMethod>('interfaceMethod', '$?(readonly|public|protected)$name($text)($iter($rule(functionParam)))$?(:$text)$(\n|;|\b})'),
   new Rule<FunctionParam>('functionParam', '$text:$text$?(=$rule(any))'),
   new Rule<ObjectProperty>('objectProperty', '($text?(:$rule(any))'),
   new Rule<ObjectMethod>('objectMethod', '$name($text)($iter($rule(functionParam))){}'),
   new Rule<ArrayDeclare>('array', '[$iter($?(...)$rule(any))]'),
   new Rule<ObjectDeclare>('object', '{$iter($rule(any|objectProperty|objectMethod))}'),
   new Rule<Rest>('rest', '{$text$?(:$text)$?(=$rule(any)))}|[{$text$?(:$text)$?(=$rule(any)))]'),
   new Rule<TernarOperator>('ternarOperator', '$rule(any)?$rule(any):$rule(any)'),
]

export default new RuleSet(scriptRules, reserved)