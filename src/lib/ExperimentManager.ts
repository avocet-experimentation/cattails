import {
  Experiment,
  experimentSchema,
  ClientPropMapping,
  ExperimentGroup,
  experimentGroupSchema,
  Treatment,
  treatmentSchema,
} from '@estuary/types';
import { hashAndAssign } from './hash.js';
// import RepositoryManager from '../repository/RepositoryManager.js';

export default class ExperimentManager {
  // repository: RepositoryManager;

  // constructor(repositoryManager: RepositoryManager) {
  //   this.repository = repositoryManager;
  // }

  static async getTreatmentAndIds(
    experiment: Experiment,
    identifiers: ClientPropMapping,
  ): Promise<{
      treatment: Treatment;
      metadata: string;
    } | null> {
    const group = ExperimentManager.getGroupAssignment(
      experimentSchema.parse(experiment),
      identifiers,
    );
    const treatment = ExperimentManager.currentTreatment(experiment, group);
    if (!treatment) return null;

    const metadata = [experiment.id, group.id, treatment.id].join('+');
    return { treatment, metadata };
  }

  /**
   * Assigns a user to an experimental group
   * todo:
   * - only pass identifiers listed on enrollment.attributes into the hash function
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
    return experimentGroupSchema.parse(assignedGroup);
  }

  static getGroupTreatments(experiment: Experiment, group: ExperimentGroup) {
    return group.sequence.map(
      (treatmentId) => experiment.definedTreatments[treatmentId],
    );
  }

  /**
   * Given an assigned experimental group, determines which block is currently applied to the group
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
    return treatmentSchema.parse(concurrent);
  }
}
