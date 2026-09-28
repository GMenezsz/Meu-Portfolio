document.addEventListener("DOMContentLoaded", () => {

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ==========================================================
    // 0.0 HELPERS DE DIGITAÇÃO (compartilhados pela intro do
    //     card de perfil E pela troca de tema)
    // ==========================================================
    function typeText(el, text, speed, onDone) {
        let i = 0;
        (function step() {
            if (i <= text.length) {
                el.textContent = text.slice(0, i);
                i += 1;
                setTimeout(step, speed);
            } else if (onDone) {
                onDone();
            }
        })();
    }

    function eraseText(el, speed, onDone) {
        let text = el.textContent;
        let i = text.length;
        (function step() {
            if (i >= 0) {
                el.textContent = text.slice(0, i);
                i -= 1;
                setTimeout(step, speed);
            } else if (onDone) {
                onDone();
            }
        })();
    }

    // ==========================================================
    // 0. INTRO DO CARD DE PERFIL: digitação do nome/cargo e
    //    descriptografia do status
    // ==========================================================
    // Ordem:
    //   1) o nome "Gabriel Menezes" começa a ser digitado;
    //   2) 1s depois de o nome ter começado, "Desenvolvedor Backend"
    //      também começa a digitar (em paralelo);
    //   3) assim que o nome termina de digitar, o texto de status
    //      ("Disponível para novos projetos") roda uma animação de
    //      descriptografia (letra por letra, com caracteres aleatórios).
    // O restante do card de perfil (avatar, bio, contatos, formação e
    // botões) já fica visível desde o carregamento da página, sem
    // esperar nenhuma animação terminar. O header (logo e menu) também
    // fica normal o tempo todo, sem nenhuma animação de texto.
    function runHeroIntro() {
        const nameEl = document.querySelector(".hero-name");
        const roleEl = document.querySelector(".hero-role");
        const statusTextEl = document.querySelector(".hero-status-text");

        // Esta introdução só existe na página com o card de perfil.
        if (!nameEl || !roleEl || !statusTextEl) return;

        const nameText = nameEl.textContent.trim();
        const roleText = roleEl.textContent.trim();
        const statusText = statusTextEl.textContent.trim();

        if (prefersReducedMotion) {
            nameEl.textContent = nameText;
            roleEl.textContent = roleText;
            statusTextEl.textContent = statusText;
            return;
        }

        nameEl.textContent = "";
        roleEl.textContent = "";
        nameEl.classList.add("typing-caret");
        roleEl.classList.add("typing-caret");

        const DECRYPT_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*";

        function scrambled(text, revealedCount) {
            let output = "";
            for (let idx = 0; idx < text.length; idx += 1) {
                if (text[idx] === " " || idx < revealedCount) {
                    output += text[idx];
                } else {
                    output += DECRYPT_CHARS[Math.floor(Math.random() * DECRYPT_CHARS.length)];
                }
            }
            return output;
        }

        // Embaralha o status DESDE JÁ, antes mesmo de o nome terminar de
        // digitar, para o texto real nunca ficar exposto antes da hora.
        let idleScramble = setInterval(() => {
            statusTextEl.textContent = scrambled(statusText, 0);
        }, 55);

        function decryptStatus(onDone) {
            clearInterval(idleScramble);
            const revealStep = 45; // ms até revelar cada letra correta
            let revealedCount = 0;

            const scrambleInterval = setInterval(() => {
                statusTextEl.textContent = scrambled(statusText, revealedCount);
            }, 35);

            const revealTimer = setInterval(() => {
                revealedCount += 1;
                if (revealedCount > statusText.length) {
                    clearInterval(revealTimer);
                    clearInterval(scrambleInterval);
                    statusTextEl.textContent = statusText;
                    if (onDone) onDone();
                }
            }, revealStep);
        }

        // 1) nome começa a digitar imediatamente
        typeText(nameEl, nameText, 70, () => {
            nameEl.classList.remove("typing-caret");

            // 3) nome terminou -> começa a descriptografia do status
            decryptStatus();
        });

        // 2) cargo começa a digitar 1s depois do nome ter iniciado
        setTimeout(() => {
            typeText(roleEl, roleText, 60, () => {
                roleEl.classList.remove("typing-caret");
            });
        }, 1000);
    }

    runHeroIntro();

    // A revelação por rolagem roda desde já — nada no restante da
    // página fica travado esperando a introdução do card.
    setupReveal();

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
            return "dark"; // tema padrão do site, até o usuário escolher outro
        }

        applyTheme(getPreferredTheme());

        // Ao trocar de tema, o logo "GMenezs" e o nome "Gabriel Menezes"
        // (quando existir na página) apagam e são redigitados — o tema
        // só é efetivamente trocado depois que os dois já apagaram, para
        // que a redigitação já saia na cor certa: preta/sólida no tema
        // claro, com o degradê roxo do tema escuro no tema escuro.
        let isSwitching = false;

        function switchThemeWithEffect(nextTheme) {
            const targets = [document.querySelector(".logo"), document.querySelector(".hero-name")]
                .filter(Boolean);

            if (!targets.length || prefersReducedMotion) {
                applyTheme(nextTheme);
                localStorage.setItem(STORAGE_KEY, nextTheme);
                return;
            }

            isSwitching = true;
            const originals = targets.map((el) => el.textContent);
            let pendingErase = targets.length;

            targets.forEach((el) => el.classList.add("typing-caret"));

            targets.forEach((el) => {
                eraseText(el, 30, () => {
                    pendingErase -= 1;
                    if (pendingErase === 0) {
                        // Todos apagados: agora sim troca o tema, então a
                        // redigitação abaixo já nasce com a cor/degradê certos.
                        applyTheme(nextTheme);
                        localStorage.setItem(STORAGE_KEY, nextTheme);

                        let pendingType = targets.length;
                        targets.forEach((el2, idx) => {
                            typeText(el2, originals[idx], 55, () => {
                                el2.classList.remove("typing-caret");
                                pendingType -= 1;
                                if (pendingType === 0) isSwitching = false;
                            });
                        });
                    }
                });
            });
        }

        if (toggleBtn) {
            toggleBtn.addEventListener("click", () => {
                if (isSwitching) return;
                const current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
                const next = current === "dark" ? "light" : "dark";
                switchThemeWithEffect(next);
            });
        }
    })();

    // ==========================================================
    // 2. ENTRADA SUAVE DOS ELEMENTOS (fade-in ao rolar)
    // ==========================================================
    function setupReveal() {
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
    }

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
    // 3.2 COPIAR EMAIL
    // ==========================================================
    (function setupCopyEmail() {
        const buttons = document.querySelectorAll("[data-copy-email]");
        if (!buttons.length) return;

        function fallbackCopy(text) {
            try {
                const textarea = document.createElement("textarea");
                textarea.value = text;
                textarea.style.position = "fixed";
                textarea.style.opacity = "0";
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand("copy");
                document.body.removeChild(textarea);
                return true;
            } catch (e) {
                return false;
            }
        }

        buttons.forEach((btn) => {
            const tooltip = btn.querySelector(".copy-email-tooltip");
            const originalTooltipText = tooltip ? tooltip.textContent : null;
            let resetTimer = null;

            function showCopied() {
                btn.classList.add("is-copied");
                if (tooltip) tooltip.textContent = "Copiado!";
                if (resetTimer) clearTimeout(resetTimer);
                resetTimer = setTimeout(() => {
                    btn.classList.remove("is-copied");
                    if (tooltip && originalTooltipText) tooltip.textContent = originalTooltipText;
                }, 1800);
            }

            btn.addEventListener("click", () => {
                const email = btn.getAttribute("data-copy-email");
                if (!email) return;

                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard
                        .writeText(email)
                        .then(showCopied)
                        .catch(() => {
                            if (fallbackCopy(email)) showCopied();
                        });
                } else if (fallbackCopy(email)) {
                    showCopied();
                }
            });
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

    // ==========================================================
    // 6. FILTRO DE PROJETOS (página "Todos os projetos")
    // ==========================================================
    (function initProjectFilter() {
        const toggle = document.getElementById("filter-toggle");
        const menu = document.getElementById("filter-menu");
        const label = document.getElementById("filter-label");
        const items = document.querySelectorAll(".showcase-item[data-category]");
        if (!toggle || !menu || !label) return;

        const options = Array.from(menu.querySelectorAll(".filter-option"));

        function openMenu() {
            menu.hidden = false;
            toggle.setAttribute("aria-expanded", "true");
        }

        function closeMenu() {
            menu.hidden = true;
            toggle.setAttribute("aria-expanded", "false");
        }

        function applyFilter(value) {
            items.forEach((item) => {
                const show = value === "all" || item.dataset.category === value;
                item.hidden = !show;
                item.classList.remove("is-entering");
                if (show && !prefersReducedMotion) {
                    // reinicia a animação de entrada do card
                    void item.offsetWidth;
                    item.classList.add("is-entering");
                }
            });
        }

        toggle.addEventListener("click", () => {
            if (menu.hidden) openMenu();
            else closeMenu();
        });

        options.forEach((opt) => {
            opt.addEventListener("click", () => {
                options.forEach((o) => {
                    const active = o === opt;
                    o.classList.toggle("is-active", active);
                    o.setAttribute("aria-checked", active ? "true" : "false");
                });
                label.textContent = opt.querySelector("span").textContent;
                applyFilter(opt.dataset.filter);
                closeMenu();
                toggle.focus();
            });
        });

        document.addEventListener("click", (e) => {
            if (!menu.hidden && !e.target.closest("#project-filter")) closeMenu();
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && !menu.hidden) {
                closeMenu();
                toggle.focus();
            }
        });
    })();
});
