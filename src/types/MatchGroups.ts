import Match from "./Match"

export default interface MatchGroups {
   keyword: Match[]
   text: Match[]
   string: Match[]
   number: Match[]
   boolean: Match[]
   scope: Match[]
   iter: Match[]
   rules: object
}