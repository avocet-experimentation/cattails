import {
  FeatureFlag,
  featureFlagSchema,
  OverrideRuleUnion,
  RequireOnly,
} from "@estuary/types";
import MongoRepository from "./MongoRepository.js";
import RepositoryManager from "./RepositoryManager.js";
import { Filter, ObjectId } from "mongodb";

export default class FeatureFlagRepository extends MongoRepository<FeatureFlag> {
  constructor(repositoryManager: RepositoryManager) {
    super("FeatureFlag", featureFlagSchema, repositoryManager);
  }
  /**
   * Add an override rule. This should fail if the flag doesn't have a property
   * corresponding to the environment name under `.environments`, since that
   * should only happen when the flag isn't enabled on the environment.
   */
  async addRule(rule: OverrideRuleUnion, matcher: Filter<FeatureFlag>) {
    const result = await this.push(
      `environments.${rule.environmentName}.overrideRules`,
        rule,
        matcher,
    );

    return result.acknowledged;
  }

  async addRuleToId(rule: OverrideRuleUnion, id: string) {
    const idMatcher = {
      _id: ObjectId.createFromHexString(id),
    }

    return this.addRule(rule, idMatcher);
  }
  // /**
  //  * (WIP) Remove an override rule given its id and environment
  //  */
  // async removeRule(
  //   ruleMatcher: RequireOnly<OverrideRuleUnion, 'id' | 'environmentName'>,
  //   flagMatcher: Filter<FeatureFlag> = {},
  // ) {
  //   const result = await this.pull(
  //     `environments.${ruleMatcher.environmentName}.overrideRules`,
  //     ruleMatcher,
  //     flagMatcher,
  //   );

  //   return result.acknowledged;
  // }
  // /**
  //  * (WIP) Remove an override rule from a flag given the flag's id
  //  * todo: replace this placeholder implementation:
  //  * - find the rule array containing `ruleId`
  //  * - get the environment name given the rule array
  //  * - call `pull`
  //  */
  // async removeRuleFromId(
  //   ruleId: string,
  //   flagId: string,
  // ) {
  //   const idMatcher = {
  //     _id: ObjectId.createFromHexString(flagId),
  //   }
  //   // return this.removeRule(ruleMatcher, idMatcher);
  //   const flag = await this.get(flagId);

  //   const newEnvironments: FlagEnvironmentMapping = Object.entries(flag.environments)
  //     .reduce((acc, [envName, envProps]) => {
  //       const ruleIndex = envProps.overrideRules.findIndex((rule) => rule.id === ruleId);
  //       if (ruleIndex !== undefined) envProps.overrideRules.splice(ruleIndex, 1);
  //       return { ...acc, [envName]: envProps };
  //     }, {});

  //   const result = await this.update({
  //     id: flagId,
  //     environments: newEnvironments
  //   });

  //   return result;
  // }

  async getEnvironmentFlags(environment: string) {
    return this.findMany({ [`environments.${environment}.enabled`]: true });
  }
}
