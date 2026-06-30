import { CATEGORY_METRIC } from "./constants";
import type { BookRef, Category, MetricType } from "./types";

export function formatBookRef(ref?: BookRef): string | null {
  if (!ref) return null;
  return `${ref.title}, p${ref.page}`;
}

export interface MetricField {
  key: "weight" | "reps" | "durationSec";
  label: string;
  unit?: string;
  /** Increment for the input's step attribute. */
  step: number;
  /** Whole numbers only (no decimal point). */
  integer: boolean;
}

const WEIGHT: MetricField = {
  key: "weight",
  label: "Load",
  unit: "kg",
  step: 0.5,
  integer: false,
};
const REPS: MetricField = { key: "reps", label: "Reps", step: 1, integer: true };
const HOLD: MetricField = {
  key: "durationSec",
  label: "Hold",
  unit: "s",
  step: 1,
  integer: true,
};
const TIME: MetricField = { ...HOLD, label: "Time" };

const FIELDS: Record<MetricType, MetricField[]> = {
  strength: [WEIGHT, REPS],
  stretch: [HOLD, REPS],
  mobilisation: [TIME],
};

export function metricFields(category: Category): MetricField[] {
  return FIELDS[CATEGORY_METRIC[category]];
}
