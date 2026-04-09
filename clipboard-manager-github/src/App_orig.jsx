import { useState, useRef, useCallback } from "react";

// ── Long Press ──
function useLongPress(cb, delay = 500) {
  const timer = useRef(null); const moved = useRef(false); const active = useRef(false);
  const start = useCallback(e => { moved.current = false; active.current = true; timer.current = setTimeout(() => { if (!moved.current && active.current) cb(e); }, delay); }, [cb, delay]);
  const move = useCallback(() => { moved.current = true; }, []);
  const end = useCallback(() => { active.current = false; clearTimeout(timer.current); }, []);
  return { onTouchStart: start, onTouchMove: move, onTouchEnd: end, onTouchCancel: end, onMouseDown: start, onMouseMove: move, onMouseUp: end, onMouseLeave: end };
}
function Pressable({ children, style, onTap, onLongPress: olp }) {
  const [p, setP] = useState(false); const t = useRef(false);
  const lp = useLongPress(() => { t.current = true; setP(false); olp?.(); });
  return <div {...lp} onClick={() => { if (t.current) { t.current = false; return; } onTap?.(); }} onContextMenu={e => e.preventDefault()} style={{ ...style, transform: p ? "scale(.97)" : "scale(1)", transition: "transform .12s,background .15s", WebkitUserSelect: "none", userSelect: "none" }} onPointerDown={() => setP(true)} onPointerUp={() => setP(false)} onPointerLeave={() => setP(false)}>{children}</div>;
}

// ── Demo Data ──
const INIT_CLIPS = [
  { id: 1, text: "https://github.com/anthropics/claude-code", ts: Date.now() - 120000, app: "Safari" },
  { id: 2, text: "경기도 안양시 만안구 석수동 그린홈마트", ts: Date.now() - 600000, app: "지도" },
  { id: 3, text: "npm install -g @anthropic-ai/claude-code", ts: Date.now() - 1800000, app: "터미널" },
  { id: 4, text: "오늘 회의 안건: 1) 매출 분석 2) 마케팅 전략", ts: Date.now() - 3600000, app: "메모" },
  { id: 5, text: "SELECT * FROM sales WHERE date >= '2026-04-01';", ts: Date.now() - 7200000, app: "VSCode" },
  { id: 6, text: "감사합니다. 확인 후 회신 드리겠습니다.", ts: Date.now() - 10800000, app: "메일" },
];
const INIT_GROUPS = [
  { id: "g1", name: "계정 정보", icon: "🔑" }, { id: "g2", name: "주소", icon: "📍" },
  { id: "g3", name: "비즈니스", icon: "💼" }, { id: "g4", name: "금융", icon: "🏦" },
];
const INIT_PHRASES = [
  { id: 101, text: "wwhunter13@gmail.com", label: "메인 계정", gid: "g1", icon: "✉️" },
  { id: 102, text: "010-1234-5678", label: "내 번호", gid: "g1", icon: "📞" },
  { id: 103, text: "경기도 안양시 만안구 석수동 123-45", label: "집 주소", gid: "g2", icon: "🏠" },
  { id: 104, text: "경기도 안양시 만안구 석수동 그린홈마트", label: "마트 주소", gid: "g2", icon: "🏪" },
  { id: 105, text: "안녕하세요, 문의 주셔서 감사합니다.", label: "문의 답변", gid: "g3", icon: "💬" },
  { id: 106, text: "110-123-456789", label: "사업자 계좌", gid: "g4", icon: "💳" },
];
const GICONS = ["📁","🔑","📍","💼","🏦","🎯","🛒","📚","🎨","🔧","💡","🏠","📞","✈️","🎮","🍔","💊","🐾"];

const catIcon = t => { if (/^https?:\/\//.test(t)) return "🔗"; if (t.includes("@") && t.includes(".") && !t.includes(" ")) return "✉️"; const d = t.replace(/[^0-9+\-]/g, ""); if (d.length >= 9 && d.length <= 15 && /^[\d\-+\s()]+$/.test(t.trim())) return "📞"; return "📝"; };
const ago = ts => { const d = Date.now() - ts; if (d < 60000) return "방금 전"; if (d < 3600000) return `${Math.floor(d / 60000)}분 전`; if (d < 86400000) return `${Math.floor(d / 3600000)}시간 전`; return `${Math.floor(d / 86400000)}일 전`; };

export default function App() {
  const [tab, setTab] = useState("clips");
  const [clips, setClips] = useState(INIT_CLIPS);
  const [phrases, setPhrases] = useState(INIT_PHRASES);
  const [groups, setGroups] = useState(INIT_GROUPS);
  const [q1, setQ1] = useState(""); const [q2, setQ2] = useState("");
  const [copied, setCopied] = useState(null);
  const [toast, setToast] = useState(null);
  const [hint, setHint] = useState(true);
  const [ctx, setCtx] = useState(null);
  const [saveFlow, setSaveFlow] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addText, setAddText] = useState(""); const [addLabel, setAddLabel] = useState(""); const [addGid, setAddGid] = useState(""); const [addMode, setAddMode] = useState("form");
  const [edit, setEdit] = useState(null);
  const [editText, setEditText] = useState(""); const [editLabel, setEditLabel] = useState(""); const [editGid, setEditGid] = useState("");
  const [showGrpMgr, setShowGrpMgr] = useState(false);
  const [newGN, setNewGN] = useState(""); const [newGI, setNewGI] = useState("📁"); const [iconPick, setIconPick] = useState(false);
  const [delConf, setDelConf] = useState(null); const [reassign, setReassign] = useState(null);

  // Screenshots - 사진앱에서 직접 불러오기
  const [photos, setPhotos] = useState([]);
  const [ssSelected, setSsSelected] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [ssPreview, setSsPreview] = useState(null);
  const fileInputRef = useRef(null);

  const [kbIn, setKbIn] = useState(""); const [kbTab, setKbTab] = useState("clips");
  const addRef = useRef(null); const grpRef = useRef(null);

  const fire = m => { setToast(m); setTimeout(() => setToast(null), 1500); };
  const doCopy = async item => { try { await navigator.clipboard.writeText(item.text); } catch {} setCopied(item.id); fire("클립보드에 복사됨"); setTimeout(() => setCopied(null), 1400); };
  const gName = gid => groups.find(g => g.id === gid)?.name || "미분류";
  const gIcon = gid => groups.find(g => g.id === gid)?.icon || "📁";

  // Group CRUD
  const addGroup = () => { const n = newGN.trim(); if (!n || groups.some(g => g.name === n)) return; setGroups(p => [...p, { id: "g" + Date.now(), name: n, icon: newGI }]); setNewGN(""); setNewGI("📁"); setIconPick(false); fire(`'${n}' 추가됨`); };
  const removeGroup = gid => { const g = groups.find(x => x.id === gid); const rem = groups.filter(x => x.id !== gid); const target = reassign && reassign !== gid ? reassign : (rem[0]?.id || "__none__"); setPhrases(p => p.map(i => i.gid === gid ? { ...i, gid: target } : i)); setGroups(p => p.filter(x => x.id !== gid)); setDelConf(null); setReassign(null); fire(`'${g?.name}' 삭제됨`); };

  // Save flow
  const startSaveFlow = ci => { setCtx(null); setSaveFlow({ text: ci.text, step: "group", gid: groups[0]?.id || "", label: "" }); };
  const finishSaveFlow = () => { if (!saveFlow) return; setPhrases(p => [...p, { id: Date.now(), text: saveFlow.text, label: saveFlow.label.trim() || saveFlow.text.slice(0, 20), gid: saveFlow.gid || "__none__", icon: "📝" }]); setSaveFlow(null); fire("문구로 저장됨! ⭐"); };

  // Screenshots
  const toggleSsSelect = id => setSsSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectAll = () => { if (ssSelected.size === photos.length) setSsSelected(new Set()); else setSsSelected(new Set(photos.map(s => s.id))); };
  const deleteSelected = () => {
    setPhotos(p => p.filter(s => !ssSelected.has(s.id)));
    fire(`${ssSelected.size}개 삭제 완료`);
    setSsSelected(new Set()); setShowDeleteConfirm(false);
  };
  const handleFileUpload = e => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newPhotos = files.map((f, i) => ({
      id: `p${Date.now()}${i}`,
      url: URL.createObjectURL(f),
      name: f.name,
      date: new Date(),
      size: (f.size / 1024 / 1024).toFixed(1) + "MB",
    }));
    setPhotos(p => [...p, ...newPhotos]);
    fire(`${files.length}개 사진 불러옴`);
    e.target.value = "";
  };
  const totalSize = photos.reduce((s, x) => s + parseFloat(x.size), 0).toFixed(1);

  const fClips = clips.filter(i => !q1 || i.text.toLowerCase().includes(q1.toLowerCase()));
  const fPhrases = phrases.filter(i => !q2 || i.text.toLowerCase().includes(q2.toLowerCase()) || i.label.toLowerCase().includes(q2.toLowerCase()));
  const hasOrphan = fPhrases.some(p => !groups.find(g => g.id === p.gid));
  const displayGids = [...groups.map(g => g.id), ...(hasOrphan ? ["__none__"] : [])];

  // Group panel
  const GrpPanel = ({ onBack }) => (<>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}><button onClick={onBack} style={S.sBtnTxt}>← 돌아가기</button><span style={{ fontWeight: 700, fontSize: 16, color: "#f1f5f9" }}>그룹 관리</span><div style={{ width: 60 }}/></div>
    <div style={S.addGrpCard}><p style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginBottom: 10 }}>새 그룹 추가</p><div style={{ display: "flex", gap: 8, alignItems: "center" }}><button onClick={() => setIconPick(!iconPick)} style={S.iconBtn}><span style={{ fontSize: 20 }}>{newGI}</span></button><input ref={grpRef} value={newGN} onChange={e => setNewGN(e.target.value)} placeholder="그룹 이름..." onKeyDown={e => { if (e.key === "Enter") addGroup(); }} style={{ ...S.inp, flex: 1 }}/><button onClick={addGroup} style={{ ...S.addGBtn, opacity: newGN.trim() ? 1 : .35 }}>추가</button></div>{iconPick && <div style={S.iconGrid}>{GICONS.map(ic => <button key={ic} onClick={() => { setNewGI(ic); setIconPick(false); }} style={{ ...S.iconItem, ...(newGI === ic ? { background: "rgba(99,102,241,.2)", borderColor: "#6366f1" } : {}) }}>{ic}</button>)}</div>}</div>
    <p style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginTop: 16, marginBottom: 8 }}>등록된 그룹 ({groups.length})</p>
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>{groups.map(g => { const cnt = phrases.filter(p => p.gid === g.id).length; const isDel = delConf === g.id; const rem = groups.filter(x => x.id !== g.id); return <div key={g.id} style={{ ...S.grpItem, ...(isDel ? { borderColor: "rgba(239,68,68,.3)", background: "rgba(239,68,68,.04)" } : {}) }}><div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}><span style={{ fontSize: 20 }}>{g.icon}</span><div><p style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>{g.name}</p><p style={{ fontSize: 11, color: "#64748b" }}>{cnt}개</p></div></div>{isDel ? <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>{cnt > 0 && rem.length > 0 && <div style={{ marginBottom: 4 }}><p style={{ fontSize: 11, color: "#f87171", marginBottom: 4 }}>문구 이동:</p><div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{rem.map(r => <button key={r.id} onClick={() => setReassign(r.id)} style={{ ...S.miniChip, ...(reassign === r.id ? S.miniAct : {}) }}>{r.icon} {r.name}</button>)}</div></div>}<div style={{ display: "flex", gap: 6 }}><button onClick={() => { setDelConf(null); setReassign(null); }} style={S.gCancel}>취소</button><button onClick={() => removeGroup(g.id)} style={S.gConfDel}>삭제</button></div></div> : <button onClick={() => { setDelConf(g.id); setReassign(rem[0]?.id || null); }} style={S.gDelBtn}><span style={{ fontSize: 14 }}>🗑</span></button>}</div>; })}</div>
  </>);

  return (
    <div style={S.phone}>
      <div style={S.sbar}><span style={{ fontWeight: 600, fontSize: 14 }}>9:41</span><div style={{ display: "flex", gap: 5, alignItems: "center" }}><svg width="16" height="12" viewBox="0 0 16 12" fill="white"><rect x="0" y="7" width="3" height="5" rx=".5" opacity=".4"/><rect x="4.5" y="5" width="3" height="7" rx=".5" opacity=".6"/><rect x="9" y="2" width="3" height="10" rx=".5" opacity=".8"/><rect x="13" y="0" width="3" height="12" rx=".5"/></svg><svg width="24" height="12" viewBox="0 0 24 12" fill="none"><rect x=".5" y=".5" width="21" height="11" rx="2" stroke="white"/><rect x="22" y="4" width="2" height="4" rx=".5" fill="white" opacity=".4"/><rect x="2" y="2" width="14" height="8" rx="1" fill="#34d399"/></svg></div></div>

      {/* ═══ CLIPS ═══ */}
      {tab === "clips" && <div style={S.pg}>
        <div style={S.nav}><button style={S.ni} onClick={() => { if (clips.length && confirm("전체 삭제?")) setClips([]); }}><span style={{ fontSize: 17, opacity: .45 }}>🗑</span></button><h1 style={S.tt}>클립보드</h1><button style={S.ni} onClick={() => fire("클립보드 캡처됨")}><span style={{ fontSize: 18 }}>📥</span></button></div>
        <SBar v={q1} set={setQ1} ph="검색..."/>
        {hint && clips.length > 0 && <div style={S.hintB}><span>💡</span><span style={{ flex: 1, fontSize: 12, color: "#94a3b8" }}>항목을 <b style={{ color: "#a5b4fc" }}>길게 누르면</b> 메뉴</span><button onClick={() => setHint(false)} style={S.hintX}>✕</button></div>}
        <div style={S.list}>{fClips.length === 0 ? <Nil icon="📋" t="클립보드가 비어있습니다" s="텍스트를 복사하면 자동 저장"/> : fClips.map(c => (
          <Pressable key={c.id} style={{ ...S.card, ...(copied === c.id ? S.cardOk : {}) }} onTap={() => doCopy(c)} onLongPress={() => { setCtx({ id: c.id, type: "clip" }); setHint(false); }}>
            <div style={S.cardH}><div style={{ display: "flex", gap: 6, alignItems: "center" }}><span style={{ fontSize: 12 }}>{catIcon(c.text)}</span><span style={{ fontSize: 11, color: "#64748b" }}>{c.app}</span></div><span style={{ fontSize: 11, color: "#4b5563" }}>{ago(c.ts)}</span></div>
            <p style={S.cardT}>{c.text.length > 120 ? c.text.slice(0, 120) + "…" : c.text}</p>
            <div style={{ textAlign: "right", marginTop: 6 }}>{copied === c.id ? <span style={{ fontSize: 12, color: "#22c55e", fontWeight: 600 }}>✅ 복사됨!</span> : <span style={{ fontSize: 11, color: "#4b5563" }}>탭→복사 ・ 길게→메뉴</span>}</div>
          </Pressable>
        ))}</div>
      </div>}

      {/* ═══ PHRASES ═══ */}
      {tab === "phrases" && <div style={S.pg}>
        <div style={S.nav}><button style={S.ni} onClick={() => { setNewGN(""); setNewGI("📁"); setIconPick(false); setDelConf(null); setReassign(null); setShowGrpMgr(true); }}><span style={{ fontSize: 17 }}>📂</span></button><h1 style={S.tt}>자주쓰는 문구</h1><button style={S.ni} onClick={() => { setAddText(""); setAddLabel(""); setAddGid(groups[0]?.id || ""); setAddMode("form"); setShowAdd(true); }}><span style={{ fontSize: 22, color: "#6366f1" }}>⊕</span></button></div>
        <SBar v={q2} set={setQ2} ph="문구 검색..."/>
        <div style={S.list}>{groups.length === 0 && phrases.length === 0 ? <Nil icon="⭐" t="등록된 문구 없음" s="⊕으로 추가"/> : displayGids.map(gid => {
          const gp = fPhrases.filter(i => gid === "__none__" ? !groups.find(g => g.id === i.gid) : i.gid === gid);
          return <div key={gid} style={{ marginBottom: 10 }}><div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, paddingLeft: 4 }}><span style={{ fontSize: 13 }}>{gid === "__none__" ? "📁" : gIcon(gid)}</span><span style={S.gLabel}>{gid === "__none__" ? "미분류" : gName(gid)}</span><span style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>{gp.length}</span></div>
            {gp.length === 0 ? <div style={S.emptyG}><p style={{ fontSize: 12, color: "#475569" }}>문구 없음</p></div> : <div style={S.gBox}>{gp.map((item, idx, arr) => <Pressable key={item.id} style={{ ...S.pRow, ...(idx < arr.length - 1 ? { borderBottom: "1px solid rgba(255,255,255,.04)" } : {}), ...(copied === item.id ? { background: "rgba(34,197,94,.05)" } : {}) }} onTap={() => doCopy(item)} onLongPress={() => { setCtx({ id: item.id, type: "phrase" }); }}><div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}><span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span><div style={{ minWidth: 0, flex: 1 }}><p style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 2 }}>{item.label}</p><p style={{ fontSize: 12, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.text}</p></div></div>{copied === item.id ? <span style={{ fontSize: 12, color: "#22c55e" }}>✅</span> : <span style={{ fontSize: 16, color: "#475569" }}>›</span>}</Pressable>)}</div>}
          </div>;
        })}</div>
      </div>}

      {/* ═══ SCREENSHOTS ═══ */}
      {tab === "screenshots" && <div style={S.pg}>
        <div style={S.nav}>
          <div style={{ width: 30 }}/>
          <h1 style={S.tt}>스크린샷 정리</h1>
          {photos.length > 0 ? <button style={S.ni} onClick={selectAll}><span style={{ fontSize: 13, color: ssSelected.size === photos.length ? "#6366f1" : "#94a3b8", fontWeight: 600 }}>{ssSelected.size === photos.length ? "해제" : "전체"}</span></button> : <div style={{ width: 30 }}/>}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileUpload} style={{ display: "none" }}/>

        {photos.length === 0 ? (
          /* 비어있을 때 - 큰 불러오기 버튼 */
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, gap: 16 }}>
            <div style={{ width: 80, height: 80, borderRadius: 24, background: "rgba(99,102,241,.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 40 }}>📸</span>
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>스크린샷을 불러오세요</p>
            <p style={{ fontSize: 13, color: "#64748b", textAlign: "center", lineHeight: 1.6 }}>사진앱에서 정리할 스크린샷을<br/>선택하면 여기에 표시됩니다</p>
            <button onClick={() => fileInputRef.current?.click()} style={S.bigUploadBtn}>
              📷 사진앱에서 불러오기
            </button>
          </div>
        ) : (
          /* 사진이 있을 때 */
          <>
            {/* 통계 + 추가 버튼 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 16px 10px" }}>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}><span style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9" }}>{photos.length}</span><span style={{ fontSize: 11, color: "#64748b" }}>장</span></div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}><span style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9" }}>{totalSize}</span><span style={{ fontSize: 11, color: "#64748b" }}>MB</span></div>
                {ssSelected.size > 0 && <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}><span style={{ fontSize: 20, fontWeight: 800, color: "#ef4444" }}>{ssSelected.size}</span><span style={{ fontSize: 11, color: "#64748b" }}>선택</span></div>}
              </div>
              <button onClick={() => fileInputRef.current?.click()} style={S.addMoreBtn}>+ 추가</button>
            </div>

            <p style={{ padding: "0 16px 8px", fontSize: 12, color: "#64748b" }}>탭하여 선택 → 하단 삭제 버튼</p>

            {/* Grid */}
            <div style={S.ssGrid}>
              {photos.map(ss => {
                const sel = ssSelected.has(ss.id);
                return (
                  <div key={ss.id} onClick={() => toggleSsSelect(ss.id)}
                    style={{ ...S.ssThumb, ...(sel ? { outline: "3px solid #ef4444", outlineOffset: -3 } : {}) }}>
                    <img src={ss.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }}/>
                    <div style={{ ...S.ssCheck, ...(sel ? S.ssChecked : {}) }}>
                      {sel && <span style={{ fontSize: 12, color: "#fff" }}>✓</span>}
                    </div>
                    <div style={S.ssBadge}>{ss.size}</div>
                    {sel && <div style={S.ssOverlay}/>}
                  </div>
                );
              })}
            </div>

            {/* 삭제 버튼 - 선택된 것이 있을 때 */}
            {ssSelected.size > 0 && (
              <div style={S.ssFloatBar}>
                <button onClick={() => setShowDeleteConfirm(true)} style={S.ssDelBtn}>
                  🗑 {ssSelected.size}개 삭제하기
                </button>
              </div>
            )}
          </>
        )}
      </div>}

      {/* ═══ SETTINGS ═══ */}
      {tab === "settings" && <div style={S.pg}>
        <div style={S.nav}><div/><h1 style={S.tt}>설정</h1><div/></div>
        <div style={{ padding: "4px 16px" }}>
          {[{ t: "일반", r: [{ i: "🔄", l: "자동 클립보드 감지", right: <Tog on /> }, { i: "📳", l: "햅틱 피드백", right: <Tog on /> }] }, { t: "통계", r: [{ i: "📋", l: "클립보드", right: <span style={{ color: "#64748b", fontSize: 13 }}>{clips.length}개</span> }, { i: "⭐", l: "문구", right: <span style={{ color: "#64748b", fontSize: 13 }}>{phrases.length}개</span> }, { i: "📸", l: "스크린샷", right: <span style={{ color: "#64748b", fontSize: 13 }}>{photos.length}장 / {totalSize}MB</span> }] }].map((sec, si) => (
            <div key={si} style={{ marginBottom: 18 }}><p style={{ fontSize: 11, color: "#64748b", fontWeight: 700, marginBottom: 5, paddingLeft: 4, letterSpacing: .5 }}>{sec.t}</p><div style={S.setG}>{sec.r.map((r, ri) => <div key={ri} style={{ ...S.setR, ...(ri < sec.r.length - 1 ? { borderBottom: "1px solid rgba(255,255,255,.04)" } : {}) }}><div style={{ flex: 1, display: "flex", gap: 8, alignItems: "center" }}><span style={{ fontSize: 16 }}>{r.i}</span><span style={{ fontSize: 15, color: "#e2e8f0" }}>{r.l}</span></div>{r.right}</div>)}</div></div>
          ))}
        </div>
      </div>}

      {/* Tab Bar */}
      <div style={S.tbar}>{[{ id: "clips", ic: "📋", lb: "클립보드" }, { id: "phrases", ic: "⭐", lb: "문구" }, { id: "screenshots", ic: "📸", lb: "스크린샷" }, { id: "settings", ic: "⚙️", lb: "설정" }].map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ ...S.tBtn, color: tab === t.id ? "#6366f1" : "#4b5563" }}><span style={{ fontSize: 20 }}>{t.ic}</span><span style={{ fontSize: 9, fontWeight: tab === t.id ? 700 : 500, marginTop: 1 }}>{t.lb}</span></button>)}</div>

      {toast && <div style={S.toast}>✅ {toast}</div>}

      {/* Context Menu */}
      {ctx && <div style={S.ov} onClick={() => setCtx(null)}><div style={S.ctxS} onClick={e => e.stopPropagation()}>
        <div style={S.sBar}/>{(() => { const item = ctx.type === "clip" ? clips.find(x => x.id === ctx.id) : phrases.find(x => x.id === ctx.id); return item ? <div style={S.ctxPre}><p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5 }}>{item.text.length > 80 ? item.text.slice(0, 80) + "…" : item.text}</p></div> : null; })()}
        {ctx.type === "clip" ? <>
          <button style={S.ctxR} onClick={() => { const i = clips.find(x => x.id === ctx.id); if (i) doCopy(i); setCtx(null); }}><span style={S.ctxI}>📋</span> 복사</button>
          <button style={S.ctxR} onClick={() => { const i = clips.find(x => x.id === ctx.id); if (i) startSaveFlow(i); }}><span style={S.ctxI}>⭐</span> 자주쓰는 문구로 저장</button>
          <div style={S.ctxD}/><button style={{ ...S.ctxR, color: "#ef4444" }} onClick={() => { setClips(p => p.filter(i => i.id !== ctx.id)); setCtx(null); }}><span style={S.ctxI}>🗑</span> 삭제</button>
        </> : <>
          <button style={S.ctxR} onClick={() => { const i = phrases.find(x => x.id === ctx.id); if (i) doCopy(i); setCtx(null); }}><span style={S.ctxI}>📋</span> 복사</button>
          <button style={S.ctxR} onClick={() => { const i = phrases.find(x => x.id === ctx.id); if (i) { setEdit(i); setEditText(i.text); setEditLabel(i.label); setEditGid(i.gid); } setCtx(null); }}><span style={S.ctxI}>✏️</span> 수정</button>
          <div style={S.ctxD}/><button style={{ ...S.ctxR, color: "#ef4444" }} onClick={() => { setPhrases(p => p.filter(i => i.id !== ctx.id)); setCtx(null); }}><span style={S.ctxI}>🗑</span> 삭제</button>
        </>}
        <button style={S.ctxCancel} onClick={() => setCtx(null)}>취소</button>
      </div></div>}

      {/* Save Flow */}
      {saveFlow && <div style={S.ov} onClick={() => setSaveFlow(null)}><div style={S.sheet} onClick={e => e.stopPropagation()}>
        <div style={S.sBar}/>
        {saveFlow.step === "group" ? <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><button onClick={() => setSaveFlow(null)} style={S.sBtnTxt}>취소</button><span style={{ fontWeight: 700, fontSize: 16, color: "#f1f5f9" }}>그룹 선택</span><button onClick={() => saveFlow.gid && setSaveFlow({ ...saveFlow, step: "label" })} style={{ ...S.sBtnTxt, fontWeight: 700, opacity: saveFlow.gid ? 1 : .35 }}>다음</button></div>
          <div style={{ padding: "10px 12px", background: "rgba(255,255,255,.04)", borderRadius: 10, marginBottom: 14 }}><p style={{ fontSize: 12, color: "#94a3b8" }}>{saveFlow.text.length > 80 ? saveFlow.text.slice(0, 80) + "…" : saveFlow.text}</p></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{groups.map(g => <button key={g.id} onClick={() => setSaveFlow({ ...saveFlow, gid: g.id })} style={{ ...S.grpSelRow, ...(saveFlow.gid === g.id ? S.grpSelAct : {}) }}><span style={{ fontSize: 20 }}>{g.icon}</span><span style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0" }}>{g.name}</span><span style={{ marginLeft: "auto", fontSize: 11, color: "#475569" }}>{phrases.filter(p => p.gid === g.id).length}개</span>{saveFlow.gid === g.id && <span style={{ fontSize: 16, color: "#6366f1", marginLeft: 8 }}>✓</span>}</button>)}</div>
        </> : <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><button onClick={() => setSaveFlow({ ...saveFlow, step: "group" })} style={S.sBtnTxt}>← 뒤로</button><span style={{ fontWeight: 700, fontSize: 16, color: "#f1f5f9" }}>라벨 입력</span><button onClick={finishSaveFlow} style={{ ...S.sBtnTxt, fontWeight: 700 }}>저장</button></div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, padding: "8px 12px", background: "rgba(99,102,241,.06)", borderRadius: 10 }}><span style={{ fontSize: 16 }}>{gIcon(saveFlow.gid)}</span><span style={{ fontSize: 14, fontWeight: 600, color: "#a5b4fc" }}>{gName(saveFlow.gid)}</span></div>
          <label style={S.fLabel}>라벨 (선택)</label><input value={saveFlow.label} onChange={e => setSaveFlow({ ...saveFlow, label: e.target.value })} placeholder="예: 메모, 링크, 코드..." style={S.inp} autoFocus/><p style={{ fontSize: 11, color: "#475569", marginTop: 6 }}>비워두면 텍스트 앞부분이 라벨로 사용됩니다</p>
        </>}
      </div></div>}

      {/* Add Phrase */}
      {showAdd && <div style={S.ov} onClick={() => setShowAdd(false)}><div style={S.sheet} onClick={e => e.stopPropagation()}>
        <div style={S.sBar}/>{addMode === "form" ? <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><button onClick={() => setShowAdd(false)} style={S.sBtnTxt}>취소</button><span style={{ fontWeight: 700, fontSize: 16, color: "#f1f5f9" }}>문구 추가</span><button onClick={() => { if (!addText.trim() || !addLabel.trim()) return; setPhrases(p => [...p, { id: Date.now(), text: addText.trim(), label: addLabel.trim(), gid: addGid || groups[0]?.id || "__none__", icon: "📝" }]); setShowAdd(false); fire("추가됨"); }} style={{ ...S.sBtnTxt, fontWeight: 700, opacity: addText.trim() && addLabel.trim() ? 1 : .35 }}>저장</button></div>
          <label style={S.fLabel}>텍스트 *</label><textarea ref={addRef} value={addText} onChange={e => setAddText(e.target.value)} placeholder="문구 입력..." style={S.ta} rows={3}/><label style={S.fLabel}>라벨 *</label><input value={addLabel} onChange={e => setAddLabel(e.target.value)} placeholder="예: 집 주소..." style={S.inp}/><label style={S.fLabel}>그룹</label><div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>{groups.map(g => <button key={g.id} onClick={() => setAddGid(g.id)} style={{ ...S.gChip, ...(addGid === g.id ? S.gChipA : {}) }}><span style={{ fontSize: 13 }}>{g.icon}</span> {g.name}</button>)}</div>
          <button onClick={() => { setAddMode("groups"); setNewGN(""); setNewGI("📁"); setIconPick(false); setDelConf(null); }} style={S.mgrBtn}>⚙️ 그룹 관리</button>
        </> : <GrpPanel onBack={() => setAddMode("form")} />}
      </div></div>}

      {/* Group Manage */}
      {showGrpMgr && <div style={S.ov} onClick={() => setShowGrpMgr(false)}><div style={S.sheet} onClick={e => e.stopPropagation()}><div style={S.sBar}/><GrpPanel onBack={() => setShowGrpMgr(false)} /></div></div>}

      {/* Edit Phrase */}
      {edit && <div style={S.ov} onClick={() => setEdit(null)}><div style={S.sheet} onClick={e => e.stopPropagation()}>
        <div style={S.sBar}/><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><button onClick={() => setEdit(null)} style={S.sBtnTxt}>취소</button><span style={{ fontWeight: 700, fontSize: 16, color: "#f1f5f9" }}>수정</span><button onClick={() => { setPhrases(p => p.map(i => i.id === edit.id ? { ...i, text: editText.trim(), label: editLabel.trim(), gid: editGid } : i)); setEdit(null); fire("수정 완료"); }} style={{ ...S.sBtnTxt, fontWeight: 700 }}>저장</button></div>
        <label style={S.fLabel}>텍스트</label><textarea value={editText} onChange={e => setEditText(e.target.value)} style={S.ta} rows={3}/><label style={S.fLabel}>라벨</label><input value={editLabel} onChange={e => setEditLabel(e.target.value)} style={S.inp}/><label style={S.fLabel}>그룹</label><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{groups.map(g => <button key={g.id} onClick={() => setEditGid(g.id)} style={{ ...S.gChip, ...(editGid === g.id ? S.gChipA : {}) }}><span style={{ fontSize: 13 }}>{g.icon}</span> {g.name}</button>)}</div>
      </div></div>}

      {/* Delete Confirm */}
      {showDeleteConfirm && <div style={S.ov} onClick={() => setShowDeleteConfirm(false)}>
        <div style={{ ...S.sheet, padding: "20px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🗑</div>
          <p style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>{ssSelected.size}개 삭제</p>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 6 }}>선택한 사진을 삭제합니다</p>
          <p style={{ fontSize: 12, color: "#475569", marginBottom: 20 }}>실제 iOS 앱에서는 사진앱에서도 삭제됩니다</p>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1, padding: "14px", borderRadius: 12, border: "1px solid rgba(255,255,255,.1)", background: "none", color: "#94a3b8", fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
            <button onClick={deleteSelected} style={{ flex: 1, padding: "14px", borderRadius: 12, border: "none", background: "#ef4444", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>삭제</button>
          </div>
        </div>
      </div>}

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0;-webkit-font-smoothing:antialiased}::-webkit-scrollbar{width:0}@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
    </div>
  );
}

function SBar({ v, set, ph }) { return <div style={{ padding: "0 16px 8px" }}><div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.05)", borderRadius: 12, padding: "9px 14px" }}><span style={{ fontSize: 13, opacity: .4 }}>🔍</span><input value={v} onChange={e => set(e.target.value)} placeholder={ph} style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#e2e8f0", fontSize: 14, fontFamily: "inherit" }}/>{v && <button onClick={() => set("")} style={{ background: "none", border: "none", color: "#64748b", fontSize: 13, cursor: "pointer" }}>✕</button>}</div></div>; }
function Nil({ icon, t, s }) { return <div style={{ textAlign: "center", padding: "50px 20px" }}><div style={{ fontSize: 44, opacity: .25, marginBottom: 10 }}>{icon}</div><p style={{ color: "#64748b", fontWeight: 600 }}>{t}</p><p style={{ color: "#475569", fontSize: 12, marginTop: 4 }}>{s}</p></div>; }
function Tog({ on: d = false }) { const [o, sO] = useState(d); return <div onClick={() => sO(!o)} style={{ width: 46, height: 27, borderRadius: 14, cursor: "pointer", background: o ? "#34d399" : "rgba(255,255,255,.1)", transition: "background .2s", position: "relative", flexShrink: 0 }}><div style={{ width: 23, height: 23, borderRadius: 12, background: "#fff", position: "absolute", top: 2, left: o ? 21 : 2, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.25)" }}/></div>; }

const S = {
  phone: { width: 390, height: 844, margin: "0 auto", background: "#0f172a", borderRadius: 44, border: "3px solid #1e293b", fontFamily: "'Noto Sans KR',-apple-system,sans-serif", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 25px 60px rgba(0,0,0,.5)" },
  sbar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 28px 6px", color: "#fff", flexShrink: 0 },
  pg: { flex: 1, overflowY: "auto", overflowX: "hidden", display: "flex", flexDirection: "column" },
  nav: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 20px 8px", flexShrink: 0 },
  ni: { background: "none", border: "none", cursor: "pointer", padding: 4 },
  tt: { fontSize: 24, fontWeight: 800, color: "#f8fafc", letterSpacing: "-.03em" },
  list: { padding: "0 16px 16px", flex: 1 },
  hintB: { display: "flex", alignItems: "center", gap: 8, margin: "0 16px 8px", padding: "9px 12px", background: "rgba(99,102,241,.06)", border: "1px solid rgba(99,102,241,.15)", borderRadius: 10 },
  hintX: { background: "none", border: "none", color: "#475569", fontSize: 14, cursor: "pointer" },
  card: { background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 14, padding: "11px 13px", marginBottom: 7, cursor: "pointer" },
  cardOk: { background: "rgba(34,197,94,.05)", borderColor: "rgba(34,197,94,.25)" },
  cardH: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 },
  cardT: { fontSize: 14, color: "#cbd5e1", lineHeight: 1.5, wordBreak: "break-word", whiteSpace: "pre-wrap" },
  gLabel: { fontSize: 12, color: "#94a3b8", fontWeight: 700, letterSpacing: .3 },
  gBox: { background: "rgba(255,255,255,.035)", borderRadius: 12, overflow: "hidden" },
  pRow: { display: "flex", alignItems: "center", padding: "12px 14px", cursor: "pointer" },
  emptyG: { padding: "14px 16px", background: "rgba(255,255,255,.02)", borderRadius: 12, border: "1px dashed rgba(255,255,255,.08)" },
  tbar: { display: "flex", justifyContent: "space-around", alignItems: "center", padding: "5px 0 26px", borderTop: "1px solid rgba(255,255,255,.05)", background: "rgba(15,23,42,.97)", flexShrink: 0 },
  tBtn: { display: "flex", flexDirection: "column", alignItems: "center", background: "none", border: "none", cursor: "pointer", padding: "3px 6px", fontFamily: "inherit" },
  toast: { position: "absolute", top: 58, left: "50%", transform: "translateX(-50%)", background: "rgba(30,41,59,.95)", color: "#fff", padding: "9px 18px", borderRadius: 18, fontSize: 13, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,.35)", zIndex: 100, display: "flex", gap: 5, alignItems: "center" },
  ov: { position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" },
  sheet: { background: "#1e293b", width: "100%", borderRadius: "18px 18px 0 0", padding: "10px 20px 36px", maxHeight: "80%", overflowY: "auto" },
  sBar: { width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,.12)", margin: "0 auto 10px" },
  sBtnTxt: { background: "none", border: "none", color: "#6366f1", fontSize: 15, cursor: "pointer", fontFamily: "inherit" },
  ctxS: { background: "#1e293b", width: "100%", borderRadius: "18px 18px 0 0", padding: "10px 8px 36px", animation: "slideUp .2s ease" },
  ctxPre: { margin: "0 12px 8px", padding: "10px 12px", background: "rgba(255,255,255,.04)", borderRadius: 10, border: "1px solid rgba(255,255,255,.06)" },
  ctxR: { display: "flex", gap: 12, alignItems: "center", width: "100%", padding: "14px 18px", background: "none", border: "none", color: "#e2e8f0", fontSize: 16, cursor: "pointer", fontFamily: "inherit", textAlign: "left", borderRadius: 10 },
  ctxI: { fontSize: 18, width: 24, textAlign: "center" },
  ctxD: { height: 1, background: "rgba(255,255,255,.06)", margin: "4px 18px" },
  ctxCancel: { display: "block", width: "calc(100% - 16px)", margin: "8px auto 0", padding: "14px", background: "rgba(255,255,255,.05)", border: "none", borderRadius: 12, color: "#6366f1", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", textAlign: "center" },
  grpSelRow: { display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "rgba(255,255,255,.035)", borderRadius: 12, border: "1px solid rgba(255,255,255,.06)", cursor: "pointer" },
  grpSelAct: { borderColor: "rgba(99,102,241,.4)", background: "rgba(99,102,241,.08)" },
  fLabel: { display: "block", fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 5, marginTop: 12 },
  ta: { width: "100%", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, padding: "11px 13px", color: "#f1f5f9", fontSize: 14, fontFamily: "inherit", resize: "none", outline: "none" },
  inp: { width: "100%", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, padding: "10px 13px", color: "#f1f5f9", fontSize: 14, fontFamily: "inherit", outline: "none" },
  gChip: { display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.04)", color: "#94a3b8", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  gChipA: { background: "rgba(99,102,241,.15)", borderColor: "rgba(99,102,241,.4)", color: "#a5b4fc" },
  mgrBtn: { display: "flex", alignItems: "center", gap: 6, width: "100%", padding: "11px 14px", marginTop: 10, borderRadius: 10, border: "1px dashed rgba(99,102,241,.3)", background: "rgba(99,102,241,.04)", color: "#818cf8", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", justifyContent: "center" },
  addGrpCard: { background: "rgba(255,255,255,.04)", borderRadius: 12, padding: 14, border: "1px solid rgba(255,255,255,.06)" },
  iconBtn: { width: 44, height: 44, borderRadius: 10, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 },
  addGBtn: { padding: "10px 16px", borderRadius: 10, border: "none", background: "#6366f1", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 },
  iconGrid: { display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 6, marginTop: 10, background: "rgba(0,0,0,.15)", borderRadius: 10, padding: 10 },
  iconItem: { width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: "1px solid rgba(255,255,255,.06)", background: "rgba(255,255,255,.03)", fontSize: 18, cursor: "pointer" },
  grpItem: { display: "flex", alignItems: "center", padding: "12px 14px", background: "rgba(255,255,255,.035)", borderRadius: 12, border: "1px solid rgba(255,255,255,.06)" },
  gDelBtn: { background: "none", border: "none", cursor: "pointer", padding: "6px 8px", opacity: .5 },
  gCancel: { padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,.1)", background: "none", color: "#94a3b8", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  gConfDel: { padding: "5px 12px", borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  miniChip: { padding: "3px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.03)", color: "#94a3b8", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  miniAct: { background: "rgba(99,102,241,.15)", borderColor: "rgba(99,102,241,.4)", color: "#a5b4fc" },
  setG: { background: "rgba(255,255,255,.035)", borderRadius: 12, overflow: "hidden" },
  setR: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 14px" },

  // Screenshots
  bigUploadBtn: { padding: "14px 28px", borderRadius: 14, border: "none", background: "#6366f1", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginTop: 8, boxShadow: "0 4px 16px rgba(99,102,241,.3)" },
  addMoreBtn: { padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(99,102,241,.3)", background: "rgba(99,102,241,.06)", color: "#818cf8", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  ssGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, padding: "0 16px 12px" },
  ssThumb: { position: "relative", aspectRatio: "9/16", borderRadius: 10, overflow: "hidden", cursor: "pointer", border: "1px solid rgba(255,255,255,.06)" },
  ssCheck: { position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: 11, border: "2px solid rgba(255,255,255,.4)", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.3)" },
  ssChecked: { background: "#ef4444", borderColor: "#ef4444" },
  ssBadge: { position: "absolute", bottom: 4, left: 4, padding: "1px 5px", borderRadius: 4, background: "rgba(0,0,0,.6)", fontSize: 9, color: "rgba(255,255,255,.6)", fontWeight: 600 },
  ssOverlay: { position: "absolute", inset: 0, background: "rgba(239,68,68,.15)", borderRadius: 8 },
  ssFloatBar: { position: "sticky", bottom: 0, padding: "12px 16px", background: "linear-gradient(transparent, #0f172a 30%)" },
  ssDelBtn: { width: "100%", padding: "14px", borderRadius: 14, border: "none", background: "#ef4444", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 20px rgba(239,68,68,.3)" },

  kbScr: { background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 12, padding: 14, minHeight: 90, position: "relative", marginBottom: 12 },
  kbExt: { background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 14, overflow: "hidden" },
  kbH: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,.04)" },
  kbTb: { background: "none", border: "none", color: "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", padding: "3px 8px", borderRadius: 6 },
  kbTbA: { background: "rgba(99,102,241,.15)", color: "#818cf8" },
  kbI: { background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.05)", borderRadius: 9, padding: "9px 11px", cursor: "pointer" },
};
