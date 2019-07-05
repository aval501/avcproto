import { OwnerModel, OwnerType, Owner } from "../models/Owner";
import { ValueModel, ValueHolderType, ValueDoc, Value } from "../models/Value";
import { ActivityModel, TransferType, Activity } from "../models/Activity";
import { ActivityStatus } from "../models/Activity";
import { ActivityType } from "../models/Activity";
import { AssetType } from "../models/Asset";
import { AssetModel } from "../models/Asset";
import { ContractStatus } from "../models/Asset";
import { TermStatus } from "../models/ContractTerm";
import { TermType } from "../models/ContractTerm";
import { ContractTermModel } from "../models/ContractTerm";
import TeamBusiness from "./team";
import UserBusiness from "./user";
import OwnerBusiness from "./owner";
import { create } from "istanbul-reports";

export class SystemDelegate {
    constructor(private _systemId: string) {
    }

    public async contributeAssetAsync(createActivity: Activity): Promise<Activity> {
        const systemValues = await ValueModel.find({ owner: this._systemId }).sort({ amount: -1 }).limit(1).exec();
        if (!systemValues || systemValues.length !== 1) {
            throw `[ERROR] system value weird..`;
        }

        let rewardAmount = 0;
        switch (createActivity.create.asset.type) {
            case AssetType.Post:
                rewardAmount = 3;
                break;
            case AssetType.Comment:
                rewardAmount = 2;
                break;
            case AssetType.Expression:
                rewardAmount = 1;
                break;
            case AssetType.Board:
            default:
                break;
        }

        if (systemValues[0].amount < rewardAmount) {
            throw `[ERROR] no money lah...`;
        }

        const create = createActivity.create;
        const creator = await OwnerModel.findById(create.asset.ownerId);
        if (!creator) {
            throw `[ERROR] creator not found.`;
        }

        const assetId = create.asset.id;
        const asset = await AssetModel.findById(assetId);
        if (!asset) {
            throw `[ERROR] asset not found.`;
        }

        const values: Value[] = [];
        systemValues[0].amount -= rewardAmount;
        for (let i = 0; i < rewardAmount; i++) {
            values.push({
                amount: 1,
                holderType: ValueHolderType.Asset,
                asset: asset
            });
        }

        await systemValues[0].save();
        const valueDocs = await ValueModel.insertMany(values);

        const now = new Date();
        const transferActivity = ActivityModel.create({
            type: ActivityType.Transfer,
            timestamp: now,
            status: ActivityStatus.Completed,
            owner: this._systemId,
            value: undefined,
            transfer: {
                type: TransferType.ValuesFromOwnerToAsset,
                fromId: this._systemId,
                toId: asset.id,
                ids: valueDocs.map(value => value.id)
            }
        });

        return transferActivity;
    }

    public async offerAssetAsync(transferActivity: Activity): Promise<Activity> {
        if (transferActivity.transfer.type !== TransferType.AssetsFromOwnerToOwner) {
            throw "[ERROR] offerAssetAsync";
        }

        const transfer = transferActivity.transfer;
        if (transfer.ids.length !== 1) {
            throw `[ERROR] offerAssetAsync multiple assets not supported.`;
        }

        const rewardOwner = await OwnerModel.findById(transfer.fromId);
        if (!rewardOwner) {
            throw `[ERROR] reward target owner not found.`;
        }

        const assetId = transfer.ids[0];
        const asset = await AssetModel.findById(assetId);
        if (!asset) {
            throw `[ERROR] asset not found.`;
        }

        const assetValues = await ValueModel.find({ asset: assetId }).exec();
        for (const value of assetValues) {
            value.holderType = ValueHolderType.Owner;
            value.asset = undefined;
            value.owner = rewardOwner.id;
            await value.save();
        }

        const now = new Date();
        const transferValueActivity = await ActivityModel.create({
            type: ActivityType.Transfer,
            timestamp: now,
            status: ActivityStatus.Completed,
            owner: this._systemId,
            value: undefined,
            transfer: {
                type: TransferType.ValuesFromAssetToOwner,
                fromId: assetId,
                toId: rewardOwner.id,
                ids: assetValues.map(value => value.id)
            }
        });

        return transferValueActivity;
    }
}

export default class SystemBusiness extends OwnerBusiness {
    private _delegate: SystemDelegate;
    private _directors: Owner;

    constructor(private _system: Owner) {
        super(_system);
        this._delegate = new SystemDelegate(this.owner.id);
    }

    public async createUserAsync(name: string): Promise<UserBusiness> {
        const now = new Date();

        console.log(`creating citizen ${name}..`);
        const firstCitizen = await OwnerModel.create({
            name: name,
            createdTime: now,
            modifiedTime: now,
            type: OwnerType.User,
            memberOf: [this._system.id]
        });
        const userBusiness = new UserBusiness(firstCitizen, this._delegate);

        await ActivityModel.create({
            type: ActivityType.Create,
            timestamp: now,
            status: ActivityStatus.Completed,
            owner: this._system.id,
            value: undefined,
            create: {
                owner: {
                    id: firstCitizen.id,
                    name: firstCitizen.name,
                    type: firstCitizen.type,
                    memberOfIds: firstCitizen.memberOf
                }
            }
        });

        return userBusiness;
    }

    public async createTeamAsync(name: string): Promise<TeamBusiness> {
        const now = new Date();

        console.log(`creating directors team..`);
        const directors = await OwnerModel.create({
            name: "Directors",
            createdTime: now,
            modifiedTime: now,
            type: OwnerType.Team,
            memberOf: [this._system.id]
        });
        const teamBusiness = new TeamBusiness(directors);

        await ActivityModel.create({
            type: ActivityType.Create,
            timestamp: now,
            status: ActivityStatus.Completed,
            owner: this._system.id,
            value: undefined,
            create: {
                owner: {
                    id: directors.id,
                    name: directors.name,
                    type: directors.type,
                    memberOfIds: directors.memberOf
                }
            }
        });

        console.log(`creating directors' team board..`);
        const directorsBoard = await AssetModel.create({
            type: AssetType.Board,
            createdTime: now,
            modifiedTime: now,
            owner: directors.id,
            parent: undefined,
            board: {
                name: "General",
                description: "Director's general board."
            }
        });

        await ActivityModel.create({
            type: ActivityType.Create,
            timestamp: now,
            status: ActivityStatus.Completed,
            owner: this._system.id,
            value: undefined,
            create: {
                asset: {
                    id: directorsBoard.id,
                    type: directorsBoard.type,
                    parentId: undefined,
                    ownerId: directorsBoard.owner.id
                }
            }
        });

        return teamBusiness;
    }

    public static async resetAsync(): Promise<SystemBusiness> {
        const now = new Date();

        console.log(`creating a System owner..`);
        const system = await OwnerModel.create({
            name: "System",
            createdTime: now,
            modifiedTime: now,
            type: OwnerType.System,
            memberOf: []
        });
        const systemBusiness = new SystemBusiness(system);

        console.log(`creating system value..`);
        const systemValue = await ValueModel.create({
            amount: 1000000000,
            holderType: ValueHolderType.Owner,
            owner: system
        });

        await ActivityModel.create({
            type: ActivityType.Create,
            timestamp: now,
            status: ActivityStatus.Completed,
            owner: undefined,
            value: systemValue,
            create: {
                owner: {
                    id: system.id,
                    name: system.name,
                    type: system.type,
                    memberOfIds: []
                }
            }
        });

        console.log(`creating system airdrop reward contract..`);
        const airdropTerm = await ContractTermModel.create({
            description: "Send 1 AVC to one randomly picked owner every 15 minutes.",
            type: TermType.RecurringTransfer,
            interval: 1000 * 60 * 15, // 15mins
            status: TermStatus.Agreed,
            recurringTransfer: {
                value: 1
            }
        });

        const airdropActivity = await ActivityModel.create({
            type: ActivityType.Transfer,
            timestamp: now,
            status: ActivityStatus.Pending,
            owner: system,
            contractTerm: airdropTerm,
            transfer: {
                type: TransferType.ValuesFromOwnerToOwner,
                fromId: system.id,
                toId: undefined,
                ids: undefined
            }
        });

        const systemAirDropContract = await AssetModel.create({
            type: AssetType.Contract,
            createdTime: now,
            modifiedTime: now,
            owner: system,
            parent: undefined,
            contract: {
                title: "System Quarter-hour Air Drop Contract",
                summary: "System distributes agreed upon values to one random active user or team every 15 mintues.",
                status: ContractStatus.Active,
                terms: [airdropTerm],
                expireDate: undefined
            }
        });

        await ActivityModel.create({
            type: ActivityType.Create,
            timestamp: now,
            status: ActivityStatus.Completed,
            owner: system.id,
            value: undefined,
            create: {
                asset: {
                    id: systemAirDropContract.id,
                    type: systemAirDropContract.type,
                    parentId: undefined,
                    ownerId: systemAirDropContract.owner.id
                }
            }
        });

        console.log(`creating system board..`);
        const systemBoard = await AssetModel.create({
            type: AssetType.Board,
            createdTime: now,
            modifiedTime: now,
            owner: system.id,
            parent: undefined,
            board: {
                name: "General",
                description: "System's general board."
            }
        });

        await ActivityModel.create({
            type: ActivityType.Create,
            timestamp: now,
            status: ActivityStatus.Completed,
            owner: system.id,
            value: undefined,
            create: {
                asset: {
                    id: systemBoard.id,
                    type: systemBoard.type,
                    parentId: undefined,
                    ownerId: systemBoard.owner.id
                }
            }
        });

        return systemBusiness;
    }
}