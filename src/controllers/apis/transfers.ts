"use strict";

import { Response, Request, NextFunction } from "express";
import { ActivityModel, ActivityType, Activity, TransferType } from "../../models/Activity";
import { AssetType } from "../../models/Asset";
import SystemBusiness from "../../businesses/system";
import { Owner } from "../../models/Owner";
import { transformFile } from "@babel/core";
import { assertModuleDeclaration } from "babel-types";

export const getTransfersAsync = async (req: Request, res: Response) => {
    const activities = await ActivityModel.find({ type: ActivityType.Transfer }).exec();
    res.json(activities);
};

interface TransferRequest {
    type: TransferType;
    from: string; // TODO: to be replaced by token identity.
    to: string; // support Object ID and name
    amount?: number;
    assetIds?: string[];
}

export const postTransfersAsync = async (req: Request, res: Response) => {
    const transfer: TransferRequest = req.body;
    if (!transfer || !transfer.to || (!transfer.amount && !transfer.assetIds)) {
        res.status(400).send("[ERROR] Invalid request body passed in. Expecting 'from', 'to', and 'amount' or 'assetIds'.");
    }

    const systemBiz = await SystemBusiness.getBusinessAsync();
    const fromUserBiz = await systemBiz.getUserBusinessAsync(transfer.from);
    const toUserBiz = await systemBiz.getUserBusinessAsync(transfer.to);

    let result: Activity[];
    if (!!transfer.amount) {
        result = await fromUserBiz.transferValueAsync(toUserBiz, transfer.amount);
    } else if (!!transfer.assetIds) {
        // fromUserBiz.transferAssetsAsync(toUserBiz, transfer.assetIds);
    }

    res.json(result);
};

export const getTransferAsync = (req: Request, res: Response) => {
    throw Error("not implemented yet.");
};