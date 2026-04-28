import { useState } from "react";

export function SBar({ v, set, ph }) {
  return (
    <div style={{ padding: "0 16px 8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.05)", borderRadius: 12, padding: "9px 14px" }}>
        <span style={{ fontSize: 13, opacity: .4 }}>🔍</span>
        <input value={v} onChange={(event) => set(event.target.value)} placeholder={ph} style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#e2e8f0", fontSize: 14, fontFamily: "inherit" }} />
        {v && <button onClick={() => set("")} style={{ background: "none", border: "none", color: "#64748b", fontSize: 13, cursor: "pointer" }}>✕</button>}
      </div>
    </div>
  );
}

export function Nil({ icon, t, s }) {
  return (
    <div style={{ textAlign: "center", padding: "50px 20px" }}>
      <div style={{ fontSize: 44, opacity: .25, marginBottom: 10 }}>{icon}</div>
      <p style={{ color: "#64748b", fontWeight: 600 }}>{t}</p>
      <p style={{ color: "#475569", fontSize: 12, marginTop: 4 }}>{s}</p>
    </div>
  );
}

export function Tog({ on = false, onChange }) {
  const [localOn, setLocalOn] = useState(on);
  const controlled = typeof onChange === "function";
  const active = controlled ? on : localOn;

  return (
    <div
      onClick={() => {
        const next = !active;
        if (controlled) onChange(next);
        else setLocalOn(next);
      }}
      style={{ width: 46, height: 27, borderRadius: 14, cursor: "pointer", background: active ? "#34d399" : "rgba(255,255,255,.1)", transition: "background .2s", position: "relative", flexShrink: 0 }}
    >
      <div style={{ width: 23, height: 23, borderRadius: 12, background: "#fff", position: "absolute", top: 2, left: active ? 21 : 2, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.25)" }} />
    </div>
  );
}
