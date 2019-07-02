#!/usr/bin/env node

import mongoose from "mongoose";
import bluebird from "bluebird";
import { MONGODB_URI } from "./util/secrets";
import { Owner, OwnerType, OwnerModel } from "./models/Owner";
import { ActivityModel, ActivityType, ActivityStatus, TransferType, Activity } from "./models/Activity";
import { AssetModel, AssetType, ExpressionType, ContractStatus } from "./models/Asset";
import { ValueModel, Value, ValueHolderType, ValueDoc } from "./models/Value";
import { ContractTerm, TermType, TermStatus, ContractTermModel } from "./models/ContractTerm";

async function waitAsync(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

(async () => {
    console.log(`-----------------------------------------------------------------------------------------------`);
    // console.log(`Starting ${PackageJson["name"]} (${PackageJson["version"]})....`);

    console.log(`Initializing...`);
    // Connect to MongoDB
    const mongoUrl = MONGODB_URI;
    (<any>mongoose).Promise = bluebird;
    mongoose.connect(mongoUrl).then(
        () => { /** ready to use. The `mongoose.connect()` promise resolves to undefined. */ },
    ).catch(err => {
        console.log("MongoDB connection error. Please make sure MongoDB is running. " + err);
        process.exit();
    });

    console.log("Connected.");
    await onConnectAsync();

    mongoose.connection.close();
    console.log(`Terminating seeder...`);
})();

async function onConnectAsync(): Promise<void> {
    console.log(`reset every document..`);
    await OwnerModel.deleteMany({});
    await ActivityModel.deleteMany({});
    await AssetModel.deleteMany({});
    await ValueModel.deleteMany({});
    await ContractTermModel.deleteMany({});

    const now = new Date();

    console.log(`creating a System owner..`);
    const system = await OwnerModel.create({
        name: "System",
        createdTime: now,
        modifiedTime: now,
        type: OwnerType.System,
        memberOf: []
    });

    console.log(`creating system value..`);
    const systemValue = await ValueModel.create({
        value: 1000000000,
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

    console.log(`creating directors team..`);
    const directors = await OwnerModel.create({
        name: "Directors",
        createdTime: now,
        modifiedTime: now,
        type: OwnerType.Team,
        memberOf: [system.id]
    });

    await ActivityModel.create({
        type: ActivityType.Create,
        timestamp: now,
        status: ActivityStatus.Completed,
        owner: system.id,
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
        owner: system.id,
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

    console.log(`creating first citizen..`);
    const firstCitizen = await OwnerModel.create({
        name: "First Citizen",
        createdTime: now,
        modifiedTime: now,
        type: OwnerType.User,
        memberOf: [system.id, directors.id]
    });

    await ActivityModel.create({
        type: ActivityType.Create,
        timestamp: now,
        status: ActivityStatus.Completed,
        owner: system.id,
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

    console.log(`creating second citizen..`);
    const secondCitizen = await OwnerModel.create({
        name: "Second Citizen",
        createdTime: now,
        modifiedTime: now,
        type: OwnerType.User,
        memberOf: [system.id]
    });

    await ActivityModel.create({
        type: ActivityType.Create,
        timestamp: now,
        status: ActivityStatus.Completed,
        owner: system.id,
        value: undefined,
        create: {
            owner: {
                id: secondCitizen.id,
                name: secondCitizen.name,
                type: secondCitizen.type,
                memberOfIds: secondCitizen.memberOf
            }
        }
    });

    console.log(`first citizen create a first post on a system dashboard..`);
    const firstPost = await AssetModel.create({
        type: AssetType.Post,
        createdTime: now,
        modifiedTime: now,
        owner: firstCitizen.id,
        parent: undefined,
        post: {
            content: `<h1>hello world</h1><p>this is my first post</p>`
        }
    });

    let postValue: ValueDoc;
    if (systemValue.value >= 3) {
        systemValue.value -= 3;
        postValue = await ValueModel.create({
            value: 3,
            holderType: ValueHolderType.Asset,
            asset: firstPost
        });

        await systemValue.save();
    }

    await ActivityModel.create({
        type: ActivityType.Create,
        timestamp: now,
        status: ActivityStatus.Completed,
        owner: firstCitizen.id,
        value: postValue,
        create: {
            asset: {
                id: firstPost.id,
                type: firstPost.type,
                parentId: systemBoard.id,
                ownerId: firstCitizen.id
            }
        }
    });

    console.log(`second citizen create a first comment on the first post`);
    const firstComment = await AssetModel.create({
        type: AssetType.Comment,
        createdTime: now,
        modifiedTime: now,
        owner: secondCitizen.id,
        parent: firstPost,
        post: {
            content: `<p>This is my first comment</p>`
        }
    });

    let commentValue: ValueDoc;
    if (systemValue.value >= 2) {
        systemValue.value -= 2;
        commentValue = await ValueModel.create({
            value: 2,
            holderType: ValueHolderType.Asset,
            asset: firstPost
        });

        await systemValue.save();
    }

    await ActivityModel.create({
        type: ActivityType.Create,
        timestamp: now,
        status: ActivityStatus.Completed,
        owner: secondCitizen.id,
        value: commentValue,
        create: {
            asset: {
                id: firstComment.id,
                type: firstComment.type,
                parentId: firstPost.id,
                ownerId: secondCitizen.id
            }
        }
    });

    console.log(`second citizen makes a first expression on the first post`);
    const firstExpression = await AssetModel.create({
        type: AssetType.Expression,
        createdTime: now,
        modifiedTime: now,
        owner: secondCitizen.id,
        parent: firstPost,
        expression: {
            type: ExpressionType.Worth
        }
    });

    let expressionValue: ValueDoc;
    if (systemValue.value >= 1) {
        systemValue.value -= 1;
        expressionValue = await ValueModel.create({
            value: 1,
            holderType: ValueHolderType.Asset,
            asset: firstPost
        });

        await systemValue.save();
    }

    await ActivityModel.create({
        type: ActivityType.Create,
        timestamp: now,
        status: ActivityStatus.Completed,
        owner: secondCitizen.id,
        value: expressionValue,
        create: {
            asset: {
                id: firstExpression.id,
                type: firstExpression.type,
                parentId: firstExpression.parent.id,
                ownerId: secondCitizen.id
            }
        }
    });

    console.log(`first citizen makes a second expression on the first comment`);
    const secondExpression = await AssetModel.create({
        type: AssetType.Expression,
        createdTime: now,
        modifiedTime: now,
        owner: firstCitizen.id,
        parent: firstComment,
        expression: {
            type: ExpressionType.NotWorth
        }
    });

    let secondExpressionValue: ValueDoc;
    if (systemValue.value >= 1) {
        systemValue.value -= 1;
        secondExpressionValue = await ValueModel.create({
            value: 1,
            holderType: ValueHolderType.Asset,
            asset: firstComment
        });

        await systemValue.save();
    }

    await ActivityModel.create({
        type: ActivityType.Create,
        timestamp: now,
        status: ActivityStatus.Completed,
        owner: firstCitizen.id,
        value: secondExpressionValue,
        create: {
            asset: {
                id: secondExpression.id,
                type: secondExpression.type,
                parentId: secondExpression.parent.id,
                ownerId: secondExpression.id
            }
        }
    });

    console.log(`first citizen cashout value from the post.`);
    console.log(`transferring first post from first citizen to the system.`);
    firstPost.owner = system;
    firstPost.save();

    await ActivityModel.create({
        type: ActivityType.Transfer,
        timestamp: now,
        status: ActivityStatus.Completed,
        owner: firstCitizen.id,
        value: undefined,
        transfer: {
            type: TransferType.AssetsFromOwnerToOwner,
            fromId: firstCitizen.id,
            toId: system.id,
            ids: [firstPost.id]
        }
    });

    console.log(`transferring values from first post to the citizen.`);
    const postValues = await ValueModel.find({ asset: firstPost }).exec();
    for (const value of postValues) {
        value.holderType = ValueHolderType.Owner;
        value.asset = undefined;
        value.owner = firstCitizen;
        await value.save();
    }

    await ActivityModel.create({
        type: ActivityType.Transfer,
        timestamp: now,
        status: ActivityStatus.Completed,
        owner: system.id,
        value: undefined,
        transfer: {
            type: TransferType.ValuesFromAssetToOwner,
            fromId: firstPost.id,
            toId: firstCitizen.id,
            ids: postValues.map(value => value.id)
        }
    });

    let firstCitizenValues = await ValueModel.find({ owner: firstCitizen }).exec();
    console.log(`first citizen now has ${firstCitizenValues.reduce((sum, value) => sum + value.value, 0)} AVC.`);

    console.log(`first citizen transfers 1 value from first citizen to to the second citizen.`);
    const value = firstCitizenValues.find((value) => value.value === 1);
    value.owner = secondCitizen;
    await value.save();

    await ActivityModel.create({
        type: ActivityType.Transfer,
        timestamp: now,
        status: ActivityStatus.Completed,
        owner: firstCitizen,
        value: undefined,
        transfer: {
            type: TransferType.ValuesFromOwnerToOwner,
            fromId: firstCitizen.id,
            toId: secondCitizen.id,
            ids: [value.id]
        }
    });

    firstCitizenValues = await ValueModel.find({ owner: firstCitizen }).exec();
    console.log(`first citizen now has ${firstCitizenValues.reduce((sum, value) => sum + value.value, 0)} AVC.`);
    const secondCitizenValues = await ValueModel.find({ owner: secondCitizen }).exec();
    console.log(`second citizen now has ${secondCitizenValues.reduce((sum, value) => sum + value.value, 0)} AVC.`);
}