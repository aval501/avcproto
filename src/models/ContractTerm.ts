import { Document, Schema, model } from "mongoose";
import { Activity } from "./Activity";
import { Asset } from "./Asset";

enum TermType {
    RecurringTransfer = "recurringTransfer"
}

enum TermStatus {
    Proposed = "proposed",
    Agreed = "agreed",
    ReviewRequested = "reviewRequested",
    Fulfilled = "fulfilled",
    Rejected = "rejected"
}

interface RecurringTransfer {
    value: number;
}

const RecurringTransferSchema = new Schema({
    value: Number
});

interface ContractTerm {
    description: string;
    type: TermType;
    interval: number;
    status: TermStatus;
    recurringTransfer: RecurringTransfer;
}

interface ContractTermDoc extends ContractTerm, Document {
}

const ContractTermSchema = new Schema({
    description: String,
    type: String,
    interval: Number,
    status: String,
    recurringTransfer: RecurringTransferSchema
});

// AssetSchema.index({ meta: 1 });
const ContractTermModel = model<ContractTermDoc>("ContractTerm", ContractTermSchema);
export { ContractTerm, TermType, TermStatus, ContractTermSchema, ContractTermModel };