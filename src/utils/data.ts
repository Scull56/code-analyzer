function removeArrElem(arr: any[], index: number): any[] {

   if (index > -1) {

      return [...arr.slice(0, index), ...arr.slice(++index)]
   }
}

type Position = 'after' | 'before' | 'replace'

function addArrElem(arr: any[], index: number, pos: Position, elem: any[]): any[] {

   if (pos == 'after') {
      return [...arr.slice(0, ++index), ...elem, ...arr.slice(index)]
   }

   if (pos == 'before') {
      return [...arr.slice(0, index), ...elem, ...arr.slice(index)]
   }

   if (pos == 'replace') {
      if (index == 0) {
         return [...elem, ...arr.slice(1)]
      } else {
         return [...arr.slice(0, index), ...elem, ...arr.slice(++index)]
      }
   }
}

function unifyArr(arr: any[], filter: (elem, index, arr) => boolean): any[] {

   return [...new Set(arr.filter(filter))]
}

export {
   removeArrElem,
   addArrElem,
   unifyArr
}