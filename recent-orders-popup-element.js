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
            nameColor: '#2c3e50',
            productColor: '#3498db',
            locationColor: '#7f8c8d',
            timeColor: '#95a5a6',
            borderColor: '#e0e0e0',
            badgeColor: '#2ecc71',
            fontFamily: 'Arial, sans-serif',
            fontSize: 14,
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
            paddingSize: 16
        };
    }

    connectedCallback() {
        this.render();
        this.showPlaceholder();
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
                    if (this.allPurchases.length > 0) {
                        if (!this.rotationInterval) {
                            this.startRotation();
                        }
                    } else {
                        this.showPlaceholder();
                    }
                } catch (e) {
                    this.showPlaceholder();
                }
            } else if (name === 'options') {
                try {
                    const newOptions = JSON.parse(newValue);
                    Object.assign(this.settings, newOptions);
                    this.updateStyles();
                    this.updatePosition();
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
                    align-items: center;
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
                
                .verified-badge {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    font-weight: bold;
                    color: white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                    z-index: 10;
                }
                
                .verified-badge::before {
                    content: '✓';
                }
                
                .product-image {
                    width: 70px;
                    height: 70px;
                    min-width: 70px;
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
                    gap: 6px;
                    overflow: hidden;
                }
                
                .info-text {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    line-height: 1.4;
                }
                
                .customer-name {
                    font-weight: 600;
                }
                
                .customer-location {
                    font-size: 0.85em;
                }
                
                .purchase-label {
                    font-size: 0.75em;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    font-weight: 600;
                    opacity: 0.7;
                }
                
                .product-name {
                    font-weight: 600;
                }
                
                .bottom-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
                    overflow: hidden;
                }
                
                .product-price {
                    font-weight: 700;
                    font-size: 1.1em;
                    white-space: nowrap;
                    flex-shrink: 0;
                }
                
                .time-ago {
                    font-size: 0.8em;
                    opacity: 0.7;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    flex-shrink: 1;
                    min-width: 0;
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
                    
                    .product-image {
                        width: 60px;
                        height: 60px;
                        min-width: 60px;
                    }
                    
                    .verified-badge {
                        width: 24px;
                        height: 24px;
                        font-size: 12px;
                        top: 6px;
                        right: 6px;
                    }
                }
            </style>
            
            <div class="popup-container">
                <div class="popup-content">
                    <div class="verified-badge"></div>
                    <img class="product-image" src="" alt="Product">
                    <div class="popup-info">
                        <div class="info-text customer-name"></div>
                        <div class="info-text customer-location"></div>
                        <div class="info-text purchase-label">Recently Purchased</div>
                        <div class="info-text product-name"></div>
                        <div class="bottom-row">
                            <div class="product-price"></div>
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
        const customerName = this.querySelector('.customer-name');
        const customerLocation = this.querySelector('.customer-location');
        const purchaseLabel = this.querySelector('.purchase-label');
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

        if (badge) {
            badge.style.backgroundColor = this.settings.badgeColor;
            badge.style.display = this.settings.showBadge ? 'flex' : 'none';
        }

        if (image) {
            image.style.borderRadius = `${Math.max(4, this.settings.borderRadius / 2)}px`;
        }

        if (customerName) {
            customerName.style.color = this.settings.nameColor;
            customerName.style.fontSize = `${this.settings.fontSize}px`;
        }

        if (customerLocation) {
            customerLocation.style.color = this.settings.locationColor;
            customerLocation.style.fontSize = `${this.settings.fontSize * 0.85}px`;
        }

        if (purchaseLabel) {
            purchaseLabel.style.color = this.settings.textColor;
            purchaseLabel.style.fontSize = `${this.settings.fontSize * 0.75}px`;
        }

        if (productName) {
            productName.style.color = this.settings.productColor;
            productName.style.fontSize = `${this.settings.fontSize}px`;
        }

        if (productPrice) {
            productPrice.style.color = this.settings.textColor;
            productPrice.style.fontSize = `${this.settings.fontSize * 1.1}px`;
        }

        if (timeAgo) {
            timeAgo.style.color = this.settings.timeColor;
            timeAgo.style.fontSize = `${this.settings.fontSize * 0.8}px`;
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

    showPlaceholder() {
        const customerName = this.querySelector('.customer-name');
        const customerLocation = this.querySelector('.customer-location');
        const productName = this.querySelector('.product-name');
        const productPrice = this.querySelector('.product-price');
        const timeAgo = this.querySelector('.time-ago');
        const image = this.querySelector('.product-image');
        const container = this.querySelector('.popup-container');
        
        if (customerName) customerName.textContent = 'John Doe';
        if (customerLocation) customerLocation.textContent = 'from New York, USA';
        if (productName) productName.textContent = 'Premium Wireless Headphones';
        if (productPrice) productPrice.textContent = '$99.00';
        if (timeAgo) timeAgo.textContent = '5m ago';
        
        if (image) {
            image.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop';
            image.style.display = 'block';
        }
        
        if (container) {
            container.classList.add('visible');
        }
        
        this.isVisible = true;
    }

    async loadOrders() {
        // Waiting
    }

    startRotation() {
        if (this.allPurchases.length === 0) {
            this.showPlaceholder();
            return;
        }

        if (!this.settings.sticky) {
            this.showNextPurchase();

            this.rotationInterval = setInterval(() => {
                if (!this.isVisible) {
                    this.showNextPurchase();
                }
            }, this.settings.delayBetweenPopups);
        } else {
            this.showNextPurchase();
        }
    }

    showNextPurchase() {
        if (this.allPurchases.length === 0) {
            this.showPlaceholder();
            return;
        }

        const purchase = this.allPurchases[this.currentIndex];
        this.displayPurchase(purchase);

        this.currentIndex = (this.currentIndex + 1) % this.allPurchases.length;

        if (!this.settings.sticky) {
            this.hideTimeout = setTimeout(() => {
                this.hidePopup();
            }, this.settings.displayDuration);
        }
    }

    displayPurchase(purchase) {
        const container = this.querySelector('.popup-container');
        const customerName = this.querySelector('.customer-name');
        const customerLocation = this.querySelector('.customer-location');
        const productName = this.querySelector('.product-name');
        const productPrice = this.querySelector('.product-price');
        const timeAgo = this.querySelector('.time-ago');
        const image = this.querySelector('.product-image');

        const displayName = this.settings.showName ? purchase.buyerName : 'Someone';
        
        if (customerName) customerName.textContent = displayName;
        if (customerLocation) customerLocation.textContent = `from ${purchase.location}`;
        if (productName) productName.textContent = purchase.productName;
        if (productPrice) productPrice.textContent = purchase.price;
        if (timeAgo) timeAgo.textContent = this.getTimeAgo(purchase.purchaseDate);

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
                if (purchase.productId) {
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
        if (this.rotationInterval) {
            clearInterval(this.rotationInterval);
        }
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
        }
        window.removeEventListener('resize', () => this.updatePosition());
    }
}

customElements.define('recent-orders-popup', RecentOrdersPopupElement);
