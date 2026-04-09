import { useState, useRef, useCallback, useEffect } from "react";

// ── Storage ──
const load = (key, fallback) => { try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; } catch { return fallback; } };
const save = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };
const hasKey = (key) => { try { return localStorage.getItem(key) !== null; } catch { return false; } };

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

// ── Data (defaults for first-time users only) ──
const INIT_CLIPS = [];
const INIT_GROUPS = [
  { id: "g1", name: "계정 정보", icon: "🔑" }, { id: "g2", name: "주소", icon: "📍" },
  { id: "g3", name: "비즈니스", icon: "💼" }, { id: "g4", name: "금융", icon: "🏦" },
];
const INIT_PHRASES = [];
const GICONS = ["📁","🔑","📍","💼","🏦","🎯","🛒","📚","🎨","🔧","💡","🏠","📞","✈️","🎮","🍔","💊","🐾"];

const catIcon = t => { if (/^https?:\/\//.test(t)) return "🔗"; if (t.includes("@") && t.includes(".") && !t.includes(" ")) return "✉️"; const d = t.replace(/[^0-9+\-]/g, ""); if (d.length >= 9 && d.length <= 15 && /^[\d\-+\s()]+$/.test(t.trim())) return "📞"; return "📝"; };
const ago = ts => { const d = Date.now() - ts; if (d < 60000) return "방금 전"; if (d < 3600000) return `${Math.floor(d / 60000)}분 전`; if (d < 86400000) return `${Math.floor(d / 3600000)}시간 전`; return `${Math.floor(d / 86400000)}일 전`; };
const MAX_CLIPS = 500;

export default function App() {
  const [tab, setTab] = useState("clips");
  const [clips, setClips] = useState(() => load("cb_clips", INIT_CLIPS));
  const [phrases, setPhrases] = useState(() => load("cb_phrases", INIT_PHRASES));
  const [groups, setGroups] = useState(() => load("cb_groups", INIT_GROUPS));
  const [q1, setQ1] = useState(""); const [q2, setQ2] = useState("");
  const [copied, setCopied] = useState(null);
  const [toast, setToast] = useState(null);
  const [hint, setHint] = useState(true);
  const [ctx, setCtx] = useState(null);
  const [saveFlow, setSaveFlow] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addText, setAddText] = useState(""); const [addLabel, setAddLabel] = useState(""); const [addGid, setAddGid] = useState(""); const [addUrl, setAddUrl] = useState(""); const [addMode, setAddMode] = useState("form");
  const [edit, setEdit] = useState(null);
  const [editText, setEditText] = useState(""); const [editLabel, setEditLabel] = useState(""); const [editGid, setEditGid] = useState(""); const [editUrl, setEditUrl] = useState("");
  const [showGrpMgr, setShowGrpMgr] = useState(false);
  const [newGN, setNewGN] = useState(""); const [newGI, setNewGI] = useState("📁"); const [iconPick, setIconPick] = useState(false);
  const [delConf, setDelConf] = useState(null); const [reassign, setReassign] = useState(null);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchHistory, setSearchHistory] = useState(() => load("cb_history", []));
  const searchRef = useRef(null);

  // localStorage 자동 저장 (mounted 이후에만)
  const mounted = useRef(false);
  useEffect(() => { if (!mounted.current) { mounted.current = true; return; } save("cb_clips", clips); }, [clips]);
  useEffect(() => { if (!mounted.current) return; save("cb_phrases", phrases); }, [phrases]);
  useEffect(() => { if (!mounted.current) return; save("cb_groups", groups); }, [groups]);
  useEffect(() => { if (!mounted.current) return; save("cb_history", searchHistory); }, [searchHistory]);

  const [kbIn, setKbIn] = useState(""); const [kbTab, setKbTab] = useState("clips");
  const addRef = useRef(null); const grpRef = useRef(null);

  const fire = m => { setToast(m); setTimeout(() => setToast(null), 1500); };
  const doCopy = async item => { try { await navigator.clipboard.writeText(item.text); } catch {} setCopied(item.id); fire("클립보드에 복사됨"); setTimeout(() => setCopied(null), 1400); };

  // 클립보드 불러오기
  const [showPasteBox, setShowPasteBox] = useState(false);
  const pasteRef = useRef(null);
  const addClip = (text) => {
    setClips(p => [{ id: Date.now(), text, ts: Date.now(), app: "클립보드" }, ...p].slice(0, MAX_CLIPS));
  };
  const fetchClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        const trimmed = text.trim();
        if (clips.some(c => c.text === trimmed)) { fire("이미 저장된 내용입니다"); return; }
        addClip(trimmed);
        fire("클립보드 저장 완료!"); return;
      }
    } catch {}
    setShowPasteBox(true);
    setTimeout(() => pasteRef.current?.focus(), 100);
  };
  const handlePaste = (e) => {
    const text = (e.clipboardData?.getData("text") || "").trim();
    if (!text) return;
    e.preventDefault();
    if (clips.some(c => c.text === text)) { fire("이미 저장된 내용입니다"); setShowPasteBox(false); return; }
    addClip(text);
    fire("클립보드 저장 완료!");
    setShowPasteBox(false);
  };
  const gName = gid => groups.find(g => g.id === gid)?.name || "미분류";
  const gIcon = gid => groups.find(g => g.id === gid)?.icon || "📁";

  // Group CRUD
  const addGroup = () => { const n = newGN.trim(); if (!n || groups.some(g => g.name === n)) return; setGroups(p => [...p, { id: "g" + Date.now(), name: n, icon: newGI }]); setNewGN(""); setNewGI("📁"); setIconPick(false); fire(`'${n}' 추가됨`); };
  const removeGroup = gid => { const g = groups.find(x => x.id === gid); const rem = groups.filter(x => x.id !== gid); const target = reassign && reassign !== gid ? reassign : (rem[0]?.id || "__none__"); setPhrases(p => p.map(i => i.gid === gid ? { ...i, gid: target } : i)); setGroups(p => p.filter(x => x.id !== gid)); setDelConf(null); setReassign(null); fire(`'${g?.name}' 삭제됨`); };

  // Save flow
  const startSaveFlow = ci => { setCtx(null); setSaveFlow({ text: ci.text, step: "group", gid: groups[0]?.id || "", label: "" }); };
  const finishSaveFlow = () => { if (!saveFlow) return; setPhrases(p => [...p, { id: Date.now(), text: saveFlow.text, label: saveFlow.label.trim() || saveFlow.text.slice(0, 20), gid: saveFlow.gid || "__none__", icon: "📝" }]); setSaveFlow(null); fire("문구로 저장됨! ⭐"); };

  // Search
  const doSearch = (q) => {
    const query = (q || searchQuery).trim();
    if (!query) return;
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank");
    setSearchHistory(p => {
      const filtered = p.filter(h => h.text !== query);
      return [{ id: Date.now(), text: query, ts: Date.now() }, ...filtered].slice(0, 30);
    });
    setSearchQuery("");
  };
  const deleteHistory = id => setSearchHistory(p => p.filter(h => h.id !== id));
  const clearHistory = () => setSearchHistory([]);
  const searchFromClip = (text) => {
    setSearchQuery(text);
    setTab("search");
    setTimeout(() => searchRef.current?.focus(), 100);
  };

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

      {/* ═══ CLIPS ═══ */}
      {tab === "clips" && <div style={S.pg}>
        <div style={S.nav}><button style={S.ni} onClick={() => { if (clips.length && confirm("전체 삭제?")) setClips([]); }}><span style={{ fontSize: 17, opacity: clips.length ? .45 : 0 }}>🗑</span></button><h1 style={S.tt}>클립보드</h1><button style={S.ni} onClick={fetchClipboard}><span style={{ fontSize: 18 }}>📥</span></button></div>

        {/* 불러오기 바 */}
        <div style={{ padding: "0 16px 10px" }}>
          <button onClick={fetchClipboard} style={S.fetchBtn}>
            <span style={{ fontSize: 16 }}>📋</span>
            <span>클립보드 불러오기</span>
          </button>
        </div>

        {/* 붙여넣기 입력창 (iPhone용 폴백) */}
        {showPasteBox && (
          <div style={{ padding: "0 16px 10px" }}>
            <div style={S.pasteBox}>
              <p style={{ fontSize: 12, color: "#a5b4fc", fontWeight: 600, marginBottom: 8 }}>아래 칸을 탭하고 "붙여넣기" 하세요</p>
              <input
                ref={pasteRef}
                onPaste={handlePaste}
                placeholder="여기를 탭 → 붙여넣기"
                style={S.pasteInput}
                readOnly
              />
              <button onClick={() => setShowPasteBox(false)} style={{ background: "none", border: "none", color: "#475569", fontSize: 12, cursor: "pointer", marginTop: 6, fontFamily: "inherit" }}>닫기</button>
            </div>
          </div>
        )}

        <SBar v={q1} set={setQ1} ph="검색..."/>
        {hint && clips.length > 0 && <div style={S.hintB}><span>💡</span><span style={{ flex: 1, fontSize: 12, color: "#94a3b8" }}>항목을 <b style={{ color: "#a5b4fc" }}>길게 누르면</b> 메뉴</span><button onClick={() => setHint(false)} style={S.hintX}>✕</button></div>}
        <div style={S.list}>
          {fClips.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: 48, opacity: .25, marginBottom: 12 }}>📋</div>
              <p style={{ color: "#64748b", fontWeight: 600, marginBottom: 6 }}>저장된 클립보드가 없습니다</p>
              <p style={{ color: "#475569", fontSize: 13, lineHeight: 1.6 }}>텍스트를 복사한 뒤<br/><b style={{ color: "#a5b4fc" }}>클립보드 불러오기</b>를 눌러보세요</p>
            </div>
          ) : fClips.map(c => (
            <Pressable key={c.id} style={{ ...S.card, ...(copied === c.id ? S.cardOk : {}) }} onTap={() => doCopy(c)} onLongPress={() => { setCtx({ id: c.id, type: "clip" }); setHint(false); }}>
              <div style={S.cardH}><div style={{ display: "flex", gap: 6, alignItems: "center" }}><span style={{ fontSize: 12 }}>{catIcon(c.text)}</span><span style={{ fontSize: 11, color: "#64748b" }}>{c.app}</span></div><span style={{ fontSize: 11, color: "#4b5563" }}>{ago(c.ts)}</span></div>
              <div style={S.cardScroll}><p style={S.cardT}>{c.text}</p></div>
              <div style={{ textAlign: "right", marginTop: 6 }}>{copied === c.id ? <span style={{ fontSize: 12, color: "#22c55e", fontWeight: 600 }}>✅ 복사됨!</span> : <span style={{ fontSize: 11, color: "#4b5563" }}>탭→복사 ・ 길게→메뉴</span>}</div>
            </Pressable>
          ))}
        </div>
      </div>}

      {/* ═══ PHRASES ═══ */}
      {tab === "phrases" && <div style={S.pg}>
        <div style={S.nav}><button style={S.ni} onClick={() => { setNewGN(""); setNewGI("📁"); setIconPick(false); setDelConf(null); setReassign(null); setShowGrpMgr(true); }}><span style={{ fontSize: 17 }}>📂</span></button><h1 style={S.tt}>자주쓰는 문구</h1><button style={S.ni} onClick={() => { setAddText(""); setAddLabel(""); setAddUrl(""); setAddGid(groups[0]?.id || ""); setAddMode("form"); setShowAdd(true); }}><span style={{ fontSize: 22, color: "#6366f1" }}>⊕</span></button></div>
        <SBar v={q2} set={setQ2} ph="문구 검색..."/>
        <div style={S.list}>{groups.length === 0 && phrases.length === 0 ? <Nil icon="⭐" t="등록된 문구 없음" s="⊕으로 추가"/> : displayGids.map(gid => {
          const gp = fPhrases.filter(i => gid === "__none__" ? !groups.find(g => g.id === i.gid) : i.gid === gid);
          return <div key={gid} style={{ marginBottom: 10 }}><div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, paddingLeft: 4 }}><span style={{ fontSize: 13 }}>{gid === "__none__" ? "📁" : gIcon(gid)}</span><span style={S.gLabel}>{gid === "__none__" ? "미분류" : gName(gid)}</span><span style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>{gp.length}</span></div>
            {gp.length === 0 ? <div style={S.emptyG}><p style={{ fontSize: 12, color: "#475569" }}>문구 없음</p></div> : <div style={S.gBox}>{gp.map((item, idx, arr) => (
              <div key={item.id} style={{ ...S.pRow, ...(idx < arr.length - 1 ? { borderBottom: "1px solid rgba(255,255,255,.04)" } : {}), ...(copied === item.id ? { background: "rgba(34,197,94,.05)" } : {}) }}>
                <Pressable style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0, cursor: "pointer" }} onTap={() => doCopy(item)} onLongPress={() => { setCtx({ id: item.id, type: "phrase" }); }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 2 }}>{item.label}</p>
                    <p style={{ fontSize: 12, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.text}</p>
                    {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 11, color: "#818cf8", textDecoration: "none", display: "flex", alignItems: "center", gap: 3, marginTop: 3 }}>🔗 {item.url.length > 30 ? item.url.slice(0, 30) + "…" : item.url}</a>}
                  </div>
                </Pressable>
                {copied === item.id ? <span style={{ fontSize: 12, color: "#22c55e", flexShrink: 0, padding: "8px 4px" }}>✅</span> : (
                  <button onClick={() => { setEdit(item); setEditText(item.text); setEditLabel(item.label); setEditGid(item.gid); setEditUrl(item.url || ""); }} style={S.editArrow}>›</button>
                )}
              </div>
            ))}</div>}
          </div>;
        })}</div>
      </div>}

      {/* ═══ SEARCH ═══ */}
      {tab === "search" && <div style={S.pg}>
        <div style={S.nav}>
          <div style={{ width: 30 }}/>
          <h1 style={S.tt}>검색</h1>
          <div style={{ width: 30 }}/>
        </div>

        {/* 검색창 */}
        <div style={{ padding: "0 16px 12px" }}>
          <div style={S.searchBar}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>🔍</span>
            <input
              ref={searchRef}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") doSearch(); }}
              placeholder="Google 검색..."
              style={S.searchInput}
              autoComplete="off"
            />
            {searchQuery && <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", color: "#64748b", fontSize: 16, cursor: "pointer", padding: 4, flexShrink: 0 }}>✕</button>}
          </div>
          <button onClick={() => doSearch()} disabled={!searchQuery.trim()} style={{ ...S.searchGoBtn, opacity: searchQuery.trim() ? 1 : .35 }}>
            🔍 Google 검색
          </button>
        </div>

        {/* 빠른 검색 - 클립보드 항목으로 바로 검색 */}
        {clips.length > 0 && (
          <div style={{ padding: "0 16px 12px" }}>
            <p style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 8 }}>📋 클립보드로 빠른 검색</p>
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
              {clips.slice(0, 5).map(c => (
                <button key={c.id} onClick={() => doSearch(c.text)} style={S.quickSearchChip}>
                  {c.text.length > 20 ? c.text.slice(0, 20) + "…" : c.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 자주쓰는 문구로 검색 */}
        {phrases.length > 0 && (
          <div style={{ padding: "0 16px 12px" }}>
            <p style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 8 }}>⭐ 문구로 빠른 검색</p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {phrases.slice(0, 6).map(p => (
                <button key={p.id} onClick={() => doSearch(p.text)} style={S.quickSearchChip2}>
                  {p.icon} {p.label || p.text.slice(0, 12)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 검색 히스토리 */}
        <div style={{ padding: "0 16px", flex: 1 }}>
          {searchHistory.length > 0 && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <p style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>🕐 최근 검색</p>
                <button onClick={clearHistory} style={{ background: "none", border: "none", color: "#475569", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>전체 삭제</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {searchHistory.map(h => (
                  <div key={h.id} style={S.historyRow}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => doSearch(h.text)}>
                      <span style={{ fontSize: 14, color: "#475569" }}>🕐</span>
                      <span style={{ fontSize: 14, color: "#cbd5e1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.text}</span>
                    </div>
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <button onClick={() => setSearchQuery(h.text)} style={S.historyAction}>↗</button>
                      <button onClick={() => deleteHistory(h.id)} style={{ ...S.historyAction, color: "#ef4444" }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {searchHistory.length === 0 && !searchQuery && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: 44, opacity: .25, marginBottom: 10 }}>🔍</div>
              <p style={{ color: "#64748b", fontWeight: 600 }}>검색어를 입력하세요</p>
              <p style={{ color: "#475569", fontSize: 12, marginTop: 6 }}>클립보드 항목을 길게 눌러<br/>바로 검색할 수도 있습니다</p>
            </div>
          )}
        </div>
      </div>}

      {/* ═══ SETTINGS ═══ */}
      {tab === "settings" && <div style={S.pg}>
        <div style={S.nav}><div/><h1 style={S.tt}>설정</h1><div/></div>
        <div style={{ padding: "4px 16px" }}>
          {[{ t: "일반", r: [{ i: "🔄", l: "자동 클립보드 감지", right: <Tog on /> }, { i: "📳", l: "햅틱 피드백", right: <Tog on /> }] }, { t: "통계", r: [{ i: "📋", l: "클립보드", right: <span style={{ color: "#64748b", fontSize: 13 }}>{clips.length}개</span> }, { i: "⭐", l: "문구", right: <span style={{ color: "#64748b", fontSize: 13 }}>{phrases.length}개</span> }, { i: "🔍", l: "검색 기록", right: <span style={{ color: "#64748b", fontSize: 13 }}>{searchHistory.length}개</span> }] }].map((sec, si) => (
            <div key={si} style={{ marginBottom: 18 }}><p style={{ fontSize: 11, color: "#64748b", fontWeight: 700, marginBottom: 5, paddingLeft: 4, letterSpacing: .5 }}>{sec.t}</p><div style={S.setG}>{sec.r.map((r, ri) => <div key={ri} style={{ ...S.setR, ...(ri < sec.r.length - 1 ? { borderBottom: "1px solid rgba(255,255,255,.04)" } : {}) }}><div style={{ flex: 1, display: "flex", gap: 8, alignItems: "center" }}><span style={{ fontSize: 16 }}>{r.i}</span><span style={{ fontSize: 15, color: "#e2e8f0" }}>{r.l}</span></div>{r.right}</div>)}</div></div>
          ))}
        </div>
      </div>}

      {/* Tab Bar */}
      <div style={S.tbar}>{[{ id: "clips", ic: "📋", lb: "클립보드" }, { id: "phrases", ic: "⭐", lb: "문구" }, { id: "search", ic: "🔍", lb: "검색" }, { id: "settings", ic: "⚙️", lb: "설정" }].map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ ...S.tBtn, color: tab === t.id ? "#6366f1" : "#4b5563" }}><span style={{ fontSize: 20 }}>{t.ic}</span><span style={{ fontSize: 9, fontWeight: tab === t.id ? 700 : 500, marginTop: 1 }}>{t.lb}</span></button>)}</div>

      {toast && <div style={S.toast}>✅ {toast}</div>}

      {/* Context Menu */}
      {ctx && <div style={S.ov} onClick={() => setCtx(null)}><div style={S.ctxS} onClick={e => e.stopPropagation()}>
        <div style={S.sBar}/>{(() => { const item = ctx.type === "clip" ? clips.find(x => x.id === ctx.id) : phrases.find(x => x.id === ctx.id); return item ? <div style={S.ctxPre}><p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5 }}>{item.text.length > 80 ? item.text.slice(0, 80) + "…" : item.text}</p></div> : null; })()}
        {ctx.type === "clip" ? <>
          <button style={S.ctxR} onClick={() => { const i = clips.find(x => x.id === ctx.id); if (i) doCopy(i); setCtx(null); }}><span style={S.ctxI}>📋</span> 복사</button>
          <button style={S.ctxR} onClick={() => { const i = clips.find(x => x.id === ctx.id); if (i) startSaveFlow(i); }}><span style={S.ctxI}>⭐</span> 자주쓰는 문구로 저장</button>
          <button style={S.ctxR} onClick={() => { const i = clips.find(x => x.id === ctx.id); if (i) { searchFromClip(i.text); } setCtx(null); }}><span style={S.ctxI}>🔍</span> 구글 검색</button>
          <div style={S.ctxD}/><button style={{ ...S.ctxR, color: "#ef4444" }} onClick={() => { setClips(p => p.filter(i => i.id !== ctx.id)); setCtx(null); }}><span style={S.ctxI}>🗑</span> 삭제</button>
        </> : <>
          <button style={S.ctxR} onClick={() => { const i = phrases.find(x => x.id === ctx.id); if (i) doCopy(i); setCtx(null); }}><span style={S.ctxI}>📋</span> 복사</button>
          <button style={S.ctxR} onClick={() => { const i = phrases.find(x => x.id === ctx.id); if (i) { setEdit(i); setEditText(i.text); setEditLabel(i.label); setEditGid(i.gid); setEditUrl(i.url || ""); } setCtx(null); }}><span style={S.ctxI}>✏️</span> 수정</button>
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <button onClick={() => setShowAdd(false)} style={S.sBtnTxt}>취소</button>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#f1f5f9" }}>문구 추가</span>
            <button onClick={() => {
              if (!addText.trim()) return;
              const url = addUrl.trim();
              const validUrl = url && !url.startsWith("http") ? "https://" + url : url;
              setPhrases(p => [...p, { id: Date.now(), text: addText.trim(), label: addLabel.trim() || addText.trim().slice(0, 15), gid: addGid || groups[0]?.id || "__none__", icon: "📝", url: validUrl || "" }]);
              setShowAdd(false); fire("추가됨");
            }} style={{ ...S.sBtnTxt, fontWeight: 700, opacity: addText.trim() ? 1 : .35 }}>저장</button>
          </div>
          <label style={S.fLabel}>텍스트 *</label>
          <textarea ref={addRef} value={addText} onChange={e => setAddText(e.target.value)} placeholder="문구 입력..." style={S.ta} rows={3}/>
          <label style={S.fLabel}>라벨</label>
          <input value={addLabel} onChange={e => setAddLabel(e.target.value)} placeholder="예: 집 주소, 계좌번호... (비우면 자동생성)" style={S.inp}/>
          <label style={S.fLabel}>URL (선택)</label>
          <input value={addUrl} onChange={e => setAddUrl(e.target.value)} placeholder="https://example.com" style={S.inp} type="url"/>
          <p style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>URL을 입력하면 문구 탭에서 링크로 연결됩니다</p>
          <label style={S.fLabel}>그룹</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>{groups.map(g => <button key={g.id} onClick={() => setAddGid(g.id)} style={{ ...S.gChip, ...(addGid === g.id ? S.gChipA : {}) }}><span style={{ fontSize: 13 }}>{g.icon}</span> {g.name}</button>)}</div>
          <button onClick={() => { setAddMode("groups"); setNewGN(""); setNewGI("📁"); setIconPick(false); setDelConf(null); }} style={S.mgrBtn}>⚙️ 그룹 관리</button>
        </> : <GrpPanel onBack={() => setAddMode("form")} />}
      </div></div>}

      {/* Group Manage */}
      {showGrpMgr && <div style={S.ov} onClick={() => setShowGrpMgr(false)}><div style={S.sheet} onClick={e => e.stopPropagation()}><div style={S.sBar}/><GrpPanel onBack={() => setShowGrpMgr(false)} /></div></div>}

      {/* Edit Phrase */}
      {edit && <div style={S.ov} onClick={() => setEdit(null)}><div style={S.sheet} onClick={e => e.stopPropagation()}>
        <div style={S.sBar}/>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <button onClick={() => setEdit(null)} style={S.sBtnTxt}>취소</button>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#f1f5f9" }}>수정</span>
          <button onClick={() => {
            const url = editUrl.trim();
            const validUrl = url && !url.startsWith("http") ? "https://" + url : url;
            setPhrases(p => p.map(i => i.id === edit.id ? { ...i, text: editText.trim(), label: editLabel.trim(), gid: editGid, url: validUrl || "" } : i));
            setEdit(null); fire("수정 완료");
          }} style={{ ...S.sBtnTxt, fontWeight: 700 }}>저장</button>
        </div>
        <label style={S.fLabel}>텍스트</label>
        <textarea value={editText} onChange={e => setEditText(e.target.value)} style={S.ta} rows={3}/>
        <label style={S.fLabel}>라벨</label>
        <input value={editLabel} onChange={e => setEditLabel(e.target.value)} style={S.inp}/>
        <label style={S.fLabel}>URL (선택)</label>
        <input value={editUrl} onChange={e => setEditUrl(e.target.value)} placeholder="https://example.com" style={S.inp} type="url"/>
        {editUrl.trim() && <p style={{ fontSize: 11, color: "#818cf8", marginTop: 4 }}>🔗 저장 시 링크로 연결됩니다</p>}
        <label style={S.fLabel}>그룹</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{groups.map(g => <button key={g.id} onClick={() => setEditGid(g.id)} style={{ ...S.gChip, ...(editGid === g.id ? S.gChipA : {}) }}><span style={{ fontSize: 13 }}>{g.icon}</span> {g.name}</button>)}</div>
      </div></div>}

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0;-webkit-font-smoothing:antialiased}::-webkit-scrollbar{width:0}@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
    </div>
  );
}

function SBar({ v, set, ph }) { return <div style={{ padding: "0 16px 8px" }}><div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.05)", borderRadius: 12, padding: "9px 14px" }}><span style={{ fontSize: 13, opacity: .4 }}>🔍</span><input value={v} onChange={e => set(e.target.value)} placeholder={ph} style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#e2e8f0", fontSize: 14, fontFamily: "inherit" }}/>{v && <button onClick={() => set("")} style={{ background: "none", border: "none", color: "#64748b", fontSize: 13, cursor: "pointer" }}>✕</button>}</div></div>; }
function Nil({ icon, t, s }) { return <div style={{ textAlign: "center", padding: "50px 20px" }}><div style={{ fontSize: 44, opacity: .25, marginBottom: 10 }}>{icon}</div><p style={{ color: "#64748b", fontWeight: 600 }}>{t}</p><p style={{ color: "#475569", fontSize: 12, marginTop: 4 }}>{s}</p></div>; }
function Tog({ on: d = false }) { const [o, sO] = useState(d); return <div onClick={() => sO(!o)} style={{ width: 46, height: 27, borderRadius: 14, cursor: "pointer", background: o ? "#34d399" : "rgba(255,255,255,.1)", transition: "background .2s", position: "relative", flexShrink: 0 }}><div style={{ width: 23, height: 23, borderRadius: 12, background: "#fff", position: "absolute", top: 2, left: o ? 21 : 2, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.25)" }}/></div>; }

const S = {
  phone: { width: "100%", height: "100dvh", margin: 0, background: "#0f172a", borderRadius: 0, border: "none", fontFamily: "'Noto Sans KR',-apple-system,sans-serif", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", },
  pg: { flex: 1, overflowY: "auto", overflowX: "hidden", display: "flex", flexDirection: "column" },
  nav: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "max(env(safe-area-inset-top),12px) 20px 8px", flexShrink: 0 },
  ni: { background: "none", border: "none", cursor: "pointer", padding: 4 },
  tt: { fontSize: 24, fontWeight: 800, color: "#f8fafc", letterSpacing: "-.03em" },
  list: { padding: "0 16px 16px", flex: 1 },
  hintB: { display: "flex", alignItems: "center", gap: 8, margin: "0 16px 8px", padding: "9px 12px", background: "rgba(99,102,241,.06)", border: "1px solid rgba(99,102,241,.15)", borderRadius: 10 },
  hintX: { background: "none", border: "none", color: "#475569", fontSize: 14, cursor: "pointer" },
  fetchBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "13px", borderRadius: 12, border: "1px solid rgba(99,102,241,.3)", background: "rgba(99,102,241,.08)", color: "#a5b4fc", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" },
  pasteBox: { padding: 14, background: "rgba(99,102,241,.06)", border: "1px solid rgba(99,102,241,.2)", borderRadius: 12, textAlign: "center" },
  pasteInput: { width: "100%", padding: "14px", borderRadius: 10, border: "2px dashed rgba(99,102,241,.4)", background: "rgba(255,255,255,.04)", color: "#f1f5f9", fontSize: 16, fontFamily: "inherit", textAlign: "center", outline: "none", caretColor: "transparent" },
  card: { background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 14, padding: "11px 13px", marginBottom: 7, cursor: "pointer" },
  cardOk: { background: "rgba(34,197,94,.05)", borderColor: "rgba(34,197,94,.25)" },
  cardH: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 },
  cardScroll: { maxHeight: 120, overflowY: "auto", WebkitOverflowScrolling: "touch" },
  cardT: { fontSize: 14, color: "#cbd5e1", lineHeight: 1.5, wordBreak: "break-word", whiteSpace: "pre-wrap" },
  gLabel: { fontSize: 12, color: "#94a3b8", fontWeight: 700, letterSpacing: .3 },
  gBox: { background: "rgba(255,255,255,.035)", borderRadius: 12, overflow: "hidden" },
  pRow: { display: "flex", alignItems: "center", padding: "12px 14px", cursor: "pointer" },
  editArrow: { background: "none", border: "none", fontSize: 24, color: "#475569", cursor: "pointer", padding: "8px 4px", flexShrink: 0, fontWeight: 300, lineHeight: 1 },
  emptyG: { padding: "14px 16px", background: "rgba(255,255,255,.02)", borderRadius: 12, border: "1px dashed rgba(255,255,255,.08)" },
  tbar: { display: "flex", justifyContent: "space-around", alignItems: "center", padding: "5px 0 max(env(safe-area-inset-bottom),20px)", borderTop: "1px solid rgba(255,255,255,.05)", background: "rgba(15,23,42,.97)", flexShrink: 0 },
  tBtn: { display: "flex", flexDirection: "column", alignItems: "center", background: "none", border: "none", cursor: "pointer", padding: "3px 6px", fontFamily: "inherit" },
  toast: { position: "fixed", top: "max(env(safe-area-inset-top),14px)", left: "50%", transform: "translateX(-50%)", background: "rgba(30,41,59,.95)", color: "#fff", padding: "9px 18px", borderRadius: 18, fontSize: 13, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,.35)", zIndex: 100, display: "flex", gap: 5, alignItems: "center" },
  ov: { position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" },
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

  // Search
  searchBar: { display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,.06)", borderRadius: 14, padding: "12px 14px", border: "1px solid rgba(255,255,255,.08)", marginBottom: 8 },
  searchInput: { flex: 1, background: "none", border: "none", outline: "none", color: "#f1f5f9", fontSize: 16, fontFamily: "inherit", minWidth: 0 },
  searchGoBtn: { width: "100%", padding: "13px", borderRadius: 12, border: "none", background: "#6366f1", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 },
  quickSearchChip: { padding: "6px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.04)", color: "#94a3b8", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 },
  quickSearchChip2: { display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 10, border: "1px solid rgba(99,102,241,.15)", background: "rgba(99,102,241,.04)", color: "#a5b4fc", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  historyRow: { display: "flex", alignItems: "center", padding: "11px 12px", background: "rgba(255,255,255,.03)", borderRadius: 10, marginBottom: 4 },
  historyAction: { background: "none", border: "none", color: "#64748b", fontSize: 14, cursor: "pointer", padding: "4px 6px" },

  kbScr: { background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 12, padding: 14, minHeight: 90, position: "relative", marginBottom: 12 },
  kbExt: { background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 14, overflow: "hidden" },
  kbH: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,.04)" },
  kbTb: { background: "none", border: "none", color: "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", padding: "3px 8px", borderRadius: 6 },
  kbTbA: { background: "rgba(99,102,241,.15)", color: "#818cf8" },
  kbI: { background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.05)", borderRadius: 9, padding: "9px 11px", cursor: "pointer" },
};
