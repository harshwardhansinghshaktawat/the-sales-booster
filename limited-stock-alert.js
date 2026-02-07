class LimitedStockAlertElement extends HTMLElement {
    constructor() {
        super();
        this.products = [];
        this.settings = {
            color1: '#e74c3c',          // Alert red
            color2: '#ffffff',          // White
            color3: '#2c3e50',          // Dark text
            color4: '#f39c12',          // Orange warning
            color5: '#ecf0f1',          // Light gray
            color6: '#c0392b',          // Dark red
            color7: '#27ae60',          // Green
            color8: '#e67e22',          // Burnt orange
            borderWidth: 2,
            cornerRadius: 12,
            alertText: '⚠️ LOW STOCK ALERT',
            buttonText: 'Grab It Now',
            showProgressBar: true,
            stockThreshold: 10,
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
    }

    connectedCallback() {
        console.log('Limited Stock Alert connected');
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
                    console.log('Limited Stock: Products received:', data.length);
                    
                    if (!this.isRendered) {
                        this.pendingProductsData = data;
                        return;
                    }
                    
                    this.products = data || [];
                    this.renderProducts();
                } catch (e) {
                    console.error('Error parsing products data:', e);
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

    calculateDiscount(price, comparePrice) {
        if (!comparePrice || comparePrice === price) return null;
        
        const priceNum = parseFloat(price.replace(/[^0-9.]/g, ''));
        const compareNum = parseFloat(comparePrice.replace(/[^0-9.]/g, ''));
        
        if (isNaN(priceNum) || isNaN(compareNum) || compareNum <= priceNum) return null;
        
        const discount = Math.round(((compareNum - priceNum) / compareNum) * 100);
        return discount > 0 ? discount : null;
    }

    getStockLevel(product) {
        const random = Math.floor(Math.random() * this.settings.stockThreshold) + 1;
        return random;
    }

    getStockPercentage(stockLevel) {
        return (stockLevel / this.settings.stockThreshold) * 100;
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
                
                * {
                    box-sizing: border-box;
                }
                
                :host {
                    display: block;
                    width: 100%;
                    --color1: #e74c3c;
                    --color2: #ffffff;
                    --color3: #2c3e50;
                    --color4: #f39c12;
                    --color5: #ecf0f1;
                    --color6: #c0392b;
                    --color7: #27ae60;
                    --color8: #e67e22;
                }
                
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
                
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes fillBar {
                    from { width: 0; }
                    to { width: var(--stock-width); }
                }
                
                .alert-container {
                    padding: 20px;
                    max-width: 1400px;
                    margin: 0 auto;
                    background: linear-gradient(135deg, var(--color5) 0%, #fff 100%);
                }
                
                .alert-header {
                    background: linear-gradient(135deg, var(--color1) 0%, var(--color6) 100%);
                    color: var(--color2);
                    padding: 15px 25px;
                    border-radius: 10px;
                    text-align: center;
                    margin-bottom: 25px;
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
                
                .products-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 25px;
                }
                
                .stock-card {
                    background: var(--color2);
                    border-radius: var(--corner-radius);
                    overflow: hidden;
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
                    transition: all 0.3s ease;
                    position: relative;
                    animation: slideIn 0.5s ease-out;
                    animation-fill-mode: both;
                }
                
                .stock-card:nth-child(1) { animation-delay: 0.1s; }
                .stock-card:nth-child(2) { animation-delay: 0.2s; }
                .stock-card:nth-child(3) { animation-delay: 0.3s; }
                .stock-card:nth-child(4) { animation-delay: 0.4s; }
                .stock-card:nth-child(5) { animation-delay: 0.5s; }
                .stock-card:nth-child(6) { animation-delay: 0.6s; }
                
                .stock-card:hover {
                    transform: translateY(-8px);
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
                
                .product-image-container {
                    position: relative;
                    width: 100%;
                    height: 250px;
                    overflow: hidden;
                    background: var(--color5);
                }
                
                .product-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
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
                
                .stock-text {
                    font-family: var(--stock-font-family);
                    font-size: var(--stock-font-size);
                    font-weight: 700;
                    color: var(--stock-color);
                    text-align: center;
                    margin: 0 0 8px 0;
                    animation: shake 0.5s ease-in-out infinite;
                }
                
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
                
                @media (max-width: 1024px) {
                    .products-grid {
                        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
                        gap: 20px;
                    }
                    
                    .product-image-container {
                        height: 220px;
                    }
                }
                
                @media (max-width: 768px) {
                    .alert-container {
                        padding: 15px;
                    }
                    
                    .products-grid {
                        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
                        gap: 18px;
                    }
                    
                    .product-image-container {
                        height: 200px;
                    }
                    
                    .product-content {
                        padding: 16px;
                    }
                }
                
                @media (max-width: 480px) {
                    .products-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .product-image-container {
                        height: 240px;
                    }
                }
            </style>
            
            <div class="alert-container">
                <div class="alert-header">
                    <h1 class="alert-title"></h1>
                </div>
                <div class="products-grid"></div>
            </div>
        `;
    }

    renderProducts() {
        console.log('Limited Stock: Rendering products, count:', this.products.length);
        
        const alertTitle = this.querySelector('.alert-title');
        const grid = this.querySelector('.products-grid');

        if (alertTitle) {
            alertTitle.textContent = this.settings.alertText || '⚠️ LOW STOCK ALERT';
        }

        if (!grid) return;

        if (this.products.length === 0) {
            grid.innerHTML = '<div class="empty-state">No low stock products to display</div>';
            return;
        }

        const cardsHTML = this.products.map(product => this.renderProductCard(product)).join('');
        grid.innerHTML = cardsHTML;

        this.updateStyles();
    }

    renderProductCard(product) {
        const hasComparePrice = product.compareAtPrice && product.compareAtPrice !== product.price;
        const displayPrice = product.price || 'Price not available';
        const discount = hasComparePrice ? this.calculateDiscount(product.price, product.compareAtPrice) : null;
        
        const stockLevel = this.getStockLevel(product);
        const stockPercentage = this.getStockPercentage(stockLevel);
        const stockColor = this.getStockColor(stockPercentage);
        
        const titleTag = this.settings.titleTag || 'H3';
        
        return `
            <div class="stock-card">
                <div class="product-image-container">
                    <div class="stock-badge">Only ${stockLevel} Left!</div>
                    ${discount ? `
                        <div class="discount-badge">
                            <div class="discount-value">${discount}%</div>
                            <div class="discount-label">OFF</div>
                        </div>
                    ` : ''}
                    <img src="${product.imageUrl}" 
                         alt="${product.name}" 
                         class="product-image"
                         onerror="this.src='https://via.placeholder.com/400'">
                </div>
                
                <div class="product-content">
                    <${titleTag} class="product-name">${product.name}</${titleTag}>
                    
                    <div class="stock-info-section">
                        <div class="stock-text" style="--stock-color: ${stockColor};">
                            Hurry! Only ${stockLevel} in stock
                        </div>
                        ${this.settings.showProgressBar ? `
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
                    
                    <a href="${product.productUrl}" class="action-button">${this.settings.buttonText}</a>
                </div>
            </div>
        `;
    }

    updateStyles() {
        const container = this.querySelector('.alert-container');
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
        container.style.setProperty('--alert-font-family', this.settings.alertFontFamily);
        container.style.setProperty('--button-font-family', this.settings.buttonFontFamily);
        container.style.setProperty('--stock-font-family', this.settings.stockFontFamily);
        
        container.style.setProperty('--title-font-size', `${this.settings.titleFontSize}px`);
        container.style.setProperty('--price-font-size', `${this.settings.priceFontSize}px`);
        container.style.setProperty('--alert-font-size', `${this.settings.alertFontSize}px`);
        container.style.setProperty('--button-font-size', `${this.settings.buttonFontSize}px`);
        container.style.setProperty('--stock-font-size', `${this.settings.stockFontSize}px`);
        container.style.setProperty('--corner-radius', `${this.settings.cornerRadius}px`);

        this.querySelectorAll('.stock-card').forEach(card => {
            if (this.settings.borderWidth > 0) {
                card.style.border = `${this.settings.borderWidth}px solid ${this.settings.color5}`;
            } else {
                card.style.border = 'none';
            }
        });
    }
}

customElements.define('limited-stock-alert', LimitedStockAlertElement);
