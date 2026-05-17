const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const magneticTargets = document.querySelectorAll(".magnetic");
const hero = document.querySelector(".hero");
const navLinks = document.querySelectorAll(".nav-pill a");
const revealTargets = document.querySelectorAll("[data-reveal]");
const leadForm = document.querySelector(".lead-form");
const routeCardGroups = document.querySelectorAll("[data-route-cards]");

magneticTargets.forEach((target) => {
  target.addEventListener("pointermove", (event) => {
    if (prefersReducedMotion.matches) return;

    const rect = target.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;

    target.style.setProperty("--mx", `${x * 0.08}px`);
    target.style.setProperty("--my", `${y * 0.1}px`);
  });

  target.addEventListener("pointerleave", () => {
    target.style.setProperty("--mx", "0px");
    target.style.setProperty("--my", "0px");
  });
});

if (hero) {
  let heroScrollFrame = 0;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const resetHeroMotion = () => {
    hero.style.setProperty("--hero-scale", "1.01");
    hero.style.setProperty("--hero-content-y", "0px");
    hero.style.setProperty("--hero-content-opacity", "1");
  };

  const syncHeroMotion = () => {
    heroScrollFrame = 0;

    if (prefersReducedMotion.matches) {
      resetHeroMotion();
      return;
    }

    const heroHeight = Math.max(hero.offsetHeight, window.innerHeight || 1);
    const progress = clamp(window.scrollY / (heroHeight * 0.78), 0, 1);
    const easedProgress = 1 - Math.pow(1 - progress, 3);

    hero.style.setProperty("--hero-scale", (1.01 + easedProgress * 0.014).toFixed(4));
    hero.style.setProperty("--hero-content-y", `${(easedProgress * -12).toFixed(2)}px`);
    hero.style.setProperty("--hero-content-opacity", (1 - easedProgress * 0.12).toFixed(3));
  };

  const requestHeroMotionSync = () => {
    if (heroScrollFrame) return;
    heroScrollFrame = window.requestAnimationFrame(syncHeroMotion);
  };

  syncHeroMotion();
  window.addEventListener("scroll", requestHeroMotionSync, { passive: true });
  window.addEventListener("resize", requestHeroMotionSync);
}

if (revealTargets.length) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
  );

  revealTargets.forEach((target) => revealObserver.observe(target));
}

if (navLinks.length) {
  const sectionMap = Array.from(navLinks)
    .map((link) => {
      const id = link.getAttribute("href");
      if (!id || !id.startsWith("#")) return null;
      const section = document.querySelector(id);
      return section ? { link, section } : null;
    })
    .filter(Boolean);

  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => link.classList.remove("is-active"));
        const active = sectionMap.find((item) => item.section === entry.target);
        if (active) active.link.classList.add("is-active");
      });
    },
    { rootMargin: "-42% 0px -48% 0px", threshold: 0.01 }
  );

  sectionMap.forEach(({ section }) => navObserver.observe(section));
}

routeCardGroups.forEach((group) => {
  const items = Array.from(group.querySelectorAll("[data-route-item]"));
  let activeIndex = Number(group.dataset.active || 0);

  const setActiveRoute = (nextIndex) => {
    activeIndex = Math.min(Math.max(nextIndex, 0), items.length - 1);
    group.dataset.active = String(activeIndex);

    items.forEach((item, index) => {
      item.classList.toggle("is-active", index === activeIndex);
    });
  };

  items.forEach((item, index) => {
    item.addEventListener("focusin", () => setActiveRoute(index));
    item.addEventListener("pointerenter", () => {
      if (!window.matchMedia("(hover: hover)").matches) return;
      setActiveRoute(index);
    });
  });

  group.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

    event.preventDefault();
    const direction = event.key === "ArrowDown" ? 1 : -1;
    const nextIndex = (activeIndex + direction + items.length) % items.length;
    items[nextIndex]?.focus();
  });

  setActiveRoute(activeIndex);
});

if (leadForm) {
  const status = leadForm.querySelector(".form-status");
  const submitButton = leadForm.querySelector("button[type='submit']");
  const contactField = leadForm.elements.phone;

  const normalizeContactValue = (value) => {
    const contact = String(value || "").trimStart();
    if (!contact) return "";

    if (contact.startsWith("@")) return contact;
    if (/^\p{L}/u.test(contact)) return `@${contact}`;

    if (contact.startsWith("+")) {
      const rest = contact.slice(1);
      if (!rest || rest.startsWith("7")) return `+7${rest.slice(1)}`;
      if (rest.startsWith("8")) return `+7${rest.slice(1)}`;
      return `+7${rest}`;
    }

    if (/^\d/.test(contact)) {
      if (contact.startsWith("7") || contact.startsWith("8")) return `+7${contact.slice(1)}`;
      return `+7${contact}`;
    }

    return contact;
  };

  if (contactField) {
    contactField.addEventListener("input", () => {
      const normalized = normalizeContactValue(contactField.value);
      if (normalized === contactField.value) return;

      contactField.value = normalized;
      contactField.setSelectionRange(normalized.length, normalized.length);
    });
  }

  const setStatus = (message, type) => {
    status.textContent = message;
    status.className = `form-status form-status--${type}`;
  };

  const setFieldError = (fieldName, message) => {
    const error = leadForm.querySelector(`[data-error-for="${fieldName}"]`);
    const field = leadForm.elements[fieldName];
    if (!error || !field) return;

    error.textContent = message;
    field.closest("label").classList.toggle("has-error", Boolean(message));
  };

  const buildWhatsAppLink = (data) => {
    const lines = [
      "Здравствуйте! Хочу выбрать джип-тур по Северной Осетии.",
      `Имя: ${data.name}`,
      `Контакт: ${data.phone}`,
      `Маршрут: ${data.route}`,
    ];

    if (data.message) {
      lines.push(`Комментарий: ${data.message}`);
    }

    return `https://wa.me/79891321887?text=${encodeURIComponent(lines.join("\n"))}`;
  };

  leadForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (contactField) {
      contactField.value = normalizeContactValue(contactField.value);
    }

    const formData = new FormData(leadForm);
    const data = {
      name: String(formData.get("name") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      route: String(formData.get("route") || "Нужен подбор"),
      message: String(formData.get("message") || "").trim(),
    };

    setFieldError("name", "");
    setFieldError("phone", "");

    let hasError = false;

    if (data.name.length < 2) {
      setFieldError("name", "Укажите имя, чтобы мы знали, как к вам обратиться.");
      hasError = true;
    }

    if (data.phone.length < 5) {
      setFieldError("phone", "Оставьте телефон или ник в мессенджере.");
      hasError = true;
    }

    if (hasError) {
      setStatus("Проверьте поля с подсказками ниже.", "error");
      return;
    }

    setStatus("Готовим сообщение для WhatsApp...", "loading");
    submitButton.disabled = true;

    window.setTimeout(() => {
      const url = buildWhatsAppLink(data);
      setStatus("Заявка готова. Сейчас откроется WhatsApp с подготовленным сообщением.", "success");
      submitButton.disabled = false;
      window.open(url, "_blank", "noopener,noreferrer");
    }, 520);
  });
}
