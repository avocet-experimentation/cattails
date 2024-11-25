import {
  ClientPropMapping,
  FeatureFlag,
  FeatureFlagDraft,
  FlagClientMapping,
  FlagClientValue,
  FlagCurrentValue,
  forcedValueSchema,
  OverrideRuleUnion,
} from "@estuary/types";
import { hashAndCompare } from "./hash.js";
import { randomUUID } from "crypto";
// import * as bcrypt from 'bcrypt';
import ExperimentManager from "./ExperimentManager.js";
import RepositoryManager from "../repository/RepositoryManager.js";
import cfg from "../envalid.js";

export default class ClientFlagManager {
  repository: RepositoryManager;
  expManager: ExperimentManager;

  constructor() {
    this.repository = new RepositoryManager(cfg.MONGO_API_URI);
    this.expManager = new ExperimentManager(this.repository);
  }

  /*
  given a flag name and client attributes:
  - fetch the flag
  - (later) check if the flag is enabled on the environment
  - (later) narrow down to just identifier attributes
  - iterate through the rules on the flag to select one:
    - check its enrollment.attributes array to select the identifiers to use
    - hash the selected identifiers, normalize to the bounds, then compare against 
      enrollment.proportion
  - if a rule was selected:
    - if the rule is an experiment:
      - use the Experiment Manager to:
        - get the current flag state
        - hash the current treatment
      - get the right flag value by matching flag IDs
    - else:
      - get the flag value from rule.value
      - hash the flag's ID
  - else:
    - get the flag's default value
    - hash the flag's ID
   */
  /**
   * Get the value of a flag to display to a client as well as identifiers 
   * corresponding to the override rule applied, or the flag's own ID. Returns
   * `null` as a fallback value if no corresponding flag is found.
   */
  async getClientFlagValue(
    flagName: string,
    environmentName: string,
    clientProps: ClientPropMapping
  ): Promise<FlagClientValue | null> {
    try {
      const flag = await this.repository.featureFlag.findOne({ name: flagName });
      if (!flag || !flag.environmentNames.includes(environmentName)) throw new Error();

      return this.computeFlagValue(flag, environmentName, clientProps);
    } catch(e: unknown) {
      // if (e instanceof Error) {
        return null;
        // return { value: null, hash: this.defaultIdHash() }; // todo: obscure flag find success/failure by returning this object instead
      // }
    }
  }

  /**
   * Gets client values for every flag in the specified environment
   * 
   * todo:
   * - take a client API key instead of an environment name, then:
   *   - fetch SDK connections
   *   - find one that corresponds to the received key
   *   - return null if none match
   *   - else get the environment for that connection
   */
  async environmentFlagValues(
    environmentName: string,
    clientProps: ClientPropMapping
  ): Promise<FlagClientMapping | null> {
    try {
      const featureFlags = await this.repository.featureFlag.getEnvironmentFlags(environmentName);
      // printDetail({ featureFlags });
      // console.log({ overrideRules: fflags[0].environments.dev?.overrideRules });
    
      const promises = [];
  
      for (let i = 0; i < featureFlags.length; i += 1) {
        const flag = featureFlags[i];
        const promise = this.computeFlagValue(flag, environmentName, clientProps);
        // transform the promise to a tuple of [name, FlagClientValue] upon resolution
        promises.push(promise.then((result) => [flag.name, result]));
      }
  
      const resolve = await Promise.all(promises);
      console.log({resolve});
      return Object.fromEntries(resolve);

    } catch (e: unknown) {
      return null;
    }
  }

  private async computeFlagValue(
    flag: FeatureFlag,
    environmentName: string,
    clientProps: ClientPropMapping
  ): Promise<FlagClientValue> {
    // define a fallback
    const defaultReturn = {
      value: flag.value.initial,
      hash: this.defaultIdHash(flag.id),
    };
    
    const envRules = FeatureFlagDraft.getEnvironmentRules(flag, environmentName);
    const selectedRule = this.enroll(envRules, clientProps);
    if (selectedRule === undefined) return defaultReturn;
      
    const ruleValue = await this.ruleValueAndHash(selectedRule, flag.id, clientProps);
    return ruleValue ?? defaultReturn;

  }

  // random enrollment in a rule such as an experiment
  private enroll(
    overrideRules: OverrideRuleUnion[],
    clientProps: ClientPropMapping
  ): OverrideRuleUnion | undefined {
    return overrideRules.find((rule) => {
      if (!this.ruleInEffect(rule)) return false;
  
      const propsToHash = rule.enrollment.attributes;
      const identifiers = Object.entries(clientProps)
        .filter(([key]) => propsToHash.includes(key));

      return hashAndCompare(identifiers, rule.enrollment.proportion);
    });
  }

  /**
   * Returns true if a rule is active and either there are no start/end timestamps,
   * or the current time is in the range defined by them
   */
  private ruleInEffect(rule: OverrideRuleUnion): boolean {
    if (rule.status !== 'active') return false;
    const startTime = rule.startTimestamp ?? 0;
    const endTime = rule.endTimestamp ?? Infinity;
    const currentTime = Date.now();
    return startTime <= currentTime && currentTime < endTime;
  }

  private async ruleValueAndHash(
    rule: OverrideRuleUnion,
    flagId: string,
    identifiers: ClientPropMapping
  ): Promise<{
    value: FlagCurrentValue,
    hash: string,
  } | null> {
    if (rule.type === 'ExperimentReference') {
      const result = await this.expManager.getTreatmentAndHash(rule, identifiers);
      if (result === null) return null;
      const { treatment, hash } = result;
      const match = treatment.flagStates.find(({ id }) => id === flagId);
      if (match === undefined) {
        const msg = [
          `Failed to find a flag state with id ${flagId} on treatment ${treatment.id}`,
          `The experiment ${rule.id} was stored on the flag!`,
        ];
        throw new Error(msg.join('. '));
      }

      return { value: match.value, hash };
    } else if (rule.type === 'ForcedValue') {
      return {
        value: forcedValueSchema.parse(rule).value,
        hash: this.defaultIdHash(flagId),
      };
    } else {
      console.error(`Rule type was invalid!`);
      console.error(rule);
      return null;
    }
  }
  
  async randomIdHash() {
    return randomUUID() + '+' + this.randomIds(2);
  }
  
  
  defaultIdHash(flagId: string) {
    return flagId + '+' + this.randomIds(2);
  }
  
  async randomIds(count: number) {
    const idArr = new Array(count).fill(null).map(randomUUID);
    return idArr.join('+');
  }
}
