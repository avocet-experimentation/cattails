import {
  ClientPropMapping,
  ClientSDKFlagValue,
  OverrideRuleUnion,
  ForcedValue,
  Experiment,
} from '@avocet/core';
import { randomUUID } from 'crypto';
import { hashAndCompare } from './hash.js';
import ExperimentManager from './ExperimentManager.js';

export default class ClientFlagManager {
  static ruleValueAndMetadata(
    rule: ForcedValue | Experiment,
    flagId: string,
    identifiers: ClientPropMapping,
  ): ClientSDKFlagValue | null {
    if (rule.type === 'Experiment') {
      const result = ExperimentManager.getTreatmentAndIds(rule, identifiers);
      if (result === null) return null;
      const { treatment, metadata } = result;
      const match = treatment.flagStates.find(({ id }) => id === flagId);
      if (match === undefined) {
        const msg = [
          `Failed to find a flag state with id ${flagId} on treatment ${treatment.id}`,
          `The experiment ${rule.id} was stored on the flag!`,
        ];
        throw new Error(msg.join('. '));
      }

      return { value: match.value, metadata };
    }
    if (rule.type === 'ForcedValue') {
      return {
        value: rule.value,
        metadata: ClientFlagManager.singleIdString(rule.id),
      };
    }
    throw new TypeError(
      `Rule type was not accounted for! ${JSON.stringify(rule)}`,
    );
  }

  /**
   * Attempt to enroll a client in one of the passed override rules, testing
   * enrollment one rule at a time in the order they were stored on the flag
   */
  static enroll(
    overrideRules: OverrideRuleUnion[],
    clientProps: ClientPropMapping,
  ): OverrideRuleUnion | undefined {
    return overrideRules.find((rule) => {
      if (!this.ruleInEffect(rule)) return false;

      const propsToHash = rule.enrollment.attributes;
      const identifiers = Object.entries(clientProps).filter(([key]) =>
        propsToHash.includes(key));

      return hashAndCompare(identifiers, rule.enrollment.proportion);
    });
  }

  /**
   * Returns true if a rule is active and either there are no start/end timestamps,
   * or the current time is in the range defined by them
   */
  private static ruleInEffect(rule: OverrideRuleUnion): boolean {
    if (rule.status !== 'active') return false;
    const startTime = rule.startTimestamp ?? 0;
    const endTime = rule.endTimestamp ?? Infinity;
    const currentTime = Date.now();
    return startTime <= currentTime && currentTime < endTime;
  }

  static defaultIdString() {
    return this.randomIds(3);
  }

  static singleIdString(id: string) {
    return `${id}+${this.randomIds(2)}`;
  }

  static randomIds(count: number) {
    const idArr = new Array(count).fill(null).map(() => randomUUID());
    return idArr.join('+');
  }
}
