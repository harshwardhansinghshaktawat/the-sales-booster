class RecentOrdersPopupElement extends HTMLElement {
    constructor() {
        super();
        this.currentIndex = 0;
        this.allPurchases = [];
        this.rotationInterval = null;
        this.hideTimeout = null;
        this.isVisible = false;
        
        this.settings = {
            backgroundColor: '#ffffff',
            textColor: '#333333',
            accentColor: '#3498db',
            priceColor: '#e74c3c',
            locationColor: '#7f8c8d',
            timeColor: '#95a5a6',
            borderColor: '#e0e0e0',
            fontFamily: 'Arial, sans-serif',
            fontSize: 14,
            displayDuration: 8000,
            delayBetweenPopups: 15000,
            showName: true,
            maxOrders: 20,
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
                    if (this.allPurchases.length > 0 && !this.rotationInterval) {
                        this.startRotation();
                    }
                } catch (e) {
                    // Silent error
                }
            } else if (name === 'options') {
                try {
                    const newOptions = JSON.parse(newValue);
                    Object.assign(this.settings, newOptions);
                    this.updateStyles();
                } catch (e) {
                    // Silent error
                }
            }
        }
    }

    render() {
        this.innerHTML = `
            <div class="popup-container" style="display: none;">
                <div class="popup-content">
                    <img class="product-image" src="" alt="Product">
                    <div class="popup-text"></div>
                </div>
            </div>
        `;

        this.applyBaseStyles();
        this.updateStyles();
    }

    applyBaseStyles() {
        const style = document.createElement('style');
        style.textContent = `
            :host {
                display: block;
                width: 100%;
                height: 100%;
                position: relative;
            }
            
            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }
            
            .popup-container {
                width: 100%;
                height: 100%;
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
                align-items: center;
                gap: 12px;
                width: 100%;
                height: 100%;
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
            
            .popup-text {
                flex: 1;
                min-width: 0;
                line-height: 1.4;
                overflow: hidden;
                text-overflow: ellipsis;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                word-wrap: break-word;
            }
        `;
        this.appendChild(style);
    }

    updateStyles() {
        const content = this.querySelector('.popup-content');
        const image = this.querySelector('.product-image');
        const text = this.querySelector('.popup-text');

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

        if (text) {
            text.style.color = this.settings.textColor;
            text.style.fontSize = `${this.settings.fontSize}px`;
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
        const rect = this.getBoundingClientRect();
        const text = this.querySelector('.popup-text');
        if (text && rect.height < 80) {
            text.style.webkitLineClamp = '2';
        } else if (text) {
            text.style.webkitLineClamp = '3';
        }
    }

    async loadOrders() {
        // Waiting for orders
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
        const text = this.querySelector('.popup-text');

        // Build complete message
        const displayName = this.settings.showName ? purchase.buyerName : 'Someone';
        const message = `${displayName} from ${purchase.location} recently purchased ${purchase.productName} for ${purchase.price} • ${this.getTimeAgo(purchase.purchaseDate)}`;

        // Set text
        text.textContent = message;

        // Set product image
        if (purchase.imageUrl) {
            image.src = purchase.imageUrl;
            image.style.display = 'block';
        } else {
            image.style.display = 'none';
        }

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
