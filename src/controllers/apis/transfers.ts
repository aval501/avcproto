"use strict";

import { Response, Request, NextFunction } from "express";
import { ActivityModel, ActivityType, Activity, TransferType } from "../../models/Activity";
import { AssetType } from "../../models/Asset";
import SystemBusiness from "../../businesses/system";
import { Owner } from "../../models/Owner";

export const getTransfersAsync = async (req: Request, res: Response) => {
    const activities = await ActivityModel.find({ type: ActivityType.Transfer }).exec();
    res.json(activities);
};

interface TransferRequest {
    type: TransferType;
    from: string; // support Object ID and name
    to: string; // support Object ID and name
    amount?: number;
    assetIds?: string[];
}

export const postTransfersAsync = async (req: Request, res: Response) => {
    const transfers: Activity[] = req.body;
    if (!transfers || !transfers.length || transfers.length === 0) {
        res.status(400).send("[ERROR] Invalid request body passed in. Expecting list of transfers.");
    }

    const systemBiz = await SystemBusiness.getBusinessAsync();

    const result: {
        requested: number,
        success: number,
        failed: Activity[]
    } = {
        requested: transfers.length,
        success: 0,
        failed: []
    };

    // for (const transfer of transfers) {
    //     transfer.
    //     const userBiz = await systemBiz.createUserAsync(userDoc.name);
    //     if (!userBiz) {
    //         result.failed.push(userDoc);
    //     } else {
    //         result.success += 1;
    //     }
    // }

    res.json(result);
};

export const getTransferAsync = (req: Request, res: Response) => {
    throw Error("not implemented yet.");
};