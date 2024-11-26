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
import ExperimentManager from "./ExperimentManager.js";
import RepositoryManager from "../repository/RepositoryManager.js";
import cfg from "../envalid.js";
import { printDetail } from "./index.js";

export default class ClientFlagManager {
  repository: RepositoryManager;
  expManager: ExperimentManager;

  constructor() {
    this.repository = new RepositoryManager(cfg.MONGO_API_URI);
    this.expManager = new ExperimentManager(this.repository);
  }

  /**
   * Get the value of a flag to display to a client as well as identifiers 
   * corresponding to the override rule applied, or the flag's own ID. Returns
   * `null` fallback values if no corresponding flag is found or the flag is
   * not enabled in the client's environment.
   */
  async getClientFlagValue(
    flagName: string,
    environmentName: string,
    clientProps: ClientPropMapping
  ): Promise<FlagClientValue> {
    try {
      const flag = await this.repository.featureFlag.findOne({ name: flagName });
      if (!flag || !(environmentName in flag.environmentNames)) throw new Error();

      return this.computeFlagValue(flag, environmentName, clientProps);
    } catch(e: unknown) {
        return { value: null, hash: await this.defaultIdString() };
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
  ): Promise<FlagClientMapping> {
    try {
      const featureFlags = await this.repository.featureFlag.getEnvironmentFlags(environmentName);
    
      const promises = [];
  
      for (let i = 0; i < featureFlags.length; i += 1) {
        const flag = featureFlags[i];
        const promise = this.computeFlagValue(flag, environmentName, clientProps);
        // transform the promise to a tuple of [name, FlagClientValue] upon resolution
        promises.push(promise.then((result) => [flag.name, result]));
      }
  
      const resolve = await Promise.all(promises);
      return Object.fromEntries(resolve);

    } catch (e: unknown) {
      if (e instanceof Error) {
        console.error(e);
      }

      return {};
    }
  }

  private async computeFlagValue(
    flag: FeatureFlag,
    environmentName: string,
    clientProps: ClientPropMapping
  ): Promise<FlagClientValue> {

    const defaultReturn = {
      value: flag.value.initial,
      hash: this.singleIdString(flag.id),
    };
    
    const envRules = FeatureFlagDraft.getEnvironmentRules(flag, environmentName);
    const selectedRule = this.enroll(envRules, clientProps);
    if (selectedRule === undefined) return defaultReturn;
      
    const ruleValue = await this.ruleValueAndHash(selectedRule, flag.id, clientProps);
    return ruleValue ?? defaultReturn;

  }

  /**
   * Attempt to randomly enroll a client in each override rule, in order
   */
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
        hash: this.singleIdString(rule.id),
      };
    } else {
      console.error(`Rule type was invalid!`);
      printDetail({ rule });
      return null;
    }
  }
  
  async defaultIdString() {
    return this.randomIds(3);
  }
  
  singleIdString(id: string) {
    return id + '+' + this.randomIds(2);
  }
  
  async randomIds(count: number) {
    const idArr = new Array(count).fill(null).map(randomUUID);
    return idArr.join('+');
  }
}
