/* ============================================================
   Honnête, LLC — Animation Layer
   GSAP (progressive enhancement) + IntersectionObserver + vanilla JS
   No design/layout/content changes — animations only.
============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  const hasGSAP = typeof gsap !== 'undefined';
  if (hasGSAP && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* =========================================================
     SECTION 1 — HERO BANNER: video carousel (autoplay, loop,
     muted, no controls, smooth crossfade between slides)
  ========================================================= */
  (function heroCarousel(){
    const slides = document.querySelectorAll('.hero-slide');
    const dots   = document.querySelectorAll('.hero-dots .dot');
    if (!slides.length) return;

    let current = 0;
    const total = slides.length;
    const SLIDE_DURATION = 6000; // ms each slide is shown

    function goTo(index){
      slides[current].classList.remove('is-active');
      const prevVideo = slides[current].querySelector('video');
      if (prevVideo) prevVideo.pause();

      current = index % total;

      slides[current].classList.add('is-active');
      const nextVideo = slides[current].querySelector('video');
      if (nextVideo) {
        nextVideo.currentTime = 0;
        nextVideo.play().catch(()=>{});
      }

      dots.forEach((d,i)=> d.classList.toggle('is-active', i === (current % dots.length)));
    }

    setInterval(() => goTo(current + 1), SLIDE_DURATION);
  })();


  /* =========================================================
     SECTION 2 — STATS BAR: "calculating" random-number effect
     Runs once, only when section first enters viewport.
  ========================================================= */
  (function statsCounter(){
    const section = document.querySelector('.stats-bar');
    const statNumbers = document.querySelectorAll('.stat-number');
    if (!section || !statNumbers.length) return;

    const activeTimers = new Map();

    function randomizeAndSettle(el){
      if (activeTimers.has(el)) clearInterval(activeTimers.get(el));

      const target = parseInt(el.getAttribute('data-target'), 10);
      const totalDuration = 2000; // ~2s of "calculating"
      const intervalStep = 45;
      const steps = Math.floor(totalDuration / intervalStep);
      let count = 0;

      const timer = setInterval(() => {
        count++;
        if (count < steps) {
          const volatility = Math.max(target * 2, 20);
          const rand = Math.floor(Math.random() * volatility);
          el.textContent = rand + '+';
        } else {
          clearInterval(timer);
          activeTimers.delete(el);
          el.textContent = target + '+';
        }
      }, intervalStep);
      activeTimers.set(el, timer);
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          statNumbers.forEach(el => randomizeAndSettle(el));
        } else {
          // reset so it plays again fresh next time it enters
          statNumbers.forEach(el => {
            if (activeTimers.has(el)) { clearInterval(activeTimers.get(el)); activeTimers.delete(el); }
            el.textContent = '0+';
          });
        }
      });
    }, { threshold: 0.4 });

    io.observe(section);
  })();


  /* =========================================================
     SECTION 3 — WHO WE ARE
     - video autoplay when section enters view
     - images fade-in + slight scale + subtle motion
     - text slides left -> right with staggered delay
  ========================================================= */
  (function whoWeAre(){
    const section = document.querySelector('.who-we-are');
    if (!section) return;

    const video = section.querySelector('.item-video');
    const images = section.querySelectorAll('.item-img-1, .item-img-2, .item-img-3');
    const textEls = section.querySelectorAll('.whoweare-text > *');

    if (!hasGSAP) {
      images.forEach(el => el.classList.add('reveal-img'));
      textEls.forEach(el => el.classList.add('reveal-slide-x'));
    }

    function reset(){
      if (hasGSAP) {
        gsap.set(images, { opacity: 0, y: 28, scale: 0.94 });
        gsap.set(textEls, { opacity: 0, x: -50 });
      } else {
        images.forEach(el => el.classList.remove('is-visible'));
        textEls.forEach(el => el.classList.remove('is-visible'));
      }
    }
    function play(){
      if (video) { video.currentTime = 0; video.play().catch(()=>{}); }

      if (hasGSAP) {
        gsap.to(images, { opacity: 1, y: 0, scale: 1, duration: 1.1, ease: 'power2.out', stagger: 0.18 });
        gsap.to(textEls, { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out', stagger: 0.15 });
      } else {
        images.forEach((el,i) => setTimeout(()=> el.classList.add('is-visible'), i*150));
        textEls.forEach((el,i) => setTimeout(()=> el.classList.add('is-visible'), i*130));
      }
    }

    reset();
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          play();
        } else {
          if (video) video.pause();
          reset();
        }
      });
    }, { threshold: 0.25 });

    io.observe(section);
  })();


  /* =========================================================
     SECTION 4 — SERVICES
     - hover: play card video; mouseleave: pause + reset to start
     - click: 3D flip (front <-> back); click again to return
  ========================================================= */
  (function servicesCards(){
    const cards = document.querySelectorAll('.service-card');
    if (!cards.length) return;

    cards.forEach(card => {
      const video = card.querySelector('.card-video');

      card.addEventListener('mouseenter', () => {
        if (video) { video.currentTime = 0; video.play().catch(()=>{}); }
      });
      card.addEventListener('mouseleave', () => {
        if (video) { video.pause(); video.currentTime = 0; }
      });

      card.addEventListener('click', () => {
        card.classList.toggle('is-flipped');
      });
    });
  })();


  /* =========================================================
     SECTION 5 — TESTIMONIALS: horizontal carousel
     autoplay, loop, manual nav via dots, smooth transitions
  ========================================================= */
  (function testimonialsCarousel(){
    const track = document.querySelector('.testimonials-track');
    const dotsWrap = document.querySelector('.testimonials-dots');
    if (!track) return;

    const slides = track.querySelectorAll('.testimonial-card');
    const total = slides.length;
    // with 2 or fewer testimonials, show them side by side (CSS grid) — no sliding needed
    if (total <= 2) return;

    track.classList.add('is-sliding');
    let current = 0;
    let autoplayTimer = null;
    const AUTOPLAY_MS = 6000;

    slides.forEach((_, i) => {
      const dot = document.createElement('span');
      dot.className = 't-dot' + (i === 0 ? ' is-active' : '');
      dot.addEventListener('click', () => goTo(i, true));
      dotsWrap.appendChild(dot);
    });
    const dotEls = dotsWrap.querySelectorAll('.t-dot');

    function goTo(index, userTriggered){
      current = (index + total) % total;
      track.style.transform = `translateX(-${current * 100}%)`;
      dotEls.forEach((d,i)=> d.classList.toggle('is-active', i === current));
      if (userTriggered) restartAutoplay();
    }

    function restartAutoplay(){
      if (autoplayTimer) clearInterval(autoplayTimer);
      autoplayTimer = setInterval(() => goTo(current + 1), AUTOPLAY_MS);
    }

    restartAutoplay();

    let startX = 0;
    track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, {passive:true});
    track.addEventListener('touchend', e => {
      const diff = e.changedTouches[0].clientX - startX;
      if (Math.abs(diff) > 40) goTo(current + (diff < 0 ? 1 : -1), true);
    }, {passive:true});
  })();


  /* =========================================================
     SECTION 6 — CONTACT US: content slides left -> right,
     fade in, ease out, when section enters viewport
  ========================================================= */
  (function contactReveal(){
    const section = document.querySelector('.contact');
    if (!section) return;

    const items = section.querySelectorAll('.contact-left > *, .contact-right > *');

    if (!hasGSAP) {
      items.forEach(el => el.classList.add('reveal-slide-x'));
    }

    function reset(){
      if (hasGSAP) {
        gsap.set(items, { opacity: 0, x: -50 });
      } else {
        items.forEach(el => el.classList.remove('is-visible'));
      }
    }
    function play(){
      if (hasGSAP) {
        gsap.to(items, { opacity: 1, x: 0, duration: 1, ease: 'power3.out', stagger: 0.12 });
      } else {
        items.forEach((el,i) => setTimeout(()=> el.classList.add('is-visible'), i*120));
      }
    }

    reset();
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { play(); } else { reset(); }
      });
    }, { threshold: 0.25 });

    io.observe(section);
  })();

});
