import {TimeKeeper} from '../utils/timeKeeper';
import {CategoryDetailModel, CategoryModel} from '../models/categoryModel';
import {BitVoteConfigDA} from '../dataAccess/bitVoteConfigDA';
import {BitVoteModel} from '../models/bitVoteModel';

const express = require('express');

module.exports = function (timekeeper: TimeKeeper, debug: boolean) {
    const bitVoteConfigDA: BitVoteConfigDA = new BitVoteConfigDA();

    const returnRouter = express.Router();

    //TODO:ownerid
    const ownerID: string = '-1';

    const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ABC: 'def'
    };
    //Get BitVoteModel By ID
    returnRouter.get('/', (request, response) => {
        let bitVotes: Array<BitVoteModel> = bitVoteConfigDA.getBitVotesByOwnerID(ownerID);

        response.status(200).json(bitVotes);
    });

    //Get BitVoteModel By ID
    returnRouter.get('/:id', (request, response) => {
        let id: string = request.params.id;

        let timerName: string = timekeeper.startTimer('get bit vote');

        let bitVote: BitVoteModel = bitVoteConfigDA.getBitVoteByID(id);

        timekeeper.stopTimer(timerName);
        if (bitVote == null) {
            response.status(404).json({});
        } else {
            response.status(200).json(bitVote);
        }

    });

    //Add BitVoteModel
    returnRouter.post('/', (request, response) => {
        //TODO:ownerid
        let bitVote: BitVoteModel = parseBitVoteRequest(request.body, '-1');

        bitVote = bitVoteConfigDA.addBitVote(bitVote);

        let error = false
        if (!error) {
            response.status(200).json(bitVote);
        } else {
            response.status(404).json({});
        }
    });

    //get all categories
    returnRouter.get('/:id/categories', (request, response) => {
        let id: string = request.params.id;


        let timerName: string = timekeeper.startTimer('get categories');
        let bitVote: BitVoteModel = bitVoteConfigDA.getBitVoteByID(id);
        let categories: Array<CategoryModel> = bitVote.categories;

        if (categories == null) {
            response.status(403).json([]);
        } else {
            response.status(200).json(categories);
        }


        timekeeper.stopTimer(timerName);
    });


    //get all categories
    returnRouter.post('/:id/categories', (request, response) => {

        let id: string = request.params.id;
        let bitVote: BitVoteModel = bitVoteConfigDA.getBitVoteByID(id);

        let timerName: string = timekeeper.startTimer('get categories');
        let categories: Array<CategoryModel> = bitVote.categories;

        if (categories == null) {
            categories = [];
        }

        let category: CategoryModel = parseCategoryRequest(request.body);

        console.log(categories);

        categories.push(category);
        bitVoteConfigDA.writeFile();

        response.status(200).json(bitVote);

        timekeeper.stopTimer(timerName);
    });


    //get all categories
    returnRouter.get('/:id/categories/:categoryID', (request, response) => {
        let id: string = request.params.id;
        let categoryID: string = request.params.categoryID;


        let timerName: string = timekeeper.startTimer('get category');
        let bitVote: BitVoteModel = bitVoteConfigDA.getBitVoteByID(id);
        let categories: Array<CategoryModel> = bitVote.categories;
        let category: CategoryModel = null;

        for (let cat of categories) {
            if (cat.id == categoryID) {
                category = cat;
                break;
            }
        }

        if (category == null) {
            response.status(403).json({});
        } else {
            response.status(200).json(category);
        }


        timekeeper.stopTimer(timerName);
    });


    //get all categories
    returnRouter.post('/:id/categories/:categoryID', (request, response) => {
        let id: string = request.params.id;
        let categoryID: string = request.params.categoryID;

        let categoryDetail: CategoryDetailModel = parseCategoryDetailRequest(request.body);

        let timerName: string = timekeeper.startTimer('get category');
        let bitVote: BitVoteModel = bitVoteConfigDA.getBitVoteByID(id);

        console.log(bitVote);

        let categories: Array<CategoryModel> = bitVote.categories;
        let category: CategoryModel = null;


        for (let cat of categories) {
            if (cat.id == categoryID) {
                category = cat;
                break;
            }
        }

        category.categoryDetails.push(categoryDetail);
        bitVoteConfigDA.writeFile();

        if (category == null) {
            response.status(403).json({});
        } else {
            response.status(200).json(category);
        }


        timekeeper.stopTimer(timerName);
    });

    //get all categories
    returnRouter.delete('/:id/categories/:categoryID', (request, response) => {
        let id: string = request.params.id;
        let categoryID: string = request.params.categoryID;

        let timerName: string = timekeeper.startTimer('get category');
        let bitVote: BitVoteModel = bitVoteConfigDA.getBitVoteByID(id);

        let categories: Array<CategoryModel> = bitVote.categories;
        let category: CategoryModel = null;


        let deleteSuccess: boolean = false;
        for (let i = 0; i < categories.length; i++) {
            if (categories[i].id == categoryID) {
                categories.splice(i, 1);
                deleteSuccess = true;
                break;
            }
        }

        bitVoteConfigDA.writeFile();

        if (deleteSuccess) {
            response.status(200).json(categories);
        } else {
            response.status(403).json({});
        }


        timekeeper.stopTimer(timerName);
    });


    let sendResponse = function (response, code, data) {
        response.writeHead(code, headers);
        response.write(JSON.stringify(data));
        response.addTrailers({'Content-MD5': 'hashhere'});
        response.end();
    };

    let parseCategoryRequest = function (requestBody): CategoryModel {
        let name = '';
        let question = '';

        Object.keys(requestBody).forEach(key => {
            switch (key.toLowerCase().trim()) {
                case 'name':
                    name = requestBody[key];
                    break;
                case 'question':
                    question = requestBody[key];
                    break;
                default:
                    break;
            }
        });


        let category: CategoryModel = new CategoryModel(name, question);

        return category;
    }

    let parseCategoryDetailRequest = function (requestBody): CategoryDetailModel {
        let name = '';
        let description = '';

        Object.keys(requestBody).forEach(key => {
            switch (key.toLowerCase().trim()) {
                case 'name':
                    name = requestBody[key];
                    break;
                case 'description':
                    description = requestBody[key];
                    break;
                default:
                    break;
            }
        });


        let categoryDetail: CategoryDetailModel = new CategoryDetailModel(name, description);

        return categoryDetail;
    }

    let parseBitVoteRequest = function (requestBody, ownerID): BitVoteModel {
        let name = '';
        let description = '';

        Object.keys(requestBody).forEach(key => {
            switch (key.toLowerCase().trim()) {
                case 'name':
                    name = requestBody[key];
                    break;
                case 'description':
                    description = requestBody[key];
                    break;
                default:
                    break;
            }
        });

        let bitVote: BitVoteModel = new BitVoteModel(name, description, ownerID);

        return bitVote;
    }

    return returnRouter;
};