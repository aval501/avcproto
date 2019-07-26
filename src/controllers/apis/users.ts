"use strict";

import graph from "fbgraph";
import { Response, Request, NextFunction } from "express";
import { OwnerModel, OwnerType, Owner, OwnerDoc } from "../../models/Owner";
import { ObjectId } from "mongodb";
import { ValueModel, ValueHolderType, Value } from "../../models/Value";
import SystemBusiness from "../../businesses/system";

export const getUsersAsync = async (req: Request, res: Response) => {
    const userDocs = await OwnerModel.find({ type: OwnerType.User }).exec();
    const users = userDocs.map(doc => doc.toObject());

    res.json(users);
};

export const postUsers = async (req: Request, res: Response) => {
    const userDocs: OwnerDoc[] = req.body;
    if (!userDocs || userDocs.length === 0) {
        res.status(400).send("[ERROR] Invalid request body passed in. Expecting list of users.");
    }

    const systemBiz = await SystemBusiness.getBusinessAsync();

    userDocs.forEach(doc => {
        doc.createdTime = new Date();
        doc.modifiedTime = new Date();
        doc.type = OwnerType.User;
        doc.memberOf = [systemBiz.owner._id];
    });

    const result = await OwnerModel.insertMany(userDocs, (error, docs) => {
        if (!!error) {
            throw `[ERROR] Failed to insert some user: ${error}`;
        }
    });

    res.json(result);
};

export const getUserAsync = async (req: Request, res: Response) => {
    const id: string = req.params["id"];
    const includes: string[] = req.query["include"];

    let user: Owner;
    try {
        user = await OwnerModel.findOne({ type: OwnerType.User, _id: id }).lean();
    } catch (error) {
        user = await OwnerModel.findOne({ type: OwnerType.User, name: id }).lean();
    }

    if (!user) {
        res.status(404).send(`[ERROR] User ID or name not found for requested ID: '${id}'.`);
        return;
    }

    if (!!includes && includes.indexOf("values") >= 0) {
        const values: Value[] = await ValueModel.find({ holderType: ValueHolderType.Owner, owner: user._id }).lean().exec();
        user.values = {
            amount: values.reduce((sum, value) => value.amount, 0),
            values: values
        };
    }

    // const newuser = {};
    // newuser.values = { amount: 10 };

    res.json(user);
};

export const patchUserAsync = async (req: Request, res: Response) => {
    const id: string = req.params["id"];
    if (!ObjectId.isValid(id)) {
        res.status(400).send(`[ERROR] Invalid user ID passed: ${id}`);
        return;
    }

    const userDoc: OwnerDoc = req.body;
    if (!userDoc) {
        res.status(400).send("[ERROR] Invalid request body passed in. Expecting user properties to be updated.");
        return;
    }

    const systemBiz = await SystemBusiness.getBusinessAsync();
    const userBiz = await systemBiz.getUserBusinessAsync(id);
    if (!userBiz) {
        res.status(404).send(`[ERROR] Couldn't find any user with id: ${id}`);
        return;
    }

    userDoc.modifiedTime = new Date();

    const result = await OwnerModel.findByIdAndUpdate(id, userDoc, (error, doc) => {
        if (!!error) {
            throw `[ERROR] Failed to update user. ID: ${id}, Body: ${req.body}`;
        }
    }).exec();

    // const result = await OwnerModel.insertMany(userDocs, (error, docs) => {
    //     if (!!error) {
    //         throw `[ERROR] Failed to insert some user: ${error}`;
    //     }
    // });

    res.json(result);
};