class SalesFunnel extends HTMLElement {
  constructor() {
    super();
    this.currentStep = 1;
    this.totalSteps = 4;
    this.mainProduct = null;
    this.upsellProducts = [];
    this.selectedOptions = {};
    this.quantity = 1;
    this.selectedUpsells = [];
    this.customerInfo = {};
    
    // Default style props
    this.styleProps = {
      color1: '#ffffff',      // Primary Background
      color2: '#f8f9fa',      // Secondary Background
      color3: '#e5e7eb',      // Border Color
      color4: '#f3f4f6',      // Shapes Color
      color5: '#3b82f6',      // Primary Accent
      color6: '#2563eb',      // Hover Accent
      color7: 'rgba(0, 0, 0, 0.1)',  // Shadow Color
      color8: '#1f2937',      // Text Primary
      color9: '#6b7280',      // Text Secondary
      color10: '#111827',     // Price Color
      color11: '#ef4444',     // Error Color
      color12: '#fee2e2',     // Error Background
      color13: '#10b981',     // Success Color
      slider1: '12',          // Card Radius
      slider2: '16',          // Spacing
      slider3: '16',          // Font Size
      text1: 'Special Limited Time Offer!',           // Step 1 Headline
      text2: 'Get Your Premium Product Today',        // Step 1 Subheadline
      text3: 'Wait! We Have a Special Offer For You', // Step 2 Headline
      text4: 'Add These Amazing Products',             // Step 2 Subheadline
      text5: 'One More Thing...',                      // Step 3 Headline
      text6: 'Complete Your Order',                    // Step 3 Subheadline
      text7: 'Order Confirmed!',                       // Step 4 Headline
      text8: 'Thank you for your purchase',            // Step 4 Subheadline
      text9: 'Continue',                               // Button Text 1
      text10: 'Add to Order',                          // Button Text 2
      text11: 'No Thanks',                             // Button Text 3
      text12: 'Complete Order'                         // Button Text 4
    };
  }

  connectedCallback() {
    this.render();
  }

  static get observedAttributes() {
    return ['main-product', 'upsell-products', 'style-props'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'main-product' && newVal && newVal !== oldVal) {
      try {
        this.mainProduct = JSON.parse(newVal);
        console.log('📦 Main product loaded:', this.mainProduct?.name);
        this.selectedOptions = {};
        this.quantity = 1;
        this.render();
      } catch (error) {
        console.error('Error parsing main product:', error);
      }
    }
    
    if (name === 'upsell-products' && newVal && newVal !== oldVal) {
      try {
        this.upsellProducts = JSON.parse(newVal);
        console.log('🎁 Upsell products loaded:', this.upsellProducts.length);
        this.render();
      } catch (error) {
        console.error('Error parsing upsell products:', error);
      }
    }
    
    if (name === 'style-props' && newVal && newVal !== oldVal) {
      try {
        const newStyleProps = JSON.parse(newVal);
        this.styleProps = { ...this.styleProps, ...newStyleProps };
        this.updateStyles();
      } catch (error) {
        console.error('Error parsing style props:', error);
      }
    }
  }

  updateStyles() {
    const styleElement = this.querySelector('style');
    if (styleElement) {
      styleElement.textContent = this.getStyles();
    }
  }

  getStyles() {
    const {
      color1, color2, color3, color4, color5, color6, color7,
      color8, color9, color10, color11, color12, color13,
      slider1, slider2, slider3
    } = this.styleProps;

    return `
      * {
        box-sizing: border-box;
      }
      
      .funnel-container {
        width: 100%;
        min-height: 100vh;
        background: ${color2};
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        padding: ${parseInt(slider2) * 2}px ${slider2}px;
      }
      
      /* ========== PROGRESS BAR ========== */
      .progress-container {
        max-width: 900px;
        margin: 0 auto ${parseInt(slider2) * 3}px auto;
        background: ${color1};
        padding: ${parseInt(slider2) * 2}px;
        border-radius: ${parseInt(slider1) * 2}px;
        box-shadow: 0 4px 12px ${color7};
      }
      
      .progress-steps {
        display: flex;
        justify-content: space-between;
        position: relative;
      }
      
      .progress-line {
        position: absolute;
        top: 20px;
        left: 0;
        right: 0;
        height: 4px;
        background: ${color3};
        z-index: 0;
      }
      
      .progress-line-fill {
        height: 100%;
        background: ${color5};
        transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .progress-step {
        position: relative;
        z-index: 1;
        text-align: center;
        flex: 1;
      }
      
      .step-circle {
        width: 40px;
        height: 40px;
        margin: 0 auto ${parseInt(slider2) / 2}px auto;
        border-radius: 50%;
        background: ${color3};
        color: ${color9};
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: ${parseInt(slider3)}px;
        transition: all 0.3s;
        border: 3px solid ${color1};
      }
      
      .progress-step.active .step-circle {
        background: ${color5};
        color: ${color1};
        box-shadow: 0 0 0 4px ${color5}30;
        transform: scale(1.1);
      }
      
      .progress-step.completed .step-circle {
        background: ${color13};
        color: ${color1};
      }
      
      .step-label {
        font-size: ${parseInt(slider3) - 3}px;
        color: ${color9};
        font-weight: 600;
      }
      
      .progress-step.active .step-label {
        color: ${color8};
        font-weight: 700;
      }
      
      /* ========== FUNNEL CONTENT ========== */
      .funnel-content {
        max-width: 1200px;
        margin: 0 auto;
      }
      
      .step-container {
        display: none;
        animation: fadeIn 0.5s ease;
      }
      
      .step-container.active {
        display: block;
      }
      
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .step-header {
        text-align: center;
        margin-bottom: ${parseInt(slider2) * 3}px;
      }
      
      .step-headline {
        font-size: ${parseInt(slider3) * 3}px;
        font-weight: 800;
        color: ${color8};
        margin: 0 0 ${slider2}px 0;
        line-height: 1.2;
      }
      
      .step-subheadline {
        font-size: ${parseInt(slider3) + 4}px;
        color: ${color9};
        margin: 0;
      }
      
      /* ========== STEP 1: MAIN PRODUCT ========== */
      .product-showcase {
        background: ${color1};
        border-radius: ${parseInt(slider1) * 2}px;
        padding: ${parseInt(slider2) * 3}px;
        box-shadow: 0 8px 24px ${color7};
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: ${parseInt(slider2) * 3}px;
        align-items: center;
      }
      
      .product-image-section {
        position: relative;
      }
      
      .product-main-image {
        width: 100%;
        aspect-ratio: 1;
        border-radius: ${slider1}px;
        overflow: hidden;
        background: ${color4};
        box-shadow: 0 8px 20px ${color7};
      }
      
      .product-main-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .ribbon {
        position: absolute;
        top: ${slider2}px;
        right: ${slider2}px;
        background: ${color11};
        color: ${color1};
        padding: 8px 16px;
        border-radius: 25px;
        font-size: ${parseInt(slider3) - 3}px;
        font-weight: 700;
        text-transform: uppercase;
        box-shadow: 0 4px 12px ${color7};
      }
      
      .product-details-section {
        padding: ${slider2}px;
      }
      
      .product-name {
        font-size: ${parseInt(slider3) * 2}px;
        font-weight: 800;
        color: ${color8};
        margin: 0 0 ${slider2}px 0;
        line-height: 1.3;
      }
      
      .product-description {
        font-size: ${parseInt(slider3) - 1}px;
        color: ${color9};
        line-height: 1.7;
        margin: 0 0 ${parseInt(slider2) * 2}px 0;
      }
      
      .price-display {
        font-size: ${parseInt(slider3) * 2.5}px;
        font-weight: 800;
        color: ${color10};
        margin: ${parseInt(slider2) * 2}px 0;
        display: flex;
        align-items: center;
        gap: ${slider2}px;
      }
      
      .price-original {
        font-size: ${parseInt(slider3) + 4}px;
        color: ${color9};
        text-decoration: line-through;
        opacity: 0.7;
      }
      
      .discount-badge {
        background: ${color13};
        color: ${color1};
        padding: 6px 12px;
        border-radius: 20px;
        font-size: ${parseInt(slider3) - 4}px;
        font-weight: 700;
      }
      
      .trust-badges {
        display: flex;
        gap: ${slider2}px;
        margin: ${parseInt(slider2) * 2}px 0;
        flex-wrap: wrap;
      }
      
      .trust-badge {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: ${parseInt(slider3) - 3}px;
        color: ${color9};
        font-weight: 600;
      }
      
      .trust-icon {
        width: 24px;
        height: 24px;
        background: ${color5};
        color: ${color1};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
      }
      
      .options-section {
        margin: ${parseInt(slider2) * 2}px 0;
      }
      
      .option-group {
        margin-bottom: ${parseInt(slider2) * 1.5}px;
      }
      
      .option-label {
        display: block;
        font-weight: 700;
        font-size: ${parseInt(slider3) - 2}px;
        color: ${color8};
        margin-bottom: ${parseInt(slider2) / 2}px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .color-swatches {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      
      .color-swatch {
        width: 45px;
        height: 45px;
        border-radius: 50%;
        border: 3px solid ${color3};
        cursor: pointer;
        transition: all 0.3s;
        position: relative;
        box-shadow: 0 2px 6px ${color7};
      }
      
      .color-swatch:hover {
        transform: scale(1.15);
        border-color: ${color5};
      }
      
      .color-swatch.selected {
        border-color: ${color5};
        box-shadow: 0 0 0 3px ${color1}, 0 0 0 6px ${color5};
        transform: scale(1.1);
      }
      
      .size-buttons {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      
      .size-button {
        padding: 12px 20px;
        border: 2px solid ${color3};
        background: ${color1};
        border-radius: ${parseInt(slider1) / 2}px;
        font-size: ${parseInt(slider3) - 2}px;
        font-weight: 600;
        color: ${color8};
        cursor: pointer;
        transition: all 0.3s;
        min-width: 60px;
        text-align: center;
      }
      
      .size-button:hover {
        border-color: ${color5};
        background: ${color5}10;
      }
      
      .size-button.selected {
        border-color: ${color5};
        background: ${color5};
        color: ${color1};
      }
      
      .quantity-selector {
        display: flex;
        align-items: center;
        gap: ${slider2}px;
        margin: ${parseInt(slider2) * 2}px 0;
      }
      
      .quantity-label {
        font-weight: 700;
        font-size: ${slider3}px;
        color: ${color8};
      }
      
      .quantity-controls {
        display: flex;
        align-items: center;
        gap: 12px;
        background: ${color2};
        padding: 8px 16px;
        border-radius: ${slider1}px;
        border: 2px solid ${color3};
      }
      
      .quantity-btn {
        width: 32px;
        height: 32px;
        border: none;
        background: ${color1};
        border-radius: ${parseInt(slider1) / 2}px;
        font-size: 18px;
        font-weight: 700;
        color: ${color8};
        cursor: pointer;
        transition: all 0.3s;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .quantity-btn:hover:not(:disabled) {
        background: ${color5};
        color: ${color1};
      }
      
      .quantity-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
      
      .quantity-value {
        min-width: 30px;
        text-align: center;
        font-size: ${parseInt(slider3) + 2}px;
        font-weight: 800;
        color: ${color8};
      }
      
      /* ========== STEP 2 & 3: UPSELLS ========== */
      .upsell-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: ${parseInt(slider2) * 2}px;
      }
      
      .upsell-card {
        background: ${color1};
        border-radius: ${parseInt(slider1) * 2}px;
        overflow: hidden;
        box-shadow: 0 8px 24px ${color7};
        transition: all 0.3s;
        border: 3px solid transparent;
      }
      
      .upsell-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 32px ${color7};
      }
      
      .upsell-card.selected {
        border-color: ${color5};
        box-shadow: 0 12px 32px ${color5}30;
      }
      
      .upsell-image {
        width: 100%;
        height: 250px;
        overflow: hidden;
        background: ${color4};
      }
      
      .upsell-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .upsell-content {
        padding: ${parseInt(slider2) * 1.5}px;
      }
      
      .upsell-name {
        font-size: ${parseInt(slider3) + 4}px;
        font-weight: 700;
        color: ${color8};
        margin: 0 0 ${parseInt(slider2) / 2}px 0;
      }
      
      .upsell-description {
        font-size: ${parseInt(slider3) - 2}px;
        color: ${color9};
        margin: 0 0 ${slider2}px 0;
        line-height: 1.6;
      }
      
      .upsell-price {
        font-size: ${parseInt(slider3) + 8}px;
        font-weight: 800;
        color: ${color10};
        margin: ${slider2}px 0;
      }
      
      .upsell-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: ${parseInt(slider2) / 2}px;
      }
      
      /* ========== STEP 4: CONFIRMATION ========== */
      .confirmation-card {
        background: ${color1};
        border-radius: ${parseInt(slider1) * 2}px;
        padding: ${parseInt(slider2) * 4}px;
        box-shadow: 0 8px 24px ${color7};
        text-align: center;
        max-width: 600px;
        margin: 0 auto;
      }
      
      .success-icon {
        width: 80px;
        height: 80px;
        margin: 0 auto ${parseInt(slider2) * 2}px auto;
        background: ${color13};
        color: ${color1};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 40px;
        animation: scaleIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      @keyframes scaleIn {
        from {
          transform: scale(0);
          opacity: 0;
        }
        to {
          transform: scale(1);
          opacity: 1;
        }
      }
      
      .order-summary {
        background: ${color2};
        padding: ${parseInt(slider2) * 2}px;
        border-radius: ${slider1}px;
        margin: ${parseInt(slider2) * 2}px 0;
        text-align: left;
      }
      
      .summary-item {
        display: flex;
        justify-content: space-between;
        padding: ${parseInt(slider2) / 2}px 0;
        border-bottom: 1px solid ${color3};
      }
      
      .summary-item:last-child {
        border-bottom: none;
        font-weight: 700;
        font-size: ${parseInt(slider3) + 2}px;
        padding-top: ${slider2}px;
        margin-top: ${parseInt(slider2) / 2}px;
        border-top: 2px solid ${color3};
      }
      
      /* ========== BUTTONS ========== */
      .funnel-actions {
        margin-top: ${parseInt(slider2) * 3}px;
        display: flex;
        gap: ${slider2}px;
        justify-content: center;
        flex-wrap: wrap;
      }
      
      .funnel-btn {
        padding: ${parseInt(slider2) + 2}px ${parseInt(slider2) * 3}px;
        border: none;
        border-radius: ${parseInt(slider1) * 2}px;
        font-size: ${parseInt(slider3) + 2}px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        min-width: 200px;
      }
      
      .primary-btn {
        background: ${color5};
        color: ${color1};
        box-shadow: 0 8px 24px ${color5}40;
        border: 2px solid ${color5};
      }
      
      .primary-btn:hover {
        background: ${color6};
        border-color: ${color6};
        transform: translateY(-3px);
        box-shadow: 0 12px 32px ${color5}50;
      }
      
      .secondary-btn {
        background: transparent;
        color: ${color9};
        border: 2px solid ${color3};
      }
      
      .secondary-btn:hover {
        background: ${color2};
        border-color: ${color5};
        color: ${color5};
      }
      
      .upsell-btn {
        background: ${color5};
        color: ${color1};
        border: 2px solid ${color5};
        padding: 12px 20px;
        border-radius: ${slider1}px;
        font-size: ${parseInt(slider3) - 1}px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s;
      }
      
      .upsell-btn:hover {
        background: ${color6};
        transform: translateY(-2px);
      }
      
      .skip-btn {
        background: ${color2};
        color: ${color9};
        border: 2px solid ${color3};
        padding: 12px 20px;
        border-radius: ${slider1}px;
        font-size: ${parseInt(slider3) - 1}px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
      }
      
      .skip-btn:hover {
        border-color: ${color9};
      }
      
      .error-message {
        background: ${color12};
        color: ${color11};
        padding: ${slider2}px;
        border-radius: ${slider1}px;
        margin: ${slider2}px 0;
        border-left: 4px solid ${color11};
        display: none;
      }
      
      .error-message.visible {
        display: block;
      }
      
      /* ========== RESPONSIVE ========== */
      @media (max-width: 1024px) {
        .product-showcase {
          grid-template-columns: 1fr;
        }
        
        .upsell-grid {
          grid-template-columns: 1fr;
        }
      }
      
      @media (max-width: 768px) {
        .step-headline {
          font-size: ${parseInt(slider3) * 2}px;
        }
        
        .product-name {
          font-size: ${parseInt(slider3) + 6}px;
        }
        
        .price-display {
          font-size: ${parseInt(slider3) * 1.8}px;
        }
        
        .progress-steps {
          gap: ${parseInt(slider2) / 2}px;
        }
        
        .step-circle {
          width: 32px;
          height: 32px;
          font-size: ${parseInt(slider3) - 2}px;
        }
        
        .step-label {
          font-size: ${parseInt(slider3) - 5}px;
        }
      }
    `;
  }

  optimizeImageUrl(url, width = 400, height = 400) {
    if (!url) return '';
    
    try {
      const mediaMatch = url.match(/\/media\/([^/]+)/);
      if (!mediaMatch) return url;
      
      const mediaId = mediaMatch[1];
      return `https://static.wixstatic.com/media/${mediaId}/v1/fill/w_${width},h_${height},al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/${mediaId}`;
    } catch (error) {
      return url;
    }
  }

  calculateDiscount(originalPrice, discountedPrice) {
    const getNumericPrice = (priceStr) => {
      if (!priceStr) return 0;
      const numStr = priceStr.replace(/[^0-9.]/g, '');
      return parseFloat(numStr) || 0;
    };

    const original = getNumericPrice(originalPrice);
    const discounted = getNumericPrice(discountedPrice);

    if (original > 0 && discounted > 0 && original > discounted) {
      return Math.round(((original - discounted) / original) * 100);
    }
    return 0;
  }

  goToStep(step) {
    if (step < 1 || step > this.totalSteps) return;
    
    this.currentStep = step;
    this.render();
    
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  validateMainProduct() {
    if (!this.mainProduct) {
      this.showError('Please select a product');
      return false;
    }

    if (this.mainProduct.productOptions && this.mainProduct.productOptions.length > 0) {
      const missing = [];
      this.mainProduct.productOptions.forEach(opt => {
        if (!this.selectedOptions[opt.name]) {
          missing.push(opt.name);
        }
      });

      if (missing.length > 0) {
        this.showError(`Please select: ${missing.join(', ')}`);
        return false;
      }
    }

    this.clearError();
    return true;
  }

  showError(message) {
    const errorEl = this.querySelector('.error-message');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('visible');
    }
  }

  clearError() {
    const errorEl = this.querySelector('.error-message');
    if (errorEl) {
      errorEl.classList.remove('visible');
    }
  }

  render() {
    console.log('🎨 Rendering sales funnel, step:', this.currentStep);
    
    if (!this.mainProduct) {
      this.innerHTML = `
        <style>${this.getStyles()}</style>
        <div class="funnel-container">
          <div style="padding: 100px 20px; text-align: center; color: ${this.styleProps.color9};">
            <h2 style="font-size: 32px; margin: 0 0 16px 0;">Configure Your Sales Funnel</h2>
            <p style="font-size: 18px;">Select products from the panel to create your funnel.</p>
          </div>
        </div>
      `;
      return;
    }

    const progressPercentage = ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;

    this.innerHTML = `
      <style>${this.getStyles()}</style>
      <div class="funnel-container">
        
        <!-- PROGRESS BAR -->
        <div class="progress-container">
          <div class="progress-steps">
            <div class="progress-line">
              <div class="progress-line-fill" style="width: ${progressPercentage}%"></div>
            </div>
            ${[1, 2, 3, 4].map(step => `
              <div class="progress-step ${this.currentStep === step ? 'active' : ''} ${this.currentStep > step ? 'completed' : ''}">
                <div class="step-circle">${this.currentStep > step ? '✓' : step}</div>
                <div class="step-label">Step ${step}</div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <!-- FUNNEL CONTENT -->
        <div class="funnel-content">
          ${this.renderStep()}
        </div>
        
      </div>
    `;

    this.attachEventListeners();
  }

  renderStep() {
    switch (this.currentStep) {
      case 1:
        return this.renderStep1();
      case 2:
        return this.renderStep2();
      case 3:
        return this.renderStep3();
      case 4:
        return this.renderStep4();
      default:
        return '';
    }
  }

  renderStep1() {
    const hasDiscount = this.mainProduct.priceData?.formatted?.discountedPrice && 
                        this.mainProduct.priceData?.formatted?.discountedPrice !== this.mainProduct.priceData?.formatted?.price;
    const discountPercent = hasDiscount ? 
      this.calculateDiscount(this.mainProduct.priceData?.formatted?.price, this.mainProduct.priceData?.formatted?.discountedPrice) : 0;

    return `
      <div class="step-container active">
        <div class="step-header">
          <h1 class="step-headline">${this.styleProps.text1}</h1>
          <p class="step-subheadline">${this.styleProps.text2}</p>
        </div>
        
        <div class="product-showcase">
          <div class="product-image-section">
            ${this.mainProduct.ribbon ? `<div class="ribbon">${this.mainProduct.ribbon}</div>` : ''}
            <div class="product-main-image">
              <img src="${this.optimizeImageUrl(this.mainProduct.media?.mainMedia?.image?.url, 500, 500)}" alt="${this.mainProduct.name}">
            </div>
          </div>
          
          <div class="product-details-section">
            <h2 class="product-name">${this.mainProduct.name}</h2>
            <p class="product-description">${this.mainProduct.description?.substring(0, 200) || 'Premium quality product designed for you.'}...</p>
            
            <div class="price-display">
              ${hasDiscount ? `
                <span>${this.mainProduct.priceData.formatted.discountedPrice}</span>
                <span class="price-original">${this.mainProduct.priceData.formatted.price}</span>
                ${discountPercent > 0 ? `<span class="discount-badge">-${discountPercent}%</span>` : ''}
              ` : `
                <span>${this.mainProduct.priceData?.formatted?.price || 'N/A'}</span>
              `}
            </div>
            
            <div class="trust-badges">
              <div class="trust-badge">
                <div class="trust-icon">✓</div>
                <span>Secure Checkout</span>
              </div>
              <div class="trust-badge">
                <div class="trust-icon">🚚</div>
                <span>Fast Shipping</span>
              </div>
              <div class="trust-badge">
                <div class="trust-icon">↺</div>
                <span>Easy Returns</span>
              </div>
            </div>
            
            ${this.mainProduct.productOptions && this.mainProduct.productOptions.length > 0 ? `
              <div class="options-section">
                ${this.mainProduct.productOptions.map(option => `
                  <div class="option-group">
                    <label class="option-label">${option.name}</label>
                    
                    ${option.optionType === 'color' ? `
                      <div class="color-swatches">
                        ${option.choices.map(choice => `
                          <div 
                            class="color-swatch" 
                            style="background-color: ${choice.value};"
                            data-option="${option.name}"
                            data-value="${choice.description}"
                            title="${choice.description}"
                          ></div>
                        `).join('')}
                      </div>
                    ` : `
                      <div class="size-buttons">
                        ${option.choices.map(choice => `
                          <button 
                            class="size-button"
                            data-option="${option.name}"
                            data-value="${choice.description}"
                          >${choice.description}</button>
                        `).join('')}
                      </div>
                    `}
                  </div>
                `).join('')}
              </div>
            ` : ''}
            
            <div class="quantity-selector">
              <span class="quantity-label">Quantity:</span>
              <div class="quantity-controls">
                <button class="quantity-btn" data-action="decrease">−</button>
                <span class="quantity-value">${this.quantity}</span>
                <button class="quantity-btn" data-action="increase">+</button>
              </div>
            </div>
            
            <div class="error-message"></div>
          </div>
        </div>
        
        <div class="funnel-actions">
          <button class="funnel-btn primary-btn" data-action="next-step">${this.styleProps.text9}</button>
        </div>
      </div>
    `;
  }

  renderStep2() {
    const upsells = this.upsellProducts.slice(0, 2);
    
    return `
      <div class="step-container active">
        <div class="step-header">
          <h1 class="step-headline">${this.styleProps.text3}</h1>
          <p class="step-subheadline">${this.styleProps.text4}</p>
        </div>
        
        <div class="upsell-grid">
          ${upsells.map((product, index) => `
            <div class="upsell-card" data-upsell-id="${product._id}">
              <div class="upsell-image">
                <img src="${this.optimizeImageUrl(product.media?.mainMedia?.image?.url, 400, 250)}" alt="${product.name}">
              </div>
              <div class="upsell-content">
                <h3 class="upsell-name">${product.name}</h3>
                <p class="upsell-description">${product.description?.substring(0, 100) || 'Add this to your order'}...</p>
                <div class="upsell-price">${product.priceData?.formatted?.price || 'N/A'}</div>
                <div class="upsell-actions">
                  <button class="upsell-btn" data-action="add-upsell" data-product-id="${product._id}">${this.styleProps.text10}</button>
                  <button class="skip-btn" data-action="skip">${this.styleProps.text11}</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="funnel-actions">
          <button class="funnel-btn secondary-btn" data-action="skip-all">${this.styleProps.text11}</button>
          <button class="funnel-btn primary-btn" data-action="next-step">${this.styleProps.text9}</button>
        </div>
      </div>
    `;
  }

  renderStep3() {
    const upsells = this.upsellProducts.slice(2, 4);
    
    if (upsells.length === 0) {
      // Skip to step 4 if no more upsells
      this.currentStep = 4;
      return this.renderStep4();
    }
    
    return `
      <div class="step-container active">
        <div class="step-header">
          <h1 class="step-headline">${this.styleProps.text5}</h1>
          <p class="step-subheadline">${this.styleProps.text6}</p>
        </div>
        
        <div class="upsell-grid">
          ${upsells.map(product => `
            <div class="upsell-card" data-upsell-id="${product._id}">
              <div class="upsell-image">
                <img src="${this.optimizeImageUrl(product.media?.mainMedia?.image?.url, 400, 250)}" alt="${product.name}">
              </div>
              <div class="upsell-content">
                <h3 class="upsell-name">${product.name}</h3>
                <p class="upsell-description">${product.description?.substring(0, 100) || 'Complete your order with this'}...</p>
                <div class="upsell-price">${product.priceData?.formatted?.price || 'N/A'}</div>
                <div class="upsell-actions">
                  <button class="upsell-btn" data-action="add-upsell" data-product-id="${product._id}">${this.styleProps.text10}</button>
                  <button class="skip-btn" data-action="skip">${this.styleProps.text11}</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="funnel-actions">
          <button class="funnel-btn secondary-btn" data-action="skip-all">${this.styleProps.text11}</button>
          <button class="funnel-btn primary-btn" data-action="complete-order">${this.styleProps.text12}</button>
        </div>
      </div>
    `;
  }

  renderStep4() {
    return `
      <div class="step-container active">
        <div class="confirmation-card">
          <div class="success-icon">✓</div>
          <h1 class="step-headline">${this.styleProps.text7}</h1>
          <p class="step-subheadline">${this.styleProps.text8}</p>
          
          <div class="order-summary">
            <div class="summary-item">
              <span>${this.mainProduct.name} (x${this.quantity})</span>
              <span>${this.mainProduct.priceData?.formatted?.price || 'N/A'}</span>
            </div>
            ${this.selectedUpsells.map(id => {
              const product = this.upsellProducts.find(p => p._id === id);
              return product ? `
                <div class="summary-item">
                  <span>${product.name}</span>
                  <span>${product.priceData?.formatted?.price || 'N/A'}</span>
                </div>
              ` : '';
            }).join('')}
            <div class="summary-item">
              <span>Total</span>
              <span>Processing...</span>
            </div>
          </div>
          
          <p style="color: ${this.styleProps.color9}; margin-top: ${this.styleProps.slider2}px;">
            Your order is being processed. You will receive a confirmation email shortly.
          </p>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    // Color swatches
    this.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.addEventListener('click', (e) => {
        const option = e.target.dataset.option;
        const value = e.target.dataset.value;
        
        this.selectedOptions[option] = value;
        
        this.querySelectorAll(`.color-swatch[data-option="${option}"]`).forEach(s => {
          s.classList.remove('selected');
        });
        e.target.classList.add('selected');
        
        this.clearError();
      });
    });

    // Size buttons
    this.querySelectorAll('.size-button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const option = e.target.dataset.option;
        const value = e.target.dataset.value;
        
        this.selectedOptions[option] = value;
        
        this.querySelectorAll(`.size-button[data-option="${option}"]`).forEach(b => {
          b.classList.remove('selected');
        });
        e.target.classList.add('selected');
        
        this.clearError();
      });
    });

    // Quantity controls
    this.querySelectorAll('.quantity-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        const valueEl = this.querySelector('.quantity-value');
        
        if (action === 'decrease' && this.quantity > 1) {
          this.quantity--;
        } else if (action === 'increase' && this.quantity < 99) {
          this.quantity++;
        }
        
        if (valueEl) valueEl.textContent = this.quantity;
      });
    });

    // Add upsell
    this.querySelectorAll('[data-action="add-upsell"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const productId = e.target.dataset.productId;
        if (!this.selectedUpsells.includes(productId)) {
          this.selectedUpsells.push(productId);
          const card = e.target.closest('.upsell-card');
          if (card) card.classList.add('selected');
          e.target.textContent = 'Added ✓';
          e.target.disabled = true;
        }
      });
    });

    // Next step
    this.querySelectorAll('[data-action="next-step"]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.currentStep === 1) {
          if (this.validateMainProduct()) {
            this.dispatchEvent(new CustomEvent('step1Complete', {
              detail: {
                productId: this.mainProduct._id,
                choices: this.selectedOptions,
                quantity: this.quantity
              }
            }));
            this.nextStep();
          }
        } else {
          this.nextStep();
        }
      });
    });

    // Skip/Skip all
    this.querySelectorAll('[data-action="skip"], [data-action="skip-all"]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.nextStep();
      });
    });

    // Complete order
    this.querySelectorAll('[data-action="complete-order"]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('completeOrder', {
          detail: {
            mainProduct: {
              productId: this.mainProduct._id,
              choices: this.selectedOptions,
              quantity: this.quantity
            },
            upsells: this.selectedUpsells
          }
        }));
        this.nextStep();
      });
    });
  }
}

customElements.define('sales-funnel', SalesFunnel);
