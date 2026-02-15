class LimitedStockAlertElement extends HTMLElement {
    constructor() {
        super();
        this.products = [];
        this.currentIndex = 0;
        this.rotationInterval = null;
        this.settings = {
            color1: '#e74c3c',
            color2: '#ffffff',
            color3: '#2c3e50',
            color4: '#f39c12',
            color5: '#ecf0f1',
            color6: '#c0392b',
            color7: '#27ae60',
            color8: '#e67e22',
            borderWidth: 2,
            cornerRadius: 12,
            alertText: '⚠️ LOW STOCK ALERT',
            buttonText: 'Grab It Now',
            showProgressBar: true,
            stockThreshold: 10,
            autoRotate: true,
            rotationSpeed: 5,
            titleFontFamily: 'Poppins',
            titleFontSize: 18,
            priceFontFamily: 'Montserrat',
            priceFontSize: 24,
            alertFontFamily: 'Roboto',
            alertFontSize: 14,
            buttonFontFamily: 'Poppins',
            buttonFontSize: 14,
            stockFontFamily: 'Roboto Mono',
            stockFontSize: 16,
            titleTag: 'H3'
        };
        this.isRendered = false;
        this.pendingProductsData = null;
        // ResizeObserver to keep the element responsive
        this.resizeObserver = null;
    }

    connectedCallback() {
        this.render();
        this.isRendered = true;

        // FIX: Make the host element fill 100% of its container width & height
        this.style.display = 'block';
        this.style.width = '100%';
        this.style.height = '100%';
        this.style.overflow = 'hidden';

        // FIX: Use ResizeObserver so the inner carousel height tracks the host element
        this.resizeObserver = new ResizeObserver(() => {
            this._applyResponsiveSize();
        });
        this.resizeObserver.observe(this);
        this._applyResponsiveSize();

        if (this.pendingProductsData) {
            this.products = this.pendingProductsData || [];
            this.pendingProductsData = null;
            this.renderProducts();
        }
    }

    // FIX: Read actual rendered dimensions and apply them to inner elements
    _applyResponsiveSize() {
        const w = this.offsetWidth || 0;
        const h = this.offsetHeight || 0;
        const container = this.querySelector('.alert-container');
        if (container) {
            container.style.width = '100%';
            container.style.maxWidth = '100%';
            container.style.height = h > 0 ? `${h}px` : 'auto';
            container.style.overflow = 'hidden';
        }
        // Keep image container proportional (approx 40% of total height, min 180px)
        const imgHeight = h > 0 ? Math.max(Math.round(h * 0.40), 180) : 260;
        this.querySelectorAll('.product-image-container').forEach(el => {
            el.style.height = `${imgHeight}px`;
        });
        // Carousel wrapper should fill remaining space
        const carousel = this.querySelector('.product-carousel');
        if (carousel) {
            carousel.style.width = '100%';
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
                    this.products = data || [];
                    this.currentIndex = 0;
                    this.renderProducts();
                } catch (e) {
                    console.error('Error parsing products data:', e);
                }
            } else if (name === 'settings') {
                try {
                    const newSettings = JSON.parse(newValue);
                    const oldAutoRotate = this.settings.autoRotate;
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
        if (this.resizeObserver) this.resizeObserver.disconnect();
    }

    calculateDiscount(price, comparePrice) {
        if (!comparePrice || comparePrice === price) return null;
        const priceNum = parseFloat(price.replace(/[^0-9.]/g, ''));
        const compareNum = parseFloat(comparePrice.replace(/[^0-9.]/g, ''));
        if (isNaN(priceNum) || isNaN(compareNum) || compareNum <= priceNum) return null;
        const discount = Math.round(((compareNum - priceNum) / compareNum) * 100);
        return discount > 0 ? discount : null;
    }

    getStockPercentage(stockLevel) {
        if (stockLevel === 0) return 0;
        return Math.min((stockLevel / this.settings.stockThreshold) * 100, 100);
    }

    getStockColor(percentage) {
        if (percentage <= 30) return this.settings.color1;
        if (percentage <= 60) return this.settings.color4;
        return this.settings.color7;
    }

    render() {
        this.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&family=Montserrat:wght@600;700;800;900&family=Roboto:wght@400;500;700&family=Roboto+Mono:wght@500;600;700&family=Inter:wght@400;600;700&display=swap');

                * { box-sizing: border-box; }

                @keyframes urgentPulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.9; }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                @keyframes flash {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
                @keyframes slideInFromRight {
                    from { opacity: 0; transform: translateX(100%) scale(0.9); }
                    to   { opacity: 1; transform: translateX(0) scale(1); }
                }
                @keyframes slideOutToLeft {
                    from { opacity: 1; transform: translateX(0) scale(1); }
                    to   { opacity: 0; transform: translateX(-100%) scale(0.9); }
                }
                @keyframes fillBar {
                    from { width: 0; }
                    to   { width: var(--stock-width); }
                }

                /* FIX: container fills 100% of host, no fixed max-width */
                .alert-container {
                    width: 100%;
                    max-width: 100%;
                    height: 100%;
                    margin: 0;
                    padding: 20px;
                    background: linear-gradient(135deg, var(--color5) 0%, #fff 100%);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                .alert-header {
                    flex-shrink: 0;
                    background: linear-gradient(135deg, var(--color1) 0%, var(--color6) 100%);
                    color: var(--color2);
                    padding: 15px 25px;
                    border-radius: 10px;
                    text-align: center;
                    margin-bottom: 20px;
                    box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);
                    animation: urgentPulse 2s ease-in-out infinite;
                }

                .alert-title {
                    font-family: var(--alert-font-family);
                    font-size: calc(var(--alert-font-size) + 6px);
                    font-weight: 700;
                    margin: 0;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                }

                /* FIX: carousel is a flex column that fills remaining height */
                .product-carousel {
                    flex: 1;
                    position: relative;
                    overflow: hidden;
                    width: 100%;
                    /* FIX: fixed min-height removed — sizing controlled by host dimensions */
                }

                /* FIX: all cards are 100% width of the carousel — no size variation from images */
                .stock-card {
                    width: 100%;
                    background: var(--color2);
                    border-radius: var(--corner-radius);
                    overflow: hidden;
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;        /* FIX: explicit right:0 keeps width locked */
                    opacity: 0;
                    transform: translateX(100%) scale(0.9);
                    transition: none;
                    /* FIX: prevent the card from pushing its own width wider than the carousel */
                    box-sizing: border-box;
                }

                .stock-card.active {
                    opacity: 1;
                    transform: translateX(0) scale(1);
                    animation: slideInFromRight 0.6s ease-out forwards;
                    position: relative;
                }

                .stock-card.exiting {
                    animation: slideOutToLeft 0.6s ease-out forwards;
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                }

                .stock-card:hover {
                    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.15);
                }

                .stock-badge {
                    position: absolute;
                    top: 12px;
                    left: 12px;
                    background: var(--color1);
                    color: var(--color2);
                    padding: 6px 14px;
                    border-radius: 20px;
                    font-family: var(--alert-font-family);
                    font-size: calc(var(--alert-font-size) - 2px);
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    z-index: 10;
                    animation: flash 1.5s ease-in-out infinite;
                    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
                }

                .out-of-stock-badge {
                    background: var(--color3);
                    animation: none;
                }

                /* FIX: image container uses a fixed height set via JS (_applyResponsiveSize)
                   and object-fit:cover ensures no layout shift regardless of image ratio */
                .product-image-container {
                    position: relative;
                    width: 100%;
                    height: 260px;   /* default; overridden by _applyResponsiveSize */
                    overflow: hidden;
                    background: var(--color5);
                    flex-shrink: 0;
                }

                .product-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;      /* FIX: fills box without stretching */
                    object-position: center;
                    display: block;
                    transition: transform 0.4s ease;
                }

                .stock-card:hover .product-image {
                    transform: scale(1.08);
                }

                .discount-badge {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    background: linear-gradient(135deg, var(--color4) 0%, var(--color8) 100%);
                    color: var(--color2);
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    font-weight: 800;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.25);
                    z-index: 10;
                    border: 3px solid var(--color2);
                }

                .discount-value {
                    font-size: 20px;
                    line-height: 1;
                    font-family: var(--stock-font-family);
                }

                .discount-label {
                    font-size: 9px;
                    text-transform: uppercase;
                    font-family: var(--alert-font-family);
                }

                .product-content {
                    padding: 20px;
                }

                .product-name {
                    font-family: var(--title-font-family);
                    font-size: var(--title-font-size);
                    font-weight: 700;
                    margin: 0 0 12px 0;
                    color: var(--color3);
                    min-height: 48px;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .stock-info-section {
                    background: rgba(231, 76, 60, 0.05);
                    padding: 12px;
                    border-radius: 8px;
                    margin-bottom: 15px;
                    border: 1px solid rgba(231, 76, 60, 0.2);
                }

                .out-of-stock-section {
                    background: rgba(44, 62, 80, 0.05);
                    border: 1px solid rgba(44, 62, 80, 0.2);
                }

                .stock-text {
                    font-family: var(--stock-font-family);
                    font-size: var(--stock-font-size);
                    font-weight: 700;
                    color: var(--stock-color);
                    text-align: center;
                    margin: 0 0 8px 0;
                    animation: shake 0.5s ease-in-out infinite;
                }

                .out-of-stock-text { animation: none; }

                .stock-progress-container {
                    width: 100%;
                    height: 8px;
                    background: var(--color5);
                    border-radius: 10px;
                    overflow: hidden;
                    position: relative;
                }

                .stock-progress-bar {
                    height: 100%;
                    background: var(--stock-color);
                    border-radius: 10px;
                    transition: width 1s ease-out;
                    animation: fillBar 1.5s ease-out;
                    box-shadow: 0 0 10px var(--stock-color);
                }

                .price-section {
                    margin-bottom: 15px;
                    padding: 12px 0;
                    border-top: 1px solid var(--color5);
                    border-bottom: 1px solid var(--color5);
                }

                .price-wrapper {
                    display: flex;
                    align-items: baseline;
                    gap: 10px;
                    justify-content: center;
                }

                .product-price {
                    font-family: var(--price-font-family);
                    font-size: var(--price-font-size);
                    font-weight: 800;
                    color: var(--color1);
                }

                .product-compare-price {
                    font-family: var(--price-font-family);
                    font-size: calc(var(--price-font-size) * 0.6);
                    color: #999;
                    text-decoration: line-through;
                    opacity: 0.7;
                }

                .action-button {
                    display: block;
                    width: 100%;
                    padding: 14px 20px;
                    background: linear-gradient(135deg, var(--color1) 0%, var(--color6) 100%);
                    color: var(--color2);
                    font-family: var(--button-font-family);
                    font-size: var(--button-font-size);
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    border: none;
                    border-radius: 25px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-decoration: none;
                    text-align: center;
                    box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);
                }

                .action-button:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 6px 20px rgba(231, 76, 60, 0.4);
                }

                .action-button.disabled {
                    background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
                    cursor: not-allowed;
                    opacity: 0.7;
                }

                .action-button.disabled:hover {
                    transform: none;
                    box-shadow: 0 4px 15px rgba(149, 165, 166, 0.3);
                }

                .navigation-controls {
                    flex-shrink: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 20px;
                    margin-top: 16px;
                }

                .nav-arrow {
                    width: 40px;
                    height: 40px;
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
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }

                .nav-arrow:hover {
                    background: var(--color1);
                    color: var(--color2);
                    transform: scale(1.1);
                }

                .navigation-dots {
                    display: flex;
                    gap: 10px;
                }

                .nav-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: rgba(231, 76, 60, 0.3);
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: 2px solid transparent;
                }

                .nav-dot:hover {
                    background: rgba(231, 76, 60, 0.5);
                    transform: scale(1.2);
                }

                .nav-dot.active {
                    background: var(--color1);
                    border-color: var(--color2);
                    transform: scale(1.3);
                    box-shadow: 0 0 15px var(--color1);
                }

                .empty-state {
                    text-align: center;
                    padding: 80px 20px;
                    color: #999;
                    font-family: var(--alert-font-family);
                    font-size: 18px;
                }

                .empty-state::before {
                    content: '📦';
                    display: block;
                    font-size: 80px;
                    margin-bottom: 20px;
                }

                /* Responsive tweaks — still relative, not fixed px */
                @media (max-width: 768px) {
                    .alert-container { padding: 15px; }
                    .product-content { padding: 16px; }
                    .nav-arrow { width: 35px; height: 35px; font-size: 16px; }
                }
            </style>

            <div class="alert-container">
                <div class="alert-header">
                    <h1 class="alert-title"></h1>
                </div>
                <div class="product-carousel"></div>
                <div class="navigation-controls">
                    <div class="nav-arrow nav-prev">‹</div>
                    <div class="navigation-dots"></div>
                    <div class="nav-arrow nav-next">›</div>
                </div>
            </div>
        `;
    }

    renderProducts() {
        const alertTitle = this.querySelector('.alert-title');
        const carousel = this.querySelector('.product-carousel');
        const dotsContainer = this.querySelector('.navigation-dots');

        if (alertTitle) {
            alertTitle.textContent = this.settings.alertText || '⚠️ LOW STOCK ALERT';
        }

        if (!carousel || !dotsContainer) return;

        if (this.products.length === 0) {
            carousel.innerHTML = '<div class="empty-state">No low stock products to display</div>';
            dotsContainer.innerHTML = '';
            const prev = this.querySelector('.nav-prev');
            const next = this.querySelector('.nav-next');
            if (prev) prev.style.display = 'none';
            if (next) next.style.display = 'none';
            return;
        }

        const prev = this.querySelector('.nav-prev');
        const next = this.querySelector('.nav-next');
        if (prev) prev.style.display = 'flex';
        if (next) next.style.display = 'flex';

        this.renderCurrentProduct();
        this.renderDots();
        this.setupNavigation();
        this.setupRotation();
        this.updateStyles();
        // Re-apply responsive sizing after new cards are rendered
        this._applyResponsiveSize();
    }

    renderCurrentProduct() {
        const carousel = this.querySelector('.product-carousel');
        if (!carousel || !this.products[this.currentIndex]) return;

        const product = this.products[this.currentIndex];
        const cardHTML = this.renderProductCard(product);

        const existingCard = carousel.querySelector('.stock-card.active');
        if (existingCard) {
            existingCard.classList.remove('active');
            existingCard.classList.add('exiting');
            setTimeout(() => existingCard.remove(), 600);
        }

        carousel.insertAdjacentHTML('beforeend', cardHTML);

        requestAnimationFrame(() => {
            const newCard = carousel.querySelector('.stock-card:last-child');
            if (newCard) {
                newCard.classList.add('active');
                // Apply border from settings to the new card
                if (this.settings.borderWidth > 0) {
                    newCard.style.border = `${this.settings.borderWidth}px solid ${this.settings.color5}`;
                }
                // Re-apply responsive image height to new card
                this._applyResponsiveSize();
            }
        });
    }

    renderProductCard(product) {
        const hasComparePrice = product.compareAtPrice && product.compareAtPrice !== product.price;
        const displayPrice = product.price || 'Price not available';
        const discount = hasComparePrice ? this.calculateDiscount(product.price, product.compareAtPrice) : null;
        const stockLevel = product.stockQuantity || 0;
        const stockPercentage = this.getStockPercentage(stockLevel);
        const stockColor = this.getStockColor(stockPercentage);
        const titleTag = this.settings.titleTag || 'H3';
        const isOutOfStock = stockLevel === 0;

        return `
            <div class="stock-card">
                <div class="product-image-container">
                    <div class="stock-badge ${isOutOfStock ? 'out-of-stock-badge' : ''}">
                        ${isOutOfStock ? 'Out of Stock' : `Only ${stockLevel} Left!`}
                    </div>
                    ${discount ? `
                        <div class="discount-badge">
                            <div class="discount-value">${discount}%</div>
                            <div class="discount-label">OFF</div>
                        </div>
                    ` : ''}
                    <img src="${product.imageUrl}"
                         alt="${product.name}"
                         class="product-image"
                         onerror="this.src='https://via.placeholder.com/400x260'">
                </div>
                <div class="product-content">
                    <${titleTag} class="product-name">${product.name}</${titleTag}>
                    <div class="stock-info-section ${isOutOfStock ? 'out-of-stock-section' : ''}">
                        <div class="stock-text ${isOutOfStock ? 'out-of-stock-text' : ''}"
                             style="--stock-color: ${isOutOfStock ? this.settings.color3 : stockColor};">
                            ${isOutOfStock ? 'Currently Out of Stock' : `Hurry! Only ${stockLevel} in stock`}
                        </div>
                        ${this.settings.showProgressBar && !isOutOfStock ? `
                            <div class="stock-progress-container">
                                <div class="stock-progress-bar"
                                     style="--stock-color: ${stockColor}; --stock-width: ${stockPercentage}%; width: ${stockPercentage}%;"></div>
                            </div>
                        ` : ''}
                    </div>
                    <div class="price-section">
                        <div class="price-wrapper">
                            <span class="product-price">${displayPrice}</span>
                            ${hasComparePrice ? `<span class="product-compare-price">${product.compareAtPrice}</span>` : ''}
                        </div>
                    </div>
                    <a href="${product.productUrl}"
                       class="action-button ${isOutOfStock ? 'disabled' : ''}">
                        ${isOutOfStock ? 'Out of Stock' : this.settings.buttonText}
                    </a>
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

        dotsContainer.innerHTML = this.products.map((_, index) =>
            `<div class="nav-dot ${index === this.currentIndex ? 'active' : ''}" data-index="${index}"></div>`
        ).join('');

        dotsContainer.querySelectorAll('.nav-dot').forEach(dot => {
            dot.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.currentIndex = index;
                this.renderCurrentProduct();
                this.updateDots();
                this.setupRotation();
            });
        });
    }

    updateDots() {
        this.querySelectorAll('.nav-dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentIndex);
        });
    }

    setupNavigation() {
        const prevBtn = this.querySelector('.nav-prev');
        const nextBtn = this.querySelector('.nav-next');

        if (prevBtn) {
            prevBtn.onclick = () => {
                this.currentIndex = (this.currentIndex - 1 + this.products.length) % this.products.length;
                this.renderCurrentProduct();
                this.updateDots();
                this.setupRotation();
            };
        }

        if (nextBtn) {
            nextBtn.onclick = () => {
                this.currentIndex = (this.currentIndex + 1) % this.products.length;
                this.renderCurrentProduct();
                this.updateDots();
                this.setupRotation();
            };
        }
    }

    setupRotation() {
        if (this.rotationInterval) clearInterval(this.rotationInterval);
        if (!this.settings.autoRotate || this.products.length <= 1) return;

        const rotationSpeed = (this.settings.rotationSpeed || 5) * 1000;
        this.rotationInterval = setInterval(() => {
            this.currentIndex = (this.currentIndex + 1) % this.products.length;
            this.renderCurrentProduct();
            this.updateDots();
        }, rotationSpeed);
    }

    updateStyles() {
        const container = this.querySelector('.alert-container');
        if (!container) return;

        // All 8 color CSS variables
        container.style.setProperty('--color1', this.settings.color1);
        container.style.setProperty('--color2', this.settings.color2);
        container.style.setProperty('--color3', this.settings.color3);
        container.style.setProperty('--color4', this.settings.color4);
        container.style.setProperty('--color5', this.settings.color5);
        container.style.setProperty('--color6', this.settings.color6);
        container.style.setProperty('--color7', this.settings.color7);
        container.style.setProperty('--color8', this.settings.color8);

        // Font family variables
        container.style.setProperty('--title-font-family', this.settings.titleFontFamily);
        container.style.setProperty('--price-font-family', this.settings.priceFontFamily);
        container.style.setProperty('--alert-font-family', this.settings.alertFontFamily);
        container.style.setProperty('--button-font-family', this.settings.buttonFontFamily);
        container.style.setProperty('--stock-font-family', this.settings.stockFontFamily);

        // Font size variables
        container.style.setProperty('--title-font-size', `${this.settings.titleFontSize}px`);
        container.style.setProperty('--price-font-size', `${this.settings.priceFontSize}px`);
        container.style.setProperty('--alert-font-size', `${this.settings.alertFontSize}px`);
        container.style.setProperty('--button-font-size', `${this.settings.buttonFontSize}px`);
        container.style.setProperty('--stock-font-size', `${this.settings.stockFontSize}px`);

        // Border radius
        container.style.setProperty('--corner-radius', `${this.settings.cornerRadius}px`);

        // Apply border to all current cards
        this.querySelectorAll('.stock-card').forEach(card => {
            card.style.border = this.settings.borderWidth > 0
                ? `${this.settings.borderWidth}px solid ${this.settings.color5}`
                : 'none';
        });
    }
}

customElements.define('limited-stock-alert', LimitedStockAlertElement);
