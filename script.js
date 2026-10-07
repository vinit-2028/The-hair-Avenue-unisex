/* =========================================================
   Salon Studio — Site Interactions
   Sections:
   1. Mobile menu toggle
   2. Scroll reveal (IntersectionObserver)
   3. Booking modal (open/close, validation, WhatsApp submit)
   4. Gallery lightbox
   5. Testimonials carousel
   6. Contact form (validation, WhatsApp submit)
   ========================================================= */

const WHATSAPP_NUMBER = '919595073807';

// TODO: Replace with your real Formspree endpoint.
// Sign up free at https://formspree.io -> create a new form -> copy the
// endpoint it gives you (looks like https://formspree.io/f/xxxxabcd) and
// paste it below. Until you do, the booking form will show a friendly
// error and fall back to the WhatsApp link so nothing is ever lost.
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID';

/**
 * Submits a plain object of form values to Formspree as JSON.
 * Returns true on success, false on any failure (network, bad endpoint, etc).
 */
async function submitToFormspree(data, subject) {
    if (FORMSPREE_ENDPOINT.includes('YOUR_FORM_ID')) {
        // Endpoint hasn't been configured yet.
        return false;
    }
    try {
        const response = await fetch(FORMSPREE_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ ...data, _subject: subject })
        });
        return response.ok;
    } catch (err) {
        return false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initScrollReveal();
    initBookingModal();
    initGalleryLightbox();
    initTestimonialsCarousel();
    initContactForm();
});

/* ---------------------------------------------------------
   Helper: Body Scroll Locking for Modals & Mobile Menu
--------------------------------------------------------- */
let scrollLockCount = 0;
let scrollPosition = 0;

function lockScroll() {
    scrollLockCount++;
    if (scrollLockCount === 1) {
        scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        document.documentElement.classList.add('is-scroll-locked');
        document.body.classList.add('is-scroll-locked');
        document.body.style.top = `-${scrollPosition}px`;
    }
}

function unlockScroll() {
    scrollLockCount = Math.max(0, scrollLockCount - 1);
    if (scrollLockCount === 0) {
        document.documentElement.classList.remove('is-scroll-locked');
        document.body.classList.remove('is-scroll-locked');
        document.body.style.top = '';
        window.scrollTo(0, scrollPosition);
    }
}

/* ---------------------------------------------------------
   1. Mobile Menu Toggle
--------------------------------------------------------- */
function initMobileMenu() {
    const menuBtn = document.querySelector('.site-header__menu');
    const header = document.querySelector('.site-header');
    const nav = document.querySelector('.site-header__nav');
    const overlay = document.querySelector('.site-header__overlay');

    if (!menuBtn || !header) return;

    function closeMenu() {
        header.classList.remove('nav-open');
        document.body.classList.remove('nav-open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.textContent = 'Menu';
        unlockScroll();
    }

    function openMenu() {
        header.classList.add('nav-open');
        document.body.classList.add('nav-open');
        menuBtn.setAttribute('aria-expanded', 'true');
        menuBtn.textContent = 'Close';
        lockScroll();
    }

    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (header.classList.contains('nav-open')) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    if (overlay) {
        overlay.addEventListener('click', closeMenu);
        overlay.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
    }

    document.addEventListener('click', (e) => {
        if (header.classList.contains('nav-open')) {
            if (nav && !nav.contains(e.target) && e.target !== menuBtn && !menuBtn.contains(e.target)) {
                closeMenu();
            }
        }
    });

    header.querySelectorAll('.site-header__nav a').forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && header.classList.contains('nav-open')) {
            closeMenu();
        }
    });
}

/* ---------------------------------------------------------
   2. Scroll Reveal
--------------------------------------------------------- */
function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.fade-reveal').forEach(el => observer.observe(el));
}

/* ---------------------------------------------------------
   3. Booking Modal
--------------------------------------------------------- */
function initBookingModal() {
    const modal = document.getElementById('booking-modal');
    const form = document.getElementById('booking-form');
    const successPanel = document.getElementById('booking-success');
    if (!modal || !form) return;

    const dateInput = document.getElementById('booking-date');
    const serviceSelect = document.getElementById('booking-service');
    let lastFocusedTrigger = null;

    // Prevent booking a date in the past
    const today = new Date();
    dateInput.min = today.toISOString().split('T')[0];

    // Wire up every element with data-book-trigger to open the modal
    document.querySelectorAll('[data-book-trigger]').forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            lastFocusedTrigger = trigger;

            const presetService = trigger.getAttribute('data-service');
            resetBookingForm();

            if (presetService) {
                const match = Array.from(serviceSelect.options)
                    .find(opt => opt.value === presetService);
                if (match) serviceSelect.value = presetService;
            }

            openModal();
        });
    });

    function openModal() {
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        lockScroll();

        // Focus the first empty required field, or the close button
        const firstField = serviceSelect.value
            ? document.getElementById('booking-name')
            : serviceSelect;
        setTimeout(() => firstField && firstField.focus(), 50);

        document.addEventListener('keydown', onModalKeydown);
    }

    function closeModal() {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        unlockScroll();
        document.removeEventListener('keydown', onModalKeydown);

        if (lastFocusedTrigger) lastFocusedTrigger.focus();

        // Reset to the form view for next time, after the closing transition
        setTimeout(() => {
            form.hidden = false;
            successPanel.hidden = true;
        }, 250);
    }

    // Prevent touch dragging on modal backdrop from scrolling background page
    modal.addEventListener('touchmove', (e) => {
        if (e.target === modal || e.target.classList.contains('booking-modal__backdrop')) {
            e.preventDefault();
        }
    }, { passive: false });

    function resetBookingForm() {
        form.reset();
        form.querySelectorAll('.booking-form__error').forEach(el => el.textContent = '');
        form.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
        generalError.textContent = '';
        submitBtn.disabled = false;
        submitLabel.textContent = 'Send Booking Request';
        form.hidden = false;
        successPanel.hidden = true;
    }

    function onModalKeydown(e) {
        if (e.key === 'Escape') {
            closeModal();
            return;
        }
        if (e.key === 'Tab') trapFocus(e, modal.querySelector('.booking-modal__dialog'));
    }

    modal.querySelectorAll('[data-modal-close]').forEach(el => {
        el.addEventListener('click', closeModal);
    });

    const submitBtn = document.getElementById('booking-submit');
    const submitLabel = submitBtn.querySelector('.booking-form__submit-label');
    const generalError = document.createElement('p');
    generalError.className = 'booking-form__general-error';
    generalError.setAttribute('role', 'alert');
    submitBtn.insertAdjacentElement('afterend', generalError);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const values = {
            service: serviceSelect.value.trim(),
            name: document.getElementById('booking-name').value.trim(),
            email: document.getElementById('booking-email').value.trim(),
            phone: document.getElementById('booking-phone').value.trim(),
            date: dateInput.value,
            time: document.getElementById('booking-time').value,
            notes: document.getElementById('booking-notes').value.trim()
        };

        const errors = validateBookingForm(values);
        renderErrors(form, errors);
        generalError.textContent = '';

        if (Object.keys(errors).length > 0) {
            const firstErrorField = form.querySelector('.has-error');
            if (firstErrorField) firstErrorField.focus();
            return;
        }

        submitBtn.disabled = true;
        submitLabel.textContent = 'Sending…';

        const sentToFormspree = await submitToFormspree(
            values,
            `New booking request: ${values.service}`
        );

        submitBtn.disabled = false;
        submitLabel.textContent = 'Send Booking Request';

        const message = buildBookingMessage(values);
        const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
        const whatsappFallback = document.getElementById('booking-success-whatsapp');
        if (whatsappFallback) whatsappFallback.href = whatsappUrl;

        const successTitle = document.querySelector('#booking-success .booking-form__success-title');
        const successBody = document.getElementById('booking-success-body');
        const whatsappLinkLabel = whatsappFallback ? whatsappFallback.querySelector('span') : null;

        if (sentToFormspree) {
            successTitle.textContent = 'Request sent ✓';
            successBody.textContent = `We've received your request for ${values.service} and will confirm your slot shortly.`;
            if (whatsappLinkLabel) whatsappLinkLabel.textContent = 'Message us on WhatsApp too';
        } else {
            // Formspree isn't configured yet (or the request failed) — fall
            // back to WhatsApp so the booking is never lost. We still leave
            // the link below active as a manual retry in case the browser
            // blocked the automatic popup.
            window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
            successTitle.textContent = 'Request ready ✓';
            successBody.textContent = "We've opened WhatsApp with your appointment details. Send the message and we'll confirm your slot shortly.";
            if (whatsappLinkLabel) whatsappLinkLabel.textContent = 'Open WhatsApp to Send';
        }

        form.hidden = true;
        successPanel.hidden = false;
        successPanel.querySelector('.booking-form__success-close').focus();
    });
}

function validateBookingForm(values) {
    const errors = {};

    if (!values.service) errors['booking-service'] = 'Please select a service.';
    if (!values.name || values.name.length < 2) errors['booking-name'] = 'Please enter your name.';

    const digits = values.phone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(digits)) {
        errors['booking-phone'] = 'Enter a valid 10-digit mobile number.';
    }

    if (!values.date) {
        errors['booking-date'] = 'Please choose a date.';
    } else {
        const chosen = new Date(values.date + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (chosen < today) errors['booking-date'] = 'Date can\'t be in the past.';
    }

    if (!values.time) errors['booking-time'] = 'Please choose a time.';

    return errors;
}

function renderErrors(form, errors) {
    form.querySelectorAll('.booking-form__error, .contact-form__error').forEach(el => el.textContent = '');
    form.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));

    Object.entries(errors).forEach(([fieldId, message]) => {
        const errorEl = form.querySelector(`[data-error-for="${fieldId}"]`);
        const field = document.getElementById(fieldId);
        if (errorEl) errorEl.textContent = message;
        if (field) field.classList.add('has-error');
    });
}

function buildBookingMessage(values) {
    const prettyDate = new Date(values.date + 'T00:00:00').toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    let msg = `Hi, I'd like to request an appointment.\n\n`;
    msg += `Service: ${values.service}\n`;
    msg += `Name: ${values.name}\n`;
    msg += `Phone: ${values.phone}\n`;
    if (values.email) msg += `Email: ${values.email}\n`;
    msg += `Preferred Date: ${prettyDate}\n`;
    msg += `Preferred Time: ${values.time}\n`;
    if (values.notes) msg += `Notes: ${values.notes}\n`;

    return msg;
}

/* Basic focus trap used by both the booking modal and lightbox */
function trapFocus(e, container) {
    const focusable = container.querySelectorAll(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
    }
}

/* ---------------------------------------------------------
   4. Gallery Lightbox
--------------------------------------------------------- */
function initGalleryLightbox() {
    const triggers = Array.from(document.querySelectorAll('.gallery__trigger'));
    const lightbox = document.getElementById('gallery-lightbox');
    if (!triggers.length || !lightbox) return;

    const imageEl = document.getElementById('lightbox-image');
    const counterEl = document.getElementById('lightbox-counter');
    const prevBtn = lightbox.querySelector('[data-lightbox-prev]');
    const nextBtn = lightbox.querySelector('[data-lightbox-next]');

    const images = triggers.map(t => ({ src: t.src, alt: t.alt }));
    let currentIndex = 0;
    let lastFocusedTrigger = null;

    triggers.forEach((trigger, index) => {
        trigger.addEventListener('click', () => open(index, trigger));
        trigger.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                open(index, trigger);
            }
        });
    });

    function open(index, trigger) {
        currentIndex = index;
        lastFocusedTrigger = trigger;
        render();
        lightbox.classList.add('is-open');
        lightbox.setAttribute('aria-hidden', 'false');
        lockScroll();
        document.addEventListener('keydown', onKeydown);
        setTimeout(() => lightbox.querySelector('[data-lightbox-close]').focus(), 50);
    }

    function close() {
        lightbox.classList.remove('is-open');
        lightbox.setAttribute('aria-hidden', 'true');
        unlockScroll();
        document.removeEventListener('keydown', onKeydown);
        if (lastFocusedTrigger) lastFocusedTrigger.focus();
    }

    lightbox.addEventListener('touchmove', (e) => {
        if (e.target === lightbox || e.target.classList.contains('lightbox__backdrop')) {
            e.preventDefault();
        }
    }, { passive: false });

    function render() {
        const img = images[currentIndex];
        imageEl.src = img.src;
        imageEl.alt = img.alt;
        counterEl.textContent = `${currentIndex + 1} / ${images.length}`;
        preloadNeighbors();
    }

    // Preload the previous/next images so swiping or clicking through
    // feels instant instead of flashing a blank frame while it loads.
    function preloadNeighbors() {
        [currentIndex - 1, currentIndex + 1].forEach(i => {
            const wrapped = (i + images.length) % images.length;
            const preload = new Image();
            preload.src = images[wrapped].src;
        });
    }

    function showPrev() {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        render();
    }

    function showNext() {
        currentIndex = (currentIndex + 1) % images.length;
        render();
    }

    function onKeydown(e) {
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowLeft') showPrev();
        if (e.key === 'ArrowRight') showNext();
        if (e.key === 'Tab') trapFocus(e, lightbox);
    }

    lightbox.querySelectorAll('[data-lightbox-close]').forEach(el => el.addEventListener('click', close));
    prevBtn.addEventListener('click', showPrev);
    nextBtn.addEventListener('click', showNext);

    // Touch swipe support for mobile: swipe left/right to navigate.
    // Only counts as a swipe if it's mostly horizontal and past a
    // minimum distance, so it doesn't fight with normal scrolling/taps.
    const figure = lightbox.querySelector('.lightbox__figure');
    let touchStartX = 0;
    let touchStartY = 0;

    figure.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].clientX;
        touchStartY = e.changedTouches[0].clientY;
    }, { passive: true });

    figure.addEventListener('touchend', (e) => {
        const deltaX = e.changedTouches[0].clientX - touchStartX;
        const deltaY = e.changedTouches[0].clientY - touchStartY;
        const SWIPE_THRESHOLD = 40;

        if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX < 0) showNext();
            else showPrev();
        }
    }, { passive: true });
}

/* ---------------------------------------------------------
   5. Testimonials Carousel
--------------------------------------------------------- */
function initTestimonialsCarousel() {
    const carousel = document.getElementById('testimonials-carousel');
    const track = document.getElementById('testimonials-track');
    const dotsContainer = document.getElementById('testimonials-dots');
    if (!carousel || !track || !dotsContainer) return;

    const slides = Array.from(track.children);
    const prevBtn = document.getElementById('testimonials-prev');
    const nextBtn = document.getElementById('testimonials-next');
    const playPauseBtn = document.getElementById('testimonials-playpause');
    const liveRegion = document.getElementById('testimonials-live');

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let autoplayTimer = null;
    let isPaused = prefersReducedMotion;
    const AUTOPLAY_MS = 3500;

    // Generate dots dynamically to match slide count
    dotsContainer.innerHTML = '';
    slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'testimonials__dot';
        if (i === 0) {
            dot.classList.add('is-active');
            dot.setAttribute('aria-selected', 'true');
        } else {
            dot.setAttribute('aria-selected', 'false');
        }
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
        dot.addEventListener('click', () => {
            const slideWidth = slides[0].offsetWidth;
            track.scrollTo({ left: i * slideWidth, behavior: 'smooth' });
            startAutoplay();
        });
        dotsContainer.appendChild(dot);
    });
    const dots = Array.from(dotsContainer.children);

    function updateDots() {
        const slideWidth = slides[0].offsetWidth;
        if (!slideWidth) return;
        
        let index = Math.round(track.scrollLeft / slideWidth);
        index = Math.max(0, Math.min(index, slides.length - 1));
        
        dots.forEach((dot, i) => {
            dot.classList.toggle('is-active', i === index);
            dot.setAttribute('aria-selected', i === index ? 'true' : 'false');
        });

        if (liveRegion) {
            liveRegion.textContent = `Testimonial group ${index + 1}`;
        }
    }

    track.addEventListener('scroll', updateDots, { passive: true });
    window.addEventListener('resize', updateDots, { passive: true });

    function autoScroll() {
        if (isPaused) return;
        const maxScroll = track.scrollWidth - track.clientWidth;
        
        if (track.scrollLeft >= maxScroll - 10) {
            track.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
            const slideWidth = slides[0].offsetWidth;
            track.scrollBy({ left: slideWidth, behavior: 'smooth' });
        }
    }

    function startAutoplay() {
        stopAutoplay();
        if (isPaused) return;
        autoplayTimer = setInterval(autoScroll, AUTOPLAY_MS);
    }

    function stopAutoplay() {
        if (autoplayTimer) clearInterval(autoplayTimer);
        autoplayTimer = null;
    }

    function setPaused(paused) {
        isPaused = paused;
        if (playPauseBtn) {
            playPauseBtn.setAttribute('aria-pressed', String(paused));
            playPauseBtn.setAttribute('aria-label', paused ? 'Play auto-rotating testimonials' : 'Pause auto-rotating testimonials');
            const icon = playPauseBtn.querySelector('span') || playPauseBtn;
            if (icon.id === 'testimonials-playpause-icon') {
                icon.innerHTML = paused ? '&#9654;' : '&#10073;&#10073;';
            }
        }
        if (paused) stopAutoplay();
        else startAutoplay();
    }

    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', () => setPaused(!isPaused));
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            track.scrollBy({ left: -slides[0].offsetWidth, behavior: 'smooth' });
            startAutoplay();
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            track.scrollBy({ left: slides[0].offsetWidth, behavior: 'smooth' });
            startAutoplay();
        });
    }

    carousel.addEventListener('mouseenter', stopAutoplay);
    carousel.addEventListener('mouseleave', () => { if (!isPaused) startAutoplay(); });
    carousel.addEventListener('focusin', stopAutoplay);
    carousel.addEventListener('focusout', () => { if (!isPaused) startAutoplay(); });
    track.addEventListener('touchstart', stopAutoplay, { passive: true });
    track.addEventListener('touchend', () => { if (!isPaused) startAutoplay(); }, { passive: true });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stopAutoplay();
        else if (!isPaused) startAutoplay();
    });

    startAutoplay();
    setPaused(prefersReducedMotion);
}

/* ---------------------------------------------------------
   6. Contact Form
--------------------------------------------------------- */
function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const noteEl = document.getElementById('contact-form-note');
    const submitBtn = document.getElementById('contact-submit');
    const submitLabel = submitBtn.querySelector('.contact-form__submit-label');
    const whatsappFallback = document.getElementById('contact-whatsapp-fallback');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const values = {
            name: document.getElementById('contact-name').value.trim(),
            phone: document.getElementById('contact-phone').value.trim(),
            message: document.getElementById('contact-message').value.trim()
        };

        const errors = {};
        if (!values.name || values.name.length < 2) errors['contact-name'] = 'Please enter your name.';

        const digits = values.phone.replace(/\D/g, '').slice(-10);
        if (!/^[6-9]\d{9}$/.test(digits)) {
            errors['contact-phone'] = 'Enter a valid 10-digit mobile number.';
        }

        if (!values.message || values.message.length < 5) {
            errors['contact-message'] = 'Tell us a little about what you need.';
        }

        renderErrors(form, errors);
        noteEl.textContent = '';
        whatsappFallback.hidden = true;
        whatsappFallback.querySelector('span').textContent = 'Open WhatsApp to Send';

        if (Object.keys(errors).length > 0) {
            const firstErrorField = form.querySelector('.has-error');
            if (firstErrorField) firstErrorField.focus();
            return;
        }

        submitBtn.disabled = true;
        submitLabel.textContent = 'Sending…';

        const sentToFormspree = await submitToFormspree(
            values,
            `New contact message from ${values.name}`
        );

        submitBtn.disabled = false;
        submitLabel.textContent = 'Send Message';

        const message = `Hi, I have a question.\n\nName: ${values.name}\nPhone: ${values.phone}\nMessage: ${values.message}`;
        const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
        whatsappFallback.href = whatsappUrl;

        if (sentToFormspree) {
            noteEl.textContent = "Message sent — we'll get back to you shortly.";
            form.reset();
        } else {
            // Formspree isn't configured yet (or the request failed) — fall
            // back to WhatsApp so the message is never lost. Keep the link
            // visible too in case the automatic popup gets blocked.
            window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
            noteEl.textContent = "We've opened WhatsApp for you to send this message.";
            whatsappFallback.querySelector('span').textContent = 'Reopen WhatsApp to Send';
            whatsappFallback.hidden = false;
            form.reset();
        }
    });
}
