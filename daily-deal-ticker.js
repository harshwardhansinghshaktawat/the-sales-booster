class DailyDealTickerElement extends HTMLElement {
    constructor() {
        super();
        this.product = null;
        this.endTime = null;
        this.countdownInterval = null;
        this.settings = {
            color1: '#ff6b6b',          // Primary red
            color2: '#ffffff',          // Card background
            color3: '#2c3e50',          // Text color
            color4: '#4ecdc4',          // Accent teal
            color5: '#ffe66d',          // Yellow highlight
            color6: '#1a1a2e',          // Dark background
            color7: '#ff9ff3',          // Pink accent
            color8: '#95e1d3',          // Light teal
            borderWidth: 2,
            cornerRadius: 16,
            titleFontFamily: 'Poppins',
            titleFontSize: 18,
            priceFontFamily: 'Montserrat',
            priceFontSize: 24,
            timerFontFamily: 'Roboto Mono',
            timerFontSize: 20,
            labelFontFamily: 'Lato',
            labelFontSize: 11,
            titleTag: 'H3'
        };
        this.isRendered = false;
        this.pendingProductData = null;
    }

    connectedCallback() {
        console.log('Daily Deal Ticker connected');
        this.render();
        this.isRendered = true;
        
        if (this.pendingProductData) {
            this.product = this.pendingProductData.product;
            this.endTime = this.pendingProductData.endTime;
            this.pendingProductData = null;
            this.renderProduct();
        }
    }

    static get observedAttributes() {
        return ['product-data', 'settings'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (newValue && newValue !== oldValue) {
            if (name === 'product-data') {
                try {
                    const data = JSON.parse(newValue);
                    console.log('Daily Deal: Product received:', data);
                    
                    if (!this.isRendered) {
                        this.pendingProductData = data;
                        return;
                    }
                    
                    this.product = data.product;
                    this.endTime = data.endTime;
                    this.renderProduct();
                } catch (e) {
                    console.error('Error parsing product data:', e);
                }
            } else if (name === 'settings') {
                try {
                    const newSettings = JSON.parse(newValue);
                    Object.assign(this.settings, newSettings);
                    if (this.isRendered) {
                        this.updateStyles();
                    }
                } catch (e) {
                    console.error('Error parsing settings:', e);
                }
            }
        }
    }

    disconnectedCallback() {
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
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&family=Montserrat:wght@600;700;800;900&family=Roboto+Mono:wght@500;600;700&family=Lato:wght@300;400;700&family=Inter:wght@400;600;700&family=Nunito:wght@400;700;800&display=swap');
                
                * {
                    box-sizing: border-box;
                }
                
                :host {
                    display: block;
                    width: 100%;
                    max-width: 100%;
                    --color1: #ff6b6b;
                    --color2: #ffffff;
                    --color3: #2c3e50;
                    --color4: #4ecdc4;
                    --color5: #ffe66d;
                    --color6: #1a1a2e;
                    --color7: #ff9ff3;
                    --color8: #95e1d3;
                }
                
                @keyframes slideIn {
                    from {
                        transform: translateX(-100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                
                @keyframes glow {
                    0%, 100% { box-shadow: 0 0 20px rgba(255, 107, 107, 0.3); }
                    50% { box-shadow: 0 0 40px rgba(255, 107, 107, 0.6); }
                }
                
                @keyframes ticker {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-100%); }
                }
                
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
                
                .ticker-container {
                    width: 100%;
                    background: linear-gradient(135deg, var(--color6) 0%, var(--color3) 100%);
                    position: relative;
                    overflow: hidden;
                    animation: glow 3s ease-in-out infinite;
                }
                
                .ticker-wrapper {
                    display: flex;
                    align-items: center;
                    padding: 16px 20px;
                    gap: 20px;
                    position: relative;
                }
                
                .deal-badge {
                    background: linear-gradient(135deg, var(--color1) 0%, var(--color7) 100%);
                    color: white;
                    padding: 8px 20px;
                    border-radius: 25px;
                    font-family: var(--label-font-family);
                    font-size: calc(var(--label-font-size) + 1px);
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    white-space: nowrap;
                    flex-shrink: 0;
                    animation: pulse 2s ease-in-out infinite;
                    box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
                }
                
                .product-info {
                    flex: 1;
                    min-width: 0;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                
                .product-image-small {
                    width: 60px;
                    height: 60px;
                    border-radius: 12px;
                    object-fit: cover;
                    border: 2px solid var(--color4);
                    flex-shrink: 0;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                }
                
                .product-details {
                    flex: 1;
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                
                .product-name-ticker {
                    font-family: var(--title-font-family);
                    font-size: var(--title-font-size);
                    font-weight: 700;
                    color: var(--color2);
                    margin: 0;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .price-section {
                    display: flex;
                    align-items: baseline;
                    gap: 10px;
                }
                
                .product-price-ticker {
                    font-family: var(--price-font-family);
                    font-size: var(--price-font-size);
                    font-weight: 800;
                    color: var(--color5);
                    text-shadow: 0 2px 8px rgba(255, 230, 109, 0.3);
                }
                
                .product-compare-price-ticker {
                    font-family: var(--price-font-family);
                    font-size: calc(var(--price-font-size) * 0.6);
                    color: var(--color8);
                    text-decoration: line-through;
                    opacity: 0.7;
                }
                
                .discount-badge-ticker {
                    background: linear-gradient(135deg, var(--color4) 0%, var(--color8) 100%);
                    color: var(--color6);
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-family: var(--label-font-family);
                    font-size: var(--label-font-size);
                    font-weight: 700;
                    margin-left: 8px;
                }
                
                .countdown-section {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    flex-shrink: 0;
                    background: rgba(255, 255, 255, 0.05);
                    padding: 10px 20px;
                    border-radius: 15px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .countdown-label {
                    font-family: var(--label-font-family);
                    font-size: var(--label-font-size);
                    color: var(--color8);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    font-weight: 600;
                }
                
                .countdown-timer {
                    display: flex;
                    gap: 8px;
                }
                
                .time-unit {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    background: rgba(255, 255, 255, 0.1);
                    padding: 8px 12px;
                    border-radius: 10px;
                    min-width: 50px;
                    border: 1px solid rgba(255, 255, 255, 0.15);
                }
                
                .time-value {
                    font-family: var(--timer-font-family);
                    font-size: var(--timer-font-size);
                    font-weight: 700;
                    color: var(--color5);
                    line-height: 1;
                    text-shadow: 0 2px 8px rgba(255, 230, 109, 0.3);
                }
                
                .time-label {
                    font-family: var(--label-font-family);
                    font-size: calc(var(--label-font-size) - 1px);
                    color: var(--color4);
                    text-transform: uppercase;
                    margin-top: 4px;
                    letter-spacing: 0.5px;
                }
                
                .time-separator {
                    color: var(--color5);
                    font-family: var(--timer-font-family);
                    font-size: var(--timer-font-size);
                    font-weight: 700;
                    animation: blink 1s ease-in-out infinite;
                    align-self: center;
                }
                
                .view-deal-button {
                    background: linear-gradient(135deg, var(--color1) 0%, var(--color7) 100%);
                    color: white;
                    padding: 12px 28px;
                    border-radius: 25px;
                    font-family: var(--label-font-family);
                    font-size: calc(var(--label-font-size) + 2px);
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: none;
                    white-space: nowrap;
                    flex-shrink: 0;
                    box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
                    text-decoration: none;
                    display: inline-block;
                }
                
                .view-deal-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(255, 107, 107, 0.6);
                }
                
                .empty-state {
                    text-align: center;
                    padding: 40px 20px;
                    color: var(--color8);
                    font-family: var(--label-font-family);
                    font-size: calc(var(--label-font-size) + 4px);
                }
                
                @media (max-width: 1200px) {
                    .ticker-wrapper {
                        gap: 15px;
                        padding: 14px 18px;
                    }
                    
                    .countdown-section {
                        gap: 12px;
                        padding: 8px 16px;
                    }
                    
                    .time-unit {
                        min-width: 45px;
                        padding: 6px 10px;
                    }
                }
                
                @media (max-width: 900px) {
                    .ticker-wrapper {
                        flex-wrap: wrap;
                        gap: 12px;
                    }
                    
                    .product-info {
                        flex: 1 1 100%;
                    }
                    
                    .countdown-section {
                        flex: 1 1 auto;
                    }
                    
                    .view-deal-button {
                        flex: 1 1 auto;
                    }
                }
                
                @media (max-width: 640px) {
                    .product-image-small {
                        width: 50px;
                        height: 50px;
                    }
                    
                    .time-unit {
                        min-width: 40px;
                        padding: 5px 8px;
                    }
                    
                    .countdown-timer {
                        gap: 6px;
                    }
                    
                    .ticker-wrapper {
                        padding: 12px 15px;
                    }
                }
            </style>
            
            <div class="ticker-container">
                <div class="ticker-wrapper">
                    <div class="empty-state">Select a product to display</div>
                </div>
            </div>
        `;
    }

    renderProduct() {
        const wrapper = this.querySelector('.ticker-wrapper');
        if (!wrapper) return;

        if (!this.product) {
            wrapper.innerHTML = '<div class="empty-state">Select a product to display</div>';
            return;
        }

        const hasComparePrice = this.product.compareAtPrice && this.product.compareAtPrice !== this.product.price;
        const displayPrice = this.product.price || 'Price not available';
        const discount = hasComparePrice ? this.calculateDiscount(this.product.price, this.product.compareAtPrice) : null;
        
        const titleTag = this.settings.titleTag || 'H3';

        wrapper.innerHTML = `
            <div class="deal-badge">🔥 Deal of the Day</div>
            
            <div class="product-info">
                <img src="${this.product.imageUrl}" 
                     alt="${this.product.name}" 
                     class="product-image-small"
                     onerror="this.src='https://via.placeholder.com/60'">
                
                <div class="product-details">
                    <${titleTag} class="product-name-ticker">${this.product.name}</${titleTag}>
                    <div class="price-section">
                        <span class="product-price-ticker">${displayPrice}</span>
                        ${hasComparePrice ? `<span class="product-compare-price-ticker">${this.product.compareAtPrice}</span>` : ''}
                        ${discount ? `<span class="discount-badge-ticker">-${discount}%</span>` : ''}
                    </div>
                </div>
            </div>
            
            <div class="countdown-section">
                <span class="countdown-label">Ends In:</span>
                <div class="countdown-timer">
                    <div class="time-unit">
                        <div class="time-value" id="hours">00</div>
                        <div class="time-label">Hrs</div>
                    </div>
                    <div class="time-separator">:</div>
                    <div class="time-unit">
                        <div class="time-value" id="minutes">00</div>
                        <div class="time-label">Min</div>
                    </div>
                    <div class="time-separator">:</div>
                    <div class="time-unit">
                        <div class="time-value" id="seconds">00</div>
                        <div class="time-label">Sec</div>
                    </div>
                </div>
            </div>
            
            <a href="${this.product.productUrl}" class="view-deal-button">View Deal</a>
        `;

        this.updateStyles();
        this.startCountdown();
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
                this.querySelector('#hours').textContent = '00';
                this.querySelector('#minutes').textContent = '00';
                this.querySelector('#seconds').textContent = '00';
                return;
            }

            const hours = Math.floor(distance / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            const hoursEl = this.querySelector('#hours');
            const minutesEl = this.querySelector('#minutes');
            const secondsEl = this.querySelector('#seconds');

            if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
            if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
            if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
        };

        updateTimer();
        this.countdownInterval = setInterval(updateTimer, 1000);
    }

    updateStyles() {
        const container = this.querySelector('.ticker-container');
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
        container.style.setProperty('--price-font-family', this.settings.priceFontFamily);
        container.style.setProperty('--timer-font-family', this.settings.timerFontFamily);
        container.style.setProperty('--label-font-family', this.settings.labelFontFamily);
        
        container.style.setProperty('--title-font-size', `${this.settings.titleFontSize}px`);
        container.style.setProperty('--price-font-size', `${this.settings.priceFontSize}px`);
        container.style.setProperty('--timer-font-size', `${this.settings.timerFontSize}px`);
        container.style.setProperty('--label-font-size', `${this.settings.labelFontSize}px`);

        if (this.settings.borderWidth > 0) {
            container.style.border = `${this.settings.borderWidth}px solid ${this.settings.color4}`;
        } else {
            container.style.border = 'none';
        }
        container.style.borderRadius = `${this.settings.cornerRadius}px`;
    }
}

customElements.define('daily-deal-ticker', DailyDealTickerElement);
