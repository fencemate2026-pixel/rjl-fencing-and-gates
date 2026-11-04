/* Animate once to the owner's recorded total; never invent additional jobs. */
(() => {
  const counters = document.querySelectorAll('[data-rjl-job-count]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const element = entry.target;
      observer.unobserve(element);
      const total = Number(element.dataset.total);
      if (!Number.isSafeInteger(total) || total < 0) return;
      const started = performance.now();
      element.textContent = '0';
      const frame = (now) => {
        const progress = Math.min(1, Math.max(0, (now - started) / 1600));
        const value = Math.round(total * (1 - Math.pow(1 - progress, 3)));
        element.textContent = value.toLocaleString('en-AU');
        if (progress < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
  }, { threshold: 0.4 });
  counters.forEach((counter) => observer.observe(counter));
})();
