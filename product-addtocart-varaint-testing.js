class ProductGalleryElement extends HTMLElement {
    constructor() {
        super();
        this.products = [];
        this.hasMore = false;
        this.catalogVersion = 'V1_CATALOG';
        // Track selected options per product: { productId: { optionId: choiceId } }
        this.selectedOptions = {};
        // Track quantities per product
        this.quantities = {};
        // Track cart statuses
        this.cartStatuses = {};
        // Track loaded product details (with full variant info)
        this.productDetailsCache = {};

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
            addToCartText: 'Add to Cart',
            addToCartBgColor: '#2ecc71',
            addToCartTextColor: '#ffffff',
            addToCartHoverBgColor: '#27ae60',
            showAddToCart: true,
            swatchSize: 32,
            swatchBorderColor: '#ddd',
            swatchSelectedBorderColor: '#333',
            dropdownBgColor: '#ffffff',
            dropdownBorderColor: '#ddd',
            dropdownTextColor: '#333',
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

        if (this.pendingProductsData) {
            this.products = this.pendingProductsData.products || [];
            this.hasMore = this.pendingProductsData.hasMore || false;
            this.catalogVersion = this.pendingProductsData.version || 'V1_CATALOG';
            this.pendingProductsData = null;
            this.renderProducts();
        }
    }

    static get observedAttributes() {
        return ['products-data', 'settings', 'cart-status', 'product-details-data'];
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
                    this.catalogVersion = data.version || 'V1_CATALOG';
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

            } else if (name === 'product-details-data') {
                try {
                    const data = JSON.parse(newValue);
                    this.handleProductDetails(data);
                } catch (e) { /* Silent fail */ }
            }
        }
    }

    // ============================================================
    // CART STATUS HANDLER
    // ============================================================
    handleCartStatus(status) {
        const { productId, status: cartStatus, message } = status;
        this.cartStatuses[productId] = { status: cartStatus, message };

        const btn = this.querySelector(`#atc-btn-${productId}`);
        const msgEl = this.querySelector(`#atc-msg-${productId}`);

        if (btn) {
            if (cartStatus === 'loading') {
                btn.disabled = true;
                btn.textContent = 'Adding...';
                btn.style.opacity = '0.7';
            } else if (cartStatus === 'success') {
                btn.disabled = false;
                btn.textContent = '✓ Added!';
                btn.style.opacity = '1';
                btn.style.background = this.settings.addToCartBgColor;
                setTimeout(() => {
                    btn.textContent = this.settings.addToCartText;
                }, 2500);
            } else if (cartStatus === 'error') {
                btn.disabled = false;
                btn.textContent = this.settings.addToCartText;
                btn.style.opacity = '1';
            } else {
                btn.disabled = false;
                btn.textContent = this.settings.addToCartText;
                btn.style.opacity = '1';
            }
        }

        if (msgEl) {
            if (cartStatus === 'success') {
                msgEl.textContent = message;
                msgEl.style.color = '#27ae60';
                msgEl.style.display = 'block';
            } else if (cartStatus === 'error') {
                msgEl.textContent = message;
                msgEl.style.color = '#e74c3c';
                msgEl.style.display = 'block';
            } else {
                msgEl.textContent = '';
                msgEl.style.display = 'none';
            }
        }
    }

    // ============================================================
    // PRODUCT DETAILS HANDLER (for full variant data)
    // ============================================================
    handleProductDetails(data) {
        if (data.status === 'loaded' && data.product) {
            this.productDetailsCache[data.productId] = data.product;
            // Update options display if product card exists
            this.updateProductCardOptions(data.productId, data.product);
        }
    }

    updateProductCardOptions(productId, product) {
        // If detailed options available, re-render the options section
        const optionsContainer = this.querySelector(`#options-${productId}`);
        if (optionsContainer && product.options && product.options.length > 0) {
            optionsContainer.innerHTML = this.renderOptionSelectors(productId, product.options);
            this.attachOptionListeners(productId, product);
        }
    }

    // ============================================================
    // FIND MATCHING VARIANT
    // ============================================================
    findMatchingVariant(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return null;

        const selected = this.selectedOptions[productId];
        if (!selected) return null;

        const variants = product.variants || [];
        if (variants.length === 0) return null;

        if (this.catalogVersion === 'V3_CATALOG') {
            // V3: Match optionId -> choiceId pairs
            return variants.find(variant => {
                if (!variant.choices) return false;
                const choiceEntries = Object.entries(variant.choices);
                return choiceEntries.every(([optionId, choiceId]) => {
                    return selected[optionId] === choiceId;
                }) && choiceEntries.length === Object.keys(selected).length;
            });
        } else {
            // V1: Match optionName -> choiceValue pairs
            return variants.find(variant => {
                if (!variant.choices) return false;
                const choiceEntries = Object.entries(variant.choices);
                return choiceEntries.every(([optionName, choiceValue]) => {
                    return selected[optionName] === choiceValue;
                }) && choiceEntries.length === Object.keys(selected).length;
            });
        }
    }

    // ============================================================
    // DISPATCH ADD TO CART
    // ============================================================
    handleAddToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const quantity = this.quantities[productId] || 1;
        const selected = this.selectedOptions[productId] || {};
        const hasOptions = product.options && product.options.length > 0;

        // Validate all options are selected
        if (hasOptions) {
            const allSelected = product.options.every(opt => selected[opt.id] !== undefined);
            if (!allSelected) {
                const msgEl = this.querySelector(`#atc-msg-${productId}`);
                if (msgEl) {
                    msgEl.textContent = 'Please select all options';
                    msgEl.style.color = '#e74c3c';
                    msgEl.style.display = 'block';
                    setTimeout(() => {
                        msgEl.style.display = 'none';
                    }, 3000);
                }
                return;
            }
        }

        // Find the matching variant
        let variantId = null;
        let selectedOptionsForCart = {};

        if (hasOptions) {
            const matchedVariant = this.findMatchingVariant(productId);
            if (matchedVariant) {
                variantId = matchedVariant.id;

                // Check stock
                if (matchedVariant.inStock === false) {
                    const msgEl = this.querySelector(`#atc-msg-${productId}`);
                    if (msgEl) {
                        msgEl.textContent = 'Selected variant is out of stock';
                        msgEl.style.color = '#e74c3c';
                        msgEl.style.display = 'block';
                        setTimeout(() => { msgEl.style.display = 'none'; }, 3000);
                    }
                    return;
                }
            } else {
                // If no variant matched, pass options as selections
                // This handles non-managed variants in V1
                if (this.catalogVersion === 'V1_CATALOG') {
                    selectedOptionsForCart = { ...selected };
                }
            }
        } else {
            // Simple product with no options
            // For V3, we still need the default variant
            if (product.variants && product.variants.length > 0) {
                variantId = product.variants[0].id;
            }
        }

        this.dispatchEvent(new CustomEvent('add-to-cart', {
            bubbles: true,
            composed: true,
            detail: {
                productId: productId,
                variantId: variantId,
                quantity: quantity,
                selectedOptions: selectedOptionsForCart
            }
        }));
    }

    // ============================================================
    // RENDER METHODS
    // ============================================================
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

    // Determine if option should render as color swatch
    isColorOption(optionName) {
        const colorKeywords = ['color', 'colour', 'colors', 'colours', 'shade', 'tint'];
        return colorKeywords.some(kw => optionName.toLowerCase().includes(kw));
    }

    // Basic color name to hex mapping
    getColorHex(colorName) {
        const colors = {
            'red': '#e74c3c', 'blue': '#3498db', 'green': '#2ecc71', 'yellow': '#f1c40f',
            'black': '#2c3e50', 'white': '#ffffff', 'grey': '#95a5a6', 'gray': '#95a5a6',
            'pink': '#e91e63', 'purple': '#9b59b6', 'orange': '#e67e22', 'brown': '#795548',
            'navy': '#34495e', 'teal': '#1abc9c', 'maroon': '#c0392b', 'gold': '#f39c12',
            'silver': '#bdc3c7', 'beige': '#f5f5dc', 'ivory': '#fffff0', 'coral': '#ff7f50',
            'salmon': '#fa8072', 'khaki': '#f0e68c', 'lavender': '#e6e6fa', 'cyan': '#00bcd4',
            'magenta': '#e91e63', 'turquoise': '#1abc9c', 'indigo': '#3f51b5',
            'olive': '#808000', 'lime': '#cddc39', 'aqua': '#00bcd4', 'tan': '#d2b48c',
            'crimson': '#dc143c', 'charcoal': '#36454f', 'burgundy': '#800020',
            'mint': '#98ff98', 'peach': '#ffdab9', 'plum': '#dda0dd',
            'rose': '#ff007f', 'sky blue': '#87ceeb', 'light blue': '#add8e6',
            'dark blue': '#00008b', 'dark green': '#006400', 'dark red': '#8b0000'
        };
        return colors[colorName.toLowerCase()] || null;
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

                /* ===== OPTION SELECTORS ===== */
                .product-options-section {
                    margin: 0 0 12px 0;
                    padding: 0;
                }

                .option-group {
                    margin-bottom: 10px;
                }

                .option-label {
                    font-size: 12px;
                    font-weight: 600;
                    color: var(--heading-color);
                    margin-bottom: 6px;
                    display: block;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                /* Color Swatches */
                .swatch-container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                }

                .color-swatch {
                    width: var(--swatch-size);
                    height: var(--swatch-size);
                    border-radius: 50%;
                    border: 2px solid var(--swatch-border);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    position: relative;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0;
                    background: none;
                    outline: none;
                }

                .color-swatch:hover {
                    transform: scale(1.15);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                }

                .color-swatch.selected {
                    border-color: var(--swatch-selected-border);
                    box-shadow: 0 0 0 2px var(--swatch-selected-border);
                    transform: scale(1.1);
                }

                .color-swatch .swatch-inner {
                    width: calc(var(--swatch-size) - 8px);
                    height: calc(var(--swatch-size) - 8px);
                    border-radius: 50%;
                    display: block;
                }

                .color-swatch .swatch-text {
                    font-size: 9px;
                    font-weight: 700;
                    color: #fff;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                    text-transform: uppercase;
                    letter-spacing: 0;
                    position: absolute;
                    width: 100%;
                    text-align: center;
                }

                .color-swatch[title]:hover::after {
                    content: attr(title);
                    position: absolute;
                    bottom: calc(100% + 6px);
                    left: 50%;
                    transform: translateX(-50%);
                    background: #333;
                    color: #fff;
                    padding: 3px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    white-space: nowrap;
                    z-index: 100;
                    pointer-events: none;
                }

                /* Dropdown Selector */
                .variant-dropdown {
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid var(--dropdown-border);
                    border-radius: 6px;
                    background: var(--dropdown-bg);
                    color: var(--dropdown-text);
                    font-size: 13px;
                    font-family: var(--font-family);
                    cursor: pointer;
                    appearance: none;
                    -webkit-appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 10px center;
                    padding-right: 30px;
                    transition: border-color 0.2s ease;
                }

                .variant-dropdown:hover,
                .variant-dropdown:focus {
                    border-color: var(--swatch-selected-border);
                    outline: none;
                }

                /* Quantity Selector */
                .quantity-section {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 12px;
                }

                .quantity-label {
                    font-size: 12px;
                    font-weight: 600;
                    color: var(--heading-color);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .quantity-controls {
                    display: flex;
                    align-items: center;
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    overflow: hidden;
                }

                .qty-btn {
                    width: 32px;
                    height: 32px;
                    border: none;
                    background: var(--card-bg);
                    color: var(--heading-color);
                    font-size: 16px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.2s ease;
                    padding: 0;
                    line-height: 1;
                }

                .qty-btn:hover {
                    background: #f0f0f0;
                }

                .qty-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }

                .qty-value {
                    width: 36px;
                    text-align: center;
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--heading-color);
                    border-left: 1px solid var(--border-color);
                    border-right: 1px solid var(--border-color);
                    height: 32px;
                    line-height: 32px;
                    font-family: var(--font-family);
                }

                /* ===== PRICE & BUTTONS ===== */
                .product-price-section {
                    margin: auto 0 12px 0;
                    padding-top: 12px;
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
                    border: none;
                    border-radius: 8px;
                    font-weight: 700;
                    font-size: 14px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-align: center;
                    background: var(--atc-bg);
                    color: var(--atc-text);
                    font-family: var(--font-family);
                }

                .add-to-cart-button:hover {
                    background: var(--atc-hover-bg);
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
                }

                .add-to-cart-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: none;
                }

                .cart-message {
                    font-size: 12px;
                    text-align: center;
                    margin-top: 4px;
                    min-height: 16px;
                    display: none;
                    font-family: var(--font-family);
                }

                .out-of-stock-badge {
                    display: inline-block;
                    padding: 4px 10px;
                    background: #e74c3c;
                    color: #fff;
                    font-size: 11px;
                    font-weight: 700;
                    border-radius: 4px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                /* ===== LOAD MORE ===== */
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

                    .swatch-container { gap: 4px; }
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

        // Load More button
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

        // Attach event listeners for option selectors and add-to-cart
        this.products.forEach(product => {
            this.attachOptionListeners(product.id, product);
            this.attachCartListeners(product.id);
            this.attachQuantityListeners(product.id);
        });

        this.updateStyles();
    }

    // ============================================================
    // RENDER PRODUCT CARD
    // ============================================================
    renderProductCard(product) {
        const hasComparePrice = product.compareAtPrice && product.compareAtPrice !== product.price;
        const hasOptions = product.options && product.options.length > 0;
        const showAddToCart = this.settings.showAddToCart;

        // Initialize quantity
        if (!this.quantities[product.id]) {
            this.quantities[product.id] = 1;
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

                    ${hasOptions ? `
                        <div class="product-options-section" id="options-${product.id}">
                            ${this.renderOptionSelectors(product.id, product.options)}
                        </div>
                    ` : ''}

                    <div class="product-price-section">
                        <span class="product-price">${product.price}</span>
                        ${hasComparePrice ? `<span class="product-compare-price">${product.compareAtPrice}</span>` : ''}
                    </div>

                    ${showAddToCart ? `
                        <div class="quantity-section">
                            <span class="quantity-label">Qty</span>
                            <div class="quantity-controls">
                                <button class="qty-btn qty-minus" data-product-id="${product.id}" ${this.quantities[product.id] <= 1 ? 'disabled' : ''}>−</button>
                                <span class="qty-value" id="qty-${product.id}">${this.quantities[product.id]}</span>
                                <button class="qty-btn qty-plus" data-product-id="${product.id}">+</button>
                            </div>
                        </div>
                    ` : ''}

                    <div class="product-buttons">
                        <a href="${product.productUrl}" class="product-button">${this.settings.buttonText}</a>

                        ${showAddToCart ? `
                            <button class="add-to-cart-button" id="atc-btn-${product.id}" data-product-id="${product.id}"
                                ${!product.inStock ? 'disabled' : ''}>
                                ${!product.inStock ? 'Out of Stock' : this.settings.addToCartText}
                            </button>
                            <div class="cart-message" id="atc-msg-${product.id}"></div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // ============================================================
    // RENDER OPTION SELECTORS
    // ============================================================
    renderOptionSelectors(productId, options) {
        if (!options || options.length === 0) return '';

        return options.map(option => {
            const isColor = this.isColorOption(option.name);
            const selected = this.selectedOptions[productId]?.[option.id];

            if (isColor) {
                return this.renderColorSwatches(productId, option, selected);
            } else {
                return this.renderDropdown(productId, option, selected);
            }
        }).join('');
    }

    renderColorSwatches(productId, option, selectedChoiceId) {
        const swatches = option.choices.map(choice => {
            const colorHex = this.getColorHex(choice.value);
            const isSelected = selectedChoiceId === choice.id;

            if (colorHex) {
                return `
                    <button class="color-swatch ${isSelected ? 'selected' : ''}"
                            data-product-id="${productId}"
                            data-option-id="${option.id}"
                            data-choice-id="${choice.id}"
                            data-choice-value="${choice.value}"
                            title="${choice.value}">
                        <span class="swatch-inner" style="background-color: ${colorHex};"></span>
                    </button>
                `;
            } else {
                // Fallback: show text-based swatch with random pastel background
                const hue = this.hashString(choice.value) % 360;
                return `
                    <button class="color-swatch ${isSelected ? 'selected' : ''}"
                            data-product-id="${productId}"
                            data-option-id="${option.id}"
                            data-choice-id="${choice.id}"
                            data-choice-value="${choice.value}"
                            title="${choice.value}">
                        <span class="swatch-inner" style="background-color: hsl(${hue}, 60%, 70%);"></span>
                        <span class="swatch-text">${choice.value.substring(0, 2)}</span>
                    </button>
                `;
            }
        }).join('');

        return `
            <div class="option-group">
                <label class="option-label">${option.name}${selectedChoiceId ? `: <span style="font-weight:400;text-transform:none;">${option.choices.find(c => c.id === selectedChoiceId)?.value || ''}</span>` : ''}</label>
                <div class="swatch-container">
                    ${swatches}
                </div>
            </div>
        `;
    }

    renderDropdown(productId, option, selectedChoiceId) {
        const optionsList = option.choices.map(choice => {
            return `<option value="${choice.id}" ${selectedChoiceId === choice.id ? 'selected' : ''}>${choice.value}</option>`;
        }).join('');

        return `
            <div class="option-group">
                <label class="option-label">${option.name}</label>
                <select class="variant-dropdown"
                        data-product-id="${productId}"
                        data-option-id="${option.id}">
                    <option value="">Select ${option.name}</option>
                    ${optionsList}
                </select>
            </div>
        `;
    }

    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    // ============================================================
    // EVENT LISTENERS
    // ============================================================
    attachOptionListeners(productId, product) {
        // Color swatch clicks
        const swatches = this.querySelectorAll(`.color-swatch[data-product-id="${productId}"]`);
        swatches.forEach(swatch => {
            swatch.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const optionId = swatch.dataset.optionId;
                const choiceId = swatch.dataset.choiceId;
                const choiceValue = swatch.dataset.choiceValue;

                if (!this.selectedOptions[productId]) {
                    this.selectedOptions[productId] = {};
                }
                this.selectedOptions[productId][optionId] = choiceId;

                // Update swatch UI
                const siblingSwatches = this.querySelectorAll(`.color-swatch[data-product-id="${productId}"][data-option-id="${optionId}"]`);
                siblingSwatches.forEach(s => s.classList.remove('selected'));
                swatch.classList.add('selected');

                // Update label
                const optionGroup = swatch.closest('.option-group');
                if (optionGroup) {
                    const label = optionGroup.querySelector('.option-label');
                    const opt = product.options?.find(o => o.id === optionId);
                    if (label && opt) {
                        label.innerHTML = `${opt.name}: <span style="font-weight:400;text-transform:none;">${choiceValue}</span>`;
                    }
                }

                this.onOptionChanged(productId);
            });
        });

        // Dropdown changes
        const dropdowns = this.querySelectorAll(`.variant-dropdown[data-product-id="${productId}"]`);
        dropdowns.forEach(dropdown => {
            dropdown.addEventListener('change', (e) => {
                const optionId = dropdown.dataset.optionId;
                const choiceId = dropdown.value;

                if (!this.selectedOptions[productId]) {
                    this.selectedOptions[productId] = {};
                }

                if (choiceId) {
                    this.selectedOptions[productId][optionId] = choiceId;
                } else {
                    delete this.selectedOptions[productId][optionId];
                }

                this.onOptionChanged(productId);
            });
        });
    }

    attachCartListeners(productId) {
        const atcBtn = this.querySelector(`#atc-btn-${productId}`);
        if (atcBtn) {
            atcBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleAddToCart(productId);
            });
        }
    }

    attachQuantityListeners(productId) {
        const minusBtn = this.querySelector(`.qty-minus[data-product-id="${productId}"]`);
        const plusBtn = this.querySelector(`.qty-plus[data-product-id="${productId}"]`);
        const qtyDisplay = this.querySelector(`#qty-${productId}`);

        if (minusBtn) {
            minusBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const currentQty = this.quantities[productId] || 1;
                if (currentQty > 1) {
                    this.quantities[productId] = currentQty - 1;
                    if (qtyDisplay) qtyDisplay.textContent = this.quantities[productId];
                    minusBtn.disabled = this.quantities[productId] <= 1;
                }
            });
        }

        if (plusBtn) {
            plusBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const currentQty = this.quantities[productId] || 1;
                this.quantities[productId] = currentQty + 1;
                if (qtyDisplay) qtyDisplay.textContent = this.quantities[productId];
                if (minusBtn) minusBtn.disabled = false;
            });
        }
    }

    // Called when any option changes
    onOptionChanged(productId) {
        // Check if variant is in stock
        const matchedVariant = this.findMatchingVariant(productId);
        const atcBtn = this.querySelector(`#atc-btn-${productId}`);

        if (matchedVariant) {
            if (atcBtn) {
                if (matchedVariant.inStock === false) {
                    atcBtn.disabled = true;
                    atcBtn.textContent = 'Out of Stock';
                } else {
                    atcBtn.disabled = false;
                    atcBtn.textContent = this.settings.addToCartText;
                }
            }
        } else {
            // No variant matched yet (not all options selected) - keep button active
            if (atcBtn) {
                atcBtn.disabled = false;
                atcBtn.textContent = this.settings.addToCartText;
            }
        }

        // Clear any previous cart messages
        const msgEl = this.querySelector(`#atc-msg-${productId}`);
        if (msgEl) {
            msgEl.style.display = 'none';
        }
    }

    // ============================================================
    // UPDATE STYLES
    // ============================================================
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

        // Add to Cart vars
        container.style.setProperty('--atc-bg', this.settings.addToCartBgColor);
        container.style.setProperty('--atc-text', this.settings.addToCartTextColor);
        container.style.setProperty('--atc-hover-bg', this.settings.addToCartHoverBgColor);

        // Swatch & Dropdown vars
        container.style.setProperty('--swatch-size', `${this.settings.swatchSize}px`);
        container.style.setProperty('--swatch-border', this.settings.swatchBorderColor);
        container.style.setProperty('--swatch-selected-border', this.settings.swatchSelectedBorderColor);
        container.style.setProperty('--dropdown-bg', this.settings.dropdownBgColor);
        container.style.setProperty('--dropdown-border', this.settings.dropdownBorderColor);
        container.style.setProperty('--dropdown-text', this.settings.dropdownTextColor);
    }
}

customElements.define('product-gallery', ProductGalleryElement);
