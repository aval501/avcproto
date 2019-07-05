import { Asset } from "../models/Asset";
import { Owner } from "../models/Owner";

export default class OwnerBusiness {
    public readonly owner: Owner;
    private _boards: Asset[];

    constructor(owner: Owner) {
        this.owner = owner;
    }

    public async getBoards(): Promise<Asset[]> {
        return this._boards;
    }
}