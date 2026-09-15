import { STATUS_LABELS } from "../domain/status";

export const STATUS_META = {
  NONE: { label: STATUS_LABELS.NONE, color: "var(--none)", soft: "var(--none-soft)" },
  REPAIR: { label: STATUS_LABELS.REPAIR, color: "var(--repair)", soft: "var(--repair-soft)" },
  READY: { label: STATUS_LABELS.READY, color: "var(--ready)", soft: "var(--ready-soft)" },
};
