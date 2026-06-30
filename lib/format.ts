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
}

const FIELDS: Record<MetricType, MetricField[]> = {
  strength: [
    { key: "weight", label: "Load", unit: "kg" },
    { key: "reps", label: "Reps" },
  ],
  stretch: [
    { key: "durationSec", label: "Hold", unit: "s" },
    { key: "reps", label: "Reps" },
  ],
  mobilisation: [{ key: "durationSec", label: "Time", unit: "s" }],
};

export function metricFields(category: Category): MetricField[] {
  return FIELDS[CATEGORY_METRIC[category]];
}
