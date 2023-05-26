import Rule from '../../libs/codeValidator/entities/Rule';

let cssRules = [
   new Rule<Css>('css', '$($text$?(>|\s|*|+|$text|.$text|#$text|[$text$?(~|\||\$|^|*)=$text]|:$text|::$text)$?(,))*{$($text:)*}', () => { })
]