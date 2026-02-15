class UrgencyTimerElement extends HTMLElement {
    constructor() {
        super();
        this.products       = [];
        this.currentIndex   = 0;
        this.rotationInterval = null;
        this.timerIntervals = new Map();
        this.settings = {
            color1: '#ff4757',
            color2: '#ffffff',
            color3: '#2f3542',
            color4: '#ffa502',
            color5: '#ff6348',
            color6: '#ff3838',
            color7: '#1e90ff',
            color8: '#000000',
            borderWidth: 0,
            cornerRadius: 16,
            mainText: '🔥 HOT DEAL ENDING SOON',
            urgencyText: 'Limited Time Offer!',
            ctaText: 'Claim Deal',
            // FIX: two countdown controls
            countdownMode: 'hours',   // 'hours' | 'midnight'
            timerDuration: 24,        // hours to count down from (when mode = 'hours')
            showViewers: true,
            // FIX: showSold removed entirely
            autoRotate: true,
            rotationSpeed: 8,
            titleFontFamily: 'Archivo Black',
            titleFontSize: 20,
            urgencyFontFamily: 'Poppins',
            urgencyFontSize: 13,
            priceFontFamily: 'Montserrat',
            priceFontSize: 28,
            timerFontFamily: 'Orbitron',
            timerFontSize: 24,
            ctaFontFamily: 'Poppins',
            ctaFontSize: 15,
            titleTag: 'H2'
        };
        this.isRendered         = false;
        this.pendingProductsData = null;
    }

    connectedCallback() {
        this.render();
        this.isRendered = true;

        if (this.pendingProductsData) {
            this.products = this.pendingProductsData || [];
            this.pendingProductsData = null;
            this.renderProducts();
        }
    }

    static get observedAttributes() {
        return ['products-data', 'settings'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (newValue && newValue !== oldValue) {
            if (name === 'products-data') {
                try {
                    const data = JSON.parse(newValue);
                    if (!this.isRendered) {
                        this.pendingProductsData = data;
                        return;
                    }
                    this.products     = data || [];
                    this.currentIndex = 0;
                    this.renderProducts();
                } catch (e) {
                    console.error('Error parsing products data:', e);
                }
            } else if (name === 'settings') {
                try {
                    const newSettings = JSON.parse(newValue);
                    const oldAutoRotate    = this.settings.autoRotate;
                    const oldRotationSpeed = this.settings.rotationSpeed;
                    Object.assign(this.settings, newSettings);
                    if (this.isRendered) {
                        this.updateStyles();
                        if (oldAutoRotate !== this.settings.autoRotate ||
                            oldRotationSpeed !== this.settings.rotationSpeed) {
                            this.setupRotation();
                        }
                    }
                } catch (e) {
                    console.error('Error parsing settings:', e);
                }
            }
        }
    }

    disconnectedCallback() {
        if (this.rotationInterval) clearInterval(this.rotationInterval);
        this.timerIntervals.forEach(interval => clearInterval(interval));
        this.timerIntervals.clear();
    }

    calculateDiscount(price, comparePrice) {
        if (!comparePrice || comparePrice === price) return null;
        const priceNum   = parseFloat(price.replace(/[^0-9.]/g, ''));
        const compareNum = parseFloat(comparePrice.replace(/[^0-9.]/g, ''));
        if (isNaN(priceNum) || isNaN(compareNum) || compareNum <= priceNum) return null;
        const discount = Math.round(((compareNum - priceNum) / compareNum) * 100);
        return discount > 0 ? discount : null;
    }

    getRandomViewers() {
        return Math.floor(Math.random() * 150) + 50;
    }

    // ── FIX: compute countdown end-time based on countdownMode ───────────────
    getCountdownEndTime() {
        const now = new Date();
        if (this.settings.countdownMode === 'midnight') {
            // Count down to end of current day
            const midnight = new Date(now);
            midnight.setHours(23, 59, 59, 999);
            return midnight;
        }
        // Default: count down from timerDuration hours
        const endTime = new Date(now);
        endTime.setHours(endTime.getHours() + (Number(this.settings.timerDuration) || 24));
        return endTime;
    }

    render() {
        // ── FIX: Card uses same fixed-width grid layout as the limited-stock widget
        // so all products fill an identical container. Responsive breakpoints match.
        this.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Poppins:wght@400;600;700;800&family=Montserrat:wght@700;800;900&family=Orbitron:wght@700;900&family=Bebas+Neue&family=Righteous&display=swap');

                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                :host {
                    display: block;
                    width: 100%;
                    --color1: #ff4757;
                    --color2: #ffffff;
                    --color3: #2f3542;
                    --color4: #ffa502;
                    --color5: #ff6348;
                    --color6: #ff3838;
                    --color7: #1e90ff;
                    --color8: #000000;
                }

                @keyframes intense-pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50%       { transform: scale(1.08); opacity: 0.9; }
                }
                @keyframes shake-urgent {
                    0%, 100% { transform: translateX(0) rotate(0deg); }
                    25%       { transform: translateX(-8px) rotate(-2deg); }
                    75%       { transform: translateX(8px) rotate(2deg); }
                }
                @keyframes blink-fast {
                    0%, 100% { opacity: 1; }
                    50%       { opacity: 0.3; }
                }
                @keyframes glow-intense {
                    0%, 100% { box-shadow: 0 0 30px rgba(255,71,87,0.6), 0 0 60px rgba(255,71,87,0.3); }
                    50%       { box-shadow: 0 0 50px rgba(255,71,87,0.9), 0 0 100px rgba(255,71,87,0.5); }
                }
                @keyframes countdown-pulse {
                    0%, 100% { transform: scale(1);   background: linear-gradient(135deg, var(--color1) 0%, var(--color6) 100%); }
                    50%       { transform: scale(1.1); background: linear-gradient(135deg, var(--color6) 0%, var(--color1) 100%); }
                }
                @keyframes shimmer {
                    0%   { background-position: -200% 0; }
                    100% { background-position:  200% 0; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }

                /* ── OUTER CONTAINER ── same 100% width pattern as limited-stock widget */
                .timer-container {
                    width: 100%;
                    padding: 0;
                    position: relative;
                }

                /* ── CARD GRID STACK (same pattern as limited-stock) ─────────────────
                   All cards share the same grid cell → identical width, no layout shift  */
                .product-carousel {
                    display: grid;
                    grid-template-columns: 1fr;
                    grid-template-rows: 1fr;
                    width: 100%;
                    overflow: hidden;
                }

                .urgency-card {
                    grid-column: 1;
                    grid-row: 1;
                    width: 100%;
                    min-width: 0;
                    background: linear-gradient(135deg, var(--color3) 0%, #1a1d24 100%);
                    border-radius: var(--corner-radius, 16px);
                    overflow: hidden;
                    box-shadow: 0 15px 50px rgba(0,0,0,0.3);
                    position: relative;
                    animation: glow-intense 2s ease-in-out infinite;
                    visibility: hidden;
                    opacity: 0;
                    transition: opacity 0.4s ease, visibility 0.4s ease;
                    pointer-events: none;
                }

                .urgency-card.active {
                    visibility: visible;
                    opacity: 1;
                    pointer-events: auto;
                    animation: glow-intense 2s ease-in-out infinite, fadeIn 0.4s ease forwards;
                }

                /* shimmer top line */
                .urgency-card::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, var(--color1) 0%, var(--color4) 50%, var(--color1) 100%);
                    background-size: 200% 100%;
                    animation: shimmer 2s linear infinite;
                    z-index: 2;
                }

                .urgency-header {
                    background: linear-gradient(135deg, var(--color1) 0%, var(--color6) 100%);
                    padding: 12px 20px;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }
                .urgency-header::after {
                    content: '🔥';
                    position: absolute;
                    font-size: 100px;
                    opacity: 0.1;
                    top: 50%; left: 50%;
                    transform: translate(-50%, -50%);
                    animation: intense-pulse 1.5s ease-in-out infinite;
                }

                .main-text {
                    font-family: var(--urgency-font-family);
                    font-size: var(--urgency-font-size);
                    color: var(--color2);
                    margin: 0;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    text-shadow: 0 2px 10px rgba(0,0,0,0.3);
                    z-index: 1;
                    position: relative;
                    animation: shake-urgent 3s ease-in-out infinite;
                }

                /* ── PRODUCT IMAGE: fixed height, never shrinks ─────────────────────── */
                .product-image-container {
                    position: relative;
                    width: 100%;
                    height: 300px;
                    overflow: hidden;
                    flex-shrink: 0;
                }

                .product-image-timer {
                    display: block;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    object-position: center;
                    border-bottom: 3px solid var(--color1);
                    transition: transform 0.4s ease;
                }

                .urgency-card.active:hover .product-image-timer {
                    transform: scale(1.08);
                }

                .discount-badge-timer {
                    position: absolute;
                    top: 12px; right: 12px;
                    width: 70px; height: 70px;
                    background: linear-gradient(135deg, var(--color4) 0%, var(--color5) 100%);
                    border-radius: 50%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: var(--color2);
                    font-weight: 900;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.4);
                    border: 4px solid var(--color2);
                    animation: intense-pulse 1.5s ease-in-out infinite;
                    z-index: 10;
                }
                .discount-value-timer {
                    font-size: 24px;
                    line-height: 1;
                    font-family: var(--timer-font-family);
                }
                .discount-label-timer {
                    font-size: 10px;
                    text-transform: uppercase;
                    font-family: var(--urgency-font-family);
                }

                /* ── PRODUCT CONTENT AREA ─────────────────────────────────────────── */
                .product-content {
                    padding: 20px;
                    width: 100%;
                }

                .product-title-timer {
                    font-family: var(--title-font-family);
                    font-size: var(--title-font-size);
                    color: var(--color2);
                    margin: 0 0 12px 0;
                    font-weight: 900;
                    text-transform: uppercase;
                    line-height: 1.2;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    width: 100%;
                }

                .urgency-badge {
                    display: inline-block;
                    background: linear-gradient(135deg, var(--color4) 0%, var(--color5) 100%);
                    color: var(--color2);
                    padding: 6px 16px;
                    border-radius: 20px;
                    font-family: var(--urgency-font-family);
                    font-size: calc(var(--urgency-font-size) - 2px);
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    animation: intense-pulse 2s ease-in-out infinite;
                    margin-bottom: 12px;
                }

                .price-timer-section {
                    display: flex;
                    align-items: baseline;
                    gap: 12px;
                    margin-bottom: 15px;
                    padding: 12px 0;
                    border-top: 1px solid rgba(255,255,255,0.1);
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    flex-wrap: wrap;
                }
                .product-price-timer {
                    font-family: var(--price-font-family);
                    font-size: var(--price-font-size);
                    font-weight: 900;
                    color: var(--color4);
                    text-shadow: 0 0 20px rgba(255,165,2,0.5);
                }
                .product-compare-price-timer {
                    font-family: var(--price-font-family);
                    font-size: calc(var(--price-font-size) * 0.6);
                    color: #999;
                    text-decoration: line-through;
                }

                /* FIX: showSold stat removed. Only viewers row remains. */
                .stats-row {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    flex-wrap: wrap;
                    margin-bottom: 0;
                }
                .stat-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(255,255,255,0.1);
                    padding: 7px 14px;
                    border-radius: 20px;
                    font-family: var(--urgency-font-family);
                    font-size: 12px;
                    color: var(--color2);
                    font-weight: 600;
                }
                .stat-icon   { font-size: 16px; }
                .stat-number { font-weight: 800; color: var(--color4); }

                /* ── COUNTDOWN SECTION ─────────────────────────────────────────────── */
                .countdown-section {
                    background: rgba(0,0,0,0.3);
                    padding: 20px;
                    text-align: center;
                    border-top: 2px solid rgba(255,71,87,0.3);
                }
                .countdown-label {
                    font-family: var(--urgency-font-family);
                    font-size: 12px;
                    color: var(--color4);
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    margin-bottom: 12px;
                    font-weight: 700;
                }
                .countdown-display {
                    display: flex;
                    justify-content: center;
                    gap: 12px;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                }
                .time-box {
                    background: linear-gradient(135deg, var(--color1) 0%, var(--color6) 100%);
                    padding: 12px 16px;
                    border-radius: 10px;
                    min-width: 70px;
                    border: 2px solid rgba(255,255,255,0.2);
                    animation: countdown-pulse 2s ease-in-out infinite;
                }
                .time-value {
                    font-family: var(--timer-font-family);
                    font-size: var(--timer-font-size);
                    color: var(--color2);
                    font-weight: 900;
                    line-height: 1;
                    text-shadow: 0 0 15px rgba(255,255,255,0.5);
                }
                .time-label {
                    font-family: var(--urgency-font-family);
                    font-size: 10px;
                    color: rgba(255,255,255,0.8);
                    text-transform: uppercase;
                    margin-top: 6px;
                    letter-spacing: 1px;
                }
                .time-separator {
                    color: var(--color4);
                    font-family: var(--timer-font-family);
                    font-size: var(--timer-font-size);
                    font-weight: 900;
                    align-self: center;
                    animation: blink-fast 1s ease-in-out infinite;
                }

                /* ── CTA BUTTON ───────────────────────────────────────────────────── */
                .cta-button-timer {
                    display: block;
                    width: 100%;
                    padding: 18px;
                    background: linear-gradient(135deg, var(--color1) 0%, var(--color6) 100%);
                    color: var(--color2);
                    font-family: var(--cta-font-family);
                    font-size: var(--cta-font-size);
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    border: none;
                    border-radius: 0;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-decoration: none;
                    text-align: center;
                    box-shadow: 0 -4px 20px rgba(255,71,87,0.3);
                    position: relative;
                    overflow: hidden;
                }
                .cta-button-timer::before {
                    content: '⚡';
                    position: absolute;
                    left: -40px;
                    font-size: 24px;
                    transition: left 0.3s ease;
                    top: 50%;
                    transform: translateY(-50%);
                }
                .cta-button-timer:hover::before { left: 30px; }
                .cta-button-timer:hover {
                    background: linear-gradient(135deg, var(--color6) 0%, var(--color1) 100%);
                    transform: translateY(-3px);
                    box-shadow: 0 -8px 30px rgba(255,71,87,0.5);
                    padding-left: 60px;
                }

                /* ── NAVIGATION ───────────────────────────────────────────────────── */
                .navigation-controls {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 20px;
                    padding: 20px;
                    background: rgba(0,0,0,0.2);
                }
                .nav-arrow {
                    width: 40px; height: 40px;
                    border-radius: 50%;
                    background: var(--color2);
                    border: 2px solid var(--color1);
                    color: var(--color1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-size: 20px;
                    font-weight: 700;
                    flex-shrink: 0;
                }
                .nav-arrow:hover {
                    background: var(--color1);
                    color: var(--color2);
                    transform: scale(1.1);
                }
                .navigation-dots {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                    justify-content: center;
                }
                .nav-dot {
                    width: 10px; height: 10px;
                    border-radius: 50%;
                    background: rgba(255,71,87,0.3);
                    cursor: pointer;
                    transition: all 0.3s ease;
                    flex-shrink: 0;
                }
                .nav-dot:hover { background: rgba(255,71,87,0.6); transform: scale(1.2); }
                .nav-dot.active {
                    background: var(--color1);
                    transform: scale(1.3);
                    box-shadow: 0 0 10px var(--color1);
                }

                /* ── EMPTY STATE ──────────────────────────────────────────────────── */
                .empty-state {
                    text-align: center;
                    padding: 80px 20px;
                    color: #999;
                    font-family: var(--urgency-font-family);
                    font-size: 18px;
                }
                .empty-state::before {
                    content: '⏰';
                    display: block;
                    font-size: 80px;
                    margin-bottom: 20px;
                }

                /* ── RESPONSIVE ───────────────────────────────────────────────────── */
                @media (max-width: 768px) {
                    .product-image-container { height: 250px; }
                    .product-content { padding: 16px; }
                    .countdown-display { gap: 8px; }
                    .time-box { min-width: 60px; padding: 10px 12px; }
                }
                @media (max-width: 480px) {
                    .product-image-container { height: 220px; }
                    .time-box { min-width: 50px; padding: 8px 10px; }
                    .nav-arrow { width: 35px; height: 35px; font-size: 16px; }
                    .discount-badge-timer { width: 60px; height: 60px; }
                    .discount-value-timer { font-size: 20px; }
                }
            </style>

            <div class="timer-container">
                <div class="urgency-header">
                    <div class="main-text"></div>
                </div>
                <div class="product-carousel"></div>
                <div class="navigation-controls" style="display:none;">
                    <div class="nav-arrow nav-prev">‹</div>
                    <div class="navigation-dots"></div>
                    <div class="nav-arrow nav-next">›</div>
                </div>
            </div>
        `;
    }

    renderProducts() {
        const mainText  = this.querySelector('.main-text');
        const carousel  = this.querySelector('.product-carousel');
        const navControls = this.querySelector('.navigation-controls');
        const dotsContainer = this.querySelector('.navigation-dots');

        if (mainText) {
            mainText.textContent = this.settings.mainText || '🔥 HOT DEAL ENDING SOON';
        }

        if (!carousel) return;

        if (this.products.length === 0) {
            carousel.innerHTML = '<div class="empty-state">No products selected</div>';
            if (navControls) navControls.style.display = 'none';
            return;
        }

        // FIX: render ALL cards into the grid at once (same pattern as limited-stock)
        carousel.innerHTML = this.products.map(p => this.renderProductCard(p)).join('');

        if (navControls) {
            navControls.style.display = this.products.length > 1 ? 'flex' : 'none';
        }

        this.showCard(this.currentIndex);
        this.renderDots();
        this.setupNavigation();
        this.setupRotation();
        this.updateStyles();

        // Start countdown for first product
        if (this.products[this.currentIndex]) {
            this.startCountdown(this.products[this.currentIndex].id);
        }
    }

    // FIX: all cards rendered into grid; only active one visible (no layout shift)
    showCard(index) {
        const cards = this.querySelectorAll('.urgency-card');
        cards.forEach((card, i) => {
            if (i === index) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
        this.currentIndex = index;
    }

    renderProductCard(product) {
        const hasComparePrice = product.compareAtPrice && product.compareAtPrice !== product.price;
        const displayPrice    = product.price || 'Price not available';
        const discount        = hasComparePrice ? this.calculateDiscount(product.price, product.compareAtPrice) : null;
        const titleTag        = this.settings.titleTag || 'H2';
        const viewers         = this.getRandomViewers();

        return `
            <div class="urgency-card">
                <div class="product-image-container">
                    ${discount ? `
                        <div class="discount-badge-timer">
                            <div class="discount-value-timer">${discount}%</div>
                            <div class="discount-label-timer">OFF</div>
                        </div>` : ''}
                    <img src="${product.imageUrl}"
                         alt="${product.name}"
                         class="product-image-timer"
                         onerror="this.src='https://via.placeholder.com/600x300'">
                </div>

                <div class="product-content">
                    <${titleTag} class="product-title-timer">${product.name}</${titleTag}>
                    <div class="urgency-badge">${this.settings.urgencyText}</div>

                    <div class="price-timer-section">
                        <span class="product-price-timer">${displayPrice}</span>
                        ${hasComparePrice ? `<span class="product-compare-price-timer">${product.compareAtPrice}</span>` : ''}
                    </div>

                    ${this.settings.showViewers ? `
                        <div class="stats-row">
                            <div class="stat-item">
                                <span class="stat-icon">👁️</span>
                                <span class="stat-number">${viewers}</span>&nbsp;watching
                            </div>
                        </div>` : ''}
                </div>

                <div class="countdown-section">
                    <div class="countdown-label">⏰ Offer Expires In</div>
                    <div class="countdown-display">
                        <div class="time-box">
                            <div class="time-value" data-unit="hours" data-product="${product.id}">00</div>
                            <div class="time-label">Hours</div>
                        </div>
                        <div class="time-separator">:</div>
                        <div class="time-box">
                            <div class="time-value" data-unit="minutes" data-product="${product.id}">00</div>
                            <div class="time-label">Minutes</div>
                        </div>
                        <div class="time-separator">:</div>
                        <div class="time-box">
                            <div class="time-value" data-unit="seconds" data-product="${product.id}">00</div>
                            <div class="time-label">Seconds</div>
                        </div>
                    </div>
                    <a href="${product.productUrl}" class="cta-button-timer">${this.settings.ctaText}</a>
                </div>
            </div>
        `;
    }

    renderDots() {
        const dotsContainer = this.querySelector('.navigation-dots');
        if (!dotsContainer || this.products.length <= 1) {
            if (dotsContainer) dotsContainer.innerHTML = '';
            return;
        }

        dotsContainer.innerHTML = this.products.map((_, i) =>
            `<div class="nav-dot ${i === this.currentIndex ? 'active' : ''}" data-index="${i}"></div>`
        ).join('');

        dotsContainer.querySelectorAll('.nav-dot').forEach(dot => {
            dot.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.index);
                this.showCard(idx);
                this.updateDots();
                this.startCountdown(this.products[idx].id);
                this.setupRotation();
            });
        });
    }

    updateDots() {
        this.querySelectorAll('.nav-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === this.currentIndex);
        });
    }

    setupNavigation() {
        const prevBtn = this.querySelector('.nav-prev');
        const nextBtn = this.querySelector('.nav-next');

        if (prevBtn) {
            prevBtn.onclick = () => {
                const idx = (this.currentIndex - 1 + this.products.length) % this.products.length;
                this.showCard(idx);
                this.updateDots();
                this.startCountdown(this.products[idx].id);
                this.setupRotation();
            };
        }

        if (nextBtn) {
            nextBtn.onclick = () => {
                const idx = (this.currentIndex + 1) % this.products.length;
                this.showCard(idx);
                this.updateDots();
                this.startCountdown(this.products[idx].id);
                this.setupRotation();
            };
        }
    }

    setupRotation() {
        if (this.rotationInterval) clearInterval(this.rotationInterval);
        if (!this.settings.autoRotate || this.products.length <= 1) return;

        const speed = (this.settings.rotationSpeed || 8) * 1000;
        this.rotationInterval = setInterval(() => {
            const idx = (this.currentIndex + 1) % this.products.length;
            this.showCard(idx);
            this.updateDots();
            this.startCountdown(this.products[idx].id);
        }, speed);
    }

    // FIX: countdown uses per-product data attribute to update the right card's timer
    startCountdown(productId) {
        if (this.timerIntervals.has(productId)) {
            clearInterval(this.timerIntervals.get(productId));
        }

        const endTime = this.getCountdownEndTime();

        const updateTimer = () => {
            const distance = endTime.getTime() - Date.now();

            // Selectors scoped to this product's data attribute
            const hoursEl   = this.querySelector(`[data-unit="hours"][data-product="${productId}"]`);
            const minutesEl = this.querySelector(`[data-unit="minutes"][data-product="${productId}"]`);
            const secondsEl = this.querySelector(`[data-unit="seconds"][data-product="${productId}"]`);

            if (distance < 0) {
                const iv = this.timerIntervals.get(productId);
                if (iv) clearInterval(iv);
                this.timerIntervals.delete(productId);
                if (hoursEl)   hoursEl.textContent   = '00';
                if (minutesEl) minutesEl.textContent = '00';
                if (secondsEl) secondsEl.textContent = '00';
                return;
            }

            const hours   = Math.floor(distance / 3600000);
            const minutes = Math.floor((distance % 3600000) / 60000);
            const seconds = Math.floor((distance % 60000) / 1000);

            if (hoursEl)   hoursEl.textContent   = String(hours).padStart(2, '0');
            if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
            if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        this.timerIntervals.set(productId, interval);
    }

    updateStyles() {
        const container = this.querySelector('.timer-container');
        if (!container) return;

        const vars = {
            '--color1': this.settings.color1,
            '--color2': this.settings.color2,
            '--color3': this.settings.color3,
            '--color4': this.settings.color4,
            '--color5': this.settings.color5,
            '--color6': this.settings.color6,
            '--color7': this.settings.color7,
            '--color8': this.settings.color8,
            '--title-font-family':   this.settings.titleFontFamily,
            '--urgency-font-family': this.settings.urgencyFontFamily,
            '--price-font-family':   this.settings.priceFontFamily,
            '--timer-font-family':   this.settings.timerFontFamily,
            '--cta-font-family':     this.settings.ctaFontFamily,
            '--title-font-size':     `${this.settings.titleFontSize}px`,
            '--urgency-font-size':   `${this.settings.urgencyFontSize}px`,
            '--price-font-size':     `${this.settings.priceFontSize}px`,
            '--timer-font-size':     `${this.settings.timerFontSize}px`,
            '--cta-font-size':       `${this.settings.ctaFontSize}px`,
            '--corner-radius':       `${this.settings.cornerRadius}px`,
        };

        Object.entries(vars).forEach(([k, v]) => container.style.setProperty(k, v));

        this.querySelectorAll('.urgency-card').forEach(card => {
            card.style.border = this.settings.borderWidth > 0
                ? `${this.settings.borderWidth}px solid ${this.settings.color1}`
                : 'none';
        });
    }
}

customElements.define('urgency-timer', UrgencyTimerElement);
