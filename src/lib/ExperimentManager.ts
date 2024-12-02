import {
  Experiment,
  experimentSchema,
  ClientPropMapping,
  ExperimentGroup,
  experimentGroupSchema,
  Treatment,
  treatmentSchema,
  ExperimentReference,
} from "@estuary/types";
import { hashAndAssign } from "./hash.js";
import RepositoryManager from "../repository/RepositoryManager.js";


export default class ExperimentManager {
  repository: RepositoryManager;

  constructor(repositoryManager: RepositoryManager) {
    this.repository = repositoryManager;
  }

  async getTreatmentAndHash(
    experimentReference: ExperimentReference,
    identifiers: ClientPropMapping
  ): Promise<{
    treatment: Treatment,
    hash: string,
  } | null> {
    const experiment = await this.repository.experiment.get(experimentReference.id);
    if (!experiment) return null;

    const group = this.getGroupAssignment(experimentSchema.parse(experiment), identifiers);
    const treatment = this.currentTreatment(experiment, group);
    if (!treatment) return null;

    const hash = [experiment.id, group.id, treatment.id].join('+');
    return { treatment, hash };
  }

  /**
   * Assigns a user to an experimental group
   * todo:
   * - only pass identifiers listed on enrollment.attributes into the hash function
   */
  getGroupAssignment(experiment: Experiment, clientProps: ClientPropMapping): ExperimentGroup {
    const { groups } = experiment;
    const groupIds = groups.map((group) => group.id);
    const propsToHash = experiment.enrollment.attributes;
    const identifiers = Object.entries(clientProps)
      .filter(([key]) => propsToHash.includes(key));
    const assignmentGroupId = hashAndAssign(identifiers, groupIds);
    const assignedGroup = groups.find((group) => group.id === assignmentGroupId);
    return experimentGroupSchema.parse(assignedGroup);
  }

  getGroupTreatments(experiment: Experiment, group: ExperimentGroup) {
    return group.sequence.map((treatmentId) => experiment.definedTreatments[treatmentId]);
  }
  /**
   * Given an assigned experimental group, determines which block is currently applied to the group
   */
  currentTreatment(experiment: Experiment, group: ExperimentGroup): Treatment | null {
    const start = experiment.startTimestamp;
    if (!start || experiment.status !== 'active') return null;

    const currentTimeMs = Date.now();
    const groupTreatments = this.getGroupTreatments(experiment, group);
    let cumulativeDuration = 0;
    const concurrent = groupTreatments.find(({ duration }) => {
      const startTimeMs = start + cumulativeDuration;
      const endTimeMs = startTimeMs + duration;
      return (startTimeMs <= currentTimeMs && currentTimeMs < endTimeMs);
    });

    if (!concurrent) return null;
    return treatmentSchema.parse(concurrent);
  }
}
