import {ABComparisonModel} from '../models/abComparisonModel';
import {ChoiceModel} from '../models/choiceModel';
import {CategoryDA} from '../bak/categoryDA';
import {CategoryModel} from '../models/categoryModel';
import {BitVoteModel} from '../models/bitVoteModel';

export class BitCalcDA {
    //categoryDA: CategoryDA = new CategoryDA();
    //bitVoteData: Array<BitVoteModel> = require('../../sampledata/bitVoteConfigData.json');

    public vote(userID: number, voteID: number, choice: ChoiceModel) {

    }


    private populateCategoryMatrix(categories: Array<CategoryModel>) {
        let categoryCount = categories.length;

        let categoryMatrix: string[][] = [];

        for (let i = 0; i < categoryCount; i++) {
            let subCategory: Array<string> = [];
            for (let y = 0; y < categoryCount; y++) {
                if (i == y) {
                    subCategory.push('x');
                } else {
                    subCategory.push('?');
                }
            }
            categoryMatrix.push(subCategory);
        }

        return categoryMatrix;
    }

    //TODO: wrap this up and check that its not complete
    public getQuestion(userID: number, voteID: number): ABComparisonModel {
        let categories = this.categoryDA.getCategoriesByBitVoteID(1);
        let categoryCount = categories.length;

        let categoryMatrix: string[][] = this.populateCategoryMatrix(categories);

        console.log(categoryMatrix);

        let abComparison: ABComparisonModel = new ABComparisonModel();

        let questionFound: boolean = false;

        while (!questionFound) {
            let xIdx = this.getRandomInt(categoryCount);
            let yIdx = this.getRandomInt(categoryCount);

            console.log('x' + xIdx + '. y:' + yIdx);
            console.log(categoryMatrix);

            //if !questionFound!= y and there is no relationship defined
            if (yIdx != xIdx && categoryMatrix[xIdx][yIdx] == '?') {
                questionFound = true;
                abComparison.aVal = categories[xIdx].category;
                abComparison.bVal = categories[yIdx].category;
            }


        }

        return abComparison;

    }

    getRandomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
    };
}