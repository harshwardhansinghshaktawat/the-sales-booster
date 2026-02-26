class ProductVariantSelectorElement extends HTMLElement {
    constructor() {
        super();
        this.productData = null;
        this.selectedChoices = {};
        this.currentVariantDetails = null;
        this.settings = {
            // Color Swatch Settings
            swatchSize: 40,
            swatchBorderRadius: 50,
            swatchBorderWidth: 2,
            swatchBorderColor: '#e0e0e0',
            swatchSelectedBorderColor: '#3498db',
            swatchSelectedBorderWidth: 3,
            
            // Dropdown Settings
            dropdownBgColor: '#ffffff',
            dropdownBorderColor: '#e0e0e0',
            dropdownTextColor: '#1a1a1a',
            dropdownBorderRadius: 8,
            dropdownPadding: 12,
            
            // Button Settings
            buttonText: 'Add to Cart',
            buttonBgColor: '#3498db',
            buttonTextColor: '#ffffff',
            buttonHoverBgColor: '#2980b9',
            buttonBorderRadius: 8,
            buttonPadding: '16px 32px',
            buttonDisabledBgColor: '#cccccc',
            
            // Typography
            fontFamily: 'Arial',
            labelSize: 14,
            labelColor: '#1a1a1a',
            labelWeight: 600,
            
            // Price Display
            priceSize: 28,
            priceColor: '#2c3e50',
            priceWeight: 700,
            comparePriceSize: 20,
            comparePriceColor: '#999999',
            
            // Layout
            spacing: 20,
            
            // Stock Display
            showStock: true,
            inStockColor: '#2ecc71',
            outOfStockColor: '#e74c3c'
        };
        this.isRendered = false;
    }

    connectedCallback() {
        this.render();
        this.isRendered = true;
    }

    static get observedAttributes() {
        return ['product-data', 'settings'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (newValue && newValue !== oldValue) {
            if (name === 'product-data') {
                try {
                    this.productData = JSON.parse(newValue);
                    if (this.isRendered) {
                        this.renderContent();
                    }
                } catch (e) {
                    console.error('Failed to parse product data:', e);
                }
            } else if (name === 'settings') {
                try {
                    const newSettings = JSON.parse(newValue);
                    Object.assign(this.settings, newSettings);
                    if (this.isRendered) {
                        this.updateStyles();
                    }
                } catch (e) {
                    console.error('Failed to parse settings:', e);
                }
            }
        }
    }

    render() {
        this.innerHTML = `
            <style>
                * { box-sizing: border-box; }
                :host { display: block; width: 100%; }
                
                .variant-selector-container {
                    padding: var(--spacing);
                    font-family: var(--font-family);
                }
                
                .product-name {
                    font-size: 24px;
                    font-weight: 700;
                    color: var(--label-color);
                    margin-bottom: calc(var(--spacing) * 1.5);
                }
                
                .option-group {
                    margin-bottom: var(--spacing);
                }
                
                .option-label {
                    font-size: var(--label-size);
                    font-weight: var(--label-weight);
                    color: var(--label-color);
                    margin-bottom: 10px;
                    display: block;
                }
                
                .color-swatches {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                }
                
                .color-swatch {
                    width: var(--swatch-size);
                    height: var(--swatch-size);
                    border-radius: var(--swatch-border-radius);
                    border: var(--swatch-border-width) solid var(--swatch-border-color);
                    cursor: pointer;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }
                
                .color-swatch:hover {
                    transform: scale(1.1);
                }
                
                .color-swatch.selected {
                    border-color: var(--swatch-selected-border-color);
                    border-width: var(--swatch-selected-border-width);
                    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
                }
                
                .color-swatch.out-of-stock {
                    opacity: 0.4;
                    cursor: not-allowed;
                }
                
                .color-swatch.out-of-stock::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: -10%;
                    right: -10%;
                    height: 2px;
                    background: #e74c3c;
                    transform: rotate(-45deg);
                }
                
                .swatch-tooltip {
                    position: absolute;
                    bottom: calc(100% + 8px);
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 6px 12px;
                    border-radius: 4px;
                    font-size: 12px;
                    white-space: nowrap;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.2s;
                    z-index: 10;
                }
                
                .color-swatch:hover .swatch-tooltip {
                    opacity: 1;
                }
                
                .dropdown-selector {
                    width: 100%;
                    padding: var(--dropdown-padding);
                    background: var(--dropdown-bg-color);
                    border: 2px solid var(--dropdown-border-color);
                    border-radius: var(--dropdown-border-radius);
                    color: var(--dropdown-text-color);
                    font-size: var(--label-size);
                    font-family: var(--font-family);
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .dropdown-selector:hover {
                    border-color: var(--swatch-selected-border-color);
                }
                
                .dropdown-selector:focus {
                    outline: none;
                    border-color: var(--swatch-selected-border-color);
                    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
                }
                
                .dropdown-selector option:disabled {
                    color: #999;
                }
                
                .variant-info {
                    margin: calc(var(--spacing) * 1.5) 0;
                    padding: var(--spacing);
                    background: #f8f9fa;
                    border-radius: var(--dropdown-border-radius);
                }
                
                .price-display {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 12px;
                }
                
                .current-price {
                    font-size: var(--price-size);
                    font-weight: var(--price-weight);
                    color: var(--price-color);
                }
                
                .compare-price {
                    font-size: var(--compare-price-size);
                    color: var(--compare-price-color);
                    text-decoration: line-through;
                }
                
                .stock-status {
                    font-size: 14px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                
                .stock-indicator {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }
                
                .stock-status.in-stock {
                    color: var(--in-stock-color);
                }
                
                .stock-status.in-stock .stock-indicator {
                    background: var(--in-stock-color);
                }
                
                .stock-status.out-of-stock {
                    color: var(--out-of-stock-color);
                }
                
                .stock-status.out-of-stock .stock-indicator {
                    background: var(--out-of-stock-color);
                }
                
                .add-to-cart-button {
                    width: 100%;
                    padding: var(--button-padding);
                    background: var(--button-bg-color);
                    color: var(--button-text-color);
                    border: none;
                    border-radius: var(--button-border-radius);
                    font-size: 16px;
                    font-weight: 700;
                    font-family: var(--font-family);
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .add-to-cart-button:hover:not(:disabled) {
                    background: var(--button-hover-bg-color);
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
                }
                
                .add-to-cart-button:disabled {
                    background: var(--button-disabled-bg-color);
                    cursor: not-allowed;
                    transform: none;
                }
                
                .add-to-cart-button.loading {
                    position: relative;
                    color: transparent;
                }
                
                .add-to-cart-button.loading::after {
                    content: '';
                    position: absolute;
                    width: 20px;
                    height: 20px;
                    top: 50%;
                    left: 50%;
                    margin-left: -10px;
                    margin-top: -10px;
                    border: 3px solid rgba(255, 255, 255, 0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                .error-message {
                    padding: 12px;
                    background: #fee;
                    border-left: 4px solid #e74c3c;
                    color: #c0392b;
                    border-radius: 4px;
                    margin-top: 12px;
                    font-size: 14px;
                }
                
                .success-message {
                    padding: 12px;
                    background: #d4edda;
                    border-left: 4px solid #2ecc71;
                    color: #155724;
                    border-radius: 4px;
                    margin-top: 12px;
                    font-size: 14px;
                }
                
                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                    color: #999;
                    font-size: 16px;
                }
            </style>
            
            <div class="variant-selector-container">
                <div class="content-area"></div>
            </div>
        `;
        
        this.updateStyles();
    }

    renderContent() {
        const contentArea = this.querySelector('.content-area');
        if (!contentArea) return;

        if (!this.productData) {
            contentArea.innerHTML = '<div class="empty-state">No product data available</div>';
            return;
        }

        let html = `<h2 class="product-name">${this.productData.productName || 'Product'}</h2>`;

        // Render options
        if (this.productData.options && this.productData.options.length > 0) {
            this.productData.options.forEach((option, index) => {
                html += this.renderOption(option, index);
            });
        }

        // Render variant info and add to cart button
        html += `
            <div class="variant-info" id="variantInfo" style="display: none;">
                <div class="price-display"></div>
                <div class="stock-status" style="display: none;"></div>
            </div>
            
            <button class="add-to-cart-button" id="addToCartBtn" disabled>
                ${this.settings.buttonText}
            </button>
            
            <div id="messageArea"></div>
        `;

        contentArea.innerHTML = html;
        this.attachEventListeners();
    }

    renderOption(option, index) {
        const isColorOption = option.optionType === 'color';
        const optionId = option.id || option.name;
        
        let html = `
            <div class="option-group">
                <label class="option-label">${option.name}</label>
        `;

        if (isColorOption) {
            html += '<div class="color-swatches">';
            option.choices.forEach(choice => {
                const choiceId = choice.choiceId || choice.description;
                const isSelected = this.selectedChoices[optionId] === choiceId;
                const inStock = choice.inStock !== false;
                
                html += `
                    <div class="color-swatch ${isSelected ? 'selected' : ''} ${!inStock ? 'out-of-stock' : ''}"
                         data-option-id="${optionId}"
                         data-choice-id="${choiceId}"
                         data-in-stock="${inStock}"
                         style="background-color: ${choice.value};">
                        <span class="swatch-tooltip">${choice.description}</span>
                    </div>
                `;
            });
            html += '</div>';
        } else {
            html += `
                <select class="dropdown-selector" data-option-id="${optionId}">
                    <option value="">Select ${option.name}</option>
            `;
            
            option.choices.forEach(choice => {
                const choiceId = choice.choiceId || choice.description;
                const inStock = choice.inStock !== false;
                const isSelected = this.selectedChoices[optionId] === choiceId;
                
                html += `
                    <option value="${choiceId}" 
                            ${!inStock ? 'disabled' : ''}
                            ${isSelected ? 'selected' : ''}>
                        ${choice.description} ${!inStock ? '(Out of Stock)' : ''}
                    </option>
                `;
            });
            
            html += '</select>';
        }

        html += '</div>';
        return html;
    }

    attachEventListeners() {
        // Color swatch listeners
        const swatches = this.querySelectorAll('.color-swatch');
        swatches.forEach(swatch => {
            swatch.addEventListener('click', () => {
                const inStock = swatch.getAttribute('data-in-stock') === 'true';
                if (!inStock) return;

                const optionId = swatch.getAttribute('data-option-id');
                const choiceId = swatch.getAttribute('data-choice-id');
                
                // Remove selected class from siblings
                const siblings = swatch.parentElement.querySelectorAll('.color-swatch');
                siblings.forEach(s => s.classList.remove('selected'));
                
                // Add selected class
                swatch.classList.add('selected');
                
                // Update selection
                this.updateSelection(optionId, choiceId);
            });
        });

        // Dropdown listeners
        const dropdowns = this.querySelectorAll('.dropdown-selector');
        dropdowns.forEach(dropdown => {
            dropdown.addEventListener('change', (e) => {
                const optionId = dropdown.getAttribute('data-option-id');
                const choiceId = e.target.value;
                this.updateSelection(optionId, choiceId);
            });
        });

        // Add to cart button
        const addToCartBtn = this.querySelector('#addToCartBtn');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', () => this.handleAddToCart());
        }
    }

    updateSelection(optionId, choiceId) {
        if (choiceId) {
            this.selectedChoices[optionId] = choiceId;
        } else {
            delete this.selectedChoices[optionId];
        }

        // Check if all options are selected
        const allOptionsSelected = this.productData.options.every(option => {
            const optId = option.id || option.name;
            return this.selectedChoices[optId];
        });

        if (allOptionsSelected) {
            this.fetchVariantDetails();
        } else {
            this.hideVariantInfo();
        }
    }

    async fetchVariantDetails() {
        // Dispatch event to widget to fetch variant details
        this.dispatchEvent(new CustomEvent('variant-selected', {
            bubbles: true,
            composed: true,
            detail: {
                productId: this.productData.productId,
                selectedChoices: this.selectedChoices
            }
        }));
    }

    updateVariantInfo(variantDetails) {
        this.currentVariantDetails = variantDetails;
        
        const variantInfo = this.querySelector('#variantInfo');
        const priceDisplay = this.querySelector('.price-display');
        const stockStatus = this.querySelector('.stock-status');
        const addToCartBtn = this.querySelector('#addToCartBtn');

        if (!variantDetails) {
            this.hideVariantInfo();
            return;
        }

        // Show variant info
        variantInfo.style.display = 'block';

        // Update price
        let priceHtml = `<span class="current-price">${variantDetails.price || 'N/A'}</span>`;
        if (variantDetails.compareAtPrice && variantDetails.compareAtPrice !== variantDetails.price) {
            priceHtml += `<span class="compare-price">${variantDetails.compareAtPrice}</span>`;
        }
        priceDisplay.innerHTML = priceHtml;

        // Update stock status
        if (this.settings.showStock) {
            stockStatus.style.display = 'flex';
            if (variantDetails.inStock) {
                stockStatus.className = 'stock-status in-stock';
                stockStatus.innerHTML = `
                    <span class="stock-indicator"></span>
                    <span>In Stock</span>
                `;
            } else {
                stockStatus.className = 'stock-status out-of-stock';
                stockStatus.innerHTML = `
                    <span class="stock-indicator"></span>
                    <span>Out of Stock</span>
                `;
            }
        }

        // Enable/disable add to cart button
        addToCartBtn.disabled = !variantDetails.inStock;
    }

    hideVariantInfo() {
        const variantInfo = this.querySelector('#variantInfo');
        const addToCartBtn = this.querySelector('#addToCartBtn');
        
        if (variantInfo) variantInfo.style.display = 'none';
        if (addToCartBtn) addToCartBtn.disabled = true;
        
        this.currentVariantDetails = null;
    }

    async handleAddToCart() {
        const addToCartBtn = this.querySelector('#addToCartBtn');
        const messageArea = this.querySelector('#messageArea');

        if (!this.currentVariantDetails || !this.currentVariantDetails.inStock) {
            return;
        }

        // Show loading state
        addToCartBtn.classList.add('loading');
        addToCartBtn.disabled = true;
        messageArea.innerHTML = '';

        // Dispatch add to cart event
        this.dispatchEvent(new CustomEvent('add-to-cart', {
            bubbles: true,
            composed: true,
            detail: {
                productId: this.productData.productId,
                selectedChoices: this.selectedChoices,
                quantity: 1
            }
        }));
    }

    showAddToCartResult(success, message) {
        const addToCartBtn = this.querySelector('#addToCartBtn');
        const messageArea = this.querySelector('#messageArea');

        addToCartBtn.classList.remove('loading');
        addToCartBtn.disabled = false;

        if (success) {
            messageArea.innerHTML = `
                <div class="success-message">
                    ${message || 'Product added to cart successfully!'}
                </div>
            `;
            
            // Clear message after 3 seconds
            setTimeout(() => {
                messageArea.innerHTML = '';
            }, 3000);
        } else {
            messageArea.innerHTML = `
                <div class="error-message">
                    ${message || 'Failed to add product to cart. Please try again.'}
                </div>
            `;
        }
    }

    updateStyles() {
        const container = this.querySelector('.variant-selector-container');
        if (!container) return;

        container.style.setProperty('--swatch-size', `${this.settings.swatchSize}px`);
        container.style.setProperty('--swatch-border-radius', `${this.settings.swatchBorderRadius}%`);
        container.style.setProperty('--swatch-border-width', `${this.settings.swatchBorderWidth}px`);
        container.style.setProperty('--swatch-border-color', this.settings.swatchBorderColor);
        container.style.setProperty('--swatch-selected-border-color', this.settings.swatchSelectedBorderColor);
        container.style.setProperty('--swatch-selected-border-width', `${this.settings.swatchSelectedBorderWidth}px`);
        
        container.style.setProperty('--dropdown-bg-color', this.settings.dropdownBgColor);
        container.style.setProperty('--dropdown-border-color', this.settings.dropdownBorderColor);
        container.style.setProperty('--dropdown-text-color', this.settings.dropdownTextColor);
        container.style.setProperty('--dropdown-border-radius', `${this.settings.dropdownBorderRadius}px`);
        container.style.setProperty('--dropdown-padding', `${this.settings.dropdownPadding}px`);
        
        container.style.setProperty('--button-bg-color', this.settings.buttonBgColor);
        container.style.setProperty('--button-text-color', this.settings.buttonTextColor);
        container.style.setProperty('--button-hover-bg-color', this.settings.buttonHoverBgColor);
        container.style.setProperty('--button-border-radius', `${this.settings.buttonBorderRadius}px`);
        container.style.setProperty('--button-padding', this.settings.buttonPadding);
        container.style.setProperty('--button-disabled-bg-color', this.settings.buttonDisabledBgColor);
        
        container.style.setProperty('--font-family', this.settings.fontFamily);
        container.style.setProperty('--label-size', `${this.settings.labelSize}px`);
        container.style.setProperty('--label-color', this.settings.labelColor);
        container.style.setProperty('--label-weight', this.settings.labelWeight);
        
        container.style.setProperty('--price-size', `${this.settings.priceSize}px`);
        container.style.setProperty('--price-color', this.settings.priceColor);
        container.style.setProperty('--price-weight', this.settings.priceWeight);
        container.style.setProperty('--compare-price-size', `${this.settings.comparePriceSize}px`);
        container.style.setProperty('--compare-price-color', this.settings.comparePriceColor);
        
        container.style.setProperty('--spacing', `${this.settings.spacing}px`);
        
        container.style.setProperty('--in-stock-color', this.settings.inStockColor);
        container.style.setProperty('--out-of-stock-color', this.settings.outOfStockColor);
    }
}

customElements.define('product-variant-selector', ProductVariantSelectorElement);
