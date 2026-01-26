class ProductCardElement extends HTMLElement {
    constructor() {
        super();
        this.productData = null;
        this.selectedChoices = {};
        this.selectedVariant = null;
        this.currentQuantity = 1;
        this.settings = {
            cardBg: '#ffffff',
            textColor: '#333333',
            priceColor: '#e94560',
            buttonColor: '#00d4ff',
            buttonTextColor: '#ffffff',
            borderColor: '#e0e0e0',
            accentColor: '#00d4ff',
            ribbonColor: '#ff6b6b',
            fontFamily: 'Arial, sans-serif'
        };
    }

    connectedCallback() {
        this.render();
    }

    static get observedAttributes() {
        return ['product-data', 'settings', 'cart-success', 'cart-error'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (newValue && newValue !== oldValue) {
            if (name === 'product-data') {
                try {
                    this.productData = JSON.parse(newValue);
                    console.log('Product data loaded:', this.productData);
                    this.initializeSelections();
                    this.updateCard();
                } catch (e) {
                    console.error('Error parsing product data:', e);
                }
            } else if (name === 'settings') {
                try {
                    const newSettings = JSON.parse(newValue);
                    Object.assign(this.settings, newSettings);
                    this.updateStyles();
                } catch (e) {
                    // Silent
                }
            } else if (name === 'cart-success') {
                this.showSuccessMessage();
            } else if (name === 'cart-error') {
                this.showErrorMessage(newValue);
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
                
                .product-card {
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                    position: relative;
                }
                
                .product-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.16);
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
                    top: 16px;
                    right: -32px;
                    background: var(--ribbon-color);
                    color: white;
                    padding: 8px 40px;
                    font-weight: 700;
                    font-size: 12px;
                    text-transform: uppercase;
                    transform: rotate(45deg);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                    z-index: 10;
                }
                
                .product-content {
                    padding: 24px;
                }
                
                .product-name {
                    font-size: 22px;
                    font-weight: 700;
                    margin-bottom: 8px;
                    line-height: 1.3;
                }
                
                .product-description {
                    font-size: 14px;
                    line-height: 1.6;
                    opacity: 0.7;
                    margin-bottom: 16px;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                
                .product-price {
                    font-size: 28px;
                    font-weight: 800;
                    margin-bottom: 20px;
                }
                
                .variant-selector {
                    margin-bottom: 16px;
                }
                
                .variant-label {
                    font-size: 14px;
                    font-weight: 600;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .variant-options {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                
                .variant-option {
                    padding: 10px 16px;
                    border: 2px solid var(--border-color);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-size: 14px;
                    font-weight: 500;
                }
                
                .variant-option:hover {
                    border-color: var(--accent-color);
                    background: var(--accent-color)10;
                }
                
                .variant-option.selected {
                    border-color: var(--accent-color);
                    background: var(--accent-color);
                    color: white;
                }
                
                .variant-option.disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                }
                
                .stock-status {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 16px;
                    font-size: 14px;
                    font-weight: 600;
                }
                
                .stock-indicator {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                }
                
                .stock-indicator.in-stock {
                    background: #2ecc71;
                }
                
                .stock-indicator.out-of-stock {
                    background: #e74c3c;
                }
                
                .add-to-cart-button {
                    width: 100%;
                    padding: 16px 24px;
                    border: none;
                    border-radius: 12px;
                    font-size: 16px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    cursor: pointer;
                    transition: all 0.3s ease;
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
                
                .quantity-selector {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 16px;
                }
                
                .quantity-label {
                    font-size: 14px;
                    font-weight: 600;
                }
                
                .quantity-controls {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    border: 2px solid var(--border-color);
                    border-radius: 8px;
                    padding: 4px 8px;
                }
                
                .quantity-btn {
                    width: 32px;
                    height: 32px;
                    border: none;
                    background: var(--accent-color);
                    color: white;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 18px;
                    font-weight: 700;
                    transition: all 0.3s ease;
                }
                
                .quantity-btn:hover {
                    opacity: 0.8;
                }
                
                .quantity-value {
                    font-size: 16px;
                    font-weight: 700;
                    min-width: 30px;
                    text-align: center;
                }
                
                .loading {
                    text-align: center;
                    padding: 60px 20px;
                    font-size: 16px;
                    opacity: 0.6;
                }
                
                .success-message {
                    background: #2ecc71;
                    color: white;
                    padding: 12px 16px;
                    border-radius: 8px;
                    margin-top: 12px;
                    text-align: center;
                    font-weight: 600;
                    animation: slideIn 0.3s ease;
                }
                
                .error-message {
                    background: #e74c3c;
                    color: white;
                    padding: 12px 16px;
                    border-radius: 8px;
                    margin-top: 12px;
                    text-align: center;
                    font-weight: 600;
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
                
                @media (max-width: 480px) {
                    .product-content {
                        padding: 16px;
                    }
                    
                    .product-name {
                        font-size: 18px;
                    }
                    
                    .product-price {
                        font-size: 24px;
                    }
                }
            </style>
            
            <div class="product-card-container">
                <div class="loading">Loading product...</div>
            </div>
        `;
    }

    initializeSelections() {
        if (!this.productData || !this.productData.productOptions) return;

        this.productData.productOptions.forEach(option => {
            if (option.choices && option.choices.length > 0) {
                this.selectedChoices[option.name] = option.choices[0].value;
            }
        });

        this.updateSelectedVariant();
    }

    updateSelectedVariant() {
        if (!this.productData || !this.productData.variants) return;

        this.selectedVariant = this.productData.variants.find(variant => {
            return Object.keys(this.selectedChoices).every(optionName => {
                return variant.choices[optionName] === this.selectedChoices[optionName];
            });
        });

        console.log('Selected variant:', this.selectedVariant);
    }

    updateCard() {
        if (!this.productData) return;

        const container = this.querySelector('.product-card-container');
        
        const currentPrice = this.selectedVariant?.price || this.productData.basePrice;
        const isInStock = this.selectedVariant?.inStock !== false && this.productData.inStock !== false;
        const mainImage = this.productData.images && this.productData.images.length > 0 
            ? this.productData.images[0] 
            : 'https://via.placeholder.com/400';

        container.innerHTML = `
            <div class="product-card">
                ${this.productData.ribbon ? `<div class="product-ribbon">${this.productData.ribbon}</div>` : ''}
                
                <div class="product-image-container">
                    <img src="${mainImage}" alt="${this.productData.name}" class="product-image">
                </div>
                
                <div class="product-content">
                    <h3 class="product-name">${this.productData.name}</h3>
                    
                    ${this.productData.description ? `<p class="product-description">${this.productData.description}</p>` : ''}
                    
                    <div class="product-price">${currentPrice}</div>
                    
                    ${this.renderVariantSelectors()}
                    
                    <div class="stock-status">
                        <div class="stock-indicator ${isInStock ? 'in-stock' : 'out-of-stock'}"></div>
                        <span>${isInStock ? 'In Stock' : 'Out of Stock'}</span>
                    </div>
                    
                    <div class="quantity-selector">
                        <span class="quantity-label">Quantity:</span>
                        <div class="quantity-controls">
                            <button class="quantity-btn" id="decreaseQty">-</button>
                            <span class="quantity-value" id="qtyValue">${this.currentQuantity}</span>
                            <button class="quantity-btn" id="increaseQty">+</button>
                        </div>
                    </div>
                    
                    <button class="add-to-cart-button" id="addToCartBtn" ${!isInStock ? 'disabled' : ''}>
                        ${isInStock ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                    
                    <div id="messageContainer"></div>
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.updateStyles();
    }

    renderVariantSelectors() {
        if (!this.productData.productOptions || this.productData.productOptions.length === 0) {
            return '';
        }

        return this.productData.productOptions.map(option => `
            <div class="variant-selector">
                <div class="variant-label">${option.name}:</div>
                <div class="variant-options">
                    ${option.choices.map(choice => `
                        <div class="variant-option ${this.selectedChoices[option.name] === choice.value ? 'selected' : ''}" 
                             data-option="${option.name}" 
                             data-value="${choice.value}">
                            ${choice.value}
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    setupEventListeners() {
        // Variant selection
        this.querySelectorAll('.variant-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const optionName = e.target.dataset.option;
                const value = e.target.dataset.value;
                
                this.selectedChoices[optionName] = value;
                this.updateSelectedVariant();
                this.updateCard();
            });
        });

        // Quantity controls
        const qtyValue = this.querySelector('#qtyValue');

        this.querySelector('#decreaseQty')?.addEventListener('click', () => {
            if (this.currentQuantity > 1) {
                this.currentQuantity--;
                qtyValue.textContent = this.currentQuantity;
            }
        });

        this.querySelector('#increaseQty')?.addEventListener('click', () => {
            this.currentQuantity++;
            qtyValue.textContent = this.currentQuantity;
        });

        // Add to cart - dispatch CustomEvent
        this.querySelector('#addToCartBtn')?.addEventListener('click', () => {
            const variantId = this.selectedVariant?.id || null;
            
            // Dispatch custom event with cart data
            this.dispatchEvent(new CustomEvent('add-to-cart', {
                detail: {
                    productId: this.productData.id,
                    variantId: variantId,
                    quantity: this.currentQuantity
                },
                bubbles: true,
                composed: true
            }));
        });
    }

    showSuccessMessage() {
        const messageContainer = this.querySelector('#messageContainer');
        if (messageContainer) {
            messageContainer.innerHTML = '<div class="success-message">✓ Added to cart!</div>';
            setTimeout(() => {
                messageContainer.innerHTML = '';
            }, 3000);
        }
    }

    showErrorMessage(error) {
        const messageContainer = this.querySelector('#messageContainer');
        if (messageContainer) {
            messageContainer.innerHTML = `<div class="error-message">Error: ${error}</div>`;
            setTimeout(() => {
                messageContainer.innerHTML = '';
            }, 5000);
        }
    }

    updateStyles() {
        const card = this.querySelector('.product-card');
        if (!card) return;

        card.style.setProperty('--card-bg', this.settings.cardBg);
        card.style.setProperty('--text-color', this.settings.textColor);
        card.style.setProperty('--price-color', this.settings.priceColor);
        card.style.setProperty('--button-color', this.settings.buttonColor);
        card.style.setProperty('--button-text-color', this.settings.buttonTextColor);
        card.style.setProperty('--border-color', this.settings.borderColor);
        card.style.setProperty('--accent-color', this.settings.accentColor);
        card.style.setProperty('--ribbon-color', this.settings.ribbonColor);

        card.style.backgroundColor = this.settings.cardBg;
        card.style.color = this.settings.textColor;
        card.style.fontFamily = this.settings.fontFamily;

        const price = this.querySelector('.product-price');
        if (price) {
            price.style.color = this.settings.priceColor;
        }

        const button = this.querySelector('.add-to-cart-button');
        if (button) {
            button.style.backgroundColor = this.settings.buttonColor;
            button.style.color = this.settings.buttonTextColor;
        }
    }
}

customElements.define('product-card', ProductCardElement);
