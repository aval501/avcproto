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
    const systemBoards = await systemBiz.getBoardsAsync();

    const directorsBiz = await systemBiz.createTeamAsync("Directors");
    const directorsTeamBoards = await directorsBiz.getBoardsAsync();

    const firstUserBiz = await systemBiz.createUserAsync("First Citizen");
    const firstUserBoards = await firstUserBiz.getBoardsAsync();
    const secondUserBiz = await systemBiz.createUserAsync("Second Citizen");
    const secondUserBoards = await secondUserBiz.getBoardsAsync();
    const thirdUserBiz = await systemBiz.createUserAsync("Third Citizen");
    const thirdUserBoards = await thirdUserBiz.getBoardsAsync();
    const allUserBizs = [firstUserBiz, secondUserBiz, thirdUserBiz];

    const post = await firstUserBiz.createPostAsync(systemBoards[0], `<h1>hello world</h1><p>this is my first post</p>`);
    const comment = await secondUserBiz.createCommentAsync(post, `<p>some comment here</p>`);
    const worthExpression = await secondUserBiz.createExpressionAsync(post, ExpressionType.Worth);
    const notWorthExpression = await firstUserBiz.createExpressionAsync(comment, ExpressionType.NotWorth);
    await checkAndLogAccounts(allUserBizs);

    const firstUserTransferAssetActivity = await firstUserBiz.transferAssetsAsync(systemBiz, [post]);
    await checkAndLogAccounts(allUserBizs);

    let firstUserTransferValueActivity = await firstUserBiz.transferValueAsync(secondUserBiz, 1);
    await checkAndLogAccounts(allUserBizs);

    firstUserTransferValueActivity = await firstUserBiz.transferValueAsync(thirdUserBiz, 2);
    await checkAndLogAccounts(allUserBizs);

    const thirdUserTransferValueActivity = await thirdUserBiz.transferValueAsync(secondUserBiz, 1);
    await checkAndLogAccounts(allUserBizs);

    const secondUserTransferValueActivity = await secondUserBiz.transferValueAsync(firstUserBiz, 1);
    await checkAndLogAccounts(allUserBizs);
}

async function checkAndLogAccounts(users: UserBusiness[]): Promise<void> {
    const checkAccountActivities: Activity[] = [];
    let userBalanceStr = "";
    for (const user of users) {
        const activities = await user.checkAccountAsync();
        checkAccountActivities.push(...activities);

        userBalanceStr += `${user.owner.name}: ${activities[0].checkAccount.amount} `;
    }

    console.log(userBalanceStr);
}