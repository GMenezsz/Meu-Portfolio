document.addEventListener("DOMContentLoaded", () => {

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ==========================================================
    // 1. DIGITAÇÃO DO NOME E DO CARGO (dispara assim que a página abre)
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
        const chars = "アイウエオカキクケコサシスセソタチツテト0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$+-*/=%<>[]{}";
        let w = 0, h = 0, fontSize = 16, columns = 0, drops = [];
        let running = true;
        let lastFrame = 0;

        // telas pequenas: letras maiores/menos colunas e menos quadros por segundo (economiza bateria)
        function isSmall() { return window.innerWidth < 700; }

        function setup() {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
            fontSize = isSmall() ? 14 : 16;
            const step = isSmall() ? 1.5 : 1; // pula colunas no mobile
            columns = Math.floor(w / (fontSize * step));
            drops = new Array(columns).fill(0).map(() => Math.random() * h);
            ctx.fillStyle = "rgb(10, 13, 18)";
            ctx.fillRect(0, 0, w, h);
        }
        setup();

        // só refaz o canvas quando a LARGURA muda (a barra de endereço do celular
        // altera a altura ao rolar e não deve reiniciar a animação)
        let lastW = window.innerWidth;
        let resizeTimer;
        window.addEventListener("resize", () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (window.innerWidth !== lastW) {
                    lastW = window.innerWidth;
                    setup();
                } else if (window.innerHeight > h) {
                    h = canvas.height = window.innerHeight;
                }
            }, 150);
        });

        // pausa quando a aba não está visível
        document.addEventListener("visibilitychange", () => {
            running = !document.hidden;
            if (running) requestAnimationFrame(draw);
        });

        function draw(now) {
            if (!running) return;
            const minInterval = isSmall() ? 1000 / 30 : 0;
            if (now - lastFrame < minInterval) {
                requestAnimationFrame(draw);
                return;
            }
            lastFrame = now;

            const step = isSmall() ? 1.5 : 1;
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

            requestAnimationFrame(draw);
        }
        requestAnimationFrame(draw);
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

    // site abre direto: sem tela de carregamento, letras já sobem no fundo
    // e o texto do nome/cargo já começa a digitar imediatamente
    trackHeaderHeight();
    startTypingSequence();
    startBackgroundMatrix();

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
