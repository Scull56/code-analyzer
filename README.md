# Universal code parser
Library for creating a parser for any programming language

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

## Example
```
import {Rule, RuleSet} from 'code-analyzer';

let code = '...' // string with some code

let parser = new RuleSet([
   new Rule(...),
   new Rule(...),
   ...
])

let matches = parser.match(code)
```

## Syntax of rule's pattern

```
$tag(
<, - открывающая скобка
>, - закрывающая скобка открывающего тега
//>, - закрывающая скобка закрывающего тега
$text \s, - текст, который принимается за название тега
$string | {$text}, - содержимое атрибута
$*( $rule(tag) | $rule(comment) | $text) - содержимое тега
)
```

```
<$text $?(
   \s $*(
      $text $?( = $string | = {$text} )
   )
)
$( 
   > $*( $rule(tag) | $text ) <$text//> ) |
   //>
)
```