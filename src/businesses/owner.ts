import { Asset, AssetModel, AssetType } from "../models/Asset";
import { Owner } from "../models/Owner";

export default class OwnerBusiness {
    public readonly owner: Owner;
    private _boards: Asset[];

    constructor(owner: Owner) {
        this.owner = owner;
    }

    public async getBoardsAsync(): Promise<Asset[]> {
        if (!this._boards) {
            this._boards = await AssetModel.find({ type: AssetType.Board, owner: this.owner }).exec();
        }

        return this._boards;
    }
}