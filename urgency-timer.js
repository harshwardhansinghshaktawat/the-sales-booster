class UrgencyTimerElement extends HTMLElement {
    constructor() {
        super();
        this.products = [];
        this.currentIndex = 0;
        this.rotationInterval = null;
        this.timerIntervals = new Map();
        this.settings = {
            color1: '#ff4757',          // Red urgency
            color2: '#ffffff',          // White
            color3: '#2f3542',          // Dark text
            color4: '#ffa502',          // Orange
            color5: '#ff6348',          // Light red
            color6: '#ff3838',          // Bright red
            color7: '#1e90ff',          // Blue
            color8: '#000000',          // Black
            borderWidth: 0,
            cornerRadius: 16,
            mainText: '🔥 HOT DEAL ENDING SOON',
            urgencyText: 'Limited Time Offer!',
            ctaText: 'Claim Deal',
            timerDuration: 24,
            showViewers: true,
            showSold: true,
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
        this.isRendered = false;
        this.pendingProductsData = null;
    }

    connectedCallback() {
        console.log('Urgency Timer connected');
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
                    console.log('Urgency Timer: Products received:', data.length);
                    
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
        if (this.rotationInterval) {
            clearInterval(this.rotationInterval);
        }
        this.timerIntervals.forEach(interval => clearInterval(interval));
        this.timerIntervals.clear();
    }

    calculateDiscount(price, comparePrice) {
        if (!comparePrice || comparePrice === price) return null;
        
        const priceNum = parseFloat(price.replace(/[^0-9.]/g, ''));
        const compareNum = parseFloat(comparePrice.replace(/[^0-9.]/g, ''));
        
        if (isNaN(priceNum) || isNaN(compareNum) || compareNum <= priceNum) return null;
        
        const discount = Math.round(((compareNum - priceNum) / compareNum) * 100);
        return discount > 0 ? discount : null;
    }

    getRandomViewers() {
        return Math.floor(Math.random() * 150) + 50;
    }

    getRandomSold() {
        return Math.floor(Math.random() * 50) + 10;
    }

    render() {
        this.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Poppins:wght@400;600;700;800&family=Montserrat:wght@700;800;900&family=Orbitron:wght@700;900&family=Bebas+Neue&family=Righteous&display=swap');
                
                * {
                    box-sizing: border-box;
                }
                
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
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.08); }
                }
                
                @keyframes shake-urgent {
                    0%, 100% { transform: translateX(0) rotate(0deg); }
                    25% { transform: translateX(-8px) rotate(-2deg); }
                    75% { transform: translateX(8px) rotate(2deg); }
                }
                
                @keyframes blink-fast {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
                
                @keyframes slide-up {
                    from {
                        opacity: 0;
                        transform: translateY(50px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes glow-intense {
                    0%, 100% { 
                        box-shadow: 0 0 30px rgba(255, 71, 87, 0.6), 0 0 60px rgba(255, 71, 87, 0.3);
                    }
                    50% { 
                        box-shadow: 0 0 50px rgba(255, 71, 87, 0.9), 0 0 100px rgba(255, 71, 87, 0.5);
                    }
                }
                
                @keyframes countdown-pulse {
                    0%, 100% { 
                        transform: scale(1);
                        background: linear-gradient(135deg, var(--color1) 0%, var(--color6) 100%);
                    }
                    50% { 
                        transform: scale(1.1);
                        background: linear-gradient(135deg, var(--color6) 0%, var(--color1) 100%);
                    }
                }
                
                .timer-container {
                    max-width: 700px;
                    margin: 0 auto;
                    padding: 0;
                    position: relative;
                }
                
                .urgency-card {
                    background: linear-gradient(135deg, var(--color3) 0%, #1a1d24 100%);
                    border-radius: var(--corner-radius);
                    overflow: hidden;
                    box-shadow: 0 15px 50px rgba(0, 0, 0, 0.3);
                    position: relative;
                    animation: glow-intense 2s ease-in-out infinite;
                }
                
                .urgency-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, var(--color1) 0%, var(--color4) 50%, var(--color1) 100%);
                    background-size: 200% 100%;
                    animation: shimmer 2s linear infinite;
                }
                
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
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
                    top: 50%;
                    left: 50%;
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
                    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                    z-index: 1;
                    position: relative;
                    animation: shake-urgent 3s ease-in-out infinite;
                }
                
                .product-showcase {
                    display: grid;
                    grid-template-columns: 200px 1fr;
                    gap: 20px;
                    padding: 25px;
                    align-items: center;
                }
                
                .product-image-wrapper {
                    position: relative;
                }
                
                .product-image-timer {
                    width: 100%;
                    height: 200px;
                    object-fit: cover;
                    border-radius: 12px;
                    border: 3px solid var(--color1);
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
                }
                
                .discount-badge-timer {
                    position: absolute;
                    top: -10px;
                    right: -10px;
                    width: 70px;
                    height: 70px;
                    background: linear-gradient(135deg, var(--color4) 0%, var(--color5) 100%);
                    border-radius: 50%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: var(--color2);
                    font-weight: 900;
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
                    border: 4px solid var(--color2);
                    animation: intense-pulse 1.5s ease-in-out infinite;
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
                
                .product-info-section {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }
                
                .product-title-timer {
                    font-family: var(--title-font-family);
                    font-size: var(--title-font-size);
                    color: var(--color2);
                    margin: 0;
                    font-weight: 900;
                    text-transform: uppercase;
                    line-height: 1.2;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
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
                }
                
                .price-timer-section {
                    display: flex;
                    align-items: baseline;
                    gap: 15px;
                }
                
                .product-price-timer {
                    font-family: var(--price-font-family);
                    font-size: var(--price-font-size);
                    font-weight: 900;
                    color: var(--color4);
                    text-shadow: 0 0 20px rgba(255, 165, 2, 0.5);
                }
                
                .product-compare-price-timer {
                    font-family: var(--price-font-family);
                    font-size: calc(var(--price-font-size) * 0.6);
                    color: #999;
                    text-decoration: line-through;
                }
                
                .stats-row {
                    display: flex;
                    gap: 20px;
                    align-items: center;
                }
                
                .stat-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    padding: 8px 14px;
                    border-radius: 20px;
                    font-family: var(--urgency-font-family);
                    font-size: 12px;
                    color: var(--color2);
                    font-weight: 600;
                }
                
                .stat-icon {
                    font-size: 16px;
                }
                
                .stat-number {
                    font-weight: 800;
                    color: var(--color4);
                }
                
                .countdown-section {
                    background: rgba(0, 0, 0, 0.3);
                    padding: 20px;
                    text-align: center;
                    border-top: 2px solid rgba(255, 71, 87, 0.3);
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
                }
                
                .time-box {
                    background: linear-gradient(135deg, var(--color1) 0%, var(--color6) 100%);
                    padding: 12px 16px;
                    border-radius: 10px;
                    min-width: 70px;
                    border: 2px solid rgba(255, 255, 255, 0.2);
                    animation: countdown-pulse 2s ease-in-out infinite;
                }
                
                .time-value {
                    font-family: var(--timer-font-family);
                    font-size: var(--timer-font-size);
                    color: var(--color2);
                    font-weight: 900;
                    line-height: 1;
                    text-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
                }
                
                .time-label {
                    font-family: var(--urgency-font-family);
                    font-size: 10px;
                    color: rgba(255, 255, 255, 0.8);
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
                    box-shadow: 0 -4px 20px rgba(255, 71, 87, 0.3);
                    position: relative;
                    overflow: hidden;
                }
                
                .cta-button-timer::before {
                    content: '⚡';
                    position: absolute;
                    left: -40px;
                    font-size: 24px;
                    transition: left 0.3s ease;
                }
                
                .cta-button-timer:hover::before {
                    left: 30px;
                }
                
                .cta-button-timer:hover {
                    background: linear-gradient(135deg, var(--color6) 0%, var(--color1) 100%);
                    transform: translateY(-3px);
                    box-shadow: 0 -8px 30px rgba(255, 71, 87, 0.5);
                    padding-left: 60px;
                }
                
                .navigation-controls {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 15px;
                    padding: 20px;
                    background: rgba(0, 0, 0, 0.2);
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
                }
                
                .nav-arrow:hover {
                    background: var(--color1);
                    color: var(--color2);
                    transform: scale(1.1);
                }
                
                .navigation-dots {
                    display: flex;
                    gap: 8px;
                }
                
                .nav-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: rgba(255, 71, 87, 0.3);
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .nav-dot:hover {
                    background: rgba(255, 71, 87, 0.6);
                    transform: scale(1.2);
                }
                
                .nav-dot.active {
                    background: var(--color1);
                    transform: scale(1.3);
                    box-shadow: 0 0 10px var(--color1);
                }
                
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
                
                @media (max-width: 768px) {
                    .product-showcase {
                        grid-template-columns: 1fr;
                        gap: 20px;
                    }
                    
                    .product-image-timer {
                        width: 100%;
                        height: 250px;
                    }
                    
                    .countdown-display {
                        gap: 8px;
                    }
                    
                    .time-box {
                        min-width: 60px;
                        padding: 10px 12px;
                    }
                    
                    .stats-row {
                        flex-wrap: wrap;
                    }
                }
                
                @media (max-width: 480px) {
                    .product-showcase {
                        padding: 20px 15px;
                    }
                    
                    .time-box {
                        min-width: 50px;
                        padding: 8px 10px;
                    }
                    
                    .discount-badge-timer {
                        width: 60px;
                        height: 60px;
                    }
                    
                    .discount-value-timer {
                        font-size: 20px;
                    }
                }
            </style>
            
            <div class="timer-container">
                <div class="urgency-card"></div>
            </div>
        `;
    }

    renderProducts() {
        console.log('Urgency Timer: Rendering products, count:', this.products.length);
        
        const card = this.querySelector('.urgency-card');
        if (!card) return;

        if (this.products.length === 0) {
            card.innerHTML = '<div class="empty-state">No products selected</div>';
            return;
        }

        this.renderCurrentProduct();
        this.setupRotation();
        this.updateStyles();
    }

    renderCurrentProduct() {
        const card = this.querySelector('.urgency-card');
        if (!card || !this.products[this.currentIndex]) return;

        const product = this.products[this.currentIndex];
        const hasComparePrice = product.compareAtPrice && product.compareAtPrice !== product.price;
        const displayPrice = product.price || 'Price not available';
        const discount = hasComparePrice ? this.calculateDiscount(product.price, product.compareAtPrice) : null;
        const titleTag = this.settings.titleTag || 'H2';
        
        const viewers = this.getRandomViewers();
        const sold = this.getRandomSold();
        
        const productHtml = `
            <div class="urgency-header">
                <div class="main-text">${this.settings.mainText}</div>
            </div>
            
            <div class="product-showcase">
                <div class="product-image-wrapper">
                    ${discount ? `
                        <div class="discount-badge-timer">
                            <div class="discount-value-timer">${discount}%</div>
                            <div class="discount-label-timer">OFF</div>
                        </div>
                    ` : ''}
                    <img src="${product.imageUrl}" 
                         alt="${product.name}" 
                         class="product-image-timer"
                         onerror="this.src='https://via.placeholder.com/400'">
                </div>
                
                <div class="product-info-section">
                    <${titleTag} class="product-title-timer">${product.name}</${titleTag}>
                    <div class="urgency-badge">${this.settings.urgencyText}</div>
                    
                    <div class="price-timer-section">
                        <span class="product-price-timer">${displayPrice}</span>
                        ${hasComparePrice ? `<span class="product-compare-price-timer">${product.compareAtPrice}</span>` : ''}
                    </div>
                    
                    <div class="stats-row">
                        ${this.settings.showViewers ? `
                            <div class="stat-item">
                                <span class="stat-icon">👁️</span>
                                <span class="stat-number">${viewers}</span> watching
                            </div>
                        ` : ''}
                        ${this.settings.showSold ? `
                            <div class="stat-item">
                                <span class="stat-icon">🔥</span>
                                <span class="stat-number">${sold}</span> sold today
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <div class="countdown-section">
                <div class="countdown-label">⏰ Offer Expires In</div>
                <div class="countdown-display">
                    <div class="time-box">
                        <div class="time-value" data-unit="hours">00</div>
                        <div class="time-label">Hours</div>
                    </div>
                    <div class="time-separator">:</div>
                    <div class="time-box">
                        <div class="time-value" data-unit="minutes">00</div>
                        <div class="time-label">Minutes</div>
                    </div>
                    <div class="time-separator">:</div>
                    <div class="time-box">
                        <div class="time-value" data-unit="seconds">00</div>
                        <div class="time-label">Seconds</div>
                    </div>
                </div>
                <a href="${product.productUrl}" class="cta-button-timer">${this.settings.ctaText}</a>
            </div>
            
            ${this.products.length > 1 ? `
                <div class="navigation-controls">
                    <div class="nav-arrow nav-prev">‹</div>
                    <div class="navigation-dots">${this.renderDots()}</div>
                    <div class="nav-arrow nav-next">›</div>
                </div>
            ` : ''}
        `;
        
        card.innerHTML = productHtml;
        
        if (this.products.length > 1) {
            this.setupNavigation();
        }
        
        this.startCountdown(product.id);
    }

    renderDots() {
        return this.products.map((_, index) => 
            `<div class="nav-dot ${index === this.currentIndex ? 'active' : ''}" data-index="${index}"></div>`
        ).join('');
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

    setupNavigation() {
        const prevBtn = this.querySelector('.nav-prev');
        const nextBtn = this.querySelector('.nav-next');
        const dots = this.querySelectorAll('.nav-dot');

        if (prevBtn) {
            prevBtn.onclick = () => {
                this.currentIndex = (this.currentIndex - 1 + this.products.length) % this.products.length;
                this.renderCurrentProduct();
                this.setupRotation();
            };
        }

        if (nextBtn) {
            nextBtn.onclick = () => {
                this.currentIndex = (this.currentIndex + 1) % this.products.length;
                this.renderCurrentProduct();
                this.setupRotation();
            };
        }

        dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.currentIndex = index;
                this.renderCurrentProduct();
                this.setupRotation();
            });
        });
    }

    setupRotation() {
        if (this.rotationInterval) {
            clearInterval(this.rotationInterval);
        }

        if (!this.settings.autoRotate || this.products.length <= 1) {
            return;
        }

        const rotationSpeed = (this.settings.rotationSpeed || 8) * 1000;

        this.rotationInterval = setInterval(() => {
            this.currentIndex = (this.currentIndex + 1) % this.products.length;
            this.renderCurrentProduct();
        }, rotationSpeed);
    }

    startCountdown(productId) {
        if (this.timerIntervals.has(productId)) {
            clearInterval(this.timerIntervals.get(productId));
        }

        const duration = this.settings.timerDuration || 24;
        const endTime = new Date();
        endTime.setHours(endTime.getHours() + duration);

        const updateTimer = () => {
            const now = new Date().getTime();
            const end = endTime.getTime();
            const distance = end - now;

            if (distance < 0) {
                const interval = this.timerIntervals.get(productId);
                if (interval) clearInterval(interval);
                this.timerIntervals.delete(productId);
                
                const hoursEl = this.querySelector('[data-unit="hours"]');
                const minutesEl = this.querySelector('[data-unit="minutes"]');
                const secondsEl = this.querySelector('[data-unit="seconds"]');
                
                if (hoursEl) hoursEl.textContent = '00';
                if (minutesEl) minutesEl.textContent = '00';
                if (secondsEl) secondsEl.textContent = '00';
                return;
            }

            const hours = Math.floor(distance / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            const hoursEl = this.querySelector('[data-unit="hours"]');
            const minutesEl = this.querySelector('[data-unit="minutes"]');
            const secondsEl = this.querySelector('[data-unit="seconds"]');

            if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
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

        container.style.setProperty('--color1', this.settings.color1);
        container.style.setProperty('--color2', this.settings.color2);
        container.style.setProperty('--color3', this.settings.color3);
        container.style.setProperty('--color4', this.settings.color4);
        container.style.setProperty('--color5', this.settings.color5);
        container.style.setProperty('--color6', this.settings.color6);
        container.style.setProperty('--color7', this.settings.color7);
        container.style.setProperty('--color8', this.settings.color8);
        
        container.style.setProperty('--title-font-family', this.settings.titleFontFamily);
        container.style.setProperty('--urgency-font-family', this.settings.urgencyFontFamily);
        container.style.setProperty('--price-font-family', this.settings.priceFontFamily);
        container.style.setProperty('--timer-font-family', this.settings.timerFontFamily);
        container.style.setProperty('--cta-font-family', this.settings.ctaFontFamily);
        
        container.style.setProperty('--title-font-size', `${this.settings.titleFontSize}px`);
        container.style.setProperty('--urgency-font-size', `${this.settings.urgencyFontSize}px`);
        container.style.setProperty('--price-font-size', `${this.settings.priceFontSize}px`);
        container.style.setProperty('--timer-font-size', `${this.settings.timerFontSize}px`);
        container.style.setProperty('--cta-font-size', `${this.settings.ctaFontSize}px`);
        container.style.setProperty('--corner-radius', `${this.settings.cornerRadius}px`);

        const card = this.querySelector('.urgency-card');
        if (card && this.settings.borderWidth > 0) {
            card.style.border = `${this.settings.borderWidth}px solid ${this.settings.color1}`;
        }
    }
}

customElements.define('urgency-timer', UrgencyTimerElement);
