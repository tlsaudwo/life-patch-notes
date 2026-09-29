// ===== LIFE PATCH NOTES =====
const STORAGE_KEY = "life-patch-notes:v1";

const TYPES = {
  new:     { label: "새 기능",     tag: "[NEW]",      emoji: "·" },
  improve: { label: "개선",        tag: "[IMPROVED]", emoji: "⚡" },
  fix:     { label: "버그 수정",   tag: "[FIXED]",    emoji: "🔧" },
  remove:  { label: "삭제",        tag: "[REMOVED]",  emoji: "🗑" },
  known:   { label: "알려진 문제", tag: "[KNOWN]",    emoji: "⚠" },
};

const SAMPLE = {
  name: "플레이어",
  patches: [
    {
      id: uid(),
      version: "27.1",
      date: "2026-07-01",
      title: "여름 시즌 업데이트",
      entries: [
        { type: "new", text: "주 2회 러닝 기능 추가" },
        { type: "fix", text: "일요일 밤 우울 버그 일부 수정" },
        { type: "known", text: "월요일 아침 로딩 속도 저하 현상" },
      ],
    },
    {
      id: uid(),
      version: "27.2",
      date: "2026-09-01",
      title: "새벽형 인간 베타",
      entries: [
        { type: "new", text: "오전 6시 기상 모드 (베타)" },
        { type: "improve", text: "수면 품질 15% 향상" },
        { type: "remove", text: "새벽 2시 유튜브 시청 기능 제거" },
        { type: "fix", text: "야식 섭취 버그 일부 수정 — 완전 해결은 다음 패치에서" },
      ],
    },
  ],
};

// ---------- State ----------
let state = load();
let filter = "all";
let editingId = null;

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return structuredClone(SAMPLE);
}
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ---------- Helpers ----------
const $ = (s) => document.querySelector(s);
function esc(str) {
  return String(str).replace(/[&<>"']/g, (c) =>
    ({ "&": "\u0026amp;", "<": "\u0026lt;", ">": "\u0026gt;", '"': "\u0026quot;", "'": "\u0026#39;" }[c]));
}
function cmpVersion(a, b) {
  const pa = String(a).split(".").map(Number);
  const pb = String(b).split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
}
function sorted() {
  return [...state.patches].sort(
    (a, b) => cmpVersion(b.version, a.version) || b.date.localeCompare(a.date));
}
function nextVersion() {
  const latest = sorted()[0];
  if (!latest) return "1.0";
  const parts = latest.version.split(".").map(Number);
  parts[parts.length - 1] = (parts[parts.length - 1] || 0) + 1;
  return parts.join(".");
}
function today() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 1800);
}

// ---------- Render ----------
function render() {
  const list = sorted();
  $("#playerName").textContent = state.name;
  $("#currentVersion").textContent = list[0] ? "v" + list[0].version : "v0.0";
  document.title = `${state.name} ${list[0] ? "v" + list[0].version : ""} — 내 인생 패치노트`;

  // stats
  const counts = { new: 0, improve: 0, fix: 0, remove: 0, known: 0 };
  list.forEach((p) => p.entries.forEach((e) => counts[e.type]++));
  $("#stats").innerHTML =
    `<div class="stat"><div class="num">${list.length}</div><div class="label">총 패치</div></div>` +
    Object.entries(TYPES).map(([k, t]) =>
      `<div class="stat"><div class="num" style="color:var(--${k})">${counts[k]}</div>
       <div class="label">${t.emoji} ${t.label}</div></div>`).join("");

  // filters
  $("#filters").innerHTML =
    `<button class="chip ${filter === "all" ? "active" : ""}" data-f="all">전체</button>` +
    Object.entries(TYPES).map(([k, t]) =>
      `<button class="chip ${filter === k ? "active" : ""}" data-f="${k}">${t.emoji} ${t.label}</button>`).join("");

  // list
  const visible = filter === "all" ? list : list.filter((p) => p.entries.some((e) => e.type === filter));
  if (!visible.length) {
    $("#patchList").innerHTML = `<div class="empty">
      ${list.length ? "해당 항목이 있는 패치가 없어요." : "아직 배포된 패치가 없어요.<br/>첫 번째 인생 업데이트를 배포해보세요! →"}
    </div>`;
    return;
  }
  $("#patchList").innerHTML = visible.map((p, i) => {
    const groups = Object.keys(TYPES)
      .filter((k) => filter === "all" || k === filter)
      .map((k) => {
        const items = p.entries.filter((e) => e.type === k);
        if (!items.length) return "";
        return `<div class="group g-${k}"><h4>${TYPES[k].tag} ${TYPES[k].label}</h4>
          <ul>${items.map((e) => `<li>${esc(e.text)}</li>`).join("")}</ul></div>`;
      }).join("");
    const isLatest = p.id === list[0].id;
    return `<article class="patch" style="animation-delay:${i * 40}ms">
      <div class="patch-head">
        <div>
          <span class="v">v${esc(p.version)}</span>
          ${isLatest ? '<span class="latest">LATEST</span>' : ""}
          <div class="t">${esc(p.title)}</div>
          <div class="d">${esc(p.date)} 배포</div>
        </div>
        <div class="patch-actions">
          <button class="btn icon" data-act="copy" data-id="${p.id}" title="텍스트 복사">▪ 공유</button>
          <button class="btn icon" data-act="edit" data-id="${p.id}" title="수정">✏</button>
          <button class="btn icon" data-act="del" data-id="${p.id}" title="삭제">🗑</button>
        </div>
      </div>
      <div class="patch-body">${groups}</div>
    </article>`;
  }).join("");
}

// ---------- Patch dialog ----------
const dlg = $("#patchDialog");

function entryRow(entry = { type: "new", text: "" }) {
  const div = document.createElement("div");
  div.className = "entry";
  div.innerHTML = `
    <select>${Object.entries(TYPES).map(([k, t]) =>
      `<option value="${k}" ${k === entry.type ? "selected" : ""}>${t.emoji} ${t.label}</option>`).join("")}</select>
    <input placeholder="예: 아침 스트레칭 기능 추가" maxlength="120" value="${esc(entry.text)}" />
    <button type="button" class="btn icon" title="삭제">✕</button>`;
  div.querySelector("button").onclick = () => {
    div.remove();
    if (!$("#entries").children.length) $("#entries").append(entryRow());
  };
  return div;
}

function openPatch(patch) {
  editingId = patch ? patch.id : null;
  $("#dialogTitle").textContent = patch ? `v${patch.version} 수정` : "새 패치 배포";
  $("#fVersion").value = patch ? patch.version : nextVersion();
  $("#fDate").value = patch ? patch.date : today();
  $("#fTitle").value = patch ? patch.title : "";
  const box = $("#entries");
  box.innerHTML = "";
  (patch ? patch.entries : [{ type: "new", text: "" }, { type: "fix", text: "" }])
    .forEach((e) => box.append(entryRow(e)));
  dlg.showModal();
}

$("#patchForm").addEventListener("submit", (ev) => {
  const version = $("#fVersion").value.trim().replace(/^v/i, "");
  if (!/^\d+(\.\d+)*$/.test(version)) {
    ev.preventDefault();
    toast("버전은 숫자와 점만 가능해요 (예: 27.3)");
    return;
  }
  const entries = [...$("#entries").children]
    .map((row) => ({ type: row.querySelector("select").value, text: row.querySelector("input").value.trim() }))
    .filter((e) => e.text);
  if (!entries.length) {
    ev.preventDefault();
    toast("변경 사항을 하나 이상 적어주세요");
    return;
  }
  const dup = state.patches.find((p) => p.version === version && p.id !== editingId);
  if (dup) {
    ev.preventDefault();
    toast(`v${version}은(는) 이미 배포된 버전이에요`);
    return;
  }
  const data = { version, date: $("#fDate").value, title: $("#fTitle").value.trim(), entries };
  if (editingId) {
    Object.assign(state.patches.find((p) => p.id === editingId), data);
    toast("패치가 수정되었어요");
  } else {
    state.patches.push({ id: uid(), ...data });
    toast(`→ v${version} 배포 완료!`);
  }
  save();
  render();
});

$("#addEntryBtn").onclick = () => {
  const row = entryRow();
  $("#entries").append(row);
  row.querySelector("input").focus();
};
$("#cancelBtn").onclick = () => dlg.close();
$("#newPatchBtn").onclick = () => openPatch();

// ---------- List actions ----------
$("#patchList").addEventListener("click", async (ev) => {
  const btn = ev.target.closest("[data-act]");
  if (!btn) return;
  const patch = state.patches.find((p) => p.id === btn.dataset.id);
  if (!patch) return;
  if (btn.dataset.act === "edit") openPatch(patch);
  if (btn.dataset.act === "del") {
    if (confirm(`v${patch.version} 패치를 삭제할까요? (롤백은 불가능해요)`)) {
      state.patches = state.patches.filter((p) => p.id !== patch.id);
      save();
      render();
      toast("패치가 삭제되었어요");
    }
  }
  if (btn.dataset.act === "copy") {
    const text = patchToText(patch);
    try {
      await navigator.clipboard.writeText(text);
      toast("패치노트가 복사되었어요 ▪");
    } catch {
      prompt("아래 내용을 복사하세요", text);
    }
  }
});

function patchToText(p) {
  const lines = [`📦 ${state.name} v${p.version} — ${p.title}`, `🗓 ${p.date}`, ""];
  Object.entries(TYPES).forEach(([k, t]) => {
    const items = p.entries.filter((e) => e.type === k);
    if (!items.length) return;
    lines.push(`${t.tag} ${t.label}`);
    items.forEach((e) => lines.push(`- ${e.text}`));
    lines.push("");
  });
  lines.push("#인생패치노트");
  return lines.join(String.fromCharCode(10));
}

$("#filters").addEventListener("click", (ev) => {
  const chip = ev.target.closest("[data-f]");
  if (!chip) return;
  filter = chip.dataset.f;
  render();
});

// ---------- Settings ----------
const sdlg = $("#settingsDialog");
$("#settingsBtn").onclick = () => {
  $("#sName").value = state.name;
  sdlg.showModal();
};
$("#settingsCancel").onclick = () => sdlg.close();
$("#settingsForm").addEventListener("submit", () => {
  state.name = $("#sName").value.trim() || "플레이어";
  save();
  render();
  toast("설정이 저장되었어요");
});
$("#exportBtn").onclick = () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `life-patch-notes-${today()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
};
$("#importInput").onchange = async (ev) => {
  const file = ev.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data.patches)) throw new Error();
    state = { name: data.name || "플레이어", patches: data.patches };
    save();
    render();
    sdlg.close();
    toast("백업을 불러왔어요");
  } catch {
    toast("올바른 백업 파일이 아니에요");
  }
  ev.target.value = "";
};
$("#resetBtn").onclick = () => {
  if (confirm("모든 패치 기록을 삭제할까요? 되돌릴 수 없어요.")) {
    state = { name: state.name, patches: [] };
    save();
    render();
    sdlg.close();
    toast("초기화되었어요");
  }
};

render();
