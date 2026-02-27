class AdvancedProductShowcase extends HTMLElement {
  constructor() {
    super();
    this.selectedOptions = {};
    this.quantities = {};
    this.products = [];
    this.errors = {};
    this.loadedImages = new Set();
    
    // Slider state
    this.currentSlides = {};
    this.autoplayIntervals = {};
    
    // Default style props
    this.styleProps = {
      primaryBg: '#ffffff',
      secondaryBg: '#f8f9fa',
      borderColor: '#e5e7eb',
      shapesColor: '#f3f4f6',
      primaryAccent: '#3b82f6',
      hoverAccent: '#2563eb',
      shadowColor: 'rgba(0, 0, 0, 0.1)',
      textPrimary: '#1f2937',
      textSecondary: '#6b7280',
      priceColor: '#111827',
      errorColor: '#ef4444',
      errorBg: '#fee2e2',
      successColor: '#10b981',
      cardRadius: '12',
      spacing: '16',
      fontSize: '16',
      // Layout options
      layout1: 'hero-slider',     // hero-slider, featured-grid, banner-carousel
      layout2: 'product-carousel', // product-carousel, masonry-grid, vertical-slider
      layout3: 'grid-showcase',    // grid-showcase, horizontal-scroll, split-view
      autoplay: 'true',
      autoplaySpeed: '5000'
    };
  }

  connectedCallback() {
    this.render();
    this.setupIntersectionObserver();
  }

  disconnectedCallback() {
    // Clean up autoplay intervals
    Object.values(this.autoplayIntervals).forEach(interval => clearInterval(interval));
  }

  static get observedAttributes() {
    return ['products-data', 'error-data', 'style-props'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'products-data' && newVal && newVal !== oldVal) {
      try {
        this.products = JSON.parse(newVal);
        console.log('📦 Received products:', this.products.length);
        
        this.products.forEach(p => {
          this.selectedOptions[p._id] = {};
          this.quantities[p._id] = 1;
          this.errors[p._id] = '';
        });
        
        this.render();
      } catch (error) {
        console.error('Error parsing products data:', error);
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
      primaryBg, secondaryBg, borderColor, shapesColor, primaryAccent, hoverAccent,
      shadowColor, textPrimary, textSecondary, priceColor, errorColor, errorBg,
      successColor, cardRadius, spacing, fontSize
    } = this.styleProps;

    return `
      * {
        box-sizing: border-box;
      }
      
      .showcase-container {
        width: 100%;
        background: ${secondaryBg};
        overflow: hidden;
      }
      
      .section {
        padding: ${parseInt(spacing) * 3}px ${spacing}px;
        max-width: 1600px;
        margin: 0 auto;
      }
      
      /* ========== HERO SLIDER ========== */
      .hero-slider {
        position: relative;
        width: 100%;
        height: 600px;
        overflow: hidden;
        border-radius: ${parseInt(cardRadius) * 2}px;
        box-shadow: 0 20px 60px ${shadowColor};
      }
      
      .hero-slides {
        position: relative;
        width: 100%;
        height: 100%;
      }
      
      .hero-slide {
        position: absolute;
        width: 100%;
        height: 100%;
        opacity: 0;
        transition: opacity 1s ease-in-out;
        display: flex;
        align-items: center;
        background: linear-gradient(135deg, ${primaryAccent}, ${hoverAccent});
      }
      
      .hero-slide.active {
        opacity: 1;
        z-index: 1;
      }
      
      .hero-slide-image {
        position: absolute;
        width: 50%;
        height: 100%;
        right: 0;
        top: 0;
        object-fit: cover;
        opacity: 0;
        transition: opacity 0.5s ease;
      }
      
      .hero-slide-image.loaded {
        opacity: 1;
      }
      
      .hero-slide-content {
        position: relative;
        z-index: 2;
        padding: ${parseInt(spacing) * 4}px;
        max-width: 50%;
        color: ${primaryBg};
      }
      
      .hero-slide-title {
        font-size: ${parseInt(fontSize) * 3}px;
        font-weight: 800;
        margin: 0 0 ${spacing}px 0;
        line-height: 1.2;
        text-shadow: 0 4px 12px rgba(0,0,0,0.3);
      }
      
      .hero-slide-price {
        font-size: ${parseInt(fontSize) * 2.5}px;
        font-weight: 700;
        margin: ${spacing}px 0;
      }
      
      .hero-slide-description {
        font-size: ${parseInt(fontSize) + 2}px;
        margin: ${spacing}px 0 ${parseInt(spacing) * 2}px 0;
        opacity: 0.95;
      }
      
      .hero-cta {
        display: inline-block;
        padding: ${parseInt(spacing) + 2}px ${parseInt(spacing) * 3}px;
        background: ${primaryBg};
        color: ${primaryAccent};
        font-size: ${fontSize}px;
        font-weight: 700;
        border: none;
        border-radius: ${parseInt(cardRadius) * 2}px;
        cursor: pointer;
        transition: all 0.3s;
        box-shadow: 0 8px 20px rgba(0,0,0,0.2);
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      
      .hero-cta:hover {
        transform: translateY(-3px);
        box-shadow: 0 12px 30px rgba(0,0,0,0.3);
      }
      
      .hero-nav {
        position: absolute;
        bottom: ${parseInt(spacing) * 2}px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 12px;
        z-index: 3;
      }
      
      .hero-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: rgba(255,255,255,0.5);
        border: 2px solid ${primaryBg};
        cursor: pointer;
        transition: all 0.3s;
      }
      
      .hero-dot.active {
        background: ${primaryBg};
        transform: scale(1.3);
      }
      
      .hero-arrows {
        position: absolute;
        top: 50%;
        width: 100%;
        display: flex;
        justify-content: space-between;
        padding: 0 ${spacing}px;
        transform: translateY(-50%);
        z-index: 3;
        pointer-events: none;
      }
      
      .hero-arrow {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: rgba(255,255,255,0.9);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: ${textPrimary};
        transition: all 0.3s;
        pointer-events: all;
        box-shadow: 0 4px 12px ${shadowColor};
      }
      
      .hero-arrow:hover {
        background: ${primaryBg};
        transform: scale(1.1);
      }
      
      /* ========== PRODUCT CAROUSEL ========== */
      .product-carousel {
        position: relative;
        overflow: hidden;
        padding: ${spacing}px 0;
      }
      
      .carousel-track {
        display: flex;
        gap: ${parseInt(spacing) + 8}px;
        transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        padding: ${spacing}px;
      }
      
      .carousel-item {
        min-width: 320px;
        flex-shrink: 0;
        border: 2px solid ${borderColor};
        border-radius: ${cardRadius}px;
        background: ${primaryBg};
        overflow: hidden;
        box-shadow: 0 4px 12px ${shadowColor};
        transition: all 0.3s;
      }
      
      .carousel-item:hover {
        transform: translateY(-8px);
        box-shadow: 0 12px 24px ${shadowColor}, 0 0 0 3px ${primaryAccent}15;
        border-color: ${primaryAccent};
      }
      
      .carousel-arrows {
        position: absolute;
        top: 50%;
        width: 100%;
        display: flex;
        justify-content: space-between;
        transform: translateY(-50%);
        padding: 0 ${spacing}px;
        pointer-events: none;
        z-index: 2;
      }
      
      .carousel-arrow {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: ${primaryBg};
        border: 2px solid ${borderColor};
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        color: ${textPrimary};
        transition: all 0.3s;
        pointer-events: all;
        box-shadow: 0 4px 12px ${shadowColor};
      }
      
      .carousel-arrow:hover {
        background: ${primaryAccent};
        color: ${primaryBg};
        border-color: ${primaryAccent};
        transform: scale(1.15);
      }
      
      .carousel-arrow:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
      
      /* ========== MASONRY GRID ========== */
      .masonry-grid {
        column-count: 4;
        column-gap: ${parseInt(spacing) + 8}px;
      }
      
      .masonry-item {
        break-inside: avoid;
        margin-bottom: ${parseInt(spacing) + 8}px;
        border: 2px solid ${borderColor};
        border-radius: ${cardRadius}px;
        background: ${primaryBg};
        overflow: hidden;
        box-shadow: 0 4px 12px ${shadowColor};
        transition: all 0.3s;
      }
      
      .masonry-item:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px ${shadowColor};
        border-color: ${primaryAccent};
      }
      
      /* ========== HORIZONTAL SCROLL ========== */
      .horizontal-scroll {
        display: flex;
        gap: ${parseInt(spacing) + 8}px;
        overflow-x: auto;
        overflow-y: hidden;
        scroll-snap-type: x mandatory;
        scroll-behavior: smooth;
        padding: ${spacing}px;
        -webkit-overflow-scrolling: touch;
      }
      
      .horizontal-scroll::-webkit-scrollbar {
        height: 8px;
      }
      
      .horizontal-scroll::-webkit-scrollbar-track {
        background: ${shapesColor};
        border-radius: 4px;
      }
      
      .horizontal-scroll::-webkit-scrollbar-thumb {
        background: ${primaryAccent};
        border-radius: 4px;
      }
      
      .horizontal-scroll-item {
        min-width: 300px;
        scroll-snap-align: start;
        flex-shrink: 0;
        border: 2px solid ${borderColor};
        border-radius: ${cardRadius}px;
        background: ${primaryBg};
        overflow: hidden;
        box-shadow: 0 4px 12px ${shadowColor};
        transition: all 0.3s;
      }
      
      .horizontal-scroll-item:hover {
        transform: scale(1.05);
        box-shadow: 0 8px 20px ${shadowColor};
      }
      
      /* ========== FEATURED GRID ========== */
      .featured-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: ${parseInt(spacing) + 8}px;
        padding: ${spacing}px;
      }
      
      .featured-item {
        position: relative;
        border-radius: ${cardRadius}px;
        overflow: hidden;
        box-shadow: 0 8px 20px ${shadowColor};
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        height: 400px;
      }
      
      .featured-item:hover {
        transform: scale(1.03);
        box-shadow: 0 16px 40px ${shadowColor};
      }
      
      .featured-item:first-child {
        grid-column: span 2;
        grid-row: span 2;
        height: auto;
      }
      
      .featured-bg {
        position: absolute;
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.5s;
      }
      
      .featured-item:hover .featured-bg {
        transform: scale(1.1);
      }
      
      .featured-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);
        padding: ${parseInt(spacing) * 2}px;
        color: ${primaryBg};
      }
      
      .featured-title {
        font-size: ${parseInt(fontSize) + 6}px;
        font-weight: 700;
        margin: 0 0 8px 0;
      }
      
      .featured-price {
        font-size: ${parseInt(fontSize) + 4}px;
        font-weight: 800;
        color: ${primaryAccent};
        filter: brightness(1.5);
      }
      
      /* ========== VERTICAL SLIDER ========== */
      .vertical-slider {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: ${parseInt(spacing) * 2}px;
        height: 700px;
      }
      
      .vertical-main {
        position: relative;
        border-radius: ${cardRadius}px;
        overflow: hidden;
        box-shadow: 0 12px 30px ${shadowColor};
      }
      
      .vertical-slides {
        position: relative;
        width: 100%;
        height: 100%;
      }
      
      .vertical-slide {
        position: absolute;
        width: 100%;
        height: 100%;
        opacity: 0;
        transition: opacity 0.8s ease;
      }
      
      .vertical-slide.active {
        opacity: 1;
        z-index: 1;
      }
      
      .vertical-slide img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .vertical-thumbs {
        display: flex;
        flex-direction: column;
        gap: ${spacing}px;
        overflow-y: auto;
      }
      
      .vertical-thumb {
        border: 3px solid transparent;
        border-radius: ${cardRadius}px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.3s;
        height: 150px;
      }
      
      .vertical-thumb:hover {
        border-color: ${primaryAccent};
        transform: scale(1.05);
      }
      
      .vertical-thumb.active {
        border-color: ${primaryAccent};
        box-shadow: 0 0 0 4px ${primaryAccent}30;
      }
      
      .vertical-thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      /* ========== BANNER CAROUSEL ========== */
      .banner-carousel {
        position: relative;
        height: 500px;
        border-radius: ${parseInt(cardRadius) * 2}px;
        overflow: hidden;
        box-shadow: 0 16px 40px ${shadowColor};
      }
      
      .banner-slides {
        display: flex;
        height: 100%;
        transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .banner-slide {
        min-width: 100%;
        height: 100%;
        position: relative;
        background: linear-gradient(135deg, ${primaryAccent}, ${hoverAccent});
      }
      
      .banner-content {
        position: absolute;
        top: 50%;
        left: ${parseInt(spacing) * 3}px;
        transform: translateY(-50%);
        color: ${primaryBg};
        max-width: 50%;
      }
      
      .banner-title {
        font-size: ${parseInt(fontSize) * 2.5}px;
        font-weight: 800;
        margin: 0 0 ${spacing}px 0;
        text-shadow: 0 4px 12px rgba(0,0,0,0.3);
      }
      
      .banner-price {
        font-size: ${parseInt(fontSize) * 2}px;
        font-weight: 700;
        margin: ${spacing}px 0;
      }
      
      .banner-image {
        position: absolute;
        right: 0;
        top: 0;
        width: 50%;
        height: 100%;
        object-fit: cover;
      }
      
      /* ========== SPLIT VIEW ========== */
      .split-view {
        display: grid;
        grid-template-columns: 2fr 3fr;
        gap: ${parseInt(spacing) * 2}px;
        min-height: 600px;
      }
      
      .split-sidebar {
        display: flex;
        flex-direction: column;
        gap: ${spacing}px;
      }
      
      .split-thumbnail {
        border: 3px solid transparent;
        border-radius: ${cardRadius}px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.3s;
        aspect-ratio: 4/3;
      }
      
      .split-thumbnail:hover {
        border-color: ${primaryAccent};
        transform: translateX(8px);
      }
      
      .split-thumbnail.active {
        border-color: ${primaryAccent};
        box-shadow: 0 4px 16px ${primaryAccent}40;
      }
      
      .split-thumbnail img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .split-main {
        position: relative;
        border-radius: ${parseInt(cardRadius) * 2}px;
        overflow: hidden;
        box-shadow: 0 20px 60px ${shadowColor};
      }
      
      .split-featured {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .split-info {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(to top, rgba(0,0,0,0.95), transparent);
        padding: ${parseInt(spacing) * 3}px;
        color: ${primaryBg};
      }
      
      /* ========== PRODUCT CARD (UNIVERSAL) ========== */
      .product-image-container {
        position: relative;
        width: 100%;
        padding-top: 100%;
        overflow: hidden;
        background: ${shapesColor};
      }
      
      .product-image-container img {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: opacity 0.4s, transform 0.4s;
        opacity: 0;
      }
      
      .product-image-container img.loaded {
        opacity: 1;
      }
      
      .product-card:hover .product-image-container img.loaded {
        transform: scale(1.1);
      }
      
      .ribbon {
        position: absolute;
        top: 12px;
        right: 12px;
        background: ${errorColor};
        color: ${primaryBg};
        padding: 6px 12px;
        border-radius: 20px;
        font-size: ${parseInt(fontSize) - 5}px;
        font-weight: 700;
        text-transform: uppercase;
        z-index: 2;
        box-shadow: 0 4px 12px ${shadowColor};
      }
      
      .product-content {
        padding: ${parseInt(spacing) + 4}px;
      }
      
      .product-title {
        font-size: ${parseInt(fontSize) + 2}px;
        font-weight: 700;
        color: ${textPrimary};
        margin: 0 0 8px 0;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      
      .price-container {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        margin: 8px 0;
      }
      
      .price {
        font-size: ${parseInt(fontSize) + 8}px;
        font-weight: 800;
        color: ${priceColor};
      }
      
      .price.discounted {
        color: ${errorColor};
      }
      
      .original-price {
        font-size: ${fontSize}px;
        color: ${textSecondary};
        text-decoration: line-through;
        opacity: 0.7;
      }
      
      .discount-badge {
        background: ${successColor};
        color: ${primaryBg};
        padding: 3px 8px;
        border-radius: 12px;
        font-size: ${parseInt(fontSize) - 6}px;
        font-weight: 700;
      }
      
      .quick-actions {
        display: flex;
        gap: 8px;
        margin-top: 12px;
      }
      
      .quick-btn {
        flex: 1;
        padding: 10px;
        border: none;
        border-radius: ${parseInt(cardRadius) / 2}px;
        font-weight: 700;
        font-size: ${parseInt(fontSize) - 3}px;
        cursor: pointer;
        transition: all 0.3s;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .view-btn {
        background: ${secondaryBg};
        color: ${textPrimary};
        border: 2px solid ${borderColor};
      }
      
      .view-btn:hover {
        background: ${shapesColor};
        border-color: ${primaryAccent};
      }
      
      .add-btn {
        background: ${primaryAccent};
        color: ${primaryBg};
        border: 2px solid ${primaryAccent};
      }
      
      .add-btn:hover {
        background: ${hoverAccent};
        border-color: ${hoverAccent};
        transform: translateY(-2px);
      }
      
      /* ========== RESPONSIVE ========== */
      @media (max-width: 1024px) {
        .masonry-grid {
          column-count: 3;
        }
        
        .featured-item:first-child {
          grid-column: span 1;
          grid-row: span 1;
        }
        
        .vertical-slider,
        .split-view {
          grid-template-columns: 1fr;
        }
      }
      
      @media (max-width: 768px) {
        .hero-slider {
          height: 400px;
        }
        
        .hero-slide-content {
          max-width: 100%;
          padding: ${parseInt(spacing) * 2}px;
        }
        
        .hero-slide-title {
          font-size: ${parseInt(fontSize) * 2}px;
        }
        
        .hero-slide-image {
          opacity: 0.3;
          width: 100%;
        }
        
        .masonry-grid {
          column-count: 2;
        }
        
        .carousel-item,
        .horizontal-scroll-item {
          min-width: 250px;
        }
        
        .banner-carousel {
          height: 350px;
        }
        
        .banner-content {
          max-width: 100%;
        }
        
        .banner-image {
          opacity: 0.3;
          width: 100%;
        }
      }
      
      @media (max-width: 480px) {
        .masonry-grid {
          column-count: 1;
        }
        
        .hero-slider {
          height: 300px;
        }
        
        .featured-grid {
          grid-template-columns: 1fr;
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

  setupIntersectionObserver() {
    const options = {
      root: null,
      rootMargin: '50px',
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

  renderProductCard(product, index, compact = false) {
    const hasDiscount = product.priceData?.formatted?.discountedPrice && 
                        product.priceData?.formatted?.discountedPrice !== product.priceData?.formatted?.price;
    const discountPercent = hasDiscount ? 
      this.calculateDiscount(product.priceData?.formatted?.price, product.priceData?.formatted?.discountedPrice) : 0;
    
    return `
      <div class="product-card" data-product-id="${product._id}">
        <div class="product-image-container">
          ${product.ribbon ? `<div class="ribbon">${product.ribbon}</div>` : ''}
          <img 
            ${index < 4 ? `src="${this.optimizeImageUrl(product.media?.mainMedia?.image?.url, 400, 400)}"` : `data-src="${this.optimizeImageUrl(product.media?.mainMedia?.image?.url, 400, 400)}"`}
            alt="${product.name || 'Product'}"
            ${index < 4 ? 'onload="this.classList.add(\'loaded\')"' : 'loading="lazy"'}
          >
        </div>
        <div class="product-content">
          <h3 class="product-title">${product.name || 'Product'}</h3>
          
          <div class="price-container">
            ${hasDiscount ? `
              <span class="price discounted">${product.priceData.formatted.discountedPrice}</span>
              <span class="original-price">${product.priceData.formatted.price}</span>
              ${discountPercent > 0 ? `<span class="discount-badge">-${discountPercent}%</span>` : ''}
            ` : `
              <span class="price">${product.priceData?.formatted?.price || 'N/A'}</span>
            `}
          </div>
          
          ${!compact ? `
            <div class="quick-actions">
              <button class="quick-btn view-btn" data-action="view">View</button>
              <button class="quick-btn add-btn" data-action="add">Add to Cart</button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderLayout1() {
    const layout = this.styleProps.layout1 || 'hero-slider';
    const products = this.products.slice(0, 5);
    
    if (layout === 'hero-slider') {
      return `
        <div class="hero-slider" data-slider="hero">
          <div class="hero-slides">
            ${products.map((product, index) => `
              <div class="hero-slide ${index === 0 ? 'active' : ''}" data-slide="${index}">
                <img 
                  class="hero-slide-image" 
                  src="${this.optimizeImageUrl(product.media?.mainMedia?.image?.url, 800, 600)}"
                  alt="${product.name}"
                  onload="this.classList.add('loaded')"
                >
                <div class="hero-slide-content">
                  <h1 class="hero-slide-title">${product.name}</h1>
                  <div class="hero-slide-price">${product.priceData?.formatted?.price || ''}</div>
                  <p class="hero-slide-description">${product.description?.substring(0, 150) || 'Discover this amazing product'}...</p>
                  <button class="hero-cta" data-product-id="${product._id}" data-action="view">Shop Now</button>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="hero-arrows">
            <button class="hero-arrow" data-direction="prev">‹</button>
            <button class="hero-arrow" data-direction="next">›</button>
          </div>
          <div class="hero-nav">
            ${products.map((_, index) => `
              <div class="hero-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (layout === 'featured-grid') {
      return `
        <div class="featured-grid">
          ${products.map((product, index) => `
            <div class="featured-item" data-product-id="${product._id}">
              <img 
                class="featured-bg" 
                src="${this.optimizeImageUrl(product.media?.mainMedia?.image?.url, 600, 600)}"
                alt="${product.name}"
              >
              <div class="featured-overlay">
                <h2 class="featured-title">${product.name}</h2>
                <div class="featured-price">${product.priceData?.formatted?.price || ''}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } else if (layout === 'banner-carousel') {
      return `
        <div class="banner-carousel" data-slider="banner">
          <div class="banner-slides" data-current="0">
            ${products.map((product, index) => `
              <div class="banner-slide" data-slide="${index}">
                <img 
                  class="banner-image" 
                  src="${this.optimizeImageUrl(product.media?.mainMedia?.image?.url, 800, 500)}"
                  alt="${product.name}"
                >
                <div class="banner-content">
                  <h2 class="banner-title">${product.name}</h2>
                  <div class="banner-price">${product.priceData?.formatted?.price || ''}</div>
                  <button class="hero-cta" data-product-id="${product._id}" data-action="view">Shop Now</button>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="hero-arrows">
            <button class="hero-arrow" data-direction="prev">‹</button>
            <button class="hero-arrow" data-direction="next">›</button>
          </div>
        </div>
      `;
    }
  }

  renderLayout2() {
    const layout = this.styleProps.layout2 || 'product-carousel';
    const products = this.products.slice(5, 13);
    
    if (layout === 'product-carousel') {
      return `
        <div class="product-carousel" data-slider="carousel">
          <div class="carousel-track" data-current="0">
            ${products.map((product, index) => `
              <div class="carousel-item">
                ${this.renderProductCard(product, index + 5)}
              </div>
            `).join('')}
          </div>
          <div class="carousel-arrows">
            <button class="carousel-arrow" data-direction="prev">‹</button>
            <button class="carousel-arrow" data-direction="next">›</button>
          </div>
        </div>
      `;
    } else if (layout === 'masonry-grid') {
      return `
        <div class="masonry-grid">
          ${products.map((product, index) => `
            <div class="masonry-item">
              ${this.renderProductCard(product, index + 5)}
            </div>
          `).join('')}
        </div>
      `;
    } else if (layout === 'vertical-slider') {
      return `
        <div class="vertical-slider">
          <div class="vertical-main" data-slider="vertical">
            <div class="vertical-slides">
              ${products.map((product, index) => `
                <div class="vertical-slide ${index === 0 ? 'active' : ''}" data-slide="${index}">
                  <img 
                    src="${this.optimizeImageUrl(product.media?.mainMedia?.image?.url, 700, 700)}"
                    alt="${product.name}"
                  >
                </div>
              `).join('')}
            </div>
          </div>
          <div class="vertical-thumbs">
            ${products.map((product, index) => `
              <div class="vertical-thumb ${index === 0 ? 'active' : ''}" data-index="${index}">
                <img 
                  src="${this.optimizeImageUrl(product.media?.mainMedia?.image?.url, 200, 150)}"
                  alt="${product.name}"
                >
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  }

  renderLayout3() {
    const layout = this.styleProps.layout3 || 'grid-showcase';
    const products = this.products.slice(13, 21);
    
    if (layout === 'grid-showcase') {
      return `
        <div class="featured-grid">
          ${products.map((product, index) => `
            <div class="featured-item" data-product-id="${product._id}">
              <img 
                class="featured-bg" 
                src="${this.optimizeImageUrl(product.media?.mainMedia?.image?.url, 500, 400)}"
                alt="${product.name}"
              >
              <div class="featured-overlay">
                <h2 class="featured-title">${product.name}</h2>
                <div class="featured-price">${product.priceData?.formatted?.price || ''}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } else if (layout === 'horizontal-scroll') {
      return `
        <div class="horizontal-scroll">
          ${products.map((product, index) => `
            <div class="horizontal-scroll-item">
              ${this.renderProductCard(product, index + 13)}
            </div>
          `).join('')}
        </div>
      `;
    } else if (layout === 'split-view') {
      return `
        <div class="split-view" data-slider="split">
          <div class="split-sidebar">
            ${products.slice(0, 4).map((product, index) => `
              <div class="split-thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}">
                <img 
                  src="${this.optimizeImageUrl(product.media?.mainMedia?.image?.url, 300, 225)}"
                  alt="${product.name}"
                >
              </div>
            `).join('')}
          </div>
          <div class="split-main">
            <img 
              class="split-featured" 
              src="${this.optimizeImageUrl(products[0]?.media?.mainMedia?.image?.url, 900, 600)}"
              alt="${products[0]?.name}"
              data-main-image
            >
            <div class="split-info">
              <h2 class="featured-title" data-product-name>${products[0]?.name}</h2>
              <div class="featured-price" data-product-price>${products[0]?.priceData?.formatted?.price}</div>
            </div>
          </div>
        </div>
      `;
    }
  }

  render() {
    console.log('🎨 Rendering advanced showcase...');
    
    if (!this.products || this.products.length === 0) {
      this.innerHTML = `
        <style>${this.getStyles()}</style>
        <div class="showcase-container">
          <div style="padding: 60px; text-align: center; color: ${this.styleProps.textSecondary};">
            <h2 style="font-size: 24px; margin: 0;">Loading products...</h2>
          </div>
        </div>
      `;
      return;
    }

    this.innerHTML = `
      <style>${this.getStyles()}</style>
      <div class="showcase-container">
        <div class="section">
          ${this.renderLayout1()}
        </div>
        
        ${this.products.length > 5 ? `
          <div class="section">
            ${this.renderLayout2()}
          </div>
        ` : ''}
        
        ${this.products.length > 13 ? `
          <div class="section">
            ${this.renderLayout3()}
          </div>
        ` : ''}
      </div>
    `;

    this.setupIntersectionObserver();
    this.attachEventListeners();
    this.initializeSliders();
  }

  initializeSliders() {
    // Initialize hero slider
    const heroSlider = this.querySelector('[data-slider="hero"]');
    if (heroSlider) {
      this.setupHeroSlider(heroSlider);
    }

    // Initialize banner carousel
    const bannerCarousel = this.querySelector('[data-slider="banner"]');
    if (bannerCarousel) {
      this.setupBannerCarousel(bannerCarousel);
    }

    // Initialize product carousel
    const productCarousel = this.querySelector('[data-slider="carousel"]');
    if (productCarousel) {
      this.setupProductCarousel(productCarousel);
    }

    // Initialize vertical slider
    const verticalSlider = this.querySelector('[data-slider="vertical"]');
    if (verticalSlider) {
      this.setupVerticalSlider(verticalSlider);
    }

    // Initialize split view
    const splitView = this.querySelector('[data-slider="split"]');
    if (splitView) {
      this.setupSplitView(splitView);
    }
  }

  setupHeroSlider(slider) {
    const slides = slider.querySelectorAll('.hero-slide');
    const dots = slider.querySelectorAll('.hero-dot');
    const arrows = slider.querySelectorAll('.hero-arrow');
    let currentSlide = 0;

    const goToSlide = (index) => {
      slides.forEach(slide => slide.classList.remove('active'));
      dots.forEach(dot => dot.classList.remove('active'));
      
      slides[index].classList.add('active');
      dots[index].classList.add('active');
      currentSlide = index;
    };

    // Dots navigation
    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => goToSlide(index));
    });

    // Arrow navigation
    arrows.forEach(arrow => {
      arrow.addEventListener('click', () => {
        const direction = arrow.dataset.direction;
        if (direction === 'prev') {
          currentSlide = currentSlide === 0 ? slides.length - 1 : currentSlide - 1;
        } else {
          currentSlide = currentSlide === slides.length - 1 ? 0 : currentSlide + 1;
        }
        goToSlide(currentSlide);
      });
    });

    // Autoplay
    if (this.styleProps.autoplay === 'true') {
      const speed = parseInt(this.styleProps.autoplaySpeed) || 5000;
      this.autoplayIntervals['hero'] = setInterval(() => {
        currentSlide = currentSlide === slides.length - 1 ? 0 : currentSlide + 1;
        goToSlide(currentSlide);
      }, speed);
    }
  }

  setupBannerCarousel(carousel) {
    const slidesContainer = carousel.querySelector('.banner-slides');
    const slides = carousel.querySelectorAll('.banner-slide');
    const arrows = carousel.querySelectorAll('.hero-arrow');
    let currentSlide = parseInt(slidesContainer.dataset.current);

    const goToSlide = (index) => {
      slidesContainer.style.transform = `translateX(-${index * 100}%)`;
      slidesContainer.dataset.current = index;
      currentSlide = index;
    };

    arrows.forEach(arrow => {
      arrow.addEventListener('click', () => {
        const direction = arrow.dataset.direction;
        if (direction === 'prev') {
          currentSlide = currentSlide === 0 ? slides.length - 1 : currentSlide - 1;
        } else {
          currentSlide = currentSlide === slides.length - 1 ? 0 : currentSlide + 1;
        }
        goToSlide(currentSlide);
      });
    });

    // Autoplay
    if (this.styleProps.autoplay === 'true') {
      const speed = parseInt(this.styleProps.autoplaySpeed) || 5000;
      this.autoplayIntervals['banner'] = setInterval(() => {
        currentSlide = currentSlide === slides.length - 1 ? 0 : currentSlide + 1;
        goToSlide(currentSlide);
      }, speed);
    }
  }

  setupProductCarousel(carousel) {
    const track = carousel.querySelector('.carousel-track');
    const items = carousel.querySelectorAll('.carousel-item');
    const prevBtn = carousel.querySelector('[data-direction="prev"]');
    const nextBtn = carousel.querySelector('[data-direction="next"]');
    let currentPosition = 0;
    const itemWidth = 336; // 320px + 16px gap

    const updateButtons = () => {
      const maxScroll = (items.length - 3) * itemWidth;
      prevBtn.disabled = currentPosition === 0;
      nextBtn.disabled = currentPosition >= maxScroll;
    };

    prevBtn.addEventListener('click', () => {
      currentPosition = Math.max(0, currentPosition - itemWidth);
      track.style.transform = `translateX(-${currentPosition}px)`;
      updateButtons();
    });

    nextBtn.addEventListener('click', () => {
      const maxScroll = (items.length - 3) * itemWidth;
      currentPosition = Math.min(maxScroll, currentPosition + itemWidth);
      track.style.transform = `translateX(-${currentPosition}px)`;
      updateButtons();
    });

    updateButtons();
  }

  setupVerticalSlider(slider) {
    const slides = slider.querySelectorAll('.vertical-slide');
    const thumbs = this.querySelectorAll('.vertical-thumb');
    let currentSlide = 0;

    thumbs.forEach((thumb, index) => {
      thumb.addEventListener('click', () => {
        slides.forEach(slide => slide.classList.remove('active'));
        thumbs.forEach(t => t.classList.remove('active'));
        
        slides[index].classList.add('active');
        thumb.classList.add('active');
        currentSlide = index;
      });
    });
  }

  setupSplitView(splitView) {
    const thumbs = splitView.querySelectorAll('.split-thumbnail');
    const mainImage = splitView.querySelector('[data-main-image]');
    const productName = splitView.querySelector('[data-product-name]');
    const productPrice = splitView.querySelector('[data-product-price]');
    const products = this.products.slice(13, 17);

    thumbs.forEach((thumb, index) => {
      thumb.addEventListener('click', () => {
        thumbs.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        
        const product = products[index];
        if (product) {
          mainImage.src = this.optimizeImageUrl(product.media?.mainMedia?.image?.url, 900, 600);
          productName.textContent = product.name;
          productPrice.textContent = product.priceData?.formatted?.price;
        }
      });
    });
  }

  attachEventListeners() {
    // View product buttons
    this.querySelectorAll('[data-action="view"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const productId = e.target.dataset.productId || e.target.closest('[data-product-id]')?.dataset.productId;
        const product = this.products.find(p => p._id === productId);
        
        if (product) {
          this.dispatchEvent(new CustomEvent('viewProduct', {
            detail: { productId, product }
          }));
        }
      });
    });

    // Add to cart buttons
    this.querySelectorAll('[data-action="add"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const card = e.target.closest('[data-product-id]');
        const productId = card?.dataset.productId;
        const product = this.products.find(p => p._id === productId);
        
        if (product) {
          this.dispatchEvent(new CustomEvent('addToCart', {
            detail: { 
              productId, 
              choices: {}, 
              quantity: 1 
            }
          }));
        }
      });
    });

    // Featured item clicks
    this.querySelectorAll('.featured-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('quick-btn')) return;
        
        const productId = item.dataset.productId;
        const product = this.products.find(p => p._id === productId);
        
        if (product) {
          this.dispatchEvent(new CustomEvent('viewProduct', {
            detail: { productId, product }
          }));
        }
      });
    });
  }

  updateErrorDisplay(productId) {
    // Error display can be added if needed
  }
}

customElements.define('advanced-product-showcase', AdvancedProductShowcase);
