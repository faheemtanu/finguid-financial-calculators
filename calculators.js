// ===== CALCULATORS PAGE FUNCTIONALITY =====

document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize calculators page
    initializeCalculatorsPage();
    
    function initializeCalculatorsPage() {
        setupCategoryFilters();
        setupSearchFunctionality();
        setupCalculatorTracking();
        initializeNewsletter();
        
        // Track page load
        trackPageLoad();
    }
    
    function setupCategoryFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        const calculatorCards = document.querySelectorAll('.calculator-card');
        
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                const category = this.dataset.category;
                
                // Update active filter button
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Filter calculator cards
                filterCalculators(category);
                
                // Track filter usage
                trackFilterUsage(category);
            });
        });
    }
    
    function filterCalculators(category) {
        const calculatorCards = document.querySelectorAll('.calculator-card');
        const noResults = document.getElementById('no-results');
        let visibleCards = 0;
        
        calculatorCards.forEach(card => {
            const cardCategory = card.dataset.category;
            
            if (category === 'all' || cardCategory === category) {
                card.style.display = 'block';
                card.classList.add('fade-in-up');
                visibleCards++;
            } else {
                card.style.display = 'none';
                card.classList.remove('fade-in-up');
            }
        });
        
        // Show/hide no results message
        if (visibleCards === 0) {
            noResults.style.display = 'block';
        } else {
            noResults.style.display = 'none';
        }
        
        // Update URL hash for bookmarking
        if (category !== 'all') {
            window.history.replaceState(null, null, `#${category}`);
        } else {
            window.history.replaceState(null, null, window.location.pathname);
        }
    }
    
    function setupSearchFunctionality() {
        const searchInput = document.getElementById('calculator-search');
        const calculatorCards = document.querySelectorAll('.calculator-card');
        const noResults = document.getElementById('no-results');
        
        if (searchInput) {
            // Add debounced search
            let searchTimeout;
            
            searchInput.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase().trim();
                
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    performSearch(searchTerm);
                }, 300);
            });
            
            // Handle search on enter key
            searchInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const searchTerm = this.value.toLowerCase().trim();
                    performSearch(searchTerm);
                }
            });
        }
    }
    
    function performSearch(searchTerm) {
        const calculatorCards = document.querySelectorAll('.calculator-card');
        const noResults = document.getElementById('no-results');
        const filterButtons = document.querySelectorAll('.filter-btn');
        let visibleCards = 0;
        
        if (searchTerm === '') {
            // Show all cards if search is empty
            calculatorCards.forEach(card => {
                card.style.display = 'block';
                visibleCards++;
            });
            noResults.style.display = 'none';
            
            // Reset active filter to "all"
            filterButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelector('[data-category="all"]').classList.add('active');
            
        } else {
            // Search through cards
            calculatorCards.forEach(card => {
                const title = card.querySelector('h3').textContent.toLowerCase();
                const description = card.querySelector('p').textContent.toLowerCase();
                const keywords = card.dataset.keywords || '';
                const features = Array.from(card.querySelectorAll('.feature-tag'))
                    .map(tag => tag.textContent.toLowerCase()).join(' ');
                
                const searchableContent = `${title} ${description} ${keywords} ${features}`;
                
                if (searchableContent.includes(searchTerm)) {
                    card.style.display = 'block';
                    card.classList.add('fade-in-up');
                    visibleCards++;
                    
                    // Highlight search terms (optional)
                    highlightSearchTerms(card, searchTerm);
                } else {
                    card.style.display = 'none';
                    card.classList.remove('fade-in-up');
                }
            });
            
            // Reset all filter buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
        }
        
        // Show/hide no results
        if (visibleCards === 0 && searchTerm !== '') {
            noResults.style.display = 'block';
        } else {
            noResults.style.display = 'none';
        }
        
        // Track search
        if (searchTerm !== '') {
            trackSearch(searchTerm, visibleCards);
        }
    }
    
    function highlightSearchTerms(card, searchTerm) {
        // Simple highlighting (can be enhanced)
        const title = card.querySelector('h3');
        const originalTitle = title.dataset.originalText || title.textContent;
        
        if (!title.dataset.originalText) {
            title.dataset.originalText = originalTitle;
        }
        
        const highlightedTitle = originalTitle.replace(
            new RegExp(searchTerm, 'gi'),
            match => `<mark>${match}</mark>`
        );
        
        title.innerHTML = highlightedTitle;
        
        // Remove highlights after 3 seconds
        setTimeout(() => {
            title.innerHTML = originalTitle;
        }, 3000);
    }
    
    function clearSearch() {
        const searchInput = document.getElementById('calculator-search');
        if (searchInput) {
            searchInput.value = '';
            performSearch('');
        }
    }
    
    // Make clearSearch available globally
    window.clearSearch = clearSearch;
    
    function setupCalculatorTracking() {
        const calculatorCards = document.querySelectorAll('.calculator-card');
        
        calculatorCards.forEach(card => {
            const button = card.querySelector('.btn');
            const title = card.querySelector('h3').textContent;
            
            if (button && !button.disabled) {
                button.addEventListener('click', function() {
                    trackCalculatorClick(title);
                });
            }
        });
    }
    
    function initializeNewsletter() {
        const newsletterForm = document.getElementById('newsletter-form');
        
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const email = this.querySelector('input[type="email"]').value;
                const button = this.querySelector('button');
                const originalText = button.innerHTML;
                
                // Basic email validation
                if (!isValidEmail(email)) {
                    showTooltip('Please enter a valid email address', 'error');
                    return;
                }
                
                // Show loading state
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subscribing...';
                button.disabled = true;
                
                // Simulate subscription (replace with real API call)
                setTimeout(() => {
                    showTooltip('Successfully subscribed! You\'ll be notified about new calculators.', 'success');
                    this.reset();
                    button.innerHTML = originalText;
                    button.disabled = false;
                    
                    // Track newsletter signup
                    trackNewsletterSignup(email);
                    
                }, 2000);
            });
        }
    }
    
    // Check for URL hash on page load
    function handleInitialHash() {
        const hash = window.location.hash.replace('#', '');
        if (hash && document.querySelector(`[data-category="${hash}"]`)) {
            const filterButton = document.querySelector(`[data-category="${hash}"]`);
            if (filterButton) {
                filterButton.click();
            }
        }
    }
    
    // Initialize hash handling
    handleInitialHash();
    
    // Handle browser back/forward
    window.addEventListener('popstate', handleInitialHash);
});

// ===== UTILITY FUNCTIONS =====

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showTooltip(message, type = 'info') {
    const tooltip = document.createElement('div');
    tooltip.className = `tooltip-popup ${type}`;
    tooltip.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    tooltip.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'var(--color-success)' : type === 'error' ? 'var(--color-error)' : 'var(--color-info)'};
        color: white;
        padding: 12px 16px;
        border-radius: 6px;
        font-size: 14px;
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 8px;
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
    `;
    
    document.body.appendChild(tooltip);
    
    setTimeout(() => {
        tooltip.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => tooltip.remove(), 300);
    }, 5000);
}

// ===== ANALYTICS TRACKING =====

function trackPageLoad() {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'page_view', {
            'event_category': 'calculators',
            'event_label': 'calculators_page_loaded'
        });
    }
}

function trackFilterUsage(category) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'filter_usage', {
            'event_category': 'calculators',
            'event_label': category
        });
    }
}

function trackSearch(searchTerm, resultsCount) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'search', {
            'event_category': 'calculators',
            'search_term': searchTerm,
            'results_count': resultsCount
        });
    }
}

function trackCalculatorClick(calculatorName) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'calculator_click', {
            'event_category': 'engagement',
            'event_label': calculatorName
        });
    }
}

function trackNewsletterSignup(email) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'newsletter_signup', {
            'event_category': 'conversion',
            'event_label': 'calculators_page',
            'value': 1
        });
    }
}

// ===== KEYBOARD NAVIGATION =====

document.addEventListener('DOMContentLoaded', function() {
    // Add keyboard support for filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach((button, index) => {
        button.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                
                const nextIndex = e.key === 'ArrowRight' 
                    ? (index + 1) % filterButtons.length
                    : (index - 1 + filterButtons.length) % filterButtons.length;
                
                filterButtons[nextIndex].focus();
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                button.click();
            }
        });
    });
    
    // Add keyboard support for search
    const searchInput = document.getElementById('calculator-search');
    if (searchInput) {
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                this.value = '';
                performSearch('');
                this.blur();
            }
        });
    }
});

// ===== PERFORMANCE OPTIMIZATION =====

// Lazy load calculator cards as they come into view
document.addEventListener('DOMContentLoaded', function() {
    const calculatorCards = document.querySelectorAll('.calculator-card');
    
    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
                cardObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '50px'
    });
    
    calculatorCards.forEach(card => {
        cardObserver.observe(card);
    });
});

// ===== RESPONSIVE ENHANCEMENTS =====

function handleMobileSearch() {
    const searchInput = document.getElementById('calculator-search');
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile && searchInput) {
        searchInput.addEventListener('focus', function() {
            // Scroll to search input on mobile
            setTimeout(() => {
                this.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        });
    }
}

// Initialize mobile enhancements
document.addEventListener('DOMContentLoaded', handleMobileSearch);
window.addEventListener('resize', debounce(handleMobileSearch, 250));

// ===== ERROR HANDLING =====

window.addEventListener('error', function(e) {
    console.error('Calculators page error:', e.error);
    
    if (typeof gtag !== 'undefined') {
        gtag('event', 'exception', {
            'description': `Calculators page: ${e.error.toString()}`,
            'fatal': false
        });
    }
});

// ===== DEBOUNCE UTILITY =====

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

console.log('✅ Calculators page functionality loaded successfully!');
