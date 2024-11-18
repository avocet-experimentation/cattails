import { ClientPropMapping, EnvironmentName, experimentSchema, FeatureFlag, FlagClientMapping, FlagClientValue, FlagCurrentValue, forcedValueSchema, OverrideRule, OverrideRuleUnion } from "@estuary/types";
import env from "../envalid.js";
import ExperimentRepository from "../repository/ExperimentRepository.js";
import FeatureFlagRepository from "../repository/FeatureFlagRepository.js";
import { hashAndCompare, hashIdentifiers, hashStringDJB2, hashStringSet } from "./hash.js";
import { randomUUID } from "crypto";
import * as bcrypt from 'bcrypt';
import { ExperimentManager } from "./ExperimentManager.js";

const PLACEHOLDER_ENVIRONMENT = 'dev';

export default class ClientFlagManager {
  flags: FeatureFlagRepository;
  expManager: ExperimentManager;

  constructor() {
    this.flags = new FeatureFlagRepository(env.MONGO_API_URI);
    this.expManager = new ExperimentManager();
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
  async currentFlagValue(
    flagName: string,
    EnvironmentName: EnvironmentName,
    clientProps: ClientPropMapping
  ): Promise<FlagClientValue | null> {
    const flag = await this.flags.findOne({ name: flagName });
    if (!flag) return null;

    return this.computeFlagValue(flag, EnvironmentName, clientProps);
  }

  /**
   * Gets currentFlagValue for every flag in the specified environment
   * 
   * todo:
   * - take a client API key instead of an environment name, then:
   *   - fetch SDK connections
   *   - find one that corresponds to the received key
   *   - return null if none match
   *   - else get the environment for that connection
   */
  async environmentFlagValues(
    environmentName: EnvironmentName,
    clientProps: ClientPropMapping
  ): Promise<FlagClientMapping | null> {
    const featureFlags = await this.flags.getEnvironmentFlags(environmentName);
    if (!featureFlags) {
      return null;
    }
  
    // printDetail({ featureFlags });
    // console.log({ overrideRules: fflags[0].environments.dev?.overrideRules });
  
    const promises = [];
    let mapping: FlagClientMapping = {};
    for (let i = 0; i < featureFlags.length; i += 1) {
      const flag = featureFlags[i];
      const promise = this.computeFlagValue(flag, PLACEHOLDER_ENVIRONMENT, clientProps);
      // transform the promise to a tuple of [name, FlagClientValue] upon resolution
      promises.push(promise.then((result) => [flag.name, result]));
    }

    const resolve = await Promise.all(promises);
    console.log({resolve});
    return Object.fromEntries(resolve);
    
  }

  private async computeFlagValue(
    flag: FeatureFlag,
    EnvironmentName: EnvironmentName,
    clientProps: ClientPropMapping
  ): Promise<FlagClientValue> {
    // define a fallback
    const defaultReturn = { value: flag.value.initial, hash: await this.randomHash() };

    if (flag.environments[EnvironmentName] === undefined) {
      return defaultReturn;
    }

    const overrideRules = flag.environments[EnvironmentName].overrideRules;
    const selectedRule = this.enroll(overrideRules, clientProps);
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
        hash: await this.randomHash(),
      };
    } else {
      console.error(`Rule type was invalid!`);
      console.error(rule);
      return null;
    }
  }
  
  async randomHash() {
    return bcrypt.hash(randomUUID(), env.SALT_ROUNDS);
  }
}


