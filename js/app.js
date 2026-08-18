(() => {
  "use strict";

  const body = document.body;
  const card = document.getElementById("card");
  const toast = document.getElementById("toast");
  const packageViewer = document.getElementById("packageViewer");
  const packageViewerImage = document.getElementById("packageViewerImage");
  const packageViewerTitle = document.getElementById("packageViewerTitle");
  const packageViewerLabel = document.getElementById("packageViewerLabel");
  let activeModal = null;
  let lastFocused = null;
  let lastPackageButton = null;
  let toastTimer = null;

  const showToast = (message) => {
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("show");
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2700);
  };

  const focusableElements = (modal) => [...modal.querySelectorAll(
    'a[href], button:not([disabled]), details summary, [tabindex]:not([tabindex="-1"])'
  )].filter((element) => !element.hidden && element.offsetParent !== null);

  const openModal = (modal) => {
    if (!modal) return;
    lastFocused = document.activeElement;
    activeModal = modal;
    modal.setAttribute("aria-hidden", "false");
    body.classList.add("modal-open");
    if (card) {
      card.setAttribute("aria-hidden", "true");
      if ("inert" in card) card.inert = true;
    }
    window.requestAnimationFrame(() => modal.querySelector(".modal-sheet")?.focus());
  };

  const closeModal = () => {
    if (!activeModal) return;
    activeModal.setAttribute("aria-hidden", "true");
    body.classList.remove("modal-open");
    if (card) {
      card.removeAttribute("aria-hidden");
      if ("inert" in card) card.inert = false;
    }
    const focusTarget = lastFocused;
    activeModal = null;
    window.setTimeout(() => focusTarget?.focus?.(), 30);
  };

  const trapModalFocus = (event) => {
    if (event.key !== "Tab") return;
    const focusScope = packageViewer?.getAttribute("aria-hidden") === "false" ? packageViewer : activeModal;
    if (!focusScope) return;
    const focusables = focusableElements(focusScope);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const openPackageViewer = (button) => {
    if (!packageViewer || !packageViewerImage || !packageViewerTitle) return;
    lastPackageButton = button;
    const title = button.dataset.packageTitle || "تفاصيل الباقة";
    if (packageViewerLabel) packageViewerLabel.textContent = button.dataset.viewerLabel || "تفاصيل الباقة كاملة";
    packageViewerTitle.textContent = title;
    packageViewerImage.src = button.dataset.packageImage;
    packageViewerImage.alt = `${title} — التفاصيل كاملة`;
    packageViewer.setAttribute("aria-hidden", "false");
    body.classList.add("package-viewer-open");
    window.requestAnimationFrame(() => packageViewer.querySelector(".package-viewer-frame")?.focus());
  };

  const closePackageViewer = () => {
    if (!packageViewer || packageViewer.getAttribute("aria-hidden") !== "false") return;
    packageViewer.setAttribute("aria-hidden", "true");
    body.classList.remove("package-viewer-open");
    const focusTarget = lastPackageButton;
    window.setTimeout(() => {
      if (packageViewer.getAttribute("aria-hidden") === "true" && packageViewerImage) {
        packageViewerImage.removeAttribute("src");
      }
      focusTarget?.focus?.();
    }, 180);
  };

  const setupPackageViewer = () => {
    document.querySelectorAll("[data-package-image]").forEach((button) => {
      button.addEventListener("click", () => openPackageViewer(button));
    });
    document.querySelectorAll("[data-package-viewer-close]").forEach((button) => {
      button.addEventListener("click", closePackageViewer);
    });
  };

  const addRipple = (event) => {
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.left = `${event.clientX - rect.left}px`;
    ripple.style.top = `${event.clientY - rect.top}px`;
    target.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
  };

  const setupPackageTabs = () => {
    const tabs = [...document.querySelectorAll("[data-package-tab]")];
    const panels = [...document.querySelectorAll("[data-package-panel]")];

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const target = tab.dataset.packageTab;
        tabs.forEach((item) => {
          const selected = item === tab;
          item.classList.toggle("active", selected);
          item.setAttribute("aria-selected", String(selected));
        });
        panels.forEach((panel) => {
          const selected = panel.dataset.packagePanel === target;
          panel.classList.toggle("active", selected);
          panel.hidden = !selected;
        });
      });
    });
  };

  const setupShare = () => {
    document.getElementById("shareCard")?.addEventListener("click", async () => {
      const shareData = {
        title: "استوديو الأمير للتصوير",
        text: "تصوير احترافي، فيديو، بث مباشر ودرون في جميع مناطق سلطنة عُمان.",
        url: window.location.href
      };

      try {
        if (navigator.share) {
          await navigator.share(shareData);
        } else if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(window.location.href);
          showToast("تم نسخ رابط البطاقة");
        } else {
          showToast("انسخ الرابط من شريط المتصفح");
        }
      } catch (error) {
        if (error?.name !== "AbortError") showToast("تعذرت المشاركة حاليًا");
      }
    });
  };

  const init = () => {
    setupPackageTabs();
    setupPackageViewer();
    setupShare();

    document.querySelectorAll("[data-modal-open]").forEach((button) => {
      button.addEventListener("click", () => openModal(document.getElementById(button.dataset.modalOpen)));
    });
    document.querySelectorAll("[data-modal-close]").forEach((button) => {
      button.addEventListener("click", closeModal);
    });
    document.querySelectorAll(".action-card").forEach((action) => {
      action.addEventListener("pointerdown", addRipple);
    });
    document.querySelector(".save-contact")?.addEventListener("click", () => {
      window.setTimeout(() => showToast("تم تجهيز جهة الاتصال للحفظ"), 120);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        if (packageViewer?.getAttribute("aria-hidden") === "false") closePackageViewer();
        else closeModal();
      }
      trapModalFocus(event);
    });
    const year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => body.classList.add("loaded"));
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
