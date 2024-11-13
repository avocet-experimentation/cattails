import { FeatureFlag, featureFlagSchema, OverrideRule } from "@estuary/types";
import MongoRepository from "./MongoRepository.js";

export default class FeatureFlagRepository extends MongoRepository<FeatureFlag> {
  constructor(mongoUri: string) {
    super('flags', featureFlagSchema, mongoUri);
  }
  /**
   * Add an override rule 
   */
  async addRule(flagId: string, environment: string, rule: OverrideRule) {
    const result = await this.push({ 
      id: flagId, 
      [`environments.${environment}.overrideRules`]: rule,
    });
    return result;
  }

  async getEnvironmentFlags(environment: string) {
    return this.findMany({ [`environments.${environment}.enabled`]: true });
  }
}
