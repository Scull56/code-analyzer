import { PartType } from "./RulePart"

export interface IMatch {
   type: PartType,
   start: number,
   end: number,
   value: string
}

export interface IScopeMatch {
   breaket: string
   content: IMatch[]
}

export interface ITagMatch {
   tagName: string
   attributes: Map<IMatch, IMatch>
   content: IMatch[]
}