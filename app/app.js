(function () {
  const cards = window.CARD_DATA || [];
  const stateKey = "physics-card-state-v1";
  const els = {
    summary: document.getElementById("summary"),
    list: document.getElementById("cardList"),
    tabs: Array.from(document.querySelectorAll(".tab")),
    search: document.getElementById("search"),
    filter: document.getElementById("filter"),
    reset: document.getElementById("resetBtn"),
  };

  let activeGroup = "读题卡";
  let store = loadStore();

  function loadStore() {
    try {
      return JSON.parse(localStorage.getItem(stateKey)) || {};
    } catch {
      return {};
    }
  }

  function saveStore() {
    localStorage.setItem(stateKey, JSON.stringify(store));
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderContent(text) {
    const safe = escapeHtml(text);
    const lines = safe.split("\n");
    if (lines.every((line) => line.trim().startsWith("- ") || line.trim() === "")) {
      const items = lines
        .filter((line) => line.trim())
        .map((line) => `<li>${line.trim().replace(/^- /, "")}</li>`)
        .join("");
      return `<ul>${items}</ul>`;
    }
    return safe
      .replace(/```text\n?/g, "")
      .replace(/```/g, "")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  }

  function nowStart() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function addDays(days) {
    const d = nowStart();
    d.setDate(d.getDate() + days);
    return d.toISOString();
  }

  function formatDate(value) {
    if (!value) return "未安排";
    const d = new Date(value);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  function isDue(card) {
    const s = store[card.id];
    if (!s || s.retired) return false;
    if (!s.nextDue) return true;
    return new Date(s.nextDue).getTime() <= nowStart().getTime();
  }

  function visibleCards() {
    const query = els.search.value.trim().toLowerCase();
    const filter = els.filter.value;
    return cards.filter((card) => {
      const s = store[card.id] || {};
      if (activeGroup === "今日唤醒") {
        if (!isDue(card)) return false;
      } else if (card.group !== activeGroup) {
        return false;
      }
      if (filter === "active" && s.retired) return false;
      if (filter === "due" && !isDue(card)) return false;
      if (filter === "retired" && !s.retired) return false;
      if (!query) return true;
      const haystack = [card.title, card.group, ...card.sections.map((x) => `${x.label} ${x.content}`)]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }

  function updateSummary() {
    const done = Object.values(store).filter((x) => x.retired).length;
    const due = cards.filter(isDue).length;
    els.summary.textContent = `${cards.length}张卡｜今日唤醒${due}张｜已退出${done}张`;
  }

  function mark(card, value) {
    const prev = store[card.id] || { streak: 0 };
    let streak = value === "A" ? (prev.streak || 0) + 1 : 0;
    let retired = streak >= 3;
    let nextDue = null;
    if (!retired) {
      if (value === "A") nextDue = addDays(streak === 1 ? 2 : 4);
      if (value === "B") nextDue = addDays(1);
      if (value === "C") nextDue = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
    }
    store[card.id] = {
      last: value,
      streak,
      retired,
      nextDue,
      updatedAt: new Date().toISOString(),
    };
    saveStore();
    render();
  }

  function renderCard(card) {
    const s = store[card.id] || {};
    const sections = card.sections
      .map(
        (section) => `
          <section class="section">
            <h3>${escapeHtml(section.label)}</h3>
            <div class="content">${renderContent(section.content)}</div>
          </section>
        `
      )
      .join("");
    const image = card.image
      ? `<div class="figure"><img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.imageAlt)}" loading="lazy"></div>`
      : "";
    const meta = s.retired
      ? `连续A ${s.streak || 0}次｜已退出唤醒队列`
      : `上次：${s.last || "未选择"}｜连续A ${s.streak || 0}次｜下次：${formatDate(s.nextDue)}`;
    return `
      <article class="card ${s.retired ? "retired" : ""}">
        <div class="card-head">
          <h2>${escapeHtml(card.title)}</h2>
          <span class="badge">${escapeHtml(card.group)}</span>
        </div>
        ${image}
        ${sections}
        <div class="state" aria-label="状态选择">
          <button type="button" data-id="${card.id}" data-state="A">A 会</button>
          <button type="button" data-id="${card.id}" data-state="B">B 慢</button>
          <button type="button" data-id="${card.id}" data-state="C">C 不会</button>
        </div>
        <div class="meta">${escapeHtml(meta)}</div>
      </article>
    `;
  }

  function render() {
    updateSummary();
    const list = visibleCards();
    els.list.innerHTML = list.length ? list.map(renderCard).join("") : `<div class="empty">这一组暂时没有要看的卡。</div>`;
  }

  els.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      els.tabs.forEach((x) => x.classList.remove("active"));
      tab.classList.add("active");
      activeGroup = tab.dataset.group;
      render();
    });
  });

  els.search.addEventListener("input", render);
  els.filter.addEventListener("change", render);
  els.reset.addEventListener("click", () => {
    if (confirm("确定清空所有A/B/C记录和唤醒时间吗？")) {
      store = {};
      saveStore();
      render();
    }
  });

  els.list.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-state]");
    if (!button) return;
    const card = cards.find((x) => x.id === button.dataset.id);
    if (card) mark(card, button.dataset.state);
  });

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }

  render();
})();
