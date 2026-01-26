class ProductGalleryVariantsElement extends HTMLElement {
    constructor() {
        super();
        this.products = [];
        this.hasMore = false;
        this.settings = {
            primaryBg: '#ffffff',
            secondaryBg: '#00d4ff',
            borderColor: '#e0e0e0',
            titleColor: '#333333',
            borderWidth: 1,
            cornerRadius: 16,
            buttonText: 'Load More Products'
        };
        this.isRendered = false;
        this.pendingProductsData = null;
        this.selectedVariants = {};
        this.buttonStates = {};
    }

    connectedCallback() {
        console.log('Custom element connected');
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
        return ['products-data', 'settings', 'button-update'];
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
            } else if (name === 'button-update') {
                try {
                    const update = JSON.parse(newValue);
                    this.updateButton(update.productId, update.state);
                } catch (e) {
                    console.error('Error parsing button update:', e);
                }
            }
        }
    }

    render() {
        this.innerHTML = `
            <style>
                * { box-sizing: border-box; }
                :host { display: block; width: 100%; }
                .gallery-container { padding: 20px; max-width: 1400px; margin: 0 auto; }
                .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 30px; margin-bottom: 40px; }
                .product-card { background: var(--primary-bg); overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); transition: transform 0.3s ease, box-shadow 0.3s ease; position: relative; display: flex; flex-direction: column; height: 100%; }
                .product-card:hover { transform: translateY(-8px); box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15); }
                .product-image-container { position: relative; width: 100%; height: 320px; overflow: hidden; background: #f8f8f8; flex-shrink: 0; }
                .product-image { width: 100%; height: 100%; object-fit: cover; object-position: center; transition: transform 0.4s ease; }
                .product-card:hover .product-image { transform: scale(1.08); }
                .product-ribbon { position: absolute; top: 16px; left: 0; background: linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%); color: white; padding: 8px 16px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.2); z-index: 10; }
                .product-content { padding: 24px; flex: 1; display: flex; flex-direction: column; }
                .product-name { font-size: 18px; font-weight: 700; margin: 0 0 12px 0; line-height: 1.4; color: var(--title-color); height: 50px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
                .product-description { font-size: 14px; line-height: 1.6; color: #666; margin: 0 0 16px 0; height: 44px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
                .variant-options { margin-bottom: 16px; }
                .variant-option { margin-bottom: 12px; }
                .variant-label { font-size: 13px; font-weight: 600; color: #333; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
                .color-swatches { display: flex; flex-wrap: wrap; gap: 8px; }
                .color-swatch { width: 36px; height: 36px; border-radius: 50%; border: 2px solid #ddd; cursor: pointer; transition: all 0.2s ease; position: relative; overflow: hidden; background: white; }
                .color-swatch:hover { transform: scale(1.1); border-color: var(--secondary-bg); }
                .color-swatch.selected { border-color: var(--secondary-bg); border-width: 3px; box-shadow: 0 0 0 2px white, 0 0 0 4px var(--secondary-bg); }
                .color-swatch-inner { width: 100%; height: 100%; border-radius: 50%; }
                .variant-dropdown { width: 100%; padding: 10px 12px; border: 2px solid #ddd; border-radius: 6px; font-size: 14px; background: white; cursor: pointer; transition: border-color 0.2s ease; }
                .variant-dropdown:hover, .variant-dropdown:focus { border-color: var(--secondary-bg); outline: none; }
                .out-of-stock-badge { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(255, 0, 0, 0.9); color: white; padding: 12px 24px; font-weight: 700; font-size: 14px; text-transform: uppercase; border-radius: 4px; z-index: 5; }
                .product-price-section { margin: auto 0 20px 0; padding-top: 12px; border-top: 1px solid #eee; }
                .product-price { font-size: 24px; font-weight: 800; color: var(--secondary-bg); display: inline-block; }
                .product-compare-price { font-size: 16px; color: #999; text-decoration: line-through; margin-left: 10px; display: inline-block; }
                .add-to-cart-button { width: 100%; padding: 16px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; transition: all 0.3s ease; background: var(--secondary-bg); color: white; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
                .add-to-cart-button:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15); filter: brightness(1.1); }
                .add-to-cart-button:disabled { background: #ccc; cursor: not-allowed; opacity: 0.6; }
                .load-more-container { text-align: center; padding: 30px 0; }
                .load-more-button { padding: 18px 60px; border: 3px solid var(--secondary-bg); background: white; color: var(--secondary-bg); border-radius: 50px; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.3s ease; text-transform: uppercase; letter-spacing: 1.5px; }
                .load-more-button:hover { background: var(--secondary-bg); color: white; transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15); }
                .empty-state { text-align: center; padding: 80px 20px; color: #999; font-size: 18px; }
                @media (max-width: 1200px) {
                    .products-grid { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; }
                }
                @media (max-width: 768px) {
                    .products-grid { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
                    .product-content { padding: 20px; }
                    .product-image-container { height: 280px; }
                }
            </style>
            
            <div class="gallery-container">
                <div class="products-grid"></div>
                <div class="load-more-container"></div>
            </div>
        `;
    }

    // Method to update button state
    updateButton(productId, state) {
        const button = this.querySelector(`.add-to-cart-button[data-product-id="${productId}"]`);
        if (!button) return;

        switch (state) {
            case 'adding':
                button.textContent = 'Adding...';
                button.disabled = true;
                break;
            case 'success':
                button.textContent = '✓ Added!';
                button.disabled = false;
                break;
            case 'error':
                button.textContent = 'Error';
                button.disabled = false;
                break;
            case 'reset':
                button.textContent = this.buttonStates[productId] || 'Add to Cart';
                button.disabled = false;
                break;
        }
    }

    // ... all other methods remain the same (renderProducts, attachEventListeners, etc.) ...
    
    renderProducts() {
        const grid = this.querySelector('.products-grid');
        const loadMoreContainer = this.querySelector('.load-more-container');

        if (!grid || !loadMoreContainer) {
            console.error('Grid or container not found');
            return;
        }

        if (this.products.length === 0) {
            grid.innerHTML = '<div class="empty-state">No products found. Please select a category.</div>';
            loadMoreContainer.innerHTML = '';
            return;
        }

        const cardsHTML = this.products.map(product => this.renderProductCard(product)).join('');
        grid.innerHTML = cardsHTML;

        this.attachEventListeners();

        if (this.hasMore) {
            loadMoreContainer.innerHTML = `<button class="load-more-button" id="loadMoreBtn">${this.settings.buttonText}</button>`;
            
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

    getColorStyle(colorName) {
        const colorMap = {
            'white': '#FFFFFF', 'black': '#000000', 'red': '#FF0000',
            'blue': '#0000FF', 'green': '#00FF00', 'yellow': '#FFFF00',
            'purple': '#800080', 'pink': '#FFC0CB', 'orange': '#FFA500',
            'brown': '#A52A2A', 'gray': '#808080', 'grey': '#808080'
        };
        return colorMap[colorName.toLowerCase()] || '#CCCCCC';
    }

    renderProductCard(product) {
        const productId = product.id;
        const hasComparePrice = product.compareAtPrice && product.compareAtPrice !== product.price;
        
        if (!this.selectedVariants[productId] && product.hasVariants) {
            const firstVariant = product.variants.find(v => v.visible && v.inStock);
            if (firstVariant) {
                this.selectedVariants[productId] = firstVariant.choices;
            }
        }

        const selectedChoices = this.selectedVariants[productId] || {};
        const currentVariant = this.findMatchingVariant(product, selectedChoices);
        
        const displayImage = currentVariant?.image || product.imageUrl;
        const displayPrice = currentVariant?.formattedPrice || product.price;
        const isInStock = currentVariant?.inStock !== false;

        if (!this.buttonStates[productId]) {
            this.buttonStates[productId] = 'Add to Cart';
        }

        return `
            <div class="product-card" data-product-id="${productId}">
                ${product.ribbon ? `<div class="product-ribbon">${product.ribbon}</div>` : ''}
                ${!isInStock ? '<div class="out-of-stock-badge">Out of Stock</div>' : ''}
                
                <div class="product-image-container">
                    <img src="${displayImage}" alt="${product.name}" class="product-image" data-product-id="${productId}" onerror="this.src='https://via.placeholder.com/400'">
                </div>
                
                <div class="product-content">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">${product.description || ''}</p>
                    
                    ${product.hasVariants ? this.renderVariantOptions(product, selectedChoices) : ''}
                    
                    <div class="product-price-section">
                        <span class="product-price" data-product-id="${productId}">${displayPrice}</span>
                        ${hasComparePrice ? `<span class="product-compare-price">${product.compareAtPrice}</span>` : ''}
                    </div>
                    
                    <button class="add-to-cart-button" data-product-id="${productId}" ${!isInStock ? 'disabled' : ''}>
                        ${isInStock ? this.buttonStates[productId] : 'Out of Stock'}
                    </button>
                </div>
            </div>
        `;
    }

    renderVariantOptions(product, selectedChoices) {
        if (!product.variantOptions || product.variantOptions.length === 0) return '';

        return `
            <div class="variant-options">
                ${product.variantOptions.map(option => {
                    if (option.renderType === 'SWATCH_CHOICES') {
                        return this.renderColorSwatches(product.id, option, selectedChoices[option.name]);
                    } else {
                        return this.renderDropdown(product.id, option, selectedChoices[option.name]);
                    }
                }).join('')}
            </div>
        `;
    }

    renderColorSwatches(productId, option, selectedChoice) {
        return `
            <div class="variant-option">
                <div class="variant-label">${option.name}: ${selectedChoice || 'Select'}</div>
                <div class="color-swatches">
                    ${option.choices.map(choice => `
                        <div class="color-swatch ${selectedChoice === choice ? 'selected' : ''}" data-product-id="${productId}" data-option="${option.name}" data-choice="${choice}" title="${choice}">
                            <div class="color-swatch-inner" style="background-color: ${this.getColorStyle(choice)}"></div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderDropdown(productId, option, selectedChoice) {
        return `
            <div class="variant-option">
                <div class="variant-label">${option.name}</div>
                <select class="variant-dropdown" data-product-id="${productId}" data-option="${option.name}">
                    <option value="">Select ${option.name}</option>
                    ${option.choices.map(choice => `
                        <option value="${choice}" ${selectedChoice === choice ? 'selected' : ''}>${choice}</option>
                    `).join('')}
                </select>
            </div>
        `;
    }

    attachEventListeners() {
        this.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.addEventListener('click', (e) => {
                this.handleVariantSelection(
                    e.currentTarget.dataset.productId,
                    e.currentTarget.dataset.option,
                    e.currentTarget.dataset.choice
                );
            });
        });

        this.querySelectorAll('.variant-dropdown').forEach(dropdown => {
            dropdown.addEventListener('change', (e) => {
                this.handleVariantSelection(
                    e.target.dataset.productId,
                    e.target.dataset.option,
                    e.target.value
                );
            });
        });

        this.querySelectorAll('.add-to-cart-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.handleAddToCart(e.target.dataset.productId);
            });
        });
    }

    handleVariantSelection(productId, optionName, choice) {
        if (!this.selectedVariants[productId]) {
            this.selectedVariants[productId] = {};
        }
        this.selectedVariants[productId][optionName] = choice;

        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const variant = this.findMatchingVariant(product, this.selectedVariants[productId]);
        if (variant) {
            this.updateProductDisplay(productId, variant);
        }
    }

    findMatchingVariant(product, selectedChoices) {
        if (!product.variants || product.variants.length === 0) return null;

        return product.variants.find(variant => {
            return Object.keys(selectedChoices).every(optionName => {
                return variant.choices[optionName] === selectedChoices[optionName];
            });
        });
    }

    updateProductDisplay(productId, variant) {
        if (variant.image) {
            const img = this.querySelector(`.product-image[data-product-id="${productId}"]`);
            if (img) img.src = variant.image;
        }

        const priceEl = this.querySelector(`.product-price[data-product-id="${productId}"]`);
        if (priceEl) priceEl.textContent = variant.formattedPrice;

        const button = this.querySelector(`.add-to-cart-button[data-product-id="${productId}"]`);
        if (button) {
            if (variant.inStock) {
                button.disabled = false;
                button.textContent = this.buttonStates[productId] || 'Add to Cart';
            } else {
                button.disabled = true;
                button.textContent = 'Out of Stock';
            }
        }

        const card = this.querySelector(`.product-card[data-product-id="${productId}"]`);
        if (card) {
            card.querySelectorAll('.color-swatch').forEach(swatch => {
                const optionName = swatch.dataset.option;
                const choice = swatch.dataset.choice;
                if (this.selectedVariants[productId]?.[optionName] === choice) {
                    swatch.classList.add('selected');
                } else {
                    swatch.classList.remove('selected');
                }
            });
        }
    }

    handleAddToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const selectedChoices = this.selectedVariants[productId];
        const variant = this.findMatchingVariant(product, selectedChoices);

        if (product.hasVariants && !variant) {
            alert('Please select all options');
            return;
        }

        this.dispatchEvent(new CustomEvent('add-to-cart', {
            bubbles: true,
            composed: true,
            detail: {
                productId: productId,
                variantId: variant?.id
            }
        }));
    }

    updateStyles() {
        const container = this.querySelector('.gallery-container');
        if (!container) return;

        container.style.setProperty('--primary-bg', this.settings.primaryBg);
        container.style.setProperty('--secondary-bg', this.settings.secondaryBg);
        container.style.setProperty('--border-color', this.settings.borderColor);
        container.style.setProperty('--title-color', this.settings.titleColor);

        this.querySelectorAll('.product-card').forEach(card => {
            card.style.border = `${this.settings.borderWidth}px solid ${this.settings.borderColor}`;
            card.style.borderRadius = `${this.settings.cornerRadius}px`;
        });
    }
}

customElements.define('product-gallery-variants', ProductGalleryVariantsElement);
