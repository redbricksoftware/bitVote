import {CategoryModel} from './categoryModel';
import {ABComparisonModel} from './abComparisonModel';
import {ChoiceAOrBEnum, ChoiceModel} from './choiceModel';
import {BitCalcDA} from '../dataAccess/bitCalcDA';
import {BitVoteConfigDA} from '../dataAccess/bitVoteConfigDA';
import {BitVoteModel} from './bitVoteModel';

export class UserVotingData {
    id: string;
    bitVoteID: string;
    categoryMatrix: string[][] = [];
    categoryCount: number = 0;
    matrixComplete: boolean = false;

    public initCategoryMatrix(categories: Array<CategoryModel>) {
        this.categoryCount = categories.length;

        for (let i = 0; i < this.categoryCount; i++) {
            let subCategory: Array<string> = [];
            for (let y = 0; y < this.categoryCount; y++) {
                if (i == y) {
                    subCategory.push('x');
                } else {
                    subCategory.push('?');
                }
            }
            this.categoryMatrix.push(subCategory);
        }

    }

    public getQuestion(): ABComparisonModel {

        if (this.matrixComplete) {
            return null;
        }

        let xIdx = -1;
        let yIdx = -1;

        let abComparison: ABComparisonModel = new ABComparisonModel();

        while (yIdx == xIdx || this.categoryMatrix[xIdx][yIdx] != '?') {
            let xIdx = this.getRandomInt(this.categoryCount);
            let yIdx = this.getRandomInt(this.categoryCount);

            //abComparison.aVal = this.categoryMatrix[xIdx][xIdx];
            abComparison.aIdx = xIdx;
            //abComparison.bVal = this.categoryMatrix[xIdx][yIdx];
            abComparison.bIdx = yIdx;
        }


        let bitVoteConfigDA: BitVoteConfigDA = new BitVoteConfigDA();

        let bitVote: BitVoteModel = bitVoteConfigDA.getBitVoteByID(this.bitVoteID);
        abComparison.aVal = bitVote.categories[abComparison.aIdx];
        abComparison.bVal = bitVote.categories[abComparison.bIdx];

        return abComparison;
    }

    //TODO: This
    public answerQuestion(choice: ChoiceModel) {

        if (choice.choiceAOrB == ChoiceAOrBEnum.A) {
            //row(x) is better than column(y)
            //anything that column(y) is better than, row(x) is also better than
            this.categoryMatrix[choice.choiceAIdx][choice.choiceBIdx] = '>';
            this.categoryMatrix[choice.choiceBIdx][choice.choiceAIdx] = '<';
            //this.categoryMatrix[xIdx][yIdx] = '>';
            //this.categoryMatrix[yIdx][xIdx] = '<';

        } else {
            //column(y) is better than row(x)
            //anything that row(x) is better than, column(y) is also better than
            this.categoryMatrix[choice.choiceAIdx][choice.choiceBIdx] = '<';
            this.categoryMatrix[choice.choiceBIdx][choice.choiceAIdx] = '>';
            //this.categoryMatrix[xIdx][yIdx] = '<';
            //this.categoryMatrix[yIdx][xIdx] = '>';

        }

        this.automateRelationalRanking();
    }


    private questionsRemain(): boolean {
        for (let x = 0; x < this.categoryCount; x++) {
            for (let y = 0; y < this.categoryCount; y++) {
                if (this.categoryMatrix[x][y] == '?') {
                    return true;
                }
            }
        }
        this.matrixComplete = true;
        return false;
    };

    private getBetterThanByRowIdx(rowidx: number) {
        let betterThanArray = [];

        for (let i = 0; i < this.categoryCount; i++) {
            if (this.categoryMatrix[rowidx][i] == '>') {
                betterThanArray.push(i);
            }
        }

        return betterThanArray;
    };

    private getLessThanByRowIdx(rowidx: number) {
        let lessThanArray = [];

        for (let i = 0; i < this.categoryCount; i++) {
            if (this.categoryMatrix[rowidx][i] == '<') {
                lessThanArray.push(i);
            }
        }

        return lessThanArray;
    };

    private automateRelationalRanking() {


        for (let x = 0; x < this.categoryCount; x++) {
            let betterThanArray = this.getBetterThanByRowIdx(x);
            let lessThanArray = this.getLessThanByRowIdx(x);

            //console.log('better than');
            for (let i of betterThanArray) {

                let betterThanInner = this.getBetterThanByRowIdx(i);

                for (let betterThan of betterThanInner) {
                    this.categoryMatrix[x][betterThan] = '>';
                    this.categoryMatrix[betterThan][x] = '<';
                }

                //console.log(i);
            }

            for (let i of lessThanArray) {

                let lessThanInner = this.getLessThanByRowIdx(i);

                for (let lessThan of lessThanInner) {
                    this.categoryMatrix[lessThan][x] = '>';
                    this.categoryMatrix[x][lessThan] = '<';
                }
            }


        }


    };

    private getRandomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
    };

}