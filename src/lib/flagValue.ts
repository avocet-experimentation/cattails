import { ClientSessionAttribute, EnvironmentName, Experiment, ExperimentGroup, experimentGroupSchema, experimentSchema, FeatureFlag, FlagValueType, forcedValueSchema, OverrideRule } from "@estuary/types";
import { hashAndAssign, hashIdentifiers } from "./hash.js";

/**
 * Functions for determining what the value of a flag should be set to on a given client
 */


/**
 * Checks each override rule on the flag, returning a value for the first rule that matches.
 * Uses the flag's default value as a fallback.
 */
export function currentFlagValue(
  flag: FeatureFlag,
  environment: EnvironmentName,
  attributes: ClientSessionAttribute[]
): string {
  const overrideRules = flag.environments[environment]?.overrideRules;
  if (!overrideRules) return flag.defaultValue;

  const clientIdHash = hashIdentifiers(attributes);
  const selectedRule = overrideRules.find(({ enrollment }) => {
    return enrollment.proportion === 1 
    || clientIdHash < enrollment.proportion;
  });

  if (selectedRule === undefined) return flag.defaultValue;

  return getValueFromRule(selectedRule, attributes) ?? flag.defaultValue;
}

function getValueFromRule(rule: OverrideRule, attributes: ClientSessionAttribute[]): string | undefined {
  if (rule.type === 'Experiment') {
    const group = getGroupAssignment(experimentSchema.parse(rule), attributes);
    return currentBlockValue(group);
  } else if (rule.type === 'ForcedValue') {
    return forcedValueSchema.parse(rule).value;
  }
}

function getGroupAssignment(experiment: Experiment, identifiers: ClientSessionAttribute[]) {
  const { groups } = experiment;
  const groupIds = groups.map((group) => group.id);
  const assignmentGroupId = hashAndAssign(identifiers, groupIds);
  const assignedGroup = groups.find((group) => group.id === assignmentGroupId);
  return experimentGroupSchema.parse(assignedGroup);
}

function currentBlockValue(group: ExperimentGroup): FlagValueType | undefined {
  const now = Date.now();

  const concurrent = group.blocks.find(({ startTimestamp, endTimestamp }) => {
    return startTimestamp 
      && startTimestamp <= now
      && (!endTimestamp || endTimestamp > now);
  });

  return concurrent?.flagValue;
}