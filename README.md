# Universal code parser (on development stage)
Library for creating a parser for any programming language

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

## Example
```
import {Rule, RuleSet, Analyzer} from 'code-analyzer';

let code = '...' // string with some code

let set = new RuleSet([
   new Rule(...),
   new Rule(...),
   ...
])

let analyzer = new Analyzer(set)

let matches = analyzer.match(code)
```

## Syntax of rule's pattern

```
$tag(
   $string | {$text}, //содержимое атрибута
   $rule(tag) | $rule(comment) | $text //содержимое тега
)

<? xml $*($text = $string) ?>

/<!-- $text --!/>

new Rule('phpDeclare', '<?php | <?')
...
new Rule('phpDeclareClose', '?>')

let analyzer = new Analyzer()
let tsSet = new RuleSet()

analyzer.on('lang', (match) => {
   if (match.value == 'ts'){
      let index = analyzer.sets.findIndex(set => set.name == 'code')
      analyzer.sets[index] = tsSet
   }
})

analyzer.match(code)

$tag(script, $string, $set.js())

<script $?(lang = $event.lang($string))> $set.code*() </script>

$tag( $string | {$set.code()}, $rule(tag) | $rule(comment) | $text | { $set.code(variable, ternar, function) } )

<style $?(lang = $string)> $*($set.style()) </style>

$set.code() // вернуть любое подходящее правило
$set.code!(function) // вернуть любое подходящее правило, исключая function
$set.code*() // возвращать подходящие правила до тех пор, пока не будет найдено подходящего правила
$set.code*!(function) // возвращать подходящие правила, кроме function, до тех пор, пока не будет найдено подходящего правила

$event.lang($string) // когда будет получено значение данной строки, вызвать событие lang и его коллбэк
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