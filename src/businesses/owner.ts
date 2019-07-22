import { Asset, AssetModel, AssetType } from "../models/Asset";
import { Owner, OwnerDoc, OwnerModel, OwnerType } from "../models/Owner";
import SystemBusiness from "./system";
import TeamBusiness from "./team";
import UserBusiness from "./user";
import { Activity, ActivityStatus, TransferType } from "../models/Activity";
import { ValueModel, ValueHolderType } from "../models/Value";
import { ActivityModel } from "../models/Activity";
import { ActivityType } from "../models/Activity";

export default class OwnerBusiness {
    public readonly owner: Owner;
    private _boards: Asset[];

    constructor(owner: Owner) {
        this.owner = owner;
    }

    public async checkAccountAsync(): Promise<Activity[]> {
        const ownerValues = await ValueModel.find({ owner: this.owner._id }).exec();
        const amount = ownerValues.reduce((sum, value) => sum + value.amount, 0);

        const now = new Date();
        const checkAccountActivity = await ActivityModel.create({
            type: ActivityType.CheckAccount,
            timestamp: now,
            status: ActivityStatus.Completed,
            owner: this.owner._id,
            value: undefined,
            checkAccount: {
                id: this.owner._id,
                name: this.owner.name,
                amount: amount
            }
        });

        return [checkAccountActivity];
    }
    public async getBoardsAsync(): Promise<Asset[]> {
        if (!this._boards) {
            this._boards = await AssetModel.find({ type: AssetType.Board, owner: this.owner }).exec();
        }

        return this._boards;
    }

    public async transferValueAsync(targetBusiness: OwnerBusiness, valueAmount: number): Promise<Activity[]> {
        const now = new Date();

        console.log(`${this.owner.name} transfers ${valueAmount} amount to ${targetBusiness.owner.name}..`);
        let userValues = await ValueModel.find({ owner: this.owner }).limit(valueAmount).exec();
        if (this.owner.type === OwnerType.System) {
            const systemBusiness = await SystemBusiness.getBusinessAsync();
            userValues = await systemBusiness.splitValuesAsync(valueAmount, ValueHolderType.Owner, this.owner);
        } else if (userValues.length < valueAmount) {
            throw `[ERROR] not enough money.`;
        }

        for (const userValue of userValues) {
            userValue.owner = targetBusiness.owner;
            await userValue.save();
        }

        const transferActivity = await ActivityModel.create({
            type: ActivityType.Transfer,
            timestamp: now,
            status: ActivityStatus.Completed,
            owner: this.owner._id,
            transfer: {
                type: TransferType.ValuesFromOwnerToOwner,
                fromId: this.owner._id,
                toId: targetBusiness.owner._id,
                ids: userValues.map((value) => value.id)
            }
        });

        return [transferActivity];
    }
}