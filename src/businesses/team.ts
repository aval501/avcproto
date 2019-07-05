import { Owner, OwnerModel, OwnerType } from "../models/Owner";
import { ActivityModel } from "../models/Activity";
import { ActivityType } from "../models/Activity";
import { ActivityStatus } from "../models/Activity";
import { AssetModel } from "../models/Asset";
import { AssetType } from "../models/Asset";
import OwnerBusiness from "./owner";

export default class TeamBusiness extends OwnerBusiness {
    constructor(private _team: Owner) {
        super(_team);
    }
}