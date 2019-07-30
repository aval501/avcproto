import { Document, Schema, model } from "mongoose";
import { Owner } from "./Owner";
import { Value } from "./Value";
import { Activity } from "./Activity";
import { ContractTerm, ContractTermSchema } from "./ContractTerm";

enum AssetType {
    Contract = "contract",
    Board = "board",
    Post = "post",
    Comment = "comment",
    Expression = "expression"
}

enum ContractStatus {
    Active = "active",
    Expired = "expired",
    Fulfilled = "fulfilled",
    Terminated = "terminated"
}

interface ContractAsset {
    title: string;
    summary: string;
    status: ContractStatus;
    terms: ContractTerm[];
    expireDate: Date;
}

const ContractAssetSchema = new Schema({
    title: String,
    summary: String,
    status: String,
    terms: [ContractTermSchema],
    expireDate: Date
});

interface BoardAsset {
    name: string;
    description: string;
}

const BoardAssetSchema = new Schema({
    name: String,
    description: String
});

interface PostAsset {
    content: string;
}

const PostAssetSchema = new Schema({
    content: String
});

interface CommentAsset {
    content: string;
}

const CommentAssetSchema = new Schema({
    content: String
});

enum ExpressionType {
    Worth = "worth",
    NotWorth = "notworth"
}

interface ExpressionAsset {
    type: ExpressionType;
}

const ExpressionAssetSchema = new Schema({
    type: String
});

interface Asset extends Document {
    type: AssetType;
    createdTime: Date;
    modifiedtime: Date;
    owner: Owner;
    parent: Asset;
    board?: BoardAsset;
    post?: PostAsset;
    comment?: CommentAsset;
    expression?: ExpressionAsset;
    contract?: ContractAsset;
}

const AssetSchema = new Schema({
    type: String,
    createdTime: Date,
    modifiedtime: Date,
    owner: { type: Schema.Types.ObjectId, ref: "Owner" },
    parent: { type: Schema.Types.ObjectId, ref: "Asset" },
    board: BoardAssetSchema,
    post: PostAssetSchema,
    comment: CommentAssetSchema,
    expression: ExpressionAssetSchema,
    contract: ContractAssetSchema
});

// AssetSchema.index({ meta: 1 });
const AssetModel = model<Asset>("Asset", AssetSchema);
export { Asset, PostAsset, BoardAsset, CommentAsset, ExpressionAsset, ContractAsset, AssetType, ExpressionType, ContractStatus, AssetModel };