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
   type: PartType
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