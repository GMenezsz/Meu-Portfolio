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

        // Abre uma ÚNICA aba nova, própria, mostrando o PDF (a aba do
        // portfólio nunca é tocada, fica exatamente como estava). Assim que
        // essa aba nova termina de carregar, o download é disparado
        // automaticamente dentro dela — clicou, abriu, baixou, sem precisar
        // clicar em nenhum botão extra.
        modal.querySelectorAll(".cv-option[data-cv-file]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const relativeUrl = btn.getAttribute("data-cv-file");
                const filename = btn.getAttribute("data-cv-name") || "";
                if (!relativeUrl) return;

                const absoluteUrl = new URL(relativeUrl, window.location.href).href;
                // IMPORTANTE: NÃO usar "noopener" aqui — quando "noopener" é
                // passado, o navegador retorna null em window.open() (é o
                // comportamento padrão da especificação), então perdemos a
                // referência da aba nova e nada mais funciona depois disso.
                // Em vez disso, pegamos a referência normalmente e zeramos
                // newTab.opener manualmente logo abaixo, o que dá a mesma
                // proteção de segurança sem perder o controle da aba.
                const newTab = window.open("", "_blank");

                if (newTab) {
                    newTab.opener = null;
                    newTab.document.title = filename || "Currículo";

                    const style = newTab.document.createElement("style");
                    style.textContent = "html,body{margin:0;height:100%;background:#525659;}iframe{display:block;width:100%;height:100%;border:0;}";
                    newTab.document.head.appendChild(style);

                    const iframe = newTab.document.createElement("iframe");
                    iframe.src = absoluteUrl;
                    newTab.document.body.appendChild(iframe);

                    let downloaded = false;
                    const runDownload = () => {
                        if (downloaded) return;
                        downloaded = true;
                        try {
                            // Método principal: baixa o PDF como blob dentro da
                            // própria aba nova e força o "Salvar como" — funciona
                            // mesmo que o navegador tente apenas exibir o PDF.
                            newTab.fetch(absoluteUrl)
                                .then((res) => res.blob())
                                .then((blob) => {
                                    const blobUrl = newTab.URL.createObjectURL(blob);
                                    const link = newTab.document.createElement("a");
                                    link.href = blobUrl;
                                    link.download = filename || "curriculo.pdf";
                                    newTab.document.body.appendChild(link);
                                    link.click();
                                    link.remove();
                                    setTimeout(() => newTab.URL.revokeObjectURL(blobUrl), 4000);
                                })
                                .catch(() => {
                                    // Fallback (ex.: rodando localmente via file://,
                                    // onde fetch entre arquivos é bloqueado pelo navegador).
                                    const link = newTab.document.createElement("a");
                                    link.href = absoluteUrl;
                                    link.download = filename || "curriculo.pdf";
                                    newTab.document.body.appendChild(link);
                                    link.click();
                                    link.remove();
                                });
                        } catch (e) {
                            // Aba pode ter sido fechada pelo usuário antes da hora; ignora.
                        }
                    };

                    iframe.addEventListener("load", runDownload, { once: true });
                    // Garante o download mesmo se o evento "load" do iframe
                    // não disparar (ex.: o próprio visualizador de PDF do navegador).
                    setTimeout(runDownload, 900);
                }

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
