class ReviewsCarouselElement extends HTMLElement {
    constructor() {
        super();
        this.currentIndex = 0;
        this.reviews = [];
        this.autoPlayInterval = null;
        this.isAnimating = false;
        
        this.settings = {
            backgroundColor: '#0a0a0a',
            cardColor: '#1f1f1f',
            textColor: '#ffffff',
            accentColor: '#00bfff',
            starFilledColor: '#ffd700',
            starEmptyColor: '#4a5568',
            verifiedColor: '#2ecc71',
            fontFamily: 'Arial, sans-serif',
            fontSize: 14,
            autoPlay: true,
            autoPlaySpeed: 5,
            maxReviews: 10
        };
    }

    connectedCallback() {
        this.render();
        console.log('Reviews carousel connected');
    }

    static get observedAttributes() {
        return ['reviews', 'options'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (newValue && newValue !== oldValue) {
            console.log(`Attribute changed: ${name}`, newValue);
            
            if (name === 'reviews') {
                try {
                    const parsedReviews = JSON.parse(newValue);
                    console.log('Parsed reviews:', parsedReviews);
                    this.reviews = parsedReviews;
                    this.currentIndex = 0;
                    this.updateCarousel(0);
                    
                    if (this.settings.autoPlay && this.reviews.length > 1) {
                        this.startAutoPlay();
                    }
                } catch (e) {
                    console.error('Error parsing reviews:', e);
                }
            } else if (name === 'options') {
                try {
                    const oldAutoPlay = this.settings.autoPlay;
                    const newSettings = JSON.parse(newValue);
                    console.log('New settings:', newSettings);
                    Object.assign(this.settings, newSettings);
                    this.updateStyles();
                    
                    if (this.settings.autoPlay && !oldAutoPlay) {
                        this.startAutoPlay();
                    } else if (!this.settings.autoPlay && oldAutoPlay) {
                        this.stopAutoPlay();
                    } else if (this.settings.autoPlay) {
                        this.stopAutoPlay();
                        this.startAutoPlay();
                    }
                } catch (e) {
                    console.error('Error parsing options:', e);
                }
            }
        }
    }

    render() {
        this.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    min-height: 500px;
                    position: relative;
                }
                
                .carousel-wrapper {
                    width: 100%;
                    min-height: 500px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 60px 20px;
                    position: relative;
                    overflow: hidden;
                }
                
                .carousel-container {
                    width: 100%;
                    max-width: 1400px;
                    height: 480px;
                    position: relative;
                    perspective: 2000px;
                    margin: 20px 0;
                }
                
                .carousel-track {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    position: relative;
                    transform-style: preserve-3d;
                }
                
                .review-card {
                    position: absolute;
                    width: 340px;
                    height: 450px;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
                    transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
                    cursor: pointer;
                    will-change: transform, opacity;
                    transform-origin: center;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(10px);
                }
                
                .review-card::before {
                    content: "";
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    opacity: 0;
                    transition: opacity 0.4s ease;
                    z-index: 2;
                    pointer-events: none;
                }
                
                .review-card:hover::before {
                    opacity: 0.1;
                }
                
                .card-image {
                    width: 100%;
                    height: 200px;
                    object-fit: cover;
                    transition: all 0.7s ease;
                    filter: brightness(0.8);
                }
                
                .review-card:hover .card-image {
                    filter: brightness(1);
                }
                
                .card-content {
                    padding: 24px;
                    height: calc(100% - 200px);
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    position: relative;
                    z-index: 3;
                }
                
                .product-name {
                    font-size: 1.2em;
                    font-weight: 700;
                    margin-bottom: 4px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                
                .product-price {
                    font-size: 1.1em;
                    font-weight: 700;
                    margin-bottom: 8px;
                }
                
                .stars-container {
                    display: flex;
                    gap: 4px;
                    margin-bottom: 8px;
                }
                
                .star {
                    width: 20px;
                    height: 20px;
                    display: inline-block;
                }
                
                .review-title {
                    font-weight: 600;
                    font-size: 1em;
                    margin-bottom: 6px;
                    line-height: 1.3;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                
                .review-body {
                    font-size: 0.9em;
                    line-height: 1.5;
                    opacity: 0.8;
                    flex: 1;
                    overflow: hidden;
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                }
                
                .review-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 12px;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    margin-top: auto;
                }
                
                .author-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex: 1;
                    min-width: 0;
                }
                
                .author-name {
                    font-weight: 600;
                    font-size: 0.9em;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                
                .verified-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 3px 8px;
                    border-radius: 12px;
                    font-size: 0.7em;
                    font-weight: 600;
                    color: white;
                    white-space: nowrap;
                    flex-shrink: 0;
                }
                
                .verified-badge::before {
                    content: '✓';
                    font-size: 1.1em;
                }
                
                .review-card.center {
                    z-index: 10;
                    transform: scale(1.1) translateZ(0);
                }
                
                .review-card.left-2 {
                    z-index: 1;
                    transform: translateX(-420px) scale(0.85) translateZ(-200px) rotateY(15deg);
                    opacity: 0.6;
                }
                
                .review-card.left-1 {
                    z-index: 5;
                    transform: translateX(-210px) scale(0.95) translateZ(-50px) rotateY(8deg);
                    opacity: 0.8;
                }
                
                .review-card.right-1 {
                    z-index: 5;
                    transform: translateX(210px) scale(0.95) translateZ(-50px) rotateY(-8deg);
                    opacity: 0.8;
                }
                
                .review-card.right-2 {
                    z-index: 1;
                    transform: translateX(420px) scale(0.85) translateZ(-200px) rotateY(-15deg);
                    opacity: 0.6;
                }
                
                .review-card.hidden {
                    opacity: 0;
                    pointer-events: none;
                }
                
                .nav-arrow {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    border: 2px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    z-index: 20;
                    transition: all 0.4s cubic-bezier(0.68, -0.6, 0.32, 1.6);
                    font-size: 24px;
                    color: white;
                    backdrop-filter: blur(5px);
                }
                
                .nav-arrow:hover {
                    transform: translateY(-50%) scale(1.1);
                }
                
                .nav-arrow.left {
                    left: 20px;
                }
                
                .nav-arrow.right {
                    right: 20px;
                }
                
                .nav-arrow.hidden {
                    display: none;
                }
                
                .dots-container {
                    display: flex;
                    justify-content: center;
                    gap: 12px;
                    margin-top: 40px;
                }
                
                .dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.2);
                    cursor: pointer;
                    transition: all 0.4s cubic-bezier(0.68, -0.6, 0.32, 1.6);
                    border: 2px solid rgba(255, 255, 255, 0.1);
                }
                
                .dot.active {
                    transform: scale(1.3);
                    animation: pulse 1.5s infinite ease-in-out;
                }
                
                @keyframes pulse {
                    0%, 100% { transform: scale(1.3); }
                    50% { transform: scale(1.5); }
                }
                
                .no-reviews {
                    text-align: center;
                    padding: 60px 20px;
                    font-size: 1.2em;
                    opacity: 0.6;
                }
                
                .bg-blur {
                    position: absolute;
                    width: 500px;
                    height: 500px;
                    border-radius: 50%;
                    filter: blur(100px);
                    opacity: 0.15;
                    z-index: 0;
                    mix-blend-mode: soft-light;
                    pointer-events: none;
                }
                
                .bg-blur-1 {
                    top: -100px;
                    left: -100px;
                    animation: float1 24s ease-in-out infinite alternate;
                }
                
                .bg-blur-2 {
                    bottom: -100px;
                    right: -100px;
                    animation: float2 30s ease-in-out infinite alternate;
                }
                
                @keyframes float1 {
                    0% { transform: translate(10%, 10%) rotate(0deg); }
                    100% { transform: translate(-10%, -10%) rotate(360deg); }
                }
                
                @keyframes float2 {
                    0% { transform: translate(-15%, 5%) rotate(0deg); }
                    100% { transform: translate(15%, -5%) rotate(-360deg); }
                }
                
                @media (max-width: 1024px) {
                    .review-card {
                        width: 280px;
                        height: 400px;
                    }
                    
                    .card-image {
                        height: 160px;
                    }
                    
                    .review-card.left-2 {
                        transform: translateX(-340px) scale(0.85) translateZ(-200px) rotateY(15deg);
                    }
                    
                    .review-card.left-1 {
                        transform: translateX(-170px) scale(0.95) translateZ(-50px) rotateY(8deg);
                    }
                    
                    .review-card.right-1 {
                        transform: translateX(170px) scale(0.95) translateZ(-50px) rotateY(-8deg);
                    }
                    
                    .review-card.right-2 {
                        transform: translateX(340px) scale(0.85) translateZ(-200px) rotateY(-15deg);
                    }
                }
                
                @media (max-width: 768px) {
                    .carousel-container {
                        height: 400px;
                    }
                    
                    .review-card {
                        width: 240px;
                        height: 360px;
                    }
                    
                    .card-image {
                        height: 140px;
                    }
                    
                    .review-card.left-2 {
                        transform: translateX(-280px) scale(0.85) translateZ(-200px) rotateY(15deg);
                    }
                    
                    .review-card.left-1 {
                        transform: translateX(-140px) scale(0.95) translateZ(-50px) rotateY(8deg);
                    }
                    
                    .review-card.right-1 {
                        transform: translateX(140px) scale(0.95) translateZ(-50px) rotateY(-8deg);
                    }
                    
                    .review-card.right-2 {
                        transform: translateX(280px) scale(0.85) translateZ(-200px) rotateY(-15deg);
                    }
                    
                    .nav-arrow {
                        width: 40px;
                        height: 40px;
                        font-size: 20px;
                    }
                }
                
                @media (max-width: 480px) {
                    .carousel-container {
                        height: 380px;
                    }
                    
                    .review-card {
                        width: 200px;
                        height: 340px;
                    }
                    
                    .card-image {
                        height: 120px;
                    }
                    
                    .card-content {
                        padding: 16px;
                    }
                    
                    .review-card.left-2,
                    .review-card.right-2 {
                        display: none;
                    }
                    
                    .review-card.left-1 {
                        transform: translateX(-110px) scale(0.9) translateZ(-50px) rotateY(8deg);
                    }
                    
                    .review-card.right-1 {
                        transform: translateX(110px) scale(0.9) translateZ(-50px) rotateY(-8deg);
                    }
                }
            </style>
            
            <div class="carousel-wrapper">
                <div class="bg-blur bg-blur-1"></div>
                <div class="bg-blur bg-blur-2"></div>
                
                <div class="carousel-container">
                    <div class="carousel-track">
                        <div class="no-reviews">Loading reviews...</div>
                    </div>
                    <button class="nav-arrow left">‹</button>
                    <button class="nav-arrow right">›</button>
                </div>
                
                <div class="dots-container"></div>
            </div>
        `;

        this.setupNavigation();
        this.updateStyles();
    }

    setupNavigation() {
        const leftBtn = this.querySelector('.nav-arrow.left');
        const rightBtn = this.querySelector('.nav-arrow.right');

        if (leftBtn) {
            leftBtn.addEventListener('click', () => this.prevSlide());
        }
        if (rightBtn) {
            rightBtn.addEventListener('click', () => this.nextSlide());
        }

        const track = this.querySelector('.carousel-track');
        if (track) {
            let touchStartX = 0;
            let touchEndX = 0;
            
            track.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            });
            
            track.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                const diff = touchStartX - touchEndX;
                if (Math.abs(diff) > 50) {
                    if (diff > 0) {
                        this.nextSlide();
                    } else {
                        this.prevSlide();
                    }
                }
            });
        }
    }

    updateStyles() {
        const wrapper = this.querySelector('.carousel-wrapper');
        const leftBtn = this.querySelector('.nav-arrow.left');
        const rightBtn = this.querySelector('.nav-arrow.right');
        const blurs = this.querySelectorAll('.bg-blur');

        if (wrapper) {
            wrapper.style.backgroundColor = this.settings.backgroundColor;
            wrapper.style.fontFamily = this.settings.fontFamily;
            wrapper.style.fontSize = `${this.settings.fontSize}px`;
        }

        const buttonsHidden = this.settings.autoPlay;
        if (leftBtn) {
            leftBtn.classList.toggle('hidden', buttonsHidden);
            leftBtn.style.backgroundColor = this.settings.accentColor;
        }
        if (rightBtn) {
            rightBtn.classList.toggle('hidden', buttonsHidden);
            rightBtn.style.backgroundColor = this.settings.accentColor;
        }

        if (blurs.length >= 2) {
            blurs[0].style.background = this.settings.accentColor;
            blurs[1].style.background = this.settings.cardColor;
        }
    }

    updateCarousel(newIndex) {
        if (this.isAnimating) return;
        
        const track = this.querySelector('.carousel-track');
        if (!track) return;

        if (this.reviews.length === 0) {
            track.innerHTML = '<div class="no-reviews">No reviews yet. Be the first to review!</div>';
            return;
        }

        this.isAnimating = true;
        this.currentIndex = (newIndex + this.reviews.length) % this.reviews.length;

        console.log('Updating carousel, current index:', this.currentIndex, 'Total reviews:', this.reviews.length);

        track.innerHTML = '';
        
        this.reviews.forEach((review, i) => {
            const card = this.createCard(review, i);
            track.appendChild(card);
        });

        this.updateDots();
        this.updateStyles();

        setTimeout(() => {
            this.isAnimating = false;
        }, 700);
    }

    createCard(review, index) {
        const card = document.createElement('div');
        card.className = 'review-card';
        card.dataset.index = index;

        const offset = (index - this.currentIndex + this.reviews.length) % this.reviews.length;

        if (offset === 0) {
            card.classList.add('center');
        } else if (offset === 1) {
            card.classList.add('right-1');
        } else if (offset === 2) {
            card.classList.add('right-2');
        } else if (offset === this.reviews.length - 1) {
            card.classList.add('left-1');
        } else if (offset === this.reviews.length - 2) {
            card.classList.add('left-2');
        } else {
            card.classList.add('hidden');
        }

        card.style.backgroundColor = this.settings.cardColor;
        card.style.color = this.settings.textColor;

        const starsHTML = this.renderStars(review.rating);
        
        card.innerHTML = `
            ${review.productImage ? `<img src="${review.productImage}" alt="${review.productName}" class="card-image">` : '<div class="card-image" style="background: linear-gradient(135deg, rgba(0,191,255,0.2) 0%, rgba(0,191,255,0.05) 100%);"></div>'}
            <div class="card-content">
                <div class="product-name">${review.productName}</div>
                <div class="product-price" style="color: ${this.settings.accentColor}">${review.productPrice}</div>
                <div class="stars-container">${starsHTML}</div>
                ${review.title ? `<div class="review-title">${review.title}</div>` : ''}
                <div class="review-body">${review.body}</div>
                <div class="review-footer">
                    <div class="author-info">
                        <span class="author-name">${review.authorName}</span>
                        ${review.verified ? `<span class="verified-badge" style="background-color: ${this.settings.verifiedColor}">Verified</span>` : ''}
                    </div>
                </div>
            </div>
        `;

        card.addEventListener('click', () => {
            if (offset === 0 && review.productUrl) {
                window.location.href = review.productUrl;
            } else {
                this.updateCarousel(index);
            }
        });

        return card;
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let html = '';

        for (let i = 0; i < fullStars; i++) {
            html += `<svg class="star" viewBox="0 0 24 24" fill="${this.settings.starFilledColor}">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>`;
        }

        if (hasHalfStar) {
            html += `<svg class="star" viewBox="0 0 24 24">
                <defs>
                    <linearGradient id="half-grad-${rating}">
                        <stop offset="50%" stop-color="${this.settings.starFilledColor}"/>
                        <stop offset="50%" stop-color="${this.settings.starEmptyColor}"/>
                    </linearGradient>
                </defs>
                <path fill="url(#half-grad-${rating})" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>`;
        }

        for (let i = 0; i < emptyStars; i++) {
            html += `<svg class="star" viewBox="0 0 24 24" fill="${this.settings.starEmptyColor}">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>`;
        }

        return html;
    }

    updateDots() {
        const dotsContainer = this.querySelector('.dots-container');
        if (!dotsContainer) return;

        dotsContainer.innerHTML = '';
        
        this.reviews.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.className = 'dot';
            if (index === this.currentIndex) {
                dot.classList.add('active');
                dot.style.backgroundColor = this.settings.accentColor;
                dot.style.boxShadow = `0 0 15px ${this.settings.accentColor}40, 0 0 0 4px ${this.settings.accentColor}33`;
            }
            
            dot.addEventListener('click', () => {
                this.updateCarousel(index);
                if (this.settings.autoPlay) {
                    this.stopAutoPlay();
                    this.startAutoPlay();
                }
            });
            dotsContainer.appendChild(dot);
        });
    }

    prevSlide() {
        this.updateCarousel(this.currentIndex - 1);
        if (this.settings.autoPlay) {
            this.stopAutoPlay();
            this.startAutoPlay();
        }
    }

    nextSlide() {
        this.updateCarousel(this.currentIndex + 1);
        if (this.settings.autoPlay) {
            this.stopAutoPlay();
            this.startAutoPlay();
        }
    }

    startAutoPlay() {
        this.stopAutoPlay();
        
        if (this.reviews.length > 1) {
            const speed = (this.settings.autoPlaySpeed || 5) * 1000;
            this.autoPlayInterval = setInterval(() => {
                this.nextSlide();
            }, speed);
        }
    }

    stopAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }

    disconnectedCallback() {
        this.stopAutoPlay();
    }
}

customElements.define('reviews-carousel', ReviewsCarouselElement);
