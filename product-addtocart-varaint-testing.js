class ProductGalleryElement extends HTMLElement {
    constructor() {
        super();
        this.products = [];
        this.hasMore = false;
        this.productSelections = {}; // { productId: { Color: 'Red',Size: 'M' } }
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
            cartButtonText: 'Add to Cart',
            cartButtonBgColor: '#2ecc71',
            cartButtonTextColor: '#ffffff',
            cartButtonHoverBgColor: '#27ae60',
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
            loadMoreBorderColor: '#3498db'
        };
        this.isRendered = false;
        this.pendingProductsData = null;
    }

    connectedCallback() {
        this.render();
        this.isRendered = true;

        // Event delegation for clicks and dropdown changes
        this.addEventListener('click', this.handleClick.bind(this));
        this.addEventListener('change', this.handleChange.bind(this));

        if (this.pendingProductsData) {
            this.products = this.pendingProductsData.products || [];
            this.hasMore = this.pendingProductsData.hasMore || false;
            this.pendingProductsData = null;
            this.renderProducts();
        }
    }

    static get observedAttributes() {
        return ['products-data', 'settings', 'cart-status'];
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
                } catch (e) { /* Silent fail */ }
            } else if (name === 'settings') {
                try {
                    const newSettings = JSON.parse(newValue);
                    Object.assign(this.settings, newSettings);
                    if (this.isRendered) {
                        this.updateStyles();
                    }
                } catch (e) { /* Silent fail */ }
            } else if (name === 'cart-status') {
                try {
                    const status = JSON.parse(newValue);
                    this.handleCartStatus(status);
                } catch (e) { /* Silent fail */ }
            }
        }
    }

    // ─────────────────────────────────────────
    // EVENT HANDLING
    // ─────────────────────────────────────────

    handleClick(e) {
        // Color swatch click
        const swatch = e.target.closest('.option-swatch');
        if (swatch) {
            this.handleSwatchClick(swatch);
            return;
        }

        // Add to Cart button click
        const cartBtn = e.target.closest('.add-to-cart-button');
        if (cartBtn) {
            this.handleAddToCartClick(cartBtn);
            return;
        }

        // Load More button click
        const loadMoreBtn = e.target.closest('.load-more-button');
        if (loadMoreBtn) {
            this.dispatchEvent(new CustomEvent('load-more', {
                bubbles: true,
                composed: true
            }));
            return;
        }
    }

    handleChange(e) {
        const dropdown = e.target.closest('.option-dropdown');
        if (dropdown) {
            this.handleDropdownChange(dropdown);
        }
    }

    handleSwatchClick(swatch) {
        const productId = swatch.dataset.productId;
        const optionName = swatch.dataset.optionName;
        const optionValue = swatch.dataset.optionValue;

        if (!this.productSelections[productId]) {
            this.productSelections[productId] = {};
        }

        // Toggle: deselect if already selected, else select
        if (this.productSelections[productId][optionName] === optionValue) {
            delete this.productSelections[productId][optionName];
        } else {
            this.productSelections[productId][optionName] = optionValue;
        }

        this.updateProductCard(productId);
    }

    handleDropdownChange(dropdown) {
        const productId = dropdown.dataset.productId;
        const optionName = dropdown.dataset.optionName;
        const optionValue = dropdown.value;

        if (!this.productSelections[productId]) {
            this.productSelections[productId] = {};
        }

        if (optionValue === '') {
            delete this.productSelections[productId][optionName];
        } else {
            this.productSelections[productId][optionName] = optionValue;
        }

        this.updateProductCard(productId);
    }

    handleAddToCartClick(button) {
        const productId = button.dataset.productId;
        if (button.classList.contains('disabled') || button.classList.contains('loading')) return;

        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        let variantId = null;

        if (product.hasOptions && product.variants && product.variants.length > 0) {
            const matchedVariant = this.findMatchingVariant(product);
            if (!matchedVariant) return;
            variantId = matchedVariant.id;
        }

        this.dispatchEvent(new CustomEvent('add-to-cart', {
            bubbles: true,
            composed: true,
            detail: {
                productId: productId,
                variantId: variantId,
                quantity: 1
            }
        }));
    }

    handleCartStatus(status) {
        const { productId, status: cartStatus, message } = status;
        const card = this.querySelector(`[data-product-card="${productId}"]`);
        if (!card) return;

        const cartBtn = card.querySelector('.add-to-cart-button');
        if (!cartBtn) return;

        cartBtn.classList.remove('loading', 'success', 'error');

        if (cartStatus === 'loading') {
            cartBtn.classList.add('loading');
            cartBtn.textContent = 'Adding...';
        } else if (cartStatus === 'success') {
            cartBtn.classList.add('success');
            cartBtn.textContent = 'Added ✓';
        } else if (cartStatus === 'error') {
            cartBtn.classList.add('error');
            cartBtn.textContent = message || 'Error';
        } else {
            // idle - restore original text
            this.restoreCartButton(cartBtn, productId);
        }
    }

    restoreCartButton(cartBtn, productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        cartBtn.classList.remove('loading', 'success', 'error', 'disabled');

        if (product.hasOptions && product.variants && product.variants.length > 0) {
            const matchedVariant = this.findMatchingVariant(product);
            if (!matchedVariant) {
                cartBtn.classList.add('disabled');
                cartBtn.textContent = this.allOptionsSelected(product) ? 'Out of Stock' : 'Select Options';
            } else if (!matchedVariant.inStock) {
                cartBtn.classList.add('disabled');
                cartBtn.textContent = 'Out of Stock';
            } else {
                cartBtn.textContent = this.settings.cartButtonText;
            }
        } else {
            cartBtn.textContent = this.settings.cartButtonText;
        }
    }

    // ─────────────────────────────────────────
    // VARIANT MATCHING
    // ─────────────────────────────────────────

    findMatchingVariant(product) {
        if (!product.variants || product.variants.length === 0) return null;

        const selections = this.productSelections[product.id] || {};
        const optionNames = (product.options || []).map(o => o.name);

        // Check if all options are selected
        const allSelected = optionNames.every(name => selections[name] !== undefined);
        if (!allSelected) return null;

        // Find variant matching all selections
        return product.variants.find(variant => {
            return optionNames.every(name => variant.choices[name] === selections[name]);
        }) || null;
    }

    allOptionsSelected(product) {
        const selections = this.productSelections[product.id] || {};
        const optionNames = (product.options || []).map(o => o.name);
        return optionNames.every(name => selections[name] !== undefined);
    }

    // ─────────────────────────────────────────
    // UPDATE SINGLE PRODUCT CARD (after option selection)
    // ─────────────────────────────────────────

    updateProductCard(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const card = this.querySelector(`[data-product-card="${productId}"]`);
        if (!card) return;

        const selections = this.productSelections[productId] || {};

        // Update swatch active states
        card.querySelectorAll('.option-swatch').forEach(swatch => {
            const oName = swatch.dataset.optionName;
            const oVal = swatch.dataset.optionValue;
            if (selections[oName] === oVal) {
                swatch.classList.add('active');
            } else {
                swatch.classList.remove('active');
            }
        });

        // Update dropdown selected values
        card.querySelectorAll('.option-dropdown').forEach(dd => {
            const oName = dd.dataset.optionName;
            if (selections[oName]) {
                dd.value = selections[oName];
            }
        });

        // Find matching variant and update price/button/image
        const matchedVariant = this.findMatchingVariant(product);
        const priceEl = card.querySelector('.product-price');
        const comparePriceEl = card.querySelector('.product-compare-price');
        const cartBtn = card.querySelector('.add-to-cart-button');
        const imgEl = card.querySelector('.product-image');

        if (matchedVariant) {
            // Update price
            if (priceEl && matchedVariant.price) {
                priceEl.textContent = matchedVariant.price;
            }
            if (comparePriceEl) {
                if (matchedVariant.compareAtPrice) {
                    comparePriceEl.textContent = matchedVariant.compareAtPrice;
                    comparePriceEl.style.display = 'inline-block';
                } else {
                    comparePriceEl.style.display = 'none';
                }
            }

            // Update image if variant has one
            if (imgEl && matchedVariant.image) {
                imgEl.src = matchedVariant.image;
            }

            // Update cart button
            if (cartBtn) {
                cartBtn.classList.remove('disabled', 'loading', 'success', 'error');
                if (matchedVariant.inStock) {
                    cartBtn.textContent = this.settings.cartButtonText;
                } else {
                    cartBtn.classList.add('disabled');
                    cartBtn.textContent = 'Out of Stock';
                }
            }
        } else {
            // No matching variant - check if all options selected
            if (cartBtn) {
                cartBtn.classList.remove('loading', 'success', 'error');
                cartBtn.classList.add('disabled');
                cartBtn.textContent = this.allOptionsSelected(product) ? 'Unavailable' : 'Select Options';
            }
            // Reset price to product base price
            if (priceEl) {
                priceEl.textContent = product.price;
            }
            if (comparePriceEl) {
                if (product.compareAtPrice) {
                    comparePriceEl.textContent = product.compareAtPrice;
                    comparePriceEl.style.display = 'inline-block';
                } else {
                    comparePriceEl.style.display = 'none';
                }
            }
        }
    }

    // ─────────────────────────────────────────
    // CSS HELPERS
    // ─────────────────────────────────────────

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

    // ─────────────────────────────────────────
    // MAIN RENDER
    // ─────────────────────────────────────────

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
                    margin: auto 0 0 0;
                    padding-top: 16px;
                    border-top: 1px solid var(--border-color);
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 16px;
                }
                
                .product-price {
                    font-size: var(--price-size);
                    font-weight: 800;
                    color: var(--price-color);
                    display: inline-block;
                    transition: all 0.2s ease;
                }
                
                .product-compare-price {
                    font-size: calc(var(--price-size) * 0.65);
                    color: var(--compare-price-color);
                    text-decoration: line-through;
                    display: inline-block;
                }

                /* ─── PRODUCT OPTIONS ─── */

                .product-options {
                    margin-bottom: 16px;
                }

                .option-group {
                    margin-bottom: 12px;
                }

                .option-group:last-child {
                    margin-bottom: 0;
                }

                .option-label {
                    display: block;
                    font-size: 12px;
                    font-weight: 600;
                    color: var(--heading-color);
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .option-label .selected-value {
                    font-weight: 400;
                    color: var(--text-color);
                    text-transform: none;
                    letter-spacing: 0;
                }

                /* Color Swatches */
                .option-swatches {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .option-swatch {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    cursor: pointer;
                    border: 2px solid #e0e0e0;
                    position: relative;
                    transition: all 0.2s ease;
                    padding: 0;
                    outline: none;
                    background: none;
                }

                .option-swatch .swatch-inner {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    display: block;
                    border: 2px solid transparent;
                }

                .option-swatch:hover {
                    border-color: var(--primary-accent);
                    transform: scale(1.1);
                }

                .option-swatch.active {
                    border-color: var(--primary-accent);
                    box-shadow: 0 0 0 2px var(--primary-accent);
                }

                .option-swatch.out-of-stock {
                    opacity: 0.4;
                    cursor: not-allowed;
                }

                .option-swatch.out-of-stock::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: -2px;
                    right: -2px;
                    height: 2px;
                    background: #cc0000;
                    transform: rotate(-45deg);
                }

                /* Dropdown Options */
                .option-dropdown {
                    width: 100%;
                    padding: 10px 14px;
                    border: 2px solid var(--border-color);
                    border-radius: 8px;
                    font-size: 14px;
                    font-family: var(--font-family);
                    color: var(--heading-color);
                    background: #fff;
                    cursor: pointer;
                    transition: border-color 0.2s ease;
                    outline: none;
                    appearance: auto;
                }

                .option-dropdown:focus {
                    border-color: var(--primary-accent);
                }

                /* ─── BUTTONS SECTION ─── */

                .product-buttons {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                .product-button {
                    display: block;
                    width: 100%;
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
                    width: 100%;
                    padding: 14px 28px;
                    border-radius: 8px;
                    font-weight: 700;
                    font-size: 14px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-align: center;
                    border: none;
                    background: var(--cart-button-bg);
                    color: var(--cart-button-text);
                    font-family: var(--font-family);
                }

                .add-to-cart-button:hover:not(.disabled):not(.loading) {
                    background: var(--cart-button-hover-bg);
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
                }

                .add-to-cart-button.disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: none;
                }

                .add-to-cart-button.loading {
                    opacity: 0.7;
                    cursor: wait;
                }

                .add-to-cart-button.success {
                    background: #27ae60;
                    color: #ffffff;
                }

                .add-to-cart-button.error {
                    background: #e74c3c;
                    color: #ffffff;
                }
                
                /* ─── LOAD MORE ─── */

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
                    .option-swatch {
                        width: 28px;
                        height: 28px;
                    }
                }
            </style>
            
            <div class="gallery-container">
                <div class="products-grid"></div>
                <div class="load-more-container"></div>
            </div>
        `;
    }

    // ─────────────────────────────────────────
    // RENDER PRODUCTS
    // ─────────────────────────────────────────

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

        if (this.hasMore) {
            loadMoreContainer.innerHTML = `
                <button class="load-more-button">
                    ${this.settings.loadMoreText}
                </button>
            `;
        } else {
            loadMoreContainer.innerHTML = '';
        }

        this.updateStyles();

        // Restore selections for products that already have selections
        for (const productId of Object.keys(this.productSelections)) {
            this.updateProductCard(productId);
        }
    }

    renderProductCard(product) {
        const hasComparePrice = product.compareAtPrice && product.compareAtPrice !== product.price;
        const hasOptions = product.hasOptions && product.options && product.options.length > 0;
        const hasVariants = product.variants && product.variants.length > 0;

        // Determine initial cart button state
        let cartButtonText = this.settings.cartButtonText;
        let cartButtonClass = 'add-to-cart-button';

        if (hasOptions && hasVariants) {
            cartButtonText = 'Select Options';
            cartButtonClass += ' disabled';
        } else if (!product.inStock) {
            cartButtonText = 'Out of Stock';
            cartButtonClass += ' disabled';
        }

        return `
            <div class="product-card" data-product-card="${product.id}">
                ${product.ribbon ? `<div class="product-ribbon">${product.ribbon}</div>` : ''}
                
                <div class="product-image-container">
                    <img src="${product.imageUrl}" 
                         alt="${this.escapeHtml(product.name)}" 
                         class="product-image"
                         loading="lazy"
                         onerror="this.src='https://via.placeholder.com/400'">
                </div>
                
                <div class="product-content">
                    <h3 class="product-name">${this.escapeHtml(product.name)}</h3>
                    <p class="product-description">${this.escapeHtml(product.description || '')}</p>
                    
                    <div class="product-price-section">
                        <span class="product-price">${product.price}</span>
                        ${hasComparePrice ? `<span class="product-compare-price">${product.compareAtPrice}</span>` : '<span class="product-compare-price" style="display:none;"></span>'}
                    </div>

                    ${hasOptions ? this.renderOptions(product) : ''}
                    
                    <div class="product-buttons">
                        <button class="${cartButtonClass}" data-product-id="${product.id}">
                            ${cartButtonText}
                        </button>
                        <a href="${product.productUrl}" class="product-button">${this.settings.buttonText}</a>
                    </div>
                </div>
            </div>
        `;
    }

    // ─────────────────────────────────────────
    // RENDER OPTIONS
    // ─────────────────────────────────────────

    renderOptions(product) {
        if (!product.options || product.options.length === 0) return '';

        const optionsHTML = product.options.map(option => {
            if (option.type === 'color') {
                return this.renderColorOption(product.id, option);
            } else {
                return this.renderDropdownOption(product.id, option);
            }
        }).join('');

        return `<div class="product-options">${optionsHTML}</div>`;
    }

    renderColorOption(productId, option) {
        const selections = this.productSelections[productId] || {};
        const selectedValue = selections[option.name] || null;

        const swatchesHTML = option.choices.map(choice => {
            const isActive = selectedValue === choice.value ? 'active' : '';
            const isOutOfStock = !choice.inStock ? 'out-of-stock' : '';
            const title = choice.description || choice.value;

            return `
                <button class="option-swatch ${isActive} ${isOutOfStock}"
                    data-product-id="${productId}"
                    data-option-name="${this.escapeHtml(option.name)}"
                    data-option-value="${this.escapeHtml(choice.value)}"
                    title="${this.escapeHtml(title)}"
                    ${!choice.inStock ? '' : ''}>
                    <span class="swatch-inner" style="background-color: ${choice.color || '#ccc'};"></span>
                </button>
            `;
        }).join('');

        const selectedLabel = selectedValue ? `: ${selectedValue}` : '';

        return `
            <div class="option-group">
                <span class="option-label">${this.escapeHtml(option.name)}<span class="selected-value">${selectedLabel}</span></span>
                <div class="option-swatches">${swatchesHTML}</div>
            </div>
        `;
    }

    renderDropdownOption(productId, option) {
        const selections = this.productSelections[productId] || {};
        const selectedValue = selections[option.name] || '';

        const optionsHTML = option.choices.map(choice => {
            const label = choice.description || choice.value;
            const stockLabel = !choice.inStock ? ' (Out of Stock)' : '';
            const isSelected = selectedValue === choice.value ? 'selected' : '';

            return `<option value="${this.escapeHtml(choice.value)}" ${isSelected}>${this.escapeHtml(label)}${stockLabel}</option>`;
        }).join('');

        return `
            <div class="option-group">
                <span class="option-label">${this.escapeHtml(option.name)}</span>
                <select class="option-dropdown"
                    data-product-id="${productId}"
                    data-option-name="${this.escapeHtml(option.name)}">
                    <option value="">Select ${this.escapeHtml(option.name)}</option>
                    ${optionsHTML}
                </select>
            </div>
        `;
    }

    // ─────────────────────────────────────────
    // UTILITY
    // ─────────────────────────────────────────

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ─────────────────────────────────────────
    // STYLES
    // ─────────────────────────────────────────

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
        container.style.setProperty('--cart-button-bg', this.settings.cartButtonBgColor || '#2ecc71');
        container.style.setProperty('--cart-button-text', this.settings.cartButtonTextColor || '#ffffff');
        container.style.setProperty('--cart-button-hover-bg', this.settings.cartButtonHoverBgColor || '#27ae60');
    }
}

customElements.define('product-gallery', ProductGalleryElement);
