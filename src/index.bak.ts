import {CategoryModel} from './models/categoryModel';
import {TimeKeeper} from './utils/timeKeeper';


let debug: boolean = true;
const timeKeeper: TimeKeeper = new TimeKeeper(debug);


let timerName = timeKeeper.startTimer('totalRun');


let categories: Array<CategoryModel> = [];

let maxIterations = 1;
for (let i = 0; i < 7; i++) {
    categories.push(new CategoryModel(i.toString()));
    maxIterations = maxIterations * (i + 1);
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

let rand: number = -1;

const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let iterations = 1;

let questionsRemain = function (): boolean {
    for (let x = 0; x < categoryCount; x++) {
        for (let y = 0; y < categoryCount; y++) {
            if (categoryMatrix[x][y] == '?') {
                return true;
            }
        }
    }
    return false;
};

function automateRelationalRanking() {


    for (let x = 0; x < categoryCount; x++) {
        let betterThanArray = getBetterThanByRowIdx(x);
        let lessThanArray = getLessThanByRowIdx(x);

        //console.log('better than');
        for (let i of betterThanArray) {

            let betterThanInner = getBetterThanByRowIdx(i);

            for (let betterThan of betterThanInner) {
                categoryMatrix[x][betterThan] = '>';
                categoryMatrix[betterThan][x] = '<';
            }

            //console.log(i);
        }

        for (let i of lessThanArray) {

            let lessThanInner = getLessThanByRowIdx(i);

            for (let lessThan of lessThanInner) {
                categoryMatrix[lessThan][x] = '>';
                categoryMatrix[x][lessThan] = '<';
            }

            //console.log(i);
        }


    }


}

function getBetterThanByRowIdx(rowidx: number) {
    let betterThanArray = [];

    for (let i = 0; i < categoryCount; i++) {
        if (categoryMatrix[rowidx][i] == '>') {
            betterThanArray.push(i);
        }
    }

    return betterThanArray;
}

function getLessThanByRowIdx(rowidx: number) {
    let lessThanArray = [];

    for (let i = 0; i < categoryCount; i++) {
        if (categoryMatrix[rowidx][i] == '<') {
            lessThanArray.push(i);
        }
    }

    return lessThanArray;
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}


while (questionsRemain()) {

    //Ask random question:
    let xIdx = getRandomInt(categoryCount);
    let yIdx = getRandomInt(categoryCount);

    //if x != y and there is no relationship defined
    if (yIdx != xIdx && categoryMatrix[xIdx][yIdx] == '?') {

        //console.log('Which is better (1): ' + JSON.stringify(categories[xIdx]) + ' or (2): ' + JSON.stringify(categories [yIdx]) + '?');
        let better = (getRandomInt(2) + 1).toString();

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

        automateRelationalRanking();

        iterations++;
    }
}


console.log(categoryMatrix);
console.log('max iterations: ' + maxIterations + '. Iterations: ' + iterations + '. Pct Savings: ' + Math.round((1 - (iterations / maxIterations)) * 10000)/100 + '%');


timeKeeper.stopTimer(timerName);
timeKeeper.timerReport();
