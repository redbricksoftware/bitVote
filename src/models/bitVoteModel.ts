import {v4 as uuid} from 'uuid';
import {CategoryModel} from './categoryModel';
import {BitVoteTypeEnum} from './bitVoteTypeEnum';

export class BitVoteModel {
    id: string = uuid();
    ownerID: string = '';
    name: string;
    description: string;
    categories: Array<CategoryModel> = [];
    votingStarted: boolean = false;
    bitVoteType: BitVoteTypeEnum = BitVoteTypeEnum.SINGLE;

    constructor(name: string, description: string, ownerID: string) {
        this.id = uuid();
        this.name = name;
        this.description = description;
        this.ownerID = ownerID;
    }

}

