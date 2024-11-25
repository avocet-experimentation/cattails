import { Experiment, ExperimentDraft, ExperimentDraftTemplate } from "@estuary/types";


export const staticExperiment: ExperimentDraft = new ExperimentDraftTemplate({
  "type": "Experiment",
  "name": "Experiment A",
  "status": "draft",
  "description": "Testing the impact of a new feature",
  environmentName: 'testing',
  "startTimestamp": 1718908800,
  "endTimestamp": 1719490800,
  "hypothesis": "Users who see Feature X will engage more frequently.",
  "enrollment": {
    "attributes": ["location", "deviceType"],
    "proportion": 0.5
  },
  // "groups": [
  //   {
  //     "id": "group1",
  //     "name": "Control Group",
  //     "description": "Users not exposed to Feature X",
  //     "proportion": 0.5,
  //     "blocks": [
  //       {
  //         "id": "block1",
  //         "flagValue": false,
  //         "startTimestamp": 1718908800,
  //         "endTimestamp": 1719490800
  //       }
  //     ]
  //   },
  //   {
  //     "id": "group2",
  //     "name": "Treatment Group",
  //     "description": "Users exposed to Feature X",
  //     "proportion": 0.5,
  //     "blocks": [
  //       {
  //         "id": "block2",
  //         "flagValue": true,
  //         "startTimestamp": 1718908800,
  //         "endTimestamp": 1719490800
  //       }
  //     ]
  //   }
  // ],
  "flagIds": ["feature_x_toggle"],
  // "dependents": [
  //   {
  //     "name": "DependentServiceA",
  //     "attributes": [
  //       {
  //         "type": "string",
  //         "key": "featureUsage",
  //         "value": "enabled"
  //       }
  //     ],
  //     "status": {},
  //     "traceId": "abc123",
  //     "spanId": "xyz456",
  //     "parentSpanId": "parent789",
  //     "kind": 1,
  //     "startTimeUnixNano": "1718908800000000000",
  //     "endTimeUnixNano": "1719490800000000000",
  //     "parentScope": {
  //       "name": "ScopeA",
  //       "version": "1.0.0"
  //     }
  //   }
  // ]
});
