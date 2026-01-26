class ProductGalleryAdvancedElement extends HTMLElement {
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
            buttonText: 'Load More Products',
            addToCartText: 'Add to Cart',
            viewProductText: 'View Product'
        };
        this.isRendered = false;
        this.pendingProductsData = null;
        this.selectedVariants = {};
    }

    connectedCallback() {
        console.log('Advanced custom element connected');
        this.render();
        this.isRendered = true;
        
        if (this.pendingProductsData) {
            console.log('Rendering pending products data');
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
                console.log('Products data attribute changed');
                try {
                    const data = JSON.parse(newValue);
                    console.log('Parsed products data:', data.products.length, 'products');
                    
                    if (!this.isRendered) {
                        console.log('Element not rendered yet, storing data');
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
            }
        }
    }

    render() {
        this.innerHTML = `
            <style>
                * {
                    box-sizing: border-box;
                }
                
                :host {
                    display: block;
                    width: 100%;
                }
                
                .gallery-container {
                    padding: 20px;
                    max-width: 1400px;
                    margin: 0 auto;
                }
                
                .products-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 30px;
                    margin-bottom: 40px;
                }
                
                .product-card {
                    background: var(--primary-bg);
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }
                
                .product-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
                }
                
                .product-image-container {
                    position: relative;
                    width: 100%;
                    height: 300px;
                    overflow: hidden;
                    background: #f8f8f8;
                    flex-shrink: 0;
                }
                
                .product-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    object-position: center;
                    transition: transform 0.4s ease;
                }
                
                .product-card:hover .product-image {
                    transform: scale(1.08);
                }
                
                .product-ribbon {
                    position: absolute;
                    top: 16px;
                    left: 0;
                    background: linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%);
                    color: white;
                    padding: 8px 16px;
                    font-weight: 700;
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.2);
                    z-index: 10;
                }
                
                .product-content {
                    padding: 24px;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                
                .product-name {
                    font-size: 18px;
                    font-weight: 700;
                    margin: 0 0 12px 0;
                    line-height: 1.4;
                    color: var(--title-color);
                    height: 50px;
                    overflow: hidden;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                }
                
                .product-description {
                    font-size: 14px;
                    line-height: 1.6;
                    color: #666;
                    margin: 0 0 16px 0;
                    height: 44px;
                    overflow: hidden;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                }
                
                .product-price-section {
                    margin: auto 0 20px 0;
                    padding-top: 12px;
                    border-top: 1px solid #eee;
                }
                
                .product-price {
                    font-size: 24px;
                    font-weight: 800;
                    color: var(--secondary-bg);
                    display: inline-block;
                }
                
                .product-compare-price {
                    font-size: 16px;
                    color: #999;
                    text-decoration: line-through;
                    margin-left: 10px;
                    display: inline-block;
                }
                
                .variant-container {
                    margin: 16px 0;
                }
                
                .variant-selector {
                    margin-bottom: 12px;
                }
                
                .variant-label {
                    font-size: 13px;
                    font-weight: 600;
                    color: #555;
                    margin-bottom: 8px;
                    display: block;
                }
                
                .variant-select {
                    width: 100%;
                    padding: 10px 12px;
                    border: 2px solid #e0e0e0;
                    border-radius: 6px;
                    font-size: 14px;
                    background: white;
                    cursor: pointer;
                    transition: border-color 0.2s;
                }
                
                .variant-select:focus {
                    outline: none;
                    border-color: var(--secondary-bg);
                }
                
                .variant-select:hover {
                    border-color: #ccc;
                }
                
                .button-group {
                    display: flex;
                    gap: 10px;
                }
                
                .add-to-cart-button {
                    flex: 1;
                    padding: 14px 16px;
                    border: none;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.8px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background: var(--secondary-bg);
                    color: white;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    line-height: 1;
                }
                
                .add-to-cart-button:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
                    filter: brightness(1.1);
                }
                
                .add-to-cart-button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .view-product-button {
                    flex: 1;
                    padding: 14px 16px;
                    border: 2px solid var(--secondary-bg);
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.8px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background: white;
                    color: var(--secondary-bg);
                    text-decoration: none;
                    text-align: center;
                    line-height: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .view-product-button:hover {
                    background: var(--secondary-bg);
                    color: white;
                    transform: translateY(-2px);
                }
                
                .load-more-container {
                    text-align: center;
                    padding: 30px 0;
                }
                
                .load-more-button {
                    padding: 18px 60px;
                    border: 3px solid var(--secondary-bg);
                    background: white;
                    color: var(--secondary-bg);
                    border-radius: 50px;
                    font-size: 16px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                }
                
                .load-more-button:hover {
                    background: var(--secondary-bg);
                    color: white;
                    transform: translateY(-3px);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
                }
                
                .empty-state {
                    text-align: center;
                    padding: 80px 20px;
                    color: #999;
                    font-size: 18px;
                }
                
                .variant-error {
                    color: #ff5252;
                    font-size: 12px;
                    margin-top: 8px;
                    display: none;
                }
                
                .variant-error.show {
                    display: block;
                }
                
                @media (max-width: 1200px) {
                    .products-grid {
                        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                        gap: 24px;
                    }
                    
                    .product-image-container {
                        height: 280px;
                    }
                }
                
                @media (max-width: 768px) {
                    .products-grid {
                        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
                        gap: 20px;
                    }
                    
                    .product-content {
                        padding: 20px;
                    }
                    
                    .product-name {
                        font-size: 16px;
                    }
                    
                    .product-image-container {
                        height: 260px;
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
        
        console.log('DOM rendered');
    }

    renderProducts() {
        console.log('Rendering products, count:', this.products.length);
        
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

        // Attach event listeners
        this.products.forEach(product => {
            if (product.hasVariants && product.variantOptions) {
                this.renderVariantSelectors(product);
            }

            const addToCartBtn = this.querySelector(`.add-to-cart-button[data-product-id="${product.id}"]`);
            if (addToCartBtn) {
                addToCartBtn.addEventListener('click', () => {
                    this.handleAddToCart(product);
                });
            }
        });

        if (this.hasMore) {
            loadMoreContainer.innerHTML = `
                <button class="load-more-button" id="loadMoreBtn">
                    ${this.settings.buttonText}
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
        console.log('Products rendered successfully');
    }

    renderProductCard(product) {
        const hasComparePrice = product.compareAtPrice && product.compareAtPrice !== product.price;
        const hasVariants = product.hasVariants;
        
        return `
            <div class="product-card" data-product-id="${product.id}">
                ${product.ribbon ? `<div class="product-ribbon">${product.ribbon}</div>` : ''}
                
                <div class="product-image-container">
                    <img src="${product.imageUrl}" 
                         alt="${product.name}" 
                         class="product-image"
                         onerror="this.src='https://via.placeholder.com/400'">
                </div>
                
                <div class="product-content">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">${product.description || ''}</p>
                    
                    <div class="product-price-section">
                        <span class="product-price">${product.price}</span>
                        ${hasComparePrice ? `<span class="product-compare-price">${product.compareAtPrice}</span>` : ''}
                    </div>
                    
                    <div class="variant-container" data-product-id="${product.id}"></div>
                    <div class="variant-error" data-product-id="${product.id}">Please select all options</div>
                    
                    <div class="button-group">
                        <button class="add-to-cart-button" data-product-id="${product.id}">
                            ${this.settings.addToCartText}
                        </button>
                        <a href="${product.productUrl}" class="view-product-button">
                            ${this.settings.viewProductText}
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    renderVariantSelectors(product) {
        const container = this.querySelector(`.variant-container[data-product-id="${product.id}"]`);
        if (!container || !product.variantOptions) return;

        let variantsHTML = '';
        
        Object.keys(product.variantOptions).forEach(optionKey => {
            const optionValues = product.variantOptions[optionKey];
            variantsHTML += `
                <div class="variant-selector">
                    <label class="variant-label">${optionKey}</label>
                    <select class="variant-select" data-product-id="${product.id}" data-option-key="${optionKey}">
                        <option value="">Select ${optionKey}</option>
                        ${optionValues.map(value => `<option value="${value}">${value}</option>`).join('')}
                    </select>
                </div>
            `;
        });

        container.innerHTML = variantsHTML;

        // Attach event listeners to variant selects
        const selects = container.querySelectorAll('.variant-select');
        selects.forEach(select => {
            select.addEventListener('change', (e) => {
                this.handleVariantChange(product.id, e.target.dataset.optionKey, e.target.value);
            });
        });
    }

    handleVariantChange(productId, optionKey, value) {
        if (!this.selectedVariants[productId]) {
            this.selectedVariants[productId] = {};
        }
        this.selectedVariants[productId][optionKey] = value;
        
        console.log('Variant changed:', productId, optionKey, value);
        
        // Dispatch event to widget with current selections
        this.dispatchEvent(new CustomEvent('variant-selected', {
            bubbles: true,
            composed: true,
            detail: {
                productId: productId,
                selections: this.selectedVariants[productId]
            }
        }));
    }

    handleAddToCart(product) {
        console.log('Add to cart clicked for:', product.id);
        
        // Check if product has variants and if all are selected
        if (product.hasVariants && product.variantOptions) {
            const selectedForProduct = this.selectedVariants[product.id] || {};
            const requiredOptions = Object.keys(product.variantOptions);
            const selectedOptions = Object.keys(selectedForProduct);
            
            // Check if all required options are selected
            const allSelected = requiredOptions.every(option => 
                selectedOptions.includes(option) && selectedForProduct[option]
            );
            
            if (!allSelected) {
                // Show error
                const errorEl = this.querySelector(`.variant-error[data-product-id="${product.id}"]`);
                if (errorEl) {
                    errorEl.classList.add('show');
                    setTimeout(() => errorEl.classList.remove('show'), 3000);
                }
                return;
            }
        }
        
        // Dispatch add to cart event
        this.dispatchEvent(new CustomEvent('add-to-cart', {
            bubbles: true,
            composed: true,
            detail: {
                productId: product.id,
                quantity: 1
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

customElements.define('product-gallery-advanced', ProductGalleryAdvancedElement);
