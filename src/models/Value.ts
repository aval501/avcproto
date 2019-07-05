import { Document, Schema, model } from "mongoose";
import { Owner } from "./Owner";
import { Asset } from "./Asset";

enum ValueHolderType {
    Owner = "owner",
    Asset = "asset"
}

interface Value {
    amount: number;
    holderType: ValueHolderType;
    owner?: Owner;
    asset?: Asset;
}

interface ValueDoc extends Value, Document {
}

const ValueSchema = new Schema({
    amount: Number,
    holderType: String,
    owner: { type: Schema.Types.ObjectId, ref: "Owner" },
    asset: { type: Schema.Types.ObjectId, ref: "Asset" }
});

// ValueSchema.index({ meta: 1 });
const ValueModel = model<ValueDoc>("Value", ValueSchema);
export { Value, ValueDoc, ValueHolderType, ValueModel };