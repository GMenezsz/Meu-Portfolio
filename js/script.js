document.addEventListener("DOMContentLoaded", () => {

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ==========================================================
    // 1. DIGITAÇÃO DO NOME E DO CARGO (dispara após o loader)
    // ==========================================================
    function startTypingSequence() {
        const nameEl = document.getElementById("typed-name");
        const roleEl = document.getElementById("typed-role");
        const nameCursor = document.getElementById("name-cursor");
        const roleCursor = document.getElementById("role-cursor");

        const nomeTexto = "Gabriel Menezes";
        const roleTexto = "Desenvolvedor Backend";

        if (prefersReducedMotion) {
            if (nameEl) nameEl.textContent = nomeTexto;
            if (roleEl) roleEl.textContent = roleTexto;
            return;
        }

        if (roleCursor) roleCursor.style.display = "none";

        let i = 0;
        function digitarNome() {
            if (!nameEl) return;
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
            if (!roleEl) return;
            if (j <= roleTexto.length) {
                roleEl.textContent = roleTexto.slice(0, j);
                j++;
                setTimeout(digitarRole, 45);
            }
        }

        setTimeout(digitarNome, 150);
    }

    // ==========================================================
    // 2. FUNDO PERSISTENTE: CÓDIGOS SUBINDO O TEMPO TODO
    // ==========================================================
    function startBackgroundMatrix() {
        if (prefersReducedMotion) return;
        const canvas = document.getElementById("bg-matrix-canvas");
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        let w, h;

        function resize() {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener("resize", resize);

        const fontSize = 16;
        const chars = "アイウエオカキクケコサシスセソタチツテト0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$+-*/=%<>[]{}";
        const columns = Math.floor(w / fontSize);
        const drops = new Array(columns).fill(0).map(() => Math.random() * h);

        function draw() {
            ctx.fillStyle = "rgba(10, 13, 18, 0.06)";
            ctx.fillRect(0, 0, w, h);
            ctx.font = fontSize + "px monospace";
            ctx.fillStyle = "#2dd4bf";

            for (let k = 0; k < columns; k++) {
                const char = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(char, k * fontSize, drops[k]);
                drops[k] -= fontSize * 0.35;
                if (drops[k] < -fontSize) {
                    drops[k] = h + Math.random() * 300;
                }
            }

            requestAnimationFrame(draw);
        }
        requestAnimationFrame(draw);
    }

    // ==========================================================
    // 3. ANIMAÇÃO DE ENTRADA: CÓDIGOS VERDES SUBINDO (estilo Matrix)
    // ==========================================================
    function runIntro() {
        const introEl = document.getElementById("intro-loader");
        const canvas = document.getElementById("matrix-canvas");
        const introStatus = document.getElementById("intro-status");

        if (!introEl || !canvas) {
            startTypingSequence();
            return;
        }

        if (prefersReducedMotion) {
            introEl.remove();
            document.documentElement.classList.remove("intro-active");
            startTypingSequence();
            return;
        }

        document.documentElement.classList.add("intro-active");

        const ctx = canvas.getContext("2d");
        let w, h;

        function resize() {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener("resize", resize);

        const fontSize = 16;
        const chars = "アイウエオカキクケコサシスセソタチツテト0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$+-*/=%<>[]{}";

        let columns = Math.floor(w / fontSize);
        let drops = new Array(columns).fill(0).map(() => h + Math.random() * h);

        let running = true;
        const startTime = performance.now();
        const RISE_DURATION = 1100;   // colunas sobem por 1.1s
        const TOTAL_DURATION = 2000;  // animação completa: 2s

        // contador de porcentagem da animação de carregamento
        function updatePercent() {
            const percentEl = document.getElementById("intro-percent");
            if (!percentEl) return;
            const elapsed = performance.now() - startTime;
            const pct = Math.min(100, Math.round((elapsed / TOTAL_DURATION) * 100));
            percentEl.textContent = pct + "%";
            if (running && pct < 100) {
                requestAnimationFrame(updatePercent);
            }
        }
        requestAnimationFrame(updatePercent);

        function draw() {
            if (!running) return;

            // rastro: pinta um retangulo semi-transparente por cima a cada frame
            ctx.fillStyle = "rgba(10, 13, 18, 0.18)";
            ctx.fillRect(0, 0, w, h);
            ctx.font = fontSize + "px monospace";

            const elapsed = performance.now() - startTime;
            const stillRising = elapsed < RISE_DURATION;

            for (let k = 0; k < columns; k++) {
                const char = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillStyle = Math.random() > 0.94 ? "#eef2f6" : "#2dd4bf";
                ctx.fillText(char, k * fontSize, drops[k]);

                if (stillRising) {
                    drops[k] -= fontSize * (0.6 + Math.random() * 0.9);
                    if (drops[k] < -fontSize) {
                        drops[k] = h + Math.random() * 120;
                    }
                }
            }

            requestAnimationFrame(draw);
        }
        requestAnimationFrame(draw);

        // quando os códigos param de subir (chegam ao topo), mostra a animação de "carregando"
        setTimeout(() => {
            if (introStatus) introStatus.classList.add("show");
        }, RISE_DURATION);

        // após 5s no total, remove o loader e revela o site
        setTimeout(() => {
            running = false;
            introEl.classList.add("intro-hidden");
            document.documentElement.classList.remove("intro-active");
            startTypingSequence();
            setTimeout(() => introEl.remove(), 700);
        }, TOTAL_DURATION);
    }

    runIntro();
    startBackgroundMatrix();

    // ==========================================================
    // 4. NAVEGAÇÃO SUAVE CUSTOMIZADA
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
    // 5. DESTAQUE DO LINK DE NAVEGAÇÃO CONFORME A SEÇÃO VISÍVEL
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
