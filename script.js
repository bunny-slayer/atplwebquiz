/* eslint-disable */
"use strict";

// ---------------------------------------------------------------------------
// CSV parser (handles quoted fields with embedded commas, quotes, and newlines)
// ---------------------------------------------------------------------------
function parseCsv(text) {
  const rows = [];
  let cur = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        cur.push(field);
        field = "";
      } else if (c === "\n" || c === "\r") {
        // End of row (handle CRLF too)
        if (c === "\r" && text[i + 1] === "\n") i++;
        cur.push(field);
        field = "";
        rows.push(cur);
        cur = [];
      } else {
        field += c;
      }
    }
  }
  if (field.length > 0 || cur.length > 0) {
    cur.push(field);
    rows.push(cur);
  }
  if (rows.length === 0) return [];
  const header = rows.shift();
  return rows
    .filter((r) => r.length === header.length && r.some((v) => v !== ""))
    .map((r) => {
      const obj = {};
      for (let i = 0; i < header.length; i++) obj[header[i]] = r[i];
      return obj;
    });
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
function shuffleInPlace(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function normalizeText(s) {
  return (s || "").replace(/\s+/g, " ").trim().toLowerCase();
}

const $ = (id) => document.getElementById(id);

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const state = {
  bank: [], // all questions loaded from CSV
  bySection: new Map(),
  session: null, // active session
};

function buildSession(questions, opts) {
  return {
    questions, // array of question objects in display order
    index: 0, // current question index
    correct: 0,
    wrong: 0,
    log: [], // per-question record { qid, question, choices, given, correct, isCorrect, section, source }
    options: opts,
  };
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
async function loadQuestions() {
  let resp;
  try {
    resp = await fetch("questions.csv", { cache: "no-store" });
  } catch (err) {
    showLoadError(
      "Could not load questions.csv. If you opened this file directly with a double-click, your browser blocks file access for security. Please run start.bat / start.sh, or open this folder via a small web server (see README.md)."
    );
    return;
  }
  if (!resp.ok) {
    showLoadError(`Could not load questions.csv (HTTP ${resp.status}).`);
    return;
  }
  const text = await resp.text();
  const rows = parseCsv(text);
  state.bank = rows
    .map((r) => ({
      section: r["Section"] || "",
      qid: r["QuestionID"] || "",
      question: r["Question"] || "",
      choices: [r["ChoiceA"], r["ChoiceB"], r["ChoiceC"], r["ChoiceD"]].filter(
        (c) => c && c.trim().length > 0
      ),
      answer: r["CorrectAnswer"] || "",
      source: r["Source"] || "",
    }))
    .filter((q) => q.question && q.answer && q.choices.length >= 2);

  // Discard any question whose answer doesn't match one of its choices.
  state.bank = state.bank.filter((q) =>
    q.choices.some((c) => normalizeText(c) === normalizeText(q.answer))
  );

  // Group by section
  state.bySection = new Map();
  for (const q of state.bank) {
    if (!state.bySection.has(q.section)) state.bySection.set(q.section, []);
    state.bySection.get(q.section).push(q);
  }

  populateSectionList();
  $("home-loading").classList.add("hidden");
  $("home-form").hidden = false;
  $("footer-count").textContent = state.bank.length.toLocaleString();
  updateSectionHint();
}

function showLoadError(msg) {
  const loading = $("home-loading");
  loading.textContent = msg;
  loading.style.color = "var(--bad)";
}

function populateSectionList() {
  const list = $("section-list");
  list.innerHTML = "";
  const sections = Array.from(state.bySection.keys()).sort();
  for (const s of sections) {
    const count = state.bySection.get(s).length;
    const label = document.createElement("label");
    label.className = "section-checkbox checked";
    label.innerHTML = `
      <input type="checkbox" value="${escapeAttr(s)}" checked />
      <span class="section-name"></span>
      <span class="section-count"></span>
    `;
    label.querySelector(".section-name").textContent = s;
    label.querySelector(".section-count").textContent = count;
    label.querySelector("input").addEventListener("change", (e) => {
      label.classList.toggle("checked", e.target.checked);
      updateSectionHint();
    });
    list.appendChild(label);
  }
}

function getSelectedSections() {
  return Array.from(
    document.querySelectorAll('#section-list input[type="checkbox"]:checked')
  ).map((el) => el.value);
}

function setAllSections(checked) {
  document
    .querySelectorAll('#section-list input[type="checkbox"]')
    .forEach((el) => {
      el.checked = checked;
      el.parentElement.classList.toggle("checked", checked);
    });
  updateSectionHint();
}

function escapeAttr(s) {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function updateSectionHint() {
  const selected = getSelectedSections();
  let total = 0;
  if (selected.length === 0) {
    $("section-hint").textContent =
      "Pick at least one section to start.";
    return;
  }
  for (const s of selected) total += state.bySection.get(s).length;
  const label =
    selected.length === state.bySection.size
      ? "all sections"
      : `${selected.length} section${selected.length === 1 ? "" : "s"}`;
  $("section-hint").textContent = `${total} question${
    total === 1 ? "" : "s"
  } available across ${label}.`;
}

// ---------------------------------------------------------------------------
// Home form behaviour
// ---------------------------------------------------------------------------
function selectedCount() {
  const customRaw = $("custom-count").value;
  if (customRaw && customRaw.trim() !== "") {
    const n = parseInt(customRaw, 10);
    if (!isNaN(n) && n > 0) return n;
  }
  const selected = document.querySelector(".preset.selected");
  if (!selected) return 50;
  const data = selected.dataset.count;
  if (data === "all") return Infinity;
  return parseInt(data, 10);
}

function getEligibleQuestions() {
  const selected = getSelectedSections();
  if (selected.length === 0) return [];
  let pool = [];
  for (const s of selected) {
    pool = pool.concat(state.bySection.get(s));
  }
  if ($("hide-synth").checked) {
    pool = pool.filter((q) => q.source !== "Synthesized");
  }
  return pool;
}

function startQuiz(retryOnly = null) {
  let pool;
  if (retryOnly && retryOnly.length) {
    pool = retryOnly.slice();
  } else {
    pool = getEligibleQuestions();
  }

  if (pool.length === 0) {
    if (!retryOnly && getSelectedSections().length === 0) {
      alert("Pick at least one section first.");
    } else {
      alert("No questions match this configuration. Try another section.");
    }
    return;
  }

  shuffleInPlace(pool);
  const requested = retryOnly ? pool.length : selectedCount();
  const count = Math.min(requested, pool.length);
  pool = pool.slice(0, count);

  // Optionally shuffle the choices for each question (correct answer position varies).
  const shuffleChoices = retryOnly
    ? state.session?.options?.shuffleChoices ?? true
    : $("shuffle-choices").checked;

  const prepared = pool.map((q) => {
    const choices = q.choices.slice();
    if (shuffleChoices) shuffleInPlace(choices);
    return { ...q, choices };
  });

  let sectionLabel;
  if (retryOnly) {
    sectionLabel = "Retrying wrong answers";
  } else {
    const sel = getSelectedSections();
    sectionLabel =
      sel.length === state.bySection.size
        ? "All sections"
        : sel.length === 1
        ? sel[0]
        : `${sel.length} sections`;
  }
  state.session = buildSession(prepared, {
    shuffleChoices,
    sectionLabel,
  });

  showView("quiz-view");
  $("topbar-stats").classList.remove("hidden");
  renderQuestion();
}

// ---------------------------------------------------------------------------
// Quiz rendering
// ---------------------------------------------------------------------------
function showView(id) {
  ["home-view", "quiz-view", "summary-view"].forEach((v) => {
    $(v).classList.toggle("hidden", v !== id);
  });
  if (id !== "quiz-view") {
    if (id === "home-view") $("topbar-stats").classList.add("hidden");
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateTopbarStats() {
  const s = state.session;
  if (!s) return;
  $("stat-correct").textContent = s.correct;
  $("stat-wrong").textContent = s.wrong;
  $("stat-progress").textContent = `${s.index + 1} / ${s.questions.length}`;
}

function renderQuestion() {
  const s = state.session;
  if (!s) return;
  const q = s.questions[s.index];

  $("quiz-qid").textContent = q.qid;
  $("quiz-section").textContent = q.section;
  $("quiz-synth-tag").classList.toggle("hidden", q.source !== "Synthesized");
  $("question-text").textContent = q.question;

  const form = $("choices-form");
  form.innerHTML = "";
  q.choices.forEach((choice, i) => {
    const id = `choice-${i}`;
    const letter = String.fromCharCode(65 + i);
    const label = document.createElement("label");
    label.className = "choice";
    label.dataset.value = choice;
    label.innerHTML = `
      <input type="radio" name="answer" id="${id}" value="${i}" />
      <span class="choice-letter">${letter}</span>
      <span class="choice-body"></span>
    `;
    label.querySelector(".choice-body").textContent = choice;
    label.querySelector("input").addEventListener("change", () => {
      document
        .querySelectorAll(".choice.selected")
        .forEach((el) => el.classList.remove("selected"));
      label.classList.add("selected");
      $("submit-btn").disabled = false;
    });
    form.appendChild(label);
  });

  // Reset feedback / buttons
  $("feedback").classList.add("hidden");
  $("feedback").classList.remove("correct", "wrong");
  $("submit-btn").classList.remove("hidden");
  $("submit-btn").disabled = true;
  $("next-btn").classList.add("hidden");

  updateTopbarStats();
}

function submitAnswer() {
  const s = state.session;
  if (!s) return;
  const q = s.questions[s.index];
  const sel = document.querySelector('input[name="answer"]:checked');
  if (!sel) return;
  const givenIdx = parseInt(sel.value, 10);
  const givenText = q.choices[givenIdx];
  const isCorrect = normalizeText(givenText) === normalizeText(q.answer);

  // Lock the choice elements
  document.querySelectorAll(".choice").forEach((el, i) => {
    el.classList.add("locked");
    const inp = el.querySelector("input");
    inp.disabled = true;
    if (normalizeText(q.choices[i]) === normalizeText(q.answer)) {
      el.classList.add("correct");
    }
    if (i === givenIdx && !isCorrect) {
      el.classList.add("incorrect");
    }
  });

  if (isCorrect) {
    s.correct++;
    $("feedback").classList.remove("hidden");
    $("feedback").classList.add("correct");
    $("feedback-headline").textContent = "Correct";
    $("feedback-detail").textContent = "Nicely done.";
  } else {
    s.wrong++;
    $("feedback").classList.remove("hidden");
    $("feedback").classList.add("wrong");
    $("feedback-headline").textContent = "Incorrect";
    $("feedback-detail").textContent = `Correct answer: ${q.answer}`;
  }

  s.log.push({
    qid: q.qid,
    section: q.section,
    question: q.question,
    choices: q.choices,
    given: givenText,
    correct: q.answer,
    isCorrect,
    source: q.source,
  });

  $("submit-btn").classList.add("hidden");
  const nextBtn = $("next-btn");
  nextBtn.classList.remove("hidden");
  nextBtn.textContent =
    s.index + 1 >= s.questions.length ? "See summary →" : "Next question →";
  updateTopbarStats();
}

function goNext() {
  const s = state.session;
  if (!s) return;
  s.index++;
  if (s.index >= s.questions.length) {
    showSummary();
  } else {
    renderQuestion();
  }
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
function showSummary() {
  const s = state.session;
  if (!s) return;
  $("summary-correct").textContent = s.correct;
  $("summary-wrong").textContent = s.wrong;
  const total = s.correct + s.wrong;
  $("summary-total").textContent = total;
  const pct = total > 0 ? Math.round((s.correct / total) * 100) : 0;
  $("summary-percent").textContent = total > 0 ? `${pct}%` : "—";

  const list = $("wrong-list");
  list.innerHTML = "";
  const wrongs = s.log.filter((r) => !r.isCorrect);
  if (wrongs.length === 0) {
    const p = document.createElement("p");
    p.className = "empty-msg";
    p.textContent = "Nothing here — you got every question right. Excellent work.";
    list.appendChild(p);
  } else {
    wrongs.forEach((r) => list.appendChild(buildWrongItem(r)));
  }

  $("retry-wrong-btn").disabled = wrongs.length === 0;
  showView("summary-view");
}

function buildWrongItem(record) {
  const wrap = document.createElement("div");
  wrap.className = "wrong-item";

  const meta = document.createElement("div");
  meta.className = "wrong-meta";
  meta.innerHTML = `<span class="qid">${escapeHtml(record.qid)}</span>
    <span class="section-tag">${escapeHtml(record.section)}</span>${
    record.source === "Synthesized"
      ? `<span class="synth-badge">Synthesized choices</span>`
      : ""
  }`;
  wrap.appendChild(meta);

  const q = document.createElement("div");
  q.className = "wrong-question";
  q.textContent = record.question;
  wrap.appendChild(q);

  const yours = document.createElement("div");
  yours.className = "answer-row your";
  yours.innerHTML = `<span class="label">Your answer</span><span class="text"></span>`;
  yours.querySelector(".text").textContent = record.given;
  wrap.appendChild(yours);

  const correct = document.createElement("div");
  correct.className = "answer-row correct";
  correct.innerHTML = `<span class="label">Correct</span><span class="text"></span>`;
  correct.querySelector(".text").textContent = record.correct;
  wrap.appendChild(correct);

  return wrap;
}

function escapeHtml(s) {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------
function wireHome() {
  $("hide-synth").addEventListener("change", updateSectionHint);
  $("select-all-sections").addEventListener("click", () => setAllSections(true));
  $("clear-sections").addEventListener("click", () => setAllSections(false));

  document.querySelectorAll(".preset").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".preset.selected")
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      $("custom-count").value = "";
    });
  });

  $("custom-count").addEventListener("input", () => {
    if ($("custom-count").value.trim() !== "") {
      document
        .querySelectorAll(".preset.selected")
        .forEach((b) => b.classList.remove("selected"));
    }
  });

  $("start-btn").addEventListener("click", () => startQuiz(null));
}

function wireQuiz() {
  $("submit-btn").addEventListener("click", submitAnswer);
  $("next-btn").addEventListener("click", goNext);
  $("quit-btn").addEventListener("click", () => {
    if (
      confirm(
        "End this session and view the summary? Unanswered questions will be skipped."
      )
    ) {
      showSummary();
    }
  });
}

function wireSummary() {
  $("retry-wrong-btn").addEventListener("click", () => {
    const wrongs = state.session.log
      .filter((r) => !r.isCorrect)
      .map((r) => state.bank.find((q) => q.qid === r.qid))
      .filter(Boolean);
    if (wrongs.length === 0) return;
    startQuiz(wrongs);
  });
  $("home-btn").addEventListener("click", () => {
    state.session = null;
    showView("home-view");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  wireHome();
  wireQuiz();
  wireSummary();
  loadQuestions();
});
