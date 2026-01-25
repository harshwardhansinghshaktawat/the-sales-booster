class TabAttentionElement extends HTMLElement {
    constructor() {
        super();
        this.originalTitle = '';
        this.settings = {
            awayMessage: '👋 Come back! We miss you!',
            enabled: true
        };
        this.isAway = false;
        this.blinkInterval = null;
        this.blinkState = false;
    }

    connectedCallback() {
        this.render();
        this.initialize();
    }

    static get observedAttributes() {
        return ['options'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (newValue && newValue !== oldValue && name === 'options') {
            try {
                const newSettings = JSON.parse(newValue);
                Object.assign(this.settings, newSettings);
                
                // If disabled, restore original title
                if (!this.settings.enabled && this.isAway) {
                    this.restoreTitle();
                }
            } catch (e) {
                // Silent
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
            </style>
        `;
    }

    initialize() {
        // Store the original page title
        this.originalTitle = document.title;

        // Listen for visibility changes
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });

        // Also listen for blur/focus events as backup
        window.addEventListener('blur', () => {
            this.handleWindowBlur();
        });

        window.addEventListener('focus', () => {
            this.handleWindowFocus();
        });
    }

    handleVisibilityChange() {
        if (document.hidden) {
            // User switched away from tab
            this.setAwayMessage();
        } else {
            // User returned to tab
            this.restoreTitle();
        }
    }

    handleWindowBlur() {
        // Additional check when window loses focus
        setTimeout(() => {
            if (document.hidden && this.settings.enabled) {
                this.setAwayMessage();
            }
        }, 100);
    }

    handleWindowFocus() {
        // Restore when window gains focus
        this.restoreTitle();
    }

    setAwayMessage() {
        if (!this.settings.enabled) return;

        this.isAway = true;
        
        // Start blinking animation
        this.startBlinking();
    }

    startBlinking() {
        // Clear any existing interval
        if (this.blinkInterval) {
            clearInterval(this.blinkInterval);
        }

        // Alternate between message and empty/original
        this.blinkInterval = setInterval(() => {
            if (this.blinkState) {
                document.title = this.settings.awayMessage;
            } else {
                document.title = '...';
            }
            this.blinkState = !this.blinkState;
        }, 1000); // Blink every 1 second
    }

    restoreTitle() {
        this.isAway = false;
        this.blinkState = false;

        // Stop blinking
        if (this.blinkInterval) {
            clearInterval(this.blinkInterval);
            this.blinkInterval = null;
        }

        // Restore original title
        document.title = this.originalTitle;
    }

    disconnectedCallback() {
        // Cleanup
        this.restoreTitle();
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        window.removeEventListener('blur', this.handleWindowBlur);
        window.removeEventListener('focus', this.handleWindowFocus);
    }
}

customElements.define('tab-attention-element', TabAttentionElement);
