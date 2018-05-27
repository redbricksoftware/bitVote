import {CategoryModel} from './models/categoryModel';
import {TimeKeeper} from './utils/timeKeeper';
import {ABComparisonModel} from './models/abComparisonModel';

export class BitCalc {
    debug: boolean = false;
    timeKeeper: TimeKeeper;

    constructor(timeKeeper: TimeKeeper, debug: boolean) {
        this.timeKeeper = timeKeeper;
        if (debug) {
            this.debug = debug;
        }
    }

    debugPopulateCategories() {
        let categories: Array<CategoryModel> = [];
        for (let i = 0; i < 7; i++) {
            categories.push(new CategoryModel(i.toString()));
        }
        return categories;
    }

    getABComparison(bitVoteID, userID): ABComparisonModel {
        let abComparison: ABComparisonModel = new ABComparisonModel();

        let categories: Array<CategoryModel> = this.debug ? this.debugPopulateCategories() : [];

        abComparison.aVal = 'A';
        abComparison.bVal = 'B';

        return abComparison;
    }

    run() {
        let timerName = this.timeKeeper.startTimer('totalRun');

        let categories: Array<CategoryModel> = [];

        for (let i = 0; i < 7; i++) {
            categories.push(new CategoryModel(i.toString()));
        }

        let categoryCount = categories.length;

        //console.log(categories);

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

        //console.log(categoryMatrix);

        const readline = require('readline');

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        let iterations = 1;

        while (this.questionsRemain(categoryMatrix, categoryCount)) {

            //Ask random question:
            let xIdx = this.getRandomInt(categoryCount);
            let yIdx = this.getRandomInt(categoryCount);

            //if x != y and there is no relationship defined
            if (yIdx != xIdx && categoryMatrix[xIdx][yIdx] == '?') {

                //console.log('Which is better (1): ' + JSON.stringify(categories[xIdx]) + ' or (2): ' + JSON.stringify(categories [yIdx]) + '?');
                let better = (this.getRandomInt(2) + 1).toString();

                if (better == '1') {
                    //row(x) is better than column(y)
                    //anything that column(y) is better than, row(x) is also better than
                    categoryMatrix[xIdx][yIdx] = '>';
                    categoryMatrix[yIdx][xIdx] = '<';

                } else {
                    //column(y) is better than row(x)
                    //anything that row(x) is better than, column(y) is also better than
                    categoryMatrix[xIdx][yIdx] = '<';
                    categoryMatrix[yIdx][xIdx] = '>';

                }

                this.automateRelationalRanking(categoryMatrix, categoryCount);

                iterations++;
            }
        }

        console.log(categoryMatrix);
        //console.log('max iterations: ' + maxIterations + '. Iterations: ' + iterations + '. Pct Savings: ' + Math.round((1 - (iterations / maxIterations)) * 10000) / 100 + '%');
        console.log('Iterations: ' + iterations);


        this.timeKeeper.stopTimer(timerName);
        this.timeKeeper.timerReport();

    }

    automateRelationalRanking(categoryMatrix, categoryCount) {


        for (let x = 0; x < categoryCount; x++) {
            let betterThanArray = this.getBetterThanByRowIdx(categoryMatrix, categoryCount, x);
            let lessThanArray = this.getLessThanByRowIdx(categoryMatrix, categoryCount, x);

            //console.log('better than');
            for (let i of betterThanArray) {

                let betterThanInner = this.getBetterThanByRowIdx(categoryMatrix, categoryCount, i);

                for (let betterThan of betterThanInner) {
                    categoryMatrix[x][betterThan] = '>';
                    categoryMatrix[betterThan][x] = '<';
                }

                //console.log(i);
            }

            for (let i of lessThanArray) {

                let lessThanInner = this.getLessThanByRowIdx(categoryMatrix, categoryCount, i);

                for (let lessThan of lessThanInner) {
                    categoryMatrix[lessThan][x] = '>';
                    categoryMatrix[x][lessThan] = '<';
                }

                //console.log(i);
            }


        }


    };

    questionsRemain(categoryMatrix, categoryCount): boolean {
        for (let x = 0; x < categoryCount; x++) {
            for (let y = 0; y < categoryCount; y++) {
                if (categoryMatrix[x][y] == '?') {
                    return true;
                }
            }
        }
        return false;
    };

    getBetterThanByRowIdx(categoryMatrix, categoryCount, rowidx: number) {
        let betterThanArray = [];

        for (let i = 0; i < categoryCount; i++) {
            if (categoryMatrix[rowidx][i] == '>') {
                betterThanArray.push(i);
            }
        }

        return betterThanArray;
    };

    getLessThanByRowIdx(categoryMatrix, categoryCount, rowidx: number) {
        let lessThanArray = [];

        for (let i = 0; i < categoryCount; i++) {
            if (categoryMatrix[rowidx][i] == '<') {
                lessThanArray.push(i);
            }
        }

        return lessThanArray;
    };

    getRandomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
    };

}

