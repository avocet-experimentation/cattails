import {
  ClientPropMapping,
  EnvironmentName,
  Experiment,
  ExperimentBlock,
  experimentBlockSchema,
  ExperimentGroup,
  experimentGroupSchema,
  experimentSchema,
  FeatureFlag,
  FlagClientValue,
  FlagCurrentValue,
  forcedValueSchema,
  OverrideRule
} from "@estuary/types";
import { combineIds, hashAndAssign, hashIdentifiers, hashStringDJB2, hashStringSet } from "./hash.js";
import { randomUUID } from "crypto";

/**
 * Functions for determining what the value of a flag should be set to on a given client
 */


/**
 * Checks each override rule on the flag, returning a value for the first rule that matches.
 * Uses the flag's default value as a fallback.
 * 
 * todo:
 * - permit defining attributes as identifiers or not, then filter for only identifiers
 */
export function currentFlagValue(
  flag: FeatureFlag,
  environment: EnvironmentName,
  attributes: ClientPropMapping
): FlagClientValue {
  const defaultHash = randomHash();
  const defaultReturn = { value: flag.value.default, hash: defaultHash };
  const overrideRules = flag.environments[environment]?.overrideRules;
  if (!overrideRules) return defaultReturn;

  const clientIdHash = hashIdentifiers(attributes);
  const selectedRule = enroll(overrideRules, clientIdHash);
  if (selectedRule === undefined) return defaultReturn;

  return getValueFromRule(selectedRule, attributes) ?? defaultReturn;
}

// random enrollment
function enroll(overrideRules: OverrideRule[], hash: number) {
  return overrideRules.find((rule) => {
    return ruleInEffect(rule) 
    && (rule.enrollment.proportion === 1 
    || hash < rule.enrollment.proportion);
  });
}

/**
 * Returns true if a rule is active and either there are no start/end timestamps,
 * or the current time is in the range defined by them
 */
function ruleInEffect(rule: OverrideRule): boolean {
  if (rule.status !== 'active') return false;
  const startTime = rule.startTimestamp ?? 0;
  const endTime = rule.endTimestamp ?? Infinity;
  const currentTime = Date.now();
  return startTime <= currentTime && currentTime < endTime;
}

function getValueFromRule(rule: OverrideRule, identifiers: ClientPropMapping) {
  if (rule.type === 'Experiment') {
    const group = getGroupAssignment(experimentSchema.parse(rule), identifiers);
    const block = getBlockAssignment(group);
    const experimentIdHash = expIdHash(rule, group, block);
    return { value: block.flagValue, hash: experimentIdHash };
  } else if (rule.type === 'ForcedValue') {
    return { value: forcedValueSchema.parse(rule).value, hash: randomHash() };
  }
}

/**
 * Assigns a user to an experimental group
 * todo:
 * - only pass identifiers listed on enrollment.attributes into the hash function
 */
function getGroupAssignment(experiment: Experiment, identifiers: ClientPropMapping): ExperimentGroup {
  const { groups } = experiment;
  const groupIds = groups.map((group) => group.id);
  const assignmentGroupId = hashAndAssign(identifiers, groupIds);
  const assignedGroup = groups.find((group) => group.id === assignmentGroupId);
  return experimentGroupSchema.parse(assignedGroup);
}
/**
 * Given an assigned experimental group, determines which block is currently applied to the group
 */
function getBlockAssignment(group: ExperimentGroup): ExperimentBlock {
  const now = Date.now();

  const concurrent = group.blocks.find(({ startTimestamp, endTimestamp }) => {
    return startTimestamp 
      && startTimestamp <= now
      && (!endTimestamp || endTimestamp > now);
  });

  return experimentBlockSchema.parse(concurrent);
}

const expIdHash = (experiment: OverrideRule, group: ExperimentGroup, block: ExperimentBlock) => hashStringSet([experiment.id, group.id, block.id]);

// function expIdHash(experiment: OverrideRule, group: ExperimentGroup, block: ExperimentBlock): number {
//   const combined = combineIds([experiment.id, group.id, block.id]);
//   const hash = hashStringDJB2(combined);
//   return hash;
// }

const randomHash = () => hashStringSet([randomUUID(), randomUUID(), randomUUID()]);
