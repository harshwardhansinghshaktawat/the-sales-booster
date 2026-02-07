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
                    --color1: #ff0844;
                    --color2: #ffffff;
                    --color3: #1a1a2e;
                    --color4: #ffbe0b;
                    --color5: #fb5607;
                    --color6: #8338ec;
                    --color7: #3a86ff;
                    --color8: #06ffa5;
                }
                
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideOutLeft {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(-100%);
                        opacity: 0;
                    }
                }
                
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.08); }
                }
                
                @keyframes glow {
                    0%, 100% { 
                        box-shadow: 0 0 30px var(--color1), 0 0 60px var(--color1);
                    }
                    50% { 
                        box-shadow: 0 0 50px var(--color1), 0 0 100px var(--color1);
                    }
                }
                
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
                
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                
                @keyframes rotateGradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                
                @keyframes shimmer {
                    0% { background-position: -1000px 0; }
                    100% { background-position: 1000px 0; }
                }
                
                .banner-container {
                    width: 100%;
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
                        rgba(255, 255, 255, 0.1),
                        transparent
                    );
                    animation: shimmer 3s infinite;
                }
                
                .banner-header {
                    background: linear-gradient(135deg, var(--color1) 0%, var(--color5) 100%);
                    padding: 15px 30px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 20px;
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
                    background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
                    animation: float 4s ease-in-out infinite;
                }
                
                .banner-title {
                    font-family: var(--banner-font-family);
                    font-size: var(--banner-font-size);
                    color: var(--color2);
                    margin: 0;
                    letter-spacing: 3px;
                    text-transform: uppercase;
                    text-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
                    animation: pulse 2s ease-in-out infinite;
                    z-index: 1;
                }
                
                .countdown-wrapper {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                    z-index: 1;
                }
                
                .countdown-label {
                    font-family: var(--desc-font-family);
                    font-size: 14px;
                    color: var(--color2);
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                
                .countdown-display {
                    display: flex;
                    gap: 8px;
                }
                
                .time-block {
                    background: rgba(0, 0, 0, 0.4);
                    padding: 8px 12px;
                    border-radius: 8px;
                    text-align: center;
                    min-width: 55px;
                    border: 2px solid var(--color4);
                }
                
                .time-number {
                    font-family: var(--timer-font-family);
                    font-size: var(--timer-font-size);
                    color: var(--color4);
                    font-weight: 900;
                    line-height: 1;
                    text-shadow: 0 0 20px var(--color4);
                }
                
                .time-text {
                    font-family: var(--desc-font-family);
                    font-size: 10px;
                    color: var(--color2);
                    text-transform: uppercase;
                    margin-top: 4px;
                    letter-spacing: 0.5px;
                }
                
                .time-colon {
                    color: var(--color4);
                    font-family: var(--timer-font-family);
                    font-size: var(--timer-font-size);
                    font-weight: 900;
                    animation: blink 1s ease-in-out infinite;
                    align-self: center;
                }
                
                .banner-content {
                    padding: 50px 40px;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 50px;
                    align-items: center;
                    position: relative;
                }
                
                .product-showcase {
                    position: relative;
                }
                
                .product-image-large {
                    width: 100%;
                    height: 500px;
                    object-fit: cover;
                    border-radius: 20px;
                    box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
                    border: 5px solid var(--color2);
                    transition: transform 0.4s ease;
                }
                
                .product-image-large:hover {
                    transform: scale(1.05) rotate(2deg);
                }
                
                .discount-mega-badge {
                    position: absolute;
                    top: -20px;
                    right: -20px;
                    width: 140px;
                    height: 140px;
                    background: linear-gradient(135deg, var(--color4) 0%, var(--color5) 100%);
                    border-radius: 50%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: var(--color3);
                    box-shadow: 0 15px 50px rgba(0, 0, 0, 0.5);
                    z-index: 10;
                    animation: pulse 2s ease-in-out infinite;
                    border: 6px solid var(--color2);
                    transform: rotate(15deg);
                }
                
                .discount-mega-value {
                    font-family: var(--timer-font-family);
                    font-size: 48px;
                    font-weight: 900;
                    line-height: 1;
                }
                
                .discount-mega-label {
                    font-family: var(--banner-font-family);
                    font-size: 18px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-top: 5px;
                }
                
                .product-details-section {
                    display: flex;
                    flex-direction: column;
                    gap: 25px;
                }
                
                .product-name-large {
                    font-family: var(--title-font-family);
                    font-size: var(--title-font-size);
                    font-weight: 900;
                    margin: 0;
                    line-height: 1.2;
                    color: var(--color2);
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    text-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                }
                
                .product-description-large {
                    font-family: var(--desc-font-family);
                    font-size: var(--desc-font-size);
                    line-height: 1.8;
                    color: var(--color8);
                    margin: 0;
                }
                
                .price-mega-section {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    padding: 30px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 15px;
                    border: 2px solid rgba(255, 255, 255, 0.1);
                }
                
                .price-label {
                    font-family: var(--desc-font-family);
                    font-size: 14px;
                    color: var(--color8);
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    font-weight: 700;
                }
                
                .price-display {
                    display: flex;
                    align-items: baseline;
                    gap: 20px;
                    flex-wrap: wrap;
                }
                
                .product-price-large {
                    font-family: var(--price-font-family);
                    font-size: var(--price-font-size);
                    font-weight: 900;
                    color: var(--color4);
                    text-shadow: 0 0 30px var(--color4);
                }
                
                .product-compare-price-large {
                    font-family: var(--price-font-family);
                    font-size: calc(var(--price-font-size) * 0.6);
                    color: var(--color8);
                    text-decoration: line-through;
                    opacity: 0.6;
                }
                
                .savings-text {
                    font-family: var(--desc-font-family);
                    font-size: 16px;
                    color: var(--color8);
                    font-weight: 700;
                    background: linear-gradient(135deg, var(--color4) 0%, var(--color5) 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                
                .cta-button {
                    display: inline-block;
                    padding: 25px 60px;
                    background: linear-gradient(135deg, var(--color1) 0%, var(--color5) 100%);
                    color: var(--color2);
                    font-family: var(--cta-font-family);
                    font-size: var(--cta-font-size);
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 3px;
                    border-radius: 50px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: none;
                    text-decoration: none;
                    text-align: center;
                    box-shadow: 0 15px 50px rgba(255, 8, 68, 0.5);
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
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                    transition: left 0.5s ease;
                }
                
                .cta-button:hover::before {
                    left: 100%;
                }
                
                .cta-button:hover {
                    transform: translateY(-5px) scale(1.05);
                    box-shadow: 0 20px 70px rgba(255, 8, 68, 0.7);
                }
                
                .navigation-dots {
                    display: flex;
                    justify-content: center;
                    gap: 15px;
                    padding: 30px 0;
                }
                
                .nav-dot {
                    width: 15px;
                    height: 15px;
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
                    box-shadow: 0 0 20px var(--color4);
                }
                
                .empty-state {
                    text-align: center;
                    padding: 100px 40px;
                    color: var(--color8);
                    font-family: var(--desc-font-family);
                    font-size: 20px;
                }
                
                .empty-state::before {
                    content: '⚡';
                    display: block;
                    font-size: 100px;
                    margin-bottom: 20px;
                    animation: pulse 2s ease-in-out infinite;
                }
                
                @media (max-width: 1200px) {
                    .banner-content {
                        grid-template-columns: 1fr;
                        gap: 40px;
                        padding: 40px 30px;
                    }
                    
                    .product-image-large {
                        height: 450px;
                    }
                }
                
                @media (max-width: 768px) {
                    .banner-header {
                        padding: 12px 20px;
                        justify-content: center;
                        text-align: center;
                    }
                    
                    .countdown-wrapper {
                        flex-direction: column;
                        gap: 8px;
                    }
                    
                    .banner-content {
                        padding: 30px 20px;
                    }
                    
                    .product-image-large {
                        height: 350px;
                    }
                    
                    .discount-mega-badge {
                        width: 100px;
                        height: 100px;
                        top: -10px;
                        right: -10px;
                    }
                    
                    .discount-mega-value {
                        font-size: 36px;
                    }
                    
                    .discount-mega-label {
                        font-size: 14px;
                    }
                    
                    .price-mega-section {
                        padding: 20px;
                    }
                    
                    .cta-button {
                        padding: 20px 40px;
                        width: 100%;
                    }
                }
                
                @media (max-width: 480px) {
                    .time-block {
                        min-width: 45px;
                        padding: 6px 8px;
                    }
                    
                    .product-image-large {
                        height: 280px;
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
                ${product.description ? `<p class="product-description-large">${product.description}</p>` : ''}
                
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
