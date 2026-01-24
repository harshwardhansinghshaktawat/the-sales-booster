class RecentOrdersPopupElement extends HTMLElement {
    constructor() {
        super();
        this.currentIndex = 0;
        this.allPurchases = [];
        this.rotationInterval = null;
        this.hideTimeout = null;
        this.isVisible = false;
        
        this.settings = {
            // Colors
            backgroundColor: '#ffffff',
            textColor: '#333333',
            accentColor: '#3498db',
            priceColor: '#e74c3c',
            locationColor: '#7f8c8d',
            timeColor: '#95a5a6',
            borderColor: '#e0e0e0',
            
            // Fonts
            fontFamily: 'Arial, sans-serif',
            nameFontSize: 14,
            productFontSize: 13,
            priceFontSize: 14,
            locationFontSize: 11,
            timeFontSize: 10,
            
            // Timing
            displayDuration: 8000,
            delayBetweenPopups: 15000,
            
            // Settings
            showName: true,
            maxOrders: 20,
            
            // Styling
            borderRadius: 8,
            borderWidth: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            paddingSize: 12
        };
    }

    connectedCallback() {
        this.render();
        this.loadOrders();
        this.observeResize();
    }

    static get observedAttributes() {
        return ['orders', 'options'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (newValue && newValue !== oldValue) {
            if (name === 'orders') {
                try {
                    this.allPurchases = JSON.parse(newValue);
                    console.log('Orders updated:', this.allPurchases.length);
                    if (this.allPurchases.length > 0 && !this.rotationInterval) {
                        this.startRotation();
                    }
                } catch (e) {
                    console.error('Error parsing orders:', e);
                }
            } else if (name === 'options') {
                try {
                    const newOptions = JSON.parse(newValue);
                    Object.assign(this.settings, newOptions);
                    console.log('Options updated:', this.settings);
                    this.updateStyles();
                } catch (e) {
                    console.error('Error parsing options:', e);
                }
            }
        }
    }

    render() {
        this.innerHTML = `
            <div class="popup-container" style="display: none;">
                <div class="popup-content">
                    <img class="product-image" src="" alt="Product">
                    <div class="popup-info">
                        <div class="popup-top">
                            <span class="buyer-name"></span>
                            <span class="buyer-location"></span>
                        </div>
                        <div class="popup-middle">
                            <span class="purchased-text">Recently Purchased</span>
                        </div>
                        <div class="popup-product">
                            <span class="product-name"></span>
                        </div>
                        <div class="popup-bottom">
                            <span class="product-price"></span>
                            <span class="time-ago"></span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.applyBaseStyles();
        this.updateStyles();
    }

    applyBaseStyles() {
        const style = document.createElement('style');
        style.textContent = `
            * {
                box-sizing: border-box;
            }
            
            .popup-container {
                position: fixed;
                bottom: 20px;
                left: 20px;
                z-index: 9999;
                animation: slideIn 0.5s ease-out;
                max-width: calc(100vw - 40px);
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(-100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(-100%);
                    opacity: 0;
                }
            }
            
            .popup-content {
                display: flex;
                align-items: center;
                gap: 12px;
                min-width: 280px;
                max-width: 380px;
                width: 100%;
                cursor: pointer;
                transition: transform 0.2s ease;
                overflow: hidden;
            }
            
            .popup-content:hover {
                transform: scale(1.02);
            }
            
            .product-image {
                width: 60px;
                height: 60px;
                object-fit: cover;
                flex-shrink: 0;
                border-radius: 4px;
            }
            
            .popup-info {
                flex: 1;
                min-width: 0;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            
            .popup-top {
                display: flex;
                align-items: center;
                gap: 4px;
                white-space: nowrap;
                overflow: hidden;
            }
            
            .buyer-name {
                font-weight: bold;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                flex-shrink: 1;
            }
            
            .buyer-location {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                flex-shrink: 1;
            }
            
            .popup-middle {
                white-space: nowrap;
                overflow: hidden;
            }
            
            .purchased-text {
                text-transform: uppercase;
                letter-spacing: 0.3px;
                font-size: 0.85em;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                display: inline-block;
                max-width: 100%;
            }
            
            .popup-product {
                white-space: nowrap;
                overflow: hidden;
            }
            
            .product-name {
                font-weight: 600;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                display: inline-block;
                max-width: 100%;
            }
            
            .popup-bottom {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 8px;
                white-space: nowrap;
            }
            
            .product-price {
                font-weight: bold;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                flex-shrink: 0;
            }
            
            .time-ago {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                text-align: right;
                flex-shrink: 1;
                min-width: 0;
            }
            
            @media (max-width: 360px) {
                .popup-container {
                    left: 10px;
                    bottom: 10px;
                    max-width: calc(100vw - 20px);
                }
                
                .popup-content {
                    min-width: 260px;
                    gap: 8px;
                }
                
                .product-image {
                    width: 50px;
                    height: 50px;
                }
            }
        `;
        this.appendChild(style);
    }

    updateStyles() {
        const content = this.querySelector('.popup-content');
        const image = this.querySelector('.product-image');
        const buyerName = this.querySelector('.buyer-name');
        const buyerLocation = this.querySelector('.buyer-location');
        const purchasedText = this.querySelector('.purchased-text');
        const productName = this.querySelector('.product-name');
        const productPrice = this.querySelector('.product-price');
        const timeAgo = this.querySelector('.time-ago');

        if (content) {
            content.style.backgroundColor = this.settings.backgroundColor;
            content.style.borderRadius = `${this.settings.borderRadius}px`;
            content.style.border = `${this.settings.borderWidth}px solid ${this.settings.borderColor}`;
            content.style.boxShadow = this.settings.boxShadow;
            content.style.padding = `${this.settings.paddingSize}px`;
            content.style.fontFamily = this.settings.fontFamily;
        }

        if (image) {
            image.style.borderRadius = `${Math.max(2, this.settings.borderRadius / 2)}px`;
        }

        if (buyerName) {
            buyerName.style.color = this.settings.textColor;
            buyerName.style.fontSize = `${this.settings.nameFontSize}px`;
        }

        if (buyerLocation) {
            buyerLocation.style.color = this.settings.locationColor;
            buyerLocation.style.fontSize = `${this.settings.locationFontSize}px`;
        }

        if (purchasedText) {
            purchasedText.style.color = this.settings.accentColor;
            purchasedText.style.fontSize = `${this.settings.locationFontSize}px`;
        }

        if (productName) {
            productName.style.color = this.settings.textColor;
            productName.style.fontSize = `${this.settings.productFontSize}px`;
        }

        if (productPrice) {
            productPrice.style.color = this.settings.priceColor;
            productPrice.style.fontSize = `${this.settings.priceFontSize}px`;
        }

        if (timeAgo) {
            timeAgo.style.color = this.settings.timeColor;
            timeAgo.style.fontSize = `${this.settings.timeFontSize}px`;
        }
    }

    observeResize() {
        if ('ResizeObserver' in window) {
            const resizeObserver = new ResizeObserver(() => {
                this.adjustToSize();
            });
            resizeObserver.observe(this);
        }
    }

    adjustToSize() {
        const container = this.querySelector('.popup-container');
        if (container) {
            const rect = this.getBoundingClientRect();
            if (rect.width < 320) {
                container.style.maxWidth = `${rect.width - 20}px`;
            }
        }
    }

    async loadOrders() {
        console.log('Waiting for orders data...');
    }

    startRotation() {
        if (this.allPurchases.length === 0) return;

        setTimeout(() => {
            this.showNextPurchase();
        }, 3000);

        this.rotationInterval = setInterval(() => {
            if (!this.isVisible) {
                this.showNextPurchase();
            }
        }, this.settings.delayBetweenPopups);
    }

    showNextPurchase() {
        if (this.allPurchases.length === 0) return;

        const purchase = this.allPurchases[this.currentIndex];
        this.displayPurchase(purchase);

        this.currentIndex = (this.currentIndex + 1) % this.allPurchases.length;

        this.hideTimeout = setTimeout(() => {
            this.hidePopup();
        }, this.settings.displayDuration);
    }

    displayPurchase(purchase) {
        const container = this.querySelector('.popup-container');
        const image = this.querySelector('.product-image');
        const buyerName = this.querySelector('.buyer-name');
        const buyerLocation = this.querySelector('.buyer-location');
        const productName = this.querySelector('.product-name');
        const productPrice = this.querySelector('.product-price');
        const timeAgo = this.querySelector('.time-ago');

        // Set buyer name
        const displayName = this.settings.showName ? purchase.buyerName : 'Someone';
        buyerName.textContent = displayName;

        // Set location
        buyerLocation.textContent = `from ${purchase.location}`;

        // Set product image
        if (purchase.imageUrl) {
            image.src = purchase.imageUrl;
            image.style.display = 'block';
        } else {
            image.style.display = 'none';
        }

        // Set product name
        productName.textContent = purchase.productName;

        // Set price
        productPrice.textContent = purchase.price;

        // Set time ago
        timeAgo.textContent = this.getTimeAgo(purchase.purchaseDate);

        // Make clickable
        const content = this.querySelector('.popup-content');
        content.onclick = () => {
            if (purchase.productId) {
                this.navigateToProduct(purchase.productId);
            }
        };

        // Show popup
        container.style.display = 'block';
        this.isVisible = true;

        console.log(`Showing: ${purchase.productName} by ${displayName}`);
    }

    hidePopup() {
        const container = this.querySelector('.popup-container');
        if (container) {
            container.style.animation = 'slideOut 0.5s ease-out';
            setTimeout(() => {
                container.style.display = 'none';
                container.style.animation = 'slideIn 0.5s ease-out';
                this.isVisible = false;
            }, 500);
        }
    }

    navigateToProduct(productId) {
        const productUrl = `/product-page?productId=${productId}`;
        window.location.href = productUrl;
    }

    getTimeAgo(dateString) {
        try {
            const purchaseDate = new Date(dateString);
            const now = new Date();
            const diffMs = now - purchaseDate;
            const diffSeconds = Math.floor(diffMs / 1000);
            const diffMinutes = Math.floor(diffSeconds / 60);
            const diffHours = Math.floor(diffMinutes / 60);
            const diffDays = Math.floor(diffHours / 24);

            if (diffSeconds < 60) return 'Just now';
            if (diffMinutes < 60) return `${diffMinutes}m ago`;
            if (diffHours < 24) return `${diffHours}h ago`;
            if (diffDays < 7) return `${diffDays}d ago`;
            const diffWeeks = Math.floor(diffDays / 7);
            return `${diffWeeks}w ago`;
        } catch (error) {
            console.error('Error calculating time ago:', error);
            return 'Recently';
        }
    }

    disconnectedCallback() {
        if (this.rotationInterval) {
            clearInterval(this.rotationInterval);
        }
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
        }
    }
}

customElements.define('recent-orders-popup', RecentOrdersPopupElement);
