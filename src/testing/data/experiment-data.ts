import { ABExperimentTemplate, ExperimentDraft, ExperimentDraftTemplate, SwitchbackTemplate } from "@estuary/types";

export const experiment1 = new ExperimentDraftTemplate('example experiment to embed', 'prod');
export const switchbackExperiment1 = new SwitchbackTemplate('my switchback', 'prod');
export const abExperiment1 = new ABExperimentTemplate('two group test', 'prod');

export const staticExperiments: ExperimentDraft[] = [
  experiment1,
  switchbackExperiment1,
  abExperiment1,
].map((el) => Object.freeze(el));