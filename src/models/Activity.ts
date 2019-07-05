import { Document, Schema, model } from "mongoose";
import { Owner } from "./Owner";
import { Value } from "./Value";
import { Asset } from "./Asset";
import { ContractTerm } from "./ContractTerm";

enum ActivityType {
    Create = "create",
    Transfer = "transfer"
}

enum ActivityStatus {
    Pending = "pending",
    Canceled = "canceled",
    Failed = "failed",
    Completed = "completed"
}

interface CreateOwnerActivity {
    id: string;
    name: string;
    type: string;
    memberOfIds: string[];
}

const CreateOwnerActivitySchema = new Schema({
    id: String,
    name: String,
    type: String,
    memberOfIds: [String]
});

interface CreateAssetActivity {
    id: string;
    type: string;
    parentId: string;
    ownerId: string;
}

const CreateAssetActivitySchmea = new Schema({
    id: String,
    type: String,
    parentId: String,
    ownerId: String
});

enum TransferType {
    AssetsFromOwnerToOwner = "assetFromOwnerToOwner",
    ValuesFromAssetToOwner = "valuesFromAssetToOwner",
    ValuesFromOwnerToOwner = "valuesFromOwnerToOwner",
    ValuesFromOwnerToAsset = "valuesFromOwnerToAsset"
}

interface TransferActivity {
    type: TransferType;
    fromId: string;
    toId: string;
    ids: string[];
}

const TransferActivitySchema = new Schema({
    type: String,
    fromId: String,
    toId: String,
    ids: [String]
});

interface Activity extends Document {
    type: ActivityType;
    timestamp: Date;
    status: ActivityStatus;
    owner: Owner;
    contractTerm: ContractTerm;
    value: Value;
    create?: {
        owner?: CreateOwnerActivity;
        asset?: CreateAssetActivity;
    };
    transfer?: TransferActivity;
    post?: {};
    comment?: {};
    evaluate?: {};
}

const ActivitySchema = new Schema({
    type: String,
    timestamp: Date,
    status: String,
    owner: { type: Schema.Types.ObjectId, ref: "Owner" },
    contractTerm: { type: Schema.Types.ObjectId, ref: "ContractTerm" },
    value: { type: Schema.Types.ObjectId, ref: "Value" },
    create: {
        owner: CreateOwnerActivitySchema,
        asset: CreateAssetActivitySchmea
    },
    transfer: TransferActivitySchema
});

// ActivitySchema.index({ meta: 1 });
const ActivityModel = model<Activity>("Activity", ActivitySchema);
export { Activity, ActivityType, ActivityStatus, TransferType, ActivityModel };