/**
 * ============================================
 * GSAP Scroll Animations
 * ============================================
 * 
 * Creates smooth scroll-triggered animations for:
 * - Section reveals
 * - Element stagger effects
 * - Parallax movements
 * - Navbar state changes
 */

(function () {
    'use strict';

    // Wait for GSAP to be available
    if (typeof gsap === 'undefined') {
        console.warn('GSAP not loaded');
        return;
    }

    // Register GSAP plugins
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

    // ============================================
    // Initial States
    // ============================================

    // Set initial states for animated elements
    gsap.set('.section-header', { opacity: 0, y: 50 });
    gsap.set('.problem-card', { opacity: 0, y: 50 });
    gsap.set('.feature-item', { opacity: 0, x: -50 });
    gsap.set('.flow-step', { opacity: 0, y: 50 });
    gsap.set('.tech-card', { opacity: 0, scale: 0.8 });
    gsap.set('.solution-image-frame', { opacity: 0, scale: 0.9 });
    gsap.set('.cta-content', { opacity: 0, y: 50 });

    // ============================================
    // Navbar Scroll Effect
    // ============================================

    ScrollTrigger.create({
        start: 'top -50',
        onUpdate: (self) => {
            const navbar = document.getElementById('navbar');
            if (navbar) {
                if (self.progress > 0) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
            }
        }
    });

    // ============================================
    // Section Headers Animation
    // ============================================

    gsap.utils.toArray('.section-header').forEach((header) => {
        gsap.to(header, {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: header,
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            }
        });
    });

    // ============================================
    // Problem Cards Stagger
    // ============================================

    gsap.to('.problem-card', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '.problem-grid',
            start: 'top 75%',
            toggleActions: 'play none none reverse'
        }
    });

    // ============================================
    // Solution Section Animations
    // ============================================

    // Solution image
    gsap.to('.solution-image-frame', {
        opacity: 1,
        scale: 1,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '.solution-content',
            start: 'top 70%',
            toggleActions: 'play none none reverse'
        }
    });

    // Feature items stagger
    gsap.to('.feature-item', {
        opacity: 1,
        x: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '.solution-features',
            start: 'top 70%',
            toggleActions: 'play none none reverse'
        }
    });

    // ============================================
    // Flow Timeline Animation
    // ============================================

    gsap.utils.toArray('.flow-step').forEach((step, index) => {
        gsap.to(step, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: step,
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            }
        });

        // Animate the number badge
        const number = step.querySelector('.flow-number');
        if (number) {
            gsap.from(number, {
                scale: 0,
                duration: 0.5,
                delay: 0.3,
                ease: 'back.out(1.7)',
                scrollTrigger: {
                    trigger: step,
                    start: 'top 80%',
                    toggleActions: 'play none none reverse'
                }
            });
        }
    });

    // Animate the flow line
    const flowLine = document.querySelector('.flow-line');
    if (flowLine) {
        gsap.fromTo(flowLine,
            { scaleY: 0, transformOrigin: 'top' },
            {
                scaleY: 1,
                duration: 2,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: '.flow-timeline',
                    start: 'top 70%',
                    end: 'bottom 50%',
                    scrub: 1
                }
            }
        );
    }

    // ============================================
    // Technology Cards Animation
    // ============================================

    gsap.to('.tech-card', {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        stagger: {
            amount: 0.8,
            grid: 'auto',
            from: 'center'
        },
        ease: 'back.out(1.2)',
        scrollTrigger: {
            trigger: '.tech-grid',
            start: 'top 75%',
            toggleActions: 'play none none reverse'
        }
    });

    // ============================================
    // CTA Section Animation
    // ============================================

    gsap.to('.cta-content', {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '.cta-section',
            start: 'top 70%',
            toggleActions: 'play none none reverse'
        }
    });

    // Animate CTA glow
    const ctaGlow = document.querySelector('.cta-glow');
    if (ctaGlow) {
        gsap.to(ctaGlow, {
            scale: 1.2,
            opacity: 0.8,
            duration: 3,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
        });
    }

    // ============================================
    // Parallax Effects
    // ============================================

    // Hero floating elements parallax
    gsap.utils.toArray('.float-icon').forEach((icon, index) => {
        gsap.to(icon, {
            y: -100 * (index % 3 + 1),
            scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: 'bottom top',
                scrub: 1
            }
        });
    });

    // ============================================
    // Smooth Scroll for Anchor Links
    // ============================================

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                gsap.to(window, {
                    duration: 1,
                    scrollTo: {
                        y: target,
                        offsetY: 80
                    },
                    ease: 'power3.inOut'
                });
            }
        });
    });

    // ============================================
    // Hero Content Fade Out on Scroll
    // ============================================

    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        gsap.to(heroContent, {
            opacity: 0,
            y: -50,
            scrollTrigger: {
                trigger: '.hero',
                start: 'center center',
                end: 'bottom top',
                scrub: 1
            }
        });
    }

    // ============================================
    // Refresh ScrollTrigger on Load
    // ============================================

    window.addEventListener('load', () => {
        ScrollTrigger.refresh();
    });

    // Handle dynamic content
    window.addEventListener('resize', () => {
        ScrollTrigger.refresh();
    });

})();
