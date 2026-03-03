class MarketplaceShop extends HTMLElement {
  constructor() {
    super();
    this.selectedOptions = {};
    this.quantities = {};
    this.categoriesData = [];
    this.errors = {};
    this.loadedImages = new Set();
    this.currentSlides = {};
    
    // Default style props
    this.styleProps = {
      // Colors (13)
      color1: '#ffffff',      // Primary BG
      color2: '#f8f9fa',      // Secondary BG
      color3: '#e5e7eb',      // Border
      color4: '#f3f4f6',      // Card BG
      color5: '#3b82f6',      // Primary Accent
      color6: '#2563eb',      // Hover Accent
      color7: 'rgba(0, 0, 0, 0.1)', // Shadow
      color8: '#1f2937',      // Text Primary
      color9: '#6b7280',      // Text Secondary
      color10: '#111827',     // Price
      color11: '#ef4444',     // Error/Sale
      color12: '#fee2e2',     // Error BG
      color13: '#10b981',     // Success
      
      // Sliders (3)
      slider1: '16',  // Card Radius
      slider2: '20',  // Spacing
      slider3: '14',  // Font Size
      
      // Text Inputs (20)
      text1: 'Summer Sale',                           // Banner Title
      text2: 'Up to 70% Off',                        // Banner Subtitle
      text3: 'Shop Now',                             // Banner Button
      text4: 'Flash Deals',                          // Section 1 Title
      text5: 'Limited Time Offers',                  // Section 1 Subtitle
      text6: 'Trending Products',                    // Section 2 Title
      text7: "What's Hot Right Now",                 // Section 2 Subtitle
      text8: 'Best Sellers',                         // Section 3 Title
      text9: 'Most Popular Items',                   // Section 3 Subtitle
      text10: 'New Arrivals',                        // Section 4 Title
      text11: 'Just Landed',                         // Section 4 Subtitle
      text12: 'Featured Categories',                 // Section 5 Title
      text13: 'Shop by Category',                    // Section 5 Subtitle
      text14: 'Top Rated',                           // Section 6 Title
      text15: 'Customer Favorites',                  // Section 6 Subtitle
      text16: 'Special Offers',                      // Section 7 Title
      text17: 'Deals You Cannot Miss',               // Section 7 Subtitle
      text18: '50% OFF',                             // Deal Badge 1
      text19: 'FREE SHIPPING',                       // Deal Badge 2
      text20: 'LIMITED STOCK'                        // Deal Badge 3
    };
  }

  connectedCallback() {
    this.render();
    this.setupIntersectionObserver();
    this.initializeSliders();
  }

  static get observedAttributes() {
    return ['categories-data', 'error-data', 'style-props'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'categories-data' && newVal && newVal !== oldVal) {
      try {
        this.categoriesData = JSON.parse(newVal);
        console.log('📦 Received categories data:', this.categoriesData.length, 'categories');
        
        this.categoriesData.forEach(category => {
          if (category.products) {
            category.products.forEach(p => {
              this.selectedOptions[p._id] = {};
              this.quantities[p._id] = 1;
              this.errors[p._id] = '';
            });
          }
        });
        
        this.render();
      } catch (error) {
        console.error('Error parsing categories data:', error);
      }
    }
    
    if (name === 'error-data' && newVal && newVal !== oldVal) {
      try {
        const errorData = JSON.parse(newVal);
        this.errors[errorData.productId] = errorData.message;
        this.updateErrorDisplay(errorData.productId);
      } catch (error) {
        console.error('Error parsing error data:', error);
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
      color1, color2, color3, color4, color5, color6, color7, color8, color9, color10,
      color11, color12, color13, slider1, slider2, slider3
    } = this.styleProps;

    const radius = parseInt(slider1);
    const spacing = parseInt(slider2);
    const fontSize = parseInt(slider3);

    return `
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      
      .marketplace-container {
        width: 100%;
        background: ${color2};
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      }
      
      /* Hero Banner Section */
      .hero-banner {
        position: relative;
        background: linear-gradient(135deg, ${color5} 0%, ${color6} 50%, #6366f1 100%);
        padding: ${spacing * 4}px ${spacing}px;
        text-align: center;
        overflow: hidden;
        min-height: 400px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .hero-banner::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: 
          radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%);
        animation: pulse 15s ease-in-out infinite;
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      
      .hero-content {
        position: relative;
        z-index: 1;
        max-width: 800px;
        margin: 0 auto;
      }
      
      .hero-badge {
        display: inline-block;
        background: ${color11};
        color: ${color1};
        padding: 8px 20px;
        border-radius: ${radius * 3}px;
        font-size: ${fontSize - 2}px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: ${spacing}px;
        animation: bounce 2s infinite;
      }
      
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      
      .hero-title {
        font-size: ${fontSize * 4}px;
        font-weight: 900;
        color: ${color1};
        margin-bottom: ${spacing}px;
        text-shadow: 0 4px 20px rgba(0,0,0,0.3);
        letter-spacing: -2px;
        line-height: 1.1;
      }
      
      .hero-subtitle {
        font-size: ${fontSize + 6}px;
        color: rgba(255,255,255,0.95);
        margin-bottom: ${spacing * 2}px;
        font-weight: 400;
      }
      
      .hero-cta {
        display: inline-block;
        padding: ${spacing}px ${spacing * 4}px;
        background: ${color1};
        color: ${color5};
        font-size: ${fontSize + 2}px;
        font-weight: 700;
        border: none;
        border-radius: ${radius * 3}px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        text-transform: uppercase;
        letter-spacing: 1.5px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      }
      
      .hero-cta:hover {
        transform: translateY(-4px);
        box-shadow: 0 15px 40px rgba(0,0,0,0.4);
      }
      
      /* Main Content */
      .main-content {
        max-width: 1600px;
        margin: 0 auto;
        padding: ${spacing * 3}px ${spacing}px;
      }
      
      /* Section Container */
      .section {
        margin-bottom: ${spacing * 5}px;
      }
      
      .section-header {
        text-align: center;
        margin-bottom: ${spacing * 3}px;
      }
      
      .section-title {
        font-size: ${fontSize * 2.5}px;
        font-weight: 900;
        color: ${color8};
        margin-bottom: ${spacing / 2}px;
        letter-spacing: -1px;
      }
      
      .section-subtitle {
        font-size: ${fontSize + 2}px;
        color: ${color9};
        font-weight: 400;
      }
      
      /* Deal Badges */
      .deal-badges {
        display: flex;
        gap: ${spacing}px;
        justify-content: center;
        margin-bottom: ${spacing * 2}px;
        flex-wrap: wrap;
      }
      
      .deal-badge {
        background: linear-gradient(135deg, ${color11} 0%, #dc2626 100%);
        color: ${color1};
        padding: ${spacing - 4}px ${spacing * 2}px;
        border-radius: ${radius * 2}px;
        font-size: ${fontSize - 4}px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        box-shadow: 0 4px 12px ${color7};
        animation: pulse 2s infinite;
      }
      
      /* Product Slider Container */
      .product-slider {
        position: relative;
        overflow: hidden;
        padding: 0 ${spacing * 3}px;
      }
      
      .slider-track {
        display: flex;
        gap: ${spacing}px;
        transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        will-change: transform;
      }
      
      .slider-nav {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        background: ${color1};
        border: 2px solid ${color3};
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 10;
        transition: all 0.3s;
        box-shadow: 0 4px 12px ${color7};
      }
      
      .slider-nav:hover {
        background: ${color5};
        border-color: ${color5};
        color: ${color1};
        transform: translateY(-50%) scale(1.1);
      }
      
      .slider-nav.prev {
        left: 0;
      }
      
      .slider-nav.next {
        right: 0;
      }
      
      .slider-nav svg {
        width: 24px;
        height: 24px;
        fill: currentColor;
      }
      
      /* Product Grid */
      .products-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
        gap: ${spacing * 1.5}px;
      }
      
      /* Gorgeous Product Card */
      .product-card {
        background: ${color4};
        border: 1px solid ${color3};
        border-radius: ${radius}px;
        overflow: hidden;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        flex-direction: column;
        position: relative;
        height: 480px;
        cursor: pointer;
      }
      
      .product-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 20px 40px ${color7};
        border-color: ${color5};
      }
      
      /* Image Container */
      .image-container {
        position: relative;
        width: 100%;
        height: 320px;
        background: linear-gradient(135deg, ${color2} 0%, #e0e7ff 100%);
        overflow: hidden;
      }
      
      .image-container::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
        transform: translateX(-100%);
        animation: shimmer 2.5s infinite;
      }
      
      @keyframes shimmer {
        100% { transform: translateX(100%); }
      }
      
      .product-card img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        opacity: 0;
      }
      
      .product-card img.loaded {
        opacity: 1;
      }
      
      .product-card:hover img.loaded {
        transform: scale(1.08);
      }
      
      /* Badges */
      .badges {
        position: absolute;
        top: ${spacing}px;
        left: ${spacing}px;
        right: ${spacing}px;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        z-index: 2;
      }
      
      .ribbon {
        background: ${color11};
        color: ${color1};
        padding: 6px 12px;
        border-radius: ${radius}px;
        font-size: ${fontSize - 6}px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      }
      
      .discount-percent {
        background: ${color13};
        color: ${color1};
        padding: 6px 12px;
        border-radius: ${radius}px;
        font-size: ${fontSize - 4}px;
        font-weight: 900;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      }
      
      /* Wishlist & Quick View */
      .quick-actions {
        position: absolute;
        top: ${spacing}px;
        right: ${spacing}px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        opacity: 0;
        transform: translateX(20px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 3;
      }
      
      .product-card:hover .quick-actions {
        opacity: 1;
        transform: translateX(0);
      }
      
      .quick-action-btn {
        width: 40px;
        height: 40px;
        background: ${color1};
        border: 1px solid ${color3};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s;
        box-shadow: 0 4px 12px ${color7};
      }
      
      .quick-action-btn:hover {
        background: ${color5};
        border-color: ${color5};
        color: ${color1};
        transform: scale(1.15);
      }
      
      /* Card Body */
      .card-body {
        padding: ${spacing}px;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: ${spacing - 4}px;
      }
      
      /* Rating */
      .rating {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      .stars {
        display: flex;
        gap: 2px;
        color: #fbbf24;
      }
      
      .rating-count {
        font-size: ${fontSize - 6}px;
        color: ${color9};
      }
      
      .product-name {
        font-size: ${fontSize}px;
        font-weight: 700;
        color: ${color8};
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        min-height: ${fontSize * 1.4 * 2}px;
        margin: 0;
      }
      
      /* Price Section */
      .price-section {
        display: flex;
        align-items: center;
        gap: ${spacing - 2}px;
        flex-wrap: wrap;
        margin-top: auto;
      }
      
      .current-price {
        font-size: ${fontSize + 8}px;
        font-weight: 900;
        color: ${color10};
        letter-spacing: -0.5px;
      }
      
      .current-price.discounted {
        color: ${color11};
      }
      
      .original-price {
        font-size: ${fontSize}px;
        color: ${color9};
        text-decoration: line-through;
        font-weight: 600;
      }
      
      /* Options Section */
      .options-section {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .option-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
      .option-label {
        font-size: ${fontSize - 6}px;
        font-weight: 700;
        color: ${color9};
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      /* Color Swatches */
      .color-swatches {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      
      .color-swatch {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 2px solid ${color3};
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        background-size: cover;
        background-position: center;
      }
      
      .color-swatch:hover {
        transform: scale(1.15);
        border-color: ${color5};
      }
      
      .color-swatch.selected {
        border-color: ${color5};
        box-shadow: 0 0 0 2px ${color1}, 0 0 0 4px ${color5};
        transform: scale(1.12);
      }
      
      /* Dropdown Options */
      .option-select {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid ${color3};
        border-radius: ${radius - 2}px;
        font-size: ${fontSize - 4}px;
        font-weight: 600;
        background: ${color1};
        color: ${color8};
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .option-select:hover,
      .option-select:focus {
        border-color: ${color5};
        outline: none;
      }
      
      /* Quantity Selector */
      .quantity-section {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px;
        background: ${color2};
        border-radius: ${radius - 2}px;
        border: 1px solid ${color3};
      }
      
      .quantity-label {
        font-size: ${fontSize - 6}px;
        font-weight: 800;
        color: ${color8};
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .quantity-controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .qty-btn {
        width: 26px;
        height: 26px;
        border: 1px solid ${color3};
        background: ${color1};
        border-radius: ${radius - 4}px;
        cursor: pointer;
        font-size: ${fontSize}px;
        font-weight: 900;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        color: ${color8};
      }
      
      .qty-btn:hover:not(:disabled) {
        background: ${color5};
        border-color: ${color5};
        color: ${color1};
        transform: scale(1.1);
      }
      
      .qty-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
      
      .qty-value {
        min-width: 28px;
        text-align: center;
        font-size: ${fontSize}px;
        font-weight: 900;
        color: ${color8};
      }
      
      /* Error Message */
      .error-msg {
        color: ${color11};
        background: ${color12};
        padding: 6px 8px;
        border-radius: ${radius - 2}px;
        font-size: ${fontSize - 6}px;
        font-weight: 700;
        border-left: 3px solid ${color11};
        display: none;
      }
      
      /* Action Buttons */
      .actions {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 8px;
        margin-top: auto;
      }
      
      .action-btn {
        padding: 10px 14px;
        border: none;
        border-radius: ${radius - 2}px;
        cursor: pointer;
        font-weight: 700;
        font-size: ${fontSize - 4}px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        white-space: nowrap;
      }
      
      .view-btn {
        background: ${color1};
        color: ${color5};
        border: 1px solid ${color5};
      }
      
      .view-btn:hover {
        background: ${color2};
        transform: translateY(-2px);
      }
      
      .cart-btn {
        background: linear-gradient(135deg, ${color5} 0%, ${color6} 100%);
        color: ${color1};
        border: 1px solid ${color5};
        box-shadow: 0 4px 12px ${color5}30;
      }
      
      .cart-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px ${color5}50;
      }
      
      /* Category Cards */
      .category-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 200px), 1fr));
        gap: ${spacing}px;
      }
      
      .category-card {
        background: ${color4};
        border: 1px solid ${color3};
        border-radius: ${radius}px;
        padding: ${spacing * 2}px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
      }
      
      .category-card::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, ${color5}10 0%, ${color6}10 100%);
        opacity: 0;
        transition: opacity 0.3s;
      }
      
      .category-card:hover {
        transform: translateY(-6px);
        box-shadow: 0 12px 24px ${color7};
        border-color: ${color5};
      }
      
      .category-card:hover::before {
        opacity: 1;
      }
      
      .category-icon {
        font-size: ${fontSize * 3}px;
        margin-bottom: ${spacing}px;
        position: relative;
        z-index: 1;
      }
      
      .category-name {
        font-size: ${fontSize + 2}px;
        font-weight: 700;
        color: ${color8};
        margin-bottom: ${spacing / 2}px;
        position: relative;
        z-index: 1;
      }
      
      .category-count {
        font-size: ${fontSize - 4}px;
        color: ${color9};
        position: relative;
        z-index: 1;
      }
      
      /* Promotional Banner */
      .promo-banner {
        background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);
        border-radius: ${radius * 2}px;
        padding: ${spacing * 3}px;
        text-align: center;
        color: ${color1};
        margin: ${spacing * 3}px 0;
        position: relative;
        overflow: hidden;
      }
      
      .promo-banner::before {
        content: '';
        position: absolute;
        inset: -50%;
        background: repeating-linear-gradient(
          45deg,
          transparent,
          transparent 10px,
          rgba(255,255,255,0.05) 10px,
          rgba(255,255,255,0.05) 20px
        );
        animation: slide 20s linear infinite;
      }
      
      .promo-content {
        position: relative;
        z-index: 1;
      }
      
      .promo-title {
        font-size: ${fontSize * 2}px;
        font-weight: 900;
        margin-bottom: ${spacing}px;
        text-shadow: 0 2px 10px rgba(0,0,0,0.3);
      }
      
      .promo-text {
        font-size: ${fontSize + 2}px;
        margin-bottom: ${spacing * 2}px;
        opacity: 0.95;
      }
      
      .promo-cta {
        display: inline-block;
        padding: ${spacing}px ${spacing * 3}px;
        background: ${color1};
        color: #8b5cf6;
        font-size: ${fontSize}px;
        font-weight: 700;
        border: none;
        border-radius: ${radius * 2}px;
        cursor: pointer;
        transition: all 0.3s;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      
      .promo-cta:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      }
      
      /* Timer Section */
      .timer-section {
        display: flex;
        justify-content: center;
        gap: ${spacing}px;
        margin: ${spacing * 2}px 0;
      }
      
      .timer-box {
        background: ${color1};
        border: 2px solid ${color3};
        border-radius: ${radius}px;
        padding: ${spacing}px ${spacing * 1.5}px;
        text-align: center;
        min-width: 80px;
      }
      
      .timer-value {
        font-size: ${fontSize * 2}px;
        font-weight: 900;
        color: ${color5};
        display: block;
      }
      
      .timer-label {
        font-size: ${fontSize - 6}px;
        color: ${color9};
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-top: 4px;
      }
      
      /* Empty State */
      .empty-state {
        text-align: center;
        padding: ${spacing * 6}px ${spacing * 2}px;
        color: ${color9};
      }
      
      .empty-icon {
        font-size: ${fontSize * 5}px;
        opacity: 0.3;
        margin-bottom: ${spacing * 2}px;
      }
      
      .empty-text {
        font-size: ${fontSize + 4}px;
        font-weight: 700;
        color: ${color8};
        margin-bottom: ${spacing}px;
      }
      
      /* Responsive */
      @media (max-width: 1024px) {
        .products-grid {
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr));
        }
        
        .product-card {
          height: 440px;
        }
        
        .image-container {
          height: 280px;
        }
      }
      
      @media (max-width: 768px) {
        .hero-title {
          font-size: ${fontSize * 2.5}px;
        }
        
        .hero-subtitle {
          font-size: ${fontSize + 2}px;
        }
        
        .section-title {
          font-size: ${fontSize * 2}px;
        }
        
        .products-grid {
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 200px), 1fr));
        }
        
        .product-card {
          height: 400px;
        }
        
        .image-container {
          height: 240px;
        }
        
        .actions {
          grid-template-columns: 1fr;
        }
      }
      
      @media (max-width: 480px) {
        .main-content {
          padding: ${spacing * 2}px ${spacing}px;
        }
        
        .products-grid {
          grid-template-columns: repeat(2, 1fr);
          gap: ${spacing}px;
        }
        
        .product-card {
          height: 380px;
        }
        
        .image-container {
          height: 220px;
        }
        
        .hero-banner {
          padding: ${spacing * 3}px ${spacing}px;
        }
      }
    `;
  }

  optimizeImageUrl(url, width = 280, height = 320) {
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

  setupIntersectionObserver() {
    const options = {
      root: null,
      rootMargin: '100px',
      threshold: 0.01
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.dataset.src;
          if (src && !this.loadedImages.has(src)) {
            img.src = src;
            img.classList.add('loaded');
            this.loadedImages.add(src);
            observer.unobserve(img);
          }
        }
      });
    }, options);

    this.querySelectorAll('img[data-src]').forEach(img => {
      observer.observe(img);
    });
  }

  initializeSliders() {
    this.querySelectorAll('.product-slider').forEach((slider, index) => {
      this.currentSlides[index] = 0;
      this.updateSlider(index);
    });
  }

  updateSlider(sliderIndex) {
    const slider = this.querySelectorAll('.product-slider')[sliderIndex];
    if (!slider) return;

    const track = slider.querySelector('.slider-track');
    const cards = track.querySelectorAll('.product-card');
    const cardWidth = cards[0]?.offsetWidth || 280;
    const gap = 20;
    const offset = -this.currentSlides[sliderIndex] * (cardWidth + gap);
    
    track.style.transform = `translateX(${offset}px)`;
  }

  slideNext(sliderIndex) {
    const slider = this.querySelectorAll('.product-slider')[sliderIndex];
    const track = slider.querySelector('.slider-track');
    const cards = track.querySelectorAll('.product-card');
    const maxSlide = Math.max(0, cards.length - 4);
    
    if (this.currentSlides[sliderIndex] < maxSlide) {
      this.currentSlides[sliderIndex]++;
      this.updateSlider(sliderIndex);
    }
  }

  slidePrev(sliderIndex) {
    if (this.currentSlides[sliderIndex] > 0) {
      this.currentSlides[sliderIndex]--;
      this.updateSlider(sliderIndex);
    }
  }

  validateOptions(productId) {
    const product = this.findProductById(productId);
    if (!product || !product.productOptions || product.productOptions.length === 0) {
      return true;
    }

    const selected = this.selectedOptions[productId] || {};
    const missing = [];

    product.productOptions.forEach(opt => {
      if (!selected[opt.name] || selected[opt.name] === '') {
        missing.push(opt.name);
      }
    });

    if (missing.length > 0) {
      this.errors[productId] = `Please select: ${missing.join(', ')}`;
      this.updateErrorDisplay(productId);
      return false;
    }

    this.errors[productId] = '';
    this.updateErrorDisplay(productId);
    return true;
  }

  findProductById(productId) {
    for (const category of this.categoriesData) {
      if (category.products) {
        const product = category.products.find(p => p._id === productId);
        if (product) return product;
      }
    }
    return null;
  }

  updateErrorDisplay(productId) {
    const card = this.querySelector(`[data-product-id="${productId}"]`);
    if (card) {
      const errorEl = card.querySelector('.error-msg');
      if (errorEl) {
        errorEl.textContent = this.errors[productId] || '';
        errorEl.style.display = this.errors[productId] ? 'block' : 'none';
      }
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

  renderProductCard(product, index, showFull = false) {
    const hasDiscount = product.priceData?.formatted?.discountedPrice && 
                        product.priceData?.formatted?.discountedPrice !== product.priceData?.formatted?.price;
    const discountPercent = hasDiscount ? 
      this.calculateDiscount(product.priceData?.formatted?.price, product.priceData?.formatted?.discountedPrice) : 0;
    
    const rating = 4 + Math.random(); // Mock rating
    const ratingCount = Math.floor(Math.random() * 500) + 50;
    
    return `
      <div class="product-card" data-product-id="${product._id}">
        <div class="image-container">
          <div class="badges">
            ${product.ribbon ? `<div class="ribbon">${product.ribbon}</div>` : ''}
            ${discountPercent > 0 ? `<div class="discount-percent">-${discountPercent}%</div>` : ''}
          </div>
          
          <div class="quick-actions">
            <button class="quick-action-btn" data-action="wishlist" title="Add to Wishlist">
              ♡
            </button>
            <button class="quick-action-btn" data-action="view" title="Quick View">
              👁
            </button>
          </div>
          
          <img 
            ${index < 8 ? `src="${this.optimizeImageUrl(product.media?.mainMedia?.image?.url, 280, 320)}"` : `data-src="${this.optimizeImageUrl(product.media?.mainMedia?.image?.url, 280, 320)}"`}
            alt="${product.name || 'Product'}"
            ${index < 8 ? 'onload="this.classList.add(\'loaded\')"' : 'loading="lazy"'}
          >
        </div>
        
        <div class="card-body">
          <div class="rating">
            <div class="stars">
              ${'★'.repeat(Math.floor(rating))}${'☆'.repeat(5 - Math.floor(rating))}
            </div>
            <span class="rating-count">(${ratingCount})</span>
          </div>
          
          <h3 class="product-name">${product.name || 'Product'}</h3>
          
          <div class="price-section">
            ${hasDiscount ? `
              <span class="current-price discounted">${product.priceData.formatted.discountedPrice}</span>
              <span class="original-price">${product.priceData.formatted.price}</span>
            ` : `
              <span class="current-price">${product.priceData?.formatted?.price || 'N/A'}</span>
            `}
          </div>
          
          ${showFull && product.productOptions && product.productOptions.length > 0 ? `
            <div class="options-section">
              ${product.productOptions.map(opt => `
                <div class="option-group">
                  <label class="option-label">${opt.name}</label>
                  ${opt.optionType === 'color' ? `
                    <div class="color-swatches">
                      ${opt.choices.slice(0, 6).map(c => `
                        <button 
                          class="color-swatch" 
                          style="background-color: ${c.value};" 
                          data-option="${opt.name}" 
                          data-value="${c.value}" 
                          data-description="${c.description}"
                          title="${c.description}">
                        </button>
                      `).join('')}
                    </div>
                  ` : `
                    <select class="option-select" data-option="${opt.name}">
                      <option value="">Choose ${opt.name}</option>
                      ${opt.choices.map(c => `
                        <option value="${c.description}">${c.description}</option>
                      `).join('')}
                    </select>
                  `}
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          ${showFull ? `
            <div class="quantity-section">
              <span class="quantity-label">Qty</span>
              <div class="quantity-controls">
                <button class="qty-btn" data-action="decrease">−</button>
                <span class="qty-value">${this.quantities[product._id] || 1}</span>
                <button class="qty-btn" data-action="increase">+</button>
              </div>
            </div>
            
            <div class="error-msg"></div>
          ` : ''}
          
          <div class="actions">
            <button class="action-btn view-btn" data-action="view">View</button>
            <button class="action-btn cart-btn" data-action="add">Add to Cart</button>
          </div>
        </div>
      </div>
    `;
  }

  renderCategoryCard(category, index) {
    const icons = ['🎮', '👗', '📱', '🏠', '⚽', '📚', '🎨', '🍔'];
    const icon = icons[index % icons.length];
    
    return `
      <div class="category-card" data-category-id="${category.id}">
        <div class="category-icon">${icon}</div>
        <div class="category-name">${category.name}</div>
        <div class="category-count">${category.products?.length || 0} Products</div>
      </div>
    `;
  }

  render() {
    console.log('🎨 Rendering marketplace shop');
    
    if (!this.categoriesData || this.categoriesData.length === 0) {
      this.innerHTML = `
        <style>${this.getStyles()}</style>
        <div class="marketplace-container">
          <div class="empty-state">
            <div class="empty-icon">🛍️</div>
            <p class="empty-text">Loading amazing products...</p>
          </div>
        </div>
      `;
      return;
    }

    const sections = this.categoriesData.slice(0, 7);

    this.innerHTML = `
      <style>${this.getStyles()}</style>
      <div class="marketplace-container">
        <!-- Hero Banner -->
        <section class="hero-banner">
          <div class="hero-content">
            <div class="hero-badge">${this.styleProps.text18}</div>
            <h1 class="hero-title">${this.styleProps.text1}</h1>
            <p class="hero-subtitle">${this.styleProps.text2}</p>
            <button class="hero-cta" data-action="scroll-shop">${this.styleProps.text3}</button>
          </div>
        </section>

        <!-- Main Content -->
        <div class="main-content">
          ${sections.map((section, sectionIndex) => {
            const titleKey = `text${(sectionIndex * 2) + 4}`;
            const subtitleKey = `text${(sectionIndex * 2) + 5}`;
            
            return `
              <!-- Section ${sectionIndex + 1}: ${section.name} -->
              <section class="section">
                <div class="section-header">
                  <h2 class="section-title">${this.styleProps[titleKey] || section.name}</h2>
                  <p class="section-subtitle">${this.styleProps[subtitleKey] || ''}</p>
                </div>
                
                ${sectionIndex === 0 ? `
                  <!-- Deal Badges for Flash Deals -->
                  <div class="deal-badges">
                    <div class="deal-badge">${this.styleProps.text18}</div>
                    <div class="deal-badge">${this.styleProps.text19}</div>
                    <div class="deal-badge">${this.styleProps.text20}</div>
                  </div>
                  
                  <!-- Timer -->
                  <div class="timer-section">
                    <div class="timer-box">
                      <span class="timer-value">23</span>
                      <span class="timer-label">Hours</span>
                    </div>
                    <div class="timer-box">
                      <span class="timer-value">45</span>
                      <span class="timer-label">Minutes</span>
                    </div>
                    <div class="timer-box">
                      <span class="timer-value">12</span>
                      <span class="timer-label">Seconds</span>
                    </div>
                  </div>
                ` : ''}
                
                ${sectionIndex % 2 === 0 ? `
                  <!-- Slider Layout -->
                  <div class="product-slider">
                    <button class="slider-nav prev" data-slider="${sectionIndex}" data-action="prev">
                      <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
                    </button>
                    <button class="slider-nav next" data-slider="${sectionIndex}" data-action="next">
                      <svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
                    </button>
                    <div class="slider-track">
                      ${section.products.slice(0, 12).map((product, index) => 
                        this.renderProductCard(product, index, sectionIndex === 0)
                      ).join('')}
                    </div>
                  </div>
                ` : `
                  <!-- Grid Layout -->
                  <div class="products-grid">
                    ${section.products.slice(0, 8).map((product, index) => 
                      this.renderProductCard(product, index + 100, true)
                    ).join('')}
                  </div>
                `}
              </section>
              
              ${sectionIndex === 2 ? `
                <!-- Promotional Banner -->
                <div class="promo-banner">
                  <div class="promo-content">
                    <h2 class="promo-title">Special Mid-Season Sale!</h2>
                    <p class="promo-text">Don't miss out on incredible deals - Limited time only</p>
                    <button class="promo-cta">Shop Sale Items</button>
                  </div>
                </div>
              ` : ''}
              
              ${sectionIndex === 4 ? `
                <!-- Featured Categories -->
                <section class="section">
                  <div class="section-header">
                    <h2 class="section-title">${this.styleProps.text12}</h2>
                    <p class="section-subtitle">${this.styleProps.text13}</p>
                  </div>
                  <div class="category-grid">
                    ${this.categoriesData.slice(0, 8).map((cat, idx) => 
                      this.renderCategoryCard(cat, idx)
                    ).join('')}
                  </div>
                </section>
              ` : ''}
            `;
          }).join('')}
        </div>
      </div>
    `;

    this.setupIntersectionObserver();
    this.initializeSliders();
    this.attachEventListeners();
  }

  attachEventListeners() {
    // Hero CTA
    const heroCta = this.querySelector('[data-action="scroll-shop"]');
    if (heroCta) {
      heroCta.addEventListener('click', () => {
        const mainContent = this.querySelector('.main-content');
        if (mainContent) {
          mainContent.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    // Slider Navigation
    this.querySelectorAll('.slider-nav').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const sliderIndex = parseInt(e.currentTarget.dataset.slider);
        const action = e.currentTarget.dataset.action;
        
        if (action === 'next') {
          this.slideNext(sliderIndex);
        } else {
          this.slidePrev(sliderIndex);
        }
      });
    });

    // Color Swatches
    this.querySelectorAll('.color-swatch').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const option = e.target.dataset.option;
        const description = e.target.dataset.description;
        const card = e.target.closest('.product-card');
        const productId = card.dataset.productId;
        
        this.selectedOptions[productId][option] = description;
        this.errors[productId] = '';
        this.updateErrorDisplay(productId);

        card.querySelectorAll(`.color-swatch[data-option="${option}"]`).forEach(s => 
          s.classList.remove('selected')
        );
        e.target.classList.add('selected');
      });
    });

    // Option Selects
    this.querySelectorAll('.option-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const option = e.target.dataset.option;
        const value = e.target.value;
        const card = e.target.closest('.product-card');
        const productId = card.dataset.productId;
        
        if (value === '') {
          delete this.selectedOptions[productId][option];
        } else {
          this.selectedOptions[productId][option] = value;
          this.errors[productId] = '';
          this.updateErrorDisplay(productId);
        }
      });
    });

    // Quantity Controls
    this.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const action = e.target.dataset.action;
        const card = e.target.closest('.product-card');
        const productId = card.dataset.productId;
        const qtyValue = card.querySelector('.qty-value');
        
        let currentQty = this.quantities[productId] || 1;
        
        if (action === 'decrease' && currentQty > 1) {
          currentQty--;
        } else if (action === 'increase' && currentQty < 99) {
          currentQty++;
        }
        
        this.quantities[productId] = currentQty;
        qtyValue.textContent = currentQty;
        
        const decreaseBtn = card.querySelector('.qty-btn[data-action="decrease"]');
        const increaseBtn = card.querySelector('.qty-btn[data-action="increase"]');
        
        decreaseBtn.disabled = currentQty <= 1;
        increaseBtn.disabled = currentQty >= 99;
      });
    });

    // Action Buttons
    this.querySelectorAll('.action-btn, .quick-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const action = e.target.dataset.action;
        const card = e.target.closest('.product-card');
        const productId = card.dataset.productId;
        const product = this.findProductById(productId);
        
        if (action === 'view' || action === 'wishlist') {
          this.dispatchEvent(new CustomEvent('viewProduct', {
            detail: { productId, product }
          }));
        } else if (action === 'add') {
          if (this.validateOptions(productId)) {
            const choices = this.selectedOptions[productId];
            const quantity = this.quantities[productId] || 1;
            this.dispatchEvent(new CustomEvent('addToCart', {
              detail: { productId, choices, quantity }
            }));
          }
        }
      });
    });

    // Category Cards
    this.querySelectorAll('.category-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const categoryId = e.currentTarget.dataset.categoryId;
        this.dispatchEvent(new CustomEvent('viewCategory', {
          detail: { categoryId }
        }));
      });
    });
  }
}

customElements.define('marketplace-shop', MarketplaceShop);
