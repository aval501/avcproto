#!/usr/bin/env node

import mongoose from "mongoose";
import bluebird from "bluebird";
import { MONGODB_URI } from "./util/secrets";
import { Owner, OwnerType, OwnerModel } from "./models/Owner";
import { ActivityModel, ActivityType, ActivityStatus, TransferType, Activity } from "./models/Activity";
import { AssetModel, AssetType, ExpressionType, ContractStatus } from "./models/Asset";
import { ValueModel, Value, ValueHolderType, ValueDoc } from "./models/Value";
import { ContractTerm, TermType, TermStatus, ContractTermModel } from "./models/ContractTerm";
import SystemBusiness from "./businesses/system";
import TeamBusiness from "./businesses/team";
import UserBusiness from "./businesses/user";

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
    const systemBiz = await SystemBusiness.resetAsync();
    const systemBoards = await systemBiz.getBoards();

    const directorsBiz = await systemBiz.createTeamAsync("Directors");
    const directorsTeamBoards = await directorsBiz.getBoards();

    const firstUserBiz = await systemBiz.createUserAsync("First Citizen");
    const firstUserBoards = await firstUserBiz.getBoards();
    const secondUserBiz = await systemBiz.createUserAsync("Second Citizen");
    const secondUserBoards = await secondUserBiz.getBoards();

    const post = await firstUserBiz.createPostAsync(systemBoards[0], `<h1>hello world</h1><p>this is my first post</p>`);
    const comment = await secondUserBiz.createCommentAsync(post, `<p>some comment here</p>`);
    const worthExpression = await secondUserBiz.createExpressionAsync(post, ExpressionType.Worth);
    const notWorthExpression = await firstUserBiz.createExpressionAsync(comment, ExpressionType.NotWorth);

    let firstUserCheckBalanceActivity = await firstUserBiz.checkBalanceAsync();
    console.log(firstUserCheckBalanceActivity);
    let secondUserCheckBalanceActivity = await secondUserBiz.checkBalanceAsync();
    console.log(secondUserCheckBalanceActivity);

    const firstUserTransferAssetActivity = await firstUserBiz.transferAssetsAsync(systemBiz, [post]);
    firstUserCheckBalanceActivity = await firstUserBiz.checkBalanceAsync();
    console.log(firstUserCheckBalanceActivity);
    secondUserCheckBalanceActivity = await secondUserBiz.checkBalanceAsync();
    console.log(secondUserCheckBalanceActivity);

    const firstUserTransferValueActivity = await firstUserBiz.transferValueAsync(secondUserBiz, 1);
    firstUserCheckBalanceActivity = await firstUserBiz.checkBalanceAsync();
    console.log(firstUserCheckBalanceActivity);
    secondUserCheckBalanceActivity = await secondUserBiz.checkBalanceAsync();
    console.log(secondUserCheckBalanceActivity);
}