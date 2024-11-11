import {
  ClientPropMapping,
  EnvironmentName,
  Experiment,
  ExperimentGroup,
  experimentGroupSchema,
  experimentSchema,
  FeatureFlag,
  FlagCurrentValue,
  forcedValueSchema,
  OverrideRule
} from "@estuary/types";
import { hashAndAssign, hashIdentifiers } from "./hash.js";

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
): FlagCurrentValue {
  const { default: defaultValue } = flag.value;
  const overrideRules = flag.environments[environment]?.overrideRules;
  if (!overrideRules) return defaultValue;

  const clientIdHash = hashIdentifiers(attributes);
  const selectedRule = enroll(overrideRules, clientIdHash);
  if (selectedRule === undefined) return flag.value.default;

  return getValueFromRule(selectedRule, attributes) ?? flag.value.default;
}

// random enrollment
function enroll(overrideRules: OverrideRule[], hash: number) {
  return overrideRules.find(({ enrollment }) => {
    return enrollment.proportion === 1 
    || hash < enrollment.proportion;
  });
}

function getValueFromRule(rule: OverrideRule, identifiers: ClientPropMapping) {
  if (rule.type === 'Experiment') {
    const group = getGroupAssignment(experimentSchema.parse(rule), identifiers);
    return currentBlockValue(group);
  } else if (rule.type === 'ForcedValue') {
    return forcedValueSchema.parse(rule).value;
  }
}

/**
 * 
 * todo:
 * - only pass identifiers listed on enrollment.attributes into the hash function
 */
function getGroupAssignment(experiment: Experiment, identifiers: ClientPropMapping) {
  const { groups } = experiment;
  const groupIds = groups.map((group) => group.id);
  const assignmentGroupId = hashAndAssign(identifiers, groupIds);
  const assignedGroup = groups.find((group) => group.id === assignmentGroupId);
  return experimentGroupSchema.parse(assignedGroup);
}

function currentBlockValue(group: ExperimentGroup): FlagCurrentValue | undefined {
  const now = Date.now();

  const concurrent = group.blocks.find(({ startTimestamp, endTimestamp }) => {
    return startTimestamp 
      && startTimestamp <= now
      && (!endTimestamp || endTimestamp > now);
  });

  return concurrent?.flagValue;
}