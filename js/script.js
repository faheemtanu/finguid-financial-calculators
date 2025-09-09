// ===== NAVIGATION FUNCTIONALITY =====
document.addEventListener('DOMContentLoaded', function() {
    // Mobile navigation toggle
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    
    hamburger.addEventListener('click', function() {
        navMenu.classList.toggle('active');
        
        // Animate hamburger
        hamburger.classList.toggle('active');
    });
    
    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
        });
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (!navMenu.contains(event.target) && !hamburger.contains(event.target)) {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
        }
    });
});

// ===== SMOOTH SCROLLING FOR NAVIGATION LINKS =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 80; // Account for fixed header
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// ===== NEWSLETTER FORM HANDLING =====
document.getElementById('newsletter-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = this.querySelector('input[type="email"]').value;
    const button = this.querySelector('button');
    const originalText = button.textContent;
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address.');
        return;
    }
    
    // Simulate form submission
    button.textContent = 'Subscribing...';
    button.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        alert('Thank you for subscribing! We\'ll notify you when new calculators are available.');
        this.reset();
        button.textContent = originalText;
        button.disabled = false;
        
        // Track newsletter signup (Google Analytics)
        if (typeof gtag !== 'undefined') {
            gtag('event', 'newsletter_signup', {
                'event_category': 'engagement',
                'event_label': 'header_newsletter'
            });
        }
    }, 2000);
});

// ===== SCROLL ANIMATIONS =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-up');
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.calculator-card, .about-feature').forEach(el => {
    observer.observe(el);
});

// ===== HEADER SCROLL EFFECT =====
let lastScrollTop = 0;
const header = document.querySelector('.header');

window.addEventListener('scroll', function() {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Add shadow on scroll
    if (scrollTop > 10) {
        header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    } else {
        header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    }
    
    // Hide/show header on scroll (optional)
    if (scrollTop > lastScrollTop && scrollTop > 100) {
        // Scrolling down
        header.style.transform = 'translateY(-100%)';
    } else {
        // Scrolling up
        header.style.transform = 'translateY(0)';
    }
    
    lastScrollTop = scrollTop;
});

// ===== UTILITY FUNCTIONS =====

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Format number with commas
function formatNumber(num) {
    return new Intl.NumberFormat('en-US').format(num);
}

// Validate numeric input
function validateNumericInput(input, min = 0, max = Infinity) {
    const value = parseFloat(input.value);
    if (isNaN(value) || value < min || value > max) {
        input.style.borderColor = '#ef4444';
        return false;
    } else {
        input.style.borderColor = '#d1d5db';
        return true;
    }
}

// Show loading state
function showLoading(button) {
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calculating...';
}

// Hide loading state
function hideLoading(button, originalText) {
    button.disabled = false;
    button.innerHTML = originalText;
}

// ===== MORTGAGE CALCULATOR FUNCTIONS =====
// These will be used when we add the mortgage calculator in Week 2

function calculateMortgage(principal, rate, term, propertyTax = 0, insurance = 0, pmi = 0) {
    // Convert annual rate to monthly and percentage to decimal
    const monthlyRate = rate / 100 / 12;
    const numberOfPayments = term * 12;
    
    // Calculate monthly principal and interest using the mortgage formula
    let monthlyPI = 0;
    if (monthlyRate > 0) {
        monthlyPI = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) 
                   / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    } else {
        monthlyPI = principal / numberOfPayments;
    }
    
    // Calculate other monthly costs
    const monthlyPropertyTax = propertyTax / 12;
    const monthlyInsurance = insurance / 12;
    const monthlyPMI = pmi;
    
    // Calculate total monthly payment
    const totalMonthlyPayment = monthlyPI + monthlyPropertyTax + monthlyInsurance + monthlyPMI;
    
    // Calculate total interest over the life of the loan
    const totalInterest = (monthlyPI * numberOfPayments) - principal;
    
    // Calculate total cost of the loan
    const totalCost = principal + totalInterest;
    
    return {
        monthlyPayment: monthlyPI,
        totalMonthlyPayment: totalMonthlyPayment,
        monthlyPropertyTax: monthlyPropertyTax,
        monthlyInsurance: monthlyInsurance,
        monthlyPMI: monthlyPMI,
        totalInterest: totalInterest,
        totalCost: totalCost,
        principal: principal
    };
}

// Calculate PMI (Private Mortgage Insurance)
function calculatePMI(loanAmount, homeValue, creditScore = 750) {
    const ltvRatio = loanAmount / homeValue;
    
    // PMI is typically not required if LTV is 80% or less
    if (ltvRatio <= 0.80) {
        return 0;
    }
    
    // PMI rates typically range from 0.3% to 1.5% annually
    let pmiRate = 0.005; // 0.5% default
    
    // Adjust PMI rate based on LTV ratio and credit score
    if (ltvRatio > 0.95) {
        pmiRate = 0.012; // 1.2%
    } else if (ltvRatio > 0.90) {
        pmiRate = 0.008; // 0.8%
    } else if (ltvRatio > 0.85) {
        pmiRate = 0.006; // 0.6%
    }
    
    // Adjust for credit score
    if (creditScore < 640) {
        pmiRate += 0.003;
    } else if (creditScore < 680) {
        pmiRate += 0.002;
    } else if (creditScore < 720) {
        pmiRate += 0.001;
    }
    
    // Calculate monthly PMI
    const annualPMI = loanAmount * pmiRate;
    const monthlyPMI = annualPMI / 12;
    
    return monthlyPMI;
}

// ===== AUTO LOAN CALCULATOR FUNCTIONS =====
// These will be used when we add the auto loan calculator in Week 3

function calculateAutoLoan(vehiclePrice, downPayment, tradeInValue, loanTerm, interestRate, salesTax = 0) {
    // Calculate the loan amount
    const loanAmount = vehiclePrice - downPayment - tradeInValue + salesTax;
    
    // Convert annual rate to monthly and percentage to decimal
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;
    
    // Calculate monthly payment using loan formula
    let monthlyPayment = 0;
    if (monthlyRate > 0) {
        monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) 
                        / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    } else {
        monthlyPayment = loanAmount / numberOfPayments;
    }
    
    // Calculate total interest
    const totalInterest = (monthlyPayment * numberOfPayments) - loanAmount;
    
    // Calculate total cost
    const totalCost = loanAmount + totalInterest;
    
    return {
        loanAmount: loanAmount,
        monthlyPayment: monthlyPayment,
        totalInterest: totalInterest,
        totalCost: totalCost,
        numberOfPayments: numberOfPayments
    };
}

// ===== INVESTMENT CALCULATOR FUNCTIONS =====
// These will be used when we add the investment calculator in Week 4

function calculateInvestment(initialAmount, monthlyContribution, annualReturn, years, compoundingFrequency = 12) {
    const monthlyRate = annualReturn / 100 / 12;
    const totalMonths = years * 12;
    
    // Future value of initial investment
    const futureValueInitial = initialAmount * Math.pow(1 + monthlyRate, totalMonths);
    
    // Future value of monthly contributions (annuity)
    let futureValueContributions = 0;
    if (monthlyRate > 0) {
        futureValueContributions = monthlyContribution * 
            (Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate;
    } else {
        futureValueContributions = monthlyContribution * totalMonths;
    }
    
    // Total future value
    const totalFutureValue = futureValueInitial + futureValueContributions;
    
    // Total contributions
    const totalContributions = initialAmount + (monthlyContribution * totalMonths);
    
    // Total earnings
    const totalEarnings = totalFutureValue - totalContributions;
    
    return {
        futureValue: totalFutureValue,
        totalContributions: totalContributions,
        totalEarnings: totalEarnings,
        initialAmount: initialAmount,
        monthlyContribution: monthlyContribution,
        years: years
    };
}

// ===== GOOGLE ANALYTICS EVENT TRACKING =====
function trackEvent(action, category = 'engagement', label = '') {
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            'event_category': category,
            'event_label': label
        });
    }
}

// Track page interactions
document.addEventListener('click', function(e) {
    const target = e.target;
    
    // Track CTA button clicks
    if (target.classList.contains('cta-button')) {
        trackEvent('cta_click', 'conversion', target.textContent.trim());
    }
    
    // Track calculator card clicks
    if (target.classList.contains('card-button')) {
        trackEvent('calculator_interest', 'engagement', target.closest('.calculator-card').querySelector('h3').textContent);
    }
});

// ===== PERFORMANCE MONITORING =====
window.addEventListener('load', function() {
    // Track page load performance
    setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
        
        if (typeof gtag !== 'undefined') {
            gtag('event', 'page_load_time', {
                'event_category': 'performance',
                'value': Math.round(loadTime)
            });
        }
    }, 0);
});

// ===== ERROR HANDLING =====
window.addEventListener('error', function(e) {
    console.error('JavaScript error:', e.error);
    
    // Track JavaScript errors (optional)
    if (typeof gtag !== 'undefined') {
        gtag('event', 'exception', {
            'description': e.error.toString(),
            'fatal': false
        });
    }
});

// ===== LOCAL STORAGE HELPERS =====
// These will be useful for saving user preferences and calculations

function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        return false;
    }
}

function getFromLocalStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return null;
    }
}

function removeFromLocalStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error('Error removing from localStorage:', error);
        return false;
    }
}

// ===== FORM VALIDATION HELPERS =====
function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function validatePhone(phone) {
    const regex = /^\(\d{3}\)\s\d{3}-\d{4}$/;
    return regex.test(phone);
}

function validateZipCode(zipCode) {
    const regex = /^\d{5}(-\d{4})?$/;
    return regex.test(zipCode);
}

// ===== DATE HELPERS =====
function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
}

function addMonths(date, months) {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
}

function getMonthsBetween(date1, date2) {
    const monthsDiff = (date2.getFullYear() - date1.getFullYear()) * 12 + 
                      (date2.getMonth() - date1.getMonth());
    return Math.abs(monthsDiff);
}

// ===== ANIMATION HELPERS =====
function fadeIn(element, duration = 300) {
    element.style.opacity = '0';
    element.style.display = 'block';
    
    const start = performance.now();
    
    function animate(currentTime) {
        const elapsed = currentTime - start;
        const progress = elapsed / duration;
        
        if (progress < 1) {
            element.style.opacity = progress;
            requestAnimationFrame(animate);
        } else {
            element.style.opacity = '1';
        }
    }
    
    requestAnimationFrame(animate);
}

function fadeOut(element, duration = 300) {
    const start = performance.now();
    const startOpacity = parseFloat(window.getComputedStyle(element).opacity);
    
    function animate(currentTime) {
        const elapsed = currentTime - start;
        const progress = elapsed / duration;
        
        if (progress < 1) {
            element.style.opacity = startOpacity * (1 - progress);
            requestAnimationFrame(animate);
        } else {
            element.style.opacity = '0';
            element.style.display = 'none';
        }
    }
    
    requestAnimationFrame(animate);
}

// ===== DEBOUNCE AND THROTTLE HELPERS =====
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

function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ===== RESPONSIVE HELPERS =====
function isMobile() {
    return window.innerWidth <= 768;
}

function isTablet() {
    return window.innerWidth > 768 && window.innerWidth <= 1024;
}

function isDesktop() {
    return window.innerWidth > 1024;
}

// Update layout on resize (debounced)
const handleResize = debounce(function() {
    // Handle responsive changes
    const nav = document.getElementById('nav-menu');
    if (isDesktop() && nav.classList.contains('active')) {
        nav.classList.remove('active');
        document.getElementById('hamburger').classList.remove('active');
    }
}, 250);

window.addEventListener('resize', handleResize);

// ===== ACCESSIBILITY HELPERS =====
function trapFocus(element) {
    const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    element.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        }
        
        if (e.key === 'Escape') {
            element.focus();
        }
    });
}

// ===== CONSOLE WELCOME MESSAGE =====
console.log('%c🚀 USA Financial Calculators', 'color: #1e40af; font-size: 24px; font-weight: bold;');
console.log('%cBuilding the future of financial planning tools!', 'color: #6b7280; font-size: 14px;');
console.log('%cWebsite by: Your Name', 'color: #10b981; font-size: 12px;');

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ USA Financial Calculators loaded successfully!');
    
    // Initialize any additional components here
    // This runs after the DOM is fully loaded
    
    // Example: Initialize tooltips, modals, etc.
    // initializeTooltips();
    // initializeModals();
});

// ===== SERVICE WORKER REGISTRATION (for PWA features) =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(error) {
                console.log('ServiceWorker registration failed');
            });
    });
}
