/* VELARO SERVICE — interactions */

(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Header / mobile nav ---------- */
  const header = document.getElementById("header");
  const burger = document.getElementById("burger");
  const nav = document.getElementById("nav");

  const onScrollHeader = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  };
  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });

  burger?.addEventListener("click", () => {
    const open = burger.getAttribute("aria-expanded") === "true";
    burger.setAttribute("aria-expanded", String(!open));
    nav.classList.toggle("is-open", !open);
    document.body.style.overflow = open ? "" : "hidden";
  });

  nav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      burger?.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
      document.body.style.overflow = "";
    });
  });

  /* ---------- Cursor glow ---------- */
  const glow = document.querySelector(".cursor-glow");
  if (glow && !reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    let gx = -999;
    let gy = -999;
    let cx = -999;
    let cy = -999;

    window.addEventListener(
      "pointermove",
      (e) => {
        gx = e.clientX;
        gy = e.clientY;
      },
      { passive: true }
    );

    const tickGlow = () => {
      cx += (gx - cx) * 0.12;
      cy += (gy - cy) * 0.12;
      glow.style.left = `${cx}px`;
      glow.style.top = `${cy}px`;
      requestAnimationFrame(tickGlow);
    };
    tickGlow();
  }

  /* ---------- Hero X-ray mask ---------- */
  const mask = document.getElementById("heroMask");
  if (mask) {
    const isFine = window.matchMedia("(pointer: fine)").matches;
    const radius = isFine ? 220 : 140;
    let mx = 70;
    let my = 45;
    let tx = 70;
    let ty = 45;
    let mr = 0;
    let tr = 0;
    let active = false;

    const setMask = () => {
      mask.style.setProperty("--mx", `${mx}%`);
      mask.style.setProperty("--my", `${my}%`);
      mask.style.setProperty("--mr", `${mr}px`);
    };
    setMask();

    const toLocal = (clientX, clientY) => {
      const rect = mask.getBoundingClientRect();
      return {
        x: ((clientX - rect.left) / rect.width) * 100,
        y: ((clientY - rect.top) / rect.height) * 100,
      };
    };

    const activate = (x, y) => {
      active = true;
      mask.classList.add("is-active");
      tx = x;
      ty = y;
      tr = radius;
    };

    const deactivate = () => {
      active = false;
      mask.classList.remove("is-active");
      tr = 0;
    };

    if (isFine) {
      mask.addEventListener("pointerenter", (e) => {
        const p = toLocal(e.clientX, e.clientY);
        activate(p.x, p.y);
      });
      mask.addEventListener("pointermove", (e) => {
        const p = toLocal(e.clientX, e.clientY);
        tx = p.x;
        ty = p.y;
        tr = radius;
        if (!active) activate(p.x, p.y);
      });
      mask.addEventListener("pointerleave", deactivate);
    } else {
      // Touch: tap/drag to reveal
      mask.addEventListener(
        "pointerdown",
        (e) => {
          mask.setPointerCapture(e.pointerId);
          const p = toLocal(e.clientX, e.clientY);
          activate(p.x, p.y);
        },
        { passive: true }
      );
      mask.addEventListener(
        "pointermove",
        (e) => {
          if (!active) return;
          const p = toLocal(e.clientX, e.clientY);
          tx = p.x;
          ty = p.y;
        },
        { passive: true }
      );
      mask.addEventListener("pointerup", deactivate);
      mask.addEventListener("pointercancel", deactivate);

      // Gentle idle pulse so mobile users see the effect
      if (!reduceMotion) {
        setTimeout(() => {
          activate(62, 48);
          setTimeout(deactivate, 1600);
        }, 900);
      }
    }

    const animateMask = () => {
      mx += (tx - mx) * 0.18;
      my += (ty - my) * 0.18;
      mr += (tr - mr) * 0.16;
      setMask();
      requestAnimationFrame(animateMask);
    };
    animateMask();
  }

  /* ---------- Accordion ---------- */
  const accordion = document.getElementById("accordion");
  accordion?.querySelectorAll(".accordion__item").forEach((item) => {
    const trigger = item.querySelector(".accordion__trigger");
    trigger?.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");
      accordion.querySelectorAll(".accordion__item").forEach((el) => {
        el.classList.remove("is-open");
        el.querySelector(".accordion__trigger")?.setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        item.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* ---------- Fleet nav (scroll / shift focus) ---------- */
  const track = document.getElementById("fleetTrack");
  const prev = document.querySelector("[data-fleet-prev]");
  const next = document.querySelector("[data-fleet-next]");

  const scrollFleet = (dir) => {
    if (!track) return;
    const card = track.querySelector(".car-card");
    const amount = (card?.getBoundingClientRect().width || 320) + 20;
    if (window.matchMedia("(max-width: 768px)").matches) {
      track.scrollBy({ left: dir * amount, behavior: "smooth" });
      return;
    }
    const cards = [...track.children];
    if (dir > 0) track.appendChild(cards[0]);
    else track.prepend(cards[cards.length - 1]);
  };

  prev?.addEventListener("click", () => scrollFleet(-1));
  next?.addEventListener("click", () => scrollFleet(1));

  if (track && window.matchMedia("(max-width: 768px)").matches) {
    track.style.display = "flex";
    track.style.overflowX = "auto";
    track.style.scrollSnapType = "x mandatory";
    track.style.gap = "16px";
    [...track.children].forEach((c) => {
      c.style.minWidth = "85%";
      c.style.scrollSnapAlign = "start";
    });
  }

  /* ---------- Form ---------- */
  const form = document.getElementById("contactForm");
  const success = document.getElementById("formSuccess");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    success.hidden = false;
    form.reset();
    setTimeout(() => {
      success.hidden = true;
    }, 4000);
  });

  /* ---------- Counters ---------- */
  const animateCount = (el) => {
    const target = Number(el.dataset.count || 0);
    const duration = 1400;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased).toLocaleString("ru-RU");
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  /* ---------- GSAP / fallback reveals ---------- */
  const initMotion = () => {
    const reveals = document.querySelectorAll(".reveal");

    if (reduceMotion) {
      reveals.forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
      document.querySelectorAll("[data-count]").forEach(animateCount);
      return;
    }

    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);

      const heroItems = gsap.utils.toArray(".hero__content > *");
      gsap.set(heroItems, { clearProps: "all" });
      gsap.fromTo(
        heroItems,
        { y: 28, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          stagger: 0.1,
          ease: "power3.out",
          delay: 0.12,
          clearProps: "transform",
        }
      );

      gsap.fromTo(
        ".hero-mask__body, .hero-mask__xray",
        { scale: 1.06 },
        {
          scale: 1,
          duration: 1.4,
          ease: "power3.out",
          delay: 0.05,
        }
      );

      gsap.to(".hero__bg-word", {
        yPercent: 25,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      // Skip elements already handled in hero
      reveals.forEach((el) => {
        if (el.closest(".hero__content")) return;
        gsap.fromTo(
          el,
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            clearProps: "transform",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              once: true,
            },
          }
        );
      });

      document.querySelectorAll("[data-parallax]").forEach((el) => {
        if (el.classList.contains("hero__bg-word")) return;
        const speed = Number(el.dataset.parallax) || 0.1;
        gsap.to(el, {
          yPercent: speed * 100,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      });

      gsap.utils.toArray(".service-card, .car-card").forEach((card, i) => {
        gsap.fromTo(
          card,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            delay: (i % 4) * 0.08,
            ease: "power3.out",
            clearProps: "transform",
            scrollTrigger: {
              trigger: card,
              start: "top 90%",
              once: true,
            },
          }
        );
      });

      ScrollTrigger.create({
        trigger: ".stats",
        start: "top 80%",
        once: true,
        onEnter: () => document.querySelectorAll("[data-count]").forEach(animateCount),
      });
    } else {
      // Fallback without GSAP
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.style.transition = "opacity 0.8s ease, transform 0.8s ease";
            entry.target.style.opacity = "1";
            entry.target.style.transform = "none";
            if (entry.target.closest(".stats")) {
              entry.target.querySelectorAll?.("[data-count]")?.forEach(animateCount);
            }
            io.unobserve(entry.target);
          });
        },
        { threshold: 0.15 }
      );
      reveals.forEach((el) => io.observe(el));
      const stats = document.querySelector(".stats");
      if (stats) {
        const sio = new IntersectionObserver(
          (entries) => {
            if (entries[0]?.isIntersecting) {
              document.querySelectorAll("[data-count]").forEach(animateCount);
              sio.disconnect();
            }
          },
          { threshold: 0.3 }
        );
        sio.observe(stats);
      }
    }
  };

  const bootMotion = () => {
    if (window.__velaroMotionInit) return;
    if (!window.gsap && !reduceMotion) {
      // wait for deferred GSAP briefly, then fallback
      let tries = 0;
      const wait = setInterval(() => {
        tries += 1;
        if (window.gsap || tries > 40) {
          clearInterval(wait);
          window.__velaroMotionInit = true;
          initMotion();
        }
      }, 50);
      return;
    }
    window.__velaroMotionInit = true;
    initMotion();
  };

  if (document.readyState === "complete") bootMotion();
  else window.addEventListener("load", bootMotion);
})();
