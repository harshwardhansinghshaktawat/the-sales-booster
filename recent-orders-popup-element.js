class RecentOrdersPopupElement extends HTMLElement {
    constructor() {
        super();
        this.currentIndex = 0;
        this.allPurchases = [];
        this.rotationInterval = null;
        this.hideTimeout = null;
        this.isVisible = false;
        this.hasStarted = false;
        
        this.settings = {
            backgroundColor: '#ffffff',
            textColor: '#333333',
            nameColor: '#2c3e50',
            productColor: '#3498db',
            locationColor: '#7f8c8d',
            priceColor: '#333333',
            timeColor: '#95a5a6',
            borderColor: '#e0e0e0',
            badgeColor: '#2ecc71',
            fontFamily: 'Arial, sans-serif',
            mainFontSize: 14,
            timeFontSize: 11,
            imageSize: 70,
            displayDuration: 8000,
            delayBetweenPopups: 15000,
            showName: true,
            showBadge: true,
            sticky: false,
            position: 'bottom-left',
            marginX: 20,
            marginY: 20,
            maxOrders: 20,
            borderRadius: 12,
            borderWidth: 1,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            paddingSize: 16,
            purchaseText: 'just purchased',
            fromText: 'from',
            verifiedText: 'Verified Purchase'
        };
    }

    connectedCallback() {
        this.render();
        this.loadOrders();
        this.setupPositioning();
        window.addEventListener('resize', () => this.updatePosition());
    }

    static get observedAttributes() {
        return ['orders', 'options'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (newValue && newValue !== oldValue) {
            if (name === 'orders') {
                try {
                    this.allPurchases = JSON.parse(newValue);
                    if (this.allPurchases.length > 0 && !this.hasStarted) {
                        this.hasStarted = true;
                        this.startRotation();
                    }
                } catch (e) {
                    // Silent
                }
            } else if (name === 'options') {
                try {
                    const oldSticky = this.settings.sticky;
                    const newOptions = JSON.parse(newValue);
                    Object.assign(this.settings, newOptions);
                    this.updateStyles();
                    this.updatePosition();
                    
                    // If sticky mode changed or is currently sticky, update display
                    if (this.allPurchases.length > 0) {
                        if (this.settings.sticky) {
                            // In sticky mode, ensure popup is visible
                            if (!this.isVisible) {
                                this.showNextPurchase();
                            }
                        } else if (oldSticky && !this.settings.sticky) {
                            // Switched from sticky to non-sticky, restart rotation
                            this.stopRotation();
                            this.hasStarted = false;
                            this.startRotation();
                        }
                    }
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
                    width: 1px;
                    height: 1px;
                    opacity: 0;
                    pointer-events: none;
                    position: absolute;
                }
                
                .popup-container {
                    position: fixed;
                    z-index: 999999;
                    pointer-events: none;
                    display: none;
                }
                
                .popup-container.visible {
                    display: block;
                    pointer-events: auto;
                    animation: slideIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                }
                
                .popup-container.hiding {
                    animation: slideOut 0.3s ease-out forwards;
                }
                
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                
                @keyframes slideOut {
                    from {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                    to {
                        opacity: 0;
                        transform: translateY(20px) scale(0.95);
                    }
                }
                
                .popup-content {
                    position: relative;
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    width: 380px;
                    max-width: calc(100vw - 40px);
                    cursor: pointer;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                    box-sizing: border-box;
                }
                
                .popup-content:hover {
                    transform: translateY(-2px);
                }
                
                .product-image {
                    object-fit: cover;
                    flex-shrink: 0;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                }
                
                .popup-info {
                    flex: 1;
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                .main-message {
                    line-height: 1.5;
                    word-wrap: break-word;
                }
                
                .bottom-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
                    flex-wrap: wrap;
                }
                
                .price-verified {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                
                .product-price {
                    font-weight: 700;
                    font-size: 1.1em;
                    white-space: nowrap;
                }
                
                .verified-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 0.75em;
                    font-weight: 600;
                    color: white;
                    white-space: nowrap;
                }
                
                .verified-badge::before {
                    content: '✓';
                    font-size: 1.1em;
                }
                
                .time-ago {
                    white-space: nowrap;
                    flex-shrink: 0;
                }
                
                @media (max-width: 480px) {
                    .popup-container {
                        left: 10px !important;
                        right: auto !important;
                        bottom: 10px !important;
                        top: auto !important;
                    }
                    
                    .popup-content {
                        width: calc(100vw - 20px);
                        max-width: none;
                    }
                }
            </style>
            
            <div class="popup-container">
                <div class="popup-content">
                    <img class="product-image" src="" alt="Product">
                    <div class="popup-info">
                        <div class="main-message"></div>
                        <div class="bottom-row">
                            <div class="price-verified">
                                <div class="product-price"></div>
                                <div class="verified-badge"></div>
                            </div>
                            <div class="time-ago"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.updateStyles();
        this.updatePosition();
    }

    updateStyles() {
        const content = this.querySelector('.popup-content');
        const badge = this.querySelector('.verified-badge');
        const image = this.querySelector('.product-image');
        const mainMessage = this.querySelector('.main-message');
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

        if (badge) {
            badge.style.backgroundColor = this.settings.badgeColor;
            badge.style.display = this.settings.showBadge ? 'inline-flex' : 'none';
        }

        if (image) {
            const size = this.settings.imageSize || 70;
            image.style.width = `${size}px`;
            image.style.height = `${size}px`;
            image.style.minWidth = `${size}px`;
            image.style.borderRadius = `${Math.max(4, this.settings.borderRadius / 2)}px`;
        }

        if (mainMessage) {
            mainMessage.style.fontSize = `${this.settings.mainFontSize}px`;
        }

        if (productPrice) {
            productPrice.style.color = this.settings.priceColor;
            productPrice.style.fontSize = `${this.settings.mainFontSize * 1.1}px`;
        }

        if (timeAgo) {
            timeAgo.style.color = this.settings.timeColor;
            timeAgo.style.fontSize = `${this.settings.timeFontSize}px`;
        }
    }

    setupPositioning() {
        this.updatePosition();
    }

    updatePosition() {
        const container = this.querySelector('.popup-container');
        if (!container) return;

        const isMobile = window.innerWidth <= 480;
        
        if (isMobile) {
            container.style.left = '10px';
            container.style.right = 'auto';
            container.style.bottom = '10px';
            container.style.top = 'auto';
            return;
        }

        container.style.left = 'auto';
        container.style.right = 'auto';
        container.style.top = 'auto';
        container.style.bottom = 'auto';

        const position = this.settings.position || 'bottom-left';
        const marginX = this.settings.marginX || 20;
        const marginY = this.settings.marginY || 20;

        switch (position) {
            case 'top-left':
                container.style.top = `${marginY}px`;
                container.style.left = `${marginX}px`;
                break;
            case 'top-right':
                container.style.top = `${marginY}px`;
                container.style.right = `${marginX}px`;
                break;
            case 'bottom-left':
                container.style.bottom = `${marginY}px`;
                container.style.left = `${marginX}px`;
                break;
            case 'bottom-right':
                container.style.bottom = `${marginY}px`;
                container.style.right = `${marginX}px`;
                break;
        }
    }

    async loadOrders() {
        // Waiting for orders
    }

    stopRotation() {
        if (this.rotationInterval) {
            clearInterval(this.rotationInterval);
            this.rotationInterval = null;
        }
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
    }

    startRotation() {
        if (this.allPurchases.length === 0) {
            return;
        }

        this.stopRotation();

        if (this.settings.sticky) {
            // Sticky mode: show once and keep visible
            this.showNextPurchase();
        } else {
            // Auto-hide mode: show immediately, then rotate
            this.showNextPurchase();

            this.rotationInterval = setInterval(() => {
                if (!this.isVisible) {
                    this.showNextPurchase();
                }
            }, this.settings.delayBetweenPopups);
        }
    }

    showNextPurchase() {
        if (this.allPurchases.length === 0) {
            return;
        }

        const purchase = this.allPurchases[this.currentIndex];
        this.displayPurchase(purchase);

        // Move to next for rotation
        if (!this.settings.sticky) {
            this.currentIndex = (this.currentIndex + 1) % this.allPurchases.length;
        }

        // Set auto-hide timeout only in non-sticky mode
        if (!this.settings.sticky) {
            if (this.hideTimeout) {
                clearTimeout(this.hideTimeout);
            }
            this.hideTimeout = setTimeout(() => {
                this.hidePopup();
            }, this.settings.displayDuration);
        }
    }

    displayPurchase(purchase) {
        const container = this.querySelector('.popup-container');
        const mainMessage = this.querySelector('.main-message');
        const productPrice = this.querySelector('.product-price');
        const verifiedBadge = this.querySelector('.verified-badge');
        const timeAgo = this.querySelector('.time-ago');
        const image = this.querySelector('.product-image');

        const displayName = this.settings.showName ? purchase.buyerName : 'Someone';
        
        // Build the continuous message with HTML for color styling
        const messageHTML = `
            <span style="color: ${this.settings.nameColor}; font-weight: 600;">${displayName}</span>
            <span style="color: ${this.settings.locationColor};"> ${this.settings.fromText} ${purchase.location}</span>
            <span style="color: ${this.settings.textColor};"> ${this.settings.purchaseText} </span>
            <span style="color: ${this.settings.productColor}; font-weight: 600;">${purchase.productName}</span>
        `;
        
        if (mainMessage) {
            mainMessage.innerHTML = messageHTML;
        }
        
        if (productPrice) {
            productPrice.textContent = purchase.price;
        }
        
        if (verifiedBadge) {
            verifiedBadge.textContent = this.settings.verifiedText;
        }
        
        if (timeAgo) {
            timeAgo.textContent = this.getTimeAgo(purchase.purchaseDate);
        }

        if (image && purchase.imageUrl) {
            image.src = purchase.imageUrl;
            image.style.display = 'block';
        } else if (image) {
            image.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop';
            image.style.display = 'block';
        }

        const content = this.querySelector('.popup-content');
        if (content) {
            content.onclick = () => {
                if (purchase.productUrl) {
                    window.location.href = purchase.productUrl;
                } else if (purchase.productId) {
                    this.navigateToProduct(purchase.productId);
                }
            };
        }

        if (container) {
            container.classList.remove('hiding');
            container.classList.add('visible');
        }
        
        this.isVisible = true;
    }

    hidePopup() {
        const container = this.querySelector('.popup-container');
        
        if (container) {
            container.classList.add('hiding');
            setTimeout(() => {
                container.classList.remove('visible', 'hiding');
                this.isVisible = false;
            }, 300);
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
        this.stopRotation();
        window.removeEventListener('resize', () => this.updatePosition());
    }
}

customElements.define('recent-orders-popup', RecentOrdersPopupElement);
