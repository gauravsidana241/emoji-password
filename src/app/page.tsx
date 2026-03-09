"use client";

import { useState, ReactNode } from "react";
import "./main.scss";

// ─── Pools ──────────────────────────────────────────────────────────────────
const NUMBER_POOL: string[]   = ["0","1","2","3","4","5","6","7","8","9"];
const EMOJI_POOL_12: string[] = ["🦊","🌮","💎","🚀","🎸","🐙","🌊","🔥","🍄","🎯","🦋","🪐"];
const MIXED_EMOJI_6: string[] = ["🦊","🚀","🔥","🐙","💎","🌮"];
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Hidden input display ────────────────────────────────────────────────────
function MaskedField({ count, accent }: { count: number; accent: string }) {
  return (
    <div className="maskedField" style={count > 0 ? { borderColor: accent, background: `${accent}08` } : {}}>
      <span className="maskedDots" style={{ color: accent }}>
        {count > 0 ? "●".repeat(count) : <span className="maskedPlaceholder">tap to build passcode…</span>}
      </span>
    </div>
  );
}

// ─── Number Pad (5×2) ────────────────────────────────────────────────────────
function NumberPad({ onPress }: { onPress: (v: string) => void }) {
  return (
    <div className="numberPad">
      {NUMBER_POOL.map(n => (
        <button key={n} className="numKey" onClick={() => onPress(n)}>{n}</button>
      ))}
    </div>
  );
}

// ─── Emoji Grid 4×3 ──────────────────────────────────────────────────────────
function EmojiGridDisplay({ pool, onPress, disabled }: { pool: string[]; onPress: (v: string) => void; disabled: boolean }) {
  return (
    <div className="emojiGrid4x3">
      {pool.map((em, i) => (
        <button key={i} className="emojiKey" onClick={() => onPress(em)} disabled={disabled}>{em}</button>
      ))}
    </div>
  );
}

// ─── Mixed Grid (10 numbers + 6 emoji in one continuous 4×4 grid) ────────────
function MixedGrid({ numPool, emojiPool, onPress }: {
  numPool: string[]; emojiPool: string[]; onPress: (v: string) => void;
}) {
  const items = [...numPool, ...emojiPool];
  return (
    <div className="mixedGrid">
      {items.map((item, i) => (
        <button key={i} className={isNaN(Number(item)) ? "emojiKey" : "numKey"} onClick={() => onPress(item)}>
          {item}
        </button>
      ))}
    </div>
  );
}

// ─── Generic Passcode Panel ───────────────────────────────────────────────────
interface PanelProps {
  title: string;
  accent: string;
  renderPad: (onPress: (v: string) => void) => ReactNode;
  registered: string[] | null;
  setRegistered: (s: string[] | null) => void;
  onReset?: () => void;
}

function PasscodePanel({ title, accent, renderPad, registered, setRegistered, onReset }: PanelProps) {
  const [step, setStep]         = useState<"register" | "verify">("register");
  const [sequence, setSequence] = useState<string[]>([]);
  const [status, setStatus]     = useState<null | "success" | "fail">(null);

  const handlePress = (val: string) => {
    setStatus(null);
    setSequence(prev => [...prev, val]);
  };

  const handleBackspace = () => { setStatus(null); setSequence(prev => prev.slice(0, -1)); };

  const handleAction = () => {
    if (sequence.length === 0) return;
    if (step === "register") {
      setRegistered(sequence);
      setStep("verify");
      setSequence([]);
      setStatus(null);
    } else {
      const match = registered!.length === sequence.length && registered!.every((v, i) => v === sequence[i]);
      setStatus(match ? "success" : "fail");
      if (match) setTimeout(() => { setStep("register"); setRegistered(null); setSequence([]); setStatus(null); onReset?.(); }, 2200);
    }
  };

  const handleReset = () => {
    setSequence([]); setStatus(null);
    onReset?.();
    if (step === "verify") { setStep("register"); setRegistered(null); }
  };

  const ready = sequence.length > 0;

  return (
    <div className="panel" style={{ borderTopColor: accent }}>
      {/* Header */}
      <div className="panelHeader">
        <div>
          <div className="stepLabel" style={{ color: accent }}>
            {step === "register" ? "Step 1 · Register" : "Step 2 · Verify"}
          </div>
          <h2 className="panelTitle">{title}</h2>
        </div>
        <div
          className="stepBadge"
          style={step === "register"
            ? { background: `${accent}12`, borderColor: `${accent}30`, color: accent }
            : { background: "#f0fdf4", borderColor: "#bbf7d0", color: "#16a34a" }
          }
        >
          {step === "register" ? "NEW" : "CONFIRM"}
        </div>
      </div>

      {/* Description */}
      <p className="panelDesc">
        {step === "register"
          ? "Build your passcode: any length. It stays hidden, so remember it well."
          : "Re-enter your passcode exactly as you set it."}
      </p>

      {/* Masked input display */}
      <MaskedField count={sequence.length} accent={accent} />

      {/* Input pad */}
      {renderPad(handlePress)}

      {/* Action bar */}
      <div className="actionBar">
        <button
          className="actionPrimary"
          onClick={handleAction}
          disabled={!ready}
          style={ready ? { background: accent, borderColor: accent, boxShadow: `0 2px 14px ${accent}30` } : {}}
        >
          {step === "register" ? "Save passcode →" : "Verify →"}
        </button>
        <button className="actionIcon" onClick={handleBackspace} disabled={sequence.length === 0} title="Backspace">⌫</button>
        <button className="actionIcon" onClick={handleReset} title="Clear / Reset">↺</button>
      </div>

      {/* Toasts */}
      {status === "success" && <div className="toast toastSuccess">✓ Identity verified — resetting…</div>}
      {status === "fail"    && <div className="toast toastFail">✕ Passcode mismatch — try again</div>}
    </div>
  );
}

// ─── Mode components ──────────────────────────────────────────────────────────
function NumberMode() {
  const [registered, setRegistered] = useState<string[] | null>(null);
  return (
    <PasscodePanel
      title="Numeric Passcode"
      accent="#2563eb"
      registered={registered}
      setRegistered={setRegistered}
      renderPad={(onPress) => <NumberPad onPress={onPress} />}
    />
  );
}

function EmojiMode() {
  const [registered, setRegistered] = useState<string[] | null>(null);
  const [pool, setPool]             = useState<string[]>(() => shuffle(EMOJI_POOL_12));
  return (
    <PasscodePanel
      title="Emoji Passcode"
      accent="#db2777"
      registered={registered}
      setRegistered={p => { setRegistered(p); setPool(shuffle(EMOJI_POOL_12)); }}
      onReset={() => setPool(shuffle(EMOJI_POOL_12))}
      renderPad={(onPress) => <EmojiGridDisplay pool={pool} onPress={onPress} disabled={false} />}
    />
  );
}

function MixedMode() {
  const [registered, setRegistered] = useState<string[] | null>(null);
  const [emojiPool, setEmojiPool]   = useState<string[]>(() => shuffle(MIXED_EMOJI_6));
  const reshuffle = () => setEmojiPool(shuffle(MIXED_EMOJI_6));
  return (
    <PasscodePanel
      title="Mixed Passcode"
      accent="#7c3aed"
      registered={registered}
      setRegistered={p => { setRegistered(p); reshuffle(); }}
      onReset={reshuffle}
      renderPad={(onPress) => (
        <MixedGrid numPool={[...NUMBER_POOL]} emojiPool={emojiPool} onPress={onPress} />
      )}
    />
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "number", label: "0–9  Numeric", accent: "#2563eb" },
  { id: "emoji",  label: "Emoji",    accent: "#db2777" },
  { id: "mixed",  label: "Mixed",    accent: "#7c3aed" },
] as const;

type TabId = typeof TABS[number]["id"];

export default function Home() {
  const [tab, setTab] = useState<TabId>("number");

  return (
    <main className="main">
      {/* Hero */}
      <div className="hero">
        <span className="heroPill">Authentication Demo</span>
        <h1 className="heroTitle">Group I: Improving passwords using emojis</h1>
        <p className="heroSub">Register a passcode, then verify it</p>
      </div>

      {/* Tab bar */}
      <div className="tabBar">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? "tabActive" : ""}`}
            style={tab === t.id ? { color: t.accent, borderBottomColor: t.accent } : {}}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="tabBody" key={tab}>
        {tab === "number" && <NumberMode />}
        {tab === "emoji"  && <EmojiMode />}
        {tab === "mixed"  && <MixedMode />}
      </div>
    </main>
  );
}