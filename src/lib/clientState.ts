/**
 * Store a record of client identifier hashes and their corresponding flag value assignments based on override rules
 */

import { FeatureFlag, OverrideRule } from "@fflags/types";

interface ClientFlagOverride {
  flagId: string;
  valueType: FeatureFlag['valueType'];
  overrideValue: string;
}

interface ClientRuleMapping {
  [clientIdentifierHash: string]: ClientFlagOverride[]
}
export default class ClientState {
  clients: ClientRuleMapping;

  constructor() {
    this.clients = {};
  }

  /**
   * Recalculate client values
   */
  refresh() {

  }
}

// export function 