// script.js

// ============ 1. LOADING SCREEN ============
(function () {
    const screen = document.getElementById('loading-screen');
    if (!screen) return;

    // Hide after 1.4s (logo fade-in takes ~1s, small buffer)
    setTimeout(() => {
        screen.classList.add('hidden');
        // After transition ends, remove from DOM to avoid z-index blocking
        screen.addEventListener('transitionend', () => screen.remove(), { once: true });
    }, 1400);
})();

// ============ 2. PARALLAX SCROLL EFFECT (Hero Banner) ============
(function () {
    const hero = document.querySelector('.hero-banner');
    if (!hero) return;

    function applyParallax() {
        const scrollY = window.scrollY;
        // Move background at 40% scroll speed for depth feel
        hero.style.backgroundPositionY = `calc(50% + ${scrollY * 0.4}px)`;
    }

    window.addEventListener('scroll', applyParallax, { passive: true });
    applyParallax(); // initial call
})();

// ============ 4. SMOOTH PAGE TRANSITIONS (Fade out → Fade in) ============
(function () {
    const overlay = document.getElementById('page-transition');
    if (!overlay) return;

    // Fade in on load (page-entering animation via CSS body class)
    document.body.classList.add('page-entering');
    setTimeout(() => document.body.classList.remove('page-entering'), 400);

    // Intercept all internal link clicks
    document.querySelectorAll('a[href]').forEach(link => {
        const href = link.getAttribute('href');
        // Only internal links, skip anchors and external URLs
        if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel')) return;
        // Skip btn-* links — ripple handler manages their navigation with transition
        if (link.classList.contains('btn-primary') || link.classList.contains('btn-secondary') ||
            link.classList.contains('btn-small')   || link.classList.contains('btn-order')) return;

        link.addEventListener('click', function (e) {
            e.preventDefault();
            const target = link.getAttribute('href');

            overlay.classList.add('fade-out');

            setTimeout(() => {
                window.location.href = target;
            }, 340);
        });
    });
})();

// ============ SCROLL REVEAL ANIMATION (left/right slide-in)  ============
const revealItems = document.querySelectorAll('.reveal');

const revealOnScroll = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, { threshold: 0.2 });

revealItems.forEach(item => revealOnScroll.observe(item));


// ============ NUMBER COUNTER ANIMATION (0 to original number) ============
const counters = document.querySelectorAll('.counter');

const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const counter = entry.target;
            const target = +counter.getAttribute('data-target');
            let current = 0;
            const increment = target / 100;

            const updateCounter = () => {
                current += increment;
                if (current < target) {
                    counter.innerText = Math.ceil(current);
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.innerText = target;
                }
            };
            updateCounter();
            counterObserver.unobserve(counter);
        }
    });
}, { threshold: 0.5 });

counters.forEach(counter => counterObserver.observe(counter));


// ============ SHOPPING CART (localStorage based) ============
function getCart() {
    return JSON.parse(localStorage.getItem('flavourez_cart') || '[]');
}

function saveCart(cart) {
    localStorage.setItem('flavourez_cart', JSON.stringify(cart));
}

// ---- MENU PAGE: Add to Cart buttons ----
const addButtons = document.querySelectorAll('.add-btn');

if (addButtons.length > 0) {
    const cartBar = document.getElementById('cartBar');
    const cartCountText = document.getElementById('cartCount');

    function refreshCartBar() {
        const cart = getCart();
        const totalItems = cart.reduce((sum, i) => sum + i.qty, 0);
        cartCountText.innerText = `🛒 ${totalItems} item${totalItems !== 1 ? 's' : ''} selected`;
    }

    addButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.dish-card');
            const name = item.getAttribute('data-name');
            const price = Number(item.getAttribute('data-price'));

            let cart = getCart();
            const existing = cart.find(i => i.name === name);

            if (existing) {
                existing.qty += 1;
            } else {
                cart.push({ name, price, qty: 1 });
            }

            saveCart(cart);
            refreshCartBar();

            const originalText = btn.innerText;
            btn.innerText = '✓ Added';
            setTimeout(() => { btn.innerText = originalText; }, 900);
        });
    });

    refreshCartBar();
}

// ---- ORDER PAGE: Load cart items dynamically ----
const orderItemsContainer = document.getElementById('orderItemsContainer');

if (orderItemsContainer) {
    function renderOrderCart() {
        const cart = getCart();
        orderItemsContainer.innerHTML = '';

        if (cart.length === 0) {
            orderItemsContainer.innerHTML = '<p class="empty-cart">No dishes selected yet. Please visit our <a href="menu.html">Full Menu</a> and click "+ Add" on the dishes you want.</p>';
            document.getElementById('cartTotal').innerText = '';
            return;
        }

        let total = 0;

        cart.forEach((item, index) => {
            total += item.price * item.qty;

            const row = document.createElement('div');
            row.className = 'order-item';
            row.innerHTML = `
                <span>${item.name} (₹${item.price})</span>
                <div class="qty-controls">
                    <button type="button" class="qty-btn" data-action="dec" data-index="${index}">-</button>
                    <span class="qty-value">${item.qty}</span>
                    <button type="button" class="qty-btn" data-action="inc" data-index="${index}">+</button>
                    <button type="button" class="remove-btn" data-index="${index}">✕</button>
                </div>
            `;
            orderItemsContainer.appendChild(row);
        });

        // Calculate active promo discount
        let finalTotal = total;
        let discountAmount = 0;

        if (window.activeAppliedPromo) {
            const code = window.activeAppliedPromo;
            if (code === 'FLAVOUR20') {
                if (localStorage.getItem('flz_used_flavour20')) {
                    document.getElementById('promoMsg').innerText = '⚠️ Code FLAVOUR20 already used previously! (1-Time Use Only)';
                    document.getElementById('promoMsg').style.color = '#ef4444';
                    window.activeAppliedPromo = null;
                } else {
                    discountAmount = Math.round(total * 0.20);
                    finalTotal = total - discountAmount;
                    document.getElementById('promoMsg').innerText = `🎉 FLAVOUR20 Applied! 20% OFF (Saved ₹${discountAmount})`;
                    document.getElementById('promoMsg').style.color = '#10b981';
                }
            } else if (code === 'FEAST17') {
                if (total < 1000) {
                    document.getElementById('promoMsg').innerText = `⚠️ FEAST17 is valid only on orders above ₹1,000! Add ₹${1000 - total} more.`;
                    document.getElementById('promoMsg').style.color = '#ef4444';
                    window.activeAppliedPromo = null;
                } else {
                    discountAmount = Math.round(total * 0.17);
                    finalTotal = total - discountAmount;
                    document.getElementById('promoMsg').innerText = `🎉 FEAST17 Applied! 17% OFF (Saved ₹${discountAmount})`;
                    document.getElementById('promoMsg').style.color = '#10b981';
                }
            } else if (code === 'BDAY25') {
                discountAmount = Math.round(total * 0.25);
                finalTotal = total - discountAmount;
                document.getElementById('promoMsg').innerText = `🎂 BDAY25 Birthday Gift Applied! 25% OFF (Saved ₹${discountAmount})`;
                document.getElementById('promoMsg').style.color = '#10b981';
            }
        }

        if (discountAmount > 0) {
            document.getElementById('cartTotal').innerHTML = `<span style="text-decoration:line-through; color:#999; font-size:15px;">Subtotal: ₹${total}</span> &nbsp; <strong style="color:#ff3d00; font-size:22px;">Payable: ₹${finalTotal}</strong> (Discount: -₹${discountAmount})`;
        } else {
            document.getElementById('cartTotal').innerText = `Total: ₹${total}`;
        }

        document.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const cart = getCart();
                const idx = Number(btn.getAttribute('data-index'));
                if (btn.getAttribute('data-action') === 'inc') {
                    cart[idx].qty += 1;
                } else {
                    cart[idx].qty -= 1;
                    if (cart[idx].qty <= 0) cart.splice(idx, 1);
                }
                saveCart(cart);
                renderOrderCart();
            });
        });

        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const cart = getCart();
                cart.splice(Number(btn.getAttribute('data-index')), 1);
                saveCart(cart);
                renderOrderCart();
            });
        });
    }

    // Attach Promo Apply Click Event
    const applyBtn = document.getElementById('applyPromoBtn');
    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            const input = document.getElementById('promoCodeInput');
            const msg = document.getElementById('promoMsg');
            if (!input) return;

            const code = input.value.trim().toUpperCase();
            if (!code) {
                msg.innerText = 'Please enter a valid promo code!';
                msg.style.color = '#ef4444';
                return;
            }

            if (code === 'FLAVOUR20' || code === 'FEAST17' || code === 'BDAY25') {
                window.activeAppliedPromo = code;
                renderOrderCart();
            } else {
                msg.innerText = `❌ Invalid code "${code}". Try FLAVOUR20, FEAST17, or BDAY25.`;
                msg.style.color = '#ef4444';
                window.activeAppliedPromo = null;
                renderOrderCart();
            }
        });
    }

    renderOrderCart();
}

// ============ MENU PAGE: CATEGORY TAB SWITCHING ============
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(btn.getAttribute('data-tab')).classList.add('active');

        // Hide Veg/Non-Veg filter bar when Combos tab is active
        document.body.classList.toggle('combos-active', btn.getAttribute('data-tab') === 'combos');
    });
});

// ============ MENU PAGE: VEG / NON-VEG / ALL FILTER ============
const filterButtons = document.querySelectorAll('.filter-btn');
const menuItems = document.querySelectorAll('.menu-content .dish-card');

filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.getAttribute('data-filter');

        menuItems.forEach(item => {
            if (filter === 'all' || item.getAttribute('data-type') === filter) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    });
});

// ============ CONTACT FORM SUBMIT ============
const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const msg = document.getElementById('contactSuccess');
        msg.innerText = "✅ Message sent! Our team will get back to you within 24 hours.";
        contactForm.reset();
    });
}

// ============ TRACK ORDER PAGE — RICH DASHBOARD ============
const trackBtn = document.getElementById('trackBtn');

if (trackBtn) {
    const savedId = localStorage.getItem('flavourez_last_order');
    if (savedId) {
        document.getElementById('trackInput').value = savedId;
    }

    let countdownTimer = null;

    // Format Date as "h:mm AM/PM"
    function fmtTime(date) {
        let h = date.getHours(), m = date.getMinutes();
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
    }

    // Render order summary from localStorage
    function renderTrackSummary() {
        const container = document.getElementById('trackOrderSummary');
        if (!container) return;
        const cart = JSON.parse(
            localStorage.getItem('flavourez_receipt_cart') ||
            localStorage.getItem('flavourez_cart') || '[]'
        );
        if (!cart.length) {
            container.innerHTML = '<h4>🛒 Your Order</h4><p class="track-no-order">No order details found. <a href="menu.html">Browse Menu →</a></p>';
            return;
        }
        let total = 0;
        let itemsHTML = '';
        cart.forEach(item => {
            const sub = item.price * item.qty;
            total += sub;
            itemsHTML += `
                <div class="track-summary-item">
                    <span class="track-summary-qty">${item.qty}×</span>
                    <span class="track-summary-name">${item.name}</span>
                    <span class="track-summary-price">₹${sub}</span>
                </div>`;
        });

        const discountAmount = Number(localStorage.getItem('flavourez_discount_amount') || 0);
        const promoCode = localStorage.getItem('flavourez_promo_code') || '';
        const finalTotal = Math.max(0, total - discountAmount);

        let discountHTML = '';
        if (discountAmount > 0) {
            discountHTML = `
                <div class="track-summary-item" style="color: #10b981;">
                    <span class="track-summary-qty" style="color: #10b981;">🏷️</span>
                    <span class="track-summary-name" style="color: #10b981; font-weight: 600;">Discount (${promoCode})</span>
                    <span class="track-summary-price" style="color: #10b981; font-weight: 600;">-₹${discountAmount}</span>
                </div>`;
        }

        container.innerHTML = `
            <h4>🛒 Your Order</h4>
            ${itemsHTML}
            ${discountHTML}
            <div class="track-summary-total">
                <span>Grand Total</span>
                <span class="total-amt">₹${finalTotal}</span>
            </div>`;
    }

    // Auto-generate realistic timestamps (relative to now)
    function generateTimestamps() {
        const now = new Date();
        const t1 = new Date(now - 20 * 60000); // confirmed 20 min ago
        const t2 = new Date(now - 14 * 60000); // preparing 14 min ago
        const t3 = new Date(now - 4 * 60000);  // out for delivery 4 min ago
        const el1 = document.getElementById('ts1');
        const el2 = document.getElementById('ts2');
        const el3 = document.getElementById('ts3');
        if (el1) el1.textContent = fmtTime(t1);
        if (el2) el2.textContent = fmtTime(t2);
        if (el3) el3.textContent = fmtTime(t3);
    }

    // Live countdown timer
    function startCountdown(totalSeconds) {
        if (countdownTimer) clearInterval(countdownTimer);
        const display = document.getElementById('countdownDisplay');
        if (!display) return;

        function tick() {
            if (totalSeconds <= 0) {
                display.textContent = 'Arriving! 🎉';
                clearInterval(countdownTimer);
                return;
            }
            const m = Math.floor(totalSeconds / 60);
            const s = totalSeconds % 60;
            display.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
            totalSeconds--;
        }
        tick();
        countdownTimer = setInterval(tick, 1000);
    }

    trackBtn.addEventListener('click', () => {
        const input = document.getElementById('trackInput').value.trim().toUpperCase();
        const errorEl = document.getElementById('trackError');
        const resultEl = document.getElementById('trackResult');

        if (input.startsWith('FLZ') && input.length >= 6) {
            errorEl.innerText = '';
            resultEl.style.display = 'block';
            document.getElementById('resultId').innerText = '#' + input;

            renderTrackSummary();
            generateTimestamps();
            // Random remaining time: 21–25 mins
            const remaining = (21 * 60) + Math.floor(Math.random() * 4 * 60);
            startCountdown(remaining);
            resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            resultEl.style.display = 'none';
            errorEl.innerText = 'Please enter a valid Tracking ID (e.g. FLZ23847)';
        }
    });
}


// ============ ORDER FORM SUBMIT (Demo - shows success message + Track ID) ============
const orderForm = document.getElementById('orderForm');

if (orderForm) {
    orderForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const trackId = 'FLZ' + Math.floor(10000 + Math.random() * 90000);
        localStorage.setItem('flavourez_last_order', trackId);

        // Save cart snapshot and discount details BEFORE clearing cart
        const currentCart = getCart();
        let subtotal = 0;
        currentCart.forEach(item => { subtotal += item.price * item.qty; });

        let discountAmount = 0;
        let promoCode = window.activeAppliedPromo || '';

        if (promoCode === 'FLAVOUR20') {
            if (!localStorage.getItem('flz_used_flavour20')) {
                discountAmount = Math.round(subtotal * 0.20);
                localStorage.setItem('flz_used_flavour20', 'true');
            } else {
                promoCode = '';
            }
        } else if (promoCode === 'FEAST17') {
            if (subtotal >= 1000) {
                discountAmount = Math.round(subtotal * 0.17);
            } else {
                promoCode = '';
            }
        } else if (promoCode === 'BDAY25') {
            discountAmount = Math.round(subtotal * 0.25);
        } else {
            promoCode = '';
        }

        const finalTotal = Math.max(0, subtotal - discountAmount);

        localStorage.setItem('flavourez_receipt_cart', JSON.stringify(currentCart));
        localStorage.setItem('flavourez_subtotal', subtotal);
        localStorage.setItem('flavourez_discount_amount', discountAmount);
        localStorage.setItem('flavourez_promo_code', promoCode);
        localStorage.setItem('flavourez_final_total', finalTotal);

        window.activeAppliedPromo = null;

        const successMsg = document.getElementById('orderSuccess');
        successMsg.innerHTML = `🎉 Thank you! Your order has been placed successfully.<br>Your Tracking ID: <strong>${trackId}</strong><br><a href="track.html">Track your order here →</a>`;
        orderForm.reset();
        localStorage.removeItem('flavourez_cart');
        if (typeof renderOrderCart === 'function') renderOrderCart();
        successMsg.scrollIntoView({ behavior: 'smooth' });
    });
}

// ============ BUTTON CLICK RIPPLE EFFECT ============
const buttons = document.querySelectorAll('.btn-primary, .btn-secondary, .btn-small, .btn-order');

buttons.forEach(button => {
    button.addEventListener('click', function (e) {
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');

        const rect = button.getBoundingClientRect();
        ripple.style.left = (e.clientX - rect.left) + 'px';
        ripple.style.top = (e.clientY - rect.top) + 'px';

        button.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);

        // If this is a link (Explore Menu / Order Now), let the ripple show before navigating
        const href = button.getAttribute('href');
        if (href && button.tagName === 'A') {
            e.preventDefault();
            const overlay = document.getElementById('page-transition');
            if (overlay) {
                overlay.classList.add('fade-out');
                setTimeout(() => { window.location.href = href; }, 340);
            } else {
                setTimeout(() => { window.location.href = href; }, 280);
            }
        }
    });
});

// ============ DARK MODE TOGGLE (localStorage) ============
(function () {
    const toggle = document.getElementById('darkModeToggle');
    const body = document.body;

    // Apply saved preference on page load
    if (localStorage.getItem('flavourez_dark') === 'true') {
        body.classList.add('dark-mode');
        if (toggle) toggle.textContent = '☀️';
    }

    if (toggle) {
        toggle.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            const isDark = body.classList.contains('dark-mode');
            localStorage.setItem('flavourez_dark', isDark);
            toggle.textContent = isDark ? '☀️' : '🌙';
        });
    }
})();

// ============ MENU SEARCH BAR ============
(function () {
    const searchInput = document.getElementById('menuSearchInput');
    const searchClear = document.getElementById('menuSearchClear');
    const resultCount = document.getElementById('searchResultCount');

    if (!searchInput) return;

    function performSearch() {
        const query = searchInput.value.trim().toLowerCase();
        const allCards = document.querySelectorAll('.menu-content .dish-card');
        const allTabs = document.querySelectorAll('.tab-content');
        const tabButtons = document.querySelectorAll('.tab-btn');

        if (query === '') {
            // Reset to default view
            allCards.forEach(card => card.style.display = '');
            // Show only the active tab
            allTabs.forEach(t => t.style.display = t.classList.contains('active') ? 'block' : 'none');
            if (resultCount) resultCount.textContent = '';
            return;
        }

        // Show all tabs when searching
        allTabs.forEach(t => t.style.display = 'block');
        tabButtons.forEach(b => b.classList.remove('active'));

        let matchCount = 0;
        allCards.forEach(card => {
            const name = (card.getAttribute('data-name') || '').toLowerCase();
            if (name.includes(query)) {
                card.style.display = 'block';
                matchCount++;
            } else {
                card.style.display = 'none';
            }
        });

        if (resultCount) {
            resultCount.textContent = matchCount > 0
                ? `✅ ${matchCount} dish${matchCount !== 1 ? 'es' : ''} found for "${searchInput.value.trim()}"`
                : `❌ No dishes found for "${searchInput.value.trim()}"`;
        }
    }

    searchInput.addEventListener('input', performSearch);

    if (searchClear) {
        searchClear.addEventListener('click', () => {
            searchInput.value = '';
            performSearch();
            searchInput.focus();
        });
    }
})();

// ============ COMBO OFFERS: ADD TO CART ============
(function () {
    const comboButtons = document.querySelectorAll('.combo-add-btn');

    comboButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const itemNames = btn.getAttribute('data-items').split(',');
            const itemPrices = btn.getAttribute('data-prices').split(',').map(Number);

            let cart = getCart();

            itemNames.forEach((name, i) => {
                const existing = cart.find(c => c.name === name.trim());
                if (existing) {
                    existing.qty += 1;
                } else {
                    cart.push({ name: name.trim(), price: itemPrices[i], qty: 1 });
                }
            });

            saveCart(cart);

            // Refresh cart bar if present
            const cartCountText = document.getElementById('cartCount');
            if (cartCountText) {
                const totalItems = cart.reduce((sum, i) => sum + i.qty, 0);
                cartCountText.innerText = `🛒 ${totalItems} item${totalItems !== 1 ? 's' : ''} selected`;
            }

            const originalText = btn.textContent;
            btn.textContent = '✅ Combo Added!';
            btn.style.background = 'linear-gradient(90deg,#2e7d32,#43a047)';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 1500);
        });
    });
})();

// ============ UPI QR CODE: Show/Hide on payment selection ============
(function () {
    const paymentSelect = document.getElementById('payment');
    const upiQrSection = document.getElementById('upiQrSection');

    if (paymentSelect && upiQrSection) {
        paymentSelect.addEventListener('change', () => {
            if (paymentSelect.value === 'upi') {
                upiQrSection.style.display = 'block';
                upiQrSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                upiQrSection.style.display = 'none';
            }
        });
    }
})();

// ============ RECEIPT / BILL DOWNLOAD (Print as PDF) ============
(function () {
    const orderForm = document.getElementById('orderForm');

    if (orderForm) {
        orderForm.addEventListener('submit', function () {
            // Show receipt button after a short delay (after success renders)
            setTimeout(() => {
                const receiptWrap = document.getElementById('receiptBtnWrap');
                if (receiptWrap) receiptWrap.style.display = 'block';
            }, 200);
        });
    }

    const downloadBtn = document.getElementById('downloadReceiptBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            const cart = JSON.parse(localStorage.getItem('flavourez_receipt_cart') || '[]');
            const trackId = localStorage.getItem('flavourez_last_order') || 'N/A';
            const discountAmount = Number(localStorage.getItem('flavourez_discount_amount') || 0);
            const promoCode = localStorage.getItem('flavourez_promo_code') || '';
            const now = new Date().toLocaleString('en-IN');

            let itemsHtml = '';
            let subtotal = 0;
            cart.forEach(item => {
                const sub = item.price * item.qty;
                subtotal += sub;
                itemsHtml += `<tr>
                    <td>${item.name}</td>
                    <td style="text-align:center">${item.qty}</td>
                    <td style="text-align:right">₹${item.price}</td>
                    <td style="text-align:right">₹${sub}</td>
                </tr>`;
            });

            const finalTotal = Math.max(0, subtotal - discountAmount);

            let discountRowsHtml = '';
            if (discountAmount > 0) {
                discountRowsHtml = `
                    <tr>
                        <td colspan="3" style="text-align:right; font-weight:bold; color:#555;">Subtotal</td>
                        <td style="text-align:right; font-weight:bold; color:#555;">₹${subtotal}</td>
                    </tr>
                    <tr>
                        <td colspan="3" style="text-align:right; font-weight:bold; color:#10b981;">Discount (${promoCode})</td>
                        <td style="text-align:right; font-weight:bold; color:#10b981;">-₹${discountAmount}</td>
                    </tr>`;
            }

            const receiptHtml = `
                <html><head><title>Flavourez Receipt</title>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 30px auto; color: #2b2318; }
                    h1 { color: #ff5722; text-align: center; font-size: 28px; margin-bottom: 4px; }
                    .sub { text-align:center; color:#777; font-size:13px; margin-bottom:20px; }
                    .info { background:#fdf6ec; border-radius:8px; padding:14px 18px; margin-bottom:18px; font-size:14px; }
                    table { width:100%; border-collapse:collapse; }
                    th { background:linear-gradient(90deg,#ff8c00,#ff3d00); color:#fff; padding:10px; font-size:14px; }
                    td { padding:10px; border-bottom:1px solid #eee; font-size:14px; }
                    .total-row td { font-weight:bold; color:#ff5722; font-size:16px; border-top:2px solid #ff8c00; }
                    .footer { text-align:center; margin-top:25px; color:#999; font-size:12px; }
                    .thank { text-align:center; color:#2e7d32; font-size:18px; margin-top:15px; font-weight:bold; }
                    @media print { body { margin: 10px; } }
                </style></head><body>
                <h1>🍽️ FLAVOUREZ</h1>
                <p class="sub">127 Gandhipuram, Coimbatore | 📞 +91 8667611094</p>
                <div class="info">
                    <b>Order Receipt</b><br>
                    Tracking ID: <b>${trackId}</b><br>
                    Date & Time: ${now}
                </div>
                <table>
                    <thead><tr><th>Dish</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Subtotal</th></tr></thead>
                    <tbody>${itemsHtml}</tbody>
                    <tfoot>
                        ${discountRowsHtml}
                        <tr class="total-row"><td colspan="3">Grand Total</td><td style="text-align:right">₹${finalTotal}</td></tr>
                    </tfoot>
                </table>
                <p class="thank">🎉 Thank you for ordering from Flavourez!</p>
                <p class="footer">This is a computer-generated receipt. No signature required.</p>
                </body></html>
            `;

            const win = window.open('', '_blank', 'width=700,height=700');
            win.document.write(receiptHtml);
            win.document.close();
            win.focus();
            setTimeout(() => win.print(), 500);
        });
    }
})();