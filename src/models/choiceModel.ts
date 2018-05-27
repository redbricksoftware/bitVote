export class ChoiceModel {
    bitVoteID: number;
    choiceAIdx: number;
    choiceBIdx: number;
    choiceAOrB: ChoiceAOrBEnum = ChoiceAOrBEnum.UNKNOWN;
}

export enum ChoiceAOrBEnum {
    'A' = 1,
    'B' = 2,
    'UNKNOWN' = -1
}