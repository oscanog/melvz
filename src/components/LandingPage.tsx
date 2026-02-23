import { useEffect, useState, useRef, useCallback } from "react";
import { useAtom } from "jotai";
import { appPhaseAtom, gameStateAtom } from "../stores/gameStore";
import initGame from "../initGame";

/* ──────────────────────────────────────────
   Terminal command sequence
────────────────────────────────────────── */
type TerminalEntry = {
  text: string;
  color?: string;
  speed?: number;
  pauseAfter?: number;
};

const TERMINAL_COMMANDS: TerminalEntry[] = [
  { text: "$ sudo ./launch_portfolio.sh --mode=production --target=mn-dev --auth=employer", speed: 1, pauseAfter: 22 },
  { text: "[INIT] Establishing secure connection... mounting cloud volumes... installing deps...", speed: 1, pauseAfter: 18 },
  { text: "[OK]   All systems nominal — runtime: v5.2.0 — heap: 512MB — status: ONLINE ✓", color: "#4afa4a", speed: 1, pauseAfter: 20 },
  { text: "[WARN] 2D game world detected — initializing Kaplay v3001 — renderer: WebGL2 — shaders: ON", color: "#ffcc00", speed: 1, pauseAfter: 22 },
  { text: "[RUN]  Compiling mn-portfolio shaders... streaming terrain chunks... spawning world entities...", color: "#00ffff", speed: 1, pauseAfter: 20 },
  { text: "[████████████████████████████████████████████████] BOOT SEQUENCE COMPLETE — 100% — 0 errors", color: "#4afa4a", speed: 1, pauseAfter: 22 },
  { text: "[DONE] MELVIN NOGOY — PORTFOLIO LOADED ✓ — session: mn_portfolio_2026 — welcome, explorer!", color: "#4afa4a", speed: 1, pauseAfter: 18 },
];

/* ──────────────────────────────────────────
   Main LandingPage component
────────────────────────────────────────── */
export default function LandingPage(): React.ReactElement {
  const [appPhase, setAppPhase] = useAtom(appPhaseAtom);
  const [gameState] = useAtom(gameStateAtom);

  // Terminal state
  const [terminalActive, setTerminalActive] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const [isBackspacing, setIsBackspacing] = useState(false);

  // Loading overlay
  const [showOverlay, setShowOverlay] = useState(false);
  const [loadingPct, setLoadingPct] = useState(0);
  const [overlayExiting, setOverlayExiting] = useState(false);

  // Root exiting
  const [rootExiting, setRootExiting] = useState(false);

  // Scroll-triggered modal
  const [showEnterModal, setShowEnterModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const modalShown = useRef(false);

  const gameInitiated = useRef(false);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Scroll detection — trigger modal near bottom ── */
  const handleScroll = useCallback(() => {
    if (modalShown.current || appPhase !== "landing") return;
    const el = scrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distFromBottom <= 60) {
      modalShown.current = true;
      setShowEnterModal(true);
    }
  }, [appPhase]);

  /* ── Typing animation state machine ── */
  useEffect(() => {
    if (!terminalActive) return;

    // Terminal finishes — game is already loading, nothing to do
    if (lineIdx >= TERMINAL_COMMANDS.length) return;

    const entry = TERMINAL_COMMANDS[lineIdx];
    const shouldTypo =
      !isBackspacing &&
      charIdx > 3 &&
      charIdx < entry.text.length - 3 &&
      Math.random() < 0.05 &&
      charIdx > 0;

    if (isBackspacing) {
      const t = setTimeout(() => {
        setCurrentText((prev) => prev.slice(0, -1));
        setCharIdx((c) => c - 1);
        setIsBackspacing(false);
      }, 30);
      return () => clearTimeout(t);
    }

    if (shouldTypo) {
      const wrongChar = String.fromCharCode(97 + Math.floor(Math.random() * 26));
      const speed = (entry.speed ?? 2) + Math.random() * 0.5;
      const t = setTimeout(() => {
        setCurrentText((prev) => prev + wrongChar);
        setCharIdx((c) => c + 1);
        setIsBackspacing(true);
      }, speed);
      return () => clearTimeout(t);
    }

    if (charIdx < entry.text.length) {
      const speed = (entry.speed ?? 2) + Math.random() * 0.5;
      const t = setTimeout(() => {
        setCurrentText((prev) => prev + entry.text[charIdx]);
        setCharIdx((c) => c + 1);
      }, speed);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setCurrentText("");
        setCharIdx(0);
        setLineIdx((l) => l + 1);
      }, entry.pauseAfter ?? 50);
      return () => clearTimeout(t);
    }
  }, [terminalActive, lineIdx, charIdx, currentText]);

  /* ── Watch game ready ── */
  useEffect(() => {
    if (gameState !== "playing" || !showOverlay) return;

    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }

    setLoadingPct(100);

    const t = setTimeout(() => {
      setOverlayExiting(true);
      setTimeout(() => {
        setShowOverlay(false);
        setRootExiting(true);
        setTimeout(() => {
          window.history.pushState({}, "", "/#game");
          setAppPhase("game");
        }, 700);
      }, 700);
    }, 600);

    return () => clearTimeout(t);
  }, [gameState, showOverlay, setAppPhase]);

  /* ── Cursor blink ── */
  useEffect(() => {
    const id = setInterval(() => setShowCursor((v) => !v), 177);
    return () => clearInterval(id);
  }, []);

  /* ── Handle "Yes" — terminal + cinematic start SIMULTANEOUSLY ── */
  const handleEnterYes = useCallback(() => {
    if (gameInitiated.current) return;
    gameInitiated.current = true;

    setShowEnterModal(false);
    setTerminalActive(true);          // start terminal typing
    setAppPhase("game-loading");      // open terminal bar + dim resume
    setShowOverlay(true);             // show cinematic immediately

    // Animate progress to ~80% while game loads
    let pct = 0;
    progressInterval.current = setInterval(() => {
      pct += Math.random() * 15 + 5;
      if (pct >= 80) {
        pct = 80;
        clearInterval(progressInterval.current!);
      }
      setLoadingPct(Math.min(pct, 80));
    }, 60);

    initGame();
  }, [setAppPhase]);

  /* ── Handle "No" — dismiss modal, allow re-trigger ── */
  const handleEnterNo = useCallback(() => {
    setShowEnterModal(false);
    modalShown.current = false;
  }, []);

  const isHacking = appPhase === "hacking" || appPhase === "game-loading";

  return (
    <div className={`lp-root${rootExiting ? " lp-root--exit" : ""}`}>
      {/* ── Terminal Navbar — z-index above overlay ── */}
      <div className={`lp-terminal${isHacking ? " lp-terminal--open" : ""}`}>
        <div className="lp-terminal__titlebar">
          <div className="lp-terminal__dots">
            <span className="lp-dot lp-dot--red" />
            <span className="lp-dot lp-dot--yellow" />
            <span className="lp-dot lp-dot--green" />
          </div>
          <span className="lp-terminal__title">portfolio_launcher.sh — bash</span>
        </div>
        <div className="lp-terminal__body">
          {lineIdx < TERMINAL_COMMANDS.length && terminalActive && (
            <div
              className="lp-terminal__line"
              style={{ color: TERMINAL_COMMANDS[lineIdx]?.color ?? "#d4d4d4" }}
            >
              {currentText}
              <span
                className="lp-terminal__cursor"
                style={{ opacity: showCursor ? 1 : 0 }}
              >
                █
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Resume Paper ── */}
      <div
        className={`lp-scroll${isHacking ? " lp-scroll--pushed" : ""}`}
        ref={scrollRef}
        onScroll={handleScroll}
      >
        <div className="lp-paper">
          <ResumeContent />
        </div>
      </div>

      {/* ── Floating scroll-down hint ── */}
      {appPhase === "landing" && !showEnterModal && (
        <div className="lp-scroll-prompt">
          <span className="lp-scroll-prompt__text">scroll to continue</span>
          <span className="lp-scroll-prompt__arrow">↓</span>
        </div>
      )}

      {/* ── Warcraft III Enter Game Modal ── */}
      {showEnterModal && (
        <EnterGameModal onYes={handleEnterYes} onNo={handleEnterNo} />
      )}

      {/* ── Game Loading Overlay ── */}
      {showOverlay && (
        <div
          className={`lp-overlay${overlayExiting ? " lp-overlay--exit" : ""}`}
        >
          <MatrixRain />
          <div className="lp-overlay__scanlines" />
          <div className="lp-overlay__content">
            <CinematicIntro loadingPct={loadingPct} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────
   Matrix Rain canvas — atmospheric backdrop
────────────────────────────────────────── */
function MatrixRain(): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const fontSize = 13;
    const cols = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array.from({ length: cols }, () =>
      Math.floor((Math.random() * -canvas.height) / fontSize)
    );

    const chars =
      "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン" +
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>{}[]/\\|@#$%^&*";

    let animId: number;

    const draw = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.052)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const y = drops[i] * fontSize;

        // Head character — brighter
        ctx.fillStyle = i % 7 === 0 ? "#aaffcc" : "#00ff41";
        ctx.fillText(char, i * fontSize, y);

        if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity: 0.28,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}

/* ──────────────────────────────────────────
   Cinematic Loading Intro  (2.5 s sequence)
────────────────────────────────────────── */
function CinematicIntro({ loadingPct }: { loadingPct: number }): React.ReactElement {
  return (
    <div className="lp-cin">
      <p className="lp-cin__prelude">In a world where code shapes empires...</p>

      <div className="lp-cin__name-wrap">
        <span className="lp-cin__name">MELVIN NOGOY</span>
      </div>

      <p className="lp-cin__role">Full Stack Developer</p>

      <div className="lp-cin__divider">
        <span className="lp-cin__div-line" />
        <span className="lp-cin__div-icon">⚔</span>
        <span className="lp-cin__div-line" />
      </div>

      <p className="lp-cin__enter">&gt; MELVIN_NOGOY --DEPLOY</p>

      <div className="lp-cin__bar-wrap">
        <div className="lp-overlay__bar-track">
          <div
            className="lp-overlay__bar-fill"
            style={{ width: `${loadingPct}%` }}
          />
        </div>
        <p className="lp-overlay__pct">{Math.floor(loadingPct)}%</p>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   Real AI logos — SVG components
────────────────────────────────────────── */
function ClaudeLogo(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 32 32"
      width="44"
      height="44"
      style={{ filter: "drop-shadow(0 0 8px rgba(212,98,58,0.85))" }}
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <rect
          key={i}
          x="14.5"
          y="2"
          width="3"
          height="12"
          rx="1.5"
          fill="#D4623A"
          transform={`rotate(${i * 45} 16 16)`}
        />
      ))}
      <circle cx="16" cy="16" r="3.5" fill="#D4623A" />
    </svg>
  );
}

function CodexLogo(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 32 32"
      width="44"
      height="44"
      style={{ filter: "drop-shadow(0 0 8px rgba(14,164,127,0.85))" }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <rect
          key={i}
          x="14.5"
          y="1.5"
          width="3"
          height="13"
          rx="1.5"
          fill="#0EA47F"
          transform={`rotate(${i * 60} 16 16)`}
        />
      ))}
      <circle cx="16" cy="16" r="4.5" fill="#0EA47F" />
    </svg>
  );
}

/* ──────────────────────────────────────────
   Fight particle type
────────────────────────────────────────── */
interface FightParticle {
  id: number;
  dx: number;
  dy: number;
  char: string;
  color: string;
}

/* ──────────────────────────────────────────
   Claude vs Codex — logo fight scene
────────────────────────────────────────── */
function FightScene(): React.ReactElement {
  const [swinging, setSwinging] = useState<"left" | "right" | null>(null);
  const [hit, setHit] = useState<"left" | "right" | null>(null);
  const [particles, setParticles] = useState<FightParticle[]>([]);
  const pidRef = useRef(0);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const clash = () => {
      const attacker = Math.random() > 0.5 ? "left" : "right";
      setSwinging(attacker);
      setHit(attacker === "left" ? "right" : "left");

      setParticles((prev) => [
        ...prev.slice(-28),
        ...Array.from({ length: 8 }, (_, i): FightParticle => ({
          id: pidRef.current++,
          dx: (Math.random() - 0.5) * 70,
          dy: (Math.random() - 0.5) * 52,
          char: i < 5 ? (["✦", "⋆", "✸", "×", "★"] as const)[i] : "●",
          color:
            i < 5
              ? (["#ffd700", "#fff8c0", "#ffaa00", "#ffffff", "#ffe566"] as const)[i]
              : "#aa0000",
        })),
      ]);

      timeout = setTimeout(() => {
        setSwinging(null);
        setHit(null);
        timeout = setTimeout(clash, 380 + Math.random() * 620);
      }, 330);
    };

    timeout = setTimeout(clash, 300 + Math.random() * 400);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (particles.length === 0) return;
    const id = setTimeout(
      () => setParticles((p) => (p.length > 8 ? p.slice(-6) : p)),
      600
    );
    return () => clearTimeout(id);
  }, [particles]);

  return (
    <div className="fight-scene">
      {/* CLAUDE — left fighter */}
      <div
        className={[
          "wc-fighter wc-fighter--l",
          swinging === "left" ? "wc-fighter--swing-l" : "",
          hit === "left" ? "wc-fighter--hit" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="wc-fighter__aura wc-fighter__aura--claude" />
        <ClaudeLogo />
        <span className="wc-fighter__label wc-fighter__label--claude">⚔ CLAUDE</span>
      </div>

      {/* CLASH ZONE */}
      <div className="fight-clash">
        <div className={`fight-impact${swinging ? " fight-impact--active" : ""}`}>
          ✦
        </div>
        {particles.map((p) => (
          <span
            key={p.id}
            className="fight-particle"
            style={
              {
                "--pdx": `${p.dx}px`,
                "--pdy": `${p.dy}px`,
                color: p.color,
              } as React.CSSProperties
            }
          >
            {p.char}
          </span>
        ))}
      </div>

      {/* CODEX — right fighter */}
      <div
        className={[
          "wc-fighter wc-fighter--r",
          swinging === "right" ? "wc-fighter--swing-r" : "",
          hit === "right" ? "wc-fighter--hit" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="wc-fighter__aura wc-fighter__aura--codex" />
        <CodexLogo />
        <span className="wc-fighter__label wc-fighter__label--codex">CODEX 🗡</span>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   Warcraft III / Dota-style Enter Game Modal
────────────────────────────────────────── */
function EnterGameModal({
  onYes,
  onNo,
}: {
  onYes: () => void;
  onNo: () => void;
}): React.ReactElement {
  return (
    <div className="wc-overlay">
      <div className="wc-modal">
        {/* Main content — title, question, cards */}
        <div className="wc-modal__content">
          <div className="wc-modal__ornament">
            <span className="wc-modal__orn-line" />
            <span className="wc-modal__orn-icon">⚜</span>
            <span className="wc-modal__orn-line" />
          </div>

          <h2 className="wc-modal__title">A QUEST AWAITS</h2>

          <p className="wc-modal__question">
            Do you dare step into the{" "}
            <strong>legendary realm</strong> of your{" "}
            <em>next Full Stack Developer?</em>
          </p>

          <div className="wc-modal__cards">
            <button className="wc-card wc-card--yes" onClick={onYes}>
              <span className="wc-card__icon">⚔</span>
              <span className="wc-card__label">ENTER THE REALM</span>
              <span className="wc-card__sub">Witness the legend</span>
            </button>

            <button className="wc-card wc-card--no" onClick={onNo}>
              <span className="wc-card__icon">🛡</span>
              <span className="wc-card__label">NOT YET</span>
              <span className="wc-card__sub">Return to resume</span>
            </button>
          </div>
        </div>

        {/* ⚔ Dedicated battle strip — the red-line zone ⚔ */}
        <div className="wc-battle-strip">
          <FightScene />
        </div>

        {/* Bottom ornament */}
        <div className="wc-modal__ornament wc-modal__ornament--bottom">
          <span className="wc-modal__orn-line" />
          <span className="wc-modal__orn-icon wc-modal__orn-icon--dim">✦</span>
          <span className="wc-modal__orn-line" />
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   Resume Content
────────────────────────────────────────── */
function ResumeContent(): React.ReactElement {
  return (
    <>
      <header className="rp-header">
        <div className="rp-photo">
          <div className="rp-photo__inner">
            <span className="rp-photo__initials">MN</span>
            <span className="rp-photo__label">Photo</span>
          </div>
        </div>
        <div className="rp-header__text">
          <h1 className="rp-name">MELVIN NOGOY</h1>
          <p className="rp-title">Full Stack Developer &bull; Software Engineer</p>
          <div className="rp-contacts">
            <span>0994-823-5631</span>
            <span>m.viner001@gmail.com</span>
            <span>Tarlac City, Philippines</span>
            <span>29 years old</span>
          </div>
        </div>
      </header>

      <hr className="rp-rule" />

      <section className="rp-section">
        <h2 className="rp-sh">PROFILE</h2>
        <p className="rp-body">
          Full Stack Developer with 5 years combined experience in software
          engineering, QA, and system development. Specialized in bridging rapid
          prototyping with enterprise legacy systems—building fast, maintainable
          applications with clean implementation across government and
          institutional sectors.
        </p>
      </section>

      <div className="rp-two-col">
        <section className="rp-section">
          <h2 className="rp-sh">SKILLS</h2>
          <ul className="rp-ul">
            <li><strong>Frontend:</strong> React, Next.js, Vue.js, TypeScript, Tailwind CSS</li>
            <li><strong>Backend:</strong> Laravel, Rust, Django, REST API Design</li>
            <li><strong>Desktop:</strong> Tauri (Rust-based), Electron</li>
            <li><strong>Database:</strong> PostgreSQL, MySQL, Convex</li>
            <li><strong>QA &amp; Ops:</strong> Manual Testing, Regression Testing, Git, CI/CD</li>
          </ul>
        </section>

        <section className="rp-section">
          <h2 className="rp-sh">EDUCATION</h2>
          <div className="rp-job">
            <div className="rp-job__head">
              <strong>BS Information Technology</strong>
              <span className="rp-date">Apr 2026</span>
            </div>
            <p className="rp-body-sm">
              General De Jesus College (2022–2026)<br />Capstone II remaining
            </p>
          </div>
        </section>
      </div>

      <section className="rp-section">
        <h2 className="rp-sh">EXPERIENCE</h2>

        <div className="rp-job">
          <div className="rp-job__head">
            <strong>Full Stack Developer — Provincial Government Digital Transformation</strong>
            <span className="rp-date">Nov 2025 – Mar 2026</span>
          </div>
          <p className="rp-body-sm">
            Architected production-grade systems for Province of Tarlac,
            transitioning from rapid Convex prototypes to Laravel 12 enterprise
            infrastructure serving 18 municipalities.
          </p>
        </div>

        <div className="rp-job">
          <div className="rp-job__head">
            <strong>Quality Assurance Tester — Hooli Software International</strong>
            <span className="rp-date">Jun 2025 – Nov 2025</span>
          </div>
          <p className="rp-body-sm">
            Designed and executed manual test cases for enterprise web
            applications; logged, tracked, and verified defects during feature
            and regression cycles.
          </p>
        </div>

        <div className="rp-job">
          <div className="rp-job__head">
            <strong>Full Stack Developer — Project-Based &amp; Institutional</strong>
            <span className="rp-date">2021 – 2025</span>
          </div>
          <p className="rp-body-sm">
            Built end-to-end systems including Library Inventory Management,
            Offline Attendance Loggers, and QA management tools using Vue.js,
            Laravel, React, and Tauri.
          </p>
        </div>

        <div className="rp-job">
          <div className="rp-job__head">
            <strong>IT Support / Technical Assistant</strong>
            <span className="rp-date">2019 – 2020</span>
          </div>
          <p className="rp-body-sm">
            Troubleshot hardware, software, and network issues; documented
            technical processes and supported staff operations.
          </p>
        </div>
      </section>

      <section className="rp-section">
        <h2 className="rp-sh">PROJECTS</h2>

        <div className="rp-job">
          <div className="rp-job__head">
            <strong>PGO Connect — Provincial Governor's Office DMS</strong>
            <span className="rp-date">Feb – Mar 2026</span>
          </div>
          <p className="rp-job__stack">Next.js 16, Laravel 11, PostgreSQL, SMS/Facebook APIs</p>
          <p className="rp-body-sm">
            Enhanced a mission-critical citizen service platform processing
            1000+ monthly requests across 18 municipalities.
          </p>
        </div>

        <div className="rp-job">
          <div className="rp-job__head">
            <strong>PPDO Next — Provincial Planning &amp; Development Platform</strong>
            <span className="rp-date">Nov 2025 – Jan 2026</span>
          </div>
          <p className="rp-job__stack">Next.js 16, Laravel 12, Convex, PostgreSQL</p>
          <p className="rp-body-sm">
            Architected a government-grade financial planning ecosystem with
            4-tier hierarchical allocation, RBAC security, and zero-downtime
            migration from Convex to PostgreSQL.
          </p>
        </div>

        <div className="rp-two-col-sm">
          <div className="rp-job">
            <div className="rp-job__head"><strong>Offline Kiosk Logger</strong><span className="rp-date">2024</span></div>
            <p className="rp-job__stack">Tauri, React</p>
            <p className="rp-body-sm">Offline-first attendance logging with printable report generation.</p>
          </div>
          <div className="rp-job">
            <div className="rp-job__head"><strong>BugCake QA Tool</strong><span className="rp-date">2024</span></div>
            <p className="rp-job__stack">React, Convex</p>
            <p className="rp-body-sm">Centralized test case management platform for QA workflows.</p>
          </div>
          <div className="rp-job">
            <div className="rp-job__head"><strong>Library Inventory System</strong><span className="rp-date">2024</span></div>
            <p className="rp-job__stack">Vue.js, Laravel</p>
            <p className="rp-body-sm">End-to-end system for tracking books, students, and borrowing activities.</p>
          </div>
          <div className="rp-job">
            <div className="rp-job__head"><strong>Attendance Logger</strong><span className="rp-date">2023</span></div>
            <p className="rp-job__stack">Vue.js, Laravel API</p>
            <p className="rp-body-sm">Cross-platform attendance tracking with admin dashboard and reporting.</p>
          </div>
        </div>
      </section>
    </>
  );
}
