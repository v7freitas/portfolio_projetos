/* Portfólio — interações mínimas (sem dependências) */
(function () {
	"use strict";

	var nav = document.getElementById("nav");
	var toggle = document.getElementById("navToggle");
	var links = document.getElementById("navLinks");

	/* ano no rodapé */
	var year = document.getElementById("year");
	if (year) year.textContent = new Date().getFullYear();

	/* sombra/fundo da navbar ao rolar */
	if (nav) {
		var onScroll = function () {
			nav.classList.toggle("scrolled", window.scrollY > 12);
		};
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
	}

	/* menu mobile (só existe nas páginas com navegação por seções) */
	if (toggle && links) {
		toggle.addEventListener("click", function () {
			var open = links.classList.toggle("open");
			toggle.setAttribute("aria-expanded", open ? "true" : "false");
		});
		links.addEventListener("click", function (e) {
			if (e.target.closest("a")) {
				links.classList.remove("open");
				toggle.setAttribute("aria-expanded", "false");
			}
		});
	}

	/* link ativo conforme a seção visível */
	var navAnchors = links
		? Array.prototype.slice.call(links.querySelectorAll('a[href^="#"]:not(.nav-cta)'))
		: [];
	var sections = navAnchors
		.map(function (a) { return document.querySelector(a.getAttribute("href")); })
		.filter(Boolean);

	if ("IntersectionObserver" in window && sections.length) {
		var spy = new IntersectionObserver(
			function (entries) {
				entries.forEach(function (entry) {
					if (!entry.isIntersecting) return;
					navAnchors.forEach(function (a) {
						a.classList.toggle(
							"active",
							a.getAttribute("href") === "#" + entry.target.id
						);
					});
				});
			},
			{ rootMargin: "-45% 0px -50% 0px" }
		);
		sections.forEach(function (s) { spy.observe(s); });
	}

	/* revelar elementos ao entrar na viewport */
	var revealTargets = document.querySelectorAll(
		".section-head, .about-grid > *, .skill-card, .project-card, .hero-photo," +
		" .contact-actions, .pbi-banner, .pbi-card"
	);
	if ("IntersectionObserver" in window) {
		Array.prototype.forEach.call(revealTargets, function (el) {
			el.classList.add("reveal");
		});
		var revealer = new IntersectionObserver(
			function (entries, obs) {
				entries.forEach(function (entry) {
					if (entry.isIntersecting) {
						entry.target.classList.add("in");
						obs.unobserve(entry.target);
					}
				});
			},
			{ rootMargin: "0px 0px -10% 0px" }
		);
		Array.prototype.forEach.call(revealTargets, function (el) {
			revealer.observe(el);
		});
	}
})();
