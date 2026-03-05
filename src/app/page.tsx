"use client";

import { useEffect, useState } from "react";
import "./main.scss";

const TEXT_USERS: Record<string, string> = {
  alice: "password123",
  bob: "qwerty",
  carol: "iloveyou",
  dave: "123456",
  eve: "letmein",
};

const EMOJI_POOL = ["🦊", "🌮", "💎", "🚀", "🎸", "🐙", "🌊", "🔥", "🍄"];

const EMOJI_USERS: Record<string, string[]> = {
  alice: ["🚀", "🦊", "💎", "🔥"],
  bob: ["🌮", "🐙", "🌊", "🍄"],
  carol: ["💎", "🎸", "🦊", "🚀"],
};

const WEAKNESSES = [
  { id: "brute",    label: "Brute Force",       desc: "Automated tools can try billions of combinations per second against leaked hashes." },
  { id: "dict",     label: "Dictionary Attacks", desc: "Common words, names, and patterns make up the vast majority of real-world passwords." },
  { id: "reuse",    label: "Credential Reuse",   desc: "Users recycle passwords across accounts. One breach exposes everything." },
  { id: "phish",    label: "Phishing",            desc: "Fake login pages harvest plaintext passwords before the user realises." },
  { id: "shoulder", label: "Shoulder Surfing",    desc: "Text typed on keyboards is trivially observable in public spaces." },
  { id: "memory",   label: "Cognitive Load",      desc: "Humans are poor at memorising random strings, forcing weak, predictable choices." },
];

const ADVANTAGES = [
  { id: "memory",   label: "Pictorial Memory",        desc: "Images are recalled far more reliably than arbitrary character strings." },
  { id: "space",    label: "Larger Symbol Space",      desc: "2,700+ emoji vs 26 letters significantly reduces dictionary attack surface." },
  { id: "shoulder", label: "Shoulder-Surf Resistance", desc: "A quick glance at the screen reveals nothing that can be typed elsewhere." },
  { id: "mobile",   label: "Mobile-Native Input",      desc: "No awkward special-character keyboard switching on touchscreen devices." },
  { id: "phish",    label: "Phishing Resistance",      desc: "Emoji grids do not translate to conventional fake login forms easily." },
  { id: "dynamic",  label: "Dynamic Layout Security",   desc: "Randomizing the grid prevents attackers from guessing the sequence by tracking mouse clicks, screen smudges, or physical movements." },
];

function EmojiGrid({ onSequenceChange, sequence, maxLen, emojiPool }: {
  onSequenceChange: (seq: string[]) => void;
  sequence: string[];
  maxLen: number;
  emojiPool: any[];
}) {
  return (
    <div className="emojiGridWrap">
      <div className="emojiSequence">
        {Array.from({ length: maxLen }).map((_, i) => (
          <div key={i} className={`emojiSlot ${sequence[i] ? "filled" : ""}`}>
            {sequence[i] ?? ""}
          </div>
        ))}
      </div>
      <div className="emojiGrid">
        {emojiPool.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="emojiCell"
            onClick={() => sequence.length < maxLen && onSequenceChange([...sequence, emoji])}
            disabled={sequence.length >= maxLen}
          >
            {emoji}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="backspaceBtn"
        onClick={() => onSequenceChange(sequence.slice(0, -1))}
        disabled={sequence.length === 0}
      >
        ⌫ Clear last
      </button>
    </div>
  );
}

function NormalLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<null | "success" | "fail">(null);
  const [showWeaknesses, setShowWeaknesses] = useState(false);

  const handleSubmit = () => {
    const expected = TEXT_USERS[username.toLowerCase()];
    if (expected && expected === password) { setResult("success"); }
    else { setResult("fail"); setShowWeaknesses(true); }
  };

  return (
    <div className="twoCol">
      <div className="loginCard">
        <h2 className="cardTitle">Text Password Login</h2>
        <p className="cardSub">Try: <code>alice / password123</code> or <code>bob / qwerty</code></p>
        <div className="field">
          <label className="label">Username</label>
          <input className="input" type="text" value={username}
            onChange={(e) => { setUsername(e.target.value); setResult(null); }}
            placeholder="enter username" autoComplete="off" />
        </div>
        <div className="field">
          <label className="label">Password</label>
          <input className="input" type="password" value={password}
            onChange={(e) => { setPassword(e.target.value); setResult(null); }}
            placeholder="enter password" autoComplete="off" />
        </div>
        <button className="submitBtn" onClick={handleSubmit}>Sign in</button>
        {result === "success" && <div className="toast toastSuccess">Authenticated successfully</div>}
        {result === "fail"    && <div className="toast toastFail">Invalid credentials</div>}
      </div>

      <div className="sidePanel">
        <div className="sidePanelHeader">
          <span className="sidePanelTitle">Why text passwords fall short</span>
          <button className="toggleBtn" onClick={() => setShowWeaknesses(!showWeaknesses)}>
            {showWeaknesses ? "Hide" : "Show"}
          </button>
        </div>
        {showWeaknesses ? (
          <div className="infoList">
            {WEAKNESSES.map((w) => (
              <div key={w.id} className="infoItem">
                <strong>{w.label}</strong>
                <p>{w.desc}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="sidePanelHint">
            Attempt a login to reveal known vulnerabilities of text-based authentication.
          </p>
        )}
      </div>
    </div>
  );
}

function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // ES6 swap
  }
  return array;
}

function EmojiLogin() {
  const [username, setUsername] = useState("");
  const [sequence, setSequence] = useState<string[]>([]);
  const [emojiPool, setEmojiPool] = useState<any[]>([...shuffleArray(EMOJI_POOL)]);
  const [result, setResult] = useState<null | "success" | "fail">(null);
  const [showStrenghts, setShowStrenghts] = useState(false);
  const PASSCODE_LEN = 4;

  const handleSubmit = () => {
    const expected = EMOJI_USERS[username.toLowerCase()];
    if (expected && expected.length === sequence.length && expected.every((e, i) => e === sequence[i])) {
      setResult("success");
    } else {
      setResult("fail");
    }
  };

  return (
    <div className="twoCol">
      <div className="loginCard">
        <h2 className="cardTitle">Emoji Passcode Login</h2>
        <p className="cardSub">Try: <code>alice → 🚀 🦊 💎 🔥</code></p>
        <div className="field">
          <label className="label">Username</label>
          <input className="input" type="text" value={username}
            onChange={(e) => { setUsername(e.target.value); setResult(null); }}
            placeholder="enter username" autoComplete="off" />
        </div>
        <label className="label">Select your 4-emoji passcode</label>
        <EmojiGrid
          sequence={sequence}
          emojiPool={emojiPool}
          onSequenceChange={(seq) => { setSequence(seq); setResult(null); }}
          maxLen={PASSCODE_LEN}
        />
        <div className="emojiActions">
          <button className="submitBtn" onClick={handleSubmit} disabled={sequence.length < PASSCODE_LEN}>Sign in</button>
          <button className="resetBtn" onClick={() => { setSequence([]); setResult(null); setEmojiPool([...shuffleArray(EMOJI_POOL)]); }}>Reset</button>
        </div>
        {result === "success" && <div className="toast toastSuccess">Authenticated successfully</div>}
        {result === "fail"    && <div className="toast toastFail">Passcode incorrect</div>}
      </div>

      <div className="sidePanel sidePanelAccent">
        <div className="sidePanelHeader">
          <span className="sidePanelTitle">Why emoji passcodes help</span>
          <button className="toggleBtn" onClick={() => setShowStrenghts(!showStrenghts)}>
            {showStrenghts ? "Hide" : "Show"}
          </button>
        </div>
        {showStrenghts && (
          <div className="infoList">
          {ADVANTAGES.map((a) => (
            <div key={a.id} className="infoItem">
              <strong>{a.label}</strong>
              <p>{a.desc}</p>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"normal" | "emoji">("normal");

  return (
    <main className="main">

      <div className="tabBar">
        <button className={`tab ${activeTab === "normal" ? "tabActive" : ""}`} onClick={() => setActiveTab("normal")}>
          Text Password
        </button>
        <button className={`tab ${activeTab === "emoji" ? "tabActive" : ""}`} onClick={() => setActiveTab("emoji")}>
          Emoji Passcode
        </button>
      </div>
      <div className="tabBody">
        {activeTab === "normal" ? <NormalLogin /> : <EmojiLogin />}
      </div>
    </main>
  );
}