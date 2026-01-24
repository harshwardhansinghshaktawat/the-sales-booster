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
            
            // Fonts
            fontFamily: 'Arial, sans-serif',
            nameFontSize: 16,
            productFontSize: 14,
            priceFontSize: 16,
            locationFontSize: 12,
            timeFontSize: 11,
            
            // Timing
            displayDuration: 8000, // milliseconds
            delayBetweenPopups: 15000, // milliseconds
            
            // Settings
            showName: true,
            maxOrders: 20,
            
            // Styling
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            imageSize: 80,
            paddingSize: 16
        };
    }

    connectedCallback() {
        this.render();
        this.loadOrders();
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
                    <div class="popup-header">
                        <img class="product-image" src="" alt="Product">
                        <div class="header-text">
                            <div class="buyer-name"></div>
                            <div class="buyer-location"></div>
                        </div>
                    </div>
                    <div class="popup-body">
                        <div class="purchased-text">Recently Purchased</div>
                        <div class="product-name"></div>
                        <div class="product-price"></div>
                    </div>
                    <div class="popup-footer">
                        <div class="time-ago"></div>
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
            .popup-container {
                position: fixed;
                bottom: 20px;
                left: 20px;
                z-index: 9999;
                animation: slideIn 0.5s ease-out;
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
                flex-direction: column;
                min-width: 300px;
                max-width: 350px;
                cursor: pointer;
                transition: transform 0.2s ease;
            }
            
            .popup-content:hover {
                transform: scale(1.02);
            }
            
            .popup-header {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 12px;
            }
            
            .product-image {
                object-fit: cover;
                flex-shrink: 0;
            }
            
            .header-text {
                flex: 1;
                min-width: 0;
            }
            
            .buyer-name {
                font-weight: bold;
                margin-bottom: 4px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            .buyer-location {
                font-size: 0.9em;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            .popup-body {
                margin-bottom: 12px;
            }
            
            .purchased-text {
                font-size: 0.85em;
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .product-name {
                font-weight: 600;
                margin-bottom: 8px;
                overflow: hidden;
                text-overflow: ellipsis;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
            }
            
            .product-price {
                font-weight: bold;
            }
            
            .popup-footer {
                display: flex;
                justify-content: flex-end;
            }
            
            .time-ago {
                font-size: 0.85em;
            }
        `;
        this.appendChild(style);
    }

    updateStyles() {
        const container = this.querySelector('.popup-container');
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
            content.style.boxShadow = this.settings.boxShadow;
            content.style.padding = `${this.settings.paddingSize}px`;
            content.style.fontFamily = this.settings.fontFamily;
        }

        if (image) {
            image.style.width = `${this.settings.imageSize}px`;
            image.style.height = `${this.settings.imageSize}px`;
            image.style.borderRadius = `${this.settings.borderRadius / 2}px`;
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

    async loadOrders() {
        // This will be populated by the widget code via attributes
        console.log('Waiting for orders data...');
    }

    startRotation() {
        if (this.allPurchases.length === 0) return;

        // Show first popup after initial delay
        setTimeout(() => {
            this.showNextPurchase();
        }, 3000);

        // Set up rotation interval
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

        // Move to next purchase
        this.currentIndex = (this.currentIndex + 1) % this.allPurchases.length;

        // Auto-hide after display duration
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
