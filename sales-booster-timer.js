class SalesBoosterTimer extends HTMLElement {
  constructor() {
    super();
    this.endDate = null;
    this.timerInterval = null;
    this.stockCount = 0;
    
    this.styleProps = {
      color1: '#ffffff',
      color2: '#ef4444',
      color3: '#f59e0b',
      color4: '#1f2937',
      color5: '#fef2f2',
      color6: '#3b82f6',
      slider1: '12',
      slider2: '16',
      slider3: '14',
      text1: '🔥 Limited Time Offer!',
      text2: 'Sale Ends In:',
      text3: 'Only {stock} left in stock!',
      text4: 'Hurry! Almost Gone',
      text5: 'Order within {time} to get it by {date}'
    };
  }

  connectedCallback() {
    this.render();
    this.startTimer();
  }

  disconnectedCallback() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  static get observedAttributes() {
    return ['end-date', 'stock-count', 'style-props', 'show-timer', 'show-stock', 'show-shipping'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    
    if (name === 'end-date') {
      this.endDate = newVal ? new Date(newVal) : null;
      this.render();
      this.startTimer();
    }
    
    if (name === 'stock-count') {
      this.stockCount = parseInt(newVal) || 0;
      this.render();
    }
    
    if (name === 'style-props' && newVal) {
      try {
        this.styleProps = { ...this.styleProps, ...JSON.parse(newVal) };
        this.updateStyles();
      } catch (e) {}
    }
  }

  updateStyles() {
    const styleEl = this.querySelector('style');
    if (styleEl) styleEl.textContent = this.getStyles();
  }

  getStyles() {
    const { color1, color2, color3, color4, color5, color6, slider1, slider2, slider3 } = this.styleProps;
    const radius = parseInt(slider1);
    const spacing = parseInt(slider2);
    const fontSize = parseInt(slider3);

    return `
      * { box-sizing: border-box; margin: 0; padding: 0; }
      
      .urgency-container {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: ${color1};
        border: 2px solid ${color2};
        border-radius: ${radius}px;
        padding: ${spacing}px;
        margin: ${spacing}px 0;
      }
      
      .urgency-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: ${spacing}px;
        font-size: ${fontSize + 2}px;
        font-weight: 800;
        color: ${color2};
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .timer-section {
        background: ${color5};
        border-radius: ${radius - 2}px;
        padding: ${spacing}px;
        margin-bottom: ${spacing - 4}px;
      }
      
      .timer-label {
        font-size: ${fontSize - 2}px;
        color: ${color4};
        font-weight: 600;
        margin-bottom: 8px;
        text-align: center;
      }
      
      .timer-display {
        display: flex;
        justify-content: center;
        gap: ${spacing - 4}px;
      }
      
      .timer-box {
        background: ${color1};
        border: 2px solid ${color2};
        border-radius: ${radius - 4}px;
        padding: ${spacing - 4}px ${spacing}px;
        text-align: center;
        min-width: 70px;
      }
      
      .timer-value {
        font-size: ${fontSize * 2}px;
        font-weight: 900;
        color: ${color2};
        display: block;
        line-height: 1;
      }
      
      .timer-unit {
        font-size: ${fontSize - 6}px;
        color: ${color4};
        text-transform: uppercase;
        margin-top: 4px;
        font-weight: 600;
      }
      
      .stock-alert {
        background: linear-gradient(135deg, ${color3}20 0%, ${color2}20 100%);
        border-left: 4px solid ${color3};
        padding: ${spacing - 2}px ${spacing}px;
        border-radius: ${radius - 4}px;
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: ${spacing - 4}px;
      }
      
      .stock-alert.critical {
        border-left-color: ${color2};
        background: linear-gradient(135deg, ${color2}20 0%, ${color2}30 100%);
      }
      
      .stock-icon {
        font-size: ${fontSize + 6}px;
        animation: pulse 1.5s infinite;
      }
      
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.8; }
      }
      
      .stock-text {
        font-size: ${fontSize}px;
        font-weight: 700;
        color: ${color4};
        flex: 1;
      }
      
      .stock-count {
        font-size: ${fontSize + 4}px;
        font-weight: 900;
        color: ${color2};
      }
      
      .shipping-info {
        background: ${color6}15;
        border-left: 4px solid ${color6};
        padding: ${spacing - 4}px ${spacing}px;
        border-radius: ${radius - 4}px;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .shipping-icon {
        font-size: ${fontSize + 4}px;
      }
      
      .shipping-text {
        font-size: ${fontSize - 2}px;
        color: ${color4};
        font-weight: 600;
      }
      
      .shipping-time {
        font-weight: 900;
        color: ${color6};
      }
      
      @media (max-width: 480px) {
        .timer-display {
          gap: ${spacing - 6}px;
        }
        
        .timer-box {
          min-width: 60px;
          padding: ${spacing - 6}px ${spacing - 4}px;
        }
        
        .timer-value {
          font-size: ${fontSize * 1.5}px;
        }
        
        .urgency-header {
          font-size: ${fontSize}px;
        }
      }
    `;
  }

  calculateTimeRemaining() {
    if (!this.endDate) return null;
    
    const now = new Date();
    const diff = this.endDate - now;
    
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
      expired: false
    };
  }

  getShippingDeadline() {
    const now = new Date();
    const cutoffHour = 14; // 2 PM cutoff
    const currentHour = now.getHours();
    
    if (currentHour < cutoffHour) {
      const timeLeft = cutoffHour - currentHour;
      const minsLeft = 60 - now.getMinutes();
      
      const deliveryDate = new Date(now);
      deliveryDate.setDate(deliveryDate.getDate() + 2);
      
      return {
        time: `${timeLeft - 1}h ${minsLeft}m`,
        date: deliveryDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      };
    }
    
    return null;
  }

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    
    this.timerInterval = setInterval(() => {
      const time = this.calculateTimeRemaining();
      if (!time) return;
      
      if (time.expired) {
        clearInterval(this.timerInterval);
        this.dispatchEvent(new CustomEvent('timer-expired'));
        return;
      }
      
      this.updateTimerDisplay(time);
    }, 1000);
  }

  updateTimerDisplay(time) {
    const daysEl = this.querySelector('.timer-days');
    const hoursEl = this.querySelector('.timer-hours');
    const minutesEl = this.querySelector('.timer-minutes');
    const secondsEl = this.querySelector('.timer-seconds');
    
    if (daysEl) daysEl.textContent = String(time.days).padStart(2, '0');
    if (hoursEl) hoursEl.textContent = String(time.hours).padStart(2, '0');
    if (minutesEl) minutesEl.textContent = String(time.minutes).padStart(2, '0');
    if (secondsEl) secondsEl.textContent = String(time.seconds).padStart(2, '0');
  }

  render() {
    const showTimer = this.getAttribute('show-timer') !== 'false';
    const showStock = this.getAttribute('show-stock') !== 'false';
    const showShipping = this.getAttribute('show-shipping') !== 'false';
    
    const time = this.calculateTimeRemaining();
    const shipping = this.getShippingDeadline();
    const isCritical = this.stockCount > 0 && this.stockCount <= 5;

    this.innerHTML = `
      <style>${this.getStyles()}</style>
      <div class="urgency-container">
        <div class="urgency-header">
          ${this.styleProps.text1}
        </div>
        
        ${showTimer && time && !time.expired ? `
          <div class="timer-section">
            <div class="timer-label">${this.styleProps.text2}</div>
            <div class="timer-display">
              ${time.days > 0 ? `
                <div class="timer-box">
                  <span class="timer-value timer-days">${String(time.days).padStart(2, '0')}</span>
                  <span class="timer-unit">Days</span>
                </div>
              ` : ''}
              <div class="timer-box">
                <span class="timer-value timer-hours">${String(time.hours).padStart(2, '0')}</span>
                <span class="timer-unit">Hours</span>
              </div>
              <div class="timer-box">
                <span class="timer-value timer-minutes">${String(time.minutes).padStart(2, '0')}</span>
                <span class="timer-unit">Mins</span>
              </div>
              <div class="timer-box">
                <span class="timer-value timer-seconds">${String(time.seconds).padStart(2, '0')}</span>
                <span class="timer-unit">Secs</span>
              </div>
            </div>
          </div>
        ` : ''}
        
        ${showStock && this.stockCount > 0 ? `
          <div class="stock-alert ${isCritical ? 'critical' : ''}">
            <div class="stock-icon">${isCritical ? '🔥' : '⚠️'}</div>
            <div class="stock-text">
              ${isCritical ? this.styleProps.text4 : this.styleProps.text3.replace('{stock}', this.stockCount)}
            </div>
            <div class="stock-count">${this.stockCount}</div>
          </div>
        ` : ''}
        
        ${showShipping && shipping ? `
          <div class="shipping-info">
            <div class="shipping-icon">🚚</div>
            <div class="shipping-text">
              ${this.styleProps.text5
                .replace('{time}', `<span class="shipping-time">${shipping.time}</span>`)
                .replace('{date}', `<span class="shipping-time">${shipping.date}</span>`)}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
}

customElements.define('sales-booster-timer', SalesBoosterTimer);
