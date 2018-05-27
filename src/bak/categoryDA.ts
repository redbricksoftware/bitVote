import {CategoryModel} from '../models/categoryModel';
import {BitVoteConfigDA} from '../dataAccess/bitVoteConfigDA';
import {BitVoteModel} from '../models/bitVoteModel';

export class CategoryDA {
    bitVoteDA: BitVoteConfigDA = new BitVoteConfigDA();

    public getCategoriesByBitVoteID(id: string, ownerID: string): Array<CategoryModel> {

        let bitVote: BitVoteModel = this.bitVoteDA.getBitVoteByID(id);

        return bitVote ? bitVote.categories : null;
    }

    constructor(bitVoteDA?: BitVoteConfigDA) {
        if (bitVoteDA) {
            this.bitVoteDA = bitVoteDA;
        }
    }

    /*
    public addCategoryByBitVoteID(id: number, category: CategoryModel): Array<CategoryModel> {
        this.categories[id].push(category);

        return this.categories[id];
    }
    */
}