#!/usr/bin/env node

import mongoose from "mongoose";
import bluebird from "bluebird";
import { MONGODB_URI } from "./util/secrets";
import { Owner, OwnerType, OwnerModel } from "./models/Owner";
import { ActivityModel, ActivityType, ActivityStatus, TransferType, Activity } from "./models/Activity";
import { AssetModel, AssetType, ExpressionType, ContractStatus, Asset } from "./models/Asset";
import { ValueModel, Value, ValueHolderType, ValueDoc } from "./models/Value";
import { TermType } from "./models/ContractTerm";
import UserBusiness from "./businesses/user";
import SystemBusiness from "./businesses/system";
import OwnerBusiness from "./businesses/owner";

async function waitAsync(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const serviceState = {
    terminate: false,
    listenerInterval: 1000, // 50ms
};

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

    let elapsedTime = 0;
    while (!serviceState.terminate) {
        const activeContracts = await AssetModel.find({ "type": AssetType.Contract, "contract.status": ContractStatus.Active }).exec();
        console.log(`${activeContracts.length} active contracts found..`);
        await onPeekActiveContractsAsync(elapsedTime, activeContracts);

        // if (elapsedTime % serviceState.minOrderingInterval === 0)
        //     onOrderIntervalAsync(elapsedTime, strategies);

        // if (elapsedTime % serviceState.benchmarkInterval === 0)
        //     onBenchmarkIntervalAsync(elapsedTime, strategies);

        await waitAsync(serviceState.listenerInterval);
        elapsedTime += serviceState.listenerInterval;
    }

    mongoose.connection.close();
    console.log(`Terminating worker...`);
})();

async function onPeekActiveContractsAsync(elapsedTime: number, contracts: Asset[]): Promise<void> {
    const systemBusiness: SystemBusiness = await SystemBusiness.getBusinessAsync();

    for (const contract of contracts) {
        const terms = contract.contract.terms;
        for (const term of terms) {
            if (term.type === TermType.RecurringTransfer && elapsedTime % term.interval === 0) {
                const activities = await ActivityModel.find({ contractTerm: term, status: ActivityStatus.Pending });
                for (const activity of activities) {
                    switch (activity.type) {
                        case ActivityType.Transfer:
                            const transfer = activity.transfer;
                            switch (transfer.type) {
                                case TransferType.ValuesFromOwnerToOwner:
                                    let toOwner: OwnerBusiness;
                                    if (!transfer.toId) {
                                        const candidateOwners = await OwnerModel.find({
                                            type: { "$nin": [OwnerType.System] },
                                            _id: { "$ne": transfer.fromId }
                                        }).exec();

                                        const toOwnerModel = candidateOwners[Math.floor(Math.random() * candidateOwners.length)];
                                        toOwner = await systemBusiness.getUserBusinessAsync(toOwnerModel._id);
                                    } else {
                                        toOwner = await systemBusiness.getUserBusinessAsync(transfer.toId);
                                    }

                                    let fromOwner: OwnerBusiness = systemBusiness;
                                    if (transfer.fromId !== systemBusiness.owner._id) {
                                        fromOwner = await systemBusiness.getUserBusinessAsync(transfer.fromId);
                                    }

                                    await checkAndLogAccounts([fromOwner, toOwner]);
                                    const transferActivity = await fromOwner.transferValueAsync(toOwner, term.recurringTransfer.amount);
                                    await checkAndLogAccounts([fromOwner, toOwner]);
                                    break;
                                default:
                                    break;
                            }

                            break;
                        default: break;
                    }
                }
            }
        }
    }
}

async function checkAndLogAccounts(owners: OwnerBusiness[]): Promise<void> {
    const checkAccountActivities: Activity[] = [];
    let ownerBalanceStr = "";
    for (const owner of owners) {
        const activities = await owner.checkAccountAsync();
        checkAccountActivities.push(...activities);

        ownerBalanceStr += `${owner.owner.name}: ${activities[0].checkAccount.amount} `;
    }

    console.log(ownerBalanceStr);
}

// async function onOrderIntervalAsync(elapsedTime: number, strategies: BaseStrategy[]): Promise<void> {
//     console.log(`Starting order interval. Time elapsed: ${elapsedTime / 1000}s`);

//     for (const strategy of strategies) {
//         if (strategy.isAtBuyInterval(elapsedTime)) {
//             // await strategy.executeAsync();
//         }
//     }
// }

// async function onBenchmarkIntervalAsync(elapsedTime: number, strategies: BaseStrategy[]): Promise<void> {
//     console.log(`Starting benchmark interval. Time elapsed: ${elapsedTime / 1000}s`);

//     for (const strategy of strategies) {
//         await strategy.updateBenchmarkAsync();
//     }
// }