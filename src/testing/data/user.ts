import { User, UserDraft } from "@estuary/types";

export const staticUser: UserDraft = {
  "email": "testuser@example.com",
  "permissions": {
    "FeatureFlag": "view",
    "Experiment": "edit",
    "Environment": "none",
    "ClientPropDef": "full",
    "ClientConnection": "view",
    "User": "edit"
  }
}
