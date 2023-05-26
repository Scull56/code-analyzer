import { PartType, type IRulePart, type IContentablePart, type INamedPart, type IBreaketPart } from '../types/RulePart';

export class RulePart implements IRulePart {
   type: PartType

   constructor(type: PartType) {
      this.type = type
   }
}

export class RulePartContent extends RulePart implements IContentablePart {
   content: RulePart[] = []

   constructor(type: PartType, content: RulePart[]) {
      super(type)

      this.content = content
   }
}

export class RulePartNamed extends RulePartContent implements INamedPart {
   name: string

   constructor(type: PartType, name: string, content: RulePart[]) {
      super(type, content)

      this.name = name
   }
}

export class RulePartScope extends RulePartContent implements IBreaketPart {
   breaket: string

   constructor(type: PartType, breaket: string, content: RulePart[]) {
      super(type, content)

      this.breaket = breaket
   }
}

export class RulePartKeyword extends RulePart implements INamedPart {
   name: string

   constructor(value: string) {
      super(PartType.keyword)

      this.name = value
   }
}