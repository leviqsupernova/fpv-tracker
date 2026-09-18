import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Search, Plus, Upload, Download, X,
  Settings, Users,
} from "lucide-react";
import { computeStatus, nextStep, latestMessage } from "./domain/status";
import { useSupabaseConnection } from "./data/useSupabaseConnection";
import { useDrones } from "./data/useDrones";
import { useHandlers } from "./data/useHandlers";
import { Led, Btn, IconBtn, Chip, ConfirmModal, SupabaseIcon } from "./components";
import { ConnectModal, ThemeSettingsModal, SyncPill, ConnectionErrorBanner } from "./features/connection";
import { HandlersModal } from "./features/handlers";
import { AddDroneModal } from "./features/batch-reserve";
import { ImportModal, exportWorkbook } from "./features/import-export";
import { StatsStrip, FleetTable, FILTERS, FILTER_LABEL } from "./features/fleet";
import { DroneDetail, RepairModal, FaultyModuleModal } from "./features/drone-detail";
import { TEMPLATES } from "./domain/checklistTemplates";
import { STATUS_META } from "./app/statusMeta";
import { useThemeMode } from "./app/ThemeModeContext";
import { uid } from "./lib/id";

const DEFAULT_HANDLERS = ["Vladiq", "Rost", "Olejeq", "Tom", "Timur"];

export default function App() {
  const { config: sbConfig, client, connect: connectSupabase, disconnect: disconnectSupabase } = useSupabaseConnection();
  const queryKey = useMemo(() => ["drones", sbConfig?.url, sbConfig?.anonKey], [sbConfig]);
  const {
    drones, sync, realtimeStatus, online, offlineNotice,
    commitDrone, createDrone, createDrones, removeDrone, importDrones, retry,
  } = useDrones(client, queryKey);
  const [handlers, saveHandlers, retryHandlers] = useHandlers(client, !!sbConfig, DEFAULT_HANDLERS);

  const [selectedId, setSelectedId] = useState(null);
  const [detailSection, setDetailSection] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [yearFilter, setYearFilter] = useState(null);
  const [monthFilter, setMonthFilter] = useState(null);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [egg, setEgg] = useState(null);

  const eggClickRef = useRef({ count: 0, timer: null });
  const eggToastTimer = useRef(null);

  const showEgg = useCallback((text) => {
    setEgg(text);
    if (eggToastTimer.current) clearTimeout(eggToastTimer.current);
    eggToastTimer.current = setTimeout(() => setEgg(null), 3200);
  }, []);

  const EGG_LINES = [
    "I use Arch btw.",
    "sudo pull requests welcome.",
    "This drone runs on caffeine and 4S LiPo.",
    "rm -rf doubts/",
    "// TODO: achieve flight",
  ];
  const handleLogoClick = useCallback(() => {
    const ref = eggClickRef.current;
    ref.count += 1;
    if (ref.timer) clearTimeout(ref.timer);
    ref.timer = setTimeout(() => { ref.count = 0; }, 1500);
    if (ref.count >= 5) {
      ref.count = 0;
      showEgg(EGG_LINES[Math.floor(Math.random() * EGG_LINES.length)]);
    }
  }, [showEgg]);

  /* --- Konami code: a small reward for the terminally online --- */
  useEffect(() => {
    const seq = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
    let pos = 0;
    const handler = (e) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === seq[pos]) {
        pos++;
        if (pos === seq.length) {
          pos = 0;
          document.dispatchEvent(new Event("fpv-konami"));
        }
      } else {
        pos = key === seq[0] ? 1 : 0;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  useEffect(() => {
    const onKonami = () => {
      showEgg("ARM SEQUENCE OVERRIDE — props out. 🛸");
      const layer = document.createElement("div");
      layer.className = "prop-rain";
      const glyphs = ["◈","✈","▲","✦","⌁","◉"];
      for (let i = 0; i < 24; i++) {
        const s = document.createElement("span");
        s.textContent = glyphs[i % glyphs.length];
        s.style.left = Math.random() * 100 + "vw";
        s.style.animationDuration = 2 + Math.random() * 1.6 + "s";
        s.style.animationDelay = Math.random() * 0.6 + "s";
        s.style.fontSize = 12 + Math.random() * 14 + "px";
        layer.appendChild(s);
      }
      document.body.appendChild(layer);
      setTimeout(() => layer.remove(), 3600);
    };
    document.addEventListener("fpv-konami", onKonami);
    return () => document.removeEventListener("fpv-konami", onKonami);
  }, [showEgg]);

  const existingSerials = useMemo(() => new Set(drones.map((d) => d.serial)), [drones]);
  const selected = useMemo(() => drones.find((d) => d.id === selectedId) || null, [drones, selectedId]);

  /* --- year/month buttons, built from whatever's actually in the data --- */
  const availableYears = useMemo(() => {
    const set = new Set(
      drones.map((d) => new Date(d.createdAt).getFullYear()).filter((y) => Number.isInteger(y))
    );
    return Array.from(set).sort((a, b) => b - a);
  }, [drones]);
  const availableMonths = useMemo(() => {
    if (yearFilter == null) return [];
    const set = new Set(
      drones
        .filter((d) => new Date(d.createdAt).getFullYear() === yearFilter)
        .map((d) => new Date(d.createdAt).getMonth())
    );
    return Array.from(set).sort((a, b) => a - b);
  }, [drones, yearFilter]);
  const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const filteredDrones = useMemo(() => {
    let list = drones;
    if (filter !== "ALL") list = list.filter((d) => computeStatus(d) === filter);
    if (yearFilter != null) list = list.filter((d) => new Date(d.createdAt).getFullYear() === yearFilter);
    if (monthFilter != null) list = list.filter((d) => new Date(d.createdAt).getMonth() === monthFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (d) =>
          d.serial.toLowerCase().includes(q) ||
          String(d.unit).includes(q) ||
          d.prefix.toLowerCase().includes(q) ||
          d.handler.toLowerCase().includes(q) ||
          d.faults.some((f) => f.toLowerCase().includes(q)) ||
          latestMessage(d).toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [drones, filter, yearFilter, monthFilter, search]);

  const pushHistory = (drone, type, message, person) => ({
    ...drone,
    history: [...drone.history, { id: uid("hist"), date: new Date().toISOString(), person: person || drone.handler || "—", type, message }],
  });

  const handleCreateSingle = ({ prefix, unit, serial, handler, template }) => {
    const steps = TEMPLATES[template];
    const checklist = {};
    steps.forEach((s) => (checklist[s] = false));
    const now = new Date().toISOString();
    const drone = {
      id: uid("drone"), serial, prefix, unit, handler,
      checklistSteps: steps, checklist, faults: [], status: null,
      history: [], repairFlags: {},
      createdAt: now, updatedAt: now,
    };
    createDrone(drone);
    setSelectedId(drone.id);
  };

  const handleCreateBatch = (newDrones) => {
    createDrones(newDrones);
  };

  const handleToggleStep = (droneId, step) => {
    commitDrone(droneId, (d) => ({ ...d, checklist: { ...d.checklist, [step]: !d.checklist[step] } }));
  };
  const handleToggleAllSteps = (droneId, value) => {
    commitDrone(droneId, (d) => {
      const checklist = {};
      d.checklistSteps.forEach((s) => { checklist[s] = value; });
      return { ...d, checklist };
    });
  };
  const handleToggleFault = (droneId, tag) => {
    commitDrone(droneId, (d) => ({ ...d, faults: d.faults.includes(tag) ? d.faults.filter((f) => f !== tag) : [...d.faults, tag] }));
  };
  const handleAddNote = (droneId, text) => {
    commitDrone(droneId, (d) => pushHistory(d, "note", text));
  };
  /** Direct manual override — used by the No status / Ready buttons.
   *  Repair goes through handleStartRepair instead, since that one
   *  also wants a reason. */
  const handleSetStatus = (droneId, status) => {
    commitDrone(droneId, (d) => pushHistory({ ...d, status }, "status", `Status set to ${STATUS_META[status].label}.`));
  };
  const handleSetHandler = (droneId, handler) => {
    commitDrone(droneId, (d) => pushHistory({ ...d, handler }, "update", `Reassigned to ${handler || "unassigned"}.`, d.handler));
  };
  const handleStartRepair = (droneId, reasons, note) => {
    commitDrone(droneId, (d) => {
      const msg = [reasons.join(", "), note].filter(Boolean).join(" — ") || "Sent to repair.";
      let next = pushHistory(d, "repair_start", msg);
      next = { ...next, status: "REPAIR", faults: Array.from(new Set([...d.faults, ...reasons])) };
      const checklist = { ...next.checklist };
      reasons.forEach((r) => { if (checklist[r] !== undefined) checklist[r] = false; });
      return { ...next, checklist };
    });
  };
  /** Right-click on a single checklist row — a lightweight, reversible
   *  visual flag (red tick), independent of the actual repair workflow.
   *  A second right-click clears it. No status change, no history entry. */
  const handleToggleStepFlag = (droneId, step) => {
    commitDrone(droneId, (d) => {
      const repairFlags = { ...(d.repairFlags || {}) };
      if (repairFlags[step]) delete repairFlags[step];
      else repairFlags[step] = true;
      return { ...d, repairFlags };
    });
  };
  const handleFinishRepair = (droneId) => {
    commitDrone(droneId, (d) => ({ ...pushHistory(d, "repair_end", "Repair complete."), status: null }));
  };
  const handleDelete = async (droneId) => {
    setSelectedId(null);
    await removeDrone(droneId);
  };

  const handleImport = async (parsedDrones, mode) => {
    let finalList;
    if (mode === "replace") {
      finalList = parsedDrones;
    } else {
      const bySerial = new Map(drones.map((d) => [d.serial, d]));
      parsedDrones.forEach((nd) => bySerial.set(nd.serial, { ...bySerial.get(nd.serial), ...nd, id: bySerial.get(nd.serial)?.id || nd.id }));
      finalList = Array.from(bySerial.values());
    }
    await importDrones(finalList, mode);
  };

  /* --- keyboard shortcuts, live whenever a drone's detail panel is open --- */
  useEffect(() => {
    if (!selected) return;
    const handler = (e) => {
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      // Without this, Cmd/Ctrl+A (select-all) toggles the entire
      // checklist instead. (The Konami code below ends "b","a" too —
      // typing it while a panel happens to be open still double-fires
      // this; accepted as a narrow, harmless edge case rather than
      // coordinating two independent key-sequence listeners over it.)
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.toLowerCase() === "r") { setModal({ type: "repair", payload: selected }); return; }
      if (e.key.toLowerCase() === "a") {
        const total = selected.checklistSteps.length;
        const done = selected.checklistSteps.filter((s) => selected.checklist[s]).length;
        handleToggleAllSteps(selected.id, !(total > 0 && done === total));
        return;
      }
      if (e.key === "Enter") {
        // A focused checklist row already toggles itself on Enter (see
        // ChecklistList) — without this guard the row's toggle and this
        // one both fire and cancel each other out. Scoped to Enter only:
        // "r" must keep working no matter what has focus.
        if (e.target.closest && e.target.closest(".checklist-row")) return;
        const next = nextStep(selected);
        if (next) handleToggleStep(selected.id, next);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selected]);

  const openDrone = (id, section = null) => { setSelectedId(id); setDetailSection(section); };
  const closePanel = () => { setSelectedId(null); setDetailSection(null); };

  const connected = !!sbConfig;

  return (
    <div className="app-shell">
      {/* TOP BAR */}
      <div className="topbar">
        <div className="topbar-inner">
          <div className="flex items-center gap-4">
            <span className="topbar-brand" onClick={handleLogoClick}>
              <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" className="brand-logo" />
            </span>
            <Led color="var(--accent)" size="lg" />
            <span className="wordmark">FPV TRACKER<span className="cursor-blink">▊</span></span>
          </div>
          <div className="flex items-center gap-3">
            <SyncPill sync={sync} connected={connected} realtimeStatus={realtimeStatus} online={online} />
            <IconBtn icon={Users} onClick={() => setModal({ type: "handlers" })} title="Manage handlers" />
            <IconBtn icon={SupabaseIcon} onClick={() => setModal({ type: "connect" })} title="Supabase connection" />
            <IconBtn icon={Settings} onClick={() => setModal({ type: "settings" })} title="Settings" />
            <Btn variant="ghost" size="sm" icon={Download} disabled={!drones.length} onClick={() => exportWorkbook(drones)}>Export</Btn>
          </div>
        </div>
      </div>
      <div className="toast-stack">
        {offlineNotice && <div className="toast is-ready">{offlineNotice}</div>}
        {egg && <div className="toast">{egg}</div>}
      </div>

      {/* CONTENT COLUMN */}
      <div className="content-col">
        <ConnectionErrorBanner sync={sync} onRetry={() => { retry(); retryHandlers(); }} />

        <div style={{ marginBottom: 24 }}>
          <StatsStrip drones={drones} />
        </div>

        <div className="flex items-center justify-between flex-wrap gap-4" style={{ marginBottom: 12 }}>
          <div className="filter-row">
            {FILTERS.map((f) => <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>{FILTER_LABEL[f]}</Chip>)}
          </div>
          <div className="flex items-center gap-3">
            <div className="input-icon-wrap search-wide">
              <Search size={16} className="icon" />
              <input className="input" placeholder="Search serial, unit, fault…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Btn variant="primary" size="sm" icon={Plus} disabled={!connected} onClick={() => setModal({ type: "new" })}>Add drone</Btn>
          </div>
        </div>

        {availableYears.length > 0 && (
          <div className="filter-row" style={{ marginBottom: 8 }}>
            <span className="filter-row-label">PERIOD</span>
            <Chip active={yearFilter == null} onClick={() => { setYearFilter(null); setMonthFilter(null); }}>All time</Chip>
            {availableYears.map((y) => <Chip key={y} active={yearFilter === y} onClick={() => { setYearFilter(y); setMonthFilter(null); }}>{y}</Chip>)}
          </div>
        )}
        {yearFilter != null && availableMonths.length > 0 && (
          <div className="filter-row" style={{ marginBottom: 20 }}>
            <span className="filter-row-spacer" />
            <Chip active={monthFilter == null} onClick={() => setMonthFilter(null)}>All of {yearFilter}</Chip>
            {availableMonths.map((m) => <Chip key={m} active={monthFilter === m} onClick={() => setMonthFilter(m)}>{MONTH_NAMES[m]}</Chip>)}
          </div>
        )}
        {(availableYears.length === 0 || yearFilter == null) && <div style={{ marginBottom: availableYears.length ? 20 : 0 }} />}

        {!connected ? (
          <div className="empty-panel dashed bracket">
            <SupabaseIcon size={28} className="empty-panel-icon" />
            <div className="empty-title">Not Connected</div>
            <div className="flex justify-center gap-2.5" style={{ marginTop: 22 }}>
              <Btn variant="primary" icon={SupabaseIcon} onClick={() => setModal({ type: "connect" })}>Connect to Supabase</Btn>
            </div>
          </div>
        ) : sync.status === "loading" && !drones.length ? (
          <div className="text-dim text-md" style={{ padding: "56px 0", textAlign: "center" }}>Loading fleet…</div>
        ) : drones.length === 0 ? (
          <div className="empty-panel dashed">
            <div className="empty-title">No drones yet</div>
            <div className="empty-body">Import your existing spreadsheet, or add drones to start tracking them here.</div>
            <div className="flex justify-center gap-2.5" style={{ marginTop: 22 }}>
              <Btn variant="subtle" icon={Upload} onClick={() => setModal({ type: "import" })}>Import spreadsheet</Btn>
              <Btn variant="primary" icon={Plus} onClick={() => setModal({ type: "new" })}>Add drone</Btn>
            </div>
          </div>
        ) : (
          <FleetTable drones={filteredDrones} onSelect={openDrone} onOpenHistory={(id) => openDrone(id, "history")} />
        )}
      </div>

      {/* SIDE PANEL — right side, so the fleet table stays visible behind it */}
      {selected && (
        <div className="side-panel">
          <div style={{ position: "absolute", top: 16, right: 16 }}>
            <IconBtn icon={X} onClick={closePanel} title="Close" />
          </div>
          <DroneDetail
            drone={selected}
            handlers={handlers}
            initialSection={detailSection}
            onToggleStep={(step) => handleToggleStep(selected.id, step)}
            onToggleAllSteps={(value) => handleToggleAllSteps(selected.id, value)}
            onToggleStepFlag={(step) => handleToggleStepFlag(selected.id, step)}
            onToggleFault={(tag) => handleToggleFault(selected.id, tag)}
            onAddNote={(text) => handleAddNote(selected.id, text)}
            onSetStatus={(status) => handleSetStatus(selected.id, status)}
            onSetHandler={(h) => handleSetHandler(selected.id, h)}
            onStartRepair={() => setModal({ type: "repair", payload: selected })}
            onFinishRepair={() => handleFinishRepair(selected.id)}
            onDelete={() => setModal({ type: "confirmDelete", payload: selected })}
            onFaultyModule={() => setModal({ type: "faultyModule", payload: selected })}
            onFinish={closePanel}
          />
        </div>
      )}

      {/* MODALS */}
      {modal?.type === "new" && (
        <AddDroneModal onClose={() => setModal(null)} onCreateSingle={handleCreateSingle} onCreateBatch={handleCreateBatch} existingSerials={existingSerials} handlers={handlers} />
      )}
      {modal?.type === "repair" && (
        <RepairModal
          drone={modal.payload}
          onClose={() => setModal(null)}
          onSubmit={(reasons, note) => { handleStartRepair(modal.payload.id, reasons, note); closePanel(); }}
        />
      )}
      {modal?.type === "faultyModule" && (
        <FaultyModuleModal drone={modal.payload} onClose={() => setModal(null)} onToggle={(tag) => handleToggleFault(modal.payload.id, tag)} onAddCustom={(tag) => handleToggleFault(modal.payload.id, tag)} />
      )}
      {modal?.type === "import" && <ImportModal onClose={() => setModal(null)} onImport={handleImport} />}
      {modal?.type === "confirmDelete" && (
        <ConfirmModal
          title="Delete drone"
          message={`Remove ${modal.payload.serial} and its full history? This can't be undone.`}
          confirmLabel="Delete"
          onClose={() => setModal(null)}
          onConfirm={() => handleDelete(modal.payload.id)}
        />
      )}
      {modal?.type === "connect" && (
        <ConnectModal initial={sbConfig} onClose={() => setModal(null)} onSave={connectSupabase} onDisconnect={disconnectSupabase} />
      )}
      {modal?.type === "settings" && (
        <ThemeSettingsModal onClose={() => setModal(null)} />
      )}
      {modal?.type === "handlers" && (
        <HandlersModal handlers={handlers} onClose={() => setModal(null)} onSave={saveHandlers} />
      )}
    </div>
  );
}
