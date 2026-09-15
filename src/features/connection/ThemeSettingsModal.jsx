import React from "react";
import { Check } from "lucide-react";
import { ModalShell, Btn } from "../../components";
import { useThemeMode } from "../../app/ThemeModeContext";
import { THEMES } from "../../app/themes";

export function ThemeSettingsModal({ onClose }) {
  const { themeId, themes, setThemeId } = useThemeMode();

  return (
    <ModalShell title="Settings" onClose={onClose} width={440}>
      <div className="flex flex-col gap-4">
        <span className="section-label">THEME</span>
        <div className="theme-grid">
          {themes.map((t) => {
            const tok = THEMES[t.id].tokens;
            const active = t.id === themeId;
            return (
              <button
                key={t.id}
                type="button"
                className={`theme-swatch ${active ? "active" : ""}`}
                onClick={() => setThemeId(t.id)}
              >
                <span className="theme-swatch-preview">
                  <span className="theme-swatch-dot" style={{ background: tok.bg }} />
                  <span className="theme-swatch-dot" style={{ background: tok.accent }} />
                  <span className="theme-swatch-dot" style={{ background: tok.ready }} />
                  <span className="theme-swatch-dot" style={{ background: tok.repair }} />
                </span>
                <span className="theme-swatch-label">{t.label}</span>
                {active && <Check size={15} className="theme-swatch-check" />}
              </button>
            );
          })}
        </div>
        <div className="flex justify-end" style={{ marginTop: 4 }}>
          <Btn variant="primary" onClick={onClose}>Done</Btn>
        </div>
      </div>
    </ModalShell>
  );
}
