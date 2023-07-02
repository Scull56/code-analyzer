import type { IRulePart, IContentablePart, INamedPart, IBreaketPart, ITagPart, ISetPart } from '../types/RulePart';
import { PartType } from '../types/RulePart';

export abstract class RulePart implements IRulePart {
   type: PartType

   constructor(type: PartType) {
      this.type = type
   }
}

type PrimitivePartType = PartType.string | PartType.text | PartType.boolean | PartType.number

export class RulePartPrimitive extends RulePart {
   constructor(type: PrimitivePartType) {
      super(type)
   }
}

type ContentablePartType =
   PartType.iter |
   PartType.logicScope |
   PartType.main |
   PartType.maybe |
   PartType.next |
   PartType.noNext |
   PartType.noPrev |
   PartType.prev |
   PartType.oneMore |
   PartType.or |
   PartType.orPart |
   PartType.zeroMore
export class RulePartContent extends RulePart implements IContentablePart {
   content: RulePart[]

   constructor(type: ContentablePartType, content: RulePart[]) {
      super(type)

      this.content = content
   }
}

type NamedContanteblePartType = PartType.var | PartType.rule | PartType.event

export class RulePartNamed extends RulePart implements INamedPart, IContentablePart {
   name: string
   content: RulePart[]

   constructor(type: NamedContanteblePartType, name: string, content: RulePart[]) {
      super(type)

      this.name = name
      this.content = content
   }
}

export class RulePartScope extends RulePart implements IBreaketPart {
   breaket: string
   content: RulePart[]

   constructor(breaket: string, content: RulePart[]) {
      super(PartType.scope)

      this.breaket = breaket
      this.content = content
   }
}

export class RulePartKeyword extends RulePart implements INamedPart {
   name: string

   constructor(value: string) {
      super(PartType.keyword)

      this.name = value
   }
}

export class RulePartTag extends RulePart implements ITagPart, IContentablePart {
   attrValue: IRulePart[]
   tagContent: IRulePart[]
   content: IRulePart[] = []

   constructor(attrValue: IRulePart[], tagContent: IRulePart[]) {
      super(PartType.tag)

      this.tagContent = tagContent
      this.attrValue = attrValue
   }
}

export class RulePartSet extends RulePart implements ISetPart, IContentablePart {
   exclude: boolean
   multiple: boolean
   rules: string[]
   content: IRulePart[] = []

   constructor(exclude: boolean, multiple: boolean, rules: string[]) {
      super(PartType.set)

      this.exclude = exclude
      this.multiple = multiple
      this.rules = rules
   }
}