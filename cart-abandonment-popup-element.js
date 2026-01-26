class CartAbandonmentPopupElement extends HTMLElement {
    constructor() {
        super();
        this.hasCartItems = false;
        this.popupShown = false;
        this.settings = {
            enabled: true,
            popupStyle: 'urgency',
            primaryBg: '#1a1a2e',
            secondaryBg: '#16213e',
            headingColor: '#ffffff',
            textColor: '#e0e0e0',
            borderColor: '#0f3460',
            primaryAccent: '#e94560',
            secondaryAccent: '#00d4ff',
            countdownMinutes: 15,
            couponCode: 'STAY10',
            discountPercent: 10,
            headingText: "Wait! Don't Leave Yet!",
            messageText: "Your items are waiting for you!",
            buttonText: "Complete My Order",
            benefit1: "Free shipping on orders over $50",
            benefit2: "30-day money-back guarantee",
            benefit3: "Secure checkout with SSL encryption",
            benefit4: "24/7 customer support",
            benefit5: "Exclusive member rewards"
        };
        this.countdownInterval = null;
        this.timeLeft = 0;
        this.isEditorMode = false;
    }

    connectedCallback() {
        this.render();
        this.setupExitIntent();
        this.checkEditorMode();
    }

    static get observedAttributes() {
        return ['cart-items', 'options', 'editor-mode'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (newValue && newValue !== oldValue) {
            if (name === 'cart-items') {
                try {
                    const cartData = JSON.parse(newValue);
                    const hasItems = cartData && cartData.length > 0;
                    
                    if (hasItems !== this.hasCartItems) {
                        this.popupShown = false;
                        console.log('Cart status changed. Has items:', hasItems);
                    }
                    
                    this.hasCartItems = hasItems;
                } catch (e) {
                    this.hasCartItems = false;
                }
            } else if (name === 'options') {
                try {
                    const newSettings = JSON.parse(newValue);
                    Object.assign(this.settings, newSettings);
                    this.updateStyles();
                } catch (e) {
                    // Silent
                }
            } else if (name === 'editor-mode') {
                this.isEditorMode = newValue === 'true';
                console.log('Editor mode:', this.isEditorMode);
                
                // Show popup in editor mode when enabled
                if (this.isEditorMode && this.settings.enabled) {
                    this.showPopupForEditor();
                }
            }
        }
    }

    checkEditorMode() {
        // Check if we're in editor mode
        try {
            if (window.location.href.includes('editorx.com') || 
                window.location.href.includes('wix.com/editor') ||
                window.parent !== window) {
                this.isEditorMode = true;
            }
        } catch (e) {
            // Cross-origin error means we're in iframe (editor)
            this.isEditorMode = true;
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
                
                .popup-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(10px);
                    z-index: 999999;
                    display: none;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                
                .popup-overlay.active {
                    display: flex;
                    opacity: 1;
                }
                
                .popup-container {
                    max-width: 600px;
                    width: 90%;
                    border-radius: 24px;
                    overflow: hidden;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    transform: scale(0.9);
                    transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                    position: relative;
                }
                
                .popup-overlay.active .popup-container {
                    transform: scale(1);
                }
                
                .popup-header {
                    padding: 40px 40px 30px;
                    text-align: center;
                    position: relative;
                }
                
                .popup-header::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, var(--primary-accent), var(--secondary-accent));
                }
                
                .close-btn {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.1);
                    border: 2px solid var(--border-color);
                    color: var(--text-color);
                    font-size: 20px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                }
                
                .close-btn:hover {
                    background: var(--primary-accent);
                    color: white;
                    transform: rotate(90deg);
                }
                
                .icon-wrapper {
                    width: 80px;
                    height: 80px;
                    margin: 0 auto 20px;
                    background: linear-gradient(135deg, var(--primary-accent), var(--secondary-accent));
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 40px;
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                
                .popup-heading {
                    font-size: 32px;
                    font-weight: 800;
                    margin-bottom: 16px;
                    line-height: 1.2;
                    background: linear-gradient(135deg, var(--primary-accent), var(--secondary-accent));
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                
                .popup-message {
                    font-size: 18px;
                    line-height: 1.6;
                    opacity: 0.9;
                }
                
                .popup-body {
                    padding: 0 40px 40px;
                }
                
                .feature-box {
                    padding: 24px;
                    border-radius: 16px;
                    margin-bottom: 24px;
                    border: 2px solid var(--border-color);
                    text-align: center;
                    background: rgba(255, 255, 255, 0.03);
                }
                
                .countdown-timer {
                    font-size: 48px;
                    font-weight: 800;
                    color: var(--primary-accent);
                    margin: 16px 0;
                    font-family: 'Courier New', monospace;
                    letter-spacing: 4px;
                }
                
                .countdown-label {
                    font-size: 14px;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    opacity: 0.7;
                }
                
                .coupon-box {
                    background: linear-gradient(135deg, var(--primary-accent)20, var(--secondary-accent)20);
                    border: 3px dashed var(--primary-accent);
                    padding: 24px;
                    border-radius: 16px;
                    margin: 24px 0;
                }
                
                .coupon-code {
                    font-size: 36px;
                    font-weight: 900;
                    letter-spacing: 6px;
                    color: var(--primary-accent);
                    margin: 12px 0;
                    font-family: 'Courier New', monospace;
                }
                
                .discount-badge {
                    display: inline-block;
                    background: var(--primary-accent);
                    color: white;
                    padding: 8px 20px;
                    border-radius: 24px;
                    font-weight: 700;
                    font-size: 18px;
                    margin-bottom: 12px;
                }
                
                .benefits-list {
                    text-align: left;
                    margin: 24px 0;
                }
                
                .benefit-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 16px;
                    font-size: 16px;
                }
                
                .benefit-icon {
                    width: 24px;
                    height: 24px;
                    background: var(--secondary-accent);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 14px;
                    flex-shrink: 0;
                }
                
                .action-button {
                    width: 100%;
                    padding: 18px 32px;
                    border-radius: 12px;
                    border: none;
                    font-size: 18px;
                    font-weight: 700;
                    cursor: pointer;
                    background: linear-gradient(135deg, var(--primary-accent), var(--secondary-accent));
                    color: white;
                    transition: all 0.3s ease;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
                }
                
                .action-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
                }
                
                .secondary-action {
                    text-align: center;
                    margin-top: 16px;
                    font-size: 14px;
                }
                
                .secondary-link {
                    color: var(--secondary-accent);
                    text-decoration: none;
                    cursor: pointer;
                    transition: opacity 0.3s ease;
                }
                
                .secondary-link:hover {
                    opacity: 0.8;
                }
                
                @media (max-width: 640px) {
                    .popup-container {
                        width: 95%;
                        max-width: none;
                    }
                    
                    .popup-header {
                        padding: 30px 20px 20px;
                    }
                    
                    .popup-body {
                        padding: 0 20px 30px;
                    }
                    
                    .popup-heading {
                        font-size: 24px;
                    }
                    
                    .popup-message {
                        font-size: 16px;
                    }
                    
                    .icon-wrapper {
                        width: 60px;
                        height: 60px;
                        font-size: 30px;
                    }
                    
                    .countdown-timer {
                        font-size: 36px;
                    }
                    
                    .coupon-code {
                        font-size: 24px;
                        letter-spacing: 3px;
                    }
                }
            </style>
            
            <div class="popup-overlay">
                <div class="popup-container">
                    <div class="popup-header">
                        <button class="close-btn">×</button>
                        <div class="icon-wrapper">🛒</div>
                        <h2 class="popup-heading"></h2>
                        <p class="popup-message"></p>
                    </div>
                    <div class="popup-body">
                        <div class="dynamic-content"></div>
                        <button class="action-button"></button>
                        <div class="secondary-action">
                            <a class="secondary-link">No thanks, I'll leave</a>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.updateStyles();
    }

    setupEventListeners() {
        const closeBtn = this.querySelector('.close-btn');
        const overlay = this.querySelector('.popup-overlay');
        const actionBtn = this.querySelector('.action-button');
        const secondaryLink = this.querySelector('.secondary-link');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                // In editor mode, don't actually close - just for preview
                if (!this.isEditorMode) {
                    this.closePopup();
                }
            });
        }

        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay && !this.isEditorMode) {
                    this.closePopup();
                }
            });
        }

        if (actionBtn) {
            actionBtn.addEventListener('click', () => {
                if (!this.isEditorMode) {
                    window.location.href = '/cart-page';
                }
            });
        }

        if (secondaryLink) {
            secondaryLink.addEventListener('click', () => {
                if (!this.isEditorMode) {
                    this.closePopup();
                }
            });
        }
    }

    setupExitIntent() {
        const handleBeforeUnload = (e) => {
            if (this.isEditorMode || !this.settings.enabled || !this.hasCartItems || this.popupShown) {
                return;
            }

            this.showPopup();
            this.popupShown = true;

            e.preventDefault();
            e.returnValue = '';
            return '';
        };

        const handleMouseLeave = (e) => {
            if (this.isEditorMode || !this.settings.enabled || !this.hasCartItems || this.popupShown) {
                return;
            }

            if (e.clientY <= 0) {
                this.showPopup();
                this.popupShown = true;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('mouseleave', handleMouseLeave);
    }

    updateStyles() {
        const container = this.querySelector('.popup-container');
        const header = this.querySelector('.popup-header');
        const body = this.querySelector('.popup-body');

        if (container) {
            container.style.setProperty('--primary-bg', this.settings.primaryBg);
            container.style.setProperty('--secondary-bg', this.settings.secondaryBg);
            container.style.setProperty('--heading-color', this.settings.headingColor);
            container.style.setProperty('--text-color', this.settings.textColor);
            container.style.setProperty('--border-color', this.settings.borderColor);
            container.style.setProperty('--primary-accent', this.settings.primaryAccent);
            container.style.setProperty('--secondary-accent', this.settings.secondaryAccent);
        }

        if (header) {
            header.style.backgroundColor = this.settings.primaryBg;
            header.style.color = this.settings.headingColor;
        }

        if (body) {
            body.style.backgroundColor = this.settings.secondaryBg;
            body.style.color = this.settings.textColor;
        }

        this.updateContent();
    }

    updateContent() {
        const heading = this.querySelector('.popup-heading');
        const message = this.querySelector('.popup-message');
        const actionBtn = this.querySelector('.action-button');
        const dynamicContent = this.querySelector('.dynamic-content');

        if (heading) {
            heading.textContent = this.settings.headingText;
        }

        if (message) {
            message.textContent = this.settings.messageText;
        }

        if (actionBtn) {
            actionBtn.textContent = this.settings.buttonText;
        }

        if (dynamicContent) {
            dynamicContent.innerHTML = this.getContentByStyle();
        }
    }

    getContentByStyle() {
        switch (this.settings.popupStyle) {
            case 'urgency':
                return this.getUrgencyContent();
            case 'coupon':
                return this.getCouponContent();
            case 'encouragement':
                return this.getEncouragementContent();
            default:
                return this.getUrgencyContent();
        }
    }

    getUrgencyContent() {
        this.timeLeft = this.settings.countdownMinutes * 60;
        
        return `
            <div class="feature-box">
                <div class="countdown-label">⏰ Your Cart Expires In:</div>
                <div class="countdown-timer" id="countdown">--:--</div>
                <div class="countdown-label">Don't lose your items!</div>
            </div>
        `;
    }

    getCouponContent() {
        return `
            <div class="coupon-box">
                <div class="discount-badge">🎉 ${this.settings.discountPercent}% OFF</div>
                <div style="font-size: 16px; margin-bottom: 8px;">Use code:</div>
                <div class="coupon-code">${this.settings.couponCode}</div>
                <div style="font-size: 14px; opacity: 0.8; margin-top: 8px;">
                    Complete your order now and save!
                </div>
            </div>
        `;
    }

    getEncouragementContent() {
        const benefits = [
            this.settings.benefit1,
            this.settings.benefit2,
            this.settings.benefit3,
            this.settings.benefit4,
            this.settings.benefit5
        ].filter(b => b && b.trim());

        return `
            <div class="benefits-list">
                ${benefits.map(benefit => `
                    <div class="benefit-item">
                        <div class="benefit-icon">✓</div>
                        <div>${benefit}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    showPopupForEditor() {
        // Show popup immediately in editor mode for design preview
        const overlay = this.querySelector('.popup-overlay');
        if (overlay) {
            overlay.classList.add('active');
            
            if (this.settings.popupStyle === 'urgency') {
                this.startCountdown();
            }
        }
    }

    showPopup() {
        const overlay = this.querySelector('.popup-overlay');
        if (overlay) {
            overlay.classList.add('active');
            
            if (this.settings.popupStyle === 'urgency') {
                this.startCountdown();
            }
        }
    }

    closePopup() {
        const overlay = this.querySelector('.popup-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            this.stopCountdown();
        }
    }

    startCountdown() {
        this.stopCountdown();
        
        const updateTimer = () => {
            const countdown = this.querySelector('#countdown');
            if (!countdown) return;

            const minutes = Math.floor(this.timeLeft / 60);
            const seconds = this.timeLeft % 60;
            
            countdown.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            if (this.timeLeft <= 0) {
                this.stopCountdown();
                countdown.textContent = 'EXPIRED';
            } else {
                this.timeLeft--;
            }
        };

        updateTimer();
        this.countdownInterval = setInterval(updateTimer, 1000);
    }

    stopCountdown() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
    }

    disconnectedCallback() {
        this.stopCountdown();
    }
}

customElements.define('cart-abandonment-popup', CartAbandonmentPopupElement);
