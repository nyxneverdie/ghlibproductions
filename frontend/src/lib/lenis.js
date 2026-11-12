import Lenis from "lenis";

let lenis = null;

export function initLenis() {
  if (lenis) return lenis;
  lenis = new Lenis({ duration: 1.15, smoothWheel: true });
  function raf(time) {
    if (!lenis) return;
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
  return lenis;
}

export function destroyLenis() {
  if (lenis) {
    lenis.destroy();
    lenis = null;
  }
}

export function scrollToTarget(selector) {
  if (lenis) {
    lenis.scrollTo(selector, { offset: -72 });
  } else {
    document.querySelector(selector)?.scrollIntoView({ behavior: "smooth" });
  }
}
