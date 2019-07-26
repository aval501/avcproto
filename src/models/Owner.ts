import { Document, Schema, model } from "mongoose";
import { Value, ValueDoc } from "./Value";
// import { Asset } from "./asset";
// import { Value } from "./value";
// import { Activity } from "./activity";
// import { ContractMeta, ContractMetaSchema, Contract } from "./Contract";

enum OwnerType {
    System = "system",
    Team = "team",
    User = "user"
}

interface Owner {
    _id: any;
    type: OwnerType;
    name: string;
    createdTime: Date;
    modifiedTime: Date;
    memberOf: OwnerDoc[];
    values: {
        amount: number;
        values: Value[];
    };

    members: {
        total: number;
        members: Owner[];
    };
}

interface OwnerDoc extends Owner, Document {
}

const OwnerSchema = new Schema({
    type: String,
    name: String,
    createdTime: Date,
    modifiedTime: Date,
    memberOf: [{ type: Schema.Types.ObjectId, ref: "Id" }],
    // assets: [{ type: Schema.Types.ObjectId, ref: "Asset" }],
    // values: [{ type: Schema.Types.ObjectId, ref: "Value" }],
    // activities: [{ type: Schema.Types.ObjectId, ref: "Activity" }],
    // contracts: [{ type: Schema.Types.ObjectId, ref: "Contract" }],
});

// IdSchema.index({ meta: 1 });
const OwnerModel = model<OwnerDoc>("Owner", OwnerSchema);
export { Owner, OwnerDoc, OwnerType, OwnerModel };