import IMatchGroups from "../types/MatchGroups"

export default class MatchGroups implements IMatchGroups {
   keyword: string[] = []
   text: string[] = []
   string: string[] = []
   number: string[] = []
   boolean: string[] = []
   scope: string[] = []
   iter: string[] = []
   rules: any = {}
}