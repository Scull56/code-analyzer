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
   maybe
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
   openBreaket: string
   closeBreaket: string
   endCloseBreaket: string
   tagName: IRulePart[]
   attrValue: IRulePart[]
}