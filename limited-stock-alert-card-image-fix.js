class LimitedStockAlertElement extends HTMLElement {
    constructor() {
        super();
        this.products = [];
        this.currentIndex = 0;
        this.rotationInterval = null;
        this.settings = {
            color1: '#e74c3c', color2: '#ffffff', color3: '#2c3e50',
            color4: '#f39c12', color5: '#ecf0f1', color6: '#c0392b',
            color7: '#27ae60', color8: '#e67e22',
            borderWidth: 2, cornerRadius: 12,
            alertText: '⚠️ LOW STOCK ALERT', buttonText: 'Grab It Now',
            showProgressBar: true, stockThreshold: 10,
            autoRotate: true, rotationSpeed: 5,
            titleFontFamily: 'Poppins', titleFontSize: 18,
            priceFontFamily: 'Montserrat', priceFontSize: 24,
            alertFontFamily: 'Roboto', alertFontSize: 14,
            buttonFontFamily: 'Poppins', buttonFontSize: 14,
            stockFontFamily: 'Roboto Mono', stockFontSize: 16,
            titleTag: 'H3', cardWidth: 100
        };
        this.isRendered = false;
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
                    if (!this.isRendered) { this.pendingProductsData = data; return; }
                    this.products = data || [];
                    this.currentIndex = 0;
                    this.renderProducts();
                } catch (e) { console.error('Error parsing products data:', e); }
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
                } catch (e) { console.error('Error parsing settings:', e); }
            }
        }
    }

    disconnectedCallback() {
        if (this.rotationInterval) clearInterval(this.rotationInterval);
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
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                :host { display: block; width: 100%; }

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
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes fillBar {
                    from { width: 0; }
                    to { width: var(--stock-width); }
                }

                /* ── OUTER WRAPPER: centers card, respects cardWidth ── */
                .alert-outer {
                    width: 100%;
                    display: flex;
                    justify-content: center;
                }

                .alert-container {
                    padding: 20px;
                    width: var(--card-width, 100%);
                    max-width: 100%;
                    background: linear-gradient(135deg, var(--color5) 0%, #fff 100%);
                    transition: width 0.3s ease;
                }

                .alert-header {
                    background: linear-gradient(135deg, var(--color1) 0%, var(--color6) 100%);
                    color: var(--color2);
                    padding: 15px 25px;
                    border-radius: 10px;
                    text-align: center;
                    margin-bottom: 25px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    animation: urgentPulse 2s ease-in-out infinite;
                }

                .alert-title {
                    font-family: var(--alert-font-family);
                    font-size: calc(var(--alert-font-size) + 6px);
                    font-weight: 700;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    text-shadow: 0 2px 8px rgba(0,0,0,0.2);
                }

                /* ── CSS GRID STACK: all cards same cell = stable width ── */
                .product-carousel {
                    display: grid;
                    grid-template-columns: 1fr;
                    grid-template-rows: 1fr;
                    width: 100%;
                    overflow: hidden;
                }

                .stock-card {
                    grid-column: 1;
                    grid-row: 1;
                    width: 100%;
                    min-width: 0;
                    background: var(--color2);
                    border-radius: var(--corner-radius);
                    overflow: hidden;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
                    visibility: hidden;
                    opacity: 0;
                    transition: opacity 0.4s ease, visibility 0.4s ease;
                    pointer-events: none;
                }

                .stock-card.active {
                    visibility: visible;
                    opacity: 1;
                    pointer-events: auto;
                    animation: fadeIn 0.4s ease forwards;
                }

                .product-image-container {
                    position: relative;
                    width: 100%;
                    height: 300px;
                    overflow: hidden;
                    background: var(--color5);
                    flex-shrink: 0;
                }

                .product-image {
                    display: block;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    object-position: center;
                    transition: transform 0.4s ease;
                }

                .stock-card.active:hover .product-image { transform: scale(1.08); }

                .stock-badge {
                    position: absolute;
                    top: 12px; left: 12px;
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
                    box-shadow: 0 3px 10px rgba(0,0,0,0.2);
                }

                .out-of-stock-badge { background: var(--color3); animation: none; }

                .discount-badge {
                    position: absolute;
                    top: 12px; right: 12px;
                    background: linear-gradient(135deg, var(--color4) 0%, var(--color8) 100%);
                    color: var(--color2);
                    width: 60px; height: 60px;
                    border-radius: 50%;
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    font-weight: 800;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.25);
                    z-index: 10;
                    border: 3px solid var(--color2);
                }

                .discount-value { font-size: 20px; line-height: 1; font-family: var(--stock-font-family); }
                .discount-label { font-size: 9px; text-transform: uppercase; font-family: var(--alert-font-family); }

                .product-content { padding: 20px; width: 100%; }

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
                    width: 100%;
                }

                .stock-info-section {
                    background: rgba(0,0,0,0.03);
                    padding: 12px;
                    border-radius: 8px;
                    margin-bottom: 15px;
                    border: 1px solid rgba(0,0,0,0.08);
                    width: 100%;
                }

                .out-of-stock-section { background: rgba(44,62,80,0.05); border: 1px solid rgba(44,62,80,0.2); }

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
                    width: 100%; height: 8px;
                    background: var(--color5);
                    border-radius: 10px; overflow: hidden;
                }

                .stock-progress-bar {
                    height: 100%; border-radius: 10px;
                    animation: fillBar 1.5s ease-out forwards;
                    box-shadow: 0 0 10px var(--stock-color);
                }

                .price-section {
                    margin-bottom: 15px;
                    padding: 12px 0;
                    border-top: 1px solid var(--color5);
                    border-bottom: 1px solid var(--color5);
                    width: 100%;
                }

                .price-wrapper {
                    display: flex; align-items: baseline;
                    gap: 10px; justify-content: center; flex-wrap: wrap;
                }

                .product-price {
                    font-family: var(--price-font-family);
                    font-size: var(--price-font-size);
                    font-weight: 800; color: var(--color1);
                }

                .product-compare-price {
                    font-family: var(--price-font-family);
                    font-size: calc(var(--price-font-size) * 0.6);
                    color: #999; text-decoration: line-through; opacity: 0.7;
                }

                .action-button {
                    display: block; width: 100%;
                    padding: 14px 20px;
                    background: linear-gradient(135deg, var(--color1) 0%, var(--color6) 100%);
                    color: var(--color2);
                    font-family: var(--button-font-family);
                    font-size: var(--button-font-size);
                    font-weight: 700; text-transform: uppercase;
                    letter-spacing: 1.5px; border: none;
                    border-radius: 25px; cursor: pointer;
                    transition: all 0.3s ease;
                    text-decoration: none; text-align: center;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
                }

                .action-button:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(0,0,0,0.2); }
                .action-button.disabled {
                    background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
                    cursor: not-allowed; opacity: 0.7;
                }
                .action-button.disabled:hover { transform: none; }

                .navigation-controls {
                    display: flex; justify-content: center;
                    align-items: center; gap: 20px; margin-top: 20px;
                }

                .nav-arrow {
                    width: 40px; height: 40px; border-radius: 50%;
                    background: var(--color2);
                    border: 2px solid var(--color1);
                    color: var(--color1);
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: all 0.3s ease;
                    font-size: 20px; font-weight: 700;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1); flex-shrink: 0;
                }

                .nav-arrow:hover { background: var(--color1); color: var(--color2); transform: scale(1.1); }

                .navigation-dots { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }

                .nav-dot {
                    width: 10px; height: 10px; border-radius: 50%;
                    background: rgba(0,0,0,0.2); cursor: pointer;
                    transition: all 0.3s ease; border: 2px solid transparent; flex-shrink: 0;
                }

                .nav-dot:hover { background: rgba(0,0,0,0.35); transform: scale(1.2); }
                .nav-dot.active {
                    background: var(--color1); border-color: var(--color2);
                    transform: scale(1.3); box-shadow: 0 0 15px var(--color1);
                }

                .empty-state {
                    text-align: center; padding: 80px 20px;
                    color: #999; font-family: var(--alert-font-family); font-size: 18px;
                }

                .empty-state::before { content: '📦'; display: block; font-size: 80px; margin-bottom: 20px; }

                @media (max-width: 768px) {
                    .alert-container { padding: 15px; }
                    .product-image-container { height: 250px; }
                    .product-content { padding: 16px; }
                }

                @media (max-width: 480px) {
                    .product-image-container { height: 220px; }
                    .nav-arrow { width: 35px; height: 35px; font-size: 16px; }
                }
            </style>

            <div class="alert-outer">
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
            </div>
        `;
    }

    renderProducts() {
        const alertTitle = this.querySelector('.alert-title');
        const carousel = this.querySelector('.product-carousel');
        const dotsContainer = this.querySelector('.navigation-dots');

        if (alertTitle) alertTitle.textContent = this.settings.alertText || '⚠️ LOW STOCK ALERT';
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

        // Render ALL cards at once into the grid stack
        carousel.innerHTML = this.products.map(p => this.renderProductCard(p)).join('');

        this.showCard(this.currentIndex);
        this.renderDots();
        this.setupNavigation();
        this.setupRotation();
        this.updateStyles();
    }

    showCard(index) {
        const cards = this.querySelectorAll('.stock-card');
        cards.forEach((card, i) => card.classList.toggle('active', i === index));
        this.currentIndex = index;
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
                        </div>` : ''}
                    <img src="${product.imageUrl}" alt="${product.name}"
                         class="product-image"
                         onerror="this.src='https://via.placeholder.com/600x300'">
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
                                     style="background: ${stockColor}; --stock-color: ${stockColor}; --stock-width: ${stockPercentage}%; width: ${stockPercentage}%;"></div>
                            </div>` : ''}
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
        dotsContainer.innerHTML = this.products.map((_, i) =>
            `<div class="nav-dot ${i === this.currentIndex ? 'active' : ''}" data-index="${i}"></div>`
        ).join('');

        dotsContainer.querySelectorAll('.nav-dot').forEach(dot => {
            dot.addEventListener('click', (e) => {
                this.showCard(parseInt(e.target.dataset.index));
                this.updateDots();
                this.setupRotation();
            });
        });
    }

    updateDots() {
        this.querySelectorAll('.nav-dot').forEach((dot, i) =>
            dot.classList.toggle('active', i === this.currentIndex));
    }

    setupNavigation() {
        const prevBtn = this.querySelector('.nav-prev');
        const nextBtn = this.querySelector('.nav-next');
        if (prevBtn) {
            prevBtn.onclick = () => {
                this.showCard((this.currentIndex - 1 + this.products.length) % this.products.length);
                this.updateDots(); this.setupRotation();
            };
        }
        if (nextBtn) {
            nextBtn.onclick = () => {
                this.showCard((this.currentIndex + 1) % this.products.length);
                this.updateDots(); this.setupRotation();
            };
        }
    }

    setupRotation() {
        if (this.rotationInterval) clearInterval(this.rotationInterval);
        if (!this.settings.autoRotate || this.products.length <= 1) return;
        const speed = (this.settings.rotationSpeed || 5) * 1000;
        this.rotationInterval = setInterval(() => {
            this.showCard((this.currentIndex + 1) % this.products.length);
            this.updateDots();
        }, speed);
    }

    updateStyles() {
        const container = this.querySelector('.alert-container');
        if (!container) return;

        const cardWidth = this.settings.cardWidth || 100;
        container.style.setProperty('--card-width', `${cardWidth}%`);

        const vars = {
            '--color1': this.settings.color1, '--color2': this.settings.color2,
            '--color3': this.settings.color3, '--color4': this.settings.color4,
            '--color5': this.settings.color5, '--color6': this.settings.color6,
            '--color7': this.settings.color7, '--color8': this.settings.color8,
            '--title-font-family': this.settings.titleFontFamily,
            '--price-font-family': this.settings.priceFontFamily,
            '--alert-font-family': this.settings.alertFontFamily,
            '--button-font-family': this.settings.buttonFontFamily,
            '--stock-font-family': this.settings.stockFontFamily,
            '--title-font-size': `${this.settings.titleFontSize}px`,
            '--price-font-size': `${this.settings.priceFontSize}px`,
            '--alert-font-size': `${this.settings.alertFontSize}px`,
            '--button-font-size': `${this.settings.buttonFontSize}px`,
            '--stock-font-size': `${this.settings.stockFontSize}px`,
            '--corner-radius': `${this.settings.cornerRadius}px`
        };

        Object.entries(vars).forEach(([k, v]) => container.style.setProperty(k, v));

        this.querySelectorAll('.stock-card').forEach(card => {
            card.style.border = this.settings.borderWidth > 0
                ? `${this.settings.borderWidth}px solid ${this.settings.color5}`
                : 'none';
        });
    }
}

customElements.define('limited-stock-alert', LimitedStockAlertElement);
