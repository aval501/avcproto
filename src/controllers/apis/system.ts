"use strict";

import graph from "fbgraph";
import { Response, Request, NextFunction } from "express";
import { Owner, OwnerModel } from "../../models/Owner";
import SystemBusiness from "../../businesses/system";
import { Value, ValueModel, ValueHolderType } from "../../models/Value";

export const getSystemAsync = async (req: Request, res: Response) => {
    const includes: string[] = req.query["include"];

    const systemBiz = await SystemBusiness.getBusinessAsync();
    const system = systemBiz.owner;

    if (!!includes && includes.indexOf("values") >= 0) {
        const values: Value[] = await ValueModel.find({ holderType: ValueHolderType.Owner, owner: system._id }).lean().exec();
        system.values = {
            amount: values.reduce((sum, value) => value.amount, 0),
            values: values
        };
    }

    if (!!includes && includes.indexOf("members") >= 0) {
        const members: Owner[] = await OwnerModel.find({ "memberOf": system._id }).lean().exec();
        system.members = {
            total: members.length,
            members: members
        };
    }

    res.json(system);
};