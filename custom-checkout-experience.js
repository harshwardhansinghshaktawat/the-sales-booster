class ProductLandingPage extends HTMLElement {
  constructor() {
    super();
    this.product = null;
    this.selectedOptions = {};
    this.quantity = 1;
    this.currentImageIndex = 0;
    this.currentVariantImages = [];
    
    // Default style props and content
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
      // Content fields
      heroTitle: '',
      heroSubtitle: '',
      feature1Title: 'Premium Quality',
      feature1Text: 'Crafted with the finest materials',
      feature2Title: 'Fast Shipping',
      feature2Text: 'Delivered to your door quickly',
      feature3Title: 'Easy Returns',
      feature3Text: '30-day money-back guarantee',
      feature4Title: 'Customer Support',
      feature4Text: '24/7 dedicated support team',
      ctaText: 'Add to Cart',
      benefitsTitle: 'Why Choose This Product',
      benefitsText: 'Experience the difference with our premium product designed for your needs.',
      testimonialsTitle: 'What Our Customers Say',
      testimonial1: '"Absolutely amazing product! Exceeded all my expectations."',
      testimonial1Author: 'Sarah M.',
      testimonial2: '"Best purchase I\'ve made this year. Highly recommended!"',
      testimonial2Author: 'John D.',
      testimonial3: '"Outstanding quality and exceptional customer service."',
      testimonial3Author: 'Emma L.'
    };
  }

  connectedCallback() {
    this.render();
  }

  static get observedAttributes() {
    return ['product-data', 'style-props'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'product-data' && newVal && newVal !== oldVal) {
      try {
        this.product = JSON.parse(newVal);
        console.log('📦 Product loaded:', this.product?.name);
        console.log('   Options:', this.product?.productOptions?.length || 0);
        console.log('   Variants:', this.product?.variants?.length || 0);
        this.selectedOptions = {};
        this.quantity = 1;
        this.currentImageIndex = 0;
        this.currentVariantImages = this.getAllImages(); // Initialize with default images
        this.render();
      } catch (error) {
        console.error('Error parsing product data:', error);
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
    this.updateTextContent();
  }

  updateTextContent() {
    // Update hero title
    const heroTitle = this.querySelector('.hero-title');
    if (heroTitle && this.styleProps.heroTitle) {
      heroTitle.textContent = this.styleProps.heroTitle;
    }
    
    // Update hero subtitle
    const heroSubtitle = this.querySelector('.hero-subtitle');
    if (heroSubtitle && this.styleProps.heroSubtitle) {
      heroSubtitle.textContent = this.styleProps.heroSubtitle;
    }
    
    // Update features
    const featureTitles = this.querySelectorAll('[data-feature-title]');
    const featureTexts = this.querySelectorAll('[data-feature-text]');
    
    featureTitles.forEach((el, i) => {
      const key = `feature${i+1}Title`;
      if (this.styleProps[key]) el.textContent = this.styleProps[key];
    });
    
    featureTexts.forEach((el, i) => {
      const key = `feature${i+1}Text`;
      if (this.styleProps[key]) el.textContent = this.styleProps[key];
    });
    
    // Update CTA
    const ctaBtn = this.querySelector('.cta-button');
    if (ctaBtn && this.styleProps.ctaText) {
      ctaBtn.textContent = this.styleProps.ctaText;
    }
    
    // Update benefits
    const benefitsTitle = this.querySelector('[data-benefits-title]');
    const benefitsText = this.querySelector('[data-benefits-text]');
    if (benefitsTitle && this.styleProps.benefitsTitle) {
      benefitsTitle.textContent = this.styleProps.benefitsTitle;
    }
    if (benefitsText && this.styleProps.benefitsText) {
      benefitsText.textContent = this.styleProps.benefitsText;
    }
    
    // Update testimonials
    const testimonialsTitle = this.querySelector('[data-testimonials-title]');
    if (testimonialsTitle && this.styleProps.testimonialsTitle) {
      testimonialsTitle.textContent = this.styleProps.testimonialsTitle;
    }
    
    for (let i = 1; i <= 3; i++) {
      const testimonial = this.querySelector(`[data-testimonial-${i}]`);
      const author = this.querySelector(`[data-testimonial-${i}-author]`);
      
      if (testimonial && this.styleProps[`testimonial${i}`]) {
        testimonial.textContent = this.styleProps[`testimonial${i}`];
      }
      if (author && this.styleProps[`testimonial${i}Author`]) {
        author.textContent = this.styleProps[`testimonial${i}Author`];
      }
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
      
      .hidden {
        display: none !important;
      }
      
      .landing-container {
        width: 100%;
        background: ${secondaryBg};
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      /* ========== HERO SECTION ========== */
      .hero-section {
        background: linear-gradient(135deg, ${primaryAccent}15 0%, ${hoverAccent}10 100%);
        padding: ${parseInt(spacing) * 4}px ${spacing}px;
        position: relative;
        overflow: hidden;
      }
      
      .hero-section::before {
        content: '';
        position: absolute;
        top: -50%;
        right: -10%;
        width: 500px;
        height: 500px;
        background: ${primaryAccent};
        opacity: 0.05;
        border-radius: 50%;
      }
      
      .hero-content {
        max-width: 1400px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: ${parseInt(spacing) * 4}px;
        align-items: center;
        position: relative;
        z-index: 1;
      }
      
      .hero-text {
        padding: ${parseInt(spacing) * 2}px;
      }
      
      .hero-title {
        font-size: ${parseInt(fontSize) * 3.5}px;
        font-weight: 800;
        color: ${textPrimary};
        margin: 0 0 ${parseInt(spacing) * 1.5}px 0;
        line-height: 1.1;
        letter-spacing: -1px;
      }
      
      .hero-subtitle {
        font-size: ${parseInt(fontSize) + 6}px;
        color: ${textSecondary};
        margin: 0 0 ${parseInt(spacing) * 2}px 0;
        line-height: 1.6;
      }
      
      .hero-price {
        font-size: ${parseInt(fontSize) * 3}px;
        font-weight: 800;
        color: ${priceColor};
        margin: ${parseInt(spacing) * 2}px 0;
        display: flex;
        align-items: center;
        gap: ${spacing}px;
      }
      
      .original-price {
        font-size: ${parseInt(fontSize) + 8}px;
        color: ${textSecondary};
        text-decoration: line-through;
        opacity: 0.7;
      }
      
      .discount-badge {
        background: ${successColor};
        color: ${primaryBg};
        padding: 6px 12px;
        border-radius: 20px;
        font-size: ${parseInt(fontSize) - 2}px;
        font-weight: 700;
      }
      
      .hero-gallery {
        position: relative;
        border-radius: ${parseInt(cardRadius) * 2}px;
        overflow: hidden;
        box-shadow: 0 20px 60px ${shadowColor};
        background: ${primaryBg};
      }
      
      .main-image-container {
        position: relative;
        width: 100%;
        padding-top: 100%;
        background: ${shapesColor};
      }
      
      .main-image {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: opacity 0.5s ease;
      }
      
      .ribbon {
        position: absolute;
        top: ${spacing}px;
        right: ${spacing}px;
        background: ${errorColor};
        color: ${primaryBg};
        padding: 8px 16px;
        border-radius: 25px;
        font-size: ${parseInt(fontSize) - 2}px;
        font-weight: 700;
        text-transform: uppercase;
        z-index: 2;
        box-shadow: 0 4px 12px ${shadowColor};
      }
      
      .thumbnail-gallery {
        display: flex;
        gap: ${spacing}px;
        padding: ${spacing}px;
        overflow-x: auto;
      }
      
      .thumbnail {
        min-width: 80px;
        height: 80px;
        border: 3px solid transparent;
        border-radius: ${cardRadius}px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.3s;
      }
      
      .thumbnail:hover {
        border-color: ${primaryAccent};
        transform: scale(1.05);
      }
      
      .thumbnail.active {
        border-color: ${primaryAccent};
        box-shadow: 0 0 0 3px ${primaryAccent}30;
      }
      
      .thumbnail img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      /* ========== OPTIONS SECTION ========== */
      .options-section {
        max-width: 1400px;
        margin: 0 auto;
        padding: ${parseInt(spacing) * 4}px ${spacing}px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: ${parseInt(spacing) * 4}px;
      }
      
      .product-options {
        background: ${primaryBg};
        padding: ${parseInt(spacing) * 3}px;
        border-radius: ${parseInt(cardRadius) * 2}px;
        box-shadow: 0 8px 24px ${shadowColor};
      }
      
      .section-title {
        font-size: ${parseInt(fontSize) + 8}px;
        font-weight: 700;
        color: ${textPrimary};
        margin: 0 0 ${parseInt(spacing) * 2}px 0;
      }
      
      .option-group {
        margin-bottom: ${parseInt(spacing) * 2}px;
      }
      
      .option-label {
        display: block;
        font-weight: 600;
        font-size: ${parseInt(fontSize) - 1}px;
        color: ${textSecondary};
        margin-bottom: ${spacing}px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .color-swatches {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }
      
      .color-swatch {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        border: 3px solid ${borderColor};
        cursor: pointer;
        transition: all 0.3s;
        position: relative;
        box-shadow: 0 2px 8px ${shadowColor};
      }
      
      .color-swatch:hover {
        transform: scale(1.15);
        border-color: ${primaryAccent};
      }
      
      .color-swatch.selected {
        border-color: ${primaryAccent};
        box-shadow: 0 0 0 3px ${primaryBg}, 0 0 0 6px ${primaryAccent}, 0 4px 16px ${shadowColor};
        transform: scale(1.1);
      }
      
      .color-swatch::after {
        content: attr(data-description);
        position: absolute;
        bottom: -35px;
        left: 50%;
        transform: translateX(-50%) scale(0.9);
        background: ${textPrimary};
        color: ${primaryBg};
        padding: 6px 10px;
        border-radius: 6px;
        font-size: ${parseInt(fontSize) - 5}px;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: all 0.2s;
        font-weight: 600;
        box-shadow: 0 4px 12px ${shadowColor};
        z-index: 10;
      }
      
      .color-swatch:hover::after {
        opacity: 1;
        transform: translateX(-50%) scale(1);
      }
      
      .size-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }
      
      .size-button {
        padding: 12px 24px;
        border: 2px solid ${borderColor};
        background: ${primaryBg};
        border-radius: ${cardRadius}px;
        font-size: ${parseInt(fontSize) - 1}px;
        font-weight: 600;
        color: ${textPrimary};
        cursor: pointer;
        transition: all 0.3s;
        min-width: 70px;
        text-align: center;
      }
      
      .size-button:hover {
        border-color: ${primaryAccent};
        background: ${primaryAccent}10;
        transform: translateY(-2px);
      }
      
      .size-button.selected {
        border-color: ${primaryAccent};
        background: ${primaryAccent};
        color: ${primaryBg};
        box-shadow: 0 4px 12px ${primaryAccent}40;
      }
      
      .dropdown-select {
        width: 100%;
        padding: 14px 16px;
        border: 2px solid ${borderColor};
        border-radius: ${cardRadius}px;
        font-size: ${parseInt(fontSize)}px;
        color: ${textPrimary};
        background: ${primaryBg};
        cursor: pointer;
        transition: all 0.3s;
        font-weight: 500;
      }
      
      .dropdown-select:hover,
      .dropdown-select:focus {
        border-color: ${primaryAccent};
        outline: none;
        box-shadow: 0 0 0 4px ${primaryAccent}20;
      }
      
      .quantity-selector {
        display: flex;
        align-items: center;
        gap: ${spacing}px;
        margin: ${parseInt(spacing) * 2}px 0;
      }
      
      .quantity-label {
        font-weight: 700;
        font-size: ${fontSize}px;
        color: ${textPrimary};
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .quantity-controls {
        display: flex;
        align-items: center;
        gap: 12px;
        background: ${secondaryBg};
        padding: 8px 16px;
        border-radius: ${cardRadius}px;
        border: 2px solid ${borderColor};
      }
      
      .quantity-btn {
        width: 36px;
        height: 36px;
        border: none;
        background: ${primaryBg};
        border-radius: ${parseInt(cardRadius) / 2}px;
        font-size: 20px;
        font-weight: 700;
        color: ${textPrimary};
        cursor: pointer;
        transition: all 0.3s;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .quantity-btn:hover:not(:disabled) {
        background: ${primaryAccent};
        color: ${primaryBg};
        transform: scale(1.1);
      }
      
      .quantity-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
      
      .quantity-value {
        min-width: 40px;
        text-align: center;
        font-size: ${parseInt(fontSize) + 4}px;
        font-weight: 800;
        color: ${textPrimary};
      }
      
      .cta-button {
        width: 100%;
        padding: ${parseInt(spacing) + 4}px ${parseInt(spacing) * 3}px;
        background: ${primaryAccent};
        color: ${primaryBg};
        border: none;
        border-radius: ${parseInt(cardRadius) * 2}px;
        font-size: ${parseInt(fontSize) + 4}px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        text-transform: uppercase;
        letter-spacing: 1px;
        box-shadow: 0 8px 24px ${primaryAccent}40;
        margin-top: ${parseInt(spacing) * 2}px;
      }
      
      .cta-button:hover {
        background: ${hoverAccent};
        transform: translateY(-3px);
        box-shadow: 0 12px 32px ${primaryAccent}50;
      }
      
      .cta-button:active {
        transform: translateY(-1px);
      }
      
      .error-message {
        background: ${errorBg};
        color: ${errorColor};
        padding: 12px 16px;
        border-radius: ${cardRadius}px;
        border-left: 4px solid ${errorColor};
        margin: ${spacing}px 0;
        font-size: ${parseInt(fontSize) - 2}px;
        font-weight: 600;
        display: none;
      }
      
      .error-message.visible {
        display: block;
      }
      
      /* ========== FEATURES GRID ========== */
      .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: ${parseInt(spacing) * 2}px;
        background: ${primaryBg};
        padding: ${parseInt(spacing) * 3}px;
        border-radius: ${parseInt(cardRadius) * 2}px;
        box-shadow: 0 8px 24px ${shadowColor};
      }
      
      .feature-card {
        text-align: center;
        padding: ${parseInt(spacing) * 2}px;
        border-radius: ${cardRadius}px;
        transition: all 0.3s;
      }
      
      .feature-card:hover {
        background: ${secondaryBg};
        transform: translateY(-5px);
      }
      
      .feature-icon {
        width: 60px;
        height: 60px;
        margin: 0 auto ${spacing}px auto;
        background: linear-gradient(135deg, ${primaryAccent}, ${hoverAccent});
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        box-shadow: 0 4px 16px ${primaryAccent}30;
      }
      
      .feature-title {
        font-size: ${parseInt(fontSize) + 2}px;
        font-weight: 700;
        color: ${textPrimary};
        margin: 0 0 8px 0;
      }
      
      .feature-text {
        font-size: ${parseInt(fontSize) - 1}px;
        color: ${textSecondary};
        line-height: 1.6;
      }
      
      /* ========== BENEFITS SECTION ========== */
      .benefits-section {
        max-width: 1400px;
        margin: 0 auto;
        padding: ${parseInt(spacing) * 4}px ${spacing}px;
        text-align: center;
      }
      
      .benefits-title {
        font-size: ${parseInt(fontSize) * 2.5}px;
        font-weight: 800;
        color: ${textPrimary};
        margin: 0 0 ${spacing}px 0;
      }
      
      .benefits-text {
        font-size: ${parseInt(fontSize) + 2}px;
        color: ${textSecondary};
        max-width: 700px;
        margin: 0 auto ${parseInt(spacing) * 3}px auto;
        line-height: 1.8;
      }
      
      .benefits-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: ${parseInt(spacing) * 2}px;
        margin-top: ${parseInt(spacing) * 3}px;
      }
      
      .benefit-card {
        background: ${primaryBg};
        padding: ${parseInt(spacing) * 3}px;
        border-radius: ${parseInt(cardRadius) * 2}px;
        box-shadow: 0 4px 16px ${shadowColor};
        transition: all 0.3s;
      }
      
      .benefit-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 12px 32px ${shadowColor};
      }
      
      .benefit-number {
        width: 50px;
        height: 50px;
        margin: 0 auto ${spacing}px auto;
        background: ${primaryAccent};
        color: ${primaryBg};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${parseInt(fontSize) + 6}px;
        font-weight: 800;
      }
      
      /* ========== TESTIMONIALS ========== */
      .testimonials-section {
        background: linear-gradient(135deg, ${primaryAccent}10 0%, ${hoverAccent}05 100%);
        padding: ${parseInt(spacing) * 4}px ${spacing}px;
      }
      
      .testimonials-container {
        max-width: 1400px;
        margin: 0 auto;
      }
      
      .testimonials-title {
        font-size: ${parseInt(fontSize) * 2.5}px;
        font-weight: 800;
        color: ${textPrimary};
        text-align: center;
        margin: 0 0 ${parseInt(spacing) * 3}px 0;
      }
      
      .testimonials-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: ${parseInt(spacing) * 2}px;
      }
      
      .testimonial-card {
        background: ${primaryBg};
        padding: ${parseInt(spacing) * 3}px;
        border-radius: ${parseInt(cardRadius) * 2}px;
        box-shadow: 0 8px 24px ${shadowColor};
        position: relative;
      }
      
      .testimonial-quote {
        font-size: 60px;
        color: ${primaryAccent};
        opacity: 0.2;
        position: absolute;
        top: 10px;
        left: 20px;
        line-height: 1;
      }
      
      .testimonial-text {
        font-size: ${parseInt(fontSize) + 2}px;
        color: ${textPrimary};
        line-height: 1.7;
        margin: ${parseInt(spacing) * 2}px 0 ${spacing}px 0;
        position: relative;
      }
      
      .testimonial-author {
        font-size: ${parseInt(fontSize) - 1}px;
        color: ${textSecondary};
        font-weight: 600;
      }
      
      .testimonial-stars {
        color: #fbbf24;
        margin-bottom: ${spacing}px;
      }
      
      /* ========== RESPONSIVE ========== */
      @media (max-width: 1024px) {
        .hero-content {
          grid-template-columns: 1fr;
        }
        
        .options-section {
          grid-template-columns: 1fr;
        }
      }
      
      @media (max-width: 768px) {
        .hero-title {
          font-size: ${parseInt(fontSize) * 2.5}px;
        }
        
        .hero-subtitle {
          font-size: ${parseInt(fontSize) + 2}px;
        }
        
        .hero-price {
          font-size: ${parseInt(fontSize) * 2}px;
        }
        
        .features-grid {
          grid-template-columns: 1fr;
        }
      }
    `;
  }

  optimizeImageUrl(url, width = 600, height = 600) {
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

  getAllImages() {
    if (!this.product) return [];
    
    const images = [];
    
    // Main image
    if (this.product.media?.mainMedia?.image?.url) {
      images.push(this.product.media.mainMedia.image.url);
    }
    
    // Additional images
    if (this.product.media?.items) {
      this.product.media.items.forEach(item => {
        if (item.image?.url && item.image.url !== images[0]) {
          images.push(item.image.url);
        }
      });
    }
    
    return images.slice(0, 5); // Max 5 images
  }

  // Get variant-specific images based on selected choices
  getVariantImages(choices) {
    if (!this.product?.variants || !choices || Object.keys(choices).length === 0) {
      return this.getAllImages(); // Return default images if no variant selected
    }

    console.log('🔍 Finding variant images for choices:', choices);

    // Find matching variant
    for (const variant of this.product.variants) {
      const variantChoices = variant.choices || {};
      
      // Check if this variant matches the selected choices
      let isMatch = true;
      for (const [optionName, selectedValue] of Object.entries(choices)) {
        if (variantChoices[optionName] !== selectedValue) {
          isMatch = false;
          break;
        }
      }
      
      if (isMatch) {
        console.log('✅ Found matching variant:', variant._id);
        
        // Get images for this variant
        const variantImages = [];
        
        // V3 Catalog: variant.media
        if (variant.media?.items) {
          variant.media.items.forEach(item => {
            if (item.image?.url) {
              variantImages.push(item.image.url);
            }
          });
        }
        
        // V1 Catalog: variant.variant.media
        if (variant.variant?.media?.items) {
          variant.variant.media.items.forEach(item => {
            if (item.image?.url) {
              variantImages.push(item.image.url);
            }
          });
        }
        
        // If variant has images, return them
        if (variantImages.length > 0) {
          console.log('🖼️ Variant has', variantImages.length, 'specific images');
          return variantImages.slice(0, 5); // Max 5 images
        }
        
        console.log('ℹ️ Variant has no specific images, using default');
        break;
      }
    }
    
    // Return default images if no variant images found
    return this.getAllImages();
  }

  updateGalleryImages(images) {
    console.log('🖼️ Updating gallery with', images.length, 'images');
    
    this.currentVariantImages = images;
    this.currentImageIndex = 0;
    
    // Update main images
    const mainImageContainer = this.querySelector('.main-image-container');
    if (mainImageContainer) {
      mainImageContainer.innerHTML = images.map((img, index) => `
        <img 
          class="main-image ${index === 0 ? '' : 'hidden'}" 
          src="${this.optimizeImageUrl(img, 600, 600)}"
          alt="${this.product.name}"
          data-image-index="${index}"
          onload="this.style.opacity = '1'"
          style="opacity: 0; transition: opacity 0.5s ease;"
        >
      `).join('');
    }
    
    // Update thumbnails
    const thumbnailGallery = this.querySelector('.thumbnail-gallery');
    if (thumbnailGallery && images.length > 1) {
      thumbnailGallery.innerHTML = images.map((img, index) => `
        <div class="thumbnail ${index === 0 ? 'active' : ''}" data-thumbnail="${index}">
          <img src="${this.optimizeImageUrl(img, 100, 100)}" alt="View ${index + 1}">
        </div>
      `).join('');
      
      // Re-attach thumbnail click listeners
      this.querySelectorAll('.thumbnail').forEach(thumb => {
        thumb.addEventListener('click', () => {
          const index = parseInt(thumb.dataset.thumbnail);
          this.switchImage(index);
        });
      });
    } else if (thumbnailGallery) {
      // Hide thumbnail gallery if only one image
      thumbnailGallery.style.display = 'none';
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

  render() {
    console.log('🎨 Rendering product landing page...');
    
    if (!this.product) {
      this.innerHTML = `
        <style>${this.getStyles()}</style>
        <div class="landing-container">
          <div style="padding: 100px 20px; text-align: center; color: ${this.styleProps.textSecondary};">
            <h2 style="font-size: 32px; margin: 0 0 16px 0;">Select a Product</h2>
            <p style="font-size: 18px;">Choose a product from the panel to display this stunning landing page.</p>
          </div>
        </div>
      `;
      return;
    }

    const images = this.currentVariantImages.length > 0 ? this.currentVariantImages : this.getAllImages();
    const hasDiscount = this.product.priceData?.formatted?.discountedPrice && 
                        this.product.priceData?.formatted?.discountedPrice !== this.product.priceData?.formatted?.price;
    const discountPercent = hasDiscount ? 
      this.calculateDiscount(this.product.priceData?.formatted?.price, this.product.priceData?.formatted?.discountedPrice) : 0;

    const heroTitle = this.styleProps.heroTitle || this.product.name;
    const heroSubtitle = this.styleProps.heroSubtitle || this.product.description?.substring(0, 200) || 'Experience excellence with our premium product.';

    this.innerHTML = `
      <style>${this.getStyles()}</style>
      <div class="landing-container">
        
        <!-- HERO SECTION -->
        <section class="hero-section">
          <div class="hero-content">
            <div class="hero-text">
              <h1 class="hero-title">${heroTitle}</h1>
              <p class="hero-subtitle">${heroSubtitle}</p>
              
              <div class="hero-price">
                ${hasDiscount ? `
                  <span>${this.product.priceData.formatted.discountedPrice}</span>
                  <span class="original-price">${this.product.priceData.formatted.price}</span>
                  ${discountPercent > 0 ? `<span class="discount-badge">Save ${discountPercent}%</span>` : ''}
                ` : `
                  <span>${this.product.priceData?.formatted?.price || 'Contact for price'}</span>
                `}
              </div>
            </div>
            
            <div class="hero-gallery">
              ${this.product.ribbon ? `<div class="ribbon">${this.product.ribbon}</div>` : ''}
              <div class="main-image-container">
                ${images.map((img, index) => `
                  <img 
                    class="main-image ${index === 0 ? '' : 'hidden'}" 
                    src="${this.optimizeImageUrl(img, 600, 600)}"
                    alt="${this.product.name}"
                    data-image-index="${index}"
                    onload="this.style.opacity = '1'"
                    style="opacity: 0; transition: opacity 0.5s ease;"
                  >
                `).join('')}
              </div>
              
              ${images.length > 1 ? `
                <div class="thumbnail-gallery">
                  ${images.map((img, index) => `
                    <div class="thumbnail ${index === 0 ? 'active' : ''}" data-thumbnail="${index}">
                      <img src="${this.optimizeImageUrl(img, 100, 100)}" alt="View ${index + 1}">
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        </section>
        
        <!-- OPTIONS & FEATURES SECTION -->
        <section class="options-section">
          <div class="product-options">
            <h2 class="section-title">Configure Your Product</h2>
            
            ${this.product.productOptions && this.product.productOptions.length > 0 ? `
              ${this.product.productOptions.map(option => `
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
                          data-description="${choice.description}"
                        ></div>
                      `).join('')}
                    </div>
                  ` : option.choices.length <= 6 ? `
                    <div class="size-buttons">
                      ${option.choices.map(choice => `
                        <button 
                          class="size-button"
                          data-option="${option.name}"
                          data-value="${choice.description}"
                        >${choice.description}</button>
                      `).join('')}
                    </div>
                  ` : `
                    <select class="dropdown-select" data-option="${option.name}">
                      <option value="">Choose ${option.name}</option>
                      ${option.choices.map(choice => `
                        <option value="${choice.description}">${choice.description}</option>
                      `).join('')}
                    </select>
                  `}
                </div>
              `).join('')}
            ` : ''}
            
            <div class="quantity-selector">
              <span class="quantity-label">Quantity</span>
              <div class="quantity-controls">
                <button class="quantity-btn" data-action="decrease">−</button>
                <span class="quantity-value">1</span>
                <button class="quantity-btn" data-action="increase">+</button>
              </div>
            </div>
            
            <div class="error-message"></div>
            
            <button class="cta-button">${this.styleProps.ctaText || 'Add to Cart'}</button>
          </div>
          
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">✓</div>
              <h3 class="feature-title" data-feature-title>${this.styleProps.feature1Title}</h3>
              <p class="feature-text" data-feature-text>${this.styleProps.feature1Text}</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">⚡</div>
              <h3 class="feature-title" data-feature-title>${this.styleProps.feature2Title}</h3>
              <p class="feature-text" data-feature-text>${this.styleProps.feature2Text}</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">↺</div>
              <h3 class="feature-title" data-feature-title>${this.styleProps.feature3Title}</h3>
              <p class="feature-text" data-feature-text>${this.styleProps.feature3Text}</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">♥</div>
              <h3 class="feature-title" data-feature-title>${this.styleProps.feature4Title}</h3>
              <p class="feature-text" data-feature-text>${this.styleProps.feature4Text}</p>
            </div>
          </div>
        </section>
        
        <!-- BENEFITS SECTION -->
        <section class="benefits-section">
          <h2 class="benefits-title" data-benefits-title>${this.styleProps.benefitsTitle}</h2>
          <p class="benefits-text" data-benefits-text>${this.styleProps.benefitsText}</p>
          
          <div class="benefits-grid">
            ${[1, 2, 3].map(num => `
              <div class="benefit-card">
                <div class="benefit-number">${num}</div>
                <h3 class="feature-title">Key Benefit ${num}</h3>
                <p class="feature-text">Experience the difference with our exceptional quality and service.</p>
              </div>
            `).join('')}
          </div>
        </section>
        
        <!-- TESTIMONIALS SECTION -->
        <section class="testimonials-section">
          <div class="testimonials-container">
            <h2 class="testimonials-title" data-testimonials-title>${this.styleProps.testimonialsTitle}</h2>
            
            <div class="testimonials-grid">
              ${[1, 2, 3].map(num => `
                <div class="testimonial-card">
                  <div class="testimonial-quote">"</div>
                  <div class="testimonial-stars">★★★★★</div>
                  <p class="testimonial-text" data-testimonial-${num}>${this.styleProps[`testimonial${num}`]}</p>
                  <p class="testimonial-author" data-testimonial-${num}-author>— ${this.styleProps[`testimonial${num}Author`]}</p>
                </div>
              `).join('')}
            </div>
          </div>
        </section>
        
      </div>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    // Thumbnail clicks
    this.querySelectorAll('.thumbnail').forEach(thumb => {
      thumb.addEventListener('click', () => {
        const index = parseInt(thumb.dataset.thumbnail);
        this.switchImage(index);
      });
    });

    // Color swatches - WITH IMAGE SWITCHING
    this.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.addEventListener('click', (e) => {
        const option = e.target.dataset.option;
        const value = e.target.dataset.value;
        
        this.selectedOptions[option] = value;
        
        // Update UI
        this.querySelectorAll(`.color-swatch[data-option="${option}"]`).forEach(s => {
          s.classList.remove('selected');
        });
        e.target.classList.add('selected');
        
        this.clearError();
        
        // UPDATE IMAGES BASED ON VARIANT
        console.log('🎨 Color selected, updating images...');
        const variantImages = this.getVariantImages(this.selectedOptions);
        this.updateGalleryImages(variantImages);
      });
    });

    // Size buttons
    this.querySelectorAll('.size-button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const option = e.target.dataset.option;
        const value = e.target.dataset.value;
        
        this.selectedOptions[option] = value;
        
        // Update UI
        this.querySelectorAll(`.size-button[data-option="${option}"]`).forEach(b => {
          b.classList.remove('selected');
        });
        e.target.classList.add('selected');
        
        this.clearError();
      });
    });

    // Dropdowns
    this.querySelectorAll('.dropdown-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const option = e.target.dataset.option;
        const value = e.target.value;
        
        if (value) {
          this.selectedOptions[option] = value;
        } else {
          delete this.selectedOptions[option];
        }
        
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
        
        valueEl.textContent = this.quantity;
        
        // Update button states
        const decreaseBtn = this.querySelector('[data-action="decrease"]');
        const increaseBtn = this.querySelector('[data-action="increase"]');
        decreaseBtn.disabled = this.quantity <= 1;
        increaseBtn.disabled = this.quantity >= 99;
      });
    });

    // Add to cart
    const ctaButton = this.querySelector('.cta-button');
    if (ctaButton) {
      ctaButton.addEventListener('click', () => {
        if (this.validateOptions()) {
          this.dispatchEvent(new CustomEvent('addToCart', {
            detail: {
              productId: this.product._id,
              choices: this.selectedOptions,
              quantity: this.quantity
            }
          }));
        }
      });
    }
  }

  switchImage(index) {
    const images = this.querySelectorAll('.main-image');
    const thumbnails = this.querySelectorAll('.thumbnail');
    
    images.forEach(img => {
      img.classList.add('hidden');
      img.style.opacity = '0';
    });
    
    if (images[index]) {
      images[index].classList.remove('hidden');
      // Trigger reflow for smooth transition
      void images[index].offsetWidth;
      images[index].style.opacity = '1';
    }
    
    thumbnails.forEach(thumb => thumb.classList.remove('active'));
    thumbnails[index]?.classList.add('active');
    
    this.currentImageIndex = index;
  }

  validateOptions() {
    if (!this.product.productOptions || this.product.productOptions.length === 0) {
      return true;
    }

    const missing = [];
    this.product.productOptions.forEach(option => {
      if (!this.selectedOptions[option.name]) {
        missing.push(option.name);
      }
    });

    if (missing.length > 0) {
      this.showError(`Please select: ${missing.join(', ')}`);
      return false;
    }

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
}

customElements.define('product-landing-page', ProductLandingPage);
