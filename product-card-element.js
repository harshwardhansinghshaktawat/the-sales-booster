class ProductGalleryElement extends HTMLElement {
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
        this.productStates = new Map(); // Track variant selections per product
    }

    connectedCallback() {
        this.render();
    }

    static get observedAttributes() {
        return ['products-data', 'settings', 'cart-success', 'cart-error'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (newValue && newValue !== oldValue) {
            if (name === 'products-data') {
                try {
                    const data = JSON.parse(newValue);
                    this.products = data.products || [];
                    this.hasMore = data.hasMore || false;
                    console.log('Products received:', this.products.length);
                    this.renderProducts();
                } catch (e) {
                    console.error('Error parsing products data:', e);
                }
            } else if (name === 'settings') {
                try {
                    const newSettings = JSON.parse(newValue);
                    Object.assign(this.settings, newSettings);
                    this.updateStyles();
                } catch (e) {
                    console.error('Error parsing settings:', e);
                }
            } else if (name === 'cart-success') {
                try {
                    const data = JSON.parse(newValue);
                    this.showProductSuccess(data.productId);
                } catch (e) {
                    // Silent
                }
            } else if (name === 'cart-error') {
                try {
                    const data = JSON.parse(newValue);
                    this.showProductError(data.productId, data.error);
                } catch (e) {
                    // Silent
                }
            }
        }
    }

    render() {
        this.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                }
                
                .gallery-container {
                    padding: 20px;
                }
                
                .products-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 24px;
                    margin-bottom: 32px;
                }
                
                .product-card {
                    background: var(--primary-bg);
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                    position: relative;
                }
                
                .product-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
                }
                
                .product-image-container {
                    position: relative;
                    width: 100%;
                    padding-top: 100%;
                    overflow: hidden;
                    background: #f5f5f5;
                }
                
                .product-image {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.3s ease;
                }
                
                .product-card:hover .product-image {
                    transform: scale(1.05);
                }
                
                .product-ribbon {
                    position: absolute;
                    top: 12px;
                    right: -28px;
                    background: #ff6b6b;
                    color: white;
                    padding: 6px 32px;
                    font-weight: 700;
                    font-size: 11px;
                    text-transform: uppercase;
                    transform: rotate(45deg);
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
                    z-index: 10;
                }
                
                .product-content {
                    padding: 20px;
                }
                
                .product-name {
                    font-size: 18px;
                    font-weight: 700;
                    margin-bottom: 8px;
                    line-height: 1.3;
                    color: var(--title-color);
                }
                
                .product-description {
                    font-size: 13px;
                    line-height: 1.5;
                    opacity: 0.7;
                    margin-bottom: 12px;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                
                .product-price {
                    font-size: 22px;
                    font-weight: 800;
                    color: var(--secondary-bg);
                    margin-bottom: 16px;
                }
                
                .variant-selector {
                    margin-bottom: 12px;
                }
                
                .variant-label {
                    font-size: 12px;
                    font-weight: 600;
                    margin-bottom: 6px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    opacity: 0.8;
                }
                
                .variant-options {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                }
                
                .variant-option {
                    padding: 8px 12px;
                    border: 2px solid var(--border-color);
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-size: 13px;
                    font-weight: 500;
                }
                
                .variant-option:hover {
                    border-color: var(--secondary-bg);
                    background: var(--secondary-bg)10;
                }
                
                .variant-option.selected {
                    border-color: var(--secondary-bg);
                    background: var(--secondary-bg);
                    color: white;
                }
                
                .stock-status {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-bottom: 12px;
                    font-size: 12px;
                    font-weight: 600;
                }
                
                .stock-indicator {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }
                
                .stock-indicator.in-stock {
                    background: #2ecc71;
                }
                
                .stock-indicator.out-of-stock {
                    background: #e74c3c;
                }
                
                .quantity-selector {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 12px;
                }
                
                .quantity-label {
                    font-size: 13px;
                    font-weight: 600;
                }
                
                .quantity-controls {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    border: 2px solid var(--border-color);
                    border-radius: 6px;
                    padding: 3px 6px;
                }
                
                .quantity-btn {
                    width: 28px;
                    height: 28px;
                    border: none;
                    background: var(--secondary-bg);
                    color: white;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 700;
                    transition: opacity 0.3s ease;
                }
                
                .quantity-btn:hover {
                    opacity: 0.8;
                }
                
                .quantity-value {
                    font-size: 14px;
                    font-weight: 700;
                    min-width: 24px;
                    text-align: center;
                }
                
                .add-to-cart-button {
                    width: 100%;
                    padding: 14px 20px;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background: var(--secondary-bg);
                    color: white;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                }
                
                .add-to-cart-button:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
                }
                
                .add-to-cart-button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .load-more-container {
                    text-align: center;
                    padding: 20px;
                }
                
                .load-more-button {
                    padding: 16px 48px;
                    border: 2px solid var(--secondary-bg);
                    background: white;
                    color: var(--secondary-bg);
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                
                .load-more-button:hover {
                    background: var(--secondary-bg);
                    color: white;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                }
                
                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                    color: #999;
                    font-size: 16px;
                }
                
                .success-message {
                    background: #2ecc71;
                    color: white;
                    padding: 10px 14px;
                    border-radius: 6px;
                    margin-top: 10px;
                    text-align: center;
                    font-weight: 600;
                    font-size: 13px;
                    animation: slideIn 0.3s ease;
                }
                
                .error-message {
                    background: #e74c3c;
                    color: white;
                    padding: 10px 14px;
                    border-radius: 6px;
                    margin-top: 10px;
                    text-align: center;
                    font-weight: 600;
                    font-size: 13px;
                    animation: slideIn 0.3s ease;
                }
                
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @media (max-width: 768px) {
                    .products-grid {
                        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
                        gap: 16px;
                    }
                    
                    .product-content {
                        padding: 16px;
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

        // Render product cards
        grid.innerHTML = this.products.map((product, index) => this.renderProductCard(product, index)).join('');

        // Render load more button
        if (this.hasMore) {
            loadMoreContainer.innerHTML = `
                <button class="load-more-button" id="loadMoreBtn">
                    ${this.settings.buttonText}
                </button>
            `;
        } else {
            loadMoreContainer.innerHTML = '';
        }

        this.setupEventListeners();
        this.updateStyles();
    }

    renderProductCard(product, index) {
        // Initialize product state if not exists
        if (!this.productStates.has(product.id)) {
            const initialChoices = {};
            if (product.productOptions) {
                product.productOptions.forEach(option => {
                    if (option.choices && option.choices.length > 0) {
                        initialChoices[option.name] = option.choices[0].value;
                    }
                });
            }
            this.productStates.set(product.id, {
                selectedChoices: initialChoices,
                quantity: 1,
                selectedVariant: this.findVariant(product, initialChoices)
            });
        }

        const state = this.productStates.get(product.id);
        const currentPrice = state.selectedVariant?.price || product.basePrice;
        const isInStock = state.selectedVariant?.inStock !== false && product.inStock !== false;
        const mainImage = product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/400';

        return `
            <div class="product-card" data-product-id="${product.id}">
                ${product.ribbon ? `<div class="product-ribbon">${product.ribbon}</div>` : ''}
                
                <div class="product-image-container">
                    <img src="${mainImage}" alt="${product.name}" class="product-image">
                </div>
                
                <div class="product-content">
                    <h3 class="product-name">${product.name}</h3>
                    ${product.description ? `<p class="product-description">${product.description}</p>` : ''}
                    <div class="product-price">${currentPrice}</div>
                    
                    ${this.renderVariants(product, state)}
                    
                    <div class="stock-status">
                        <div class="stock-indicator ${isInStock ? 'in-stock' : 'out-of-stock'}"></div>
                        <span>${isInStock ? 'In Stock' : 'Out of Stock'}</span>
                    </div>
                    
                    <div class="quantity-selector">
                        <span class="quantity-label">Qty:</span>
                        <div class="quantity-controls">
                            <button class="quantity-btn qty-decrease" data-product-id="${product.id}">-</button>
                            <span class="quantity-value">${state.quantity}</span>
                            <button class="quantity-btn qty-increase" data-product-id="${product.id}">+</button>
                        </div>
                    </div>
                    
                    <button class="add-to-cart-button" data-product-id="${product.id}" ${!isInStock ? 'disabled' : ''}>
                        ${isInStock ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                    
                    <div class="message-container" data-product-id="${product.id}"></div>
                </div>
            </div>
        `;
    }

    renderVariants(product, state) {
        if (!product.productOptions || product.productOptions.length === 0) {
            return '';
        }

        return product.productOptions.map(option => `
            <div class="variant-selector">
                <div class="variant-label">${option.name}:</div>
                <div class="variant-options">
                    ${option.choices.map(choice => `
                        <div class="variant-option ${state.selectedChoices[option.name] === choice.value ? 'selected' : ''}" 
                             data-product-id="${product.id}"
                             data-option="${option.name}" 
                             data-value="${choice.value}">
                            ${choice.value}
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    findVariant(product, choices) {
        if (!product.variants) return null;
        
        return product.variants.find(variant => {
            return Object.keys(choices).every(optionName => {
                return variant.choices[optionName] === choices[optionName];
            });
        });
    }

    setupEventListeners() {
        // Variant selection
        this.querySelectorAll('.variant-option').forEach(el => {
            el.addEventListener('click', (e) => {
                const productId = e.target.dataset.productId;
                const optionName = e.target.dataset.option;
                const value = e.target.dataset.value;
                
                const product = this.products.find(p => p.id === productId);
                const state = this.productStates.get(productId);
                
                if (product && state) {
                    state.selectedChoices[optionName] = value;
                    state.selectedVariant = this.findVariant(product, state.selectedChoices);
                    this.renderProducts();
                }
            });
        });

        // Quantity controls
        this.querySelectorAll('.qty-decrease').forEach(el => {
            el.addEventListener('click', (e) => {
                const productId = e.target.dataset.productId;
                const state = this.productStates.get(productId);
                if (state && state.quantity > 1) {
                    state.quantity--;
                    this.renderProducts();
                }
            });
        });

        this.querySelectorAll('.qty-increase').forEach(el => {
            el.addEventListener('click', (e) => {
                const productId = e.target.dataset.productId;
                const state = this.productStates.get(productId);
                if (state) {
                    state.quantity++;
                    this.renderProducts();
                }
            });
        });

        // Add to cart
        this.querySelectorAll('.add-to-cart-button').forEach(el => {
            el.addEventListener('click', (e) => {
                const productId = e.target.dataset.productId;
                const state = this.productStates.get(productId);
                
                if (state) {
                    this.dispatchEvent(new CustomEvent('add-to-cart', {
                        detail: {
                            productId: productId,
                            variantId: state.selectedVariant?.id || null,
                            quantity: state.quantity
                        },
                        bubbles: true,
                        composed: true
                    }));
                }
            });
        });

        // Load more
        const loadMoreBtn = this.querySelector('#loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.dispatchEvent(new CustomEvent('load-more', {
                    bubbles: true,
                    composed: true
                }));
            });
        }
    }

    showProductSuccess(productId) {
        const container = this.querySelector(`.message-container[data-product-id="${productId}"]`);
        if (container) {
            container.innerHTML = '<div class="success-message">✓ Added to cart!</div>';
            setTimeout(() => {
                container.innerHTML = '';
            }, 3000);
        }
    }

    showProductError(productId, error) {
        const container = this.querySelector(`.message-container[data-product-id="${productId}"]`);
        if (container) {
            container.innerHTML = `<div class="error-message">Error: ${error}</div>`;
            setTimeout(() => {
                container.innerHTML = '';
            }, 5000);
        }
    }

    updateStyles() {
        const container = this.querySelector('.gallery-container');
        if (!container) return;

        container.style.setProperty('--primary-bg', this.settings.primaryBg);
        container.style.setProperty('--secondary-bg', this.settings.secondaryBg);
        container.style.setProperty('--border-color', this.settings.borderColor);
        container.style.setProperty('--title-color', this.settings.titleColor);

        // Apply border and corner radius to all cards
        this.querySelectorAll('.product-card').forEach(card => {
            card.style.border = `${this.settings.borderWidth}px solid ${this.settings.borderColor}`;
            card.style.borderRadius = `${this.settings.cornerRadius}px`;
        });
    }
}

customElements.define('product-gallery', ProductGalleryElement);
