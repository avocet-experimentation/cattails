import {
  Experiment,
  experimentSchema,
  FeatureFlag,
  featureFlagSchema,
  OverrideRule,
} from "@estuary/types";
import MongoRepository from "./MongoRepository.js";

export default class FeatureFlagRepository extends MongoRepository<
  FeatureFlag,
  typeof featureFlagSchema
> {
  constructor(mongoUri: string) {
    super("FeatureFlag", featureFlagSchema, mongoUri);
  }
  /**
   * Add an override rule
   */
  async addRule(flagId: string, environment: string, rule: OverrideRule) {
    const result = await this.push(
      flagId,
      `environments.${environment}.overrideRules`,
        rule,
    );
    return result;
  }
  /**
   * (WIP) Remove an override rule
   */
  async removeRule(flagId: string, environment: string, rule: OverrideRule) {
    const result = await this.pull(
      flagId,
      `environments.${environment}.overrideRules`,
        rule,
    );
    return result;
  }

  async getEnvironmentFlags(environment: string) {
    return this.findMany({ [`environments.${environment}.enabled`]: true });
  }
}
