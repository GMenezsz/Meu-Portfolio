document.addEventListener("DOMContentLoaded", () => {

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ==========================================================
    // 1. TEMA CLARO / ESCURO
    // ==========================================================
    (function setupTheme() {
        const root = document.documentElement;
        const toggleBtn = document.getElementById("theme-toggle-btn");
        const STORAGE_KEY = "gm-theme";

        function applyTheme(theme) {
            root.setAttribute("data-theme", theme);
        }

        function getPreferredTheme() {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved === "light" || saved === "dark") return saved;
            return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }

        applyTheme(getPreferredTheme());

        if (toggleBtn) {
            toggleBtn.addEventListener("click", () => {
                const current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
                const next = current === "dark" ? "light" : "dark";
                applyTheme(next);
                localStorage.setItem(STORAGE_KEY, next);
            });
        }

        const media = window.matchMedia("(prefers-color-scheme: dark)");
        media.addEventListener?.("change", (e) => {
            if (!localStorage.getItem(STORAGE_KEY)) {
                applyTheme(e.matches ? "dark" : "light");
            }
        });
    })();

    // ==========================================================
    // 2. ENTRADA SUAVE DOS ELEMENTOS (fade-in ao rolar)
    // ==========================================================
    (function setupReveal() {
        const items = document.querySelectorAll(".reveal");
        if (!items.length) return;

        if (prefersReducedMotion || !("IntersectionObserver" in window)) {
            items.forEach((el) => el.classList.add("in-view"));
            return;
        }

        const observer = new IntersectionObserver(
            (entries, obs) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("in-view");
                        obs.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
        );

        items.forEach((el) => observer.observe(el));
    })();

    // ==========================================================
    // 3. MODAL: ESCOLHA DE CURRÍCULO
    // ==========================================================
    (function setupCvModal() {
        const openBtns = document.querySelectorAll("[data-cv-open]");
        const modal = document.getElementById("cv-modal");
        if (!openBtns.length || !modal) return;

        let lastFocused = null;

        function openModal() {
            lastFocused = document.activeElement;
            modal.hidden = false;
            document.addEventListener("keydown", onKeydown);
        }

        function closeModal() {
            modal.hidden = true;
            document.removeEventListener("keydown", onKeydown);
            if (lastFocused) lastFocused.focus();
        }

        function onKeydown(e) {
            if (e.key === "Escape") closeModal();
        }

        openBtns.forEach((btn) => btn.addEventListener("click", openModal));
        modal.querySelectorAll("[data-cv-close]").forEach((el) => {
            el.addEventListener("click", closeModal);
        });

        // Para cada opção de currículo: abre o PDF numa aba nova de verdade
        // (a aba do portfólio não é tocada) E dispara o download, ao mesmo
        // tempo — usando dois links <a> reais clicados via JS. Cliques em
        // links reais praticamente nunca são bloqueados por bloqueador de
        // pop-up (diferente de window.open(), que vimos ser bloqueado
        // silenciosamente em alguns navegadores como o Firefox).
        const cvOptionBtns = modal.querySelectorAll(".cv-option[data-cv-file]");
        cvOptionBtns.forEach((btn) => {
            btn.addEventListener("click", () => {
                const relativeUrl = btn.getAttribute("data-cv-file");
                const filename = btn.getAttribute("data-cv-name") || "curriculo.pdf";
                if (!relativeUrl) return;

                const absoluteUrl = new URL(relativeUrl, window.location.href).href;

                // 1) Abre o PDF numa aba nova (a aba do portfólio continua
                // exatamente como estava).
                const viewLink = document.createElement("a");
                viewLink.href = absoluteUrl;
                viewLink.target = "_blank";
                viewLink.rel = "noopener noreferrer";
                document.body.appendChild(viewLink);
                viewLink.click();
                viewLink.remove();

                // 2) Dispara o download automaticamente, na hora, sem
                // precisar clicar em nenhum botão extra.
                const downloadLink = document.createElement("a");
                downloadLink.href = absoluteUrl;
                downloadLink.download = filename;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                downloadLink.remove();

                closeModal();
            });
        });
    })();

    // ==========================================================
    // 3.1 MODAL: VISUALIZAÇÃO DO CERTIFICADO
    // ==========================================================
    (function setupCertModal() {
        const openBtns = document.querySelectorAll("[data-cert-open]");
        const modal = document.getElementById("cert-modal");
        const img = document.getElementById("cert-modal-img");
        if (!openBtns.length || !modal || !img) return;

        let lastFocused = null;

        function openModal(src, alt) {
            lastFocused = document.activeElement;
            img.src = src;
            img.alt = alt || "Certificado";
            modal.hidden = false;
            document.body.style.overflow = "hidden";
            document.addEventListener("keydown", onKeydown);
        }

        function closeModal() {
            modal.hidden = true;
            document.body.style.overflow = "";
            document.removeEventListener("keydown", onKeydown);
            if (lastFocused) lastFocused.focus();
        }

        function onKeydown(e) {
            if (e.key === "Escape") closeModal();
        }

        openBtns.forEach((btn) => {
            btn.addEventListener("click", () => {
                openModal(btn.getAttribute("data-cert-open"), btn.getAttribute("data-cert-alt"));
            });
        });

        modal.querySelectorAll("[data-cert-close]").forEach((el) => {
            el.addEventListener("click", closeModal);
        });
    })();

    // ==========================================================
    // 4. NAVEGAÇÃO SUAVE
    // ==========================================================
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener("click", function (e) {
            const targetId = this.getAttribute("href");
            if (targetId === "#") return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: prefersReducedMotion ? "auto" : "smooth",
                    block: "start"
                });
            }
        });
    });

    // ==========================================================
    // 5. DESTAQUE DO LINK ATIVO CONFORME A SEÇÃO VISÍVEL
    // ==========================================================
    const sections = document.querySelectorAll("main.page section[id]");
    const navLinks = document.querySelectorAll(".nav-links a[href^='#']");

    if (sections.length && navLinks.length && "IntersectionObserver" in window) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const id = entry.target.getAttribute("id");
                        navLinks.forEach((link) => {
                            link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
                        });
                    }
                });
            },
            { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
        );
        sections.forEach((section) => observer.observe(section));
    }
});
