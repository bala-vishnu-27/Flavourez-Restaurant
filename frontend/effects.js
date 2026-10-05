// ============================================================
//  effects.js  —  PREMIUM ANIMATIONS FOR FLAVOUREZ (All Pages)
//  Professional, smooth effects — no jumpy/bouncy behaviour
// ============================================================

(function () {
    'use strict';

    // ─── 1. SCROLL PROGRESS BAR ─────────────────────────────────────
    (function initScrollProgress() {
        const bar = document.createElement('div');
        bar.id = 'flz-scroll-bar';
        Object.assign(bar.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            height: '3px',
            width: '0%',
            background: 'linear-gradient(90deg, #ff8c00, #ff3d00)',
            zIndex: '999999',
            transition: 'width 0.08s linear',
            pointerEvents: 'none',
            boxShadow: '0 0 6px rgba(255,140,0,0.5)'
        });
        document.body.appendChild(bar);

        window.addEventListener('scroll', () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            bar.style.width = pct + '%';
        }, { passive: true });
    })();

    // ─── NOTE: Custom cursor REMOVED (user request) ─────────────────

    // ─── 2. FLOATING AMBIENT PARTICLES (Hero + Offer sections) ─────
    (function initFloatingParticles() {
        const targets = document.querySelectorAll('.hero-banner, .offer-banner, .stats, .combos-tab-inner, .combo-section');
        targets.forEach(section => {
            section.style.position = 'relative';
            section.style.overflow = 'hidden';
            const count = 10;
            for (let i = 0; i < count; i++) {
                const orb = document.createElement('div');
                orb.className = 'flz-orb';
                const size = Math.random() * 5 + 2;
                const x = Math.random() * 100;
                const dur = Math.random() * 10 + 8;
                const del = Math.random() * 6;
                const op = Math.random() * 0.18 + 0.05;
                Object.assign(orb.style, {
                    position: 'absolute',
                    width: size + 'px', height: size + 'px',
                    borderRadius: '50%',
                    background: Math.random() > 0.5
                        ? 'radial-gradient(circle, #ff8c00, transparent)'
                        : 'radial-gradient(circle, #ff3d00, transparent)',
                    left: x + '%',
                    top: '110%',
                    opacity: op,
                    pointerEvents: 'none',
                    animation: `flz-float-up ${dur}s ${del}s linear infinite`,
                    zIndex: '1'
                });
                section.appendChild(orb);
            }
        });
    })();

    // ─── 3. 3D CURSOR HOVER TILT & SCALE ZOOM ENGINE ──────────
    (function initTilt() {
        document.addEventListener('mousemove', (e) => {
            const card = e.target.closest('.dish-card, .home-dish-card, .testimonial-card, .combo-card, .promo-card');
            if (!card) return;

            const rect = card.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = (e.clientX - cx) / (rect.width / 2);
            const dy = (e.clientY - cy) / (rect.height / 2);

            const rotX = dy * -10;
            const rotY = dx * 10;
            const isDish = card.classList.contains('dish-card') || card.classList.contains('home-dish-card');
            const scale = isDish ? '1.06' : '1.03';

            card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(${scale}, ${scale}, ${scale}) translateZ(12px)`;
            card.style.boxShadow = `${-dx * 12}px ${-dy * 12}px 30px rgba(255, 140, 0, 0.35)`;
            card.style.transition = 'box-shadow 0.1s ease, transform 0.1s ease-out';
        });

        document.addEventListener('mouseout', (e) => {
            const card = e.target.closest('.dish-card, .home-dish-card, .testimonial-card, .combo-card, .promo-card');
            if (card && (!e.relatedTarget || !card.contains(e.relatedTarget))) {
                card.style.transform = '';
                card.style.boxShadow = '';
                card.style.transition = 'transform 0.4s ease, box-shadow 0.4s ease';
            }
        });
    })();

    // ─── 4. SMOOTH RIPPLE ON BUTTON CLICK (no bounce/jump) ──────────
    // Removed: particle burst, scale bounce — professional ripple only
    (function initButtonRipple() {
        const btns = document.querySelectorAll(
            '.btn-primary, .btn-secondary, .btn-small, .btn-order, .add-btn, .combo-add-btn, .tab-btn, #trackBtn'
        );

        btns.forEach(btn => {
            // Ensure overflow hidden for ripple to stay inside
            if (getComputedStyle(btn).position === 'static') {
                btn.style.position = 'relative';
            }
            btn.style.overflow = 'hidden';

            btn.addEventListener('click', function (e) {
                // Remove old ripples
                const old = btn.querySelector('.flz-ripple');
                if (old) old.remove();

                const ripple = document.createElement('span');
                ripple.className = 'flz-ripple';

                const rect = btn.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height) * 2;
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;

                Object.assign(ripple.style, {
                    position: 'absolute',
                    width: size + 'px',
                    height: size + 'px',
                    left: x + 'px',
                    top: y + 'px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.28)',
                    transform: 'scale(0)',
                    pointerEvents: 'none',
                    animation: 'flz-ripple-expand 0.55s ease-out forwards'
                });

                btn.appendChild(ripple);
                setTimeout(() => ripple.remove(), 600);
            });
        });
    })();

    // ─── 5. SUBTLE HOVER LIFT ON NAV LINKS (no magnetic jump) ───────
    // NOTE: Magnetic effect REMOVED — simple underline glow instead
    (function initNavHover() {
        const navLinks = document.querySelectorAll('.main-header nav ul li a');
        navLinks.forEach(link => {
            link.style.transition = 'color 0.3s ease, transform 0.3s ease';
            link.style.display = 'inline-block';

            link.addEventListener('mouseenter', () => {
                link.style.transform = 'translateY(-2px)';
            });
            link.addEventListener('mouseleave', () => {
                link.style.transform = 'translateY(0px)';
            });
        });
    })();

    // ─── 6. STAGGER SCROLL REVEAL ────────────────────────────────────
    (function initStaggerReveal() {
        const grids = document.querySelectorAll('.dish-grid, .testimonial-grid, .timeline, .combo-grid');
        grids.forEach(grid => {
            Array.from(grid.children).forEach((child, i) => {
                if (!child.classList.contains('flz-stagger')) {
                    child.classList.add('flz-stagger');
                    child.style.setProperty('--stagger-i', i);
                }
            });
        });

        // Feature boxes — simple fade up, no translate-to-center
        const featureBoxes = document.querySelectorAll('.feature-box');
        featureBoxes.forEach((box, i) => {
            box.classList.add('flz-stagger');
            box.style.setProperty('--stagger-i', i);
        });

        const staggerObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('flz-stagger-visible');
                    staggerObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.flz-stagger').forEach(el => staggerObserver.observe(el));
    })();

    // ─── 7. PARALLAX ON DARK SECTIONS ────────────────────────────────
    (function initSectionParallax() {
        const parallaxSections = document.querySelectorAll('.stats, .offer-banner');
        if (!parallaxSections.length) return;

        function updateParallax() {
            parallaxSections.forEach(sec => {
                const rect = sec.getBoundingClientRect();
                const center = rect.top + rect.height / 2 - window.innerHeight / 2;
                const shift = center * 0.06;
                sec.style.backgroundPositionY = `calc(50% + ${shift}px)`;
            });
        }

        window.addEventListener('scroll', updateParallax, { passive: true });
        updateParallax();
    })();

    // ─── 8. HEADING FADE-IN (no letter-spacing jump, no spacing issue) ──
    (function initHeadingReveal() {
        const headings = document.querySelectorAll(
            '.specials h2, .testimonials h2, .timeline-section h2, .offer-banner h3, .combo-section h2'
        );

        const obs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('flz-heading-visible');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.4 });

        headings.forEach(h => {
            h.classList.add('flz-heading-hidden');
            obs.observe(h);
        });
    })();

    // ─── 9. BUTTON HOVER GLOW (smooth, no pulse animation) ──────────
    (function initButtonGlow() {
        const allBtns = document.querySelectorAll(
            '.btn-primary, .btn-small, .btn-order, .add-btn, .combo-add-btn'
        );
        allBtns.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.boxShadow = '0 6px 22px rgba(255,140,0,0.45)';
                btn.style.filter = 'brightness(1.08)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.boxShadow = '';
                btn.style.filter = '';
            });
        });
    })();

    // ─── 10. COUNTER ENTRANCE FADE ──────────────────────────────────
    (function initCounterReveal() {
        const counters = document.querySelectorAll('.counter');
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('flz-count-in');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        counters.forEach(c => obs.observe(c));
    })();

    // ─── 11. IMAGE FADE-IN ON SCROLL ─────────────────────────────────
    (function initImageReveal() {
        const images = document.querySelectorAll('.dish-card img, .about-img img');
        const imgObs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('flz-img-reveal');
                    imgObs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        images.forEach(img => imgObs.observe(img));
    })();

    // ─── 12. SMART HEADER (Always fixed & visible on scroll) ──
    (function initHeaderScroll() {
        const header = document.querySelector('.main-header');
        if (!header) return;
        header.style.transform = 'translateY(0)';
    })();

    // ─── 13. HERO TEXT SHIMMER ────────────────────────────────────────
    (function initHeroShimmer() {
        const heroText = document.querySelector('.hero-big-text');
        if (!heroText) return;
        heroText.classList.add('flz-shimmer-text');
    })();

    // ─── INJECT CSS STYLES ───────────────────────────────────────────
    const style = document.createElement('style');
    style.textContent = `

    /* ── Floating particles ── */
    @keyframes flz-float-up {
        0%   { transform: translateY(0);    opacity: 0.12; }
        10%  { opacity: 0.18; }
        90%  { opacity: 0.1; }
        100% { transform: translateY(-115vh); opacity: 0; }
    }

    /* ── Smooth ripple on click ── */
    @keyframes flz-ripple-expand {
        from { transform: scale(0); opacity: 1; }
        to   { transform: scale(1); opacity: 0; }
    }

    /* ── Stagger reveal: simple fade-up, no horizontal drift ── */
    .flz-stagger {
        opacity: 0;
        transform: translateY(30px);
        transition:
            opacity  0.55s ease calc(var(--stagger-i, 0) * 0.09s),
            transform 0.55s ease calc(var(--stagger-i, 0) * 0.09s);
    }
    .flz-stagger.flz-stagger-visible {
        opacity: 1;
        transform: translateY(0);
    }

    /* ── Heading fade-in: NO letter-spacing change = no layout shift ── */
    .flz-heading-hidden {
        opacity: 0;
        transform: translateY(18px);
        transition: opacity 0.6s ease, transform 0.6s ease;
    }
    .flz-heading-visible {
        opacity: 1;
        transform: translateY(0);
    }

    /* ── Counter entrance ── */
    @keyframes flz-count-in {
        from { opacity: 0; transform: translateY(12px); }
        to   { opacity: 1; transform: translateY(0); }
    }
    .flz-count-in {
        animation: flz-count-in 0.5s ease forwards;
    }

    /* ── Image fade-in ── */
    @keyframes flz-img-fade {
        from { opacity: 0; transform: scale(1.04); }
        to   { opacity: 1; transform: scale(1); }
    }
    .dish-card img, .about-img img {
        opacity: 0;
        transition: none;
    }
    .flz-img-reveal {
        animation: flz-img-fade 0.6s ease forwards !important;
    }

    /* ── Hero shimmer text (smooth, no jump) ── */
    @keyframes flz-text-shimmer {
        0%   { background-position: 0% center; }
        100% { background-position: 200% center; }
    }
    .flz-shimmer-text {
        background: linear-gradient(90deg, #ff8c00, #ffe066, #ff3d00, #ff8c00) !important;
        background-size: 300% auto !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
        animation: heroPopIn 0.9s ease forwards, flz-text-shimmer 4s linear 1s infinite !important;
    }

    /* ── Smooth header transition ── */
    .main-header {
        transition: transform 0.35s cubic-bezier(0.4,0,0.2,1) !important;
    }

    /* ── Active nav page indicator ── */
    .main-header nav ul li a.active-page {
        color: #ff8c00 !important;
    }
    .main-header nav ul li a.active-page::after {
        width: 100% !important;
    }

    /* ── Testimonial quote mark ── */
    .testimonial-card {
        position: relative;
        overflow: hidden;
    }
    .testimonial-card::before {
        content: '"';
        position: absolute;
        top: -2px;
        left: 12px;
        font-size: 60px;
        color: rgba(255,140,0,0.1);
        font-family: Georgia, serif;
        line-height: 1;
        pointer-events: none;
    }

    /* ── Feature box: no tilt, just smooth hover lift ── */
    .feature-box {
        transition: transform 0.35s ease, box-shadow 0.35s ease !important;
    }
    .feature-box:hover {
        transform: translateY(-6px) !important;
        box-shadow: 0 10px 25px rgba(255,140,0,0.18) !important;
    }

    /* ── Dish card: clean hover lift (tilt is separate JS, gentle) ── */
    .dish-card {
        transition: transform 0.4s ease, box-shadow 0.4s ease !important;
    }
    `;
    document.head.appendChild(style);

    // ─── ACTIVE PAGE NAV HIGHLIGHT ───────────────────────────────────
    (function highlightActiveNav() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('.main-header nav ul li a').forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage || (currentPage === '' && href === 'index.html')) {
                link.classList.add('active-page');
            }
        });
    })();

    // ─── 14. FIGMA MULTI-LAYER PARALLAX SCROLL ENGINE ────────────────
    (function initFigmaParallax() {
        const parallaxElems = document.querySelectorAll('[data-parallax-speed]');
        if (!parallaxElems.length) return;

        let ticking = false;
        function updateParallax() {
            const scrolled = window.scrollY;
            parallaxElems.forEach(el => {
                const speed = parseFloat(el.getAttribute('data-parallax-speed')) || 0.2;
                const parent = el.parentElement;
                const parentTop = parent ? parent.offsetTop : 0;
                const offset = (scrolled - parentTop) * speed;
                el.style.transform = `translate3d(0, ${offset}px, 0)`;
            });
            ticking = false;
        }

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(updateParallax);
                ticking = true;
            }
        }, { passive: true });
        updateParallax();
    })();

    // ─── 15. MOUSE TRACKING PARALLAX ON HERO BANNER ──────────────────
    (function initMouseParallax() {
        const hero = document.querySelector('.hero-banner');
        if (!hero) return;

        const layers = hero.querySelectorAll('[data-mouse-speed]');
        if (!layers.length) return;

        hero.addEventListener('mousemove', (e) => {
            const rect = hero.getBoundingClientRect();
            const mouseX = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
            const mouseY = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);

            layers.forEach(layer => {
                const speed = parseFloat(layer.getAttribute('data-mouse-speed')) || 15;
                const x = mouseX * speed;
                const y = mouseY * speed;
                layer.style.transform = `translate3d(${x}px, ${y}px, 0)`;
            });
        });

        hero.addEventListener('mouseleave', () => {
            layers.forEach(layer => {
                layer.style.transform = `translate3d(0, 0, 0)`;
                layer.style.transition = 'transform 0.5s ease';
            });
        });
    })();

    // ─── 16. 3D DISH ZOOM & INSPECTION MODAL ENGINE ─────────────────
    (function initDishZoomModal() {
        let modal = document.getElementById('flzDishModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'flzDishModal';
            modal.className = 'flz-modal-overlay';
            modal.innerHTML = `
                <div class="flz-modal-box">
                    <button class="flz-modal-close" id="flzModalClose">&times;</button>
                    <div class="flz-modal-img-col">
                        <span class="flz-modal-badge" id="flzModalBadge">Signature Dish</span>
                        <img id="flzModalImg" src="" alt="Dish Image">
                    </div>
                    <div class="flz-modal-info-col">
                        <div>
                            <h3 class="flz-modal-title" id="flzModalTitle">Dish Name</h3>
                            <div class="flz-modal-meta-row">
                                <span class="flz-modal-price" id="flzModalPrice">₹0</span>
                                <span class="flz-modal-rating">⭐ <span id="flzModalRating">4.9</span> (150+ ratings)</span>
                            </div>
                            <p class="flz-modal-desc" id="flzModalDesc">Delicious dish crafted with authentic spices and fresh local ingredients.</p>
                            <div class="flz-modal-stats-grid">
                                <div class="flz-stat-pill">
                                    <span class="label">Prep Time</span>
                                    <span class="value" id="flzModalTime">20 mins</span>
                                </div>
                                <div class="flz-stat-pill">
                                    <span class="label">Spice Level</span>
                                    <span class="value" id="flzModalSpice">Medium</span>
                                </div>
                                <div class="flz-stat-pill">
                                    <span class="label">Calories</span>
                                    <span class="value" id="flzModalCals">380 kcal</span>
                                </div>
                            </div>
                        </div>
                        <div class="flz-modal-actions">
                            <div class="flz-qty-ctrl">
                                <button class="flz-qty-btn" id="flzQtyMinus">-</button>
                                <span class="flz-qty-val" id="flzQtyVal">1</span>
                                <button class="flz-qty-btn" id="flzQtyPlus">+</button>
                            </div>
                            <button class="flz-modal-add-btn" id="flzModalAddBtn">Add to Order &bull; <span id="flzModalTotalPrice">₹0</span></button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        const closeBtn = document.getElementById('flzModalClose');
        const imgEl = document.getElementById('flzModalImg');
        const titleEl = document.getElementById('flzModalTitle');
        const priceEl = document.getElementById('flzModalPrice');
        const descEl = document.getElementById('flzModalDesc');
        const badgeEl = document.getElementById('flzModalBadge');
        const timeEl = document.getElementById('flzModalTime');
        const spiceEl = document.getElementById('flzModalSpice');
        const calsEl = document.getElementById('flzModalCals');
        const qtyValEl = document.getElementById('flzQtyVal');
        const qtyMinusBtn = document.getElementById('flzQtyMinus');
        const qtyPlusBtn = document.getElementById('flzQtyPlus');
        const totalPriceEl = document.getElementById('flzModalTotalPrice');
        const addBtn = document.getElementById('flzModalAddBtn');

        let currentPriceNum = 0;
        let currentQty = 1;
        let currentDishName = '';

        function updateModalTotal() {
            const total = currentPriceNum * currentQty;
            totalPriceEl.textContent = `₹${total}`;
        }

        qtyMinusBtn.addEventListener('click', () => {
            if (currentQty > 1) {
                currentQty--;
                qtyValEl.textContent = currentQty;
                updateModalTotal();
            }
        });

        qtyPlusBtn.addEventListener('click', () => {
            currentQty++;
            qtyValEl.textContent = currentQty;
            updateModalTotal();
        });

        function openModal(dishData) {
            currentDishName = dishData.name || 'Signature Dish';
            currentPriceNum = parseInt(dishData.price) || 199;
            currentQty = 1;
            qtyValEl.textContent = '1';

            titleEl.textContent = currentDishName;
            priceEl.textContent = `₹${currentPriceNum}`;
            imgEl.src = dishData.img || 'Header.jpeg';
            descEl.textContent = dishData.desc || 'Freshly prepared with authentic handpicked spices and farm-fresh ingredients for an unforgettable taste.';
            badgeEl.textContent = dishData.tag || 'Chef Special';
            timeEl.textContent = dishData.time || '15-20 min';
            spiceEl.textContent = dishData.spice || '🔥🔥 Medium';
            calsEl.textContent = dishData.cals || '420 kcal';

            updateModalTotal();

            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeModal() {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }

        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
        });

        addBtn.addEventListener('click', () => {
            showToast(`Added ${currentQty}x ${currentDishName} (₹${currentPriceNum * currentQty}) to your order! 🛒`);
            closeModal();
        });

        function showToast(msg) {
            let toast = document.getElementById('flzToast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'flzToast';
                Object.assign(toast.style, {
                    position: 'fixed', bottom: '30px', right: '30px',
                    background: 'linear-gradient(135deg, #ff8c00, #ff3d00)',
                    color: '#fff', padding: '14px 26px', borderRadius: '30px',
                    fontWeight: '700', boxShadow: '0 10px 25px rgba(255,61,0,0.4)',
                    zIndex: '999999', transition: 'all 0.4s ease',
                    opacity: '0', transform: 'translateY(20px)'
                });
                document.body.appendChild(toast);
            }
            toast.textContent = msg;
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(20px)';
            }, 3200);
        }

        document.addEventListener('click', (e) => {
            const card = e.target.closest('.dish-card, .home-dish-card');
            if (card && !e.target.closest('.add-btn, .btn-small, .combo-add-btn, a')) {
                const img = card.querySelector('img');
                const title = card.querySelector('h4');
                const price = card.querySelector('.price, .home-dish-price');
                const desc = card.querySelector('.desc');

                const nameVal = title ? title.textContent.trim() : (card.getAttribute('data-name') || 'Signature Dish');
                const priceVal = price ? price.textContent.replace(/[^0-9]/g, '') : (card.getAttribute('data-price') || '199');
                const descText = desc ? desc.textContent.trim() : `Authentic ${nameVal} freshly prepared with handpicked spices and rich ingredients.`;

                const isVeg = card.getAttribute('data-type') === 'veg';

                openModal({
                    name: nameVal,
                    price: priceVal,
                    img: img ? img.src : 'Header.jpeg',
                    desc: descText,
                    tag: isVeg ? '🌿 100% Pure Veg' : '🔥 Chef Signature Non-Veg',
                    time: card.getAttribute('data-time') || (isVeg ? '10-15 min' : '18-22 min'),
                    spice: card.getAttribute('data-spice') || (isVeg ? '🌱 Mild Spice' : '🔥🔥 Medium Spice'),
                    cals: card.getAttribute('data-cals') || (isVeg ? '260 kcal' : '420 kcal')
                });
            }
        });

        window.openDishModal = openModal;
    })();

    // ─── 17. HOME DISH FILTER SWITCHER ───────────────────────────────
    (function initHomeDishFilter() {
        const btns = document.querySelectorAll('.home-filter-btn');
        const cards = document.querySelectorAll('.home-dish-card');
        if (!btns.length || !cards.length) return;

        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const cat = btn.getAttribute('data-filter');

                cards.forEach(card => {
                    const cardCat = card.getAttribute('data-category');
                    if (cat === 'all' || cardCat === cat) {
                        card.style.display = 'block';
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, 50);
                    } else {
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(20px)';
                        setTimeout(() => {
                            card.style.display = 'none';
                        }, 300);
                    }
                });
            });
        });
    })();

    // ─── 18. MEAL PAIRER COMBO CALCULATOR ─────────────────────────────
    (function initMealPairer() {
        const mainSel = document.getElementById('pairMain');
        const sideSel = document.getElementById('pairSide');
        const drinkSel = document.getElementById('pairDrink');
        const oldPriceEl = document.getElementById('pairOldPrice');
        const newPriceEl = document.getElementById('pairNewPrice');

        if (!mainSel || !sideSel || !drinkSel) return;

        function calcCombo() {
            const mainP = parseInt(mainSel.value) || 0;
            const sideP = parseInt(sideSel.value) || 0;
            const drinkP = parseInt(drinkSel.value) || 0;

            const total = mainP + sideP + drinkP;
            const discounted = Math.round(total * 0.85); // 15% Combo Discount

            if (oldPriceEl) oldPriceEl.textContent = `₹${total}`;
            if (newPriceEl) newPriceEl.textContent = `₹${discounted}`;
        }

        mainSel.addEventListener('change', calcCombo);
        sideSel.addEventListener('change', calcCombo);
        drinkSel.addEventListener('change', calcCombo);
        calcCombo();
    })();

    // ─── 19. FAQ ACCORDION HANDLER ───────────────────────────────────
    (function initFaqAccordion() {
        const items = document.querySelectorAll('.faq-item');
        items.forEach(item => {
            const q = item.querySelector('.faq-question');
            if (!q) return;
            q.addEventListener('click', () => {
                const isOpen = item.classList.contains('active');
                items.forEach(i => i.classList.remove('active'));
                if (!isOpen) item.classList.add('active');
            });
        });
    })();

    // ─── 20. PROMO CODE COPY & DISCOUNT HANDLER ──────────────────────
    (function initPromoCopy() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.copy-promo-btn');
            if (!btn) return;
            const code = btn.getAttribute('data-code') || 'FLAVOUR20';

            if (navigator.clipboard) {
                navigator.clipboard.writeText(code).catch(() => {});
            }

            let desc = 'Use code at checkout!';
            if (code === 'FLAVOUR20') desc = '⚡ 20% OFF One-Time Voucher copied!';
            if (code === 'FEAST17') desc = '🔥 17% OFF for orders above ₹1,000!';
            if (code === 'BDAY25') desc = '🎂 25% OFF Birthday Special Voucher copied!';

            showToast(`🎉 Code "${code}" Copied! ${desc}`);
        });

        function showToast(msg) {
            let toast = document.getElementById('flzToast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'flzToast';
                Object.assign(toast.style, {
                    position: 'fixed', bottom: '30px', right: '30px',
                    background: 'linear-gradient(135deg, #ff8c00, #ff3d00)',
                    color: '#fff', padding: '14px 26px', borderRadius: '30px',
                    fontWeight: '700', boxShadow: '0 10px 25px rgba(255,61,0,0.4)',
                    zIndex: '999999', transition: 'all 0.4s ease',
                    opacity: '0', transform: 'translateY(20px)'
                });
                document.body.appendChild(toast);
            }
            toast.textContent = msg;
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(20px)';
            }, 3600);
        }
    })();

})();

