/* jshint esversion: 6 */
(function () {
  'use strict';

  /* ── Helpers ──────────────────────────────────────────────── */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* ── Back to Top (declared early so handleScroll can use it) */
  const backToTop = $('#backToTop');

  /* ── Navbar: scroll effect + hamburger ───────────────────── */
  const navbar = $('#navbar');
  const hamburger = $('#hamburger');
  const navMenu = $('#navMenu');

  function handleScroll() {
    const scrolled = window.scrollY > 60;
    navbar.classList.toggle('scrolled', scrolled);
    backToTop.classList.toggle('visible', window.scrollY > 400);
  }

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', String(isOpen));
    navMenu.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close menu on nav link click
  $$('.navbar__nav a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      navMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // run once on load

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ── Destination filter tabs ─────────────────────────────── */
  const tabs = $$('.destinations__tabs .tab');
  const cards = $$('#destinationsGrid .dest-card');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      const filter = tab.dataset.filter;
      cards.forEach(card => {
        const show = filter === 'all' || card.dataset.category === filter;
        card.hidden = !show;
        card.style.animation = show ? 'fadeIn 0.3s ease forwards' : '';
      });
    });
  });

  // Inject keyframe if not already present
  if (!document.querySelector('#fadeInStyle')) {
    const style = document.createElement('style');
    style.id = 'fadeInStyle';
    style.textContent = '@keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }';
    document.head.appendChild(style);
  }

  /* ── Testimonials slider ─────────────────────────────────── */
  const track = $('#testimonialTrack');
  const dots = $$('#sliderDots .dot');
  const prevBtn = $('#sliderPrev');
  const nextBtn = $('#sliderNext');

  let currentSlide = 0;
  let autoSlideInterval;

  function getVisibleCount() {
    if (window.innerWidth <= 768)  return 1;
    if (window.innerWidth <= 1024) return 2;
    return 3;
  }

  function totalSlides() {
    const visible = getVisibleCount();
    return Math.max(1, track.children.length - visible + 1);
  }

  function goToSlide(index) {
    const visible = getVisibleCount();
    const max = totalSlides() - 1;
    currentSlide = Math.max(0, Math.min(index, max));

    const cardWidth = track.children[0].offsetWidth + 24; // gap = 24px
    track.style.transform = `translateX(-${currentSlide * cardWidth}px)`;

    dots.forEach((dot, i) => {
      const active = i === currentSlide % dots.length;
      dot.classList.toggle('active', active);
      dot.setAttribute('aria-selected', String(active));
    });
  }

  prevBtn.addEventListener('click', () => {
    resetAutoSlide();
    goToSlide(currentSlide - 1);
  });
  nextBtn.addEventListener('click', () => {
    resetAutoSlide();
    goToSlide(currentSlide + 1 >= totalSlides() ? 0 : currentSlide + 1);
  });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      resetAutoSlide();
      goToSlide(i);
    });
  });

  function startAutoSlide() {
    autoSlideInterval = setInterval(() => {
      goToSlide(currentSlide + 1 >= totalSlides() ? 0 : currentSlide + 1);
    }, 5000);
  }
  function resetAutoSlide() {
    clearInterval(autoSlideInterval);
    startAutoSlide();
  }

  startAutoSlide();
  window.addEventListener('resize', () => goToSlide(0), { passive: true });

  /* ── Scroll-reveal animations ────────────────────────────── */
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  $$('[data-aos]').forEach(el => observer.observe(el));

  /* ── Search form ─────────────────────────────────────────── */
  const searchForm = $('#searchForm');
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const dest = $('#searchDestination').value.trim();
    if (dest) {
      // Scroll to destinations section
      document.querySelector('#destinations').scrollIntoView({ behavior: 'smooth' });
    }
  });

  /* ── Contact form validation ─────────────────────────────── */
  const contactForm = $('#contactForm');
  const formSuccess = $('#formSuccess');

  function validateField(input, errorEl) {
    const value = input.value.trim();
    let message = '';

    if (input.required && !value) {
      message = 'This field is required.';
    } else if (input.type === 'email' && value) {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(value)) message = 'Please enter a valid email address.';
    }

    errorEl.textContent = message;
    input.classList.toggle('invalid', !!message);
    return !message;
  }

  // Live validation
  $$('#contactForm [required]').forEach(input => {
    const errorEl = $('#' + input.id + 'Error');
    if (errorEl) {
      input.addEventListener('blur', () => validateField(input, errorEl));
      input.addEventListener('input', () => {
        if (input.classList.contains('invalid')) validateField(input, errorEl);
      });
    }
  });

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    let valid = true;
    $$('#contactForm [required]').forEach(input => {
      const errorEl = $('#' + input.id + 'Error');
      if (errorEl && !validateField(input, errorEl)) valid = false;
    });

    if (valid) {
      contactForm.reset();
      formSuccess.hidden = false;
      formSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      setTimeout(() => { formSuccess.hidden = true; }, 6000);
    }
  });

  /* ── Footer: current year ────────────────────────────────── */
  const yearEl = $('#currentYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();
