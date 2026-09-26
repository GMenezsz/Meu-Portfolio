if (typeof pdfjsLib !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

document.addEventListener("DOMContentLoaded", () => {

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ==========================================================
    // 1. DIGITAÇÃO DO NOME E DO CARGO (dispara assim que a página abre)
    // ==========================================================
    function startTypingSequence(startDelay = 150) {
        return new Promise((resolve) => {
            const nameEl = document.getElementById("typed-name");
            const roleEl = document.getElementById("typed-role");
            const nameCursor = document.getElementById("name-cursor");
            const roleCursor = document.getElementById("role-cursor");

            const nomeTexto = "Gabriel Menezes";
            const roleTexto = "Desenvolvedor Backend";

            if (!nameEl || !roleEl) { resolve(); return; }

            if (prefersReducedMotion) {
                nameEl.textContent = nomeTexto;
                roleEl.textContent = roleTexto;
                resolve();
                return;
            }

            if (roleCursor) roleCursor.style.display = "none";

            let i = 0;
            function digitarNome() {
                if (i <= nomeTexto.length) {
                    nameEl.textContent = nomeTexto.slice(0, i);
                    i++;
                    setTimeout(digitarNome, 55);
                } else {
                    if (nameCursor) nameCursor.style.display = "none";
                    if (roleCursor) roleCursor.style.display = "inline-block";
                    setTimeout(digitarRole, 250);
                }
            }

            let j = 0;
            function digitarRole() {
                if (j <= roleTexto.length) {
                    roleEl.textContent = roleTexto.slice(0, j);
                    j++;
                    setTimeout(digitarRole, 45);
                } else {
                    resolve(); // terminou de digitar
                }
            }

            setTimeout(digitarNome, startDelay);
        });
    }

    // ==========================================================
    // 1.1 EFEITO DE DESCRIPTOGRAFIA (frase toda embaralhada, letra por letra
    //     vai sendo "achada" da esquerda p/ direita; o resto segue rolando)
    // ==========================================================
    function decryptText(el, finalText) {
        return new Promise((resolve) => {
            const glyphs = "!<>-_\\/[]{}=+*^?#%&$@0123456789ABCDEF";
            const rand = () => glyphs[Math.floor(Math.random() * glyphs.length)];
            const letters = Array.from(finalText);
            const total = letters.filter((ch) => ch !== " ").length;

            const HOLD = 700;          // tempo inicial com tudo embaralhado
            const RESOLVE_EVERY = 85;  // ms para "achar" cada letra
            const SCRAMBLE_EVERY = 45; // ms entre cada troca de símbolos

            el.textContent = "";
            const fixedSpan = document.createElement("span");
            const noiseSpan = document.createElement("span");
            noiseSpan.className = "dc-noise";
            el.append(fixedSpan, noiseSpan);

            function render(resolvedCount) {
                let cut = 0, seen = 0;
                while (cut < letters.length && seen < resolvedCount) {
                    if (letters[cut] !== " ") seen++;
                    cut++;
                }
                fixedSpan.textContent = letters.slice(0, cut).join("");
                let noise = "";
                for (let x = cut; x < letters.length; x++) {
                    noise += letters[x] === " " ? " " : rand();
                }
                noiseSpan.textContent = noise;
            }

            const start = performance.now();
            let lastScramble = -Infinity;

            function frame(now) {
                const elapsed = now - start;
                const resolved = Math.max(0, Math.floor((elapsed - HOLD) / RESOLVE_EVERY));

                if (resolved >= total) {
                    fixedSpan.textContent = finalText;
                    noiseSpan.textContent = "";
                    resolve();
                    return;
                }
                if (now - lastScramble >= SCRAMBLE_EVERY) {
                    lastScramble = now;
                    render(resolved);
                }
                requestAnimationFrame(frame);
            }

            render(0);
            requestAnimationFrame(frame);
        });
    }

    // ==========================================================
    // 1.2 ENTRADA ORQUESTRADA DE TODO O CONTEÚDO DO CARD
    //     ordem: card -> perfil -> seções e itens -> digitação do nome/cargo
    //     -> (só no fim de tudo) status descriptografando
    // ==========================================================
    function runEntrance(onDecryptDone) {
        const wait = (ms) => new Promise((r) => setTimeout(r, ms));
        const statusWrap = document.getElementById("hero-status");
        const statusText = document.getElementById("decrypt-status");
        const finalStatus = statusText ? statusText.textContent.trim() : "";

        // sem animações: mostra tudo pronto
        if (prefersReducedMotion) {
            startTypingSequence();
            if (statusWrap) statusWrap.classList.add("is-live");
            return;
        }

        const DUR = 600;
        let loadEnd = 0;
        const mark = (d) => { loadEnd = Math.max(loadEnd, d + DUR); };
        const play = (el, d) => {
            el.style.setProperty("--d", d + "ms");
            el.classList.add("in");
            mark(d);
        };

        // prepara o status: já embaralhado, invisível até a hora dele
        if (statusText && finalStatus) {
            statusText.textContent = "";
            const pre = document.createElement("span");
            pre.className = "dc-noise";
            pre.textContent = finalStatus.replace(/\S/g, "#");
            statusText.appendChild(pre);
        }

        // 0) o card em si
        const card = document.querySelector(".master-card");
        if (card) {
            card.classList.add("arrive");
            play(card, 0);
        }

        // 1) itens do perfil (lateral)
        const heroItems = Array.from(document.querySelectorAll(".profile-sidebar .hero-reveal"));
        heroItems.forEach((el, i) => {
            const d = 250 + i * 90;
            el.style.setProperty("--d", d + "ms");
            mark(d);
        });
        const nameHeroEl = document.querySelector(".hero-name");
        const nameDelay = 250 + Math.max(0, heroItems.indexOf(nameHeroEl)) * 90;

        // 2) seções + itens internos
        const sections = Array.from(document.querySelectorAll(".content-section"));
        const innerOf = (sec) =>
            Array.from(sec.querySelectorAll(
                ".stack-row, .site-card, .project-item, .github-redirect, .about-text > *"
            ));

        const deferred = new Map();
        const vh = window.innerHeight;

        sections.forEach((sec, idx) => {
            const items = innerOf(sec);
            sec.classList.add("arrive");
            items.forEach((it) => it.classList.add("arrive"));

            const reveal = (base, innerStart) => {
                play(sec, base);
                items.forEach((it, k) => play(it, base + innerStart + k * 60));
            };

            // o que já está na tela entra na sequência inicial;
            // o que está abaixo da dobra entra quando for rolado até lá
            if (sec.getBoundingClientRect().top < vh - 40) {
                reveal(450 + idx * 150, 200);
            } else {
                deferred.set(sec, () => reveal(0, 150));
            }
        });

        if (deferred.size) {
            if ("IntersectionObserver" in window) {
                const io = new IntersectionObserver(
                    (entries) => {
                        entries.forEach((en) => {
                            if (en.isIntersecting) {
                                io.unobserve(en.target);
                                deferred.get(en.target)();
                            }
                        });
                    },
                    { threshold: 0.06, rootMargin: "0px 0px -6% 0px" }
                );
                deferred.forEach((_, sec) => io.observe(sec));
            } else {
                deferred.forEach((fn) => fn());
            }
        }

        // remove as classes ao terminar cada animação (devolve o hover normal aos cards)
        document.addEventListener("animationend", (e) => {
            const el = e.target;
            if (e.animationName === "arrive-in" && el.classList.contains("arrive")) {
                el.classList.remove("arrive", "in");
                el.style.removeProperty("--d");
            }
        });

        // 3) digitação do nome e cargo (começa quando o nome aparece)
        const typing = startTypingSequence(nameDelay + 250);

        // 4) só depois de TUDO acima: status descriptografando
        Promise.all([typing, wait(loadEnd)])
            .then(() => wait(350))
            .then(() => {
                if (!statusWrap || !statusText || !finalStatus) return;
                statusWrap.classList.add("is-live");
                return decryptText(statusText, finalStatus);
            })
            // 5) frase pronta -> a chuva de código começa a subir
            .then(() => wait(300))
            .then(() => { if (onDecryptDone) onDecryptDone(); });
    }

    // ==========================================================
    // 2. FUNDO PERSISTENTE: CÓDIGOS SUBINDO (só começa após a descriptografia)
    // ==========================================================
    function startBackgroundMatrix() {
        const inactive = { start() {} };
        if (prefersReducedMotion) return inactive;
        const canvas = document.getElementById("bg-matrix-canvas");
        if (!canvas) return inactive;

        const ctx = canvas.getContext("2d");
        const chars = "アイウエオカキクケコサシスセソタチツテト0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$+-*/=%<>[]{}";
        let w = 0, h = 0, fontSize = 16, columns = 0, drops = [];
        let started = false;   // só vira true quando a descriptografia termina
        let running = false;
        let raf = 0;
        let lastFrame = 0;

        // telas pequenas: letras maiores/menos colunas e menos quadros por segundo (economiza bateria)
        function isSmall() { return window.innerWidth < 700; }
        function colStep() { return isSmall() ? 1.5 : 1; }

        // fromBottom = true: todas as colunas começam ABAIXO da tela e sobem (entrada)
        // fromBottom = false: recomeça espalhado (ex.: girou o celular com o efeito já rodando)
        function setup(fromBottom) {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
            fontSize = isSmall() ? 14 : 16;
            columns = Math.floor(w / (fontSize * colStep()));
            drops = new Array(columns).fill(0).map(() =>
                fromBottom ? h + Math.random() * h * 0.7 : Math.random() * h
            );
            ctx.fillStyle = "rgb(10, 13, 18)";
            ctx.fillRect(0, 0, w, h);
        }
        setup(true);

        // só refaz o canvas quando a LARGURA muda (a barra de endereço do celular
        // altera a altura ao rolar e não deve reiniciar a animação)
        let lastW = window.innerWidth;
        let resizeTimer;
        window.addEventListener("resize", () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (window.innerWidth !== lastW) {
                    lastW = window.innerWidth;
                    setup(!started);
                } else if (window.innerHeight > h) {
                    h = canvas.height = window.innerHeight;
                }
            }, 150);
        });

        function schedule() {
            if (!raf) {
                raf = requestAnimationFrame((t) => { raf = 0; draw(t); });
            }
        }

        // pausa quando a aba não está visível
        document.addEventListener("visibilitychange", () => {
            running = started && !document.hidden;
            if (running) schedule();
        });

        function draw(now) {
            if (!running) return;
            const minInterval = isSmall() ? 1000 / 30 : 0;
            if (now - lastFrame < minInterval) {
                schedule();
                return;
            }
            lastFrame = now;

            const step = colStep();
            ctx.fillStyle = "rgba(10, 13, 18, 0.06)";
            ctx.fillRect(0, 0, w, h);
            ctx.font = fontSize + "px monospace";
            ctx.fillStyle = "#2dd4bf";

            for (let k = 0; k < columns; k++) {
                const char = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(char, k * fontSize * step, drops[k]);
                drops[k] -= fontSize * 0.35;
                if (drops[k] < -fontSize) {
                    drops[k] = h + Math.random() * 300;
                }
            }

            schedule();
        }

        return {
            // chamado uma única vez, quando a descriptografia da frase termina:
            // as letras nascem embaixo da tela e sobem, e o efeito segue rodando
            start() {
                if (started) return;
                started = true;
                running = !document.hidden;
                canvas.classList.add("is-on"); // fade-in suave do canvas
                if (running) schedule();
            }
        };
    }

    // ==========================================================
    // 2.1 ALTURA REAL DO HEADER -> variável CSS --header-h
    // (o header muda de altura conforme a tela; o conteúdo e as
    //  âncoras usam esse valor para nunca ficarem escondidos)
    // ==========================================================
    function trackHeaderHeight() {
        const header = document.querySelector(".header");
        if (!header) return;

        const update = () => {
            document.documentElement.style.setProperty(
                "--header-h",
                header.offsetHeight + "px"
            );
        };
        update();
        window.addEventListener("resize", update);
        window.addEventListener("orientationchange", update);

        if ("ResizeObserver" in window) {
            new ResizeObserver(update).observe(header);
        }
        // fontes carregadas podem mudar a altura do header
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(update);
        }
    }

    // site abre direto: letras já sobem no fundo e a entrada do conteúdo começa na hora
    const matrix = startBackgroundMatrix();
    trackHeaderHeight();
    runEntrance(matrix.start);

    // ==========================================================
    // 2.2 MODAL: ESCOLHA DE CURRÍCULO (Backend / Dados)
    // ==========================================================
    (function setupCvModal() {
        const openBtn = document.getElementById("cv-download-btn");
        const modal = document.getElementById("cv-modal");
        if (!openBtn || !modal) return;

        let lastFocused = null;

        function openModal() {
            lastFocused = document.activeElement;
            modal.hidden = false;
            const firstOption = modal.querySelector(".cv-option");
            if (firstOption) firstOption.focus();
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

        openBtn.addEventListener("click", openModal);
        modal.querySelectorAll("[data-cv-close]").forEach((el) => {
            el.addEventListener("click", closeModal);
        });

        // ------------------------------------------------------------
        // Download seguro do PDF: em vez de deixar o navegador navegar
        // direto para o arquivo (o que, se ele não existir no servidor,
        // joga o usuário para a página de erro 404 do navegador), o
        // clique busca o arquivo primeiro. Se existir, baixa normalmente;
        // se não existir (ou falhar), mostra um aviso ali mesmo, sem
        // sair do portfólio.
        // ------------------------------------------------------------
        modal.querySelectorAll(".cv-option").forEach((link) => {
            link.addEventListener("click", async (e) => {
                e.preventDefault();
                if (link.classList.contains("is-loading")) return;

                const href = link.getAttribute("href");
                const fileName = href.split("/").pop();

                link.classList.add("is-loading");
                clearCvError(link);

                try {
                    const response = await fetch(href, { cache: "no-store" });
                    if (!response.ok) throw new Error("Arquivo não encontrado");

                    const blob = await response.blob();
                    const blobUrl = URL.createObjectURL(blob);
                    const tempLink = document.createElement("a");
                    tempLink.href = blobUrl;
                    tempLink.download = fileName;
                    document.body.appendChild(tempLink);
                    tempLink.click();
                    tempLink.remove();
                    URL.revokeObjectURL(blobUrl);
                } catch (err) {
                    showCvError(link, "Currículo indisponível no momento. Tente novamente mais tarde.");
                } finally {
                    link.classList.remove("is-loading");
                }
            });
        });

        function showCvError(link, message) {
            let msg = link.querySelector(".cv-option-error");
            if (!msg) {
                msg = document.createElement("span");
                msg.className = "cv-option-error";
                link.appendChild(msg);
            }
            msg.textContent = message;
            requestAnimationFrame(() => msg.classList.add("show"));
        }

        function clearCvError(link) {
            const msg = link.querySelector(".cv-option-error");
            if (msg) msg.remove();
        }
    })();

    // ==========================================================
    // 2.3 VISUALIZADOR: CERTIFICADO (tela cheia, sem chrome de PDF)
    // ==========================================================
    (function setupCertModal() {
        const openBtn = document.getElementById("cert-open-btn");
        const modal = document.getElementById("cert-modal");
        const canvas = document.getElementById("cert-modal-canvas");
        if (!openBtn || !modal || !canvas) return;

        const PDF_SRC = "assets/certificados/certificado-ciberseguranca-cisco.pdf";
        const ctx = canvas.getContext("2d");

        let lastFocused = null;
        let pdfDoc = null;
        let currentRenderTask = null;
        let resizeTimer = null;

        // Renderiza a página do certificado num <canvas> puro (sem toolbar
        // nativa de PDF do navegador), contido numa caixa e não na tela toda.
        // telas grandes (desktop) mostram o certificado maior;
        // telas menores (celular/tablet) mantêm o tamanho original
        const LARGE_SCREEN_BREAKPOINT = 1024;

        function renderPage() {
            if (!pdfDoc) return;
            pdfDoc.getPage(1).then((page) => {
                const dpr = window.devicePixelRatio || 1;
                const baseViewport = page.getViewport({ scale: 1 });
                const isLargeScreen = window.innerWidth >= LARGE_SCREEN_BREAKPOINT;
                const maxW = isLargeScreen
                    ? Math.min(1000, window.innerWidth * 0.8)
                    : Math.min(640, window.innerWidth * 0.9);
                const maxH = isLargeScreen
                    ? Math.min(window.innerHeight * 0.85, 1200)
                    : Math.min(window.innerHeight * 0.8, 820);
                const fitScale = Math.min(maxW / baseViewport.width, maxH / baseViewport.height);
                const renderViewport = page.getViewport({ scale: fitScale * dpr });

                canvas.width = renderViewport.width;
                canvas.height = renderViewport.height;
                canvas.style.width = (fitScale * baseViewport.width) + "px";
                canvas.style.height = (fitScale * baseViewport.height) + "px";

                if (currentRenderTask) currentRenderTask.cancel();
                currentRenderTask = page.render({ canvasContext: ctx, viewport: renderViewport });
                currentRenderTask.promise.catch(() => {});
            });
        }

        function loadAndRender() {
            if (typeof pdfjsLib === "undefined") return;
            if (pdfDoc) { renderPage(); return; }
            pdfjsLib.getDocument(PDF_SRC).promise.then((pdf) => {
                pdfDoc = pdf;
                renderPage();
            }).catch(() => {});
        }

        function onResize() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(renderPage, 150);
        }

        function openModal() {
            lastFocused = document.activeElement;
            modal.hidden = false;
            requestAnimationFrame(() => {
                requestAnimationFrame(() => modal.classList.add("is-open"));
            });
            loadAndRender();
            document.addEventListener("keydown", onKeydown);
            window.addEventListener("resize", onResize);
        }

        function closeModal() {
            modal.classList.remove("is-open");
            document.removeEventListener("keydown", onKeydown);
            window.removeEventListener("resize", onResize);
            const done = () => { modal.hidden = true; };
            if (prefersReducedMotion) { done(); }
            else { setTimeout(done, 250); }
            if (lastFocused) lastFocused.focus();
        }

        function onKeydown(e) {
            if (e.key === "Escape") closeModal();
        }

        openBtn.addEventListener("click", openModal);
        modal.querySelectorAll("[data-cert-close]").forEach((el) => {
            el.addEventListener("click", closeModal);
        });
        // clique na área transparente (fora do certificado) também fecha
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeModal();
        });
    })();

    // ==========================================================
    // 3. NAVEGAÇÃO SUAVE CUSTOMIZADA
    // ==========================================================
    const internalLinks = document.querySelectorAll('a[href^="#"]');

    internalLinks.forEach((link) => {
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
    // 4. DESTAQUE DO LINK DE NAVEGAÇÃO CONFORME A SEÇÃO VISÍVEL
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
