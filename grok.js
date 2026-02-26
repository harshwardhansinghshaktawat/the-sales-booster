class ProductGalleryElement extends HTMLElement {
    constructor() {
        super();
        this.products = [];
        this.hasMore = false;
        
        // Per-product state
        this.productSelections = {};      // { productId: { Color: 'Red', Size: 'M' } }
        this.productOptionsData = {};     // { productId: { options, variants, manageVariants } }
        this.variantsRequested = new Set(); // Track which products we've requested variants for
        this.cartButtonStates = {};       // { productId: 'idle'|'loading'|'success'|'error' }
        
        // Settings with defaults
        this.settings = this.getDefaultSettings();
        
        this.isRendered = false;
        this.pendingProductsData = null;
    }

    getDefaultSettings() {
        return {
            // Card Design
            cardBgColor: '#ffffff',
            cardHoverBgColor: '#f8f9fa',
            
            // Typography
            headingColor: '#1a1a1a',
            textColor: '#666666',
            fontFamily: 'Arial, sans-serif',
            headingSize: 18,
            textSize: 14,
            
            // Price Styling
            priceColor: '#2c3e50',
            comparePriceColor: '#999999',
            priceSize: 24,
            
            // Accents
            primaryAccent: '#3498db',
            secondaryAccent: '#2ecc71',
            ribbonBgColor: '#e74c3c',
            ribbonTextColor: '#ffffff',
            
            // Borders & Spacing
            borderColor: '#e0e0e0',
            borderWidth: 1,
            cornerRadius: 12,
            cardPadding: 20,
            cardGap: 24,
            
            // View Product Button
            buttonText: 'View Product',
            buttonBgColor: '#3498db',
            buttonTextColor: '#ffffff',
            buttonHoverBgColor: '#2980b9',
            buttonStyle: 'filled',
            buttonSize: 'medium',
            
            // Add to Cart Button
            cartButtonText: 'Add to Cart',
            cartButtonBgColor: '#2ecc71',
            cartButtonTextColor: '#ffffff',
            cartButtonHoverBgColor: '#27ae60',
            
            // Image
            imageHeight: 280,
            imageZoom: true,
            imageBorderRadius: 8,
            
            // Shadow & Effects
            cardShadow: 'medium',
            hoverEffect: 'lift',
            
            // Layout
            columnsDesktop: 3,
            columnsTablet: 2,
            columnsMobile: 1,
            
            // Load More
            loadMoreText: 'Load More Products',
            loadMoreBgColor: '#ffffff',
            loadMoreTextColor: '#3498db',
            loadMoreBorderColor: '#3498db'
        };
    }

    connectedCallback() {
        this.render();
        this.isRendered = true;
        
        // Delegated event listeners
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
        return ['products-data', 'settings', 'variant-data', 'cart-status'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!newValue || newValue === oldValue) return;

        try {
            if (name === 'products-data') {
                const data = JSON.parse(newValue);
                if (!this.isRendered) {
                    this.pendingProductsData = data;
                    return;
                }
                this.products = data.products || [];
                this.hasMore = data.hasMore || false;
                this.renderProducts();
            } 
            else if (name === 'settings') {
                const newSettings = JSON.parse(newValue);
                Object.assign(this.settings, newSettings);
                if (this.isRendered) {
                    this.updateStyles();
                }
            } 
            else if (name === 'variant-data') {
                const variantData = JSON.parse(newValue);
                this.handleVariantData(variantData);
            } 
            else if (name === 'cart-status') {
                const status = JSON.parse(newValue);
                this.handleCartStatus(status);
            }
        } catch (e) {
            console.error('Attribute change error:', e);
        }
    }

    // ═══════════════════════════════════════════
    // VARIANT DATA HANDLING
    // ═══════════════════════════════════════════

    handleVariantData(data) {
        const productId = data.productId;
        if (!productId) return;

        console.log('📦 Received variant data for:', productId, data);

        // Store the options/variants data
        this.productOptionsData[productId] = {
            hasOptions: data.hasOptions,
            options: data.options || [],
            variants: data.variants || [],
            manageVariants: data.manageVariants || false
        };

        // Initialize selections if not exists
        if (!this.productSelections[productId]) {
            this.productSelections[productId] = {};
        }

        // Render the options section
        this.renderProductOptions(productId);
    }

    renderProductOptions(productId) {
        const card = this.querySelector(`[data-product-id="${productId}"]`);
        if (!card) return;

        const optionsContainer = card.querySelector('.product-options');
        if (!optionsContainer) return;

        const data = this.productOptionsData[productId];
        
        // If no options or not loaded yet
        if (!data || !data.hasOptions || !data.options || data.options.length === 0) {
            optionsContainer.innerHTML = '';
            this.updateCartButton(productId);
            return;
        }

        console.log('🎨 Rendering options for:', productId, data.options);

        // Build options HTML
        let html = '<div class="options-wrapper">';
        
        for (const option of data.options) {
            if (option.type === 'color') {
                html += this.buildColorOption(productId, option);
            } else {
                html += this.buildDropdownOption(productId, option);
            }
        }
        
        html += '</div>';
        optionsContainer.innerHTML = html;

        // Update cart button state
        this.updateCartButton(productId);
    }

    buildColorOption(productId, option) {
        const selections = this.productSelections[productId] || {};
        const selectedValue = selections[option.name] || null;

        let swatchesHTML = '';
        for (const choice of option.choices) {
            const isActive = selectedValue === choice.value;
            const isOOS = !choice.inStock;
            const color = choice.color || '#cccccc';
            
            swatchesHTML += `
                <button 
                    class="option-swatch ${isActive ? 'active' : ''} ${isOOS ? 'out-of-stock' : ''}"
                    data-product-id="${productId}"
                    data-option-name="${this.escapeAttr(option.name)}"
                    data-option-value="${this.escapeAttr(choice.value)}"
                    title="${this.escapeAttr(choice.description || choice.value)}"
                    ${isOOS ? 'disabled' : ''}
                >
                    <span class="swatch-inner" style="background-color: ${color};"></span>
                    ${isActive ? '<span class="check-mark">✓</span>' : ''}
                </button>
            `;
        }

        const selectedLabel = selectedValue ? `: ${selectedValue}` : '';

        return `
            <div class="option-group">
                <label class="option-label">
                    ${this.escapeHtml(option.name)}
                    <span class="selected-value">${selectedLabel}</span>
                </label>
                <div class="option-swatches">${swatchesHTML}</div>
            </div>
        `;
    }

    buildDropdownOption(productId, option) {
        const selections = this.productSelections[productId] || {};
        const selectedValue = selections[option.name] || '';

        let optionsHTML = `<option value="">Select ${this.escapeHtml(option.name)}</option>`;
        
        for (const choice of option.choices) {
            const label = this.escapeHtml(choice.description || choice.value);
            const stockLabel = !choice.inStock ? ' (Out of Stock)' : '';
            const isSelected = selectedValue === choice.value;
            const isDisabled = !choice.inStock;
            
            optionsHTML += `
                <option 
                    value="${this.escapeAttr(choice.value)}"
                    ${isSelected ? 'selected' : ''}
                    ${isDisabled ? 'disabled' : ''}
                >
                    ${label}${stockLabel}
                </option>
            `;
        }

        return `
            <div class="option-group">
                <label class="option-label">${this.escapeHtml(option.name)}</label>
                <select 
                    class="option-dropdown"
                    data-product-id="${productId}"
                    data-option-name="${this.escapeAttr(option.name)}"
                >
                    ${optionsHTML}
                </select>
            </div>
        `;
    }

    // ═══════════════════════════════════════════
    // EVENT HANDLING
    // ═══════════════════════════════════════════

    handleClick(e) {
        // Color swatch selection
        const swatch = e.target.closest('.option-swatch');
        if (swatch && !swatch.disabled) {
            this.handleSwatchClick(swatch);
            return;
        }

        // Add to Cart button
        const cartBtn = e.target.closest('.add-to-cart-button');
        if (cartBtn && !cartBtn.classList.contains('disabled')) {
            this.handleAddToCartClick(cartBtn);
            return;
        }

        // Load More button
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

        console.log('🎨 Swatch clicked:', { productId, optionName, optionValue });

        if (!this.productSelections[productId]) {
            this.productSelections[productId] = {};
        }

        // Toggle selection
        if (this.productSelections[productId][optionName] === optionValue) {
            delete this.productSelections[productId][optionName];
        } else {
            this.productSelections[productId][optionName] = optionValue;
        }

        console.log('📝 Updated selections:', this.productSelections[productId]);

        this.updateProductCardState(productId);
    }

    handleDropdownChange(dropdown) {
        const productId = dropdown.dataset.productId;
        const optionName = dropdown.dataset.optionName;
        const optionValue = dropdown.value;

        console.log('📋 Dropdown changed:', { productId, optionName, optionValue });

        if (!this.productSelections[productId]) {
            this.productSelections[productId] = {};
        }

        if (optionValue === '') {
            delete this.productSelections[productId][optionName];
        } else {
            this.productSelections[productId][optionName] = optionValue;
        }

        console.log('📝 Updated selections:', this.productSelections[productId]);

        this.updateProductCardState(productId);
    }

    handleAddToCartClick(button) {
        if (button.classList.contains('disabled') || 
            button.classList.contains('loading')) {
            return;
        }

        const productId = button.dataset.productId;
        const product = this.findProduct(productId);
        if (!product) return;

        console.log('🛒 Add to cart clicked for:', productId);

        const optionsData = this.productOptionsData[productId];
        const selections = this.productSelections[productId] || {};

        let variantId = null;
        let selectedChoices = {};
        let manageVariants = false;

        if (optionsData && optionsData.hasOptions) {
            manageVariants = optionsData.manageVariants;
            selectedChoices = { ...selections };

            // Find matching variant
            const matchedVariant = this.findMatchingVariant(productId);
            if (matchedVariant) {
                variantId = matchedVariant.id;
                console.log('✅ Found matching variant:', variantId, matchedVariant.choices);
            } else {
                console.warn('⚠️ No matching variant found for selections:', selections);
            }
        }

        console.log('📦 Dispatching add-to-cart event:', {
            productId,
            variantId,
            selectedChoices,
            manageVariants
        });

        this.dispatchEvent(new CustomEvent('add-to-cart', {
            bubbles: true,
            composed: true,
            detail: {
                productId: productId,
                variantId: variantId,
                quantity: 1,
                selectedChoices: selectedChoices,
                manageVariants: manageVariants
            }
        }));
    }

    // ═══════════════════════════════════════════
    // VARIANT MATCHING
    // ═══════════════════════════════════════════

    findMatchingVariant(productId) {
        const optionsData = this.productOptionsData[productId];
        if (!optionsData || !optionsData.variants || optionsData.variants.length === 0) {
            return null;
        }

        const selections = this.productSelections[productId] || {};
        const optionNames = optionsData.options.map(o => o.name);

        // Check all options are selected
        const allSelected = optionNames.every(name => selections[name] !== undefined);
        if (!allSelected) {
            console.log('⚠️ Not all options selected:', { optionNames, selections });
            return null;
        }

        // Find exact match
        const match = optionsData.variants.find(variant => {
            return optionNames.every(name => {
                const match = variant.choices[name] === selections[name];
                if (!match) {
                    console.log(`❌ Variant ${variant.id} doesn't match ${name}: ${variant.choices[name]} !== ${selections[name]}`);
                }
                return match;
            });
        });

        if (match) {
            console.log('✅ Matched variant:', match.id, match.choices);
        } else {
            console.log('❌ No variant matches selections:', selections);
            console.log('Available variants:', optionsData.variants.map(v => ({
                id: v.id,
                choices: v.choices
            })));
        }

        return match || null;
    }

    allOptionsSelected(productId) {
        const optionsData = this.productOptionsData[productId];
        if (!optionsData || !optionsData.options) return true;

        const selections = this.productSelections[productId] || {};
        return optionsData.options.every(opt => selections[opt.name] !== undefined);
    }

    // ═══════════════════════════════════════════
    // UPDATE CARD STATE
    // ═══════════════════════════════════════════

    updateProductCardState(productId) {
        const card = this.querySelector(`[data-product-id="${productId}"]`);
        if (!card) return;

        const selections = this.productSelections[productId] || {};

        // Update swatch active states
        const swatches = card.querySelectorAll('.option-swatch');
        swatches.forEach(swatch => {
            const optName = swatch.dataset.optionName;
            const optVal = swatch.dataset.optionValue;
            
            if (selections[optName] === optVal) {
                swatch.classList.add('active');
                // Add check mark
                if (!swatch.querySelector('.check-mark')) {
                    const check = document.createElement('span');
                    check.className = 'check-mark';
                    check.textContent = '✓';
                    swatch.appendChild(check);
                }
            } else {
                swatch.classList.remove('active');
                const check = swatch.querySelector('.check-mark');
                if (check) check.remove();
            }
        });

        // Update selected value labels
        const optionsData = this.productOptionsData[productId];
        if (optionsData && optionsData.options) {
            optionsData.options.forEach(option => {
                const labelEl = card.querySelector(`.option-label`);
                if (labelEl) {
                    const selectedValueEl = labelEl.querySelector('.selected-value');
                    if (selectedValueEl && selections[option.name]) {
                        selectedValueEl.textContent = `: ${selections[option.name]}`;
                    } else if (selectedValueEl) {
                        selectedValueEl.textContent = '';
                    }
                }
            });
        }

        // Find matching variant and update price/image
        const matchedVariant = this.findMatchingVariant(productId);
        const product = this.findProduct(productId);
        
        const priceEl = card.querySelector('.product-price');
        const comparePriceEl = card.querySelector('.product-compare-price');
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
        } else if (product) {
            // Reset to base product price
            if (priceEl) priceEl.textContent = product.price;
            if (comparePriceEl) {
                if (product.compareAtPrice) {
                    comparePriceEl.textContent = product.compareAtPrice;
                    comparePriceEl.style.display = 'inline-block';
                } else {
                    comparePriceEl.style.display = 'none';
                }
            }
        }

        // Update cart button
        this.updateCartButton(productId);
    }

    updateCartButton(productId) {
        const card = this.querySelector(`[data-product-id="${productId}"]`);
        if (!card) return;

        const cartBtn = card.querySelector('.add-to-cart-button');
        if (!cartBtn) return;

        const product = this.findProduct(productId);
        const optionsData = this.productOptionsData[productId];

        // Remove all state classes
        cartBtn.classList.remove('disabled', 'loading', 'success', 'error');

        // Product without options
        if (!optionsData || !optionsData.hasOptions || !optionsData.options || optionsData.options.length === 0) {
            if (product && !product.inStock) {
                cartBtn.classList.add('disabled');
                cartBtn.textContent = 'Out of Stock';
            } else {
                cartBtn.textContent = this.settings.cartButtonText;
            }
            return;
        }

        // Product with options - check if all selected
        if (!this.allOptionsSelected(productId)) {
            cartBtn.classList.add('disabled');
            cartBtn.textContent = 'Select Options';
            return;
        }

        // All options selected - check if variant exists
        const matchedVariant = this.findMatchingVariant(productId);
        if (!matchedVariant) {
            cartBtn.classList.add('disabled');
            cartBtn.textContent = 'Unavailable';
            return;
        }

        // Variant exists - check stock
        if (!matchedVariant.inStock) {
            cartBtn.classList.add('disabled');
            cartBtn.textContent = 'Out of Stock';
            return;
        }

        // All good - enable button
        cartBtn.textContent = this.settings.cartButtonText;
    }

    // ═══════════════════════════════════════════
    // CART STATUS HANDLING
    // ═══════════════════════════════════════════

    handleCartStatus(status) {
        const productId = status.productId;
        const card = this.querySelector(`[data-product-id="${productId}"]`);
        if (!card) return;

        const cartBtn = card.querySelector('.add-to-cart-button');
        if (!cartBtn) return;

        cartBtn.classList.remove('loading', 'success', 'error');

        if (status.status === 'loading') {
            cartBtn.classList.add('loading');
            cartBtn.innerHTML = '<span class="spinner"></span> Adding...';
        } else if (status.status === 'success') {
            cartBtn.classList.add('success');
            cartBtn.innerHTML = '✓ Added';
        } else if (status.status === 'error') {
            cartBtn.classList.add('error');
            cartBtn.textContent = status.message || 'Error';
        } else {
            // Idle - restore normal state
            this.updateCartButton(productId);
        }
    }

    // ═══════════════════════════════════════════
    // UTILITY FUNCTIONS
    // ═══════════════════════════════════════════

    findProduct(productId) {
        return this.products.find(p => p.id === productId) || null;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    escapeAttr(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    // ═══════════════════════════════════════════
    // CSS HELPERS
    // ═══════════════════════════════════════════

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
            glow: 'box-shadow: 0 0 20px ' + this.settings.primaryAccent + '66;',
            zoom: 'transform: scale(1.02);',
            none: ''
        };
        return effects[this.settings.hoverEffect] || effects.lift;
    }

    getButtonSizeCSS() {
        const sizes = {
            small: 'padding: 10px 20px; font-size: 12px;',
            medium: 'padding: 14px 28px; font-size: 14px;',
            large: 'padding: 18px 36px; font-size: 16px;'
        };
        return sizes[this.settings.buttonSize] || sizes.medium;
    }

    getButtonStyleCSS() {
        const styles = {
            filled: 'background: var(--button-bg); color: var(--button-text); border: none;',
            outlined: 'background: transparent; color: var(--button-bg); border: 2px solid var(--button-bg);',
            text: 'background: transparent; color: var(--button-bg); border: none;'
        };
        return styles[this.settings.buttonStyle] || styles.filled;
    }

    // ═══════════════════════════════════════════
    // RENDER METHODS
    // ═══════════════════════════════════════════

    render() {
        this.innerHTML = `
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                
                :host { 
                    display: block; 
                    width: 100%; 
                    font-family: var(--font-family);
                }

                .gallery-container {
                    padding: 20px;
                    max-width: 1400px;
                    margin: 0 auto;
                }

                /* ─── PRODUCT GRID ─── */
                .products-grid {
                    display: grid;
                    grid-template-columns: repeat(var(--columns-desktop), 1fr);
                    gap: var(--card-gap);
                    margin-bottom: 40px;
                }

                /* ─── PRODUCT CARD ─── */
                .product-card {
                    background: var(--card-bg);
                    border: var(--border-width) solid var(--border-color);
                    border-radius: var(--corner-radius);
                    padding: var(--card-padding);
                    box-shadow: var(--card-shadow);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    overflow: hidden;
                }

                .product-card:hover {
                    background: var(--card-hover-bg);
                    ${this.getHoverEffectCSS()}
                }

                /* ─── IMAGE ─── */
                .product-image-container {
                    position: relative;
                    width: 100%;
                    height: var(--image-height);
                    overflow: hidden;
                    background: #f5f5f5;
                    border-radius: var(--image-border-radius);
                    flex-shrink: 0;
                    margin-bottom: 16px;
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

                /* ─── RIBBON ─── */
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
                    box-shadow: 2px 2px 8px rgba(0,0,0,0.2);
                    z-index: 10;
                    border-radius: 0 4px 4px 0;
                }

                /* ─── CONTENT ─── */
                .product-content {
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
                    min-height: 0;
                }

                .options-wrapper {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .option-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .option-label {
                    display: block;
                    font-size: 12px;
                    font-weight: 600;
                    color: var(--heading-color);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .option-label .selected-value {
                    font-weight: 400;
                    color: var(--text-color);
                    text-transform: none;
                    letter-spacing: 0;
                }

                /* ─── COLOR SWATCHES ─── */
                .option-swatches {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .option-swatch {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    cursor: pointer;
                    border: 2px solid var(--border-color);
                    position: relative;
                    transition: all 0.2s ease;
                    padding: 0;
                    outline: none;
                    background: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .option-swatch .swatch-inner {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: block;
                    border: 2px solid white;
                    box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1);
                }

                .option-swatch:hover:not(:disabled) {
                    border-color: var(--primary-accent);
                    transform: scale(1.1);
                }

                .option-swatch.active {
                    border-color: var(--primary-accent);
                    border-width: 3px;
                    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
                }

                .option-swatch .check-mark {
                    position: absolute;
                    color: white;
                    font-size: 18px;
                    font-weight: bold;
                    text-shadow: 0 0 3px rgba(0,0,0,0.5);
                    pointer-events: none;
                }

                .option-swatch.out-of-stock {
                    opacity: 0.4;
                    cursor: not-allowed;
                }

                .option-swatch.out-of-stock::after {
                    content: "";
                    position: absolute;
                    top: 50%;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: #cc0000;
                    transform: rotate(-45deg);
                }

                /* ─── DROPDOWN ─── */
                .option-dropdown {
                    width: 100%;
                    padding: 12px 14px;
                    border: 2px solid var(--border-color);
                    border-radius: 8px;
                    font-size: 14px;
                    font-family: var(--font-family);
                    color: var(--heading-color);
                    background: white;
                    cursor: pointer;
                    transition: border-color 0.2s ease;
                    outline: none;
                    appearance: auto;
                }

                .option-dropdown:focus {
                    border-color: var(--primary-accent);
                    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
                }

                .option-dropdown:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                /* ─── BUTTONS ─── */
                .product-buttons {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .product-button {
                    display: block;
                    width: 100%;
                    border-radius: 8px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-decoration: none;
                    text-align: center;
                    ${this.getButtonSizeCSS()}
                    ${this.getButtonStyleCSS()}
                }

                .product-button:hover {
                    background: var(--button-hover-bg);
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0,0,0,0.15);
                }

                .add-to-cart-button {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
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
                    box-shadow: 0 6px 20px rgba(0,0,0,0.15);
                }

                .add-to-cart-button.disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    background: #999;
                }

                .add-to-cart-button.loading {
                    opacity: 0.8;
                    cursor: wait;
                }

                .add-to-cart-button.success {
                    background: #27ae60;
                    color: #fff;
                }

                .add-to-cart-button.error {
                    background: #e74c3c;
                    color: #fff;
                }

                /* ─── SPINNER ─── */
                .spinner {
                    display: inline-block;
                    width: 14px;
                    height: 14px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.6s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
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
                    box-shadow: 0 8px 20px rgba(0,0,0,0.15);
                }

                /* ─── EMPTY STATE ─── */
                .empty-state {
                    text-align: center;
                    padding: 80px 20px;
                    color: var(--text-color);
                    font-size: 18px;
                }

                /* ─── RESPONSIVE ─── */
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
                        width: 36px;
                        height: 36px;
                    }
                    
                    .option-swatch .swatch-inner {
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

    renderProducts() {
        const grid = this.querySelector('.products-grid');
        const loadMoreContainer = this.querySelector('.load-more-container');
        if (!grid || !loadMoreContainer) return;

        if (this.products.length === 0) {
            grid.innerHTML = '<div class="empty-state">No products found. Please select a category.</div>';
            loadMoreContainer.innerHTML = '';
            return;
        }

        grid.innerHTML = this.products.map(p => this.renderProductCard(p)).join('');
        
        if (this.hasMore) {
            loadMoreContainer.innerHTML = `<button class="load-more-button">${this.settings.loadMoreText}</button>`;
        } else {
            loadMoreContainer.innerHTML = '';
        }

        this.updateStyles();

        // Request variants for products with options
        this.products.forEach(product => {
            if (product.hasOptions && !this.variantsRequested.has(product.id)) {
                this.variantsRequested.add(product.id);
                console.log('🔍 Requesting variants for:', product.id);
                
                this.dispatchEvent(new CustomEvent('request-variants', {
                    bubbles: true,
                    composed: true,
                    detail: { productId: product.id }
                }));
            } else if (this.productOptionsData[product.id]) {
                // Re-render if we already have the data
                this.renderProductOptions(product.id);
            }
        });

        // Restore selections and update states
        Object.keys(this.productSelections).forEach(pid => {
            if (this.productOptionsData[pid]) {
                this.updateProductCardState(pid);
            }
        });
    }

    renderProductCard(product) {
        const hasComparePrice = product.compareAtPrice && product.compareAtPrice !== product.price;
        
        const cartButtonText = product.hasOptions ? 'Loading...' : this.settings.cartButtonText;
        const cartButtonClass = 'add-to-cart-button' + (product.hasOptions ? ' disabled' : '') + (!product.inStock ? ' disabled' : '');

        return `
            <div class="product-card" data-product-id="${product.id}">
                ${product.ribbon ? `<div class="product-ribbon">${this.escapeHtml(product.ribbon)}</div>` : ''}
                
                <div class="product-image-container">
                    <img 
                        src="${product.imageUrl}" 
                        alt="${this.escapeAttr(product.name)}"
                        class="product-image" 
                        loading="lazy"
                        onerror="this.src='https://via.placeholder.com/400'"
                    >
                </div>
                
                <div class="product-content">
                    <h3 class="product-name">${this.escapeHtml(product.name)}</h3>
                    <p class="product-description">${this.escapeHtml(product.description || '')}</p>
                    
                    <div class="product-price-section">
                        <span class="product-price">${product.price}</span>
                        ${hasComparePrice 
                            ? `<span class="product-compare-price">${product.compareAtPrice}</span>` 
                            : '<span class="product-compare-price" style="display:none;"></span>'
                        }
                    </div>
                    
                    <div class="product-options"></div>
                    
                    <div class="product-buttons">
                        <button class="${cartButtonClass}" data-product-id="${product.id}">
                            ${!product.inStock ? 'Out of Stock' : cartButtonText}
                        </button>
                        <a href="${product.productUrl}" class="product-button">
                            ${this.settings.buttonText}
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    updateStyles() {
        const container = this.querySelector('.gallery-container');
        if (!container) return;

        const s = this.settings;
        const cssVars = {
            '--card-bg': s.cardBgColor,
            '--card-hover-bg': s.cardHoverBgColor,
            '--heading-color': s.headingColor,
            '--text-color': s.textColor,
            '--font-family': s.fontFamily,
            '--heading-size': s.headingSize + 'px',
            '--text-size': s.textSize + 'px',
            '--price-color': s.priceColor,
            '--compare-price-color': s.comparePriceColor,
            '--price-size': s.priceSize + 'px',
            '--border-color': s.borderColor,
            '--border-width': s.borderWidth + 'px',
            '--corner-radius': s.cornerRadius + 'px',
            '--card-padding': s.cardPadding + 'px',
            '--card-gap': s.cardGap + 'px',
            '--button-bg': s.buttonBgColor,
            '--button-text': s.buttonTextColor,
            '--button-hover-bg': s.buttonHoverBgColor,
            '--image-height': s.imageHeight + 'px',
            '--image-border-radius': s.imageBorderRadius + 'px',
            '--card-shadow': this.getShadowCSS(),
            '--columns-desktop': s.columnsDesktop,
            '--columns-tablet': s.columnsTablet,
            '--columns-mobile': s.columnsMobile,
            '--ribbon-bg': s.ribbonBgColor,
            '--ribbon-text': s.ribbonTextColor,
            '--load-more-bg': s.loadMoreBgColor,
            '--load-more-text': s.loadMoreTextColor,
            '--load-more-border': s.loadMoreBorderColor,
            '--primary-accent': s.primaryAccent,
            '--cart-button-bg': s.cartButtonBgColor || '#2ecc71',
            '--cart-button-text': s.cartButtonTextColor || '#ffffff',
            '--cart-button-hover-bg': s.cartButtonHoverBgColor || '#27ae60'
        };

        Object.entries(cssVars).forEach(([key, value]) => {
            container.style.setProperty(key, value);
        });
    }
}

customElements.define('product-gallery', ProductGalleryElement);
