import React from "react";
import { Check } from "lucide-react";

export function ChecklistList({ drone, onToggle, onToggleFlag, highlightIndex }) {
  return (
    <div className="flex flex-col">
      {drone.checklistSteps.map((step, i) => {
        const checked = !!drone.checklist[step];
        const flagged = !!(drone.repairFlags && drone.repairFlags[step]);
        const isNext = highlightIndex === i;
        return (
          <div
            key={step}
            onClick={() => onToggle(step)}
            onContextMenu={(e) => {
              if (!onToggleFlag) return;
              e.preventDefault();
              onToggleFlag(step);
            }}
            className={`checklist-row ${isNext ? "is-next" : ""}`}
            role="checkbox"
            aria-checked={checked}
            tabIndex={0}
            title={onToggleFlag ? "Right-click to flag for repair" : undefined}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onToggle(step);
              }
            }}
          >
            <span className="checklist-index">{i + 1}</span>
            <span className={`check-box ${checked ? "checked" : ""} ${flagged ? "flagged" : ""}`}>
              {(checked || flagged) && (
                <Check size={15} color={flagged ? "var(--repair)" : "var(--on-ready)"} strokeWidth={3} />
              )}
            </span>
            <span className={`checklist-step-text ${checked ? "done" : ""}`}>{step}</span>
          </div>
        );
      })}
    </div>
  );
}
