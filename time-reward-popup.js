class TimeRewardPopup extends HTMLElement {
    constructor() {
        super();
        this.totalSeconds = 60;
        this.timeLeft = 60;
        this.timer = null;
        this.settings = {
            enabled: true,
            showClock: true,
            position: 'bottom-right',
            marginV: 20,
            marginH: 20,
            primaryColor: '#6366f1',
            secondaryColor: '#a855f7',
            headingColor: '#ffffff',
            textColor: '#e0e0e0',
            headingText: "Reward Unlocked!",
            messageText: "Thanks for browsing our collection!",
            couponCode: "SAVE20",
            buttonText: "Copy Code",
            clockMessage: "remaining to unlock reward"
        };
    }

    connectedCallback() {
        this.render();
    }

    static get observedAttributes() { return ['options']; }

    attributeChangedCallback(name, old, newVal) {
        if (newVal && old !== newVal) {
            this.settings = { ...this.settings, ...JSON.parse(newVal) };
            this.totalSeconds = parseInt(this.settings.timerSeconds) || 60;
            this.timeLeft = this.totalSeconds;
            this.updateStyles();
            this.startTimer();
        }
    }

    startTimer() {
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => {
            if (this.timeLeft <= 0) {
                clearInterval(this.timer);
                this.showPopup();
                return;
            }
            this.timeLeft--;
            this.updateClock();
        }, 1000);
    }

    formatTime(s) {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    render() {
        this.innerHTML = `
        <style>
            .time-offer-wrapper {
                position: fixed;
                z-index: 100000;
                font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            }
            .clock-container {
                display: flex; align-items: center; gap: 12px;
                padding: 10px 20px; border-radius: 50px;
                background: rgba(0,0,0,0.8); backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.1); color: white;
                transition: all 0.5s ease;
            }
            .svg-clock { transform: rotate(-90deg); width: 40px; height: 40px; }
            .svg-clock circle {
                fill: none; stroke-width: 3; stroke-linecap: round;
                stroke-dasharray: 100; stroke-dashoffset: 0;
                transition: stroke-dashoffset 1s linear;
            }
            .timer-text-wrap { line-height: 1.2; }
            .time-val { font-weight: 800; font-size: 16px; display: block; }
            .time-label { font-size: 10px; opacity: 0.7; text-transform: uppercase; }

            .offer-overlay {
                position: fixed; top:0; left:0; width:100vw; height:100vh;
                background: rgba(0,0,0,0.9); backdrop-filter: blur(12px);
                display: none; align-items: center; justify-content: center; z-index: 100001;
            }
            .offer-card {
                background: #111; border: 1px solid var(--p-color);
                padding: 40px; border-radius: 30px; text-align: center;
                max-width: 400px; width: 90%; color: white;
                transform: scale(0.7); transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            .offer-overlay.active { display: flex; }
            .offer-overlay.active .offer-card { transform: scale(1); }
            .coupon-box {
                background: linear-gradient(135deg, var(--p-color), var(--s-color));
                padding: 20px; border-radius: 15px; margin: 20px 0;
                font-size: 28px; font-weight: 900; letter-spacing: 2px;
                border: 2px dashed rgba(255,255,255,0.3);
            }
            .copy-btn {
                background: white; color: black; border: none; padding: 12px 30px;
                border-radius: 50px; font-weight: bold; cursor: pointer; width: 100%;
            }
        </style>
        <div class="time-offer-wrapper" id="mainWrap">
            <div class="clock-container" id="clockUI">
                <svg class="svg-clock"><circle id="progress" cx="20" cy="20" r="16" stroke="white"/></svg>
                <div class="timer-text-wrap">
                    <span class="time-val" id="timeStr">0:00</span>
                    <span class="time-label" id="labelStr"></span>
                </div>
            </div>
        </div>
        <div class="offer-overlay" id="overlay">
            <div class="offer-card">
                <h2 id="popHead"></h2>
                <p id="popMsg"></p>
                <div class="coupon-box" id="popCoup"></div>
                <button class="copy-btn" id="copyBtn"></button>
            </div>
        </div>
        `;
        this.setupListeners();
    }

    setupListeners() {
        this.querySelector('#copyBtn').onclick = () => {
            navigator.clipboard.writeText(this.settings.couponCode);
            this.querySelector('#overlay').classList.remove('active');
        };
    }

    updateStyles() {
        const wrap = this.querySelector('#mainWrap');
        const clockUI = this.querySelector('#clockUI');
        if (!wrap) return;

        // Position
        const [v, h] = this.settings.position.split('-');
        wrap.style.top = v === 'top' ? `${this.settings.marginV}px` : 'auto';
        wrap.style.bottom = v === 'bottom' ? `${this.settings.marginV}px` : 'auto';
        wrap.style.left = h === 'left' ? `${this.settings.marginH}px` : 'auto';
        wrap.style.right = h === 'right' ? `${this.settings.marginH}px` : 'auto';

        clockUI.style.display = this.settings.showClock ? 'flex' : 'none';
        this.querySelector('#progress').style.stroke = this.settings.primaryColor;
        this.style.setProperty('--p-color', this.settings.primaryColor);
        this.style.setProperty('--s-color', this.settings.secondaryColor);
        
        // Text
        this.querySelector('#labelStr').textContent = this.settings.clockMessage;
        this.querySelector('#popHead').textContent = this.settings.headingText;
        this.querySelector('#popHead').style.color = this.settings.headingColor;
        this.querySelector('#popMsg').textContent = this.settings.messageText;
        this.querySelector('#popMsg').style.color = this.settings.textColor;
        this.querySelector('#popCoup').textContent = this.settings.couponCode;
        this.querySelector('#copyBtn').textContent = this.settings.buttonText;
    }

    updateClock() {
        const offset = (this.timeLeft / this.totalSeconds) * 100;
        this.querySelector('#progress').style.strokeDashoffset = 100 - offset;
        this.querySelector('#timeStr').textContent = this.formatTime(this.timeLeft);
    }

    showPopup() {
        this.querySelector('#overlay').classList.add('active');
        this.querySelector('#clockUI').style.display = 'none';
    }
}
customElements.define('time-reward-popup', TimeRewardPopup);
