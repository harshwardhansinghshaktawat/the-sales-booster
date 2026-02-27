class ValentineProductGalleryElement extends HTMLElement {
    constructor() {
        super();
        this.products = [];
        this.hasMore = false;
        this.selectedOptions = {};
        this.quantities = {};
        this.errors = {};
        this.settings = {
            color1: '#ff1744',
            color2: '#ffffff',
            color3: '#333333',
            color4: '#ff4081',
            color5: '#fce4ec',
            color6: '#e91e63',
            color7: '#c2185b',
            color8: '#000000',
            borderWidth: 0,
            cornerRadius: 24,
            buttonText: 'View More Love',
            titleFontFamily: 'Playfair Display',
            titleFontSize: 22,
            descFontFamily: 'Lato',
            descFontSize: 14,
            priceFontFamily: 'Montserrat',
            priceFontSize: 26,
            ribbonFontFamily: 'Poppins',
            ribbonFontSize: 11,
            buttonFontFamily: 'Poppins',
            buttonFontSize: 14,
            titleTag: 'H3'
        };
        this.isRendered = false;
        this.pendingProductsData = null;
    }

    connectedCallback() {
        console.log('Valentine gallery connected');
        this.render();
        this.isRendered = true;
        
        if (this.pendingProductsData) {
            this.products = this.pendingProductsData.products || [];
            this.hasMore = this.pendingProductsData.hasMore || false;
            this.pendingProductsData = null;
            
            // Initialize selections for all products
            this.products.forEach(p => {
                this.selectedOptions[p._id] = {};
                this.quantities[p._id] = 1;
                this.errors[p._id] = '';
            });
            
            this.renderProducts();
        }
    }

    static get observedAttributes() {
        return ['products-data', 'settings', 'error-data'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (newValue && newValue !== oldValue) {
            if (name === 'products-data') {
                try {
                    const data = JSON.parse(newValue);
                    console.log('Valentine: Products received:', data.products.length);
                    
                    if (!this.isRendered) {
                        this.pendingProductsData = data;
                        return;
                    }
                    
                    this.products = data.products || [];
                    this.hasMore = data.hasMore || false;
                    
                    // Initialize selections for all products
                    this.products.forEach(p => {
                        this.selectedOptions[p._id] = {};
                        this.quantities[p._id] = 1;
                        this.errors[p._id] = '';
                    });
                    
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
            } else if (name === 'error-data') {
                try {
                    const errorData = JSON.parse(newValue);
                    console.log('❌ Custom element received error:', errorData);
                    this.errors[errorData.productId] = errorData.message;
                    this.updateErrorDisplay(errorData.productId);
                } catch (error) {
                    console.error('Error parsing error data:', error);
                }
            }
        }
    }

    validateOptions(productId) {
        const product = this.products.find(p => p._id === productId);
        if (!product || !product.productOptions || product.productOptions.length === 0) {
            return true;
        }

        const selected = this.selectedOptions[productId] || {};
        const missing = [];

        product.productOptions.forEach(opt => {
            if (!selected[opt.name] || selected[opt.name] === '') {
                missing.push(opt.name);
            }
        });

        if (missing.length > 0) {
            this.errors[productId] = `Please select: ${missing.join(', ')}`;
            this.updateErrorDisplay(productId);
            return false;
        }

        this.errors[productId] = '';
        this.updateErrorDisplay(productId);
        return true;
    }

    updateErrorDisplay(productId) {
        const card = this.querySelector(`[data-product-id="${productId}"]`);
        if (card) {
            const errorEl = card.querySelector('.error-message');
            if (errorEl) {
                errorEl.textContent = this.errors[productId] || '';
                errorEl.style.display = this.errors[productId] ? 'block' : 'none';
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

    render() {
        this.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Lato:wght@300;400;700&family=Montserrat:wght@600;700;800&family=Poppins:wght@400;600;700&family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Pacifico&display=swap');
                
                * {
                    box-sizing: border-box;
                }
                
                :host {
                    display: block;
                    width: 100%;
                    --color1: #ff1744;
                    --color2: #ffffff;
                    --color3: #333333;
                    --color4: #ff4081;
                    --color5: #fce4ec;
                    --color6: #e91e63;
                    --color7: #c2185b;
                    --color8: #000000;
                }
                
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                }
                
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                
                @keyframes heartbeat {
                    0%, 100% { transform: scale(1); }
                    10%, 30% { transform: scale(0.9); }
                    20%, 40% { transform: scale(1.1); }
                }
                
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes shimmer {
                    0% { background-position: -1000px 0; }
                    100% { background-position: 1000px 0; }
                }
                
                @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .gallery-container {
                    padding: 40px 20px;
                    max-width: 1600px;
                    margin: 0 auto;
                    background: linear-gradient(135deg, var(--color5) 0%, #fff 100%);
                    position: relative;
                    overflow: hidden;
                }
                
                .gallery-container::before {
                    content: '♥';
                    position: absolute;
                    top: 20px;
                    right: 5%;
                    font-size: 100px;
                    color: var(--color1);
                    opacity: 0.05;
                    animation: pulse 3s ease-in-out infinite;
                }
                
                .gallery-container::after {
                    content: '♥';
                    position: absolute;
                    bottom: 20px;
                    left: 5%;
                    font-size: 80px;
                    color: var(--color4);
                    opacity: 0.05;
                    animation: heartbeat 2s ease-in-out infinite;
                }
                
                .products-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 35px;
                    margin-bottom: 50px;
                    position: relative;
                    z-index: 1;
                }
                
                .product-card {
                    background: var(--color2);
                    overflow: hidden;
                    box-shadow: 0 10px 40px rgba(255, 23, 68, 0.15);
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    animation: fadeInUp 0.6s ease-out;
                    animation-fill-mode: both;
                }
                
                .product-card:nth-child(1) { animation-delay: 0.1s; }
                .product-card:nth-child(2) { animation-delay: 0.2s; }
                .product-card:nth-child(3) { animation-delay: 0.3s; }
                .product-card:nth-child(4) { animation-delay: 0.4s; }
                .product-card:nth-child(5) { animation-delay: 0.5s; }
                .product-card:nth-child(6) { animation-delay: 0.6s; }
                
                .product-card::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: linear-gradient(
                        45deg,
                        transparent 30%,
                        rgba(255, 255, 255, 0.1) 50%,
                        transparent 70%
                    );
                    transform: rotate(45deg);
                    transition: all 0.6s;
                }
                
                .product-card:hover::before {
                    left: 100%;
                }
                
                .product-card:hover {
                    transform: translateY(-12px) scale(1.02);
                    box-shadow: 0 20px 60px rgba(255, 23, 68, 0.25);
                }
                
                .product-image-container {
                    position: relative;
                    width: 100%;
                    height: 350px;
                    overflow: hidden;
                    background: linear-gradient(135deg, var(--color5) 0%, #fff 100%);
                    flex-shrink: 0;
                }
                
                .product-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    object-position: center;
                    transition: transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                
                .product-card:hover .product-image {
                    transform: scale(1.15) rotate(2deg);
                }
                
                .product-ribbon {
                    position: absolute;
                    top: 20px;
                    left: 0;
                    background: linear-gradient(135deg, var(--color1) 0%, var(--color7) 100%);
                    color: white;
                    padding: 10px 20px;
                    font-family: var(--ribbon-font-family);
                    font-size: var(--ribbon-font-size);
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    box-shadow: 3px 3px 15px rgba(0, 0, 0, 0.3);
                    z-index: 10;
                    clip-path: polygon(0 0, 100% 0, 95% 100%, 0 100%);
                    animation: pulse 2s ease-in-out infinite;
                }
                
                .discount-badge {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    width: 70px;
                    height: 70px;
                    background: linear-gradient(135deg, var(--color4) 0%, var(--color1) 100%);
                    border-radius: 50%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 800;
                    box-shadow: 0 8px 25px rgba(255, 23, 68, 0.4);
                    z-index: 10;
                    animation: heartbeat 1.5s ease-in-out infinite;
                    border: 3px solid white;
                }
                
                .discount-badge .discount-value {
                    font-size: 22px;
                    line-height: 1;
                    font-family: var(--ribbon-font-family);
                }
                
                .discount-badge .discount-label {
                    font-size: 10px;
                    text-transform: uppercase;
                    font-family: var(--ribbon-font-family);
                    letter-spacing: 0.5px;
                }
                
                .product-content {
                    padding: 30px 25px;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    background: var(--color2);
                    position: relative;
                }
                
                .product-content::before {
                    content: '♥';
                    position: absolute;
                    bottom: 20px;
                    right: 20px;
                    font-size: 60px;
                    color: var(--color1);
                    opacity: 0.03;
                    pointer-events: none;
                }
                
                .product-name {
                    font-family: var(--title-font-family);
                    font-size: var(--title-font-size);
                    font-weight: 700;
                    margin: 0 0 15px 0;
                    line-height: 1.3;
                    color: var(--color3);
                    min-height: 55px;
                    overflow: hidden;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    transition: color 0.3s ease;
                }
                
                .product-card:hover .product-name {
                    color: var(--color1);
                }
                
                .product-description {
                    font-family: var(--desc-font-family);
                    font-size: var(--desc-font-size);
                    line-height: 1.7;
                    color: #666;
                    margin: 0 0 20px 0;
                    min-height: 48px;
                    overflow: hidden;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                }
                
                .divider {
                    height: 1px;
                    background: linear-gradient(90deg, transparent, var(--color6), transparent);
                    margin: 15px 0;
                }
                
                .options-section {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    margin-bottom: 16px;
                }
                
                .option {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                
                .option label {
                    font-weight: 700;
                    font-size: 0.85em;
                    color: var(--color8);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    font-family: var(--ribbon-font-family);
                }
                
                .swatches {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                }
                
                .swatch {
                    width: 42px;
                    height: 42px;
                    border-radius: 50%;
                    border: 3px solid transparent;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    position: relative;
                    background-size: cover;
                    background-position: center;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                }
                
                .swatch:hover {
                    transform: scale(1.15) rotate(5deg);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
                }
                
                .swatch.selected {
                    border-color: var(--color1);
                    box-shadow: 0 0 0 2px white, 0 0 0 4px var(--color1), 0 4px 12px rgba(255, 23, 68, 0.4);
                    transform: scale(1.1);
                }
                
                .swatch::after {
                    content: attr(title);
                    position: absolute;
                    bottom: -30px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: var(--color3);
                    color: white;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 11px;
                    white-space: nowrap;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.3s;
                    font-weight: 600;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                }
                
                .swatch:hover::after {
                    opacity: 1;
                }
                
                select {
                    width: 100%;
                    padding: 12px 16px;
                    border: 2px solid var(--color5);
                    border-radius: 10px;
                    font-size: 0.95em;
                    background: white;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-weight: 500;
                    color: var(--color3);
                    appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%234a5568' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 16px center;
                    padding-right: 40px;
                    font-family: var(--desc-font-family);
                }
                
                select:hover {
                    border-color: var(--color6);
                }
                
                select:focus {
                    border-color: var(--color1);
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(255, 23, 68, 0.1);
                }
                
                .quantity-selector {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px;
                    background: linear-gradient(135deg, var(--color5) 0%, #fff 100%);
                    border-radius: 12px;
                    border: 2px solid var(--color5);
                    margin-bottom: 16px;
                }
                
                .quantity-selector label {
                    font-weight: 700;
                    font-size: 0.85em;
                    color: var(--color8);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    font-family: var(--ribbon-font-family);
                }
                
                .quantity-controls {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: white;
                    padding: 6px;
                    border-radius: 10px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                }
                
                .quantity-btn {
                    width: 36px;
                    height: 36px;
                    border: 2px solid var(--color5);
                    background: white;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 1.3em;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    color: var(--color8);
                    padding: 0;
                }
                
                .quantity-btn:hover:not(:disabled) {
                    background: linear-gradient(135deg, var(--color1) 0%, var(--color4) 100%);
                    border-color: var(--color1);
                    color: white;
                    transform: scale(1.1);
                    box-shadow: 0 4px 12px rgba(255, 23, 68, 0.4);
                }
                
                .quantity-btn:active:not(:disabled) {
                    transform: scale(0.95);
                }
                
                .quantity-btn:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                    background: var(--color5);
                }
                
                .quantity-value {
                    min-width: 50px;
                    text-align: center;
                    font-size: 1.1em;
                    font-weight: 800;
                    color: var(--color3);
                    font-family: var(--price-font-family);
                }
                
                .error-message {
                    color: #e53e3e;
                    font-size: 0.85em;
                    padding: 12px 16px;
                    background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
                    border-radius: 10px;
                    display: none;
                    font-weight: 600;
                    border-left: 4px solid #e53e3e;
                    animation: slideIn 0.3s ease;
                    margin-bottom: 16px;
                    font-family: var(--desc-font-family);
                }
                
                .product-price-section {
                    margin: auto 0 24px 0;
                    padding-top: 15px;
                    border-top: 2px solid var(--color5);
                    position: relative;
                }
                
                .price-wrapper {
                    display: flex;
                    align-items: baseline;
                    gap: 12px;
                    flex-wrap: wrap;
                }
                
                .product-price {
                    font-family: var(--price-font-family);
                    font-size: var(--price-font-size);
                    font-weight: 800;
                    color: var(--color1);
                    display: inline-block;
                    background: linear-gradient(135deg, var(--color1) 0%, var(--color4) 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                
                .product-compare-price {
                    font-family: var(--price-font-family);
                    font-size: calc(var(--price-font-size) * 0.65);
                    color: #999;
                    text-decoration: line-through;
                    display: inline-block;
                    opacity: 0.7;
                }
                
                .button-group {
                    display: grid;
                    grid-template-columns: 1fr 2fr;
                    gap: 12px;
                    margin-top: 8px;
                }
                
                .btn {
                    padding: 14px 20px;
                    border: none;
                    border-radius: 12px;
                    cursor: pointer;
                    font-weight: 700;
                    font-size: var(--button-font-size);
                    font-family: var(--button-font-family);
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    text-align: center;
                    letter-spacing: 0.3px;
                    position: relative;
                    overflow: hidden;
                }
                
                .btn::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 0;
                    height: 0;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.3);
                    transform: translate(-50%, -50%);
                    transition: width 0.6s, height 0.6s;
                }
                
                .btn:hover::before {
                    width: 300px;
                    height: 300px;
                }
                
                .view-btn {
                    background: white;
                    color: var(--color8);
                    border: 2px solid var(--color5);
                    position: relative;
                }
                
                .view-btn:hover {
                    background: var(--color5);
                    border-color: var(--color6);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }
                
                .add-btn {
                    background: linear-gradient(135deg, var(--color1) 0%, var(--color4) 100%);
                    color: white;
                    position: relative;
                    box-shadow: 0 4px 12px rgba(255, 23, 68, 0.4);
                }
                
                .add-btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 20px rgba(255, 23, 68, 0.5);
                }
                
                .add-btn:active {
                    transform: translateY(-1px);
                }
                
                .view-product-button {
                    display: block;
                    width: 100%;
                    padding: 18px 25px;
                    margin: 0;
                    border: none;
                    border-radius: 50px;
                    font-family: var(--button-font-family);
                    font-size: var(--button-font-size);
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    cursor: pointer;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    background: linear-gradient(135deg, var(--color1) 0%, var(--color4) 100%);
                    color: white;
                    text-decoration: none;
                    text-align: center;
                    box-shadow: 0 8px 25px rgba(255, 23, 68, 0.3);
                    position: relative;
                    overflow: hidden;
                    line-height: 1;
                }
                
                .view-product-button::before {
                    content: '♥';
                    position: absolute;
                    left: -30px;
                    top: 50%;
                    transform: translateY(-50%);
                    font-size: 20px;
                    transition: left 0.4s ease;
                }
                
                .view-product-button:hover::before {
                    left: 20px;
                }
                
                .view-product-button:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 15px 40px rgba(255, 23, 68, 0.4);
                    padding-left: 50px;
                }
                
                .load-more-container {
                    text-align: center;
                    padding: 40px 0;
                    position: relative;
                }
                
                .load-more-button {
                    padding: 22px 70px;
                    border: 3px solid var(--color1);
                    background: white;
                    color: var(--color1);
                    border-radius: 50px;
                    font-family: var(--button-font-family);
                    font-size: calc(var(--button-font-size) * 1.15);
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 8px 25px rgba(255, 23, 68, 0.2);
                }
                
                .load-more-button::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 0;
                    height: 0;
                    border-radius: 50%;
                    background: linear-gradient(135deg, var(--color1) 0%, var(--color4) 100%);
                    transform: translate(-50%, -50%);
                    transition: width 0.6s ease, height 0.6s ease;
                }
                
                .load-more-button span {
                    position: relative;
                    z-index: 1;
                }
                
                .load-more-button:hover::before {
                    width: 400px;
                    height: 400px;
                }
                
                .load-more-button:hover {
                    color: white;
                    transform: translateY(-5px);
                    box-shadow: 0 15px 40px rgba(255, 23, 68, 0.4);
                }
                
                .empty-state {
                    text-align: center;
                    padding: 100px 20px;
                    color: #999;
                    font-size: 20px;
                    font-family: var(--desc-font-family);
                }
                
                .empty-state::before {
                    content: '💝';
                    display: block;
                    font-size: 80px;
                    margin-bottom: 20px;
                    animation: float 3s ease-in-out infinite;
                }
                
                @media (max-width: 1400px) {
                    .products-grid {
                        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                        gap: 30px;
                    }
                }
                
                @media (max-width: 1024px) {
                    .products-grid {
                        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                        gap: 25px;
                    }
                    
                    .product-image-container {
                        height: 320px;
                    }
                    
                    .discount-badge {
                        width: 60px;
                        height: 60px;
                    }
                    
                    .discount-badge .discount-value {
                        font-size: 18px;
                    }
                }
                
                @media (max-width: 768px) {
                    .products-grid {
                        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
                        gap: 20px;
                    }
                    
                    .product-content {
                        padding: 25px 20px;
                    }
                    
                    .product-image-container {
                        height: 300px;
                    }
                    
                    .gallery-container {
                        padding: 30px 15px;
                    }
                    
                    .button-group {
                        grid-template-columns: 1fr;
                    }
                    
                    .view-btn {
                        order: 2;
                    }
                    
                    .add-btn {
                        order: 1;
                    }
                }
                
                @media (max-width: 480px) {
                    .products-grid {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
            
            <div class="gallery-container">
                <div class="products-grid"></div>
                <div class="load-more-container"></div>
            </div>
        `;
    }

    renderProducts() {
        console.log('Valentine: Rendering products, count:', this.products.length);
        
        const grid = this.querySelector('.products-grid');
        const loadMoreContainer = this.querySelector('.load-more-container');

        if (!grid || !loadMoreContainer) return;

        if (this.products.length === 0) {
            grid.innerHTML = '<div class="empty-state">No products found. Select a category to spread the love!</div>';
            loadMoreContainer.innerHTML = '';
            return;
        }

        const cardsHTML = this.products.map(product => this.renderProductCard(product)).join('');
        grid.innerHTML = cardsHTML;

        if (this.hasMore) {
            loadMoreContainer.innerHTML = `
                <button class="load-more-button">
                    <span>${this.settings.buttonText}</span>
                </button>
            `;
            
            const loadMoreBtn = this.querySelector('.load-more-button');
            if (loadMoreBtn) {
                loadMoreBtn.addEventListener('click', () => {
                    this.dispatchEvent(new CustomEvent('load-more', {
                        bubbles: true,
                        composed: true
                    }));
                });
            }
        } else {
            loadMoreContainer.innerHTML = '';
        }

        this.attachEventListeners();
        this.updateStyles();
    }

    renderProductCard(product) {
        const price = product.priceData?.formatted?.price || 'Price not available';
        const comparePrice = product.priceData?.formatted?.comparePrice;
        const hasComparePrice = comparePrice && comparePrice !== price;
        const discount = hasComparePrice ? this.calculateDiscount(price, comparePrice) : null;
        const imageUrl = product.media?.mainMedia?.image?.url || 'https://via.placeholder.com/400';
        const description = product.description || '';
        const ribbon = product.ribbon || '';
        
        const titleTag = this.settings.titleTag || 'H3';
        
        // Check if product has variants
        const hasVariants = product.productOptions && product.productOptions.length > 0;
        
        return `
            <div class="product-card" data-product-id="${product._id}">
                ${ribbon ? `<div class="product-ribbon">${ribbon}</div>` : ''}
                ${discount ? `
                    <div class="discount-badge">
                        <div class="discount-value">${discount}%</div>
                        <div class="discount-label">OFF</div>
                    </div>
                ` : ''}
                
                <div class="product-image-container">
                    <img src="${imageUrl}" 
                         alt="${product.name || 'Product'}" 
                         class="product-image"
                         onerror="this.src='https://via.placeholder.com/400'">
                </div>
                
                <div class="product-content">
                    <${titleTag} class="product-name">${product.name || 'Product'}</${titleTag}>
                    <p class="product-description">${description}</p>
                    
                    ${hasVariants ? `
                        <div class="divider"></div>
                        <div class="options-section">
                            ${product.productOptions.map(opt => `
                                <div class="option">
                                    <label>${opt.name}</label>
                                    ${opt.optionType === 'color' ? `
                                        <div class="swatches">
                                            ${opt.choices.map(c => `
                                                <button 
                                                    class="swatch" 
                                                    style="background-color: ${c.value};" 
                                                    data-option="${opt.name}" 
                                                    data-value="${c.value}" 
                                                    data-description="${c.description}"
                                                    title="${c.description}"
                                                    aria-label="Select ${c.description}">
                                                </button>
                                            `).join('')}
                                        </div>
                                    ` : `
                                        <select data-option="${opt.name}" aria-label="Select ${opt.name}">
                                            <option value="">Choose ${opt.name}</option>
                                            ${opt.choices.map(c => `
                                                <option value="${c.description}">${c.description}</option>
                                            `).join('')}
                                        </select>
                                    `}
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="quantity-selector">
                            <label>Quantity</label>
                            <div class="quantity-controls">
                                <button class="quantity-btn" data-action="decrease" aria-label="Decrease quantity">−</button>
                                <span class="quantity-value">${this.quantities[product._id] || 1}</span>
                                <button class="quantity-btn" data-action="increase" aria-label="Increase quantity">+</button>
                            </div>
                        </div>
                        
                        <div class="error-message" role="alert"></div>
                        
                        <div class="button-group">
                            <button class="btn view-btn" data-action="view">View</button>
                            <button class="btn add-btn" data-action="add">Add to Cart</button>
                        </div>
                    ` : `
                        <div class="product-price-section">
                            <div class="price-wrapper">
                                <span class="product-price">${price}</span>
                                ${hasComparePrice ? `<span class="product-compare-price">${comparePrice}</span>` : ''}
                            </div>
                        </div>
                        
                        <a href="/product-page/${product.slug || product._id}" class="view-product-button">View Product</a>
                    `}
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Color swatches
        this.querySelectorAll('.swatch').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const option = e.target.dataset.option;
                const description = e.target.dataset.description;
                const card = e.target.closest('.card');
                const productId = card.dataset.productId;
                
                this.selectedOptions[productId][option] = description;
                this.errors[productId] = '';
                this.updateErrorDisplay(productId);

                card.querySelectorAll(`.swatch[data-option="${option}"]`).forEach(s => 
                    s.classList.remove('selected')
                );
                e.target.classList.add('selected');
                
                console.log('✅ Color selected:', option, '=', description);
            });
        });

        // Dropdowns
        this.querySelectorAll('select').forEach(sel => {
            sel.addEventListener('change', (e) => {
                const option = e.target.dataset.option;
                const value = e.target.value;
                const card = e.target.closest('.product-card');
                const productId = card.dataset.productId;
                
                if (value === '') {
                    delete this.selectedOptions[productId][option];
                } else {
                    this.selectedOptions[productId][option] = value;
                    this.errors[productId] = '';
                    this.updateErrorDisplay(productId);
                }
                
                console.log('✅ Option selected:', option, '=', value);
            });
        });

        // Quantity buttons
        this.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const action = e.target.dataset.action;
                const card = e.target.closest('.product-card');
                const productId = card.dataset.productId;
                const quantityValueEl = card.querySelector('.quantity-value');
                
                let currentQty = this.quantities[productId] || 1;
                
                if (action === 'decrease' && currentQty > 1) {
                    currentQty--;
                } else if (action === 'increase' && currentQty < 99) {
                    currentQty++;
                }
                
                this.quantities[productId] = currentQty;
                quantityValueEl.textContent = currentQty;
                
                const decreaseBtn = card.querySelector('.quantity-btn[data-action="decrease"]');
                const increaseBtn = card.querySelector('.quantity-btn[data-action="increase"]');
                
                decreaseBtn.disabled = currentQty <= 1;
                increaseBtn.disabled = currentQty >= 99;
                
                console.log('✅ Quantity updated:', productId, '=', currentQty);
            });
        });

        // Action buttons
        this.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const action = e.target.dataset.action;
                const card = e.target.closest('.product-card');
                const productId = card.dataset.productId;
                const product = this.products.find(p => p._id === productId);
                
                if (action === 'view') {
                    console.log('👁️ View product:', productId);
                    this.dispatchEvent(new CustomEvent('viewProduct', {
                        detail: { productId, product }
                    }));
                } else if (action === 'add') {
                    if (this.validateOptions(productId)) {
                        const choices = this.selectedOptions[productId];
                        const quantity = this.quantities[productId] || 1;
                        console.log('🛒 Add to cart:', productId, choices, 'qty:', quantity);
                        this.dispatchEvent(new CustomEvent('addToCart', {
                            detail: { productId, choices, quantity }
                        }));
                    }
                }
            });
        });
    }

    updateStyles() {
        const container = this.querySelector('.gallery-container');
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
        container.style.setProperty('--ribbon-font-family', this.settings.ribbonFontFamily);
        container.style.setProperty('--button-font-family', this.settings.buttonFontFamily);
        
        container.style.setProperty('--title-font-size', `${this.settings.titleFontSize}px`);
        container.style.setProperty('--desc-font-size', `${this.settings.descFontSize}px`);
        container.style.setProperty('--price-font-size', `${this.settings.priceFontSize}px`);
        container.style.setProperty('--ribbon-font-size', `${this.settings.ribbonFontSize}px`);
        container.style.setProperty('--button-font-size', `${this.settings.buttonFontSize}px`);

        this.querySelectorAll('.product-card').forEach(card => {
            if (this.settings.borderWidth > 0) {
                card.style.border = `${this.settings.borderWidth}px solid ${this.settings.color5}`;
            } else {
                card.style.border = 'none';
            }
            card.style.borderRadius = `${this.settings.cornerRadius}px`;
        });
    }
}

customElements.define('valentine-product-gallery', ValentineProductGalleryElement);
