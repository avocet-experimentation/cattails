import { Document, model, Model, Schema, HydratedDocument } from "mongoose";
import { TransformedSpan } from "./eventTypes.js";

export type AttributeData = 'string' | 'number' | 'boolean';

export type Attribute = {
  name: string;
  dataType: AttributeData;
}

// type OverrideRuleStatus = "in_test" | "completed" | "archived" | "active";

export type Status =
  | "draft"
  | "active"
  | "in_test"
  | "paused"
  | "completed"
  | "disabled"
  | "archived";

export interface OverrideRule {
  id: string;
  description: string; // default to empty string
  status: Status; // defaults to 'disabled'
  startTimestamp?: number; // unix timestamp | undefined if never enabled
  endTimestamp?: number;
  enrollment: {
	attributes: Attribute[]; // keys for the values sent to the experimentation server and consistently hashed for random assignment
	proportion: number; // 0 < proportion <= 1
  };
}

// as an example only; see [[Feature Flagging]] for the actual export type
interface FeatureFlag {
	valueType: 'boolean' | 'number' | 'string';
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
export type EventTelemetry = TransformedSpan // or potentially more

export interface Experiment extends OverrideRule {
  name: string; // unique experiment name
  groups: ExperimentGroup[];
  flagId: string;
  dependents: EventTelemetry[]; // all dependent variables
}

const assertDocument = (arg: unknown): asserts arg is Document => {
  if (typeof arg !== 'object' 
    || arg === null 
    || !('_id' in arg)
    || !('__v' in arg)
  ) {
    throw new TypeError(`${arg} is not a Mongoose Document`);
  }
}


const assertExperiment = (arg: Document): asserts arg is Experiment => {
  if (
    
  ) {
    throw new TypeError(`${arg} is not an Experiment`);
  }
}



type ExperimentRecord = Omit<Experiment, 'id'> & { _id: any, __v: number };

const transform = <T extends Experiment>(
  doc: HydratedDocument<T>, ret: Record<string, any>
): Experiment => {
  assertDocument(ret);
  const { _id, __v, ...rest } = ret;
  const returnValue: Experiment = {
    ...rest,
    id: String(ret._id.toString()),
  }
  // ret.id = ret._id.toString();
  // delete ret._id;
  // delete ret.__v;
  return returnValue;
}

// embedded into experimentSchema
const attributeSchema = new Schema<Attribute>({
  name: { type: String, unique: true, required: true },
  dataType: { type: String, unique: false, required: true },
},
{
  _id: false,
});

const experimentBlockSchema = new Schema<ExperimentBlock>({
  name: { type: String, unique: true, required: true },
  startTimestamp: { type: Date, unique: false, required: false }, // see if this prop holds a Date object
  endTimestamp: { type: Number, unique: false, required: false },
  flagValue: { type: Schema.Types.Mixed, unique: false, required: false },

},
{
  _id: false,
});

const experimentGroupSchema = new Schema<ExperimentGroup>({
  name: { type: String, unique: true, required: true },
  proportion: { type: Number, unique: false, required: true },
  blocks: { type: [experimentBlockSchema], required: false },
  gap: { type: Number, unique: false, required: true },

},
{
  _id: true,
});

const experimentSchema = new Schema<Experiment>({
  name: { type: String, unique: true, required: true },
  description: { type: String, unique: false, required: true },
  status: { type: String, unique: false, required: true },
  startTimestamp: { type: Date, unique: false, required: false }, // see if this prop holds a Date object
  endTimestamp: { type: Number, unique: false, required: false },
  enrollment: {
    attributes: { type: [attributeSchema], required: true },
    proportion: { type: Number, unique: false, required: true },
  },
  groups: { type: [experimentGroupSchema], required: false },
},
{
  _id: true,
  timestamps: true,
  toJSON: { transform },
});

export const ExperimentModel = model<Experiment>('experiments', experimentSchema);