import { FeatureFlag, featureFlagSchema, OverrideRule } from "@estuary/types";
import MongoRepository from "./MongoRepository.js";
import { BeforeId, PartialUpdate } from "./MongoRepository.types.js";
import { Filter, ObjectId } from "mongodb";

export class FeatureFlagRepository extends MongoRepository<FeatureFlag> {
  constructor(mongoUri: string) {
    super('flags', featureFlagSchema, mongoUri);
  }
  /**
   * Add a rule 
   */
    async addRule(flagId: string, environmentName: string, rule: OverrideRule) {
      const result = await this.push({ 
        id: flagId, 
        [`environments.${environmentName}.overrideRules`]: rule,
      });
      return result;
    }
}
