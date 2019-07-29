"use strict";

import graph from "fbgraph";
import { Response, Request, NextFunction } from "express";
import { AssetModel, AssetType, Asset, PostAsset, BoardAsset } from "../../models/Asset";
import SystemBusiness from "../../businesses/system";

export const getBoardsAsync = async (req: Request, res: Response) => {
    const boardDocs = await AssetModel.find({ type: AssetType.Board }).exec();
    const boards = boardDocs.map(doc => doc.toObject());

    res.json(boards);
};

// TODO: need to revisit. user create a board, but the parent should be the team. So does that mean team should create?
export const postBoardsAsync = async (req: Request, res: Response) => {
    const board: BoardAsset = req.body;
    if (!board || !board.name) {
        res.status(400).send("[ERROR] Invalid request body passed in. Expecting 'name'.");
    }

    // TODO: replace by token identity.
    const ownerId = req.body["ownerId"];

    const systemBiz = await SystemBusiness.getBusinessAsync();
    const ownerBiz = await systemBiz.getUserBusinessAsync(ownerId);
    const createBoardActivities = await systemBiz.createBoardAsync(ownerBiz.owner);
    // systemBiz.
    // const teamBiz = await systemBiz.

    res.json(createBoardActivities);
};

export const getBoard = (req: Request, res: Response) => {
    const id: string = req.params["id"];
    const includes: string[] = req.query["include"];

    // const systemBiz = await SystemBusiness.getBusinessAsync();
    // systemBiz.get
};

export const patchBoard = (req: Request, res: Response) => {
    throw Error("not implemented yet.");
};

export const postPosts = (req: Request, res: Response) => {
    throw Error("not implemented yet.");
};

export const getPost = (req: Request, res: Response) => {
    throw Error("not implemented yet.");
};

export const patchPost = (req: Request, res: Response) => {
    throw Error("not implemented yet.");
};