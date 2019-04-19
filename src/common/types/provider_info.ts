
import { markdown } from "./misc";
import { IPerson } from "./person";

export interface IProviderInfo {
  extraInfo: any | IProviderExtraInfo;
  fleetManager: IPerson;
  visibleName: string;
  isBusiness: boolean;
}

export enum EProfileBlacklistItem {
  gender             = "gender",
  dateOfBirth        = "dateOfBirth",
  address            = "address",
  driverLicense      = "driverLicense",
  social             = "social",
  externalIdentifier = "externalIdentifier",
}

export interface IProviderExtraInfo {
  emergencyNumber?: string;
  welcomeText?: markdown;
  logo?: URL;
  helpText?: markdown;
  personProfileBlacklist?: {
    [item in EProfileBlacklistItem]?: boolean;
  }
}
