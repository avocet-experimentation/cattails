import { ClientPropDef, ClientPropDefDraft } from "@estuary/types";

export const staticClientPropDefs: ClientPropDefDraft[] = [
  {
    name: 'id',
    dataType: 'string',
    isIdentifier: true,
  },
  {
    name: 'version',
    dataType: 'number',
    isIdentifier: false,
  },
]