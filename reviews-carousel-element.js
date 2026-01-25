class ReviewsCarouselElement extends HTMLElement {
    constructor() {
        super();
        this.currentIndex = 0;
        this.reviews = [];
        this.autoPlayInterval = null;
        
        this.settings = {
            backgroundColor: '#ffffff',
            textColor: '#333333',
            starColor: '#ffd700',
            buttonColor: '#3498db',
            borderColor: '#e0e0e0',
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
    }

    static get observedAttributes() {
        return ['reviews', 'options'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (newValue && newValue !== oldValue) {
            if (name === 'reviews') {
                try {
                    this.reviews = JSON.parse(newValue);
                    this.currentIndex = 0;
                    this.displayCurrentReview();
                    this.updateDots();
                    
                    if (this.settings.autoPlay) {
                        this.startAutoPlay();
                    }
                } catch (e) {
                    // Silent
                }
            } else if (name === 'options') {
                try {
                    const oldAutoPlay = this.settings.autoPlay;
                    const newSettings = JSON.parse(newValue);
                    Object.assign(this.settings, newSettings);
                    this.updateStyles();
                    
                    // Handle auto-play changes
                    if (this.settings.autoPlay && !oldAutoPlay) {
                        this.startAutoPlay();
                    } else if (!this.settings.autoPlay && oldAutoPlay) {
                        this.stopAutoPlay();
                    } else if (this.settings.autoPlay) {
                        this.stopAutoPlay();
                        this.startAutoPlay();
                    }
                } catch (e) {
                    // Silent
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
                    height: 100%;
                    min-height: 300px;
                }
                
                .carousel-container {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.1);
                }
                
                .review-slide {
                    display: none;
                    padding: 32px;
                    height: 100%;
                    box-sizing: border-box;
                }
                
                .review-slide.active {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    animation: fadeIn 0.5s ease-in;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                .review-header {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                
                .product-image {
                    width: 80px;
                    height: 80px;
                    object-fit: cover;
                    border-radius: 8px;
                    flex-shrink: 0;
                }
                
                .review-info {
                    flex: 1;
                    min-width: 0;
                }
                
                .product-name {
                    font-weight: 600;
                    font-size: 1.2em;
                    margin-bottom: 4px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                
                .product-price {
                    font-weight: 700;
                    font-size: 1.1em;
                    margin-bottom: 8px;
                }
                
                .stars {
                    display: flex;
                    gap: 4px;
                    font-size: 1.2em;
                }
                
                .review-content {
                    flex: 1;
                    overflow-y: auto;
                }
                
                .review-title {
                    font-weight: 600;
                    font-size: 1.1em;
                    margin-bottom: 12px;
                    line-height: 1.4;
                }
                
                .review-body {
                    line-height: 1.6;
                    margin-bottom: 16px;
                }
                
                .review-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 12px;
                    padding-top: 16px;
                    border-top: 1px solid;
                }
                
                .author-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .author-name {
                    font-weight: 600;
                }
                
                .verified-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 0.75em;
                    font-weight: 600;
                    color: white;
                }
                
                .verified-badge::before {
                    content: '✓';
                }
                
                .review-date {
                    font-size: 0.85em;
                    opacity: 0.7;
                }
                
                .nav-button {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    color: white;
                    transition: all 0.3s ease;
                    z-index: 10;
                }
                
                .nav-button:hover {
                    transform: translateY(-50%) scale(1.1);
                }
                
                .nav-button.prev {
                    left: 16px;
                }
                
                .nav-button.next {
                    right: 16px;
                }
                
                .nav-button.hidden {
                    display: none;
                }
                
                .dots-container {
                    position: absolute;
                    bottom: 16px;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    gap: 8px;
                    z-index: 10;
                }
                
                .dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.5);
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .dot.active {
                    background: white;
                    transform: scale(1.3);
                }
                
                .product-link {
                    display: inline-block;
                    padding: 8px 16px;
                    border-radius: 6px;
                    text-decoration: none;
                    font-weight: 600;
                    font-size: 0.9em;
                    transition: all 0.3s ease;
                    color: white;
                }
                
                .product-link:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }
                
                .no-reviews {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    padding: 32px;
                    text-align: center;
                    font-size: 1.2em;
                    opacity: 0.6;
                }
                
                @media (max-width: 480px) {
                    .review-slide {
                        padding: 20px;
                    }
                    
                    .review-header {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                    
                    .product-image {
                        width: 100%;
                        height: 200px;
                    }
                    
                    .nav-button {
                        width: 32px;
                        height: 32px;
                        font-size: 16px;
                    }
                    
                    .nav-button.prev {
                        left: 8px;
                    }
                    
                    .nav-button.next {
                        right: 8px;
                    }
                }
            </style>
            
            <div class="carousel-container">
                <div class="slides-wrapper"></div>
                <button class="nav-button prev">‹</button>
                <button class="nav-button next">›</button>
                <div class="dots-container"></div>
            </div>
        `;

        this.setupNavigation();
        this.updateStyles();
    }

    setupNavigation() {
        const prevBtn = this.querySelector('.prev');
        const nextBtn = this.querySelector('.next');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.prevSlide());
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextSlide());
        }
    }

    updateStyles() {
        const container = this.querySelector('.carousel-container');
        const prevBtn = this.querySelector('.prev');
        const nextBtn = this.querySelector('.next');
        const productLinks = this.querySelectorAll('.product-link');

        if (container) {
            container.style.backgroundColor = this.settings.backgroundColor;
            container.style.fontFamily = this.settings.fontFamily;
            container.style.color = this.settings.textColor;
            container.style.fontSize = `${this.settings.fontSize}px`;
        }

        // Show/hide navigation buttons based on autoPlay
        const buttonsHidden = this.settings.autoPlay;
        if (prevBtn) {
            prevBtn.classList.toggle('hidden', buttonsHidden);
            prevBtn.style.backgroundColor = this.settings.buttonColor;
        }
        if (nextBtn) {
            nextBtn.classList.toggle('hidden', buttonsHidden);
            nextBtn.style.backgroundColor = this.settings.buttonColor;
        }

        productLinks.forEach(link => {
            link.style.backgroundColor = this.settings.buttonColor;
        });
    }

    displayCurrentReview() {
        const wrapper = this.querySelector('.slides-wrapper');
        if (!wrapper) return;

        if (this.reviews.length === 0) {
            wrapper.innerHTML = '<div class="no-reviews">No reviews yet. Be the first to review!</div>';
            return;
        }

        const review = this.reviews[this.currentIndex];
        
        wrapper.innerHTML = `
            <div class="review-slide active">
                <div class="review-header">
                    ${review.productImage ? `<img src="${review.productImage}" alt="${review.productName}" class="product-image">` : ''}
                    <div class="review-info">
                        <div class="product-name">${review.productName}</div>
                        <div class="product-price">${review.productPrice}</div>
                        <div class="stars">${this.renderStars(review.rating)}</div>
                    </div>
                </div>
                <div class="review-content">
                    ${review.title ? `<div class="review-title">${review.title}</div>` : ''}
                    <div class="review-body">${review.body}</div>
                </div>
                <div class="review-footer" style="border-color: ${this.settings.borderColor}">
                    <div class="author-info">
                        <span class="author-name">${review.authorName}</span>
                        ${review.verified ? `<span class="verified-badge" style="background-color: ${this.settings.verifiedColor}">Verified</span>` : ''}
                    </div>
                    <div class="review-date">${this.formatDate(review.reviewDate)}</div>
                </div>
                <a href="${review.productUrl}" class="product-link" style="background-color: ${this.settings.buttonColor}">View Product</a>
            </div>
        `;

        this.updateStyles();
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let stars = '';
        for (let i = 0; i < fullStars; i++) {
            stars += `<span style="color: ${this.settings.starColor}">★</span>`;
        }
        if (hasHalfStar) {
            stars += `<span style="color: ${this.settings.starColor}">⯨</span>`;
        }
        for (let i = 0; i < emptyStars; i++) {
            stars += `<span style="color: ${this.settings.borderColor}">☆</span>`;
        }
        return stars;
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
            }
            dot.addEventListener('click', () => {
                this.currentIndex = index;
                this.displayCurrentReview();
                this.updateDots();
                
                if (this.settings.autoPlay) {
                    this.stopAutoPlay();
                    this.startAutoPlay();
                }
            });
            dotsContainer.appendChild(dot);
        });
    }

    prevSlide() {
        if (this.reviews.length === 0) return;
        
        this.currentIndex = (this.currentIndex - 1 + this.reviews.length) % this.reviews.length;
        this.displayCurrentReview();
        this.updateDots();
        
        if (this.settings.autoPlay) {
            this.stopAutoPlay();
            this.startAutoPlay();
        }
    }

    nextSlide() {
        if (this.reviews.length === 0) return;
        
        this.currentIndex = (this.currentIndex + 1) % this.reviews.length;
        this.displayCurrentReview();
        this.updateDots();
        
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

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (diffDays === 0) return 'Today';
            if (diffDays === 1) return 'Yesterday';
            if (diffDays < 7) return `${diffDays} days ago`;
            if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
            if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
            return date.toLocaleDateString();
        } catch (e) {
            return 'Recently';
        }
    }

    disconnectedCallback() {
        this.stopAutoPlay();
    }
}

customElements.define('reviews-carousel', ReviewsCarouselElement);
