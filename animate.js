<script>
(function () {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.matchMedia && window.matchMedia("(max-width: 991px)").matches) return;
  if (!window.Lenis) return;

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  window.lenis = new Lenis({
    duration: 1.2,
    lerp: 0.08,
    easing: function (t) {
      return Math.min(1, 1.001 - Math.pow(2, -10 * t));
    }
  });

  if (window.ScrollTrigger) {
    window.lenis.on("scroll", ScrollTrigger.update);

    requestAnimationFrame(function () {
      ScrollTrigger.refresh();
    });
  }

  function raf(time) {
    window.lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
})();
</script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js"></script>
<script>
  (function () {
    var TRANSITION_DURATION = 120;
    var fader = document.getElementById("page-fader");

    function hideFader() {
      if (!fader) return;
      fader.classList.add("is-hidden");
    }

    function showFader(callback) {
      if (!fader) {
        if (typeof callback === "function") callback();
        return;
      }
      fader.classList.remove("is-hidden");
      if (typeof callback === "function") {
        setTimeout(callback, TRANSITION_DURATION);
      }
    }

    window.addEventListener("DOMContentLoaded", function () {
      setTimeout(hideFader, 20);
    });

    window.addEventListener("pageshow", function (event) {
      if (event.persisted) {
        hideFader();
      }
    });

    document.addEventListener("click", function (event) {
      var link = event.target.closest("a");
      if (!link) return;

      var href = link.getAttribute("href");
      if (!href) return;


      if (
        href.charAt(0) === "#" ||                
        href.indexOf("mailto:") === 0 ||         
        href.indexOf("tel:") === 0 ||            
        link.target === "_blank" ||               
        link.host !== window.location.host ||     
        href === window.location.pathname ||     
        href === window.location.href            
      ) {
        return;
      }

      event.preventDefault();

      showFader(function () {
        window.location.href = href;
      });
    });
  })();
</script>
<script>
gsap.registerPlugin(ScrollTrigger);

function initFooterParallax(){
  document.querySelectorAll('[data-footer-parallax]').forEach(el => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: 'clamp(top bottom)',
        end: 'clamp(top top)',
        scrub: true
      }
    });
  
    const inner = el.querySelector('[data-footer-parallax-inner]');
    const dark  = el.querySelector('[data-footer-parallax-dark]');
  
    if (inner) {
      tl.from(inner, {
        yPercent: -25,
        ease: 'linear'
      });
    }
  
    if (dark) {
      tl.from(dark, {
        opacity: 0.5,
        ease: 'linear'
      }, '<');
    }
  });
}
document.addEventListener('DOMContentLoaded', () => {
  initFooterParallax();
});</script>
