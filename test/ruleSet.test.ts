import Rule from '../src/entities/Rule';
import { describe, expect, test } from '@jest/globals';

let rulePartsExample = {}
let rule = new Rule('', '')


console.log(rule.parts)

test(
   "rule pattern's tokenization",
   () => expect(rule.parts).toEqual(rulePartsExample)
)



test(
   'rule set match',
   () => { }
)