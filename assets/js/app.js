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

	/* carrossel de projetos */
	var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	Array.prototype.forEach.call(document.querySelectorAll("[data-carousel]"), function (root) {
		var track = root.querySelector("[data-carousel-track]");
		var viewport = track.parentElement;
		var prev = root.querySelector("[data-carousel-prev]");
		var next = root.querySelector("[data-carousel-next]");
		var dotsBox = root.querySelector("[data-carousel-dots]");
		var slides = Array.prototype.slice.call(track.children);
		var dots = [];
		var stops = [0]; /* posição de rolagem de cada "página" */
		if (!slides.length) return;

		var maxScroll = function () { return track.scrollWidth - track.clientWidth; };

		/* índice da parada mais próxima de uma posição */
		var nearest = function (x) {
			var best = 0;
			for (var k = 1; k < stops.length; k++) {
				if (Math.abs(stops[k] - x) < Math.abs(stops[best] - x)) best = k;
			}
			return best;
		};
		var current = function () { return nearest(track.scrollLeft); };

		/* animação própria com desaceleração suave (easeOutQuart) */
		var raf = 0;
		var stopAnim = function () {
			if (!raf) return;
			cancelAnimationFrame(raf);
			raf = 0;
			track.classList.remove("animating");
		};
		var animateTo = function (target) {
			stopAnim();
			target = Math.max(0, Math.min(maxScroll(), target));
			var from = track.scrollLeft;
			var dist = target - from;
			if (reduceMotion || Math.abs(dist) < 1) { track.scrollLeft = target; update(); return; }
			var dur = Math.min(750, 380 + Math.abs(dist) * 0.45);
			var start = performance.now();
			track.classList.add("animating"); /* sem snap enquanto anima */
			var tick = function (now) {
				var t = Math.min(1, (now - start) / dur);
				var eased = 1 - Math.pow(1 - t, 4);
				track.scrollLeft = from + dist * eased;
				if (t < 1) { raf = requestAnimationFrame(tick); }
				else { raf = 0; track.classList.remove("animating"); update(); }
			};
			raf = requestAnimationFrame(tick);
		};
		var goTo = function (i) {
			i = Math.max(0, Math.min(stops.length - 1, i));
			animateTo(stops[i]);
		};

		var update = function () {
			var i = current();
			var atStart = track.scrollLeft <= 2;
			var atEnd = track.scrollLeft >= maxScroll() - 2;
			if (prev) prev.disabled = atStart;
			if (next) next.disabled = atEnd;
			viewport.classList.toggle("can-prev", !atStart);
			viewport.classList.toggle("can-next", !atEnd);
			dots.forEach(function (d, k) {
				d.setAttribute("aria-selected", k === i ? "true" : "false");
				d.tabIndex = k === i ? 0 : -1;
			});
		};

		var build = function () {
			var max = maxScroll();
			var base = slides[0].offsetLeft;
			stops = [];
			slides.forEach(function (s) {
				var x = Math.min(max, s.offsetLeft - base);
				if (!stops.length || x - stops[stops.length - 1] > 2) stops.push(x);
			});
			root.classList.toggle("is-static", max <= 2);
			if (dotsBox && dots.length !== stops.length) {
				dotsBox.innerHTML = "";
				dots = [];
				stops.forEach(function (_, k) {
					var d = document.createElement("button");
					d.type = "button";
					d.setAttribute("role", "tab");
					d.setAttribute("aria-label", "Ir para o projeto " + (k + 1));
					d.addEventListener("click", function () { goTo(k); });
					dotsBox.appendChild(d);
					dots.push(d);
				});
			}
			update();
		};

		if (prev) prev.addEventListener("click", function () { goTo(current() - 1); });
		if (next) next.addEventListener("click", function () { goTo(current() + 1); });

		track.addEventListener("keydown", function (e) {
			if (e.target !== track) return;
			if (e.key === "ArrowRight") { e.preventDefault(); goTo(current() + 1); }
			if (e.key === "ArrowLeft") { e.preventDefault(); goTo(current() - 1); }
		});

		/* qualquer gesto do usuário interrompe a animação em curso */
		track.addEventListener("wheel", stopAnim, { passive: true });
		track.addEventListener("touchstart", stopAnim, { passive: true });

		var ticking = false;
		track.addEventListener("scroll", function () {
			if (ticking) return;
			ticking = true;
			requestAnimationFrame(function () { update(); ticking = false; });
		}, { passive: true });

		/* arrastar com o mouse, com inércia ao soltar (toque já rola nativamente) */
		var startX = 0, startLeft = 0, moved = false, down = false, samples = [];
		track.addEventListener("pointerdown", function (e) {
			if (e.pointerType !== "mouse" || e.button !== 0 || root.classList.contains("is-static")) return;
			stopAnim();
			down = true; moved = false;
			startX = e.clientX; startLeft = track.scrollLeft;
			samples = [{ x: e.clientX, t: performance.now() }];
		});
		window.addEventListener("pointermove", function (e) {
			if (!down) return;
			var dx = e.clientX - startX;
			if (!moved && Math.abs(dx) > 5) { moved = true; track.classList.add("dragging"); }
			if (!moved) return;
			var now = performance.now();
			samples.push({ x: e.clientX, t: now });
			while (samples.length > 2 && now - samples[0].t > 100) samples.shift();
			/* resistência elástica além das pontas */
			var x = startLeft - dx;
			var max = maxScroll();
			var over = x < 0 ? x : x > max ? x - max : 0;
			track.scrollLeft = x;
			track.style.transform = over ? "translateX(" + (-over / 3) + "px)" : "";
		});
		window.addEventListener("pointerup", function () {
			if (!down) return;
			down = false;
			if (!moved) return;
			/* velocidade dos últimos ~100 ms projeta onde a rolagem pararia */
			var a = samples[0], b = samples[samples.length - 1];
			var v = b.t > a.t ? (a.x - b.x) / (b.t - a.t) : 0; /* px/ms */
			var from = nearest(startLeft);
			var target = nearest(track.scrollLeft + v * 220);
			/* um gesto rápido sempre avança ao menos um card */
			if (target === from && Math.abs(v) > 0.35) target = from + (v > 0 ? 1 : -1);
			/* a animação assume antes de o snap voltar, senão o navegador puxa a rolagem de volta */
			goTo(target);
			track.classList.remove("dragging");
			if (track.style.transform) {
				/* volta da borda elástica com uma mola suave */
				track.classList.add("settling");
				track.style.transform = "";
				setTimeout(function () { track.classList.remove("settling"); }, 500);
			}
		});
		/* um arraste não deve abrir o link do card */
		track.addEventListener("click", function (e) {
			if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
		}, true);
		track.addEventListener("dragstart", function (e) { e.preventDefault(); });

		var resizeTimer = 0;
		window.addEventListener("resize", function () {
			clearTimeout(resizeTimer);
			resizeTimer = setTimeout(build, 120);
		});
		build();
	});

	/* revelar elementos ao entrar na viewport */
	var revealTargets = document.querySelectorAll(
		".section-head, .about-grid > *, .skill-card, .carousel-track, .hero-photo," +
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
