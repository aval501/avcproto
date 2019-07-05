import { Asset, AssetModel, AssetType, ExpressionType } from "../models/Asset";
import { Owner } from "../models/Owner";
import { ValueDoc } from "../models/Value";
import { ValueModel } from "../models/Value";
import { ValueHolderType } from "../models/Value";
import { ActivityModel, TransferType, Activity } from "../models/Activity";
import { ActivityType } from "../models/Activity";
import { ActivityStatus } from "../models/Activity";
import OwnerBusiness from "./owner";
import { SystemDelegate } from "./system";

export default class UserBusiness extends OwnerBusiness {
    constructor(private _user: Owner, private _systemDelegate: SystemDelegate) {
        super(_user);
    }

    public async checkAccountAsync(): Promise<Activity[]> {
        const userValues = await ValueModel.find({ owner: this._user }).exec();
        const amount = userValues.reduce((sum, value) => sum + value.amount, 0);
        if (amount !== userValues.length) {
            throw `[Error] checkAccountAsync`;
        }

        const now = new Date();
        const checkAccountActivity = await ActivityModel.create({
            type: ActivityType.CheckAccount,
            timestamp: now,
            status: ActivityStatus.Completed,
            owner: this._user.id,
            value: undefined,
            checkAccount: {
                id: this._user.id,
                name: this._user.name,
                amount: amount
            }
        });

        return [checkAccountActivity];
    }

    public async transferValueAsync(targetBusiness: OwnerBusiness, valueAmount: number): Promise<Activity[]> {
        const now = new Date();

        const user = await ValueModel.find({ owner: this._user }).exec();

        console.log(`first citizen transfers 1 value from first citizen to to the second citizen.`);
        const value = user.find((value) => value.amount === 1);
        value.owner = targetBusiness.owner;
        await value.save();

        const transferActivity = await ActivityModel.create({
            type: ActivityType.Transfer,
            timestamp: now,
            status: ActivityStatus.Completed,
            owner: this._user.id,
            value: undefined,
            transfer: {
                type: TransferType.ValuesFromOwnerToOwner,
                fromId: this._user.id,
                toId: targetBusiness.owner.id,
                ids: [value.id]
            }
        });

        return [transferActivity];
    }

    public async transferAssetsAsync(targetBusiness: OwnerBusiness, assets: Asset[]): Promise<Activity[]> {
        const now = new Date();
        const firstPost = assets[0];

        console.log(`${this._user.name} cashout value from the assets..`);
        console.log(`transferring assets from ${this._user.name} to ${targetBusiness.owner.name}..`);
        firstPost.owner = targetBusiness.owner;
        firstPost.save();

        const transferAssetActivity = await ActivityModel.create({
            type: ActivityType.Transfer,
            timestamp: now,
            status: ActivityStatus.Completed,
            owner: this._user.id,
            value: undefined,
            transfer: {
                type: TransferType.AssetsFromOwnerToOwner,
                fromId: this._user.id,
                toId: targetBusiness.owner.id,
                ids: [firstPost.id]
            }
        });

        const valueRewardActivity = await this._systemDelegate.offerAssetAsync(transferAssetActivity);

        return [transferAssetActivity, valueRewardActivity];
    }

    public async createExpressionAsync(asset: Asset, expressionType: ExpressionType): Promise<Asset> {
        const now = new Date();

        console.log(`${this._user.name} makes a expression on the post: ${asset.post.content}`);
        const firstExpression = await AssetModel.create({
            type: AssetType.Expression,
            createdTime: now,
            modifiedTime: now,
            owner: this._user.id,
            parent: asset.id,
            expression: {
                type: ExpressionType.Worth
            }
        });

        const createActivity = await ActivityModel.create({
            type: ActivityType.Create,
            timestamp: now,
            status: ActivityStatus.Completed,
            owner: this._user.id,
            // value: expressionValue,
            create: {
                asset: {
                    id: firstExpression.id,
                    type: firstExpression.type,
                    parentId: firstExpression.parent.id,
                    ownerId: this._user.id
                }
            }
        });

        const valueRewardActivity = await this._systemDelegate.contributeAssetAsync(createActivity);

        return firstExpression;
    }

    public async createCommentAsync(post: Asset, content: string): Promise<Asset> {
        const now = new Date();

        console.log(`second citizen create a first comment on the first post`);
        const firstComment = await AssetModel.create({
            type: AssetType.Comment,
            createdTime: now,
            modifiedTime: now,
            owner: this._user.id,
            parent: post,
            post: {
                content: `${content}`
            }
        });

        const createActivity = await ActivityModel.create({
            type: ActivityType.Create,
            timestamp: now,
            status: ActivityStatus.Completed,
            owner: this._user.id,
            // value: commentValue,
            create: {
                asset: {
                    id: firstComment.id,
                    type: firstComment.type,
                    parentId: post.id,
                    ownerId: this._user.id
                }
            }
        });

        const rewardActivity = await this._systemDelegate.contributeAssetAsync(createActivity);

        return firstComment;
    }

    public async createPostAsync(board: Asset, content: string): Promise<Asset> {
        const now = new Date();

        console.log(`${this._user.name} create a post on a ${board.board.name} board..`);
        const post = await AssetModel.create({
            type: AssetType.Post,
            createdTime: now,
            modifiedTime: now,
            owner: this._user.id,
            parent: undefined,
            post: {
                content: content
            }
        });

        const createActivity = await ActivityModel.create({
            type: ActivityType.Create,
            timestamp: now,
            status: ActivityStatus.Completed,
            owner: this._user.id,
            // value: postValue,
            create: {
                asset: {
                    id: post.id,
                    type: post.type,
                    parentId: board.id,
                    ownerId: this._user.id
                }
            }
        });

        console.log(`Reporting contribution to the system through delegate..`);
        const rewardActivity = await this._systemDelegate.contributeAssetAsync(createActivity);

        return post;
    }
}