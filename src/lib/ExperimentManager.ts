import { Experiment, experimentSchema, ClientPropMapping, ExperimentGroup, experimentGroupSchema, Treatment, treatmentSchema, FlagClientValue, ExperimentReference } from "@estuary/types";
import * as bcrypt from 'bcrypt';
import { combineIds, hashAndAssign } from "./hash.js";
import env from "../envalid.js";
import ExperimentRepository from "../repository/ExperimentRepository.js";


export class ExperimentManager {
  experiments: ExperimentRepository;

  constructor() {
    this.experiments = new ExperimentRepository(env.MONGO_API_URI);
  }

  isExperiment(arg: unknown): arg is Experiment {
    const safeParseResult = experimentSchema.safeParse(arg);
    return safeParseResult.success;
  }

  async getTreatmentAndHash(
    experimentReference: ExperimentReference,
    identifiers: ClientPropMapping
  ): Promise<{
    treatment: Treatment,
    hash: string,
  } | null> {
    const experiment = await this.experiments.get(experimentReference.id);
    if (!experiment) return null;
    
    const group = this.getGroupAssignment(experimentSchema.parse(experiment), identifiers);
    const treatment = this.currentTreatment(experiment, group);
    if (!treatment) return null;

    const hash = await this.experimentIdHash(experiment, group, treatment);
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
    // const clientIdHash = hashIdentifiers(clientProps, propsToHash);
    // const normalizedHash = Math.abs(clientIdHash) / (2 ** 31); // placeholder while hashes are signed
    const assignmentGroupId = hashAndAssign(identifiers, groupIds);
    const assignedGroup = groups.find((group) => group.id === assignmentGroupId);
    return experimentGroupSchema.parse(assignedGroup);
  }

  getSequence(experiment: Experiment, sequenceId: string) {
    return experiment.definedSequences.find((seq) => seq.id === sequenceId);
  }

  // todo: change these arrays of IDs into hashes on types
  getGroupTreatments(experiment: Experiment, group: ExperimentGroup) {
    const sequenceId = group.sequenceId;
    if (!sequenceId) {
      throw new Error(`Group ${group.id} has no sequence id`);
    }

    const sequence = this.getSequence(experiment, sequenceId);
    if (!sequence) {
      throw new Error(`Experiment ${experiment.id} has no sequence matching id ${sequenceId}`);
    }

    const treatments = experiment.definedTreatments
      .filter((def) => sequence.treatmentIds.includes(def.id));

    return treatments;
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

  async experimentIdHash(
    experiment: Experiment,
    group: ExperimentGroup,
    treatment: Treatment,
  ) {
    const combined = combineIds([experiment.id, group.id, treatment.id]);
    return bcrypt.hash(combined, env.SALT_ROUNDS);
  }
}
