class ProductGalleryElement extends HTMLElement {
    constructor() {
        super();
        this.products = [];
        this.hasMore = false;
        this.settings = {
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
            showAddToCart: true,
            addToCartText: 'Add to Cart',
            addToCartBgColor: '#2ecc71',
            addToCartTextColor: '#ffffff',
            addToCartHoverBgColor: '#27ae60'
        };
        this.isRendered = false;
        this.pendingProductsData = null;
        this.selectedVariants = {};
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
                    this.renderProducts();
                } catch (e) {
                    // Silent fail
                }
            } else if (name === 'settings') {
                try {
                    const newSettings = JSON.parse(newValue);
                    Object.assign(this.settings, newSettings);
                    if (this.isRendered) {
                        this.updateStyles();
                    }
                } catch (e) {
                    // Silent fail
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
            filled: `
                background: var(--button-bg);
                color: var(--button-text);
                border: none;
            `,
            outlined: `
                background: transparent;
                color: var(--button-bg);
                border: 2px solid var(--button-bg);
            `,
            text: `
                background: transparent;
                color: var(--button-bg);
                border: none;
            `
        };
        
        return sizes[this.settings.buttonSize] + styles[this.settings.buttonStyle];
    }

    render() {
        this.innerHTML = `
            <style>
                * { box-sizing: border-box; }
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
                    margin: 0 0 12px 0;
                    line-height: 1.3;
                    color: var(--heading-color);
                    height: calc(var(--heading-size) * 2.6);
                    overflow: hidden;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                }
                
                .product-description {
                    font-size: var(--text-size);
                    line-height: 1.6;
                    color: var(--text-color);
                    margin: 0 0 16px 0;
                    height: calc(var(--text-size) * 3.2);
                    overflow: hidden;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
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
                    display: inline-block;
                }
                
                .product-compare-price {
                    font-size: calc(var(--price-size) * 0.65);
                    color: var(--compare-price-color);
                    text-decoration: line-through;
                    display: inline-block;
                }
                
                .product-options {
                    margin-bottom: 16px;
                }
                
                .option-group {
                    margin-bottom: 12px;
                }
                
                .option-label {
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--heading-color);
                    margin-bottom: 8px;
                    display: block;
                }
                
                .color-swatches {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                
                .color-swatch {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    cursor: pointer;
                    border: 2px solid transparent;
                    transition: all 0.2s ease;
                    position: relative;
                }
                
                .color-swatch:hover {
                    transform: scale(1.1);
                }
                
                .color-swatch.selected {
                    border-color: var(--heading-color);
                    box-shadow: 0 0 0 2px var(--card-bg), 0 0 0 4px var(--heading-color);
                }
                
                .color-swatch.disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                }
                
                .dropdown-select {
                    width: 100%;
                    padding: 10px 12px;
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    font-size: 14px;
                    font-family: var(--font-family);
                    background: white;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .dropdown-select:hover {
                    border-color: var(--primary-accent);
                }
                
                .dropdown-select:focus {
                    outline: none;
                    border-color: var(--primary-accent);
                    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
                }
                
                .dropdown-select option:disabled {
                    color: #999;
                }
                
                .button-group {
                    display: flex;
                    gap: 10px;
                    margin-top: auto;
                }
                
                .product-button {
                    display: block;
                    flex: 1;
                    margin: 0;
                    border-radius: 8px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-decoration: none;
                    text-align: center;
                    ${this.getButtonCSS()}
                }
                
                .product-button:hover {
                    background: var(--button-hover-bg);
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
                }
                
                .add-to-cart-button {
                    display: block;
                    flex: 1;
                    margin: 0;
                    padding: 14px 28px;
                    font-size: 14px;
                    border-radius: 8px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-align: center;
                    border: none;
                    background: var(--add-to-cart-bg);
                    color: var(--add-to-cart-text);
                }
                
                .add-to-cart-button:hover:not(:disabled) {
                    background: var(--add-to-cart-hover-bg);
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
                }
                
                .add-to-cart-button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .add-to-cart-button.adding {
                    opacity: 0.7;
                    pointer-events: none;
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
                    
                    .button-group {
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

        // Setup event listeners for variants and add to cart
        this.setupProductEventListeners();

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
        const hasVariants = product.options && product.options.length > 0;
        
        // Initialize selected variant for this product
        if (!this.selectedVariants[product.id]) {
            this.selectedVariants[product.id] = {};
        }
        
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
                    <p class="product-description">${product.description || ''}</p>
                    
                    <div class="product-price-section">
                        <span class="product-price" data-price-display="${product.id}">${product.price}</span>
                        ${hasComparePrice ? `<span class="product-compare-price" data-compare-price-display="${product.id}">${product.compareAtPrice}</span>` : ''}
                    </div>
                    
                    ${hasVariants ? this.renderProductOptions(product) : ''}
                    
                    <div class="button-group">
                        <a href="${product.productUrl}" class="product-button">${this.settings.buttonText}</a>
                        ${this.settings.showAddToCart ? `
                            <button class="add-to-cart-button" 
                                    data-add-to-cart="${product.id}"
                                    ${!product.inStock ? 'disabled' : ''}>
                                ${!product.inStock ? 'Out of Stock' : this.settings.addToCartText}
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    renderProductOptions(product) {
        if (!product.options || product.options.length === 0) return '';
        
        return `
            <div class="product-options" data-options="${product.id}">
                ${product.options.map((option, index) => this.renderOption(product, option, index)).join('')}
            </div>
        `;
    }

    renderOption(product, option, optionIndex) {
        const isColorOption = option.optionType === 'color';
        
        if (isColorOption) {
            return `
                <div class="option-group">
                    <label class="option-label">${option.name}</label>
                    <div class="color-swatches">
                        ${option.choices.map((choice, choiceIndex) => `
                            <div class="color-swatch ${!choice.inStock ? 'disabled' : ''}" 
                                 style="background-color: ${choice.value};"
                                 data-product-id="${product.id}"
                                 data-option-index="${optionIndex}"
                                 data-choice-value="${choice.value}"
                                 data-choice-description="${choice.description}"
                                 title="${choice.description}${!choice.inStock ? ' (Out of Stock)' : ''}">
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="option-group">
                    <label class="option-label">${option.name}</label>
                    <select class="dropdown-select" 
                            data-product-id="${product.id}"
                            data-option-index="${optionIndex}">
                        <option value="">Select ${option.name}</option>
                        ${option.choices.map(choice => `
                            <option value="${choice.value}" 
                                    ${!choice.inStock ? 'disabled' : ''}>
                                ${choice.description}${!choice.inStock ? ' (Out of Stock)' : ''}
                            </option>
                        `).join('')}
                    </select>
                </div>
            `;
        }
    }

    setupProductEventListeners() {
        // Color swatch listeners
        this.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.addEventListener('click', (e) => {
                if (swatch.classList.contains('disabled')) return;
                
                const productId = swatch.dataset.productId;
                const optionIndex = swatch.dataset.optionIndex;
                const choiceValue = swatch.dataset.choiceValue;
                const choiceDescription = swatch.dataset.choiceDescription;
                
                // Remove selected from siblings
                const siblings = swatch.parentElement.querySelectorAll('.color-swatch');
                siblings.forEach(s => s.classList.remove('selected'));
                
                // Add selected to clicked swatch
                swatch.classList.add('selected');
                
                // Store selection
                const product = this.products.find(p => p.id === productId);
                if (product && product.options[optionIndex]) {
                    this.selectedVariants[productId][product.options[optionIndex].name] = choiceDescription;
                    this.updateProductPriceAndImage(productId);
                }
            });
        });
        
        // Dropdown listeners
        this.querySelectorAll('.dropdown-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const productId = select.dataset.productId;
                const optionIndex = select.dataset.optionIndex;
                const choiceValue = select.value;
                
                const product = this.products.find(p => p.id === productId);
                if (product && product.options[optionIndex]) {
                    this.selectedVariants[productId][product.options[optionIndex].name] = choiceValue;
                    this.updateProductPriceAndImage(productId);
                }
            });
        });
        
        // Add to cart listeners
        this.querySelectorAll('.add-to-cart-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = button.dataset.addToCart;
                this.handleAddToCart(productId, button);
            });
        });
    }

    updateProductPriceAndImage(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product || !product.variants) return;
        
        const selectedOptions = this.selectedVariants[productId];
        const variant = this.findMatchingVariant(product, selectedOptions);
        
        if (variant) {
            // Update price display
            const priceDisplay = this.querySelector(`[data-price-display="${productId}"]`);
            const comparePriceDisplay = this.querySelector(`[data-compare-price-display="${productId}"]`);
            
            if (priceDisplay && variant.price) {
                priceDisplay.textContent = variant.price;
            }
            
            if (comparePriceDisplay && variant.compareAtPrice) {
                comparePriceDisplay.textContent = variant.compareAtPrice;
            }
            
            // Update image if variant has specific image
            if (variant.imageUrl) {
                const card = this.querySelector(`[data-product-id="${productId}"]`);
                const img = card?.querySelector('.product-image');
                if (img) {
                    img.src = variant.imageUrl;
                }
            }
            
            // Update add to cart button stock status
            const addToCartBtn = this.querySelector(`[data-add-to-cart="${productId}"]`);
            if (addToCartBtn) {
                if (variant.inStock) {
                    addToCartBtn.disabled = false;
                    addToCartBtn.textContent = this.settings.addToCartText;
                } else {
                    addToCartBtn.disabled = true;
                    addToCartBtn.textContent = 'Out of Stock';
                }
            }
        }
    }

    findMatchingVariant(product, selectedOptions) {
        if (!product.variants || product.variants.length === 0) return null;
        
        return product.variants.find(variant => {
            if (!variant.choices) return false;
            
            // Check if all selected options match this variant
            return Object.keys(selectedOptions).every(optionName => {
                const selectedValue = selectedOptions[optionName];
                return variant.choices[optionName] === selectedValue;
            });
        });
    }

    handleAddToCart(productId, button) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        
        const selectedOptions = this.selectedVariants[productId];
        
        // Validate that all required options are selected
        if (product.options && product.options.length > 0) {
            const allSelected = product.options.every(option => 
                selectedOptions[option.name] && selectedOptions[option.name] !== ''
            );
            
            if (!allSelected) {
                alert('Please select all product options before adding to cart.');
                return;
            }
        }
        
        // Find matching variant
        const variant = this.findMatchingVariant(product, selectedOptions);
        
        // Show loading state
        button.classList.add('adding');
        button.textContent = 'Adding...';
        
        // Dispatch event to widget code
        this.dispatchEvent(new CustomEvent('add-to-cart', {
            bubbles: true,
            composed: true,
            detail: {
                productId: product.id,
                variantId: variant ? variant._id : null,
                selectedOptions: selectedOptions,
                quantity: 1
            }
        }));
        
        // Reset button after 2 seconds
        setTimeout(() => {
            button.classList.remove('adding');
            button.textContent = this.settings.addToCartText;
        }, 2000);
    }

    updateStyles() {
        const container = this.querySelector('.gallery-container');
        if (!container) return;

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
        container.style.setProperty('--primary-accent', this.settings.primaryAccent);
        container.style.setProperty('--add-to-cart-bg', this.settings.addToCartBgColor);
        container.style.setProperty('--add-to-cart-text', this.settings.addToCartTextColor);
        container.style.setProperty('--add-to-cart-hover-bg', this.settings.addToCartHoverBgColor);
    }
}

customElements.define('product-gallery', ProductGalleryElement);
