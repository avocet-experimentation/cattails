import { User, UserDraft } from "@estuary/types";

export const staticUser: UserDraft = {
  "email": "testuser@example.com",
  "permissions": {
    "featureFlag": "view",
    "experiment": "edit",
    "environment": "none",
    "clientPropDef": "full",
    "clientConnection": "view",
    "user": "edit"
  }
}
