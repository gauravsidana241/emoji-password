"use client";

import { useState, ReactNode, useRef } from "react";
import "./main.scss";

// ─── Pools ───────────────────────────────────────────────────────────────────
const NUMBER_POOL: string[]   = ["0","1","2","3","4","5","6","7","8","9"];
const EMOJI_POOL_12: string[] = ["🦊","🌮","💎","🚀","🎸","🐙","🌊","🔥","🍄","🎯","🦋","🪐"];
const MIXED_EMOJI_6: string[] = ["🦊","🚀","🔥","🐙","💎","🌮"];

const STUDENT_ID_REGEX    = /^\d{7}[a-zA-Z]$/;
const MAX_PASSWORD_LENGTH = 8;
const API_URL             = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ModeResult {
  mode:        "number" | "emoji" | "mixed";
  loginTimeMs: number;
  errorCount:  number;
}

type ModalType = "unlocked" | "nudge" | null;

// ─── API helpers ─────────────────────────────────────────────────────────────
async function saveResult(studentId: string, result: ModeResult): Promise<void> {
  await fetch(`${API_URL}/api/result`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ studentId, ...result }),
  });
}

async function saveSurvey(
  studentId: string,
  results:   ModeResult[],
  survey:    { usedEmojiInputBefore: boolean; intuitiveness: number; ageRange: string }
): Promise<void> {
  await Promise.all(results.map(r => saveResult(studentId, r)));
  await fetch(`${API_URL}/api/survey`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ studentId, ...survey }),
  });
}

// ─── In-memory store ──────────────────────────────────────────────────────────
const userStore: Record<string, { password: string[] }> = {};

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps {
  type:          ModalType;
  onClose:       () => void;
  onGoToSurvey:  () => void;
  onGoToMissing: (tab: "emoji" | "mixed") => void;
  missingMode:   "emoji" | "mixed" | null;
}

function Modal({ type, onClose, onGoToSurvey, onGoToMissing, missingMode }: ModalProps) {
  if (!type) return null;

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalCard" onClick={e => e.stopPropagation()}>
        {type === "unlocked" && (
          <>
            <div className="modalIcon">🎉</div>
            <h2 className="modalTitle">Numeric done!</h2>
            <p className="modalDesc">
              Emoji and Mixed modes are now unlocked. Try both for the best comparison — or at least one before finishing.
            </p>
            <div className="modalActions">
              <button className="modalBtnPrimary" onClick={onClose}>
                Try Emoji next →
              </button>
            </div>
          </>
        )}

        {type === "nudge" && missingMode && (
          <>
            <div className="modalIcon">👀</div>
            <h2 className="modalTitle">You haven't tried {missingMode} yet</h2>
            <p className="modalDesc">
              Trying all three gives us the strongest data — and shows you the full comparison. It only takes a minute.
            </p>
            <div className="modalActions">
              <button className="modalBtnPrimary" onClick={() => onGoToMissing(missingMode)}>
                Try {missingMode} →
              </button>
              <button className="modalBtnSecondary" onClick={onGoToSurvey}>
                Skip to survey
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Masked field ─────────────────────────────────────────────────────────────
function MaskedField({ count, accent }: { count: number; accent: string }) {
  return (
    <div className="maskedField" style={count > 0 ? { borderColor: accent, background: `${accent}08` } : {}}>
      <span className="maskedDots" style={{ color: accent }}>
        {count > 0 ? "●".repeat(count) : <span className="maskedPlaceholder">tap to build passcode…</span>}
      </span>
      <span className="maskedCounter" style={{ color: count >= MAX_PASSWORD_LENGTH ? "#dc2626" : undefined }}>
        {count}/{MAX_PASSWORD_LENGTH}
      </span>
    </div>
  );
}

// ─── Username field ───────────────────────────────────────────────────────────
function UsernameField({ value, onChange, accent }: { value: string; onChange: (v: string) => void; accent: string }) {
  const isValid  = STUDENT_ID_REGEX.test(value);
  const hasInput = value.length > 0;
  return (
    <div className="usernameWrapper">
      <label className="usernameLabel">Student ID</label>
      <input
        className="usernameInput"
        type="text"
        maxLength={8}
        placeholder="e.g. 3152623s"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={hasInput ? isValid ? { borderColor: "#16a34a", background: "#f0fdf4" } : { borderColor: "#dc2626", background: "#fff5f5" } : {}}
        spellCheck={false}
        autoComplete="off"
      />
      {hasInput && !isValid && <span className="usernameHint usernameHintError">Must be 7 digits followed by a letter (e.g. 3152623s)</span>}
      {hasInput &&  isValid && <span className="usernameHint usernameHintOk">✓ Valid student ID</span>}
    </div>
  );
}

// ─── Pads ─────────────────────────────────────────────────────────────────────
function NumberPad({ onPress }: { onPress: (v: string) => void }) {
  return (
    <div className="numberPad">
      {NUMBER_POOL.map(n => <button key={n} className="numKey" onClick={() => onPress(n)}>{n}</button>)}
    </div>
  );
}

function EmojiGridDisplay({ pool, onPress, disabled }: { pool: string[]; onPress: (v: string) => void; disabled: boolean }) {
  return (
    <div className="emojiGrid4x3">
      {pool.map((em, i) => <button key={i} className="emojiKey" onClick={() => onPress(em)} disabled={disabled}>{em}</button>)}
    </div>
  );
}

function MixedGrid({ numPool, emojiPool, onPress }: { numPool: string[]; emojiPool: string[]; onPress: (v: string) => void }) {
  const items = [...numPool, ...emojiPool];
  return (
    <div className="mixedGrid">
      {items.map((item, i) => (
        <button key={i} className={isNaN(Number(item)) ? "emojiKey" : "numKey"} onClick={() => onPress(item)}>{item}</button>
      ))}
    </div>
  );
}

// ─── Survey ───────────────────────────────────────────────────────────────────
function Survey({ studentId, results, onDone }: { studentId: string; results: ModeResult[]; onDone: () => void }) {
  const [used,      setUsed]      = useState<"yes" | "no" | null>(null);
  const [intuitive, setIntuitive] = useState<number | null>(null);
  const [ageRange,  setAgeRange]  = useState<string>("");
  const [submitted, setSubmitted] = useState(false);
  const [saving,    setSaving]    = useState(false);

  const ready = used !== null && intuitive !== null && ageRange !== "";

  const handleSubmit = async () => {
    if (!ready || saving) return;
    setSaving(true);
    try {
      await saveSurvey(studentId, results, {
        usedEmojiInputBefore: used === "yes",
        intuitiveness:        intuitive!,
        ageRange,
      });
      setSubmitted(true);
      setTimeout(onDone, 2200);
    } catch (err) {
      console.error("Failed to save survey:", err);
      setSaving(false);
    }
  };

  if (submitted) {
    return (
      <div className="surveyPanel surveyDone">
        <div className="surveyDoneIcon">✓</div>
        <p className="surveyDoneTitle">Thanks for participating!</p>
        <p className="surveyDoneSub">Your data has been recorded.</p>
      </div>
    );
  }

  return (
    <div className="surveyPanel">
      <div className="surveyHeader">
        <span className="heroPill">3 quick questions</span>
        <h2 className="surveyTitle">Almost done!</h2>
        <p className="panelDesc">Takes 15 seconds. Helps us validate results across different users.</p>
      </div>

      <div className="surveyResults">
        {results.map(r => (
          <div key={r.mode} className="surveyResultChip">
            <span className="surveyResultMode">{r.mode}</span>
            <span className="surveyResultTime">{(r.loginTimeMs / 1000).toFixed(1)}s</span>
            <span className="surveyResultErrors">{r.errorCount} error{r.errorCount !== 1 ? "s" : ""}</span>
          </div>
        ))}
      </div>

      <div className="surveyQuestion">
        <label className="surveyLabel">Have you used emoji-based input before?</label>
        <div className="surveyBtnGroup">
          {(["yes", "no"] as const).map(v => (
            <button key={v} className={`surveyBtn ${used === v ? "surveyBtnActive" : ""}`} onClick={() => setUsed(v)}>{v}</button>
          ))}
        </div>
      </div>

      <div className="surveyQuestion">
        <label className="surveyLabel">How intuitive was the emoji / mixed input? (1 = confusing, 5 = natural)</label>
        <div className="surveyBtnGroup">
          {[1,2,3,4,5].map(n => (
            <button key={n} className={`surveyBtn surveyBtnNum ${intuitive === n ? "surveyBtnActive" : ""}`} onClick={() => setIntuitive(n)}>{n}</button>
          ))}
        </div>
      </div>

      <div className="surveyQuestion">
        <label className="surveyLabel">Age range</label>
        <div className="surveyBtnGroup surveyBtnGroupWrap">
          {["Under 18","18–24","25–34","35–44","45+"].map(a => (
            <button key={a} className={`surveyBtn ${ageRange === a ? "surveyBtnActive" : ""}`} onClick={() => setAgeRange(a)}>{a}</button>
          ))}
        </div>
      </div>

      <button
        className="actionPrimary surveySubmit"
        disabled={!ready || saving}
        onClick={handleSubmit}
        style={ready && !saving ? { background: "#7c3aed", borderColor: "#7c3aed", boxShadow: "0 2px 14px #7c3aed30", color: "#fff" } : {}}
      >
        {saving ? "Saving…" : "Submit →"}
      </button>
    </div>
  );
}

// ─── Passcode Panel ───────────────────────────────────────────────────────────
interface PanelProps {
  mode:             "number" | "emoji" | "mixed";
  accent:           string;
  renderPad:        (onPress: (v: string) => void) => ReactNode;
  onReset?:         () => void;
  onComplete:       (result: ModeResult) => void;
  username:         string;
  onUsernameChange: (v: string) => void;
}

function PasscodePanel({ mode, accent, renderPad, onReset, onComplete, username, onUsernameChange }: PanelProps) {
  const [authTab,  setAuthTab]  = useState<"register" | "login">("register");
  const [sequence, setSequence] = useState<string[]>([]);
  const [status,   setStatus]   = useState<null | "success" | "fail" | "registered" | "exists" | "notfound">(null);
  const [errors,   setErrors]   = useState(0);
  const firstKeyTime             = useRef<number | null>(null);

  const usernameValid = STUDENT_ID_REGEX.test(username);
  const atLimit       = sequence.length >= MAX_PASSWORD_LENGTH;

  const handlePress = (val: string) => {
    if (atLimit) return;
    if (firstKeyTime.current === null) firstKeyTime.current = Date.now();
    setStatus(null);
    setSequence(prev => [...prev, val]);
  };

  const handleBackspace = () => { setStatus(null); setSequence(prev => prev.slice(0, -1)); };

  const handleReset = () => {
    setSequence([]); setStatus(null); firstKeyTime.current = null; onReset?.();
  };

  const handleSwitchTab = (t: "register" | "login") => {
    setAuthTab(t); setSequence([]); setStatus(null); firstKeyTime.current = null;
  };

  const handleAction = () => {
    if (!usernameValid || sequence.length === 0) return;
    const key = `${username.toLowerCase()}_${mode}`;

    if (authTab === "register") {
      if (userStore[key]) { setStatus("exists"); return; }
      userStore[key] = { password: sequence };
      setStatus("registered");
      setTimeout(() => { setStatus(null); setSequence([]); setAuthTab("login"); firstKeyTime.current = null; onReset?.(); }, 1800);
    } else {
      const user = userStore[key];
      if (!user) { setStatus("notfound"); return; }
      const match = user.password.length === sequence.length && user.password.every((v, i) => v === sequence[i]);
      if (match) {
        const loginTimeMs = firstKeyTime.current ? Date.now() - firstKeyTime.current : 0;
        setStatus("success");
        setTimeout(() => {
          setStatus(null); setSequence([]); firstKeyTime.current = null; onReset?.();
          onComplete({ mode, loginTimeMs, errorCount: errors });
          setErrors(0);
        }, 1500);
      } else {
        setErrors(e => e + 1);
        setStatus("fail");
      }
    }
  };

  const ready = usernameValid && sequence.length > 0;

  return (
    <div className="panel" style={{ borderTopColor: accent }}>
      <div className="authTabBar">
        {(["register","login"] as const).map(t => (
          <button
            key={t}
            className={`authTab ${authTab === t ? "authTabActive" : ""}`}
            style={authTab === t ? { color: accent, borderBottomColor: accent } : {}}
            onClick={() => handleSwitchTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <p className="panelDesc">
        {authTab === "register"
          ? "Enter your student ID and build a passcode up to 8 characters."
          : "Enter your student ID and your passcode to verify your identity."}
      </p>

      <UsernameField value={username} onChange={onUsernameChange} accent={accent} />
      <MaskedField count={sequence.length} accent={accent} />
      {renderPad(handlePress)}

      <div className="actionBar">
        <button
          className="actionPrimary"
          onClick={handleAction}
          disabled={!ready}
          style={ready ? { background: accent, borderColor: accent, boxShadow: `0 2px 14px ${accent}30`, color: "#fff" } : {}}
        >
          {authTab === "register" ? "Register →" : "Login →"}
        </button>
        <button className="actionIcon" onClick={handleBackspace} disabled={sequence.length === 0} title="Backspace">⌫</button>
        <button className="actionIcon" onClick={handleReset} title="Clear">↺</button>
      </div>

      {status === "registered" && <div className="toast toastSuccess">✓ Registered! Switching to login…</div>}
      {status === "success"    && <div className="toast toastSuccess">✓ Login successful!</div>}
      {status === "fail"       && <div className="toast toastFail">✕ Passcode mismatch — try again</div>}
      {status === "exists"     && <div className="toast toastFail">✕ Student ID already registered for this mode</div>}
      {status === "notfound"   && <div className="toast toastFail">✕ Not found — register first</div>}
    </div>
  );
}

// ─── Mode wrappers ────────────────────────────────────────────────────────────
function NumberMode({ onComplete, username, onUsernameChange }: { onComplete: (r: ModeResult) => void; username: string; onUsernameChange: (v: string) => void }) {
  return <PasscodePanel mode="number" accent="#2563eb" username={username} onUsernameChange={onUsernameChange} onComplete={onComplete} renderPad={(onPress) => <NumberPad onPress={onPress} />} />;
}
function EmojiMode({ onComplete, username, onUsernameChange }: { onComplete: (r: ModeResult) => void; username: string; onUsernameChange: (v: string) => void }) {
  const [pool, setPool] = useState<string[]>(() => shuffle(EMOJI_POOL_12));
  return <PasscodePanel mode="emoji" accent="#db2777" username={username} onUsernameChange={onUsernameChange} onComplete={onComplete} onReset={() => setPool(shuffle(EMOJI_POOL_12))} renderPad={(onPress) => <EmojiGridDisplay pool={pool} onPress={onPress} disabled={false} />} />;
}
function MixedMode({ onComplete, username, onUsernameChange }: { onComplete: (r: ModeResult) => void; username: string; onUsernameChange: (v: string) => void }) {
  const [emojiPool, setEmojiPool] = useState<string[]>(() => shuffle(MIXED_EMOJI_6));
  return <PasscodePanel mode="mixed" accent="#7c3aed" username={username} onUsernameChange={onUsernameChange} onComplete={onComplete} onReset={() => setEmojiPool(shuffle(MIXED_EMOJI_6))} renderPad={(onPress) => <MixedGrid numPool={[...NUMBER_POOL]} emojiPool={emojiPool} onPress={onPress} />} />;
}

// ─── Root ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "number", label: "0–9  Numeric", accent: "#2563eb" },
  { id: "emoji",  label: "Emoji",        accent: "#db2777" },
  { id: "mixed",  label: "Mixed",        accent: "#7c3aed" },
] as const;
type TabId = typeof TABS[number]["id"];

export default function Home() {
  const [tab,            setTab]            = useState<TabId>("number");
  const [username,       setUsername]       = useState("");
  const [unlockedTabs,   setUnlockedTabs]   = useState<Set<TabId>>(new Set(["number"]));
  const [completedModes, setCompletedModes] = useState<Set<TabId>>(new Set());
  const [results,        setResults]        = useState<ModeResult[]>([]);
  const [showSurvey,     setShowSurvey]     = useState(false);
  const [modal,          setModal]          = useState<ModalType>(null);
  const [missingMode,    setMissingMode]    = useState<"emoji" | "mixed" | null>(null);

  const handleComplete = async (result: ModeResult) => {
    const newResults   = [...results, result];
    const newCompleted = new Set([...completedModes, result.mode as TabId]);
    setResults(newResults);
    setCompletedModes(newCompleted);

    try { await saveResult(username, result); }
    catch (err) { console.error("Failed to save result:", err); }

    if (result.mode === "number") {
      // Unlock emoji tabs and show unlocked modal
      setUnlockedTabs(new Set(["number", "emoji", "mixed"]));
      setTimeout(() => setModal("unlocked"), 1600);
      return;
    }

    // After completing an emoji mode, check what's missing
    const hasEmoji = newCompleted.has("emoji");
    const hasMixed = newCompleted.has("mixed");

    if (hasEmoji && hasMixed) {
      // All three done — go straight to survey
      setTimeout(() => setShowSurvey(true), 1600);
    } else {
      // One emoji mode done — nudge toward the other, but let them skip
      const missing = hasEmoji ? "mixed" : "emoji";
      setMissingMode(missing);
      setTimeout(() => setModal("nudge"), 1600);
    }
  };

  const handleGoToSurvey = () => {
    setModal(null);
    setShowSurvey(true);
  };

  const handleGoToMissing = (tab: "emoji" | "mixed") => {
    setModal(null);
    setTab(tab);
  };

  const handleCloseModal = () => {
    setModal(null);
    // After unlocked modal, switch to emoji tab automatically
    if (modal === "unlocked") setTab("emoji");
  };

  if (showSurvey) {
    return (
      <main className="main">
        <div className="hero">
          <span className="heroPill">Authentication Demo</span>
          <h1 className="heroTitle">Group I: Improving passwords using emojis</h1>
        </div>
        <div className="tabBody">
          <Survey studentId={username} results={results} onDone={() => setShowSurvey(false)} />
        </div>
      </main>
    );
  }

  return (
    <main className="main">
      {/* Modal */}
      <Modal
        type={modal}
        onClose={handleCloseModal}
        onGoToSurvey={handleGoToSurvey}
        onGoToMissing={handleGoToMissing}
        missingMode={missingMode}
      />

      <div className="hero">
        <span className="heroPill">Authentication Demo</span>
        <h1 className="heroTitle">Group I: Improving passwords using emojis</h1>
        <p className="heroSub">
          {completedModes.has("number")
            ? "Numeric done ✓ — now try Emoji or Mixed"
            : "Start with Numeric, then unlock Emoji modes"}
        </p>
      </div>

      <div className="progressBar">
        {TABS.map(t => (
          <div
            key={t.id}
            className={`progressChip ${completedModes.has(t.id) ? "progressChipDone" : ""}`}
            style={completedModes.has(t.id) ? { borderColor: t.accent, color: t.accent, background: `${t.accent}10` } : {}}
          >
            {completedModes.has(t.id) ? "✓ " : ""}{t.label}
          </div>
        ))}
      </div>

      <div className="tabBar">
        {TABS.map(t => {
          const locked = !unlockedTabs.has(t.id);
          return (
            <button
              key={t.id}
              className={`tab ${tab === t.id ? "tabActive" : ""} ${locked ? "tabLocked" : ""}`}
              style={tab === t.id && !locked ? { color: t.accent, borderBottomColor: t.accent } : {}}
              onClick={() => !locked && setTab(t.id)}
              title={locked ? "Complete Numeric first" : undefined}
            >
              {locked ? "🔒 " : ""}{t.label}
            </button>
          );
        })}
      </div>

      <div className="tabBody" key={tab}>
        {tab === "number" && <NumberMode onComplete={handleComplete} username={username} onUsernameChange={setUsername} />}
        {tab === "emoji"  && <EmojiMode  onComplete={handleComplete} username={username} onUsernameChange={setUsername} />}
        {tab === "mixed"  && <MixedMode  onComplete={handleComplete} username={username} onUsernameChange={setUsername} />}
      </div>
    </main>
  );
}