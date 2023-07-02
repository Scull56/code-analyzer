import { IMatch } from "./Match"

export default interface ISyntaxItem {
   matches: IMatch[]
   string: string
   start: number
   end: number
}