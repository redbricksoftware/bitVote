import {v4 as uuid} from 'uuid'

export class CategoryModel {
    id: string;
    name: string;
    question: string;
    categoryDetails: Array<CategoryDetailModel> = [];

    constructor(name: string, question: string) {
        this.id = uuid();
        this.name = name;
        this.question = question;
        if (this.categoryDetails == null) {
            this.categoryDetails = [];
        }
    }

    public askQuestion(aVal: string, bVal: string): string {
        return this.question.replace('{{a}}', aVal).replace('{{b}}', bVal);
    }
}

export class CategoryDetailModel {
    name: string;
    description: string;

    constructor(name: string, description?: string) {
        this.name = name;
        this.description = description ? description : '';
    }
}