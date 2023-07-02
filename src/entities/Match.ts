import { IMatch, IScopeMatch, ITagMatch } from "../types/Match";
import { PartType } from "../types/RulePart";

export abstract class Match implements IMatch {
   type: PartType
   start: number
   end: number
   value: string

   constructor(type: PartType, start: number, end: number, value: string) {
      this.type = type
      this.start = start
      this.end = end
      this.value = value
   }
}

export class PrimitiveMatch extends Match {

   constructor(type: PartType, start: number, end: number, value: string) {

      super(type, start, end, value)
   }
}

export class ScopeMatch extends Match implements IScopeMatch {
   breaket: string;
   content: IMatch[];

   constructor(type: PartType.scope, start: number, end: number, value: string, breaket: string, content: IMatch[]) {

      super(type, start, end, value)

      this.breaket = breaket
      this.content = content
   }
}

export class TagMatch extends Match implements ITagMatch {
   tagName: string;
   attributes: Map<IMatch, IMatch>;
   content: IMatch[];

   constructor(type: PartType.tag, start: number, end: number, value: string, tagName: string, attributes: Map<IMatch, IMatch>, content: IMatch[]) {

      super(type, start, end, value)

      this.tagName = tagName;
      this.attributes = attributes;
      this.content = content;
   }
}