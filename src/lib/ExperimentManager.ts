import {
  Experiment,
  ClientPropMapping,
  ExperimentGroup,
  Treatment,
} from '@estuary/types';
import { hashAndAssign } from './hash.js';

export default class ExperimentManager {
  static async getTreatmentAndIds(
    experiment: Experiment,
    identifiers: ClientPropMapping,
  ): Promise<{
      treatment: Treatment;
      metadata: string;
    } | null> {
    const group = ExperimentManager.getGroupAssignment(experiment, identifiers);
    const treatment = ExperimentManager.currentTreatment(experiment, group);
    if (!treatment) return null;

    const metadata = [experiment.id, group.id, treatment.id].join('+');
    return { treatment, metadata };
  }

  /**
   * Assigns a user to an experimental group
   */
  static getGroupAssignment(
    experiment: Experiment,
    clientProps: ClientPropMapping,
  ): ExperimentGroup {
    const { groups } = experiment;
    const groupOptions = groups.map((group) => ({
      id: group.id,
      weight: group.proportion,
    }));
    const propsToHash = experiment.enrollment.attributes;
    const identifiers = Object.entries(clientProps).filter(([key]) =>
      propsToHash.includes(key));
    const assignmentGroupId = hashAndAssign(identifiers, groupOptions);
    const assignedGroup = groups.find(
      (group) => group.id === assignmentGroupId,
    );
    if (!assignedGroup) {
      throw new Error(`Failed to find group with id ${assignmentGroupId}`);
    }

    return assignedGroup;
  }

  static getGroupTreatments(experiment: Experiment, group: ExperimentGroup) {
    return group.sequence.map(
      (treatmentId) => experiment.definedTreatments[treatmentId],
    );
  }

  /**
   * Determines which treatment is currently being applied to the passed
   * experiment group
   */
  static currentTreatment(
    experiment: Experiment,
    group: ExperimentGroup,
  ): Treatment | null {
    const start = experiment.startTimestamp;
    if (!start || experiment.status !== 'active') return null;

    const currentTimeMs = Date.now();
    const groupTreatments = this.getGroupTreatments(experiment, group);
    let cumulativeDuration = 0;
    const concurrent = groupTreatments.find(({ duration }) => {
      const startTimeMs = start + cumulativeDuration;
      const endTimeMs = startTimeMs + duration;
      cumulativeDuration += duration;
      return startTimeMs <= currentTimeMs && currentTimeMs < endTimeMs;
    });

    if (!concurrent) return null;
    return concurrent;
  }
}
