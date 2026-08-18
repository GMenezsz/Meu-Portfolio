document.addEventListener("DOMContentLoaded", () => {
    // 1. ANIMAÇÃO DE ENTRADA DOS CARDS (Scroll Reveal)
    const cards = document.querySelectorAll(".animate-on-scroll");

    const revealOnScroll = () => {
        const triggerBottom = window.innerHeight * 0.85;

        cards.forEach((card) => {
            const cardTop = card.getBoundingClientRect().top;

            if (cardTop < triggerBottom) {
                card.classList.add("visible");
            }
        });
    };

    // Executa no carregamento inicial e durante o scroll
    revealOnScroll();
    window.addEventListener("scroll", revealOnScroll);

    // 2. NAVEGAÇÃO SUAVE CUSTOMIZADA (Fallback caso o scroll-behavior do CSS precise de refinamento)
    const internalLinks = document.querySelectorAll('a[href^="#"]');

    internalLinks.forEach((link) => {
        link.addEventListener("click", function (e) {
            const targetId = this.getAttribute("href");
            
            if (targetId === "#") return;

            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        });
    });
});