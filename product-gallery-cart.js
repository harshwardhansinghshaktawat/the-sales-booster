class ProductGalleryCartElement extends HTMLElement {
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
        this.selectedOptions = {};
    }

    connectedCallback() {
        console.log('Custom element connected');
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
        return ['products-data', 'settings', 'cart-result'];
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
            } else if (name === 'cart-result') {
                try {
                    const result = JSON.parse(newValue);
                    this.showCartMessage(result.success, result.message);
                } catch (e) {
                    console.error('Error parsing cart result:', e);
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
                
                .product-options {
                    margin: 0 0 12px 0;
                }
                
                .option-group {
                    margin-bottom: 12px;
                }
                
                .option-label {
                    font-size: 13px;
                    font-weight: 600;
                    color: #333;
                    margin-bottom: 6px;
                    display: block;
                }
                
                .option-select {
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 14px;
                    background: white;
                    cursor: pointer;
                    outline: none;
                    transition: border-color 0.2s;
                }
                
                .option-select:hover {
                    border-color: var(--secondary-bg);
                }
                
                .option-select:focus {
                    border-color: var(--secondary-bg);
                    box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
                }
                
                .quantity-control {
                    display: flex;
                    align-items: center;
                    margin: 12px 0;
                }
                
                .quantity-label {
                    font-size: 13px;
                    font-weight: 600;
                    color: #333;
                    margin-right: 10px;
                }
                
                .quantity-input {
                    width: 70px;
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 14px;
                    text-align: center;
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
                
                .product-buttons {
                    display: flex;
                    gap: 8px;
                }
                
                .add-to-cart-button {
                    flex: 1;
                    padding: 16px 20px;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background: var(--secondary-bg);
                    color: white;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
                
                .view-product-link {
                    padding: 16px 20px;
                    border: 2px solid var(--secondary-bg);
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background: white;
                    color: var(--secondary-bg);
                    text-decoration: none;
                    text-align: center;
                    flex: 0 0 auto;
                }
                
                .view-product-link:hover {
                    background: var(--secondary-bg);
                    color: white;
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
                
                .cart-message {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 16px 24px;
                    border-radius: 8px;
                    font-weight: 600;
                    z-index: 9999;
                    opacity: 0;
                    transform: translateY(-20px);
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                }
                
                .cart-message.show {
                    opacity: 1;
                    transform: translateY(0);
                }
                
                .cart-message.success {
                    background: #4caf50;
                    color: white;
                }
                
                .cart-message.error {
                    background: #f44336;
                    color: white;
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
                }
            </style>
            
            <div class="gallery-container">
                <div class="products-grid"></div>
                <div class="load-more-container"></div>
            </div>
            <div class="cart-message" id="cartMessage"></div>
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

        const cardsHTML = this.products.map((product, index) => this.renderProductCard(product, index)).join('');
        grid.innerHTML = cardsHTML;

        this.attachEventListeners();

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

    renderProductCard(product, index) {
        const hasComparePrice = product.compareAtPrice && product.compareAtPrice !== product.price;
        const hasOptions = product.options && product.options.length > 0;
        
        let optionsHTML = '';
        if (hasOptions) {
            optionsHTML = '<div class="product-options">';
            product.options.forEach(option => {
                optionsHTML += `
                    <div class="option-group">
                        <label class="option-label">${option.name}</label>
                        <select class="option-select" data-product-index="${index}" data-option-id="${option.id}">
                            <option value="">Select ${option.name}</option>
                            ${option.choices.map(choice => `
                                <option value="${choice.id}">${choice.value}</option>
                            `).join('')}
                        </select>
                    </div>
                `;
            });
            optionsHTML += '</div>';
            
            optionsHTML += `
                <div class="quantity-control">
                    <label class="quantity-label">Quantity:</label>
                    <input type="number" class="quantity-input" value="1" min="1" data-product-index="${index}">
                </div>
            `;
        }
        
        return `
            <div class="product-card">
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
                    
                    ${optionsHTML}
                    
                    <div class="product-price-section">
                        <span class="product-price" data-product-index="${index}">${product.price}</span>
                        ${hasComparePrice ? `<span class="product-compare-price">${product.compareAtPrice}</span>` : ''}
                    </div>
                    
                    <div class="product-buttons">
                        <button class="add-to-cart-button" data-product-index="${index}">
                            Add to Cart
                        </button>
                        <a href="${product.productUrl}" class="view-product-link">View</a>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        const selects = this.querySelectorAll('.option-select');
        selects.forEach(select => {
            select.addEventListener('change', (e) => {
                const productIndex = parseInt(e.target.dataset.productIndex);
                const optionId = e.target.dataset.optionId;
                const value = e.target.value;
                
                if (!this.selectedOptions[productIndex]) {
                    this.selectedOptions[productIndex] = {};
                }
                
                this.selectedOptions[productIndex][optionId] = value;
                this.updatePriceForProduct(productIndex);
            });
        });

        const addToCartButtons = this.querySelectorAll('.add-to-cart-button');
        addToCartButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const productIndex = parseInt(e.target.dataset.productIndex);
                this.handleAddToCart(productIndex);
            });
        });
    }

    updatePriceForProduct(productIndex) {
        const product = this.products[productIndex];
        if (!product || !product.variants || product.variants.length === 0) return;

        const selected = this.selectedOptions[productIndex] || {};
        
        let matchingVariant = null;

        if (product.catalogVersion === 'V3') {
            matchingVariant = product.variants.find(variant => {
                if (!variant.optionChoiceIds || variant.optionChoiceIds.length === 0) return false;
                
                return variant.optionChoiceIds.every(choice => {
                    return selected[choice.optionId] === choice.choiceId;
                });
            });
        } else {
            matchingVariant = product.variants.find(variant => {
                if (!variant.choices) return false;
                
                return Object.keys(selected).every(optionId => {
                    return variant.choices[optionId] === selected[optionId];
                });
            });
        }

        const priceElement = this.querySelector(`.product-price[data-product-index="${productIndex}"]`);
        if (priceElement && matchingVariant && matchingVariant.price) {
            priceElement.textContent = matchingVariant.price;
        }
    }

    handleAddToCart(productIndex) {
        const product = this.products[productIndex];
        if (!product) return;

        const quantityInput = this.querySelector(`.quantity-input[data-product-index="${productIndex}"]`);
        const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;

        let variantId = null;
        let selectedOptions = {};

        if (product.options && product.options.length > 0) {
            const selected = this.selectedOptions[productIndex] || {};
            
            const allOptionsSelected = product.options.every(option => {
                return selected[option.id] && selected[option.id] !== '';
            });

            if (!allOptionsSelected) {
                this.showCartMessage(false, 'Please select all options');
                return;
            }

            if (product.catalogVersion === 'V3') {
                const matchingVariant = product.variants.find(variant => {
                    if (!variant.optionChoiceIds) return false;
                    return variant.optionChoiceIds.every(choice => {
                        return selected[choice.optionId] === choice.choiceId;
                    });
                });

                if (matchingVariant) {
                    variantId = matchingVariant.id;
                } else {
                    this.showCartMessage(false, 'Selected variant not found');
                    return;
                }
            } else {
                if (product.manageVariants) {
                    const matchingVariant = product.variants.find(variant => {
                        if (!variant.choices) return false;
                        return Object.keys(selected).every(optionId => {
                            return variant.choices[optionId] === selected[optionId];
                        });
                    });

                    if (matchingVariant) {
                        variantId = matchingVariant.id;
                    } else {
                        this.showCartMessage(false, 'Selected variant not found');
                        return;
                    }
                } else {
                    selectedOptions = selected;
                }
            }
        } else {
            if (product.variants && product.variants.length > 0) {
                variantId = product.variants[0].id;
            }
        }

        console.log('Adding to cart:', {
            productId: product.id,
            variantId: variantId,
            quantity: quantity,
            selectedOptions: selectedOptions
        });

        this.dispatchEvent(new CustomEvent('add-to-cart', {
            bubbles: true,
            composed: true,
            detail: {
                productId: product.id,
                variantId: variantId,
                quantity: quantity,
                selectedOptions: selectedOptions
            }
        }));
    }

    showCartMessage(success, message) {
        const messageEl = this.querySelector('#cartMessage');
        if (!messageEl) return;

        messageEl.textContent = message;
        messageEl.className = `cart-message ${success ? 'success' : 'error'} show`;

        setTimeout(() => {
            messageEl.classList.remove('show');
        }, 3000);
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

customElements.define('product-gallery-cart', ProductGalleryCartElement);
