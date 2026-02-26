class ProductGalleryElement extends HTMLElement {
    constructor() {
        super();
        this.products = [];
        this.hasMore = false;

        // Per-product state
        this.productSelections = {};  // { productId: { Color: 'Red', Size: 'M' } }
        this.productOptionsData = {}; // { productId: { options, variants, manageVariants } }
        this.requestedVariants = {};  // Track which products we already requested variants for

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
                var data = JSON.parse(newValue);
                if (!this.isRendered) {
                    this.pendingProductsData = data;
                    return;
                }
                this.products = data.products || [];
                this.hasMore = data.hasMore || false;
                this.renderProducts();
            } else if (name === 'settings') {
                var newSettings = JSON.parse(newValue);
                Object.assign(this.settings, newSettings);
                if (this.isRendered) {
                    this.updateStyles();
                }
            } else if (name === 'variant-data') {
                var variantData = JSON.parse(newValue);
                this.handleVariantData(variantData);
            } else if (name === 'cart-status') {
                var status = JSON.parse(newValue);
                this.handleCartStatus(status);
            }
        } catch (e) {
            // Silent fail on parse errors
        }
    }

    // ═══════════════════════════════════════════
    // VARIANT DATA HANDLING
    // ═══════════════════════════════════════════

    handleVariantData(data) {
        var productId = data.productId;
        if (!productId) return;

        // Store the options/variants data for this product
        this.productOptionsData[productId] = {
            hasOptions: data.hasOptions,
            options: data.options || [],
            variants: data.variants || [],
            manageVariants: data.manageVariants || false
        };

        // Now render the options section for this product card
        this.renderProductOptions(productId);
    }

    renderProductOptions(productId) {
        var card = this.querySelector('[data-product-card="' + productId + '"]');
        if (!card) return;

        var optionsContainer = card.querySelector('.product-options');
        if (!optionsContainer) return;

        var data = this.productOptionsData[productId];
        if (!data || !data.hasOptions || !data.options || data.options.length === 0) {
            optionsContainer.innerHTML = '';
            // Enable the add to cart button for products without options
            var cartBtn = card.querySelector('.add-to-cart-button');
            if (cartBtn) {
                cartBtn.classList.remove('disabled');
                cartBtn.textContent = this.settings.cartButtonText;
            }
            return;
        }

        // Render option groups
        var html = '';
        for (var i = 0; i < data.options.length; i++) {
            var option = data.options[i];
            if (option.type === 'color') {
                html += this.renderColorOption(productId, option);
            } else {
                html += this.renderDropdownOption(productId, option);
            }
        }
        optionsContainer.innerHTML = html;

        // Update cart button state
        this.updateCartButton(productId);
    }

    renderColorOption(productId, option) {
        var selections = this.productSelections[productId] || {};
        var selectedValue = selections[option.name] || null;

        var swatchesHTML = '';
        for (var i = 0; i < option.choices.length; i++) {
            var choice = option.choices[i];
            var isActive = selectedValue === choice.value ? ' active' : '';
            var isOOS = !choice.inStock ? ' out-of-stock' : '';
            var title = this.escapeAttr(choice.description || choice.value);
            var color = choice.color || '#ccc';

            swatchesHTML += '<button class="option-swatch' + isActive + isOOS + '"'
                + ' data-product-id="' + productId + '"'
                + ' data-option-name="' + this.escapeAttr(option.name) + '"'
                + ' data-option-value="' + this.escapeAttr(choice.value) + '"'
                + ' title="' + title + '">'
                + '<span class="swatch-inner" style="background-color: ' + color + ';"></span>'
                + '</button>';
        }

        var selectedLabel = selectedValue ? ': ' + selectedValue : '';

        return '<div class="option-group">'
            + '<span class="option-label">' + this.escapeHtml(option.name) + '<span class="selected-value">' + selectedLabel + '</span></span>'
            + '<div class="option-swatches">' + swatchesHTML + '</div>'
            + '</div>';
    }

    renderDropdownOption(productId, option) {
        var selections = this.productSelections[productId] || {};
        var selectedValue = selections[option.name] || '';

        var optionsHTML = '<option value="">Select ' + this.escapeHtml(option.name) + '</option>';
        for (var i = 0; i < option.choices.length; i++) {
            var choice = option.choices[i];
            var label = this.escapeHtml(choice.description || choice.value);
            var stockLabel = !choice.inStock ? ' (Out of Stock)' : '';
            var isSelected = selectedValue === choice.value ? ' selected' : '';
            optionsHTML += '<option value="' + this.escapeAttr(choice.value) + '"' + isSelected + '>' + label + stockLabel + '</option>';
        }

        return '<div class="option-group">'
            + '<span class="option-label">' + this.escapeHtml(option.name) + '</span>'
            + '<select class="option-dropdown"'
            + ' data-product-id="' + productId + '"'
            + ' data-option-name="' + this.escapeAttr(option.name) + '">'
            + optionsHTML
            + '</select>'
            + '</div>';
    }

    // ═══════════════════════════════════════════
    // EVENT HANDLING
    // ═══════════════════════════════════════════

    handleClick(e) {
        // Color swatch click
        var swatch = e.target.closest('.option-swatch');
        if (swatch) {
            this.handleSwatchClick(swatch);
            return;
        }

        // Add to Cart
        var cartBtn = e.target.closest('.add-to-cart-button');
        if (cartBtn) {
            this.handleAddToCartClick(cartBtn);
            return;
        }

        // Load More
        var loadMoreBtn = e.target.closest('.load-more-button');
        if (loadMoreBtn) {
            this.dispatchEvent(new CustomEvent('load-more', {
                bubbles: true,
                composed: true
            }));
            return;
        }
    }

    handleChange(e) {
        var dropdown = e.target.closest('.option-dropdown');
        if (dropdown) {
            this.handleDropdownChange(dropdown);
        }
    }

    handleSwatchClick(swatch) {
        var productId = swatch.dataset.productId;
        var optionName = swatch.dataset.optionName;
        var optionValue = swatch.dataset.optionValue;

        if (!this.productSelections[productId]) {
            this.productSelections[productId] = {};
        }

        // Toggle: deselect if same, else select
        if (this.productSelections[productId][optionName] === optionValue) {
            delete this.productSelections[productId][optionName];
        } else {
            this.productSelections[productId][optionName] = optionValue;
        }

        this.updateProductCardState(productId);
    }

    handleDropdownChange(dropdown) {
        var productId = dropdown.dataset.productId;
        var optionName = dropdown.dataset.optionName;
        var optionValue = dropdown.value;

        if (!this.productSelections[productId]) {
            this.productSelections[productId] = {};
        }

        if (optionValue === '') {
            delete this.productSelections[productId][optionName];
        } else {
            this.productSelections[productId][optionName] = optionValue;
        }

        this.updateProductCardState(productId);
    }

    handleAddToCartClick(button) {
        if (button.classList.contains('disabled') || button.classList.contains('loading')) return;

        var productId = button.dataset.productId;
        var product = this.findProduct(productId);
        if (!product) return;

        var optionsData = this.productOptionsData[productId];
        var selections = this.productSelections[productId] || {};

        var variantId = null;
        var selectedChoices = {};
        var manageVariants = false;

        if (optionsData && optionsData.hasOptions && optionsData.variants && optionsData.variants.length > 0) {
            manageVariants = optionsData.manageVariants;
            selectedChoices = Object.assign({}, selections);

            // Find matching variant
            var matchedVariant = this.findMatchingVariant(productId);
            if (matchedVariant) {
                variantId = matchedVariant.id;
            }
        }

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
        var optionsData = this.productOptionsData[productId];
        if (!optionsData || !optionsData.variants || optionsData.variants.length === 0) return null;

        var selections = this.productSelections[productId] || {};
        var optionNames = optionsData.options.map(function (o) { return o.name; });

        // Check all options are selected
        var allSelected = optionNames.every(function (name) { return selections[name] !== undefined; });
        if (!allSelected) return null;

        // Find variant matching all selections
        return optionsData.variants.find(function (variant) {
            return optionNames.every(function (name) {
                return variant.choices[name] === selections[name];
            });
        }) || null;
    }

    allOptionsSelected(productId) {
        var optionsData = this.productOptionsData[productId];
        if (!optionsData || !optionsData.options) return true;

        var selections = this.productSelections[productId] || {};
        return optionsData.options.every(function (o) { return selections[o.name] !== undefined; });
    }

    // ═══════════════════════════════════════════
    // UPDATE CARD STATE (after option selection)
    // ═══════════════════════════════════════════

    updateProductCardState(productId) {
        var card = this.querySelector('[data-product-card="' + productId + '"]');
        if (!card) return;

        var selections = this.productSelections[productId] || {};

        // Update swatch active states
        var swatches = card.querySelectorAll('.option-swatch');
        for (var i = 0; i < swatches.length; i++) {
            var s = swatches[i];
            var oName = s.dataset.optionName;
            var oVal = s.dataset.optionValue;
            if (selections[oName] === oVal) {
                s.classList.add('active');
            } else {
                s.classList.remove('active');
            }
        }

        // Update selected value labels
        var optionsData = this.productOptionsData[productId];
        if (optionsData && optionsData.options) {
            var labels = card.querySelectorAll('.option-label');
            for (var j = 0; j < labels.length; j++) {
                var labelEl = labels[j];
                var selectedValueEl = labelEl.querySelector('.selected-value');
                if (selectedValueEl) {
                    // Find the option name from the label text
                    var optName = labelEl.textContent.replace(selectedValueEl.textContent, '').trim();
                    if (selections[optName]) {
                        selectedValueEl.textContent = ': ' + selections[optName];
                    } else {
                        selectedValueEl.textContent = '';
                    }
                }
            }
        }

        // Update dropdown selected values
        var dropdowns = card.querySelectorAll('.option-dropdown');
        for (var k = 0; k < dropdowns.length; k++) {
            var dd = dropdowns[k];
            var ddName = dd.dataset.optionName;
            if (selections[ddName]) {
                dd.value = selections[ddName];
            }
        }

        // Find matching variant and update price/image/button
        var matchedVariant = this.findMatchingVariant(productId);
        var product = this.findProduct(productId);
        var priceEl = card.querySelector('.product-price');
        var comparePriceEl = card.querySelector('.product-compare-price');
        var imgEl = card.querySelector('.product-image');

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
            // Reset to base price
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
        var card = this.querySelector('[data-product-card="' + productId + '"]');
        if (!card) return;

        var cartBtn = card.querySelector('.add-to-cart-button');
        if (!cartBtn) return;

        var product = this.findProduct(productId);
        var optionsData = this.productOptionsData[productId];

        cartBtn.classList.remove('disabled', 'loading', 'success', 'error');

        // Product without options — always enabled
        if (!optionsData || !optionsData.hasOptions || !optionsData.options || optionsData.options.length === 0) {
            if (product && !product.inStock) {
                cartBtn.classList.add('disabled');
                cartBtn.textContent = 'Out of Stock';
            } else {
                cartBtn.textContent = this.settings.cartButtonText;
            }
            return;
        }

        // Product with options
        if (!this.allOptionsSelected(productId)) {
            cartBtn.classList.add('disabled');
            cartBtn.textContent = 'Select Options';
            return;
        }

        var matchedVariant = this.findMatchingVariant(productId);
        if (!matchedVariant) {
            cartBtn.classList.add('disabled');
            cartBtn.textContent = 'Unavailable';
            return;
        }

        if (!matchedVariant.inStock) {
            cartBtn.classList.add('disabled');
            cartBtn.textContent = 'Out of Stock';
            return;
        }

        cartBtn.textContent = this.settings.cartButtonText;
    }

    // ═══════════════════════════════════════════
    // CART STATUS HANDLING
    // ═══════════════════════════════════════════

    handleCartStatus(status) {
        var productId = status.productId;
        var card = this.querySelector('[data-product-card="' + productId + '"]');
        if (!card) return;

        var cartBtn = card.querySelector('.add-to-cart-button');
        if (!cartBtn) return;

        cartBtn.classList.remove('loading', 'success', 'error');

        if (status.status === 'loading') {
            cartBtn.classList.add('loading');
            cartBtn.textContent = 'Adding...';
        } else if (status.status === 'success') {
            cartBtn.classList.add('success');
            cartBtn.textContent = 'Added ✓';
        } else if (status.status === 'error') {
            cartBtn.classList.add('error');
            cartBtn.textContent = status.message || 'Error';
        } else {
            // idle — restore
            this.updateCartButton(productId);
        }
    }

    // ═══════════════════════════════════════════
    // UTILITY
    // ═══════════════════════════════════════════

    findProduct(productId) {
        for (var i = 0; i < this.products.length; i++) {
            if (this.products[i].id === productId) return this.products[i];
        }
        return null;
    }

    escapeHtml(text) {
        if (!text) return '';
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    escapeAttr(text) {
        if (!text) return '';
        return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // ═══════════════════════════════════════════
    // CSS HELPERS
    // ═══════════════════════════════════════════

    getShadowCSS() {
        var shadows = {
            none: 'none',
            small: '0 1px 3px rgba(0, 0, 0, 0.08)',
            medium: '0 4px 12px rgba(0, 0, 0, 0.12)',
            large: '0 8px 24px rgba(0, 0, 0, 0.16)'
        };
        return shadows[this.settings.cardShadow] || shadows.medium;
    }

    getHoverEffectCSS() {
        var effects = {
            lift: 'transform: translateY(-8px); box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);',
            glow: 'box-shadow: 0 0 20px ' + this.settings.primaryAccent + '66;',
            zoom: 'transform: scale(1.02);',
            none: ''
        };
        return effects[this.settings.hoverEffect] || effects.lift;
    }

    getButtonCSS() {
        var sizes = {
            small: 'padding: 10px 20px; font-size: 12px;',
            medium: 'padding: 14px 28px; font-size: 14px;',
            large: 'padding: 18px 36px; font-size: 16px;'
        };
        var styles = {
            filled: 'background: var(--button-bg); color: var(--button-text); border: none;',
            outlined: 'background: transparent; color: var(--button-bg); border: 2px solid var(--button-bg);',
            text: 'background: transparent; color: var(--button-bg); border: none;'
        };
        return sizes[this.settings.buttonSize] + styles[this.settings.buttonStyle];
    }

    // ═══════════════════════════════════════════
    // MAIN RENDER
    // ═══════════════════════════════════════════

    render() {
        this.innerHTML = '<style>'
            + '* { box-sizing: border-box; }'
            + ':host { display: block; width: 100%; }'

            + '.gallery-container {'
            + '  padding: 20px; max-width: 1400px; margin: 0 auto;'
            + '  font-family: var(--font-family);'
            + '}'

            + '.products-grid {'
            + '  display: grid;'
            + '  grid-template-columns: repeat(var(--columns-desktop), 1fr);'
            + '  gap: var(--card-gap);'
            + '  margin-bottom: 40px;'
            + '}'

            + '.product-card {'
            + '  background: var(--card-bg); overflow: hidden;'
            + '  box-shadow: var(--card-shadow);'
            + '  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);'
            + '  position: relative; display: flex; flex-direction: column; height: 100%;'
            + '  border: var(--border-width) solid var(--border-color);'
            + '  border-radius: var(--corner-radius);'
            + '}'
            + '.product-card:hover {'
            + '  background: var(--card-hover-bg);'
            + '  ' + this.getHoverEffectCSS()
            + '}'

            + '.product-image-container {'
            + '  position: relative; width: 100%; height: var(--image-height);'
            + '  overflow: hidden; background: #f5f5f5; flex-shrink: 0;'
            + '  border-radius: var(--image-border-radius);'
            + '}'
            + '.product-image {'
            + '  width: 100%; height: 100%; object-fit: cover; object-position: center;'
            + '  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);'
            + '}'
            + '.product-card:hover .product-image {'
            + '  transform: ' + (this.settings.imageZoom ? 'scale(1.1)' : 'scale(1)') + ';'
            + '}'

            + '.product-ribbon {'
            + '  position: absolute; top: 12px; left: 0;'
            + '  background: var(--ribbon-bg); color: var(--ribbon-text);'
            + '  padding: 6px 16px; font-weight: 700; font-size: 11px;'
            + '  text-transform: uppercase; letter-spacing: 0.8px;'
            + '  box-shadow: 2px 2px 8px rgba(0,0,0,0.2); z-index: 10;'
            + '  border-radius: 0 4px 4px 0;'
            + '}'

            + '.product-content {'
            + '  padding: var(--card-padding); flex: 1;'
            + '  display: flex; flex-direction: column;'
            + '}'

            + '.product-name {'
            + '  font-size: var(--heading-size); font-weight: 700;'
            + '  margin: 0 0 12px 0; line-height: 1.3;'
            + '  color: var(--heading-color);'
            + '  height: calc(var(--heading-size) * 2.6); overflow: hidden;'
            + '  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;'
            + '}'

            + '.product-description {'
            + '  font-size: var(--text-size); line-height: 1.6;'
            + '  color: var(--text-color); margin: 0 0 16px 0;'
            + '  height: calc(var(--text-size) * 3.2); overflow: hidden;'
            + '  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;'
            + '}'

            + '.product-price-section {'
            + '  margin: auto 0 0 0; padding-top: 16px;'
            + '  border-top: 1px solid var(--border-color);'
            + '  display: flex; align-items: center; gap: 10px;'
            + '  margin-bottom: 16px;'
            + '}'
            + '.product-price {'
            + '  font-size: var(--price-size); font-weight: 800;'
            + '  color: var(--price-color); display: inline-block;'
            + '  transition: all 0.2s ease;'
            + '}'
            + '.product-compare-price {'
            + '  font-size: calc(var(--price-size) * 0.65);'
            + '  color: var(--compare-price-color); text-decoration: line-through;'
            + '  display: inline-block;'
            + '}'

            // ─── PRODUCT OPTIONS ───
            + '.product-options { margin-bottom: 16px; min-height: 0; }'
            + '.product-options-loading {'
            + '  padding: 10px 0; color: var(--text-color); font-size: 12px;'
            + '}'
            + '.option-group { margin-bottom: 12px; }'
            + '.option-group:last-child { margin-bottom: 0; }'
            + '.option-label {'
            + '  display: block; font-size: 12px; font-weight: 600;'
            + '  color: var(--heading-color); margin-bottom: 8px;'
            + '  text-transform: uppercase; letter-spacing: 0.5px;'
            + '}'
            + '.option-label .selected-value {'
            + '  font-weight: 400; color: var(--text-color);'
            + '  text-transform: none; letter-spacing: 0;'
            + '}'

            // Color Swatches
            + '.option-swatches { display: flex; flex-wrap: wrap; gap: 8px; }'
            + '.option-swatch {'
            + '  width: 32px; height: 32px; border-radius: 50%;'
            + '  cursor: pointer; border: 2px solid #e0e0e0;'
            + '  position: relative; transition: all 0.2s ease;'
            + '  padding: 0; outline: none; background: none;'
            + '}'
            + '.option-swatch .swatch-inner {'
            + '  width: 100%; height: 100%; border-radius: 50%;'
            + '  display: block; border: 2px solid transparent;'
            + '}'
            + '.option-swatch:hover {'
            + '  border-color: var(--primary-accent); transform: scale(1.1);'
            + '}'
            + '.option-swatch.active {'
            + '  border-color: var(--primary-accent);'
            + '  box-shadow: 0 0 0 2px var(--primary-accent);'
            + '}'
            + '.option-swatch.out-of-stock {'
            + '  opacity: 0.4; cursor: not-allowed;'
            + '}'
            + '.option-swatch.out-of-stock::after {'
            + '  content: ""; position: absolute; top: 50%; left: -2px; right: -2px;'
            + '  height: 2px; background: #cc0000; transform: rotate(-45deg);'
            + '}'

            // Dropdown
            + '.option-dropdown {'
            + '  width: 100%; padding: 10px 14px;'
            + '  border: 2px solid var(--border-color); border-radius: 8px;'
            + '  font-size: 14px; font-family: var(--font-family);'
            + '  color: var(--heading-color); background: #fff;'
            + '  cursor: pointer; transition: border-color 0.2s ease;'
            + '  outline: none; appearance: auto;'
            + '}'
            + '.option-dropdown:focus { border-color: var(--primary-accent); }'

            // ─── BUTTONS ───
            + '.product-buttons { display: flex; flex-direction: column; gap: 8px; }'

            + '.product-button {'
            + '  display: block; width: 100%; margin: 0; border-radius: 8px;'
            + '  font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;'
            + '  cursor: pointer; transition: all 0.3s ease;'
            + '  text-decoration: none; text-align: center;'
            + '  ' + this.getButtonCSS()
            + '}'
            + '.product-button:hover {'
            + '  background: var(--button-hover-bg);'
            + '  transform: translateY(-2px);'
            + '  box-shadow: 0 6px 20px rgba(0,0,0,0.15);'
            + '}'

            + '.add-to-cart-button {'
            + '  display: block; width: 100%; padding: 14px 28px;'
            + '  border-radius: 8px; font-weight: 700; font-size: 14px;'
            + '  text-transform: uppercase; letter-spacing: 0.5px;'
            + '  cursor: pointer; transition: all 0.3s ease;'
            + '  text-align: center; border: none;'
            + '  background: var(--cart-button-bg); color: var(--cart-button-text);'
            + '  font-family: var(--font-family);'
            + '}'
            + '.add-to-cart-button:hover:not(.disabled):not(.loading) {'
            + '  background: var(--cart-button-hover-bg);'
            + '  transform: translateY(-2px);'
            + '  box-shadow: 0 6px 20px rgba(0,0,0,0.15);'
            + '}'
            + '.add-to-cart-button.disabled { opacity: 0.5; cursor: not-allowed; }'
            + '.add-to-cart-button.loading { opacity: 0.7; cursor: wait; }'
            + '.add-to-cart-button.success { background: #27ae60; color: #fff; }'
            + '.add-to-cart-button.error { background: #e74c3c; color: #fff; }'

            // ─── LOAD MORE ───
            + '.load-more-container { text-align: center; padding: 30px 0; }'
            + '.load-more-button {'
            + '  padding: 16px 48px;'
            + '  border: 3px solid var(--load-more-border);'
            + '  background: var(--load-more-bg); color: var(--load-more-text);'
            + '  border-radius: 50px; font-size: 15px; font-weight: 700;'
            + '  cursor: pointer; transition: all 0.3s ease;'
            + '  text-transform: uppercase; letter-spacing: 1.2px;'
            + '  font-family: var(--font-family);'
            + '}'
            + '.load-more-button:hover {'
            + '  background: var(--load-more-text); color: var(--load-more-bg);'
            + '  transform: translateY(-3px);'
            + '  box-shadow: 0 8px 20px rgba(0,0,0,0.15);'
            + '}'

            + '.empty-state {'
            + '  text-align: center; padding: 80px 20px;'
            + '  color: var(--text-color); font-size: 18px;'
            + '  font-family: var(--font-family);'
            + '}'

            + '@media (max-width: 1024px) {'
            + '  .products-grid { grid-template-columns: repeat(var(--columns-tablet), 1fr); }'
            + '}'
            + '@media (max-width: 768px) {'
            + '  .products-grid { grid-template-columns: repeat(var(--columns-mobile), 1fr); }'
            + '  .product-name { font-size: calc(var(--heading-size) * 0.9); }'
            + '  .product-description { font-size: calc(var(--text-size) * 0.9); }'
            + '  .option-swatch { width: 28px; height: 28px; }'
            + '}'

            + '</style>'
            + '<div class="gallery-container">'
            + '  <div class="products-grid"></div>'
            + '  <div class="load-more-container"></div>'
            + '</div>';
    }

    // ═══════════════════════════════════════════
    // RENDER PRODUCTS
    // ═══════════════════════════════════════════

    renderProducts() {
        var grid = this.querySelector('.products-grid');
        var loadMoreContainer = this.querySelector('.load-more-container');
        if (!grid || !loadMoreContainer) return;

        if (this.products.length === 0) {
            grid.innerHTML = '<div class="empty-state">No products found. Please select a category.</div>';
            loadMoreContainer.innerHTML = '';
            return;
        }

        var cardsHTML = '';
        for (var i = 0; i < this.products.length; i++) {
            cardsHTML += this.renderProductCard(this.products[i]);
        }
        grid.innerHTML = cardsHTML;

        if (this.hasMore) {
            loadMoreContainer.innerHTML = '<button class="load-more-button">' + this.settings.loadMoreText + '</button>';
        } else {
            loadMoreContainer.innerHTML = '';
        }

        this.updateStyles();

        // Request variant data for products that have options
        var self = this;
        for (var j = 0; j < this.products.length; j++) {
            var product = this.products[j];
            if (product.hasOptions && !this.requestedVariants[product.id]) {
                this.requestedVariants[product.id] = true;
                // Use closure to capture product.id
                (function (pid) {
                    self.dispatchEvent(new CustomEvent('request-variants', {
                        bubbles: true,
                        composed: true,
                        detail: { productId: pid }
                    }));
                })(product.id);
            } else if (this.productOptionsData[product.id]) {
                // Re-render options if we already have the data
                this.renderProductOptions(product.id);
            }
        }

        // Restore selections for products that already have data
        for (var pid in this.productSelections) {
            if (this.productOptionsData[pid]) {
                this.updateProductCardState(pid);
            }
        }
    }

    renderProductCard(product) {
        var hasComparePrice = product.compareAtPrice && product.compareAtPrice !== product.price;

        // Initial button state — disabled if hasOptions (until variant data loads)
        var cartButtonText = product.hasOptions ? 'Loading...' : this.settings.cartButtonText;
        var cartButtonClass = 'add-to-cart-button';
        if (product.hasOptions) {
            cartButtonClass += ' disabled';
        } else if (!product.inStock) {
            cartButtonText = 'Out of Stock';
            cartButtonClass += ' disabled';
        }

        return '<div class="product-card" data-product-card="' + product.id + '">'
            + (product.ribbon ? '<div class="product-ribbon">' + this.escapeHtml(product.ribbon) + '</div>' : '')

            + '<div class="product-image-container">'
            + '  <img src="' + product.imageUrl + '"'
            + '       alt="' + this.escapeAttr(product.name) + '"'
            + '       class="product-image" loading="lazy"'
            + '       onerror="this.src=\'https://via.placeholder.com/400\'">'
            + '</div>'

            + '<div class="product-content">'
            + '  <h3 class="product-name">' + this.escapeHtml(product.name) + '</h3>'
            + '  <p class="product-description">' + this.escapeHtml(product.description || '') + '</p>'

            + '  <div class="product-price-section">'
            + '    <span class="product-price">' + product.price + '</span>'
            + (hasComparePrice
                ? '    <span class="product-compare-price">' + product.compareAtPrice + '</span>'
                : '    <span class="product-compare-price" style="display:none;"></span>')
            + '  </div>'

            // Options container — will be populated when variant-data arrives
            + '  <div class="product-options"></div>'

            + '  <div class="product-buttons">'
            + '    <button class="' + cartButtonClass + '" data-product-id="' + product.id + '">'
            + cartButtonText
            + '    </button>'
            + '    <a href="' + product.productUrl + '" class="product-button">'
            + this.settings.buttonText
            + '    </a>'
            + '  </div>'
            + '</div>'
            + '</div>';
    }

    // ═══════════════════════════════════════════
    // STYLES
    // ═══════════════════════════════════════════

    updateStyles() {
        var container = this.querySelector('.gallery-container');
        if (!container) return;

        var s = this.settings;
        var props = {
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

        for (var key in props) {
            container.style.setProperty(key, props[key]);
        }
    }
}

customElements.define('product-gallery', ProductGalleryElement);
