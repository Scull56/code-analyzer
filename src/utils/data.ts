function removeArrElem(arr: any[], index: number): any[] {

   return [...arr.slice(0, index), ...arr.slice(++index)]
}

type Position = 'after' | 'before' | 'replace'

function addArrElem(arr: any[], index: number, pos: Position, elem: any[]): any[] {

   let res: any[] = [];

   if (pos == 'after') {
      res = [...arr.slice(0, ++index), ...elem, ...arr.slice(index)]
   }

   if (pos == 'before') {
      res = [...arr.slice(0, index), ...elem, ...arr.slice(index)]
   }

   if (pos == 'replace') {
      if (index == 0) {
         res = [...elem, ...arr.slice(1)]
      } else {
         res = [...arr.slice(0, index), ...elem, ...arr.slice(++index)]
      }
   }

   return res;
}

export {
   removeArrElem,
   addArrElem
}