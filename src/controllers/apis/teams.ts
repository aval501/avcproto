"use strict";

import graph from "fbgraph";
import { Response, Request, NextFunction } from "express";
import { OwnerModel, OwnerType, OwnerDoc, Owner } from "../../models/Owner";
import SystemBusiness from "../../businesses/system";
import { Value, ValueModel, ValueHolderType } from "../../models/Value";
import { ObjectId } from "mongodb";

export const getTeamsAsync = async (req: Request, res: Response) => {
    const userDocs = await OwnerModel.find({ type: OwnerType.Team }).exec();
    const users = userDocs.map(doc => doc.toObject());

    res.json(users);
};

export const postTeamsAsync = async (req: Request, res: Response) => {
    const teamDocs: OwnerDoc[] = req.body;
    if (!teamDocs || !teamDocs.length || teamDocs.length === 0) {
        res.status(400).send("[ERROR] Invalid request body passed in. Expecting list of teams.");
    }

    const systemBiz = await SystemBusiness.getBusinessAsync();

    const result: {
        requested: number,
        success: number,
        failed: OwnerDoc[]
    } = {
        requested: teamDocs.length,
        success: 0,
        failed: []
    };

    for (const teamDoc of teamDocs) {
        const teamBiz = await systemBiz.createTeamAsync(teamDoc.name);
        if (!teamBiz) {
            result.failed.push(teamDoc);
        } else {
            result.success += 1;
        }
    }

    res.json(result);
};

export const getTeamAsync = async (req: Request, res: Response) => {
    const id: string = req.params["id"];
    const includes: string[] = req.query["include"];

    let team: Owner;
    try {
        team = await OwnerModel.findOne({ type: OwnerType.Team, _id: id }).lean();
    } catch (error) {
        team = await OwnerModel.findOne({ type: OwnerType.Team, name: id }).lean();
    }

    if (!team) {
        res.status(404).send(`[ERROR] Team ID or name not found for requested ID: '${id}'.`);
        return;
    }

    if (!!includes && includes.indexOf("values") >= 0) {
        const values: Value[] = await ValueModel.find({ holderType: ValueHolderType.Owner, owner: team._id }).lean().exec();
        team.values = {
            amount: values.reduce((sum, value) => value.amount, 0),
            values: values
        };
    }

    if (!!includes && includes.indexOf("members") >= 0) {
        const members: Owner[] = await OwnerModel.find({ "memberOf": team._id }).lean().exec();
        team.members = {
            total: members.length,
            members: members
        };
    }

    res.json(team);
};

export const patchTeamAsync = async (req: Request, res: Response) => {
    const id: string = req.params["id"];
    if (!ObjectId.isValid(id)) {
        res.status(400).send(`[ERROR] Invalid team ID passed: ${id}`);
        return;
    }

    const teamDoc: OwnerDoc = req.body;
    if (!teamDoc) {
        res.status(400).send("[ERROR] Invalid request body passed in. Expecting team properties to be updated.");
        return;
    }

    const systemBiz = await SystemBusiness.getBusinessAsync();
    const teamBiz = await systemBiz.getTeamBusinessAsync(id);
    if (!teamBiz) {
        res.status(404).send(`[ERROR] Couldn't find any team with id: ${id}`);
        return;
    }

    teamDoc.modifiedTime = new Date();

    const result = await OwnerModel.findByIdAndUpdate(id, teamDoc, (error, doc) => {
        if (!!error) {
            throw `[ERROR] Failed to update team. ID: ${id}, Body: ${req.body}`;
        }
    }).exec();

    res.json(result);
};