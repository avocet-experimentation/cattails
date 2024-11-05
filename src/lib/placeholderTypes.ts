import { FeatureFlag } from "@fflags/types";

export type EnvironmentName = 'prod' | 'dev' | 'testing';

export type FlagEnvironment = {
  enabled: boolean;
  overrideRules: OverrideRule[];
}

export interface Scope {
  name: string;
  version: string;
}

// context for a span, such as the route followed, current configuration, etc
// possible candidate for storing flag/experiment statuses as well
export interface SpanStringAttribute {
  key: string; // e.g., http.route
  value: {
    stringValue: string; // e.g., '/'
  }
}

export interface SpanIntAttribute {
  key: string; // e.g., http.route
  value: {
	intValue: string; // e.g., '/'
  }
}

export type SpanPrimitiveAttribute = SpanStringAttribute | SpanIntAttribute;

// SpanArrayAttribute is adistributive conditional type. See https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types
export type ToArray<T> = T extends any ? T[] : never;
export type SpanArrayAttribute = ToArray<SpanPrimitiveAttribute>;

export type SpanAttribute = SpanArrayAttribute | SpanPrimitiveAttribute;

// "span" is a catch-all term for units of work or operations. See [Observability primer | OpenTelemetry](https://opentelemetry.io/docs/concepts/observability-primer/)
export interface Span {
  traceId: string; // uniquely identifies the path taken by a request through various system components
  spanId: string;
  parentSpanId: string; // seems spans can be nested
  name: string;
  kind: number;
  startTimeUnixNano: string; // Unix timestamp?
  endTimeUnixNano: string;
  attributes: SpanAttribute[];
  status: object;
}

export interface ScopeSpan {
  scope: Scope;
  spans: Span[];
}

export interface ResourceSpan {
  resource: {
    attributes: SpanAttribute[];
  };
  scopeSpans: ScopeSpan[];
}

export type Attribute = ['id', 'name'][number]; // => 'id' | 'name'

export interface OverrideRule {
  id: string;
  description: string;
  ruleType: 'experiment' | 'force' | 'rollout';
  status: "in_test" | "completed" | "archived" | "active";
  startTimestamp?: number; // unix timestamp | undefined if never enabled
  endTimestamp?: number;
  enrollment: {
	attributes: Attribute[]; // keys for the values sent to the experimentation server and consistently hashed for random assignment
	proportion: number; // 0 < proportion <= 1
  };
}

// for supporting multivariate experiments later
export interface Intervention { [flagId: string]: string }

// a block defines an intervention for a group
export interface ExperimentBlock {
  id: string;
  name: string;
  startTimestamp?: number; // unix timestamp
  endTimestamp?: number;
  flagValue: FeatureFlag['valueType']; // the intervention is defined here, by a specific flag value	
}

// a grouping of users to be subjected to a sequence of experiment blocks
export interface ExperimentGroup {
  id: string;
  name: string;
  proportion: number; // default 1 for switchbacks
  blocks: ExperimentBlock[];
  gap: number; // tentative - a time gap between blocks to mitigate across-block effects
}

// spans, traces, etc
export type EventTelemetry = Span // | Trace // or potentially more

export interface Experiment extends OverrideRule {
  name: string; // unique experiment name
  groups: ExperimentGroup[];
  flagId: string;
  dependents: EventTelemetry[]; // all dependent variables
}

export type FlagEnvironments = { [key in EnvironmentName]: FlagEnvironment };
// if the one below this line is the same as the one above, use it instead
// type FlagEnvironments = Record<EnvironmentName, FlagEnvironment>;

// export type FeatureFlag = {
//   id?: string;
//   name: string;
//   description: string;
//   createdAt: number;
//   updatedAt: number; // default to the same as `createdAt`?
//   environments: FlagEnvironments;
// } & (
//   | { valueType: "boolean"; defaultValue: boolean }
//   | { valueType: "string"; defaultValue: string }
//   | { valueType: "number"; defaultValue: number }
// );