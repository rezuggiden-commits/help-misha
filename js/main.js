/* ============================================================
   main.js — весь функционал сайта. Данные берутся из config.js.
   Править этот файл при обновлении контента НЕ нужно.
   ============================================================ */
(function () {
  "use strict";

  const S = window.SITE || {};
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* ---------- Утилиты ---------- */
  const fmtMoney = (n) => new Intl.NumberFormat("ru-RU").format(Math.round(n)) + " ₽";
  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  function getByPath(path) {
    return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), S);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise((resolve, reject) => {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;opacity:0;";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy") ? resolve() : reject(new Error("copy failed"));
      } catch (e) { reject(e); }
      finally { ta.remove(); }
    });
  }

  let toastEl = null;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toastEl.classList.remove("show"), 2200);
  }

  function fmtDate(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return esc(iso);
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  }

  /* ---------- Иконки ---------- */
  const ICO = {
    heart: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-7.5-4.9-10-9.6C.4 8 2 4.5 5.5 4.2c2-.2 3.9.8 5 2.4h3c1.1-1.6 3-2.6 5-2.4C22 4.5 23.6 8 22 11.4 19.5 16.1 12 21 12 21z" transform="scale(.96) translate(.5 .5)"/><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
    qr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 14h3v3h-3zM20 14h1M14 20h1M18 18h3v3h-3z"/></svg>',
    card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 9.5h19M6 15h4"/></svg>',
    bank: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 9.5L12 4l9 5.5M4.5 10v9M9 10v9M15 10v9M19.5 10v9M3 19.5h18"/></svg>',
    wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 7.5A2.5 2.5 0 015.5 5H18a1 1 0 011 1v1.5M3 7.5V17a2 2 0 002 2h15a1 1 0 001-1v-8a1 1 0 00-1-1H5.5A2.5 2.5 0 013 7.5z"/><circle cx="16.5" cy="13.5" r="1.2" fill="currentColor" stroke="none"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 4h4l1.5 4.5-2.2 1.6a13 13 0 005.6 5.6l1.6-2.2L20 15v4a1.5 1.5 0 01-1.7 1.5C10.4 19.6 4.4 13.6 3.5 5.7A1.5 1.5 0 015 4z"/></svg>',
    tg: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.9 4.6l-3.1 14.7c-.2 1-.8 1.3-1.7.8l-4.6-3.4-2.2 2.1c-.2.3-.5.5-.9.5l.3-4.7 8.5-7.7c.4-.3-.1-.5-.6-.2L7.2 13.4l-4.5-1.4c-1-.3-1-1 .2-1.5l17.5-6.7c.8-.3 1.5.2 1.5.8z"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 00-8.6 15L2 22l5.2-1.4A10 10 0 1012 2zm5.5 14.1c-.2.7-1.3 1.3-1.9 1.4-.5.1-1.1.2-3.4-.7-2.9-1.2-4.7-4.1-4.9-4.3-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6-.5.5c-.2.2-.3.4-.1.7.2.3.9 1.5 2 2.4 1.4 1.2 2.5 1.6 2.8 1.7.3.2.5.1.7-.1l1-1.1c.2-.3.4-.2.7-.1l2.1 1c.3.2.5.3.6.4 0 .2 0 .7-.2 1.4z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5L12 13l8.5-6.5"/></svg>',
    check: '<svg class="ok-ico" viewBox="0 0 24 24" fill="none" stroke="#5f9e6e" stroke-width="2.2" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#eaf3ec"/><path d="M7.5 12.5l3 3 6-6.5"/></svg>',
    vk: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.2 18.5c-6 0-9.4-4.1-9.6-10.9h3c.1 5 2.3 7.1 4 7.5V7.6h2.9v4.3c1.7-.2 3.5-2.2 4.1-4.3h2.9c-.5 2.6-2.5 4.6-3.8 5.4 1.3.7 3.6 2.5 4.4 5.5h-3.2c-.6-2-2.3-3.5-4.4-3.7v3.7h-.3z"/></svg>',
  };

  /* ---------- Баннер режима настройки ---------- */
  if (S.demo) {
    const b = document.createElement("div");
    b.className = "demo-banner";
    b.innerHTML = "<b>Режим настройки.</b> Данные на сайте — шаблонные. Замените их в файле <b>config.js</b> и поставьте там <b>demo: false</b>, чтобы скрыть этот баннер.";
    const header = $(".site-header");
    if (header) header.after(b);
  }

  /* ---------- Шапка ---------- */
  const header = $(".site-header");
  if (header) {
    const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }
  const burger = $("#burger");
  const mobileNav = $("#mobile-nav");
  if (burger && mobileNav) {
    burger.addEventListener("click", () => {
      const open = mobileNav.hidden;
      mobileNav.hidden = !open;
      burger.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", String(open));
    });
  }

  /* ---------- Подстановка простых значений data-fill ---------- */
  $$("[data-fill]").forEach((el) => {
    const v = getByPath(el.getAttribute("data-fill"));
    if (v != null && v !== "") el.textContent = v;
  });

  /* ---------- Прогресс сбора ---------- */
  const goal = Number(S.fundraising && S.fundraising.goal) || 0;
  const raised = Number(S.fundraising && S.fundraising.raised) || 0;
  const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
  $$("[data-raised]").forEach((el) => (el.textContent = fmtMoney(raised)));
  $$("[data-goal]").forEach((el) => (el.textContent = fmtMoney(goal)));
  $$("[data-left]").forEach((el) => (el.textContent = fmtMoney(Math.max(0, goal - raised))));
  $$("[data-percent]").forEach((el) => (el.textContent = pct + "%"));

  // Срок сбора (если указан)
  const deadline = S.fundraising && S.fundraising.deadline;
  $$("[data-deadline]").forEach((el) => (el.textContent = deadline || ""));
  $$("[data-deadline-wrap]").forEach((el) => { el.hidden = !deadline; });

  const bars = $$("[data-progress-bar]");
  if (bars.length) {
    // Запускаем анимацию после первой отрисовки
    requestAnimationFrame(() =>
      setTimeout(() => bars.forEach((b) => (b.style.width = pct + "%")), 60)
    );
  }

  /* ---------- «На что идут деньги» ---------- */
  $$("[data-whatfor]").forEach((ul) => {
    const items = (S.fundraising && S.fundraising.whatFor) || [];
    ul.innerHTML = items.map((t) => `<li>${ICO.check}<span>${esc(t)}</span></li>`).join("");
  });

  /* ---------- Слайдер ---------- */
  $$("[data-slider]").forEach((root) => {
    const track = $("[data-slider-track]", root);
    const dotsBox = $("[data-slider-dots]", root);
    const slides = (S.slider && S.slider.length ? S.slider : (S.gallery || []).slice(0, 3));
    if (!track || !slides.length) return;
    track.innerHTML = slides
      .map((src, i) => `<img src="${esc(src)}" alt="Фото ${i + 1}" ${i ? 'loading="lazy"' : 'fetchpriority="high"'} draggable="false">`)
      .join("");
    const imgs = $$("img", track);
    let idx = 0, timer = null;

    const dots = slides.map((_, i) => {
      const b = document.createElement("button");
      b.setAttribute("aria-label", "Фото " + (i + 1));
      b.addEventListener("click", () => go(i, true));
      dotsBox.appendChild(b);
      return b;
    });

    function go(i, manual) {
      idx = (i + slides.length) % slides.length;
      track.style.transform = `translateX(-${idx * 100}%)`;
      dots.forEach((d, k) => d.classList.toggle("active", k === idx));
      if (manual) restart();
    }
    function restart() {
      clearInterval(timer);
      timer = setInterval(() => go(idx + 1), 5000);
    }
    $("[data-slider-prev]", root).addEventListener("click", () => go(idx - 1, true));
    $("[data-slider-next]", root).addEventListener("click", () => go(idx + 1, true));

    // Свайп
    let startX = null;
    root.addEventListener("pointerdown", (e) => { startX = e.clientX; clearInterval(timer); });
    root.addEventListener("pointerup", (e) => {
      if (startX == null) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1), true);
      else restart();
      startX = null;
    });
    root.addEventListener("mouseenter", () => clearInterval(timer));
    root.addEventListener("mouseleave", restart);
    root.addEventListener("touchstart", () => clearInterval(timer), { passive: true });

    go(0);
    restart();
  });

  /* ---------- Галерея + лайтбокс ---------- */
  $$("[data-gallery]").forEach((grid) => {
    const items = (S.gallery && S.gallery.length ? S.gallery : (S.slider || []));
    grid.innerHTML = items
      .map((src, i) => `
        <button class="gallery-item" type="button" data-lb="${esc(src)}" aria-label="Открыть фото ${i + 1}">
          <img src="${esc(src)}" alt="Фото ${i + 1}" loading="lazy">
        </button>`)
      .join("");

    let lb = null;
    grid.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-lb]");
      if (!btn) return;
      lb = document.createElement("div");
      lb.className = "lightbox";
      lb.innerHTML = `<img src="${btn.getAttribute("data-lb")}" alt="Фото">`;
      lb.addEventListener("click", () => { lb.remove(); lb = null; });
      document.body.appendChild(lb);
      document.body.style.overflow = "hidden";
      const obs = new MutationObserver(() => {
        if (!document.body.contains(lb)) { document.body.style.overflow = ""; obs.disconnect(); }
      });
      obs.observe(document.body, { childList: true });
    });
  });

  /* ---------- История ---------- */
  $$("[data-story]").forEach((box) => {
    const paras = S.story || [];
    box.innerHTML = paras
      .map((t) => "<p>" + esc(t).replace(/%%(.+?)%%/g, '<span class="em">$1</span>') + "</p>")
      .join("");
  });

  /* ---------- Отчёты ---------- */
  $$("[data-reports]").forEach((box) => {
    const limit = parseInt(box.getAttribute("data-limit") || "0", 10);
    const all = S.reports || [];
    const reports = limit > 0 ? all.slice(0, limit) : all;
    if (!reports.length) {
      box.innerHTML = "<p>Отчёты появятся сразу после первых трат — с чеками и документами.</p>";
      return;
    }
    box.innerHTML = reports
      .map((r) => `
        <article class="report reveal">
          <div class="report-date">${fmtDate(r.date)}</div>
          <h3>${esc(r.title)}</h3>
          <p>${esc(r.text)}</p>
          ${r.image ? `<img src="${esc(r.image)}" alt="Документ к отчёту «${esc(r.title)}»" loading="lazy">` : ""}
        </article>`)
      .join("");
    observeReveal(box);
  });

  /* ---------- Контакты ---------- */
  $$("[data-contacts]").forEach((box) => {
    const c = S.contacts || {};
    const cards = [];
    if (c.phone) cards.push({
      ico: ICO.phone, label: esc(c.phoneHuman || "Телефон"),
      val: esc(c.phone), href: "tel:" + esc(c.phone).replace(/[^+\d]/g, ""),
    });
    if (c.telegram) cards.push({ ico: ICO.tg, label: "Telegram", val: "Написать в Telegram", href: esc(c.telegram) });
    if (c.whatsapp) cards.push({ ico: ICO.wa, label: "WhatsApp", val: "Написать в WhatsApp", href: esc(c.whatsapp) });
    if (c.email) cards.push({ ico: ICO.mail, label: "Почта", val: esc(c.email), href: "mailto:" + esc(c.email) });
    box.innerHTML = cards
      .map((k) => `
        <a class="contact-card" href="${k.href}" ${k.href.startsWith("http") ? 'target="_blank" rel="noopener"' : ""}>
          <span class="card-ico">${k.ico}</span>
          <span><b>${k.label}</b><span>${k.val}</span></span>
        </a>`)
      .join("");
    const hours = S.contacts && S.contacts.hours;
    if (hours) {
      const p = document.createElement("p");
      p.className = "text-center mt-3";
      p.style.color = "var(--muted)";
      p.textContent = hours;
      box.after(p);
    }
  });

  /* ---------- Кнопка «Поделиться» ---------- */
  const shareUrl = (S.site && S.site.url) || location.href;
  const shareText = "Помогите " + ((S.child && S.child.nameDative) || "ребёнку") + " победить болезнь. Каждый перевод важен:";
  $$("[data-share]").forEach((box) => {
    const u = encodeURIComponent(shareUrl);
    const t = encodeURIComponent(shareText);
    const btns = [
      { label: "Telegram", href: `https://t.me/share/url?url=${u}&text=${t}`, ico: ICO.tg },
      { label: "WhatsApp", href: `https://wa.me/?text=${t}%20${u}`, ico: ICO.wa },
      { label: "ВКонтакте", href: `https://vk.com/share.php?url=${u}&title=${t}`, ico: ICO.vk },
    ];
    box.innerHTML =
      btns.map((b) => `
        <a class="share-btn" href="${b.href}" target="_blank" rel="noopener">${b.ico} ${b.label}</a>`)
      .join("") +
      `<button class="share-btn" type="button" data-copy="${esc(shareUrl)}">${ICO.heart.replace('class=""', "")} Копировать ссылку</button>`;
  });

  /* ---------- Копирование ---------- */
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-copy]");
    if (!btn) return;
    const text = btn.getAttribute("data-copy");
    copyText(text)
      .then(() => {
        btn.classList.add("copied");
        const old = btn.textContent;
        if (btn.classList.contains("copy-btn")) btn.textContent = "Скопировано ✓";
        toast("Скопировано: " + text);
        setTimeout(() => { btn.classList.remove("copied"); if (btn.classList.contains("copy-btn")) btn.textContent = old; }, 1600);
      })
      .catch(() => {
        window.prompt("Скопируйте вручную (Ctrl+C):", text);
      });
  });

  /* ---------- Модальное окно пожертвования ---------- */
  function copyField(label, value) {
    if (!value) return "";
    return `
      <div class="copy-field">
        <code>${esc(value)}</code>
        <button class="copy-btn" type="button" data-copy="${esc(value)}">Скопировать</button>
      </div>
      <div class="qr-hint" style="text-align:left;margin:-4px 0 12px;">${esc(label)}</div>`;
  }

  function buildModal() {
    const d = (S.donate || {});
    const name = (S.child && S.child.name) || "";
    const panels = [];

    if (d.sbp && d.sbp.enabled) {
      panels.push(`
        <div class="tab-panel ${panels.length === 0 ? "active" : ""}" data-panel="sbp">
          <div class="qr-wrap">
            ${d.sbp.qrImage ? `<img src="${esc(d.sbp.qrImage)}" alt="QR-код для перевода по СБП" width="250" height="250">` : ""}
            ${d.sbp.link ? `<a class="btn btn-secondary btn-block" href="${esc(d.sbp.link)}" target="_blank" rel="noopener">${ICO.qr} Оплатить по ссылке СБП</a>` : ""}
            <p class="qr-hint">${esc(d.sbp.hint || "")}</p>
          </div>
        </div>`);
    }
    if (d.card && d.card.enabled) {
      panels.push(`
        <div class="tab-panel" data-panel="card">
          ${copyField("Номер карты " + esc(d.card.bank || ""), d.card.number)}
          ${copyField("Телефон для перевода по СБП (в приложении банка)", d.card.phone)}
          <p class="qr-hint">Получатель: <b>${esc(d.card.holder || "")}</b>${d.card.bank ? ", банк «" + esc(d.card.bank) + "»" : ""}. Перевод по номеру карты или по СБП по телефону.</p>
        </div>`);
    }
    if (d.requisites && d.requisites.enabled) {
      const r = d.requisites;
      panels.push(`
        <div class="tab-panel" data-panel="req">
          <div class="req-rows">
            ${copyField("Получатель", r.receiver)}
            ${copyField("Номер счёта", r.account)}
            ${copyField("Банк", r.bank)}
            ${copyField("БИК", r.bik)}
            ${copyField("ИНН получателя", r.inn)}
            ${copyField("Назначение платежа", r.purpose)}
          </div>
        </div>`);
    }
    if (d.yumoney && d.yumoney.enabled && d.yumoney.link) {
      panels.push(`
        <div class="tab-panel" data-panel="yumoney">
          <div class="qr-wrap">
            <p class="qr-hint">Оплата картой любого банка через ЮMoney — с чеком и защитой платежа.</p>
            <a class="btn btn-secondary btn-block" href="${esc(d.yumoney.link)}" target="_blank" rel="noopener">${ICO.wallet} Открыть ЮMoney</a>
          </div>
        </div>`);
    }

    const tabs = panels.map((p, i) => {
      const key = p.match(/data-panel="([^"]+)"/)[1];
      const labels = { sbp: "СБП · QR", card: "На карту", req: "По реквизитам", yumoney: "ЮMoney" };
      return `<button class="tab ${i === 0 ? "active" : ""}" type="button" data-tab="${key}">${labels[key] || key}</button>`;
    });

    const modal = document.createElement("div");
    modal.className = "modal";
    modal.id = "donate-modal";
    modal.hidden = true;
    modal.innerHTML = `
      <div class="modal-backdrop" data-modal-close></div>
      <div class="modal-card" role="dialog" aria-modal="true" aria-label="Сделать пожертвование">
        <button class="modal-close" type="button" data-modal-close aria-label="Закрыть">×</button>
        <h3 class="mb-0">Сделать пожертвование</h3>
        <p class="modal-sub">Выберите удобный способ — ваш перевод пойдёт на лечение ${esc((S.child && (S.child.nameGenitive || S.child.name)) || "ребёнка")}.</p>
        ${tabs.length > 1 ? `<div class="tabs" role="tablist">${tabs.join("")}</div>` : ""}
        ${panels.join("")}
        ${d.note ? `<div class="pay-note">${esc(d.note)}</div>` : ""}
        <div class="text-center mt-2">
          <a href="thanks.html">Я перевёл(а) — спасибо! →</a>
        </div>
      </div>`;
    document.body.appendChild(modal);

    modal.addEventListener("click", (e) => {
      const tab = e.target.closest("[data-tab]");
      if (tab) {
        $$(".tab", modal).forEach((t) => t.classList.toggle("active", t === tab));
        $$(".tab-panel", modal).forEach((p) => p.classList.toggle("active", p.getAttribute("data-panel") === tab.getAttribute("data-tab")));
        return;
      }
      if (e.target.closest("[data-modal-close]")) close();
    });

    return modal;
  }

  let modal = null;
  function openModal() {
    if (!modal) modal = buildModal();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    const c = $(".modal-close", modal);
    if (c) c.focus();
  }
  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = "";
  }
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-donate-open]")) {
      e.preventDefault();
      openModal();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  /* ---------- Подвал: юридический блок ---------- */
  $$("[data-legal-organizer]").forEach((el) => (el.textContent = (S.legal && S.legal.organizer) || ""));
  $$("[data-legal-status]").forEach((el) => (el.textContent = (S.legal && S.legal.status) || ""));
  $$("[data-legal-extra]").forEach((el) => (el.textContent = (S.legal && S.legal.extra) || ""));
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------- Появление при прокрутке ---------- */
  function observeReveal(root) {
    const els = $$(".reveal", root || document);
    if (!("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
  }
  observeReveal(document);
})();
