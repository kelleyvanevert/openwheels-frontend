
import { datetime } from "./misc";
import { IPerson } from "./person";

export interface InviteRequest {
  id: number
  status: "invited" | "accepted" | "revoked" | "declined"
  contract: { id: number }
  createdAt: datetime
  recipient: IPerson
  sender: IPerson
}
