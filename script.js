/* ============================================================
   0 to Shipped — Resume Parser (mock)
   No backend. The "analysis" is simulated but deterministic:
   the same file always produces the same score, so the demo
   feels real instead of random.
   ============================================================ */

/* ---------- Target role profile ---------- */
const ROLE = "Senior Frontend Engineer";

// Every skill we look for, grouped for nicer "quick wins" tips.
const SKILL_BANK = [
  // Languages & core
  { name: "JavaScript",        group: "core" },
  { name: "TypeScript",        group: "core" },
  { name: "HTML5",             group: "core" },
  { name: "CSS3",              group: "core" },
  // Frameworks
  { name: "React",             group: "framework" },
  { name: "Next.js",           group: "framework" },
  { name: "Vue",               group: "framework" },
  { name: "Redux",             group: "framework" },
  { name: "React Query",       group: "framework" },
  // Styling
  { name: "Tailwind CSS",      group: "styling" },
  { name: "SASS",              group: "styling" },
  { name: "Responsive Design", group: "styling" },
  // Tooling
  { name: "Webpack",           group: "tooling" },
  { name: "Vite",              group: "tooling" },
  { name: "Git",               group: "tooling" },
  { name: "CI/CD",             group: "tooling" },
  { name: "Jest",              group: "tooling" },
  { name: "Playwright",        group: "tooling" },
  // APIs & data
  { name: "REST APIs",         group: "api" },
  { name: "GraphQL",           group: "api" },
  { name: "WebSockets",        group: "api" },
  // Soft skills / process
  { name: "Accessibility",     group: "quality" },
  { name: "Performance",       group: "quality" },
  { name: "Code Review",       group: "quality" },
  { name: "Agile",             group: "quality" },
  { name: "Mentoring",         group: "quality" },
  { name: "System Design",     group: "quality" },
];

const TIPS = {
  core:      "Strengthen your core language section — lead with JavaScript and TypeScript.",
  framework: "Name the frameworks you used in each bullet, not just the Projects header.",
  styling:   "Mention styling systems (Tailwind, SASS) alongside the UI work you shipped.",
  tooling:   "Add build & test tooling (Vite, Jest) — it signals production experience.",
  api:       "Describe the APIs you integrated; recruiters search for REST and GraphQL.",
  quality:   "Call out impact: performance gains, accessibility work, mentoring, code review.",
  _generic:  "Mirror the exact skill keywords from the job description in your resume.",
};

/* ---------- DOM ---------- */
const $ = (sel) => document.querySelector(sel);

const fileInput   = $("#file-input");
const dropzone    = $("#dropzone");
const fileChip    = $("#file-chip");
const fileNameEl  = $("#file-name");
const fileSizeEl  = $("#file-size");
const fileRemove  = $("#file-remove");
const parseBtn    = $("#parse-btn");

const results     = $("#results");
const scoreArc    = $("#score-arc");
const scoreNumber = $("#score-number");
const scoreLabel  = $("#score-label");
const scoreCaption= $("#score-caption");
const statFound   = $("#stat-found");
const statMissing = $("#stat-missing");
const statSections= $("#stat-sections");
const listPresent = $("#list-present");
const listMissing = $("#list-missing");
const tipsList    = $("#tips-list");

const ARC_LENGTH = 2 * Math.PI * 52; // r = 52 → ≈ 326.7

/* ---------- State ---------- */
let selectedFile = null;
let parseTimer = null;      // pending simulated-parse timeout
let parseToken = 0;         // invalidates a parse that was superseded

/* ============================================================
   File selection
   ============================================================ */
dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropzone.classList.add("is-drag");
});
// dragleave also fires when moving onto a child element, which made the
// drag highlight flicker. Only clear it when the pointer truly left.
dropzone.addEventListener("dragleave", (e) => {
  if (!dropzone.contains(e.relatedTarget)) dropzone.classList.remove("is-drag");
});
dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.classList.remove("is-drag");
  const file = e.dataTransfer.files?.[0];
  if (file) handleFile(file);
});

fileInput.addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (file) handleFile(file);
});

fileRemove.addEventListener("click", () => resetFile());

function handleFile(file) {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    shake(dropzone, "Only PDF files are supported.");
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    shake(dropzone, "That file is over 5 MB.");
    return;
  }
  cancelPendingParse();
  selectedFile = file;
  fileNameEl.textContent = file.name;
  fileSizeEl.textContent = formatBytes(file.size);
  fileChip.hidden = false;
  parseBtn.disabled = false;
  hideResults();
}

function resetFile() {
  cancelPendingParse();
  selectedFile = null;
  fileInput.value = "";
  fileChip.hidden = true;
  parseBtn.disabled = true;
  hideResults();
}

/* Abort an in-flight simulated parse so a stale report can't
   overwrite the UI (or re-enable a button the user just cleared). */
function cancelPendingParse() {
  if (parseTimer) {
    clearTimeout(parseTimer);
    parseTimer = null;
  }
  parseToken++;
  parseBtn.classList.remove("is-loading");
}

function hideResults() {
  results.hidden = true;
}

/* ============================================================
   Analyze (mock)
   ============================================================ */
parseBtn.addEventListener("click", () => {
  if (!selectedFile) return;

  parseBtn.classList.add("is-loading");
  parseBtn.disabled = true;

  const token = ++parseToken;
  const file = selectedFile;

  // Simulate parse latency so the flow feels real.
  parseTimer = setTimeout(() => {
    parseTimer = null;
    if (token !== parseToken || file !== selectedFile) return; // superseded

    const report = buildReport(file);
    renderReport(report);
    parseBtn.classList.remove("is-loading");
    parseBtn.disabled = false;
  }, 1400);
});

/* Deterministic pseudo-random from the file name + size,
   so the same resume always scores the same. */
function seededRandom(seedStr) {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildReport(file) {
  const rand = seededRandom(file.name + file.size);

  // Roughly 45–85% of skills are "found", varying a bit per group.
  const present = [];
  const missing = [];
  SKILL_BANK.forEach((skill) => {
    (rand() < 0.66 ? present : missing).push(skill);
  });

  // Sections the parser pretends to detect.
  const sections = 3 + Math.floor(rand() * 4); // 3–6

  // Composite score, clamped to a believable 38–96 range.
  const coverage = present.length / SKILL_BANK.length;      // 0–1
  const sectionScore = Math.min(sections / 6, 1);           // 0–1
  const raw = coverage * 62 + sectionScore * 26 + rand() * 12 + 8;
  const score = Math.max(38, Math.min(96, Math.round(raw)));

  return { score, present, missing, sections };
}

/* ============================================================
   Render
   ============================================================ */
function renderReport({ score, present, missing, sections }) {
  results.hidden = false;

  // Score ring
  const offset = ARC_LENGTH * (1 - score / 100);
  scoreArc.style.strokeDashoffset = ARC_LENGTH;      // reset
  scoreArc.style.stroke = scoreColor(score);
  scoreNumber.textContent = "0";

  requestAnimationFrame(() => {
    scoreArc.style.strokeDashoffset = offset;
    animateNumber(scoreNumber, 0, score, 1000);
  });

  scoreLabel.textContent  = verdict(score);
  scoreCaption.textContent = `Match against a ${ROLE} role.`;

  statFound.textContent    = present.length;
  statMissing.textContent  = missing.length;
  statSections.textContent = sections;

  // Skill chips
  fillChips(listPresent, present.map((s) => s.name));
  fillChips(listMissing, missing.map((s) => s.name));

  // Quick wins — one tip per missing group, capped at 3.
  const groups = [...new Set(missing.map((s) => s.group))];
  const tips = (groups.length ? groups : ["_generic"])
    .slice(0, 3)
    .map((g) => TIPS[g] || TIPS._generic);
  tipsList.innerHTML = "";
  tips.forEach((t) => {
    const li = document.createElement("li");
    li.textContent = t;
    tipsList.appendChild(li);
  });

  results.scrollIntoView({ behavior: "smooth", block: "start" });
}

function fillChips(ul, names) {
  ul.innerHTML = "";
  if (!names.length) {
    const li = document.createElement("li");
    li.textContent = "None found";
    li.classList.add("chips__empty");
    li.style.background = "rgba(255,255,255,0.05)";
    li.style.color = "var(--text-faint)";
    li.style.borderColor = "var(--border)";
    ul.appendChild(li);
    return;
  }
  names.forEach((name) => {
    const li = document.createElement("li");
    li.textContent = name;
    ul.appendChild(li);
  });
}

/* ============================================================
   Tabs
   ============================================================ */
const tabs = Array.from(document.querySelectorAll(".tab"));

function selectTab(tab) {
  tabs.forEach((t) => {
    const active = t === tab;
    t.classList.toggle("is-active", active);
    t.setAttribute("aria-selected", String(active));
    t.tabIndex = active ? 0 : -1;
    $(`#tab-${t.dataset.tab}`).classList.toggle("is-active", active);
  });
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => selectTab(tab));

  // Roving focus + arrow-key navigation, per the ARIA tabs pattern.
  tab.addEventListener("keydown", (e) => {
    const i = tabs.indexOf(tab);
    let next = null;
    if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
    else if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
    else if (e.key === "Home") next = tabs[0];
    else if (e.key === "End") next = tabs[tabs.length - 1];
    if (!next) return;
    e.preventDefault();
    selectTab(next);
    next.focus();
  });
});

/* ============================================================
   Helpers
   ============================================================ */
function scoreColor(score) {
  if (score >= 80) return "#34d399";   // green
  if (score >= 60) return "#fbbf24";   // amber
  return "#f87171";                    // red
}

function verdict(score) {
  if (score >= 85) return "Excellent match 🚀";
  if (score >= 70) return "Strong match ✅";
  if (score >= 55) return "Promising — needs polish";
  return "Needs work";
}

function animateNumber(el, from, to, duration) {
  const start = performance.now();
  const step = (now) => {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
    el.textContent = Math.round(from + (to - from) * eased);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function shake(el, message) {
  el.style.borderColor = "#f87171";
  el.animate(
    [
      { transform: "translateX(0)" },
      { transform: "translateX(-7px)" },
      { transform: "translateX(7px)" },
      { transform: "translateX(0)" },
    ],
    { duration: 260, iterations: 1 }
  );
  if (message) flashToast(message);
  setTimeout(() => (el.style.borderColor = ""), 900);
}

let toastTimer;
function flashToast(message) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    Object.assign(toast.style, {
      position: "fixed",
      bottom: "24px",
      left: "50%",
      transform: "translateX(-50%) translateY(10px)",
      background: "#1b1d27",
      border: "1px solid rgba(248,113,113,0.4)",
      color: "#fca5a5",
      padding: "0.7rem 1.2rem",
      borderRadius: "12px",
      fontSize: "0.88rem",
      fontWeight: "600",
      zIndex: "999",
      opacity: "0",
      transition: "opacity 0.25s, transform 0.25s",
      boxShadow: "0 18px 40px -16px rgba(0,0,0,0.8)",
    });
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";
  });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(-50%) translateY(10px)";
  }, 2600);
}
