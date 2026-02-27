class ProductGalleryElement extends HTMLElement {
    constructor() {
        super();
        this.products = [];
        this.hasMore = false;
        this.settings = this.getDefaultSettings();
        this.isRendered = false;
        this.pendingProductsData = null;
        this.selectedVariants = {}; // Track selected options per product
    }

    getDefaultSettings() {
        return {
            cardBgColor: '#ffffff',
            cardHoverBgColor: '#f8f9fa',
            headingColor: '#1a1a1a',
            textColor: '#666666',
            fontFamily: 'Arial',
            headingSize: 18,
            textSize: 14,
            priceColor: '#2c3e50',
            comparePriceColor: '#999999',
            priceSize: 24,
            primaryAccent: '#3498db',
            secondaryAccent: '#2ecc71',
            ribbonBgColor: '#e74c3c',
            ribbonTextColor: '#ffffff',
            borderColor: '#e0e0e0',
            borderWidth: 1,
            cornerRadius: 12,
            cardPadding: 20,
            cardGap: 24,
            buttonText: 'View Product',
            buttonBgColor: '#3498db',
            buttonTextColor: '#ffffff',
            buttonHoverBgColor: '#2980b9',
            buttonStyle: 'filled',
            buttonSize: 'medium',
            imageHeight: 280,
            imageZoom: true,
            imageBorderRadius: 8,
            cardShadow: 'medium',
            hoverEffect: 'lift',
            columnsDesktop: 3,
            columnsTablet: 2,
            columnsMobile: 1,
            loadMoreText: 'Load More Products',
            loadMoreBgColor: '#ffffff',
            loadMoreTextColor: '#3498db',
            loadMoreBorderColor: '#3498db',
            addToCartText: 'Add to Cart',
            addToCartBgColor: '#2ecc71',
            addToCartTextColor: '#ffffff',
            addToCartHoverBgColor: '#27ae60'
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
                    
                    this.products = data.products || [];
                    this.hasMore = data.hasMore || false;
                    
                    // DEBUG: Check if productOptions are present
                    console.log('📦 Custom Element: Received products:', this.products.length);
                    this.products.forEach((p, i) => {
                        console.log(`Product ${i}: ${p.name}`);
                        console.log(`  - hasVariants: ${p.hasVariants}`);
                        console.log(`  - productOptions:`, p.productOptions);
                        if (p.productOptions && p.productOptions.length > 0) {
                            p.productOptions.forEach(opt => {
                                console.log(`    * ${opt.name} (${opt.optionType}): ${opt.choices?.length} choices`);
                            });
                        }
                    });
                    
                    // Initialize selected variants for each product
                    this.products.forEach(p => {
                        if (!this.selectedVariants[p.id]) {
                            this.selectedVariants[p.id] = {};
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

    getHoverEffectCSS() {
        const effects = {
            lift: 'transform: translateY(-8px); box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);',
            glow: `box-shadow: 0 0 20px ${this.settings.primaryAccent}66;`,
            zoom: 'transform: scale(1.02);',
            none: ''
        };
        return effects[this.settings.hoverEffect] || effects.lift;
    }

    getButtonCSS() {
        const sizes = {
            small: 'padding: 10px 20px; font-size: 12px;',
            medium: 'padding: 14px 28px; font-size: 14px;',
            large: 'padding: 18px 36px; font-size: 16px;'
        };
        
        const styles = {
            filled: `background: var(--button-bg); color: var(--button-text); border: none;`,
            outlined: `background: transparent; color: var(--button-bg); border: 2px solid var(--button-bg);`,
            text: `background: transparent; color: var(--button-bg); border: none;`
        };
        
        return sizes[this.settings.buttonSize] + styles[this.settings.buttonStyle];
    }

    render() {
        this.innerHTML = `
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                :host { display: block; width: 100%; }
                
                .gallery-container {
                    padding: 20px;
                    max-width: 1400px;
                    margin: 0 auto;
                    font-family: var(--font-family);
                }
                
                .products-grid {
                    display: grid;
                    grid-template-columns: repeat(var(--columns-desktop), 1fr);
                    gap: var(--card-gap);
                    margin-bottom: 40px;
                }
                
                .product-card {
                    background: var(--card-bg);
                    overflow: hidden;
                    box-shadow: var(--card-shadow);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    border: var(--border-width) solid var(--border-color);
                    border-radius: var(--corner-radius);
                }
                
                .product-card:hover {
                    background: var(--card-hover-bg);
                    ${this.getHoverEffectCSS()}
                }
                
                .product-image-container {
                    position: relative;
                    width: 100%;
                    height: var(--image-height);
                    overflow: hidden;
                    background: #f5f5f5;
                    flex-shrink: 0;
                    border-radius: var(--image-border-radius);
                }
                
                .product-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    object-position: center;
                    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .product-card:hover .product-image {
                    transform: ${this.settings.imageZoom ? 'scale(1.1)' : 'scale(1)'};
                }
                
                .product-ribbon {
                    position: absolute;
                    top: 12px;
                    left: 0;
                    background: var(--ribbon-bg);
                    color: var(--ribbon-text);
                    padding: 6px 16px;
                    font-weight: 700;
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.8px;
                    box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.2);
                    z-index: 10;
                    border-radius: 0 4px 4px 0;
                }
                
                .product-content {
                    padding: var(--card-padding);
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                
                .product-name {
                    font-size: var(--heading-size);
                    font-weight: 700;
                    margin: 0 0 16px 0;
                    line-height: 1.3;
                    color: var(--heading-color);
                    height: calc(var(--heading-size) * 2.6);
                    overflow: hidden;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                }
                
                /* VARIANT OPTIONS */
                .product-options {
                    margin: 0 0 16px 0;
                }
                
                .option-group {
                    margin-bottom: 12px;
                }
                
                .option-label {
                    font-size: 12px;
                    font-weight: 600;
                    color: var(--text-color);
                    margin-bottom: 6px;
                    display: block;
                }
                
                .swatches {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                
                .swatch {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    border: 2px solid #ddd;
                    cursor: pointer;
                    transition: all 0.2s;
                    position: relative;
                }
                
                .swatch:hover {
                    transform: scale(1.1);
                    border-color: var(--primary-accent);
                }
                
                .swatch.selected {
                    border-color: var(--primary-accent);
                    border-width: 3px;
                    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
                }
                
                .option-select {
                    width: 100%;
                    padding: 10px;
                    border: 2px solid #ddd;
                    border-radius: 6px;
                    font-size: 14px;
                    cursor: pointer;
                    transition: border-color 0.2s;
                    background: white;
                }
                
                .option-select:hover {
                    border-color: var(--primary-accent);
                }
                
                .option-select:focus {
                    outline: none;
                    border-color: var(--primary-accent);
                }
                
                .error-message {
                    color: #e74c3c;
                    font-size: 12px;
                    margin-top: 8px;
                    display: none;
                }
                
                .error-message.show {
                    display: block;
                }
                
                .product-price-section {
                    margin: auto 0 16px 0;
                    padding-top: 16px;
                    border-top: 1px solid var(--border-color);
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .product-price {
                    font-size: var(--price-size);
                    font-weight: 800;
                    color: var(--price-color);
                }
                
                .product-compare-price {
                    font-size: calc(var(--price-size) * 0.65);
                    color: var(--compare-price-color);
                    text-decoration: line-through;
                }
                
                .product-buttons {
                    display: flex;
                    gap: 8px;
                }
                
                .product-button {
                    flex: 1;
                    border-radius: 8px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-decoration: none;
                    text-align: center;
                    border: none;
                    ${this.getButtonCSS()}
                }
                
                .product-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
                }
                
                .add-to-cart-btn {
                    background: var(--add-cart-bg);
                    color: var(--add-cart-text);
                }
                
                .add-to-cart-btn:hover {
                    background: var(--add-cart-hover-bg);
                }
                
                .load-more-container {
                    text-align: center;
                    padding: 30px 0;
                }
                
                .load-more-button {
                    padding: 16px 48px;
                    border: 3px solid var(--load-more-border);
                    background: var(--load-more-bg);
                    color: var(--load-more-text);
                    border-radius: 50px;
                    font-size: 15px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-transform: uppercase;
                    letter-spacing: 1.2px;
                    font-family: var(--font-family);
                }
                
                .load-more-button:hover {
                    background: var(--load-more-text);
                    color: var(--load-more-bg);
                    transform: translateY(-3px);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
                }
                
                .empty-state {
                    text-align: center;
                    padding: 80px 20px;
                    color: var(--text-color);
                    font-size: 18px;
                    font-family: var(--font-family);
                }
                
                @media (max-width: 1024px) {
                    .products-grid {
                        grid-template-columns: repeat(var(--columns-tablet), 1fr);
                    }
                }
                
                @media (max-width: 768px) {
                    .products-grid {
                        grid-template-columns: repeat(var(--columns-mobile), 1fr);
                    }
                    
                    .product-name {
                        font-size: calc(var(--heading-size) * 0.9);
                    }
                    
                    .product-description {
                        font-size: calc(var(--text-size) * 0.9);
                    }
                    
                    .product-buttons {
                        flex-direction: column;
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
        const grid = this.querySelector('.products-grid');
        const loadMoreContainer = this.querySelector('.load-more-container');

        if (!grid || !loadMoreContainer) return;

        if (this.products.length === 0) {
            grid.innerHTML = '<div class="empty-state">No products found. Please select a category.</div>';
            loadMoreContainer.innerHTML = '';
            return;
        }

        grid.innerHTML = this.products.map(product => this.renderProductCard(product)).join('');

        // Add event listeners
        this.attachEventListeners();

        // Load more button
        if (this.hasMore) {
            loadMoreContainer.innerHTML = `
                <button class="load-more-button" id="loadMoreBtn">
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

    renderProductCard(product) {
        const hasComparePrice = product.compareAtPrice && product.compareAtPrice !== product.price;
        const hasVariants = product.hasVariants && product.productOptions && product.productOptions.length > 0;
        
        return `
            <div class="product-card" data-product-id="${product.id}">
                ${product.ribbon ? `<div class="product-ribbon">${product.ribbon}</div>` : ''}
                
                <div class="product-image-container">
                    <img src="${product.imageUrl}" 
                         alt="${product.name}" 
                         class="product-image"
                         loading="lazy"
                         onerror="this.src='https://via.placeholder.com/400'">
                </div>
                
                <div class="product-content">
                    <h3 class="product-name">${product.name}</h3>
                    
                    <div class="product-price-section">
                        <span class="product-price">${product.price}</span>
                        ${hasComparePrice ? `<span class="product-compare-price">${product.compareAtPrice}</span>` : ''}
                    </div>
                    
                    ${hasVariants ? this.renderVariantOptions(product) : ''}
                    
                    <div class="error-message" data-product-id="${product.id}"></div>
                    
                    <div class="product-buttons">
                        ${hasVariants ? `
                            <button class="product-button add-to-cart-btn" data-product-id="${product.id}">
                                ${this.settings.addToCartText || 'Add to Cart'}
                            </button>
                        ` : `
                            <button class="product-button add-to-cart-btn" data-product-id="${product.id}" data-no-variants="true">
                                ${this.settings.addToCartText || 'Add to Cart'}
                            </button>
                        `}
                        <a href="${product.productUrl}" class="product-button">${this.settings.buttonText}</a>
                    </div>
                </div>
            </div>
        `;
    }

    renderVariantOptions(product) {
        if (!product.productOptions || product.productOptions.length === 0) {
            console.log(`⚠️ Product ${product.name}: No productOptions found`);
            return '';
        }
        
        console.log(`✅ Product ${product.name}: Rendering ${product.productOptions.length} options`);
        
        return `
            <div class="product-options">
                ${product.productOptions.map(option => this.renderOption(product.id, option)).join('')}
            </div>
        `;
    }

    renderOption(productId, option) {
        if (option.optionType === 'color') {
            return `
                <div class="option-group">
                    <label class="option-label">${option.name}</label>
                    <div class="swatches">
                        ${option.choices.filter(c => c.visible).map(choice => `
                            <button class="swatch" 
                                    style="background-color: ${choice.value};"
                                    data-product-id="${productId}"
                                    data-option="${option.name}"
                                    data-value="${choice.description}"
                                    title="${choice.description}"
                                    ${!choice.inStock ? 'disabled' : ''}>
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="option-group">
                    <label class="option-label">${option.name}</label>
                    <select class="option-select" 
                            data-product-id="${productId}"
                            data-option="${option.name}">
                        <option value="">Select ${option.name}</option>
                        ${option.choices.filter(c => c.visible).map(choice => `
                            <option value="${choice.description}" ${!choice.inStock ? 'disabled' : ''}>
                                ${choice.description}${!choice.inStock ? ' (Out of Stock)' : ''}
                            </option>
                        `).join('')}
                    </select>
                </div>
            `;
        }
    }

    attachEventListeners() {
        // Swatch click handlers
        this.querySelectorAll('.swatch').forEach(swatch => {
            swatch.addEventListener('click', (e) => {
                const productId = e.target.dataset.productId;
                const option = e.target.dataset.option;
                const value = e.target.dataset.value;
                
                // Update selected variant
                this.selectedVariants[productId][option] = value;
                
                // Visual feedback
                const card = e.target.closest('.product-card');
                card.querySelectorAll(`.swatch[data-option="${option}"]`).forEach(s => {
                    s.classList.remove('selected');
                });
                e.target.classList.add('selected');
                
                // Clear error
                this.clearError(productId);
            });
        });
        
        // Dropdown change handlers
        this.querySelectorAll('.option-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const productId = e.target.dataset.productId;
                const option = e.target.dataset.option;
                const value = e.target.value;
                
                if (value) {
                    this.selectedVariants[productId][option] = value;
                } else {
                    delete this.selectedVariants[productId][option];
                }
                
                // Clear error
                this.clearError(productId);
            });
        });
        
        // Add to cart button handlers
        this.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = e.target.dataset.productId;
                const noVariants = e.target.dataset.noVariants === 'true';
                
                if (noVariants) {
                    // Product without variants
                    this.handleAddToCart(productId, {});
                } else {
                    // Product with variants - validate selection
                    const product = this.products.find(p => p.id === productId);
                    const requiredOptions = product.productOptions.map(opt => opt.name);
                    const selectedOptions = this.selectedVariants[productId] || {};
                    
                    // Check if all options are selected
                    const missingOptions = requiredOptions.filter(opt => !selectedOptions[opt]);
                    
                    if (missingOptions.length > 0) {
                        this.showError(productId, `Please select: ${missingOptions.join(', ')}`);
                    } else {
                        this.clearError(productId);
                        this.handleAddToCart(productId, selectedOptions);
                    }
                }
            });
        });
    }

    showError(productId, message) {
        const errorEl = this.querySelector(`.error-message[data-product-id="${productId}"]`);
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.add('show');
        }
    }

    clearError(productId) {
        const errorEl = this.querySelector(`.error-message[data-product-id="${productId}"]`);
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.classList.remove('show');
        }
    }

    handleAddToCart(productId, choices) {
        this.dispatchEvent(new CustomEvent('add-to-cart', {
            bubbles: true,
            composed: true,
            detail: { productId, choices }
        }));
    }

    updateStyles() {
        const container = this.querySelector('.gallery-container');
        if (!container) return;

        // Apply all CSS variables
        container.style.setProperty('--card-bg', this.settings.cardBgColor);
        container.style.setProperty('--card-hover-bg', this.settings.cardHoverBgColor);
        container.style.setProperty('--heading-color', this.settings.headingColor);
        container.style.setProperty('--text-color', this.settings.textColor);
        container.style.setProperty('--font-family', this.settings.fontFamily);
        container.style.setProperty('--heading-size', `${this.settings.headingSize}px`);
        container.style.setProperty('--text-size', `${this.settings.textSize}px`);
        container.style.setProperty('--price-color', this.settings.priceColor);
        container.style.setProperty('--compare-price-color', this.settings.comparePriceColor);
        container.style.setProperty('--price-size', `${this.settings.priceSize}px`);
        container.style.setProperty('--primary-accent', this.settings.primaryAccent);
        container.style.setProperty('--secondary-accent', this.settings.secondaryAccent);
        container.style.setProperty('--border-color', this.settings.borderColor);
        container.style.setProperty('--border-width', `${this.settings.borderWidth}px`);
        container.style.setProperty('--corner-radius', `${this.settings.cornerRadius}px`);
        container.style.setProperty('--card-padding', `${this.settings.cardPadding}px`);
        container.style.setProperty('--card-gap', `${this.settings.cardGap}px`);
        container.style.setProperty('--button-bg', this.settings.buttonBgColor);
        container.style.setProperty('--button-text', this.settings.buttonTextColor);
        container.style.setProperty('--button-hover-bg', this.settings.buttonHoverBgColor);
        container.style.setProperty('--image-height', `${this.settings.imageHeight}px`);
        container.style.setProperty('--image-border-radius', `${this.settings.imageBorderRadius}px`);
        container.style.setProperty('--card-shadow', this.getShadowCSS());
        container.style.setProperty('--columns-desktop', this.settings.columnsDesktop);
        container.style.setProperty('--columns-tablet', this.settings.columnsTablet);
        container.style.setProperty('--columns-mobile', this.settings.columnsMobile);
        container.style.setProperty('--ribbon-bg', this.settings.ribbonBgColor);
        container.style.setProperty('--ribbon-text', this.settings.ribbonTextColor);
        container.style.setProperty('--load-more-bg', this.settings.loadMoreBgColor);
        container.style.setProperty('--load-more-text', this.settings.loadMoreTextColor);
        container.style.setProperty('--load-more-border', this.settings.loadMoreBorderColor);
        container.style.setProperty('--add-cart-bg', this.settings.addToCartBgColor);
        container.style.setProperty('--add-cart-text', this.settings.addToCartTextColor);
        container.style.setProperty('--add-cart-hover-bg', this.settings.addToCartHoverBgColor);
    }
}

customElements.define('product-gallery', ProductGalleryElement);
