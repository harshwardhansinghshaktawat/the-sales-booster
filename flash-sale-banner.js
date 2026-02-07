class FlashSaleBannerElement extends HTMLElement {
    constructor() {
        super();
        this.products = [];
        this.currentIndex = 0;
        this.rotationInterval = null;
        this.countdownInterval = null;
        this.endTime = null;
        this.settings = {
            color1: '#ff0844',          // Primary red
            color2: '#ffffff',          // White
            color3: '#1a1a2e',          // Dark blue
            color4: '#ffbe0b',          // Yellow
            color5: '#fb5607',          // Orange
            color6: '#8338ec',          // Purple
            color7: '#3a86ff',          // Blue
            color8: '#06ffa5',          // Mint green
            borderWidth: 0,
            cornerRadius: 20,
            bannerText: '⚡ FLASH SALE',
            ctaText: 'Shop Now',
            autoRotate: true,
            rotationSpeed: 5,
            showCountdown: true,
            titleFontFamily: 'Bebas Neue',
            titleFontSize: 32,
            descFontFamily: 'Roboto',
            descFontSize: 15,
            priceFontFamily: 'Montserrat',
            priceFontSize: 36,
            bannerFontFamily: 'Archivo Black',
            bannerFontSize: 24,
            ctaFontFamily: 'Poppins',
            ctaFontSize: 16,
            timerFontFamily: 'Orbitron',
            timerFontSize: 28,
            titleTag: 'H2'
        };
        this.isRendered = false;
        this.pendingProductsData = null;
    }

    connectedCallback() {
        console.log('Flash Sale Banner connected');
        this.render();
        this.isRendered = true;
        
        if (this.pendingProductsData) {
            this.products = this.pendingProductsData.products || [];
            this.endTime = this.pendingProductsData.endTime;
            this.pendingProductsData = null;
            this.renderBanner();
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
                    console.log('Flash Sale: Products received:', data.products?.length);
                    
                    if (!this.isRendered) {
                        this.pendingProductsData = data;
                        return;
                    }
                    
                    this.products = data.products || [];
                    this.endTime = data.endTime;
                    this.currentIndex = 0;
                    this.renderBanner();
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
        if (this.rotationInterval) {
            clearInterval(this.rotationInterval);
        }
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
    }

    calculateDiscount(price, comparePrice) {
        if (!comparePrice || comparePrice === price) return null;
        
        const priceNum = parseFloat(price.replace(/[^0-9.]/g, ''));
        const compareNum = parseFloat(comparePrice.replace(/[^0-9.]/g, ''));
        
        if (isNaN(priceNum) || isNaN(compareNum) || compareNum <= priceNum) return null;
        
        const discount = Math.round(((compareNum - priceNum) / compareNum) * 100);
        return discount > 0 ? discount : null;
    }

    render() {
        this.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Roboto:wght@300;400;700&family=Montserrat:wght@600;700;800;900&family=Archivo+Black&family=Poppins:wght@400;600;700;800&family=Orbitron:wght@500;700;900&family=Anton&family=Righteous&family=Syncopate:wght@400;700&family=Teko:wght@400;600;700&display=swap');
                
                * {
                    box-sizing: border-box;
                }
                
                :host {
                    display: block;
                    width: 100%;
                    max-width: 100%;
                    --color1: #ff0844;
                    --color2: #ffffff;
                    --color3: #1a1a2e;
                    --color4: #ffbe0b;
                    --color5: #fb5607;
                    --color6: #8338ec;
                    --color7: #3a86ff;
                    --color8: #06ffa5;
                }
                
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                
                @keyframes glow {
                    0%, 100% { 
                        box-shadow: 0 0 15px rgba(255, 8, 68, 0.3);
                    }
                    50% { 
                        box-shadow: 0 0 25px rgba(255, 8, 68, 0.5);
                    }
                }
                
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
                
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }
                
                @keyframes shimmer {
                    0% { background-position: -1000px 0; }
                    100% { background-position: 1000px 0; }
                }
                
                .banner-container {
                    width: 100%;
                    max-width: 500px;
                    margin: 0 auto;
                    background: linear-gradient(135deg, var(--color3) 0%, var(--color6) 100%);
                    position: relative;
                    overflow: hidden;
                    animation: glow 3s ease-in-out infinite;
                }
                
                .banner-container::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, 
                        transparent,
                        rgba(255, 255, 255, 0.08),
                        transparent
                    );
                    animation: shimmer 3s infinite;
                }
                
                .banner-header {
                    background: linear-gradient(135deg, var(--color1) 0%, var(--color5) 100%);
                    padding: 10px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 12px;
                    position: relative;
                    overflow: hidden;
                }
                
                .banner-header::after {
                    content: '';
                    position: absolute;
                    top: -50%;
                    right: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
                    animation: float 4s ease-in-out infinite;
                }
                
                .banner-title {
                    font-family: var(--banner-font-family);
                    font-size: calc(var(--banner-font-size) * 0.75);
                    color: var(--color2);
                    margin: 0;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
                    animation: pulse 2s ease-in-out infinite;
                    z-index: 1;
                    flex: 1;
                    text-align: center;
                }
                
                .countdown-wrapper {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                    z-index: 1;
                    justify-content: center;
                    width: 100%;
                }
                
                .countdown-label {
                    font-family: var(--desc-font-family);
                    font-size: 11px;
                    color: var(--color2);
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.8px;
                }
                
                .countdown-display {
                    display: flex;
                    gap: 5px;
                }
                
                .time-block {
                    background: rgba(0, 0, 0, 0.35);
                    padding: 5px 8px;
                    border-radius: 6px;
                    text-align: center;
                    min-width: 42px;
                    border: 1.5px solid var(--color4);
                }
                
                .time-number {
                    font-family: var(--timer-font-family);
                    font-size: calc(var(--timer-font-size) * 0.65);
                    color: var(--color4);
                    font-weight: 900;
                    line-height: 1;
                    text-shadow: 0 0 12px var(--color4);
                }
                
                .time-text {
                    font-family: var(--desc-font-family);
                    font-size: 8px;
                    color: var(--color2);
                    text-transform: uppercase;
                    margin-top: 2px;
                    letter-spacing: 0.3px;
                }
                
                .time-colon {
                    color: var(--color4);
                    font-family: var(--timer-font-family);
                    font-size: calc(var(--timer-font-size) * 0.65);
                    font-weight: 900;
                    animation: blink 1s ease-in-out infinite;
                    align-self: center;
                }
                
                .banner-content {
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    position: relative;
                }
                
                .product-showcase {
                    position: relative;
                }
                
                .product-image-large {
                    width: 100%;
                    height: 300px;
                    object-fit: cover;
                    display: block;
                }
                
                .discount-mega-badge {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    width: 85px;
                    height: 85px;
                    background: linear-gradient(135deg, var(--color4) 0%, var(--color5) 100%);
                    border-radius: 50%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: var(--color3);
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
                    z-index: 10;
                    animation: pulse 2s ease-in-out infinite;
                    border: 4px solid var(--color2);
                    transform: rotate(12deg);
                }
                
                .discount-mega-value {
                    font-family: var(--timer-font-family);
                    font-size: 32px;
                    font-weight: 900;
                    line-height: 1;
                }
                
                .discount-mega-label {
                    font-family: var(--banner-font-family);
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.8px;
                    margin-top: 3px;
                }
                
                .product-details-section {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    padding: 25px 20px;
                }
                
                .product-name-large {
                    font-family: var(--title-font-family);
                    font-size: calc(var(--title-font-size) * 0.75);
                    font-weight: 900;
                    margin: 0;
                    line-height: 1.2;
                    color: var(--color2);
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                    text-align: center;
                    min-height: 60px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .price-mega-section {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    padding: 18px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                    border: 2px solid rgba(255, 255, 255, 0.1);
                }
                
                .price-label {
                    font-family: var(--desc-font-family);
                    font-size: 11px;
                    color: var(--color8);
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    font-weight: 700;
                    text-align: center;
                }
                
                .price-display {
                    display: flex;
                    align-items: baseline;
                    gap: 12px;
                    flex-wrap: wrap;
                    justify-content: center;
                }
                
                .product-price-large {
                    font-family: var(--price-font-family);
                    font-size: calc(var(--price-font-size) * 0.85);
                    font-weight: 900;
                    color: var(--color4);
                    text-shadow: 0 0 20px var(--color4);
                }
                
                .product-compare-price-large {
                    font-family: var(--price-font-family);
                    font-size: calc(var(--price-font-size) * 0.5);
                    color: var(--color8);
                    text-decoration: line-through;
                    opacity: 0.6;
                }
                
                .savings-text {
                    font-family: var(--desc-font-family);
                    font-size: 13px;
                    color: var(--color8);
                    font-weight: 700;
                    background: linear-gradient(135deg, var(--color4) 0%, var(--color5) 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    text-align: center;
                    width: 100%;
                }
                
                .cta-button {
                    display: block;
                    width: 100%;
                    padding: 14px 35px;
                    background: linear-gradient(135deg, var(--color1) 0%, var(--color5) 100%);
                    color: var(--color2);
                    font-family: var(--cta-font-family);
                    font-size: calc(var(--cta-font-size) * 0.9);
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    border-radius: 40px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: none;
                    text-decoration: none;
                    text-align: center;
                    box-shadow: 0 8px 25px rgba(255, 8, 68, 0.4);
                    position: relative;
                    overflow: hidden;
                }
                
                .cta-button::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
                    transition: left 0.5s ease;
                }
                
                .cta-button:hover::before {
                    left: 100%;
                }
                
                .cta-button:hover {
                    transform: translateY(-3px) scale(1.03);
                    box-shadow: 0 12px 35px rgba(255, 8, 68, 0.6);
                }
                
                .navigation-dots {
                    display: flex;
                    justify-content: center;
                    gap: 10px;
                    padding: 15px 0;
                }
                
                .nav-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.3);
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: 2px solid transparent;
                }
                
                .nav-dot:hover {
                    background: rgba(255, 255, 255, 0.5);
                    transform: scale(1.2);
                }
                
                .nav-dot.active {
                    background: var(--color4);
                    border-color: var(--color2);
                    transform: scale(1.3);
                    box-shadow: 0 0 15px var(--color4);
                }
                
                .empty-state {
                    text-align: center;
                    padding: 60px 30px;
                    color: var(--color8);
                    font-family: var(--desc-font-family);
                    font-size: 16px;
                }
                
                .empty-state::before {
                    content: '⚡';
                    display: block;
                    font-size: 60px;
                    margin-bottom: 15px;
                    animation: pulse 2s ease-in-out infinite;
                }
                
                @media (max-width: 768px) {
                    .banner-container {
                        max-width: 400px;
                    }
                    
                    .banner-header {
                        padding: 8px 15px;
                    }
                    
                    .banner-title {
                        font-size: calc(var(--banner-font-size) * 0.6);
                    }
                    
                    .countdown-label {
                        font-size: 10px;
                    }
                    
                    .time-block {
                        min-width: 38px;
                        padding: 4px 6px;
                    }
                    
                    .time-number {
                        font-size: calc(var(--timer-font-size) * 0.55);
                    }
                    
                    .time-text {
                        font-size: 7px;
                    }
                    
                    .product-image-large {
                        height: 250px;
                    }
                    
                    .discount-mega-badge {
                        width: 70px;
                        height: 70px;
                    }
                    
                    .discount-mega-value {
                        font-size: 26px;
                    }
                    
                    .discount-mega-label {
                        font-size: 10px;
                    }
                    
                    .product-details-section {
                        padding: 20px 15px;
                    }
                    
                    .product-name-large {
                        font-size: calc(var(--title-font-size) * 0.65);
                        min-height: 50px;
                    }
                    
                    .price-mega-section {
                        padding: 15px;
                    }
                    
                    .product-price-large {
                        font-size: calc(var(--price-font-size) * 0.75);
                    }
                    
                    .cta-button {
                        padding: 12px 30px;
                        font-size: calc(var(--cta-font-size) * 0.85);
                    }
                }
                
                @media (max-width: 480px) {
                    .banner-container {
                        max-width: 350px;
                    }
                    
                    .banner-title {
                        font-size: calc(var(--banner-font-size) * 0.5);
                        letter-spacing: 1px;
                    }
                    
                    .time-block {
                        min-width: 35px;
                        padding: 3px 5px;
                    }
                    
                    .countdown-display {
                        gap: 4px;
                    }
                    
                    .product-image-large {
                        height: 220px;
                    }
                    
                    .discount-mega-badge {
                        width: 60px;
                        height: 60px;
                        top: 10px;
                        right: 10px;
                    }
                    
                    .discount-mega-value {
                        font-size: 22px;
                    }
                    
                    .product-name-large {
                        font-size: calc(var(--title-font-size) * 0.55);
                        letter-spacing: 1px;
                        min-height: 45px;
                    }
                    
                    .product-price-large {
                        font-size: calc(var(--price-font-size) * 0.65);
                    }
                    
                    .cta-button {
                        padding: 11px 25px;
                        font-size: calc(var(--cta-font-size) * 0.8);
                    }
                }
            </style>
            
            <div class="banner-container">
                <div class="banner-header">
                    <h1 class="banner-title"></h1>
                    <div class="countdown-wrapper">
                        <span class="countdown-label">Ends In:</span>
                        <div class="countdown-display">
                            <div class="time-block">
                                <div class="time-number" id="flash-hours">00</div>
                                <div class="time-text">Hours</div>
                            </div>
                            <div class="time-colon">:</div>
                            <div class="time-block">
                                <div class="time-number" id="flash-minutes">00</div>
                                <div class="time-text">Mins</div>
                            </div>
                            <div class="time-colon">:</div>
                            <div class="time-block">
                                <div class="time-number" id="flash-seconds">00</div>
                                <div class="time-text">Secs</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="banner-content">
                    <div class="empty-state">Select products to display</div>
                </div>
                
                <div class="navigation-dots"></div>
            </div>
        `;
    }

    renderBanner() {
        const titleEl = this.querySelector('.banner-title');
        const content = this.querySelector('.banner-content');
        const dotsContainer = this.querySelector('.navigation-dots');
        const countdownWrapper = this.querySelector('.countdown-wrapper');

        if (titleEl) {
            titleEl.textContent = this.settings.bannerText || '⚡ FLASH SALE';
        }

        if (!content || !dotsContainer) return;

        if (!this.products || this.products.length === 0) {
            content.innerHTML = '<div class="empty-state">Select products to display</div>';
            dotsContainer.innerHTML = '';
            if (countdownWrapper) countdownWrapper.style.display = 'none';
            return;
        }

        if (countdownWrapper) {
            countdownWrapper.style.display = this.settings.showCountdown ? 'flex' : 'none';
        }

        this.renderCurrentProduct();
        this.renderDots();
        this.setupRotation();
        this.updateStyles();

        if (this.settings.showCountdown) {
            this.startCountdown();
        }
    }

    renderCurrentProduct() {
        const content = this.querySelector('.banner-content');
        if (!content || !this.products[this.currentIndex]) return;

        const product = this.products[this.currentIndex];
        const hasComparePrice = product.compareAtPrice && product.compareAtPrice !== product.price;
        const displayPrice = product.price || 'Price not available';
        const discount = hasComparePrice ? this.calculateDiscount(product.price, product.compareAtPrice) : null;
        
        const titleTag = this.settings.titleTag || 'H2';

        let savingsAmount = '';
        if (hasComparePrice) {
            const priceNum = parseFloat(product.price.replace(/[^0-9.]/g, ''));
            const compareNum = parseFloat(product.compareAtPrice.replace(/[^0-9.]/g, ''));
            if (!isNaN(priceNum) && !isNaN(compareNum)) {
                const savings = compareNum - priceNum;
                const currencySymbol = product.price.replace(/[0-9.,]/g, '').trim();
                savingsAmount = `Save ${currencySymbol}${savings.toFixed(2)}`;
            }
        }

        content.innerHTML = `
            <div class="product-showcase">
                ${discount ? `
                    <div class="discount-mega-badge">
                        <div class="discount-mega-value">${discount}%</div>
                        <div class="discount-mega-label">OFF</div>
                    </div>
                ` : ''}
                <img src="${product.imageUrl}" 
                     alt="${product.name}" 
                     class="product-image-large"
                     onerror="this.src='https://via.placeholder.com/500'">
            </div>
            
            <div class="product-details-section">
                <${titleTag} class="product-name-large">${product.name}</${titleTag}>
                
                <div class="price-mega-section">
                    <div class="price-label">Special Price</div>
                    <div class="price-display">
                        <span class="product-price-large">${displayPrice}</span>
                        ${hasComparePrice ? `<span class="product-compare-price-large">${product.compareAtPrice}</span>` : ''}
                    </div>
                    ${savingsAmount ? `<div class="savings-text">${savingsAmount}</div>` : ''}
                </div>
                
                <a href="${product.productUrl}" class="cta-button">${this.settings.ctaText || 'Shop Now'}</a>
            </div>
        `;
    }

    renderDots() {
        const dotsContainer = this.querySelector('.navigation-dots');
        if (!dotsContainer || this.products.length <= 1) {
            dotsContainer.innerHTML = '';
            return;
        }

        const dotsHTML = this.products.map((_, index) => 
            `<div class="nav-dot ${index === this.currentIndex ? 'active' : ''}" data-index="${index}"></div>`
        ).join('');

        dotsContainer.innerHTML = dotsHTML;

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
        const dots = this.querySelectorAll('.nav-dot');
        dots.forEach((dot, index) => {
            if (index === this.currentIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    setupRotation() {
        if (this.rotationInterval) {
            clearInterval(this.rotationInterval);
        }

        if (!this.settings.autoRotate || this.products.length <= 1) {
            return;
        }

        const rotationSpeed = (this.settings.rotationSpeed || 5) * 1000;

        this.rotationInterval = setInterval(() => {
            this.currentIndex = (this.currentIndex + 1) % this.products.length;
            this.renderCurrentProduct();
            this.updateDots();
        }, rotationSpeed);
    }

    startCountdown() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }

        if (!this.endTime) return;

        const updateTimer = () => {
            const now = new Date().getTime();
            const end = new Date(this.endTime).getTime();
            const distance = end - now;

            if (distance < 0) {
                clearInterval(this.countdownInterval);
                const hoursEl = this.querySelector('#flash-hours');
                const minutesEl = this.querySelector('#flash-minutes');
                const secondsEl = this.querySelector('#flash-seconds');
                if (hoursEl) hoursEl.textContent = '00';
                if (minutesEl) minutesEl.textContent = '00';
                if (secondsEl) secondsEl.textContent = '00';
                return;
            }

            const hours = Math.floor(distance / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            const hoursEl = this.querySelector('#flash-hours');
            const minutesEl = this.querySelector('#flash-minutes');
            const secondsEl = this.querySelector('#flash-seconds');

            if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
            if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
            if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
        };

        updateTimer();
        this.countdownInterval = setInterval(updateTimer, 1000);
    }

    updateStyles() {
        const container = this.querySelector('.banner-container');
        if (!container) return;

        container.style.setProperty('--color1', this.settings.color1);
        container.style.setProperty('--color2', this.settings.color2);
        container.style.setProperty('--color3', this.settings.color3);
        container.style.setProperty('--color4', this.settings.color4);
        container.style.setProperty('--color5', this.settings.color5);
        container.style.setProperty('--color6', this.settings.color6);
        container.style.setProperty('--color7', this.settings.color7);
        container.style.setProperty('--color8', this.settings.color8);
        
        container.style.setProperty('--title-font-family', this.settings.titleFontFamily);
        container.style.setProperty('--desc-font-family', this.settings.descFontFamily);
        container.style.setProperty('--price-font-family', this.settings.priceFontFamily);
        container.style.setProperty('--banner-font-family', this.settings.bannerFontFamily);
        container.style.setProperty('--cta-font-family', this.settings.ctaFontFamily);
        container.style.setProperty('--timer-font-family', this.settings.timerFontFamily);
        
        container.style.setProperty('--title-font-size', `${this.settings.titleFontSize}px`);
        container.style.setProperty('--desc-font-size', `${this.settings.descFontSize}px`);
        container.style.setProperty('--price-font-size', `${this.settings.priceFontSize}px`);
        container.style.setProperty('--banner-font-size', `${this.settings.bannerFontSize}px`);
        container.style.setProperty('--cta-font-size', `${this.settings.ctaFontSize}px`);
        container.style.setProperty('--timer-font-size', `${this.settings.timerFontSize}px`);

        if (this.settings.borderWidth > 0) {
            container.style.border = `${this.settings.borderWidth}px solid ${this.settings.color4}`;
        } else {
            container.style.border = 'none';
        }
        container.style.borderRadius = `${this.settings.cornerRadius}px`;
    }
}

customElements.define('flash-sale-banner', FlashSaleBannerElement);
