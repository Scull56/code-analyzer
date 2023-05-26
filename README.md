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