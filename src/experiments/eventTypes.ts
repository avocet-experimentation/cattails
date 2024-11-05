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
export type SpanArrayAttribute = {
  key: string;
  value: {
    arrayValue: ToArray<SpanPrimitiveAttribute>;
  }
}

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

export interface SpanTransformedAttribute {
  key: string;
  type: string;
  value: string;
}
export interface TransformedSpan extends Omit<Span, 'attributes'> {
  parentScope: Scope;
  attributes: SpanTransformedAttribute[];
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