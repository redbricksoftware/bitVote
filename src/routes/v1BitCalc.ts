import {BitCalc} from '../bitCalc';
import {TimeKeeper} from '../utils/timeKeeper';
import {BitVoteConfigDA} from '../dataAccess/bitVoteConfigDA';
import {ABComparisonModel} from '../models/abComparisonModel';

const express = require('express');
const https = require('https');

const mongoose = require('mongoose');

module.exports = function (timekeeper: TimeKeeper, debug: boolean) {

    const returnRouter = express.Router();

    const headers = {
        Accept: 'application/json'
    };


    returnRouter.get('/', (request, response) => {
        let bitVoteDA: BitVoteConfigDA = new BitVoteConfigDA();
        let compareVals: ABComparisonModel = bitVoteDA.getQuestion(1, 1);

        console.log('abc');

        response.status(200).json(compareVals);

    });


    return returnRouter;
};