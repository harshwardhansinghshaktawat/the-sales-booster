class ProductGalleryElement extends HTMLElement {
    constructor() {
        super();
        this.products = [];
        this.hasMore = false;
        this.loadedImages = new Set();
        this.settings = this.getDefaultSettings();
        this.isRendered = false;
        this.pendingProductsData = null;
        this.selectedOptions = {};
        this.quantities = {};
        this.errors = {};
    }

    getDefaultSettings() {
        return {
            cardBgColor: '#ffffff',
            cardHoverBgColor: '#f8f9fa',
            borderColor: '#e0e0e0',
            cardShadow: 'medium',
            cornerRadius: 12,
            borderWidth: 1,
            cardPadding: 20,
            cardGap: 24,
            headingColor: '#1a1a1a',
            textColor: '#666666',
            fontFamily: 'Arial',
            headingSize: 18,
            textSize: 14,
            priceColor: '#2c3e50',
            comparePriceColor: '#999999',
            priceSize: 24,
            buttonText: 'View Product',
            buttonBgColor: '#3498db',
            buttonTextColor: '#ffffff',
            buttonHoverBgColor: '#2980b9',
            buttonStyle: 'filled',
            buttonSize: 'medium',
            buttonRadius: 8,
            imageHeight: 280,
            imageZoom: true,
            imageBorderRadius: 8,
            ribbonBgColor: '#e74c3c',
            ribbonTextColor: '#ffffff',
            primaryAccent: '#3498db',
            secondaryAccent: '#2ecc71',
            hoverEffect: 'lift',
            loadMoreText: 'Load More Products',
            loadMoreBgColor: '#ffffff',
            loadMoreTextColor: '#3498db',
            loadMoreBorderColor: '#3498db'
        };
    }

    connectedCallback() {
        this.render();
        this.isRendered = true;
        
        if (this.pendingProductsData) {
            this.products = this.pendingProductsData.products || [];
            this.hasMore = this.pendingProductsData.hasMore || false;
            this.pendingProductsData = null;
            this.renderProducts();
        }
    }

    static get observedAttributes() {
        return ['products-data', 'settings', 'error-data', 'cart-success'];
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
                    
                    this.products = data.products || [];
                    this.hasMore = data.hasMore || false;
                    
                    // Initialize options and quantities for new products
                    this.products.forEach(p => {
                        if (!this.selectedOptions[p.id]) {
                            this.selectedOptions[p.id] = {};
                        }
                        if (!this.quantities[p.id]) {
                            this.quantities[p.id] = 1;
                        }
                        if (!this.errors[p.id]) {
                            this.errors[p.id] = '';
                        }
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
            } else if (name === 'cart-success') {
                try {
                    const successData = JSON.parse(newValue);
                    this.showSuccessFeedback(successData.productId);
                } catch (error) {
                    console.error('Error parsing success data:', error);
                }
            }
        }
    }

    // Optimize Wix image URL
    optimizeImageUrl(url, width = 375, height = 375) {
        if (!url) return '';
        
        try {
            const mediaMatch = url.match(/\/media\/([^/]+)/);
            if (!mediaMatch) return url;
            
            const mediaId = mediaMatch[1];
            return `https://static.wixstatic.com/media/${mediaId}/v1/fill/w_${width},h_${height},al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/${mediaId}`;
        } catch (error) {
            return url;
        }
    }

    // Validate product options
    validateOptions(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product || !product.options || product.options.length === 0) {
            return true; // No options to validate
        }

        const selected = this.selectedOptions[productId] || {};
        const missing = [];

        product.options.forEach(opt => {
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

    // Update error message display
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

    // Show success feedback
    showSuccessFeedback(productId) {
        const card = this.querySelector(`[data-product-id="${productId}"]`);
        if (card) {
            const btn = card.querySelector('.add-btn');
            if (btn) {
                btn.classList.add('success');
                btn.textContent = '✓ Added to Cart!';
                
                setTimeout(() => {
                    btn.classList.remove('success');
                    btn.textContent = 'Add to Cart';
                }, 2000);
            }
        }
    }

    getShadowCSS() {
        const shadows = {
            none: 'none',
            small: '0 1px 3px rgba(0, 0, 0, 0.08)',
            medium: '0 4px 12px rgba(0, 0, 0, 0.12)',
            large: '0 8px 24px rgba(0, 0, 0, 0.16)'
        };
        return shadows[this.settings.cardShadow] || shadows.medium;
    }

    getButtonSizeCSS() {
        const sizes = {
            small: 'padding: 10px 20px; font-size: 12px;',
            medium: 'padding: 14px 28px; font-size: 14px;',
            large: 'padding: 18px 36px; font-size: 16px;'
        };
        return sizes[this.settings.buttonSize] || sizes.medium;
    }

    render() {
        console.log('🎨 Rendering Product Gallery');
        
        this.innerHTML = `
            <style>
                * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }
                
                :host {
                    display: block;
                    width: 100%;
                }
                
                .gallery-container {
                    width: 100%;
                    padding: 20px;
                    max-width: 1600px;
                    margin: 0 auto;
                    font-family: var(--font-family);
                }
                
                .products-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: var(--card-gap);
                    margin-bottom: 40px;
                }
                
                .product-card {
                    background: var(--card-bg);
                    border: var(--border-width) solid var(--border-color);
                    border-radius: var(--corner-radius);
                    overflow: hidden;
                    box-shadow: var(--card-shadow);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }
                
                .product-card:hover {
                    background: var(--card-hover-bg);
                    ${this.getHoverEffectCSS()}
                }
                
                .image-container {
                    position: relative;
                    width: 100%;
                    height: var(--image-height);
                    overflow: hidden;
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                    border-radius: var(--image-border-radius);
                }
                
                @keyframes shimmer {
                    0% { background-position: -100% 0; }
                    100% { background-position: 100% 0; }
                }
                
                .product-image {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    object-position: center;
                    opacity: 0;
                    transition: opacity 0.3s ease, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .product-image.loaded {
                    opacity: 1;
                }
                
                .product-card:hover .product-image {
                    transform: ${this.settings.imageZoom ? 'scale(1.08)' : 'scale(1)'};
                }
                
                .ribbon {
                    position: absolute;
                    top: 12px;
                    left: 0;
                    background: var(--ribbon-bg);
                    color: var(--ribbon-text);
                    padding: 6px 16px;
                    font-weight: 700;
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    z-index: 10;
                    box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3);
                    border-radius: 0 4px 4px 0;
                }
                
                .sale-badge {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    background: var(--primary-accent);
                    color: white;
                    padding: 6px 12px;
                    font-weight: 700;
                    font-size: 11px;
                    text-transform: uppercase;
                    border-radius: 20px;
                    z-index: 10;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                }
                
                .product-content {
                    padding: var(--card-padding);
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                
                .product-title {
                    font-size: var(--heading-size);
                    font-weight: 700;
                    color: var(--heading-color);
                    margin: 0 0 10px 0;
                    line-height: 1.3;
                    overflow: hidden;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    min-height: calc(var(--heading-size) * 2.6);
                }
                
                .price-section {
                    display: flex;
                    align-items: baseline;
                    gap: 10px;
                    margin: 0 0 16px 0;
                    padding-bottom: 12px;
                    border-bottom: 1px solid var(--border-color);
                }
                
                .price {
                    font-size: var(--price-size);
                    font-weight: 800;
                    color: var(--price-color);
                }
                
                .price-sale {
                    font-size: calc(var(--price-size) * 0.7);
                    color: var(--compare-price-color);
                    text-decoration: line-through;
                    opacity: 0.7;
                }
                
                /* Product Options */
                .options-section {
                    margin: 0 0 16px 0;
                    flex: 1;
                }
                
                .option {
                    margin-bottom: 16px;
                }
                
                .option label {
                    display: block;
                    font-weight: 600;
                    font-size: 12px;
                    margin-bottom: 8px;
                    color: var(--text-color);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                /* Color Swatches */
                .swatches {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-bottom: 4px;
                }
                
                .swatch {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    border: 2px solid var(--border-color);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    position: relative;
                    background-size: cover;
                    background-position: center;
                }
                
                .swatch:hover {
                    transform: scale(1.1);
                    border-color: #999;
                }
                
                .swatch.selected {
                    border-color: var(--primary-accent);
                    border-width: 3px;
                    box-shadow: 0 0 0 2px white, 0 0 0 4px var(--primary-accent);
                }
                
                /* Option Dropdowns */
                select {
                    width: 100%;
                    padding: 10px 12px;
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    font-size: 14px;
                    color: var(--heading-color);
                    background: white;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-family: var(--font-family);
                }
                
                select:hover,
                select:focus {
                    border-color: var(--primary-accent);
                    outline: none;
                }
                
                /* Quantity Selector */
                .quantity-selector {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin: 16px 0;
                    padding: 12px;
                    background: #f8f8f8;
                    border-radius: 6px;
                }
                
                .quantity-selector label {
                    font-weight: 600;
                    font-size: 12px;
                    color: var(--text-color);
                    margin: 0;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .quantity-controls {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-left: auto;
                }
                
                .quantity-btn {
                    width: 32px;
                    height: 32px;
                    border: 1px solid var(--border-color);
                    background: white;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 1.2em;
                    font-weight: bold;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    color: var(--heading-color);
                    padding: 0;
                }
                
                .quantity-btn:hover {
                    background: var(--primary-accent);
                    border-color: var(--primary-accent);
                    color: white;
                }
                
                .quantity-btn:active {
                    transform: scale(0.95);
                }
                
                .quantity-btn:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                    background: #f5f5f5;
                }
                
                .quantity-value {
                    min-width: 40px;
                    text-align: center;
                    font-size: 1.1em;
                    font-weight: 600;
                    color: var(--heading-color);
                }
                
                .error-message {
                    color: #d32f2f;
                    font-size: 0.85em;
                    margin: 8px 0;
                    padding: 8px;
                    background: #ffebee;
                    border-radius: 4px;
                    display: none;
                }
                
                /* Buttons */
                .button-group {
                    display: flex;
                    gap: 8px;
                    margin-top: auto;
                }
                
                .btn {
                    flex: 1;
                    border-radius: var(--button-radius);
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-align: center;
                    border: none;
                    ${this.getButtonSizeCSS()}
                }
                
                .view-btn {
                    background: #f5f5f5;
                    color: #333;
                    border: 1px solid #ddd;
                }
                
                .view-btn:hover {
                    background: #e5e5e5;
                    border-color: #999;
                }
                
                .add-btn {
                    background: var(--button-bg);
                    color: var(--button-text);
                }
                
                .add-btn:hover {
                    background: var(--button-hover-bg);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                }
                
                .add-btn.success {
                    background: #10b981 !important;
                }
                
                .load-more-container {
                    text-align: center;
                    padding: 40px 20px;
                }
                
                .load-more-btn {
                    padding: 18px 48px;
                    background: var(--load-more-bg);
                    color: var(--load-more-text);
                    border: 2px solid var(--load-more-border);
                    border-radius: var(--button-radius);
                    font-weight: 700;
                    font-size: 15px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-family: var(--font-family);
                }
                
                .load-more-btn:hover {
                    background: var(--load-more-text);
                    color: var(--load-more-bg);
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
                }
                
                .empty-state {
                    text-align: center;
                    padding: 80px 20px;
                    color: var(--text-color);
                    font-size: 18px;
                }
                
                @media (max-width: 1200px) {
                    .products-grid {
                        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    }
                }
                
                @media (max-width: 768px) {
                    .products-grid {
                        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    }
                    
                    .gallery-container {
                        padding: 12px;
                    }
                    
                    .product-title {
                        font-size: calc(var(--heading-size) * 0.9);
                    }
                    
                    .price {
                        font-size: calc(var(--price-size) * 0.85);
                    }
                    
                    .button-group {
                        flex-direction: column;
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

    getHoverEffectCSS() {
        const effects = {
            lift: 'transform: translateY(-8px); box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);',
            glow: 'box-shadow: 0 0 24px var(--primary-accent);',
            zoom: 'transform: scale(1.02);',
            none: ''
        };
        return effects[this.settings.hoverEffect] || effects.lift;
    }

    renderProducts() {
        console.log('📦 Rendering', this.products.length, 'products');
        
        const grid = this.querySelector('.products-grid');
        const loadMoreContainer = this.querySelector('.load-more-container');

        if (!grid || !loadMoreContainer) return;

        if (this.products.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    No products found. Please select a category or check back later.
                </div>
            `;
            loadMoreContainer.innerHTML = '';
            return;
        }

        grid.innerHTML = this.products.map((product, index) => 
            this.renderProductCard(product, index)
        ).join('');

        this.setupLazyLoading();
        this.attachEventListeners();

        if (this.hasMore) {
            loadMoreContainer.innerHTML = `
                <button class="load-more-btn" id="loadMoreBtn">
                    ${this.settings.loadMoreText}
                </button>
            `;
            
            const loadMoreBtn = this.querySelector('#loadMoreBtn');
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

        this.updateStyles();
    }

    renderProductCard(product, index) {
        const hasComparePrice = product.compareAtPrice && 
                               product.compareAtPrice !== product.price;
        const isAboveFold = index < 6;
        const hasOptions = product.options && product.options.length > 0;
        
        return `
            <div class="product-card" data-product-id="${product.id}">
                ${product.ribbon ? `<div class="ribbon">${product.ribbon}</div>` : ''}
                ${hasComparePrice ? '<div class="sale-badge">SALE</div>' : ''}
                
                <div class="image-container">
                    <img 
                        ${isAboveFold ? 
                            `src="${this.optimizeImageUrl(product.imageUrl, 375, 375)}" onload="this.classList.add('loaded')"` : 
                            `data-src="${this.optimizeImageUrl(product.imageUrl, 375, 375)}"`
                        }
                        alt="${product.name}"
                        class="product-image ${isAboveFold ? '' : ''}"
                        loading="lazy"
                    >
                </div>
                
                <div class="product-content">
                    <h3 class="product-title">${product.name}</h3>
                    
                    <div class="price-section">
                        <span class="price">${product.price}</span>
                        ${hasComparePrice ? `<span class="price-sale">${product.compareAtPrice}</span>` : ''}
                    </div>
                    
                    ${hasOptions ? this.renderProductOptions(product) : ''}
                    ${hasOptions ? this.renderQuantitySelector(product.id) : ''}
                    
                    <div class="error-message" role="alert"></div>
                    
                    <div class="button-group">
                        <button class="btn view-btn" data-action="view">View Product</button>
                        <button class="btn add-btn" data-action="add">${hasOptions ? 'Add to Cart' : 'View Product'}</button>
                    </div>
                </div>
            </div>
        `;
    }

    renderProductOptions(product) {
        if (!product.options || product.options.length === 0) return '';
        
        return `
            <div class="options-section">
                ${product.options.map(opt => `
                    <div class="option">
                        <label>${opt.name}</label>
                        ${opt.optionType === 'color' || opt.name.toLowerCase().includes('color') ? `
                            <div class="swatches">
                                ${opt.choices.map(c => `
                                    <button 
                                        class="swatch" 
                                        style="background-color: ${this.getColorValue(c)};" 
                                        data-option="${opt.name}" 
                                        data-value="${c.description || c.value || c}" 
                                        title="${c.description || c.value || c}"
                                        aria-label="Select ${c.description || c.value || c}">
                                    </button>
                                `).join('')}
                            </div>
                        ` : `
                            <select data-option="${opt.name}" aria-label="Select ${opt.name}">
                                <option value="">Choose ${opt.name}</option>
                                ${opt.choices.map(c => `
                                    <option value="${c.description || c.value || c}">${c.description || c.value || c}</option>
                                `).join('')}
                            </select>
                        `}
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderQuantitySelector(productId) {
        return `
            <div class="quantity-selector">
                <label>Quantity</label>
                <div class="quantity-controls">
                    <button class="quantity-btn" data-action="decrease" aria-label="Decrease quantity">−</button>
                    <span class="quantity-value">${this.quantities[productId] || 1}</span>
                    <button class="quantity-btn" data-action="increase" aria-label="Increase quantity">+</button>
                </div>
            </div>
        `;
    }

    getColorValue(choice) {
        const value = choice.description || choice.value || choice;
        
        // If it's already a hex color, use it
        if (value.startsWith('#')) {
            return value;
        }
        
        // Common color mappings
        const colorMap = {
            'black': '#000000',
            'white': '#FFFFFF',
            'red': '#FF0000',
            'blue': '#0000FF',
            'green': '#00FF00',
            'yellow': '#FFFF00',
            'orange': '#FFA500',
            'purple': '#800080',
            'pink': '#FFC0CB',
            'brown': '#8B4513',
            'gray': '#808080',
            'grey': '#808080',
            'navy': '#000080',
            'teal': '#008080'
        };
        
        return colorMap[value.toLowerCase()] || '#CCCCCC';
    }

    setupLazyLoading() {
        const options = {
            root: null,
            rootMargin: '100px',
            threshold: 0.01
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.dataset.src;
                    if (src && !this.loadedImages.has(src)) {
                        img.src = src;
                        img.classList.add('loaded');
                        this.loadedImages.add(src);
                        observer.unobserve(img);
                    }
                }
            });
        }, options);

        this.querySelectorAll('img[data-src]').forEach(img => {
            observer.observe(img);
        });
    }

    attachEventListeners() {
        // Color swatches
        this.querySelectorAll('.swatch').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const option = e.target.dataset.option;
                const value = e.target.dataset.value;
                const card = e.target.closest('.card') || e.target.closest('.product-card');
                const productId = card.dataset.productId;
                
                this.selectedOptions[productId][option] = value;
                this.errors[productId] = '';
                this.updateErrorDisplay(productId);

                // Visual feedback
                card.querySelectorAll(`.swatch[data-option="${option}"]`).forEach(s => 
                    s.classList.remove('selected')
                );
                e.target.classList.add('selected');
                
                console.log('✅ Color selected:', option, '=', value);
            });
        });

        // Dropdowns
        this.querySelectorAll('select').forEach(sel => {
            sel.addEventListener('change', (e) => {
                const option = e.target.dataset.option;
                const value = e.target.value;
                const card = e.target.closest('.card') || e.target.closest('.product-card');
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
                const card = e.target.closest('.card') || e.target.closest('.product-card');
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
                
                if (decreaseBtn) decreaseBtn.disabled = currentQty <= 1;
                if (increaseBtn) increaseBtn.disabled = currentQty >= 99;
                
                console.log('✅ Quantity updated:', productId, '=', currentQty);
            });
        });

        // Action buttons
        this.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const action = e.target.dataset.action;
                const card = e.target.closest('.card') || e.target.closest('.product-card');
                const productId = card.dataset.productId;
                const product = this.products.find(p => p.id === productId);
                
                if (action === 'view') {
                    console.log('👁️ View product:', productId);
                    this.dispatchEvent(new CustomEvent('viewProduct', {
                        detail: { productId, product },
                        bubbles: true,
                        composed: true
                    }));
                } else if (action === 'add') {
                    // If no options, treat as view product
                    if (!product.options || product.options.length === 0) {
                        this.dispatchEvent(new CustomEvent('viewProduct', {
                            detail: { productId, product },
                            bubbles: true,
                            composed: true
                        }));
                        return;
                    }
                    
                    // Validate before adding
                    if (this.validateOptions(productId)) {
                        const choices = this.selectedOptions[productId];
                        const quantity = this.quantities[productId] || 1;
                        console.log('🛒 Add to cart:', productId, choices, 'qty:', quantity);
                        this.dispatchEvent(new CustomEvent('addToCart', {
                            detail: { productId, choices, quantity },
                            bubbles: true,
                            composed: true
                        }));
                    }
                }
            });
        });
    }

    updateStyles() {
        const container = this.querySelector('.gallery-container');
        if (!container) return;

        const { settings } = this;
        
        container.style.setProperty('--card-gap', `${settings.cardGap}px`);
        container.style.setProperty('--card-bg', settings.cardBgColor);
        container.style.setProperty('--card-hover-bg', settings.cardHoverBgColor);
        container.style.setProperty('--border-color', settings.borderColor);
        container.style.setProperty('--card-shadow', this.getShadowCSS());
        container.style.setProperty('--corner-radius', `${settings.cornerRadius}px`);
        container.style.setProperty('--border-width', `${settings.borderWidth}px`);
        container.style.setProperty('--card-padding', `${settings.cardPadding}px`);
        container.style.setProperty('--heading-color', settings.headingColor);
        container.style.setProperty('--text-color', settings.textColor);
        container.style.setProperty('--font-family', settings.fontFamily);
        container.style.setProperty('--heading-size', `${settings.headingSize}px`);
        container.style.setProperty('--text-size', `${settings.textSize}px`);
        container.style.setProperty('--price-color', settings.priceColor);
        container.style.setProperty('--compare-price-color', settings.comparePriceColor);
        container.style.setProperty('--price-size', `${settings.priceSize}px`);
        container.style.setProperty('--button-bg', settings.buttonBgColor);
        container.style.setProperty('--button-text', settings.buttonTextColor);
        container.style.setProperty('--button-hover-bg', settings.buttonHoverBgColor);
        container.style.setProperty('--button-radius', `${settings.buttonRadius}px`);
        container.style.setProperty('--image-height', `${settings.imageHeight}px`);
        container.style.setProperty('--image-border-radius', `${settings.imageBorderRadius}px`);
        container.style.setProperty('--ribbon-bg', settings.ribbonBgColor);
        container.style.setProperty('--ribbon-text', settings.ribbonTextColor);
        container.style.setProperty('--primary-accent', settings.primaryAccent);
        container.style.setProperty('--secondary-accent', settings.secondaryAccent);
        container.style.setProperty('--load-more-bg', settings.loadMoreBgColor);
        container.style.setProperty('--load-more-text', settings.loadMoreTextColor);
        container.style.setProperty('--load-more-border', settings.loadMoreBorderColor);
    }
}

customElements.define('product-gallery', ProductGalleryElement);
console.log('✅ product-gallery custom element registered');
