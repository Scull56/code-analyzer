export enum PartType {
   main,
   keyword,
   string,
   number,
   boolean,
   text,
   scope,
   or,
   orPart,
   rule,
   set,
   var,
   iter,
   tag,
   logicScope,
   prev,
   next,
   noPrev,
   noNext,
   oneMore,
   zeroMore,
   maybe,
   event
}

export interface IRulePart {
   readonly type: PartType
}

export interface IContentablePart {
   content: IRulePart[]
}

export interface INamedPart {
   name: string
}

export interface IBreaketPart {
   breaket: string
}

export interface ITagPart {
   attrValue: IRulePart[]
   tagContent: IRulePart[]
}

export interface ISetPart {
   exclude: boolean
   multiple: boolean
   rules: string[]
}