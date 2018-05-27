import {BitCalc} from '../bitCalc';
import {TimeKeeper} from '../utils/timeKeeper';
import {ChoiceAOrBEnum, ChoiceModel} from '../models/choiceModel';
import {BitVoteConfigDA} from '../dataAccess/bitVoteConfigDA';
import {ABComparisonModel} from '../models/abComparisonModel';

const express = require('express');
const https = require('https');

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

    returnRouter.post('/', (request, response) => {

        let choice: ChoiceModel = parseChoiceBody(request.body);
        console.log(choice);

        response.status(200).json({});

    });

    returnRouter.get('/dynamo', ((req, res) => {
        var AWS = require('aws-sdk');

        AWS.config.update({
            region: 'us-west-2',
            endpoint: 'http://localhost:8000'
        });

        var dynamodb = new AWS.DynamoDB();

        var params = {
            TableName: 'Movies',
            KeySchema: [
                {AttributeName: 'year', KeyType: 'HASH'},  //Partition key
                {AttributeName: 'title', KeyType: 'RANGE'}  //Sort key
            ],
            AttributeDefinitions: [
                {AttributeName: 'year', AttributeType: 'N'},
                {AttributeName: 'title', AttributeType: 'S'}
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 10,
                WriteCapacityUnits: 10
            }
        };

        dynamodb.createTable(params, function (err, data) {
            if (err) {
                console.error('Unable to create table. Error JSON:', JSON.stringify(err, null, 2));
            } else {
                console.log('Created table. Table description JSON:', JSON.stringify(data, null, 2));
            }
        });
    }))

    let parseChoiceBody = function (responseBody): ChoiceModel {
        let choice: ChoiceModel = new ChoiceModel();

        Object.keys(responseBody).forEach(key => {
            switch (key.toLowerCase().trim()) {
                case 'bitvoteid':
                    choice.bitVoteID = responseBody[key];
                    break;
                case 'choiceaid':
                    choice.choiceAID = responseBody[key];
                    break;
                case 'choicebid':
                    choice.choiceBID = responseBody[key];
                    break;
                case 'choiceaorb':
                    if (responseBody[key].toUpperCase().trim() == 'A') {
                        choice.choiceAOrB = ChoiceAOrBEnum.A;
                    } else if (responseBody[key].toUpperCase().trim() == 'B') {
                        choice.choiceAOrB = ChoiceAOrBEnum.B;
                    }
                    break;
                default:
                    break;
            }
        });

        return choice;
    };

    return returnRouter;
};