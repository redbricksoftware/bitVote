import {BitVoteModel} from '../models/bitVoteModel';
import * as fs from 'fs';

//TODO: Change this to real data access
export class BitVoteConfigDA {
    bitVotes: Array<BitVoteModel> = require('../../sampledata/bitVoteConfigData.json');

    public addBitVote(bitVoteAdd: BitVoteModel): BitVoteModel {
        let bitVote: BitVoteModel = new BitVoteModel(bitVoteAdd.name, bitVoteAdd.description, bitVoteAdd.ownerID);

        //tODO: this
        this.bitVotes.push(bitVote);

        this.writeFile();
        return bitVote;
    }

    public getBitVoteByID(id: string): BitVoteModel {

        for (let bitVote of this.bitVotes) {
            if (id == bitVote.id) {
                return bitVote
            }
        }

        return null;

    }

    public getBitVotesByOwnerID(ownerID: string): Array<BitVoteModel> {
        let bitVotes: Array<BitVoteModel> = [];


        for (let bitVote of this.bitVotes) {
            if (ownerID == bitVote.ownerID) {
                bitVotes.push(bitVote);
            }
        }

        return bitVotes;
    }

    public writeFile() {
        fs.writeFileSync('sampledata/bitVoteConfigData.json', JSON.stringify(this.bitVotes));
    }

}