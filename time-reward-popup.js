class TimeRewardPopupElement extends HTMLElement {
    constructor() {
        super();
        this.timerSeconds = 60;
        this.currentTime = 0;
        this.timerActive = false;
        this.popupShown = false;
        this.settings = {
            enabled: true,
            showClock: true,
            position: 'bottom-right',
            marginV: 20,
            marginH: 20,
            primaryColor: '#6366f1',
            secondaryColor: '#a855f7',
            textColor: '#ffffff',
            headingText: "Loyalty Reward!",
            messageText: "Thanks for staying! Here is a gift:",
            couponCode: "STAY5",
            offerMinutes: 1
        };
        this.interval = null;
    }

    connectedCallback() {
        this.render();
    }

    static get observedAttributes() {
        return ['options'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'options' && newValue) {
            const newSettings = JSON.parse(newValue);
            Object.assign(this.settings, newSettings);
            this.timerSeconds = this.settings.offerMinutes * 60;
            this.updateUI();
            if (!this.timerActive && !this.popupShown) this.startTimer();
        }
    }

    startTimer() {
        this.timerActive = true;
        this.currentTime = 0;
        
        if (this.interval) clearInterval(this.interval);
        
        this.interval = setInterval(() => {
            this.currentTime++;
            this.updateClockProgress();

            if (this.currentTime >= this.timerSeconds) {
                this.showPopup();
                clearInterval(this.interval);
            }
        }, 1000);
    }

    render() {
        this.innerHTML = `
            <style>
                :host { --p-color: ${this.settings.primaryColor}; --s-color: ${this.settings.secondaryColor}; }
                
                .clock-trigger {
                    position: fixed;
                    width: 70px;
                    height: 70px;
                    background: #111;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    z-index: 99999;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.3);
                    border: 2px solid rgba(255,255,255,0.1);
                    transition: transform 0.3s ease;
                }

                .progress-ring {
                    position: absolute;
                    top: -2px; left: -2px;
                    transform: rotate(-90deg);
                }

                .progress-ring circle {
                    stroke: var(--p-color);
                    stroke-dasharray: 220;
                    stroke-dashoffset: 220;
                    transition: stroke-dashoffset 1s linear;
                }

                .time-text {
                    color: white;
                    font-family: sans-serif;
                    font-size: 12px;
                    font-weight: bold;
                    text-align: center;
                }

                .reward-popup-overlay {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);
                    display: none; align-items: center; justify-content: center; z-index: 100000;
                }

                .reward-card {
                    background: #1a1a1a;
                    width: 90%; max-width: 400px;
                    border-radius: 30px;
                    padding: 40px;
                    text-align: center;
                    position: relative;
                    border: 1px solid rgba(255,255,255,0.1);
                    color: white;
                    transform: scale(0.8); transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }

                .reward-popup-overlay.active { display: flex; }
                .reward-popup-overlay.active .reward-card { transform: scale(1); }

                .coupon-tag {
                    background: linear-gradient(135deg, var(--p-color), var(--s-color));
                    padding: 20px; border-radius: 15px; margin: 25px 0;
                    font-size: 28px; font-weight: 900; letter-spacing: 4px;
                    border: 2px dashed rgba(255,255,255,0.4);
                }

                .close-reward { position: absolute; top: 20px; right: 20px; cursor: pointer; opacity: 0.5; }
            </style>

            <div class="clock-trigger" id="floatingClock">
                <svg class="progress-ring" width="74" height="74">
                    <circle id="ring" stroke-width="4" fill="transparent" r="35" cx="37" cy="37"/>
                </svg>
                <div class="time-text" id="timeDisplay">0%</div>
            </div>

            <div class="reward-popup-overlay" id="rewardOverlay">
                <div class="reward-card">
                    <div class="close-reward" id="closeReward">✕</div>
                    <div style="font-size: 50px;">🎁</div>
                    <h2 id="popHeading" style="margin: 10px 0;"></h2>
                    <p id="popMessage" style="opacity: 0.8;"></p>
                    <div class="coupon-tag" id="popCoupon"></div>
                    <button id="copyBtn" style="background: white; color: black; border: none; padding: 12px 25px; border-radius: 50px; font-weight: bold; cursor: pointer;">Copy & Close</button>
                </div>
            </div>
        `;

        this.setupListeners();
    }

    setupListeners() {
        this.querySelector('#closeReward').onclick = () => this.closePopup();
        this.querySelector('#copyBtn').onclick = () => {
            navigator.clipboard.writeText(this.settings.couponCode);
            this.closePopup();
        };
    }

    updateUI() {
        const clock = this.querySelector('#floatingClock');
        if (!clock) return;

        // Position Logic
        clock.style.top = 'auto'; clock.style.bottom = 'auto';
        clock.style.left = 'auto'; clock.style.right = 'auto';

        const [v, h] = this.settings.position.split('-');
        clock.style[v] = `${this.settings.marginV}px`;
        clock.style[h] = `${this.settings.marginH}px`;
        
        clock.style.display = this.settings.showClock ? 'flex' : 'none';
        
        this.style.setProperty('--p-color', this.settings.primaryColor);
        this.style.setProperty('--s-color', this.settings.secondaryColor);

        this.querySelector('#popHeading').textContent = this.settings.headingText;
        this.querySelector('#popMessage').textContent = this.settings.messageText;
        this.querySelector('#popCoupon').textContent = this.settings.couponCode;
    }

    updateClockProgress() {
        const percent = (this.currentTime / this.timerSeconds) * 100;
        const ring = this.querySelector('#ring');
        const display = this.querySelector('#timeDisplay');
        
        if (ring) {
            const offset = 220 - (percent / 100 * 220);
            ring.style.strokeDashoffset = offset;
        }
        if (display) display.textContent = Math.round(percent) + '%';
    }

    showPopup() {
        this.popupShown = true;
        this.querySelector('#rewardOverlay').classList.add('active');
        this.querySelector('#floatingClock').style.display = 'none';
    }

    closePopup() {
        this.querySelector('#rewardOverlay').classList.remove('active');
    }
}

customElements.define('time-reward-popup', TimeRewardPopupElement);
