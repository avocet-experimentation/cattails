import {
  FeatureFlag,
  featureFlagSchema,
  OverrideRuleUnion,
} from '@estuary/types';
import { Filter, ObjectId } from 'mongodb';
import MongoRepository from './MongoRepository.js';
import { IRepositoryManager } from './repository-types.js';

export default class FeatureFlagRepository extends MongoRepository<FeatureFlag> {
  constructor(repositoryManager: IRepositoryManager) {
    super('featureFlag', featureFlagSchema, repositoryManager);
  }

  /**
   * Add an override rule. This should fail if the flag doesn't have a property
   * corresponding to the environment name under `.environments`, since that
   * should only happen when the flag isn't enabled on the environment.
   */
  async addRule(rule: OverrideRuleUnion, matcher: Filter<FeatureFlag>) {
    const result = await this.push('overrideRules', rule, matcher);

    return result.acknowledged;
  }

  async addRuleToId(rule: OverrideRuleUnion, id: string) {
    const idMatcher = {
      _id: ObjectId.createFromHexString(id),
    };

    return this.addRule(rule, idMatcher);
  }

  /**
   * (WIP) Remove an override rule given part of its shape, and optionally a flag
   * filter to remove from specific flags only
   */
  async removeRule(
    ruleMatcher: Partial<OverrideRuleUnion>,
    flagMatcher: Filter<FeatureFlag> = {},
  ) {
    const result = await this.pull('overrideRules', ruleMatcher, flagMatcher);

    return result.acknowledged;
  }

  /**
   * (WIP) Remove an override rule from a flag given the flag's id=
   */
  async removeRuleFromId(ruleId: string, flagId: string) {
    const ruleMatcher = {
      id: ruleId,
    };

    const idMatcher = {
      _id: ObjectId.createFromHexString(flagId),
    };

    return this.removeRule(ruleMatcher, idMatcher);
  }

  async getEnvironmentFlags(environment: string) {
    return this.findMany({ [`environments.${environment}.enabled`]: true });
  }
}
