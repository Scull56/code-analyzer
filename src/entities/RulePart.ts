import { PartType, type IRulePart, type IContentablePart, type INamedPart, type IBreaketPart, ITagPart } from '../types/RulePart';

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

type NamedContanteblePartType = PartType.var | PartType.rule

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
   openBreaket: string
   closeBreaket: string
   endCloseBreaket: string
   tagName: IRulePart[]
   attrValue: IRulePart[]
   content: IRulePart[]

   constructor(openBreaket: string, closeBreaket: string, endCloseBreaket: string, tagName: IRulePart[], attrValue: IRulePart[], content: IRulePart[]) {
      super(PartType.tag)

      this.content = content
      this.openBreaket = openBreaket
      this.attrValue = attrValue
      this.closeBreaket = closeBreaket
      this.endCloseBreaket = endCloseBreaket
      this.tagName = tagName
   }
}