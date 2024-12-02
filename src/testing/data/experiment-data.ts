import { ABExperimentTemplate, ExperimentDraft, ExperimentDraftTemplate, SwitchbackTemplate } from "@estuary/types";

export const experiment1 = new ExperimentDraftTemplate({
  name: 'example experiment to embed',
  environmentName: 'prod',
});
export const switchbackExperiment1 = new SwitchbackTemplate({
  name: 'my switchback',
  environmentName: 'prod',
});
export const abExperiment1 = new ABExperimentTemplate({
  name: 'two group test',
  environmentName: 'prod',
});

export const staticExperiments: ExperimentDraft[] = [
  experiment1,
  switchbackExperiment1,
  abExperiment1,
].map((el) => Object.freeze(el));