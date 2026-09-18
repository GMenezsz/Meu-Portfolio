document.addEventListener("DOMContentLoaded", () => {

    // 1. EFEITO DE DIGITAÇÃO NO CARGO (única animação de entrada, não repete no scroll)
    const typedEl = document.getElementById("typed-role");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (typedEl) {
        const texto = "Desenvolvedor Backend";

        if (prefersReducedMotion) {
            typedEl.textContent = texto;
        } else {
            let i = 0;
            const digitar = () => {
                if (i <= texto.length) {
                    typedEl.textContent = texto.slice(0, i);
                    i++;
                    setTimeout(digitar, 45);
                }
            };
            setTimeout(digitar, 500);
        }
    }

    // 2. NAVEGAÇÃO SUAVE CUSTOMIZADA
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

    // 3. DESTAQUE DO LINK DE NAVEGAÇÃO CONFORME A SEÇÃO VISÍVEL
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
