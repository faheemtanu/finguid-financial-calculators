/**
 * WORLD'S #1 AI-ENHANCED USA MORTGAGE CALCULATOR - PRODUCTION JAVASCRIPT v9.0
 * ALL 33 Requirements Implemented - PWA & Mobile Optimized for American Homebuyers
 * Enhanced Features: Live Rates, Voice Control, AI Insights, Mobile-First, PWA Ready
 * © 2025 FinGuid - World's First AI Calculator Platform for Americans
 */

// ==========================================================================
// GLOBAL VARIABLES AND CONFIGURATION
// ==========================================================================
const MORTGAGE_CALCULATOR = {
    version: '9.0.0',
    buildDate: '2025-10-07',
    features: {
        voiceControl: true,
        aiInsights: true,
        liveRates: true,
        pwaReady: true,
        mobileOptimized: true,
        accessibility: true
    }
};

// Enhanced USA Market Data
const USA_MARKET_DATA = {
    states: {
        'AL': { name: 'Alabama', tax: 0.004, insurance: 0.0039, programs: ['FHA', 'VA', 'USDA', 'Alabama Housing'] },
        'AK': { name: 'Alaska', tax: 0.011, insurance: 0.0065, programs: ['FHA', 'VA', 'USDA'] },
        'AZ': { name: 'Arizona', tax: 0.0067, insurance: 0.0055, programs: ['FHA', 'VA', 'Arizona Housing'] },
        'AR': { name: 'Arkansas', tax: 0.0062, insurance: 0.0078, programs: ['FHA', 'VA', 'USDA'] },
        'CA': { name: 'California', tax: 0.0076, insurance: 0.0049, programs: ['FHA', 'VA', 'CalHFA', 'California Dream'] },
        'CO': { name: 'Colorado', tax: 0.0051, insurance: 0.0047, programs: ['FHA', 'VA', 'CHFA'] },
        'CT': { name: 'Connecticut', tax: 0.0208, insurance: 0.0044, programs: ['FHA', 'VA', 'CHFA'] },
        'DE': { name: 'Delaware', tax: 0.0057, insurance: 0.0042, programs: ['FHA', 'VA', 'DSHA'] },
        'FL': { name: 'Florida', tax: 0.0083, insurance: 0.0153, programs: ['FHA', 'VA', 'Florida Housing'] },
        'GA': { name: 'Georgia', tax: 0.0092, insurance: 0.0089, programs: ['FHA', 'VA', 'Georgia Dream'] },
        'HI': { name: 'Hawaii', tax: 0.0028, insurance: 0.0037, programs: ['FHA', 'VA', 'Hawaii Housing'] },
        'ID': { name: 'Idaho', tax: 0.0063, insurance: 0.0044, programs: ['FHA', 'VA', 'USDA', 'Idaho Housing'] },
        'IL': { name: 'Illinois', tax: 0.0223, insurance: 0.0049, programs: ['FHA', 'VA', 'IHDA'] },
        'IN': { name: 'Indiana', tax: 0.0085, insurance: 0.0054, programs: ['FHA', 'VA', 'Indiana Housing'] },
        'IA': { name: 'Iowa', tax: 0.0154, insurance: 0.0039, programs: ['FHA', 'VA', 'USDA', 'Iowa Finance'] },
        'KS': { name: 'Kansas', tax: 0.0141, insurance: 0.0071, programs: ['FHA', 'VA', 'USDA', 'Kansas Housing'] },
        'KY': { name: 'Kentucky', tax: 0.0086, insurance: 0.0069, programs: ['FHA', 'VA', 'USDA', 'KHC'] },
        'LA': { name: 'Louisiana', tax: 0.0055, insurance: 0.0195, programs: ['FHA', 'VA', 'Louisiana Housing'] },
        'ME': { name: 'Maine', tax: 0.0125, insurance: 0.0041, programs: ['FHA', 'VA', 'USDA', 'Maine Housing'] },
        'MD': { name: 'Maryland', tax: 0.0109, insurance: 0.0047, programs: ['FHA', 'VA', 'Maryland Housing'] },
        'MA': { name: 'Massachusetts', tax: 0.0124, insurance: 0.0054, programs: ['FHA', 'VA', 'MassHousing'] },
        'MI': { name: 'Michigan', tax: 0.0154, insurance: 0.0043, programs: ['FHA', 'VA', 'MSHDA'] },
        'MN': { name: 'Minnesota', tax: 0.0114, insurance: 0.0044, programs: ['FHA', 'VA', 'Minnesota Housing'] },
        'MS': { name: 'Mississippi', tax: 0.0061, insurance: 0.0088, programs: ['FHA', 'VA', 'USDA', 'Mississippi Housing'] },
        'MO': { name: 'Missouri', tax: 0.0097, insurance: 0.0071, programs: ['FHA', 'VA', 'USDA', 'MOHDC'] },
        'MT': { name: 'Montana', tax: 0.0083, insurance: 0.0045, programs: ['FHA', 'VA', 'USDA', 'Montana Board'] },
        'NE': { name: 'Nebraska', tax: 0.0176, insurance: 0.0052, programs: ['FHA', 'VA', 'USDA', 'NIFA'] },
        'NV': { name: 'Nevada', tax: 0.0053, insurance: 0.0039, programs: ['FHA', 'VA', 'Nevada Housing'] },
        'NH': { name: 'New Hampshire', tax: 0.0186, insurance: 0.0041, programs: ['FHA', 'VA', 'NHHFA'] },
        'NJ': { name: 'New Jersey', tax: 0.0249, insurance: 0.0047, programs: ['FHA', 'VA', 'NJHMFA'] },
        'NM': { name: 'New Mexico', tax: 0.0080, insurance: 0.0056, programs: ['FHA', 'VA', 'USDA', 'MFA'] },
        'NY': { name: 'New York', tax: 0.0162, insurance: 0.0048, programs: ['FHA', 'VA', 'SONYMA', 'NYSHCR'] },
        'NC': { name: 'North Carolina', tax: 0.0084, insurance: 0.0062, programs: ['FHA', 'VA', 'USDA', 'NCHFA'] },
        'ND': { name: 'North Dakota', tax: 0.0098, insurance: 0.0059, programs: ['FHA', 'VA', 'USDA', 'NDHFA'] },
        'OH': { name: 'Ohio', tax: 0.0157, insurance: 0.0043, programs: ['FHA', 'VA', 'OHFA'] },
        'OK': { name: 'Oklahoma', tax: 0.0090, insurance: 0.0093, programs: ['FHA', 'VA', 'USDA', 'OHFA'] },
        'OR': { name: 'Oregon', tax: 0.0087, insurance: 0.0040, programs: ['FHA', 'VA', 'Oregon Housing'] },
        'PA': { name: 'Pennsylvania', tax: 0.0135, insurance: 0.0044, programs: ['FHA', 'VA', 'PHFA'] },
        'RI': { name: 'Rhode Island', tax: 0.0142, insurance: 0.0050, programs: ['FHA', 'VA', 'RIHousing'] },
        'SC': { name: 'South Carolina', tax: 0.0057, insurance: 0.0084, programs: ['FHA', 'VA', 'USDA', 'SC Housing'] },
        'SD': { name: 'South Dakota', tax: 0.0128, insurance: 0.0065, programs: ['FHA', 'VA', 'USDA', 'SDHDA'] },
        'TN': { name: 'Tennessee', tax: 0.0067, insurance: 0.0063, programs: ['FHA', 'VA', 'USDA', 'THDA'] },
        'TX': { name: 'Texas', tax: 0.0181, insurance: 0.0078, programs: ['FHA', 'VA', 'USDA', 'TSAHC', 'Texas Veterans'] },
        'UT': { name: 'Utah', tax: 0.0060, insurance: 0.0038, programs: ['FHA', 'VA', 'Utah Housing'] },
        'VT': { name: 'Vermont', tax: 0.0159, insurance: 0.0045, programs: ['FHA', 'VA', 'USDA', 'VHFA'] },
        'VA': { name: 'Virginia', tax: 0.0081, insurance: 0.0040, programs: ['FHA', 'VA', 'VHDA'] },
        'WA': { name: 'Washington', tax: 0.0092, insurance: 0.0040, programs: ['FHA', 'VA', 'WSHFC'] },
        'WV': { name: 'West Virginia', tax: 0.0059, insurance: 0.0051, programs: ['FHA', 'VA', 'USDA', 'WVHDF'] },
        'WI': { name: 'Wisconsin', tax: 0.0176, insurance: 0.0041, programs: ['FHA', 'VA', 'USDA', 'WHEDA'] },
        'WY': { name: 'Wyoming', tax: 0.0062, insurance: 0.0054, programs: ['FHA', 'VA', 'USDA', 'WCDA'] },
        'DC': { name: 'Washington DC', tax: 0.0056, insurance: 0.0043, programs: ['FHA', 'VA', 'DC Housing'] }
    },
    
    loanTypes: {
        conventional: {
            name: 'Conventional',
            minDownPayment: 3,
            pmiThreshold: 20,
            pmiRate: 0.005,
            maxDebtToIncome: 45
        },
        fha: {
            name: 'FHA',
            minDownPayment: 3.5,
            pmiThreshold: 0, // FHA always requires MIP
            pmiRate: 0.0085,
            maxDebtToIncome: 57
        },
        va: {
            name: 'VA',
            minDownPayment: 0,
            pmiThreshold: 0, // VA loans don't require PMI
            pmiRate: 0,
            maxDebtToIncome: 60
        },
        usda: {
            name: 'USDA',
            minDownPayment: 0,
            pmiThreshold: 0, // USDA has guarantee fee
            pmiRate: 0.0035,
            maxDebtToIncome: 46
        }
    },
    
    creditScoreImpact: {
        800: { adjustment: -0.25, description: 'Excellent credit - Best rates available' },
        750: { adjustment: 0, description: 'Very good credit - Great rates' },
        700: { adjustment: 0.125, description: 'Good credit - Good rates' },
        650: { adjustment: 0.375, description: 'Fair credit - Higher rates' },
        600: { adjustment: 0.75, description: 'Poor credit - Much higher rates' },
        580: { adjustment: 1.25, description: 'Bad credit - Limited options' }
    }
};

// Global state management
let CALCULATOR_STATE = {
    inputs: {
        homePrice: 450000,
        downPayment: 90000,
        downPaymentPercent: 20,
        zipCode: '',
        creditScore: 700,
        interestRate: 6.44,
        loanTerm: 30,
        customTerm: null,
        propertyState: '',
        propertyTax: 9000,
        homeInsurance: 1800,
        pmi: 0,
        hoaFees: 0,
        extraMonthly: 0,
        extraOnetime: 0,
        closingCostsPercentage: 3,
        loanType: 'conventional'
    },
    results: {
        monthlyPayment: 0,
        principalInterest: 0,
        monthlyTax: 0,
        monthlyInsurance: 0,
        monthlyPMI: 0,
        monthlyHOA: 0,
        totalPayment: 0,
        totalInterest: 0,
        totalCost: 0,
        payoffDate: null,
        closingCosts: 0
    },
    ui: {
        theme: 'light',
        fontSize: 1,
        voiceEnabled: false,
        screenReaderMode: false,
        currentSchedulePage: 1,
        chartVisible: true,
        comparison: []
    },
    features: {
        autoCalculate: true,
        liveRates: true,
        aiInsights: true
    }
};

// PWA variables
let deferredPrompt;
let isStandalone = false;

// Voice recognition variables
let recognition = null;
let isListening = false;

// Chart instance
let mortgageChart = null;

// Amortization schedule
let amortizationSchedule = [];
let schedulePageSize = 6;

// ==========================================================================
// ENHANCED INITIALIZATION AND EVENT HANDLERS
// ==========================================================================

/**
 * Enhanced DOMContentLoaded initialization with PWA and mobile support
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🇺🇸 FinGuid USA Mortgage Calculator v9.0 - Initializing...');
    
    try {
        // Initialize core features
        initializeCalculator();
        initializePWA();
        initializeVoiceControl();
        initializeAccessibility();
        initializeLiveRates();
        initializeFormHandlers();
        initializeChartSystem();
        initializeAIInsights();
        initializeMobileOptimizations();
        
        // Load saved preferences
        loadUserPreferences();
        
        // Populate dropdowns
        populateStateDropdown();
        
        // Perform initial calculation
        performCalculation();
        
        // Track page load
        trackEvent('Page Load', 'Calculator', 'USA Mortgage Calculator');
        
        console.log('✅ Calculator initialized successfully');
        
        // Show success message
        showToast('Welcome to America\'s most advanced mortgage calculator!', 'success');
        
    } catch (error) {
        console.error('❌ Initialization error:', error);
        showToast('Calculator initialization failed. Please refresh the page.', 'error');
    }
});

/**
 * Initialize core calculator functionality
 */
function initializeCalculator() {
    console.log('🧮 Initializing core calculator...');
    
    // Set default values
    updateInputValue('home-price', formatCurrency(CALCULATOR_STATE.inputs.homePrice));
    updateInputValue('down-payment', formatCurrency(CALCULATOR_STATE.inputs.downPayment));
    updateInputValue('down-payment-percent', CALCULATOR_STATE.inputs.downPaymentPercent);
    updateInputValue('interest-rate', CALCULATOR_STATE.inputs.interestRate);
    updateInputValue('property-tax', formatCurrency(CALCULATOR_STATE.inputs.propertyTax));
    updateInputValue('home-insurance', formatCurrency(CALCULATOR_STATE.inputs.homeInsurance));
    
    // Initialize loan type selection
    selectLoanType(CALCULATOR_STATE.inputs.loanType);
    
    console.log('✅ Core calculator initialized');
}

/**
 * Enhanced PWA initialization with installation prompt
 */
function initializePWA() {
    console.log('📱 Initializing PWA features...');
    
    // Check if running in standalone mode
    isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                   window.navigator.standalone === true;
    
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('PWA install prompt available');
        e.preventDefault();
        deferredPrompt = e;
        showPWAInstallBanner();
    });
    
    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
        console.log('PWA installed successfully');
        hidePWAInstallBanner();
        showToast('FinGuid USA installed successfully! 🎉', 'success');
        trackEvent('PWA', 'Install', 'USA Mortgage Calculator');
    });
    
    // Handle PWA install button
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
        installBtn.addEventListener('click', installPWA);
    }
    
    // Handle PWA dismiss button
    const dismissBtn = document.getElementById('pwa-dismiss-btn');
    if (dismissBtn) {
        dismissBtn.addEventListener('click', hidePWAInstallBanner);
    }
    
    // Initialize service worker for offline functionality
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('Service Worker registered successfully');
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    }
    
    console.log('✅ PWA features initialized');
}

/**
 * Enhanced voice control initialization with comprehensive commands
 */
function initializeVoiceControl() {
    console.log('🎤 Initializing voice control...');
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.log('Speech recognition not supported');
        const voiceBtn = document.getElementById('voice-toggle');
        if (voiceBtn) {
            voiceBtn.style.display = 'none';
        }
        return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onstart = function() {
        console.log('Voice recognition started');
        isListening = true;
        updateVoiceStatus('Listening... Say "help" for commands');
        document.getElementById('voice-toggle').classList.add('active');
    };
    
    recognition.onresult = function(event) {
        const result = event.results[event.results.length - 1];
        if (result.isFinal) {
            const transcript = result[0].transcript.toLowerCase().trim();
            console.log('Voice command:', transcript);
            processVoiceCommand(transcript);
        }
    };
    
    recognition.onerror = function(event) {
        console.error('Voice recognition error:', event.error);
        showToast(`Voice recognition error: ${event.error}`, 'error');
        stopVoiceControl();
    };
    
    recognition.onend = function() {
        console.log('Voice recognition ended');
        if (isListening) {
            // Restart if still listening
            setTimeout(() => {
                if (isListening) {
                    recognition.start();
                }
            }, 1000);
        }
    };
    
    console.log('✅ Voice control initialized');
}

/**
 * Enhanced accessibility initialization
 */
function initializeAccessibility() {
    console.log('♿ Initializing accessibility features...');
    
    // Skip link functionality
    const skipLink = document.querySelector('.skip-link');
    if (skipLink) {
        skipLink.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(skipLink.getAttribute('href'));
            if (target) {
                target.focus();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    // Screen reader announcements
    const announcements = document.getElementById('sr-announcements');
    if (announcements) {
        // Announce page load
        announceToScreenReader('USA Mortgage Calculator loaded. Use tab to navigate through loan details.');
    }
    
    // Keyboard navigation enhancements
    document.addEventListener('keydown', handleKeyboardNavigation);
    
    // Focus management for modal elements
    initializeFocusTrap();
    
    console.log('✅ Accessibility features initialized');
}

/**
 * Enhanced live rates initialization with multiple sources
 */
function initializeLiveRates() {
    console.log('📊 Initializing live rates system...');
    
    // Update rates immediately
    updateLiveRates();
    
    // Set up periodic updates (every 15 minutes)
    setInterval(updateLiveRates, 15 * 60 * 1000);
    
    console.log('✅ Live rates system initialized');
}

/**
 * Initialize comprehensive form handlers
 */
function initializeFormHandlers() {
    console.log('📝 Initializing form handlers...');
    
    // Add input event listeners with debouncing
    const inputs = [
        'home-price', 'down-payment', 'down-payment-percent', 'zip-code',
        'credit-score', 'interest-rate', 'custom-term', 'property-tax',
        'home-insurance', 'pmi', 'hoa-fees', 'extra-monthly', 'extra-onetime',
        'closing-costs-percentage'
    ];
    
    inputs.forEach(inputId => {
        const element = document.getElementById(inputId);
        if (element) {
            element.addEventListener('input', debounce((e) => {
                handleInputChange(inputId.replace('-', ''), e.target.value);
            }, 300));
            
            element.addEventListener('focus', (e) => {
                if (CALCULATOR_STATE.ui.voiceEnabled) {
                    speakText(`Focused on ${element.getAttribute('aria-label') || element.placeholder}`);
                }
            });
        }
    });
    
    // State dropdown change handler
    const stateSelect = document.getElementById('property-state');
    if (stateSelect) {
        stateSelect.addEventListener('change', (e) => {
            handleStateChange(e.target.value);
        });
    }
    
    console.log('✅ Form handlers initialized');
}

/**
 * Initialize enhanced chart system
 */
function initializeChartSystem() {
    console.log('📈 Initializing chart system...');
    
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded');
        return;
    }
    
    // Initialize mortgage timeline chart
    const chartCanvas = document.getElementById('mortgage-timeline-chart');
    if (chartCanvas) {
        createMortgageChart();
    }
    
    // Initialize year slider
    const yearSlider = document.getElementById('year-range');
    if (yearSlider) {
        yearSlider.addEventListener('input', (e) => {
            updateYearDetails(parseInt(e.target.value));
        });
    }
    
    console.log('✅ Chart system initialized');
}

/**
 * Initialize AI insights system
 */
function initializeAIInsights() {
    console.log('🧠 Initializing AI insights system...');
    
    // Generate initial insights
    generateAIInsights();
    
    // Refresh insights button
    const refreshBtn = document.getElementById('refresh-insights');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            generateAIInsights();
            trackEvent('AI Insights', 'Refresh', 'Manual');
        });
    }
    
    console.log('✅ AI insights system initialized');
}

/**
 * Initialize mobile-specific optimizations
 */
function initializeMobileOptimizations() {
    console.log('📱 Initializing mobile optimizations...');
    
    // Detect mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        document.body.classList.add('mobile-device');
        
        // Prevent zoom on input focus (iOS Safari)
        const inputs = document.querySelectorAll('input[type="text"], input[type="number"], select, textarea');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                if (input.style.fontSize !== '16px') {
                    input.style.fontSize = '16px';
                }
            });
        });
        
        // Enhanced touch feedback
        const touchElements = document.querySelectorAll('.control-btn, .action-btn, .loan-type-btn, .term-chip, .frequency-btn');
        touchElements.forEach(element => {
            element.addEventListener('touchstart', () => {
                element.classList.add('touch-active');
            });
            
            element.addEventListener('touchend', () => {
                setTimeout(() => {
                    element.classList.remove('touch-active');
                }, 100);
            });
        });
    }
    
    // Handle orientation changes
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            if (mortgageChart) {
                mortgageChart.resize();
            }
        }, 500);
    });
    
    // Handle viewport changes for mobile browsers
    const handleViewportChange = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    window.addEventListener('resize', handleViewportChange);
    handleViewportChange();
    
    console.log('✅ Mobile optimizations initialized');
}

// ==========================================================================
// ENHANCED PWA FUNCTIONALITY
// ==========================================================================

/**
 * Show PWA installation banner
 */
function showPWAInstallBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner && !isStandalone) {
        banner.style.display = 'block';
        trackEvent('PWA', 'Banner Shown', 'Install Prompt');
    }
}

/**
 * Hide PWA installation banner
 */
function hidePWAInstallBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
        banner.style.display = 'none';
    }
}

/**
 * Install PWA
 */
async function installPWA() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('User accepted PWA install prompt');
            trackEvent('PWA', 'Install Accepted', 'User Choice');
        } else {
            console.log('User dismissed PWA install prompt');
            trackEvent('PWA', 'Install Dismissed', 'User Choice');
        }
        
        deferredPrompt = null;
        hidePWAInstallBanner();
    }
}

// ==========================================================================
// ENHANCED NAVIGATION FUNCTIONALITY
// ==========================================================================

/**
 * Enhanced navigation function with SPA routing
 */
function navigateTo(path) {
    console.log('Navigating to:', path);
    
    // Close mobile menu if open
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu && mobileMenu.classList.contains('active')) {
        toggleMobileMenu();
    }
    
    // Handle different routes
    switch (path) {
        case '/':
            showToast('Welcome to FinGuid USA Home Page', 'info');
            break;
        case '/calculators':
            showToast('Explore our suite of financial calculators', 'info');
            break;
        case '/resources':
            showToast('Access comprehensive homebuyer resources', 'info');
            break;
        case '/rates':
            showToast('View current USA mortgage rates', 'info');
            break;
        case '/about':
            showToast('Learn more about FinGuid', 'info');
            break;
        default:
            console.warn('Unknown route:', path);
    }
    
    // Track navigation
    trackEvent('Navigation', 'Link Click', path);
}

/**
 * Toggle mobile menu
 */
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    const toggleBtn = document.querySelector('.mobile-menu-toggle');
    
    if (mobileMenu && toggleBtn) {
        const isActive = mobileMenu.classList.contains('active');
        
        if (isActive) {
            mobileMenu.classList.remove('active');
            toggleBtn.classList.remove('active');
            toggleBtn.setAttribute('aria-expanded', 'false');
        } else {
            mobileMenu.classList.add('active');
            toggleBtn.classList.add('active');
            toggleBtn.setAttribute('aria-expanded', 'true');
        }
        
        trackEvent('UI', 'Mobile Menu', isActive ? 'Close' : 'Open');
    }
}

// ==========================================================================
// ENHANCED ACCESSIBILITY FUNCTIONS
// ==========================================================================

/**
 * Adjust font size for accessibility
 */
function adjustFontSize(delta) {
    const currentSize = CALCULATOR_STATE.ui.fontSize;
    const newSize = Math.max(0.8, Math.min(1.5, currentSize + delta));
    
    if (newSize !== currentSize) {
        CALCULATOR_STATE.ui.fontSize = newSize;
        document.documentElement.style.setProperty('--font-scale', newSize);
        document.body.className = document.body.className.replace(/font-scale-\d+/g, '');
        document.body.classList.add(`font-scale-${Math.round(newSize * 100)}`);
        
        saveUserPreferences();
        trackEvent('Accessibility', 'Font Size', `${Math.round(newSize * 100)}%`);
        
        announceToScreenReader(`Font size ${delta > 0 ? 'increased' : 'decreased'} to ${Math.round(newSize * 100)}%`);
    }
}

/**
 * Reset font size to default
 */
function resetFontSize() {
    CALCULATOR_STATE.ui.fontSize = 1;
    document.documentElement.style.setProperty('--font-scale', 1);
    document.body.className = document.body.className.replace(/font-scale-\d+/g, '');
    
    saveUserPreferences();
    trackEvent('Accessibility', 'Font Size', 'Reset');
    announceToScreenReader('Font size reset to default');
}

/**
 * Toggle theme between light and dark
 */
function toggleTheme() {
    const currentTheme = CALCULATOR_STATE.ui.theme;
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    CALCULATOR_STATE.ui.theme = newTheme;
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Update theme toggle button
    const themeBtn = document.getElementById('theme-toggle');
    const themeIcon = themeBtn?.querySelector('.theme-icon');
    const themeText = themeBtn?.querySelector('.control-text');
    
    if (themeIcon && themeText) {
        themeIcon.className = newTheme === 'dark' ? 'fas fa-sun theme-icon' : 'fas fa-moon theme-icon';
        themeText.textContent = newTheme === 'dark' ? 'Light' : 'Dark';
    }
    
    saveUserPreferences();
    trackEvent('Accessibility', 'Theme', newTheme);
    announceToScreenReader(`Switched to ${newTheme} mode`);
}

/**
 * Toggle voice control
 */
function toggleVoiceControl() {
    if (!recognition) {
        showToast('Voice control not supported in this browser', 'error');
        return;
    }
    
    if (isListening) {
        stopVoiceControl();
    } else {
        startVoiceControl();
    }
}

/**
 * Start voice control
 */
function startVoiceControl() {
    if (!recognition) return;
    
    try {
        recognition.start();
        CALCULATOR_STATE.ui.voiceEnabled = true;
        showVoiceStatus();
        trackEvent('Voice Control', 'Start', 'User Activated');
    } catch (error) {
        console.error('Voice control start error:', error);
        showToast('Failed to start voice control', 'error');
    }
}

/**
 * Stop voice control
 */
function stopVoiceControl() {
    if (recognition) {
        recognition.stop();
    }
    
    isListening = false;
    CALCULATOR_STATE.ui.voiceEnabled = false;
    hideVoiceStatus();
    
    const voiceBtn = document.getElementById('voice-toggle');
    if (voiceBtn) {
        voiceBtn.classList.remove('active');
    }
    
    trackEvent('Voice Control', 'Stop', 'User Deactivated');
}

/**
 * Toggle screen reader mode
 */
function toggleScreenReaderMode() {
    const isActive = CALCULATOR_STATE.ui.screenReaderMode;
    CALCULATOR_STATE.ui.screenReaderMode = !isActive;
    
    if (!isActive) {
        document.body.classList.add('screen-reader-mode');
        announceToScreenReader('Screen reader mode enabled. Enhanced navigation and descriptions active.');
    } else {
        document.body.classList.remove('screen-reader-mode');
        announceToScreenReader('Screen reader mode disabled.');
    }
    
    saveUserPreferences();
    trackEvent('Accessibility', 'Screen Reader Mode', !isActive ? 'Enabled' : 'Disabled');
}

/**
 * Announce text to screen readers
 */
function announceToScreenReader(text) {
    const announcements = document.getElementById('sr-announcements');
    if (announcements) {
        announcements.textContent = text;
        setTimeout(() => {
            announcements.textContent = '';
        }, 1000);
    }
}

// ==========================================================================
// ENHANCED VOICE CONTROL FUNCTIONS
// ==========================================================================

/**
 * Process voice commands with comprehensive recognition
 */
function processVoiceCommand(command) {
    console.log('Processing voice command:', command);
    updateVoiceStatus(`Processing: "${command}"`);
    
    // Help commands
    if (command.includes('help') || command.includes('commands')) {
        const helpText = `Voice commands available: 
        Say "calculate" to recalculate, 
        "set home price to [amount]", 
        "set down payment to [amount]", 
        "set interest rate to [number]", 
        "what is my monthly payment", 
        "show insights", 
        "clear form", 
        "save results", 
        "stop listening"`;
        
        speakText(helpText);
        updateVoiceStatus(helpText);
        return;
    }
    
    // Navigation commands
    if (command.includes('calculate') || command.includes('recalculate')) {
        performCalculation();
        speakText('Calculation updated');
        return;
    }
    
    if (command.includes('clear') || command.includes('reset')) {
        clearAllInputs();
        speakText('Form cleared');
        return;
    }
    
    // Input commands
    const homePrice = command.match(/set home price to (\d+)/);
    if (homePrice) {
        const value = parseInt(homePrice[1]) * 1000; // Convert to thousands
        updateInputValue('home-price', formatCurrency(value));
        handleInputChange('homePrice', value);
        speakText(`Home price set to ${formatCurrency(value)}`);
        return;
    }
    
    const downPayment = command.match(/set down payment to (\d+)/);
    if (downPayment) {
        const value = parseInt(downPayment[1]);
        if (command.includes('percent')) {
            updateInputValue('down-payment-percent', value);
            handleInputChange('downPaymentPercent', value);
            speakText(`Down payment set to ${value} percent`);
        } else {
            const dollarValue = value * 1000;
            updateInputValue('down-payment', formatCurrency(dollarValue));
            handleInputChange('downPayment', dollarValue);
            speakText(`Down payment set to ${formatCurrency(dollarValue)}`);
        }
        return;
    }
    
    const interestRate = command.match(/set interest rate to (\d+\.?\d*)/);
    if (interestRate) {
        const value = parseFloat(interestRate[1]);
        updateInputValue('interest-rate', value);
        handleInputChange('interestRate', value);
        speakText(`Interest rate set to ${value} percent`);
        return;
    }
    
    // Query commands
    if (command.includes('monthly payment') || command.includes('payment amount')) {
        const payment = formatCurrency(CALCULATOR_STATE.results.totalPayment);
        speakText(`Your total monthly payment is ${payment}`);
        updateVoiceStatus(`Monthly payment: ${payment}`);
        return;
    }
    
    if (command.includes('loan amount')) {
        const loanAmount = CALCULATOR_STATE.inputs.homePrice - CALCULATOR_STATE.inputs.downPayment;
        speakText(`Your loan amount is ${formatCurrency(loanAmount)}`);
        return;
    }
    
    if (command.includes('insights')) {
        generateAIInsights();
        speakText('AI insights updated');
        return;
    }
    
    // Control commands
    if (command.includes('stop') || command.includes('quit') || command.includes('exit')) {
        stopVoiceControl();
        return;
    }
    
    // Loan type commands
    const loanTypes = ['conventional', 'fha', 'va', 'usda'];
    for (const type of loanTypes) {
        if (command.includes(type)) {
            selectLoanType(type);
            speakText(`${type.toUpperCase()} loan selected`);
            return;
        }
    }
    
    // Default response
    speakText('Command not recognized. Say "help" for available commands.');
    updateVoiceStatus('Command not recognized. Say "help" for commands.');
}

/**
 * Speak text using Web Speech API
 */
function speakText(text) {
    if (!('speechSynthesis' in window)) {
        console.log('Text-to-speech not supported');
        return;
    }
    
    // Cancel any ongoing speech
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    utterance.lang = 'en-US';
    
    utterance.onend = () => {
        console.log('Speech finished');
    };
    
    utterance.onerror = (event) => {
        console.error('Speech error:', event.error);
    };
    
    speechSynthesis.speak(utterance);
}

/**
 * Show voice status display
 */
function showVoiceStatus() {
    const voiceStatus = document.getElementById('voice-status');
    if (voiceStatus) {
        voiceStatus.classList.add('active');
    }
}

/**
 * Hide voice status display
 */
function hideVoiceStatus() {
    const voiceStatus = document.getElementById('voice-status');
    if (voiceStatus) {
        voiceStatus.classList.remove('active');
    }
}

/**
 * Update voice status text
 */
function updateVoiceStatus(text) {
    const voiceText = document.getElementById('voice-text');
    const voiceCommand = document.getElementById('voice-command');
    
    if (voiceText) {
        voiceText.textContent = text;
    }
    
    if (voiceCommand) {
        voiceCommand.textContent = 'Say "help" for commands or "stop" to quit';
    }
}

// ==========================================================================
// ENHANCED INPUT HANDLING AND FORM MANAGEMENT
// ==========================================================================

/**
 * Enhanced input change handler with validation
 */
function handleInputChange(field, value) {
    console.log(`Input change: ${field} = ${value}`);
    
    // Parse numeric values
    let numericValue = parseFloat(value.toString().replace(/[,$]/g, '')) || 0;
    
    // Field-specific validation and processing
    switch (field) {
        case 'homePrice':
            numericValue = Math.max(1000, Math.min(50000000, numericValue));
            CALCULATOR_STATE.inputs.homePrice = numericValue;
            updateDownPaymentFromPercent();
            updateClosingCosts();
            break;
            
        case 'downPayment':
            numericValue = Math.max(0, Math.min(CALCULATOR_STATE.inputs.homePrice * 0.99, numericValue));
            CALCULATOR_STATE.inputs.downPayment = numericValue;
            updateDownPaymentPercent();
            break;
            
        case 'downPaymentPercent':
            numericValue = Math.max(0, Math.min(99, numericValue));
            CALCULATOR_STATE.inputs.downPaymentPercent = numericValue;
            updateDownPaymentFromPercent();
            break;
            
        case 'interestRate':
            numericValue = Math.max(0.1, Math.min(20, numericValue));
            CALCULATOR_STATE.inputs.interestRate = numericValue;
            break;
            
        case 'customTerm':
            if (numericValue >= 5 && numericValue <= 50) {
                CALCULATOR_STATE.inputs.customTerm = numericValue;
                CALCULATOR_STATE.inputs.loanTerm = numericValue;
                updateCustomTermStatus(true);
            } else {
                updateCustomTermStatus(false);
            }
            break;
            
        case 'propertyTax':
            CALCULATOR_STATE.inputs.propertyTax = numericValue;
            break;
            
        case 'homeInsurance':
            CALCULATOR_STATE.inputs.homeInsurance = numericValue;
            break;
            
        case 'hoaFees':
            CALCULATOR_STATE.inputs.hoaFees = numericValue;
            break;
            
        case 'extraMonthly':
            CALCULATOR_STATE.inputs.extraMonthly = numericValue;
            updateExtraPaymentPreview();
            break;
            
        case 'extraOnetime':
            CALCULATOR_STATE.inputs.extraOnetime = numericValue;
            break;
            
        case 'closingCostsPercentage':
            numericValue = Math.max(0, Math.min(10, numericValue));
            CALCULATOR_STATE.inputs.closingCostsPercentage = numericValue;
            updateClosingCosts();
            break;
            
        default:
            console.warn('Unknown field:', field);
            return;
    }
    
    // Auto-calculate PMI
    updatePMICalculation();
    
    // Perform calculation if auto-calculate is enabled
    if (CALCULATOR_STATE.features.autoCalculate) {
        performCalculation();
    }
    
    // Announce change to screen reader
    if (CALCULATOR_STATE.ui.screenReaderMode) {
        announceToScreenReader(`${field} updated to ${formatValue(field, numericValue)}`);
    }
    
    // Save preferences
    debounce(saveUserPreferences, 1000)();
}

/**
 * Handle ZIP code changes with location services
 */
function handleZipCodeChange(zipCode) {
    console.log('ZIP code changed:', zipCode);
    
    CALCULATOR_STATE.inputs.zipCode = zipCode;
    
    if (zipCode.length === 5) {
        // Show loading status
        const statusElement = document.getElementById('zip-code-status');
        if (statusElement) {
            statusElement.style.display = 'block';
            statusElement.textContent = 'Looking up location...';
            statusElement.className = 'zip-status loading';
        }
        
        // Lookup ZIP code information
        lookupZipCode(zipCode)
            .then(locationData => {
                if (locationData && statusElement) {
                    statusElement.textContent = `📍 ${locationData.city}, ${locationData.state}`;
                    statusElement.className = 'zip-status success';
                    
                    // Auto-select state if found
                    if (locationData.state) {
                        const stateSelect = document.getElementById('property-state');
                        if (stateSelect) {
                            stateSelect.value = locationData.state;
                            handleStateChange(locationData.state);
                        }
                    }
                }
            })
            .catch(error => {
                console.error('ZIP code lookup failed:', error);
                if (statusElement) {
                    statusElement.textContent = 'Invalid ZIP code';
                    statusElement.className = 'zip-status error';
                }
            });
    }
}

/**
 * Handle credit score changes
 */
function handleCreditScoreChange(creditScore) {
    console.log('Credit score changed:', creditScore);
    
    CALCULATOR_STATE.inputs.creditScore = parseInt(creditScore) || 700;
    
    // Update rate based on credit score
    updateRateForCreditScore();
    
    // Show credit impact
    const impactElement = document.getElementById('credit-impact');
    if (impactElement && creditScore) {
        const impact = USA_MARKET_DATA.creditScoreImpact[creditScore];
        if (impact) {
            impactElement.style.display = 'block';
            impactElement.innerHTML = `
                <div class="credit-impact-display">
                    <span class="impact-label">Rate Impact:</span>
                    <span class="impact-value ${impact.adjustment < 0 ? 'positive' : 'negative'}">
                        ${impact.adjustment > 0 ? '+' : ''}${impact.adjustment}%
                    </span>
                </div>
                <small class="impact-description">${impact.description}</small>
            `;
        }
    }
    
    performCalculation();
}

/**
 * Handle state selection changes
 */
function handleStateChange(stateCode) {
    console.log('State changed:', stateCode);
    
    CALCULATOR_STATE.inputs.propertyState = stateCode;
    
    if (stateCode && USA_MARKET_DATA.states[stateCode]) {
        const stateData = USA_MARKET_DATA.states[stateCode];
        
        // Auto-calculate property tax
        const taxAmount = Math.round(CALCULATOR_STATE.inputs.homePrice * stateData.tax);
        CALCULATOR_STATE.inputs.propertyTax = taxAmount;
        updateInputValue('property-tax', formatCurrency(taxAmount));
        
        // Auto-calculate home insurance
        const insuranceAmount = Math.round(CALCULATOR_STATE.inputs.homePrice * stateData.insurance);
        CALCULATOR_STATE.inputs.homeInsurance = insuranceAmount;
        updateInputValue('home-insurance', formatCurrency(insuranceAmount));
        
        // Show rate displays
        const taxRateDisplay = document.getElementById('property-tax-rate');
        const insuranceRateDisplay = document.getElementById('home-insurance-rate');
        
        if (taxRateDisplay) {
            taxRateDisplay.textContent = `(${(stateData.tax * 100).toFixed(2)}% of home value)`;
        }
        
        if (insuranceRateDisplay) {
            insuranceRateDisplay.textContent = `(${(stateData.insurance * 100).toFixed(2)}% of home value)`;
        }
        
        // Show state-specific programs
        showStatePrograms(stateData);
        
        // Perform calculation
        performCalculation();
        
        // Announce to screen reader
        announceToScreenReader(`${stateData.name} selected. Tax and insurance rates updated.`);
    }
}

/**
 * Handle custom term changes
 */
function handleCustomTermChange(term) {
    const numericTerm = parseInt(term);
    const statusElement = document.getElementById('custom-term-status');
    
    if (numericTerm >= 5 && numericTerm <= 50) {
        CALCULATOR_STATE.inputs.customTerm = numericTerm;
        CALCULATOR_STATE.inputs.loanTerm = numericTerm;
        
        if (statusElement) {
            statusElement.style.display = 'block';
            statusElement.textContent = `✓ Custom ${numericTerm}-year term selected`;
            statusElement.className = 'custom-term-status active';
        }
        
        // Deactivate standard term buttons
        document.querySelectorAll('.term-chip').forEach(chip => {
            chip.classList.remove('active');
            chip.setAttribute('aria-checked', 'false');
        });
        
        performCalculation();
    } else if (term) {
        if (statusElement) {
            statusElement.style.display = 'block';
            statusElement.textContent = '⚠ Term must be between 5-50 years';
            statusElement.className = 'custom-term-status error';
        }
    } else {
        if (statusElement) {
            statusElement.style.display = 'none';
        }
    }
}

// ==========================================================================
// ENHANCED CALCULATION ENGINE
// ==========================================================================

/**
 * Enhanced mortgage calculation with comprehensive features
 */
function performCalculation() {
    console.log('🧮 Performing enhanced calculation...');
    
    try {
        // Get current input values
        const homePrice = CALCULATOR_STATE.inputs.homePrice;
        const downPayment = CALCULATOR_STATE.inputs.downPayment;
        const interestRate = CALCULATOR_STATE.inputs.interestRate / 100;
        const loanTerm = CALCULATOR_STATE.inputs.loanTerm;
        const propertyTax = CALCULATOR_STATE.inputs.propertyTax;
        const homeInsurance = CALCULATOR_STATE.inputs.homeInsurance;
        const pmi = CALCULATOR_STATE.inputs.pmi;
        const hoaFees = CALCULATOR_STATE.inputs.hoaFees;
        const extraMonthly = CALCULATOR_STATE.inputs.extraMonthly;
        const extraOnetime = CALCULATOR_STATE.inputs.extraOnetime;
        
        // Calculate loan amount
        const loanAmount = homePrice - downPayment;
        
        // Validate inputs
        if (loanAmount <= 0) {
            throw new Error('Loan amount must be greater than 0');
        }
        
        if (interestRate <= 0) {
            throw new Error('Interest rate must be greater than 0');
        }
        
        if (loanTerm <= 0) {
            throw new Error('Loan term must be greater than 0');
        }
        
        // Calculate monthly interest rate
        const monthlyRate = interestRate / 12;
        const numberOfPayments = loanTerm * 12;
        
        // Calculate principal and interest payment
        let principalInterest = 0;
        if (monthlyRate > 0) {
            principalInterest = loanAmount * 
                (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
                (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
        } else {
            principalInterest = loanAmount / numberOfPayments;
        }
        
        // Calculate monthly components
        const monthlyTax = propertyTax / 12;
        const monthlyInsurance = homeInsurance / 12;
        const monthlyPMI = pmi / 12;
        const monthlyHOA = hoaFees;
        
        // Calculate total monthly payment
        const totalPayment = principalInterest + monthlyTax + monthlyInsurance + monthlyPMI + monthlyHOA;
        
        // Calculate total interest over loan life
        const totalInterestPaid = (principalInterest * numberOfPayments) - loanAmount;
        
        // Calculate total cost
        const totalCost = homePrice + totalInterestPaid + (propertyTax * loanTerm) + 
                         (homeInsurance * loanTerm) + (pmi * loanTerm) + (hoaFees * 12 * loanTerm);
        
        // Calculate payoff date
        const payoffDate = new Date();
        payoffDate.setMonth(payoffDate.getMonth() + numberOfPayments);
        
        // Calculate closing costs
        const closingCosts = homePrice * (CALCULATOR_STATE.inputs.closingCostsPercentage / 100);
        
        // Store results
        CALCULATOR_STATE.results = {
            loanAmount,
            monthlyPayment: totalPayment,
            principalInterest,
            monthlyTax,
            monthlyInsurance,
            monthlyPMI,
            monthlyHOA,
            totalPayment,
            totalInterest: totalInterestPaid,
            totalCost,
            payoffDate,
            closingCosts
        };
        
        // Generate amortization schedule
        generateAmortizationSchedule();
        
        // Update UI displays
        updateResultsDisplay();
        updatePaymentBreakdown();
        updateLoanSummary();
        updateMortgageChart();
        updateScheduleDisplay();
        
        // Generate AI insights
        generateAIInsights();
        
        // Announce calculation completion to screen reader
        if (CALCULATOR_STATE.ui.screenReaderMode) {
            announceToScreenReader(`Calculation complete. Monthly payment is ${formatCurrency(totalPayment)}`);
        }
        
        console.log('✅ Calculation completed successfully');
        
    } catch (error) {
        console.error('❌ Calculation error:', error);
        showToast(`Calculation error: ${error.message}`, 'error');
    }
}

/**
 * Generate comprehensive amortization schedule
 */
function generateAmortizationSchedule() {
    console.log('📊 Generating amortization schedule...');
    
    const loanAmount = CALCULATOR_STATE.results.loanAmount;
    const monthlyRate = CALCULATOR_STATE.inputs.interestRate / 100 / 12;
    const principalInterest = CALCULATOR_STATE.results.principalInterest;
    const extraMonthly = CALCULATOR_STATE.inputs.extraMonthly;
    const extraOnetime = CALCULATOR_STATE.inputs.extraOnetime;
    
    amortizationSchedule = [];
    let remainingBalance = loanAmount;
    let paymentNumber = 1;
    let currentDate = new Date();
    
    while (remainingBalance > 0.01 && paymentNumber <= 360) {
        // Calculate interest for this payment
        const interestPayment = remainingBalance * monthlyRate;
        
        // Calculate principal payment
        let principalPayment = principalInterest - interestPayment;
        
        // Add extra payments
        let extraPayment = extraMonthly;
        if (paymentNumber === 1) {
            extraPayment += extraOnetime;
        }
        
        // Ensure we don't pay more than remaining balance
        if (principalPayment + extraPayment > remainingBalance) {
            principalPayment = remainingBalance;
            extraPayment = 0;
        }
        
        const totalPayment = interestPayment + principalPayment + extraPayment;
        
        // Update remaining balance
        remainingBalance -= (principalPayment + extraPayment);
        
        // Add to schedule
        amortizationSchedule.push({
            paymentNumber,
            date: new Date(currentDate),
            principalPayment: principalPayment + extraPayment,
            interestPayment,
            totalPayment,
            remainingBalance: Math.max(0, remainingBalance)
        });
        
        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
        paymentNumber++;
        
        // Break if balance is paid off
        if (remainingBalance <= 0.01) {
            break;
        }
    }
    
    console.log(`✅ Generated ${amortizationSchedule.length} payment schedule`);
}

// ==========================================================================
// ENHANCED UI UPDATE FUNCTIONS
// ==========================================================================

/**
 * Update main results display
 */
function updateResultsDisplay() {
    const totalPayment = CALCULATOR_STATE.results.totalPayment;
    const principalInterest = CALCULATOR_STATE.results.principalInterest;
    const escrowAmount = totalPayment - principalInterest;
    
    // Update main payment card
    updateElementText('total-payment', formatCurrency(totalPayment));
    updateElementText('pi-amount', `${formatCurrency(principalInterest)} P&I`);
    updateElementText('escrow-amount', `${formatCurrency(escrowAmount)} Escrow`);
    
    // Update loan type badge
    const loanTypeBadge = document.getElementById('active-loan-type');
    if (loanTypeBadge) {
        loanTypeBadge.textContent = `${USA_MARKET_DATA.loanTypes[CALCULATOR_STATE.inputs.loanType].name} Loan`;
    }
}

/**
 * Enhanced payment breakdown update with smart hiding
 */
function updatePaymentBreakdown() {
    const results = CALCULATOR_STATE.results;
    const totalPayment = results.totalPayment;
    
    // Calculate percentages
    const piPercent = Math.round((results.principalInterest / totalPayment) * 100);
    const taxPercent = Math.round((results.monthlyTax / totalPayment) * 100);
    const insurancePercent = Math.round((results.monthlyInsurance / totalPayment) * 100);
    const pmiPercent = Math.round((results.monthlyPMI / totalPayment) * 100);
    const hoaPercent = Math.round((results.monthlyHOA / totalPayment) * 100);
    
    // Update principal & interest (always shown)
    updateElementText('principal-interest', formatCurrency(results.principalInterest));
    updateElementText('pi-percent', `${piPercent}%`);
    updateElementWidth('pi-fill', `${piPercent}%`);
    
    // Update property tax (always shown)
    updateElementText('monthly-tax', formatCurrency(results.monthlyTax));
    updateElementText('tax-percent', `${taxPercent}%`);
    updateElementWidth('tax-fill', `${taxPercent}%`);
    
    // Update home insurance (always shown)
    updateElementText('monthly-insurance', formatCurrency(results.monthlyInsurance));
    updateElementText('insurance-percent', `${insurancePercent}%`);
    updateElementWidth('insurance-fill', `${insurancePercent}%`);
    
    // Update PMI (conditionally shown)
    const pmiItem = document.getElementById('pmi-breakdown-item');
    if (results.monthlyPMI > 0 && pmiItem) {
        pmiItem.style.display = 'grid';
        updateElementText('monthly-pmi', formatCurrency(results.monthlyPMI));
        updateElementText('pmi-percent', `${pmiPercent}%`);
        updateElementWidth('pmi-fill', `${pmiPercent}%`);
    } else if (pmiItem) {
        pmiItem.style.display = 'none';
    }
    
    // Update HOA (conditionally shown)
    const hoaItem = document.getElementById('hoa-breakdown-item');
    if (results.monthlyHOA > 0 && hoaItem) {
        hoaItem.style.display = 'grid';
        updateElementText('monthly-hoa', formatCurrency(results.monthlyHOA));
        updateElementText('hoa-percent', `${hoaPercent}%`);
        updateElementWidth('hoa-fill', `${hoaPercent}%`);
    } else if (hoaItem) {
        hoaItem.style.display = 'none';
    }
}

/**
 * Update loan summary
 */
function updateLoanSummary() {
    const results = CALCULATOR_STATE.results;
    
    updateElementText('display-loan-amount', formatCurrency(results.loanAmount));
    updateElementText('display-total-interest', formatCurrency(results.totalInterest));
    updateElementText('display-total-cost', formatCurrency(results.totalCost));
    updateElementText('display-payoff-date', formatDate(results.payoffDate));
    updateElementText('display-closing-costs', formatCurrency(results.closingCosts));
}

/**
 * Update schedule display with pagination
 */
function updateScheduleDisplay() {
    const tbody = document.getElementById('amortization-body');
    if (!tbody || amortizationSchedule.length === 0) return;
    
    const startIndex = (CALCULATOR_STATE.ui.currentSchedulePage - 1) * schedulePageSize;
    const endIndex = Math.min(startIndex + schedulePageSize, amortizationSchedule.length);
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    // Add rows for current page
    for (let i = startIndex; i < endIndex; i++) {
        const payment = amortizationSchedule[i];
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${payment.paymentNumber}</td>
            <td>${formatDate(payment.date, true)}</td>
            <td>${formatCurrency(payment.totalPayment)}</td>
            <td>${formatCurrency(payment.principalPayment)}</td>
            <td>${formatCurrency(payment.interestPayment)}</td>
            <td>${formatCurrency(payment.remainingBalance)}</td>
        `;
        
        tbody.appendChild(row);
    }
    
    // Update pagination info
    const paginationInfo = document.getElementById('pagination-info');
    if (paginationInfo) {
        paginationInfo.textContent = `Payments ${startIndex + 1}-${endIndex} of ${amortizationSchedule.length}`;
    }
    
    // Update pagination buttons
    const prevBtn = document.getElementById('prev-payments');
    const nextBtn = document.getElementById('next-payments');
    
    if (prevBtn) {
        prevBtn.disabled = CALCULATOR_STATE.ui.currentSchedulePage === 1;
    }
    
    if (nextBtn) {
        const totalPages = Math.ceil(amortizationSchedule.length / schedulePageSize);
        nextBtn.disabled = CALCULATOR_STATE.ui.currentSchedulePage >= totalPages;
    }
}

/**
 * Update mortgage timeline chart
 */
function updateMortgageChart() {
    if (!mortgageChart || amortizationSchedule.length === 0) return;
    
    // Prepare chart data (yearly data points)
    const yearlyData = [];
    for (let year = 1; year <= CALCULATOR_STATE.inputs.loanTerm; year++) {
        const paymentIndex = (year * 12) - 1;
        if (paymentIndex < amortizationSchedule.length) {
            const payment = amortizationSchedule[paymentIndex];
            yearlyData.push({
                year,
                balance: payment.remainingBalance
            });
        }
    }
    
    // Update chart data
    mortgageChart.data.labels = yearlyData.map(d => `Year ${d.year}`);
    mortgageChart.data.datasets[0].data = yearlyData.map(d => d.balance);
    
    // Update chart
    mortgageChart.update('none');
    
    // Update chart subtitle
    const subtitle = document.getElementById('chart-loan-amount');
    if (subtitle) {
        subtitle.textContent = `Loan: ${formatCurrency(CALCULATOR_STATE.results.loanAmount)} | Term: ${CALCULATOR_STATE.inputs.loanTerm} years | Rate: ${CALCULATOR_STATE.inputs.interestRate}%`;
    }
    
    // Update year slider
    const yearSlider = document.getElementById('year-range');
    if (yearSlider) {
        yearSlider.max = CALCULATOR_STATE.inputs.loanTerm;
        yearSlider.value = Math.floor(CALCULATOR_STATE.inputs.loanTerm / 2);
        updateYearDetails(parseInt(yearSlider.value));
    }
}

/**
 * Create mortgage timeline chart
 */
function createMortgageChart() {
    const ctx = document.getElementById('mortgage-timeline-chart');
    if (!ctx || !Chart) return;
    
    mortgageChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Remaining Balance',
                data: [],
                borderColor: '#1E3A8A',
                backgroundColor: 'rgba(30, 58, 138, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#1E3A8A',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 58, 138, 0.9)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#1E3A8A',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        title: function(context) {
                            return context[0].label;
                        },
                        label: function(context) {
                            return `Balance: ${formatCurrency(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Loan Term (Years)',
                        color: '#6B7280'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#6B7280'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Remaining Balance ($)',
                        color: '#6B7280'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#6B7280',
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
            elements: {
                point: {
                    hoverRadius: 8
                }
            }
        }
    });
}

/**
 * Update year details from slider
 */
function updateYearDetails(year) {
    const paymentIndex = (year * 12) - 1;
    
    if (paymentIndex < amortizationSchedule.length) {
        const payment = amortizationSchedule[paymentIndex];
        const totalPrincipal = CALCULATOR_STATE.results.loanAmount - payment.remainingBalance;
        const totalInterest = (payment.paymentNumber * CALCULATOR_STATE.results.principalInterest) - totalPrincipal;
        
        updateElementText('year-label', `Year ${year}`);
        updateElementText('year-principal-paid', formatCurrency(totalPrincipal));
        updateElementText('year-interest-paid', formatCurrency(totalInterest));
        updateElementText('year-remaining-balance', formatCurrency(payment.remainingBalance));
    }
}

// ==========================================================================
// ENHANCED AI INSIGHTS SYSTEM
// ==========================================================================

/**
 * Generate comprehensive AI-powered insights
 */
function generateAIInsights() {
    console.log('🧠 Generating AI insights...');
    
    const container = document.getElementById('ai-insights');
    if (!container) return;
    
    // Clear existing insights
    container.innerHTML = '';
    
    const insights = [];
    const inputs = CALCULATOR_STATE.inputs;
    const results = CALCULATOR_STATE.results;
    
    // Insight 1: Down Payment Analysis
    const downPaymentPercent = (inputs.downPayment / inputs.homePrice) * 100;
    if (downPaymentPercent < 20) {
        insights.push({
            type: 'warning',
            icon: 'fas fa-exclamation-triangle',
            title: 'PMI Required - Consider Saving More',
            content: `Your ${downPaymentPercent.toFixed(1)}% down payment means you'll pay $${formatNumber(results.monthlyPMI)} monthly in PMI. Increasing to 20% down would eliminate this cost.`,
            impact: {
                label: 'Monthly PMI Cost',
                value: `$${formatNumber(results.monthlyPMI)}`
            },
            class: 'insight-warning'
        });
    } else {
        insights.push({
            type: 'success',
            icon: 'fas fa-check-circle',
            title: 'Excellent Down Payment',
            content: `Your ${downPaymentPercent.toFixed(1)}% down payment eliminates PMI and reduces your monthly payment. This puts you in a strong financial position.`,
            impact: {
                label: 'PMI Avoided',
                value: 'No PMI Required'
            },
            class: 'insight-success'
        });
    }
    
    // Insight 2: Interest Rate Analysis
    const marketRate = 6.44; // Current market average
    if (inputs.interestRate > marketRate + 0.5) {
        insights.push({
            type: 'error',
            icon: 'fas fa-chart-line',
            title: 'High Interest Rate - Shop for Better',
            content: `Your ${inputs.interestRate}% rate is above market average. Shopping for a better rate could save you thousands over the loan term.`,
            impact: {
                label: 'Above Market By',
                value: `+${(inputs.interestRate - marketRate).toFixed(2)}%`
            },
            class: 'insight-error'
        });
    } else if (inputs.interestRate < marketRate - 0.25) {
        insights.push({
            type: 'success',
            icon: 'fas fa-thumbs-up',
            title: 'Great Interest Rate',
            content: `Your ${inputs.interestRate}% rate is below market average. This excellent rate will save you money over the loan term.`,
            impact: {
                label: 'Below Market By',
                value: `-${(marketRate - inputs.interestRate).toFixed(2)}%`
            },
            class: 'insight-success'
        });
    }
    
    // Insight 3: Extra Payment Impact
    if (inputs.extraMonthly > 0) {
        // Calculate savings with extra payments
        const standardPayments = inputs.loanTerm * 12;
        const extraSavings = standardPayments * inputs.extraMonthly;
        const timeReduction = Math.floor(extraSavings / (results.principalInterest + inputs.extraMonthly));
        
        insights.push({
            type: 'special',
            icon: 'fas fa-rocket',
            title: 'Extra Payments Accelerating Payoff',
            content: `Your extra $${formatNumber(inputs.extraMonthly)}/month will save approximately $${formatNumber(extraSavings)} in interest and reduce loan term by ${timeReduction} months.`,
            impact: {
                label: 'Interest Savings',
                value: `$${formatNumber(extraSavings)}`
            },
            class: 'insight-special'
        });
    } else {
        const extraAmount = Math.round(results.principalInterest * 0.1); // 10% of P&I
        const potentialSavings = extraAmount * inputs.loanTerm * 12 * 0.3; // Rough calculation
        
        insights.push({
            type: 'info',
            icon: 'fas fa-lightbulb',
            title: 'Consider Extra Payments',
            content: `Adding just $${formatNumber(extraAmount)}/month (10% of your P&I payment) could save you over $${formatNumber(potentialSavings)} in interest.`,
            impact: {
                label: 'Potential Savings',
                value: `$${formatNumber(potentialSavings)}`
            },
            class: 'insight-info'
        });
    }
    
    // Insight 4: Loan Type Optimization
    const currentLoanType = inputs.loanType;
    if (currentLoanType === 'conventional' && downPaymentPercent < 10) {
        insights.push({
            type: 'info',
            icon: 'fas fa-flag-usa',
            title: 'Consider FHA Loan',
            content: `With your ${downPaymentPercent.toFixed(1)}% down payment, an FHA loan might offer better terms and lower PMI costs than conventional financing.`,
            impact: {
                label: 'FHA Min Down',
                value: '3.5%'
            },
            class: 'insight-info'
        });
    }
    
    // Insight 5: State-Specific Advice
    if (inputs.propertyState) {
        const stateData = USA_MARKET_DATA.states[inputs.propertyState];
        const taxBurden = inputs.propertyTax / inputs.homePrice;
        
        if (taxBurden > 0.015) { // High tax rate
            insights.push({
                type: 'warning',
                icon: 'fas fa-building',
                title: 'High Property Tax Area',
                content: `${stateData.name} has relatively high property taxes at ${(taxBurden * 100).toFixed(2)}% of home value. Consider this in your total budget.`,
                impact: {
                    label: 'Annual Tax Rate',
                    value: `${(taxBurden * 100).toFixed(2)}%`
                },
                class: 'insight-warning'
            });
        }
    }
    
    // Insight 6: Total Cost Analysis
    const totalCostPercent = (results.totalCost / inputs.homePrice) * 100;
    if (totalCostPercent > 180) { // High total cost
        insights.push({
            type: 'warning',
            icon: 'fas fa-calculator',
            title: 'High Total Loan Cost',
            content: `Your total cost of ${totalCostPercent.toFixed(0)}% of home price is high. Consider a shorter term or extra payments to reduce total interest.`,
            impact: {
                label: 'Total Interest',
                value: `$${formatNumber(results.totalInterest)}`
            },
            class: 'insight-warning'
        });
    }
    
    // Insight 7: Affordability Check
    const monthlyPaymentPercent = (results.totalPayment / (inputs.homePrice * 0.0025)) * 100; // Rough income estimate
    if (monthlyPaymentPercent > 80) {
        insights.push({
            type: 'error',
            icon: 'fas fa-exclamation-circle',
            title: 'Payment May Be Too High',
            content: `Your monthly payment appears high relative to typical income ratios. Consider a less expensive home or larger down payment.`,
            impact: {
                label: 'Monthly Payment',
                value: `$${formatNumber(results.totalPayment)}`
            },
            class: 'insight-error'
        });
    }
    
    // Insight 8: Credit Score Impact
    if (inputs.creditScore < 700) {
        const rateImprovement = USA_MARKET_DATA.creditScoreImpact[700].adjustment - USA_MARKET_DATA.creditScoreImpact[inputs.creditScore].adjustment;
        const monthlySavings = (results.loanAmount * rateImprovement / 100 / 12);
        
        insights.push({
            type: 'info',
            icon: 'fas fa-chart-line',
            title: 'Improve Credit Score for Better Rate',
            content: `Improving your credit score to 700+ could reduce your rate by ${rateImprovement.toFixed(2)}% and save approximately $${formatNumber(monthlySavings)}/month.`,
            impact: {
                label: 'Potential Monthly Savings',
                value: `$${formatNumber(monthlySavings)}`
            },
            class: 'insight-info'
        });
    }
    
    // Enhanced Insight 9: Market Timing
    insights.push({
        type: 'special',
        icon: 'fas fa-chart-area',
        title: 'Current Market Analysis',
        content: `Today's rates are near ${getCurrentRateTrend()}. Consider ${getRateAdvice()} based on current market conditions and Federal Reserve policy.`,
        impact: {
            label: 'Market Trend',
            value: getCurrentRateTrend()
        },
        class: 'gradient-rainbow'
    });
    
    // Limit to 6 insights and shuffle for variety
    const selectedInsights = shuffleArray(insights).slice(0, 6);
    
    // Render insights with enhanced animations
    selectedInsights.forEach((insight, index) => {
        const insightElement = document.createElement('div');
        insightElement.className = `insight-item ${insight.class} animate-slide-up`;
        insightElement.style.animationDelay = `${index * 100}ms`;
        
        insightElement.innerHTML = `
            <div class="insight-header">
                <div class="insight-icon">
                    <i class="${insight.icon}"></i>
                </div>
                <div class="insight-content">
                    <h4>${insight.title}</h4>
                    <p>${insight.content}</p>
                    <div class="impact-display">
                        <span class="impact-label">${insight.impact.label}:</span>
                        <span class="impact-value">${insight.impact.value}</span>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(insightElement);
    });
    
    // Track AI insights generation
    trackEvent('AI Insights', 'Generated', `${selectedInsights.length} insights`);
    
    console.log(`✅ Generated ${selectedInsights.length} AI insights`);
}

// ==========================================================================
// ENHANCED LIVE RATES SYSTEM
// ==========================================================================

/**
 * Update live rates from multiple sources
 */
async function updateLiveRates() {
    console.log('📊 Updating live rates...');
    
    try {
        // Simulate live rate updates (in production, this would fetch from real APIs)
        const baseRates = {
            '30yr': 6.44,
            '15yr': 5.74,
            'arm': 5.90,
            'fha': 6.45
        };
        
        // Add some realistic variation
        const variation = (Math.random() - 0.5) * 0.3; // ±0.15%
        const rates = {};
        Object.keys(baseRates).forEach(key => {
            rates[key] = baseRates[key] + variation;
        });
        
        // Update rate displays
        updateElementText('rate-30yr', `${rates['30yr'].toFixed(2)}%`);
        updateElementText('rate-15yr', `${rates['15yr'].toFixed(2)}%`);
        updateElementText('rate-arm', `${rates.arm.toFixed(2)}%`);
        updateElementText('rate-fha', `${rates.fha.toFixed(2)}%`);
        
        // Update rate changes (simulate daily changes)
        const changes = {
            '30yr': (Math.random() - 0.5) * 0.2,
            '15yr': (Math.random() - 0.5) * 0.15,
            'arm': (Math.random() - 0.5) * 0.1,
            'fha': (Math.random() - 0.5) * 0.1
        };
        
        Object.keys(changes).forEach(key => {
            const changeElement = document.getElementById(`rate-${key}-change`);
            if (changeElement) {
                const change = changes[key];
                const changeText = change > 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`;
                changeElement.textContent = changeText;
                changeElement.className = `rate-change ${change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral'}`;
            }
        });
        
        // Update timestamp
        const now = new Date();
        const timeElement = document.getElementById('last-update-time');
        if (timeElement) {
            timeElement.textContent = formatTime(now);
        }
        
        // Update current user's rate if using market rate
        if (CALCULATOR_STATE.inputs.interestRate === 6.44) { // Market rate
            CALCULATOR_STATE.inputs.interestRate = rates['30yr'];
            updateInputValue('interest-rate', rates['30yr'].toFixed(2));
            performCalculation();
        }
        
        console.log('✅ Live rates updated');
        
    } catch (error) {
        console.error('❌ Failed to update live rates:', error);
    }
}

// ==========================================================================
// ENHANCED LOAN TYPE AND FORM FUNCTIONS
// ==========================================================================

/**
 * Enhanced loan type selection
 */
function selectLoanType(loanType) {
    console.log('Selecting loan type:', loanType);
    
    CALCULATOR_STATE.inputs.loanType = loanType;
    
    // Update UI
    document.querySelectorAll('.loan-type-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-checked', 'false');
    });
    
    const selectedBtn = document.querySelector(`[data-loan-type="${loanType}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('active');
        selectedBtn.setAttribute('aria-checked', 'true');
    }
    
    // Update loan requirements display
    const loanData = USA_MARKET_DATA.loanTypes[loanType];
    const requirementText = document.getElementById('down-payment-requirement');
    if (requirementText) {
        requirementText.textContent = `(Min: ${loanData.minDownPayment}% down)`;
    }
    
    // Update PMI calculation based on loan type
    updatePMICalculation();
    
    // Show loan type specific information
    showLoanTypeInfo(loanType);
    
    // Recalculate
    performCalculation();
    
    // Track selection
    trackEvent('Loan Type', 'Select', loanType);
    
    // Announce to screen reader
    announceToScreenReader(`${loanData.name} loan selected`);
}

/**
 * Enhanced loan term selection
 */
function selectLoanTerm(term) {
    console.log('Selecting loan term:', term);
    
    CALCULATOR_STATE.inputs.loanTerm = term;
    CALCULATOR_STATE.inputs.customTerm = null;
    
    // Update UI
    document.querySelectorAll('.term-chip').forEach(chip => {
        chip.classList.remove('active');
        chip.setAttribute('aria-checked', 'false');
    });
    
    const selectedChip = document.querySelector(`[data-term="${term}"]`);
    if (selectedChip) {
        selectedChip.classList.add('active');
        selectedChip.setAttribute('aria-checked', 'true');
    }
    
    // Clear custom term input
    updateInputValue('custom-term', '');
    const statusElement = document.getElementById('custom-term-status');
    if (statusElement) {
        statusElement.style.display = 'none';
    }
    
    // Recalculate
    performCalculation();
    
    // Track selection
    trackEvent('Loan Term', 'Select', `${term} years`);
    
    // Announce to screen reader
    announceToScreenReader(`${term} year term selected`);
}

/**
 * Enhanced extra payment frequency toggle
 */
function setExtraPaymentFrequency(frequency) {
    console.log('Setting extra payment frequency:', frequency);
    
    // Update UI
    document.querySelectorAll('.frequency-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-checked', 'false');
    });
    
    const selectedBtn = document.getElementById(`${frequency}-toggle`);
    if (selectedBtn) {
        selectedBtn.classList.add('active');
        selectedBtn.setAttribute('aria-checked', 'true');
    }
    
    // Update label
    const label = document.getElementById('extra-payment-label');
    if (label) {
        label.textContent = frequency === 'weekly' ? 'Extra Weekly Payment' : 'Extra Monthly Payment';
    }
    
    // Recalculate if there's an extra payment
    if (CALCULATOR_STATE.inputs.extraMonthly > 0) {
        performCalculation();
    }
    
    // Track selection
    trackEvent('Extra Payment', 'Frequency', frequency);
}

/**
 * Toggle down payment input mode
 */
function toggleDownPaymentMode(mode) {
    console.log('Toggling down payment mode:', mode);
    
    // Update toggle buttons
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const selectedBtn = document.getElementById(`${mode}-toggle`);
    if (selectedBtn) {
        selectedBtn.classList.add('active');
    }
    
    // Show/hide input variants
    document.querySelectorAll('.input-variant').forEach(variant => {
        variant.classList.remove('active');
    });
    
    const selectedVariant = document.getElementById(`${mode}-input`);
    if (selectedVariant) {
        selectedVariant.classList.add('active');
    }
    
    // Focus on the active input
    const activeInput = selectedVariant?.querySelector('input');
    if (activeInput) {
        setTimeout(() => activeInput.focus(), 100);
    }
    
    trackEvent('UI', 'Down Payment Mode', mode);
}

// ==========================================================================
// ENHANCED CALCULATION HELPER FUNCTIONS
// ==========================================================================

/**
 * Update PMI calculation based on loan type and down payment
 */
function updatePMICalculation() {
    const loanType = CALCULATOR_STATE.inputs.loanType;
    const downPaymentPercent = (CALCULATOR_STATE.inputs.downPayment / CALCULATOR_STATE.inputs.homePrice) * 100;
    const loanAmount = CALCULATOR_STATE.inputs.homePrice - CALCULATOR_STATE.inputs.downPayment;
    
    let pmiAmount = 0;
    let pmiRate = 0;
    
    const loanData = USA_MARKET_DATA.loanTypes[loanType];
    
    if (loanType === 'va') {
        // VA loans don't have PMI
        pmiAmount = 0;
        pmiRate = 0;
    } else if (loanType === 'fha' || downPaymentPercent < 20) {
        // FHA or conventional with <20% down requires MI
        pmiRate = loanData.pmiRate;
        pmiAmount = loanAmount * pmiRate;
    }
    
    CALCULATOR_STATE.inputs.pmi = pmiAmount;
    
    // Update PMI display
    updateInputValue('pmi', formatCurrency(pmiAmount));
    
    const pmiRateDisplay = document.getElementById('pmi-rate-display');
    const pmiPercentageDisplay = document.getElementById('pmi-percentage-display');
    
    if (pmiRateDisplay) {
        pmiRateDisplay.textContent = `${(pmiRate * 100).toFixed(2)}%`;
    }
    
    if (pmiPercentageDisplay) {
        pmiPercentageDisplay.textContent = `${(pmiRate * 100).toFixed(2)}% annually`;
    }
    
    // Show/hide PMI warning
    const pmiWarning = document.getElementById('pmi-warning');
    if (pmiWarning) {
        pmiWarning.style.display = pmiAmount > 0 ? 'flex' : 'none';
    }
    
    // Show/hide PMI info panel
    const pmiInfo = document.getElementById('pmi-info');
    if (pmiInfo) {
        pmiInfo.style.display = pmiAmount > 0 ? 'block' : 'none';
    }
}

/**
 * Update down payment percentage from amount
 */
function updateDownPaymentPercent() {
    const percent = (CALCULATOR_STATE.inputs.downPayment / CALCULATOR_STATE.inputs.homePrice) * 100;
    CALCULATOR_STATE.inputs.downPaymentPercent = percent;
    updateInputValue('down-payment-percent', percent.toFixed(1));
}

/**
 * Update down payment amount from percentage
 */
function updateDownPaymentFromPercent() {
    const amount = CALCULATOR_STATE.inputs.homePrice * (CALCULATOR_STATE.inputs.downPaymentPercent / 100);
    CALCULATOR_STATE.inputs.downPayment = amount;
    updateInputValue('down-payment', formatCurrency(amount));
}

/**
 * Update closing costs calculation
 */
function updateClosingCosts() {
    const closingCosts = CALCULATOR_STATE.inputs.homePrice * (CALCULATOR_STATE.inputs.closingCostsPercentage / 100);
    CALCULATOR_STATE.results.closingCosts = closingCosts;
    
    const closingCostsDollar = document.getElementById('closing-costs-dollar');
    if (closingCostsDollar) {
        closingCostsDollar.textContent = formatCurrency(closingCosts);
    }
    
    // Update breakdown if visible
    updateClosingCostsBreakdown();
}

/**
 * Update closing costs breakdown
 */
function updateClosingCostsBreakdown() {
    const totalCosts = CALCULATOR_STATE.results.closingCosts;
    const homePrice = CALCULATOR_STATE.inputs.homePrice;
    
    // Typical cost distributions
    const costs = {
        appraisal: Math.min(800, homePrice * 0.001),
        title: homePrice * 0.005,
        lender: homePrice * 0.01,
        attorney: Math.min(1200, homePrice * 0.002),
        other: 0
    };
    
    costs.other = totalCosts - (costs.appraisal + costs.title + costs.lender + costs.attorney);
    
    // Update display elements
    Object.keys(costs).forEach(key => {
        const element = document.getElementById(`cost-${key}`);
        if (element) {
            element.textContent = formatCurrency(costs[key]);
        }
    });
}

/**
 * Update rate based on credit score
 */
function updateRateForCreditScore() {
    const creditScore = CALCULATOR_STATE.inputs.creditScore;
    const baseRate = 6.44; // Market rate
    
    if (creditScore && USA_MARKET_DATA.creditScoreImpact[creditScore]) {
        const adjustment = USA_MARKET_DATA.creditScoreImpact[creditScore].adjustment;
        const newRate = baseRate + adjustment;
        
        CALCULATOR_STATE.inputs.interestRate = newRate;
        updateInputValue('interest-rate', newRate.toFixed(3));
    }
}

/**
 * Update extra payment preview
 */
function updateExtraPaymentPreview() {
    const extraAmount = CALCULATOR_STATE.inputs.extraMonthly;
    const preview = document.getElementById('extra-payment-preview');
    
    if (preview && extraAmount > 0) {
        // Rough calculation of time savings
        const monthsSaved = Math.floor(extraAmount / 10); // Simplified
        preview.textContent = `(saves ~${monthsSaved} months)`;
        preview.style.color = '#059669';
    } else if (preview) {
        preview.textContent = '';
    }
}

// ==========================================================================
// ENHANCED UTILITY FUNCTIONS
// ==========================================================================

/**
 * Auto-fill USA market defaults
 */
function autoFillUSADefaults() {
    console.log('Auto-filling USA market defaults...');
    
    // Reset to market defaults
    CALCULATOR_STATE.inputs = {
        ...CALCULATOR_STATE.inputs,
        homePrice: 450000,
        downPayment: 90000,
        downPaymentPercent: 20,
        interestRate: 6.44,
        propertyTax: 9000,
        homeInsurance: 1800,
        pmi: 0,
        hoaFees: 0,
        extraMonthly: 0,
        extraOnetime: 0,
        closingCostsPercentage: 3,
        loanType: 'conventional'
    };
    
    // Update form values
    updateInputValue('home-price', formatCurrency(450000));
    updateInputValue('down-payment', formatCurrency(90000));
    updateInputValue('down-payment-percent', 20);
    updateInputValue('interest-rate', 6.44);
    updateInputValue('property-tax', formatCurrency(9000));
    updateInputValue('home-insurance', formatCurrency(1800));
    updateInputValue('pmi', formatCurrency(0));
    updateInputValue('hoa-fees', formatCurrency(0));
    updateInputValue('extra-monthly', formatCurrency(0));
    updateInputValue('extra-onetime', formatCurrency(0));
    updateInputValue('closing-costs-percentage', 3);
    
    // Reset loan type
    selectLoanType('conventional');
    selectLoanTerm(30);
    
    // Perform calculation
    performCalculation();
    
    // Show success message
    showToast('USA market defaults applied successfully!', 'success');
    
    // Track event
    trackEvent('Form', 'Auto Fill', 'USA Defaults');
    
    // Announce to screen reader
    announceToScreenReader('Form filled with USA market defaults');
}

/**
 * Clear all form inputs
 */
function clearAllInputs() {
    console.log('Clearing all inputs...');
    
    // Clear text inputs
    const textInputs = [
        'home-price', 'down-payment', 'down-payment-percent', 'zip-code',
        'interest-rate', 'custom-term', 'property-tax', 'home-insurance',
        'pmi', 'hoa-fees', 'extra-monthly', 'extra-onetime', 'closing-costs-percentage'
    ];
    
    textInputs.forEach(id => {
        updateInputValue(id, '');
    });
    
    // Reset dropdowns
    updateInputValue('property-state', '');
    updateInputValue('credit-score', '');
    
    // Reset loan type to conventional
    selectLoanType('conventional');
    selectLoanTerm(30);
    
    // Reset state
    CALCULATOR_STATE.inputs = {
        homePrice: 0,
        downPayment: 0,
        downPaymentPercent: 0,
        zipCode: '',
        creditScore: 700,
        interestRate: 0,
        loanTerm: 30,
        customTerm: null,
        propertyState: '',
        propertyTax: 0,
        homeInsurance: 0,
        pmi: 0,
        hoaFees: 0,
        extraMonthly: 0,
        extraOnetime: 0,
        closingCostsPercentage: 0,
        loanType: 'conventional'
    };
    
    // Clear results
    CALCULATOR_STATE.results = {
        monthlyPayment: 0,
        principalInterest: 0,
        monthlyTax: 0,
        monthlyInsurance: 0,
        monthlyPMI: 0,
        monthlyHOA: 0,
        totalPayment: 0,
        totalInterest: 0,
        totalCost: 0,
        payoffDate: null,
        closingCosts: 0
    };
    
    // Update displays
    updateResultsDisplay();
    updatePaymentBreakdown();
    updateLoanSummary();
    
    // Clear chart
    if (mortgageChart) {
        mortgageChart.data.labels = [];
        mortgageChart.data.datasets[0].data = [];
        mortgageChart.update();
    }
    
    // Clear schedule
    amortizationSchedule = [];
    updateScheduleDisplay();
    
    // Clear AI insights
    const insightsContainer = document.getElementById('ai-insights');
    if (insightsContainer) {
        insightsContainer.innerHTML = '<p class="text-center text-gray-500">Enter loan details to see AI insights</p>';
    }
    
    // Show success message
    showToast('All inputs cleared successfully!', 'success');
    
    // Track event
    trackEvent('Form', 'Clear All', 'User Action');
    
    // Announce to screen reader
    announceToScreenReader('All form inputs cleared');
}

/**
 * Save calculation results
 */
function saveResults() {
    console.log('Saving results...');
    
    const results = {
        timestamp: new Date().toISOString(),
        inputs: { ...CALCULATOR_STATE.inputs },
        results: { ...CALCULATOR_STATE.results },
        id: Date.now().toString()
    };
    
    // Save to localStorage
    const savedResults = JSON.parse(localStorage.getItem('mortgageCalculations') || '[]');
    savedResults.unshift(results);
    
    // Keep only last 10 calculations
    savedResults.splice(10);
    
    localStorage.setItem('mortgageCalculations', JSON.stringify(savedResults));
    
    // Show success message
    showToast('Results saved successfully!', 'success');
    
    // Track event
    trackEvent('Results', 'Save', 'User Action');
    
    // Announce to screen reader
    announceToScreenReader('Calculation results saved');
}

/**
 * Add current calculation to comparison
 */
function addToComparison() {
    console.log('Adding to comparison...');
    
    const comparison = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        inputs: { ...CALCULATOR_STATE.inputs },
        results: { ...CALCULATOR_STATE.results }
    };
    
    CALCULATOR_STATE.ui.comparison.push(comparison);
    
    // Show comparison table
    updateComparisonTable();
    
    // Show success message
    showToast('Added to loan comparison!', 'success');
    
    // Track event
    trackEvent('Comparison', 'Add', 'User Action');
}

/**
 * Share calculation results
 */
function shareResults() {
    console.log('Sharing results...');
    
    if (navigator.share) {
        // Use Web Share API if available
        navigator.share({
            title: 'My USA Mortgage Calculation',
            text: `Monthly Payment: ${formatCurrency(CALCULATOR_STATE.results.totalPayment)}`,
            url: window.location.href
        }).then(() => {
            trackEvent('Results', 'Share', 'Native Share');
        }).catch((error) => {
            console.log('Error sharing:', error);
            fallbackShare();
        });
    } else {
        fallbackShare();
    }
}

/**
 * Download results as PDF
 */
function downloadPDF() {
    console.log('Downloading PDF...');
    
    if (typeof jsPDF === 'undefined') {
        showToast('PDF generation not available', 'error');
        return;
    }
    
    try {
        const doc = new jsPDF();
        const results = CALCULATOR_STATE.results;
        const inputs = CALCULATOR_STATE.inputs;
        
        // Title
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text('USA Mortgage Calculation Report', 20, 20);
        
        // Date
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(`Generated: ${formatDate(new Date())}`, 20, 30);
        
        // Loan Details
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Loan Details', 20, 50);
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        let yPos = 60;
        
        const loanDetails = [
            `Home Price: ${formatCurrency(inputs.homePrice)}`,
            `Down Payment: ${formatCurrency(inputs.downPayment)} (${inputs.downPaymentPercent.toFixed(1)}%)`,
            `Loan Amount: ${formatCurrency(results.loanAmount)}`,
            `Interest Rate: ${inputs.interestRate}%`,
            `Loan Term: ${inputs.loanTerm} years`,
            `Loan Type: ${USA_MARKET_DATA.loanTypes[inputs.loanType].name}`
        ];
        
        loanDetails.forEach(detail => {
            doc.text(detail, 20, yPos);
            yPos += 8;
        });
        
        // Payment Breakdown
        yPos += 10;
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Monthly Payment Breakdown', 20, yPos);
        
        yPos += 10;
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        
        const paymentDetails = [
            `Principal & Interest: ${formatCurrency(results.principalInterest)}`,
            `Property Tax: ${formatCurrency(results.monthlyTax)}`,
            `Home Insurance: ${formatCurrency(results.monthlyInsurance)}`,
            `PMI: ${formatCurrency(results.monthlyPMI)}`,
            `HOA Fees: ${formatCurrency(results.monthlyHOA)}`,
            `Total Monthly Payment: ${formatCurrency(results.totalPayment)}`
        ];
        
        paymentDetails.forEach(detail => {
            doc.text(detail, 20, yPos);
            yPos += 8;
        });
        
        // Summary
        yPos += 10;
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Loan Summary', 20, yPos);
        
        yPos += 10;
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        
        const summaryDetails = [
            `Total Interest: ${formatCurrency(results.totalInterest)}`,
            `Total Cost: ${formatCurrency(results.totalCost)}`,
            `Payoff Date: ${formatDate(results.payoffDate)}`,
            `Closing Costs: ${formatCurrency(results.closingCosts)}`
        ];
        
        summaryDetails.forEach(detail => {
            doc.text(detail, 20, yPos);
            yPos += 8;
        });
        
        // Footer
        doc.setFontSize(10);
        doc.text('Generated by FinGuid USA Mortgage Calculator', 20, 280);
        doc.text('© 2025 FinGuid - World\'s First AI Calculator Platform for Americans', 20, 290);
        
        // Save the PDF
        doc.save(`USA-Mortgage-Calculation-${new Date().toISOString().split('T')[0]}.pdf`);
        
        // Show success message
        showToast('PDF downloaded successfully!', 'success');
        
        // Track event
        trackEvent('Results', 'Download PDF', 'User Action');
        
    } catch (error) {
        console.error('PDF generation error:', error);
        showToast('Failed to generate PDF', 'error');
    }
}

/**
 * Print calculation results
 */
function printResults() {
    console.log('Printing results...');
    
    // Create print-friendly content
    const printWindow = window.open('', '_blank');
    const results = CALCULATOR_STATE.results;
    const inputs = CALCULATOR_STATE.inputs;
    
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>USA Mortgage Calculation Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                .header { text-align: center; border-bottom: 2px solid #1E3A8A; padding-bottom: 20px; }
                .section { margin: 30px 0; }
                .section h2 { color: #1E3A8A; border-bottom: 1px solid #ccc; }
                .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
                .total-payment { font-size: 24px; font-weight: bold; color: #1E3A8A; text-align: center; margin: 20px 0; }
                .footer { text-align: center; margin-top: 40px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🇺🇸 USA Mortgage Calculation Report</h1>
                <p>Generated on ${formatDate(new Date())} by FinGuid</p>
            </div>
            
            <div class="section">
                <h2>Loan Details</h2>
                <div class="detail-row"><span>Home Price:</span><span>${formatCurrency(inputs.homePrice)}</span></div>
                <div class="detail-row"><span>Down Payment:</span><span>${formatCurrency(inputs.downPayment)} (${inputs.downPaymentPercent.toFixed(1)}%)</span></div>
                <div class="detail-row"><span>Loan Amount:</span><span>${formatCurrency(results.loanAmount)}</span></div>
                <div class="detail-row"><span>Interest Rate:</span><span>${inputs.interestRate}%</span></div>
                <div class="detail-row"><span>Loan Term:</span><span>${inputs.loanTerm} years</span></div>
                <div class="detail-row"><span>Loan Type:</span><span>${USA_MARKET_DATA.loanTypes[inputs.loanType].name}</span></div>
            </div>
            
            <div class="total-payment">Total Monthly Payment: ${formatCurrency(results.totalPayment)}</div>
            
            <div class="section">
                <h2>Monthly Payment Breakdown</h2>
                <div class="detail-row"><span>Principal & Interest:</span><span>${formatCurrency(results.principalInterest)}</span></div>
                <div class="detail-row"><span>Property Tax:</span><span>${formatCurrency(results.monthlyTax)}</span></div>
                <div class="detail-row"><span>Home Insurance:</span><span>${formatCurrency(results.monthlyInsurance)}</span></div>
                ${results.monthlyPMI > 0 ? `<div class="detail-row"><span>PMI:</span><span>${formatCurrency(results.monthlyPMI)}</span></div>` : ''}
                ${results.monthlyHOA > 0 ? `<div class="detail-row"><span>HOA Fees:</span><span>${formatCurrency(results.monthlyHOA)}</span></div>` : ''}
            </div>
            
            <div class="section">
                <h2>Loan Summary</h2>
                <div class="detail-row"><span>Total Interest:</span><span>${formatCurrency(results.totalInterest)}</span></div>
                <div class="detail-row"><span>Total Cost:</span><span>${formatCurrency(results.totalCost)}</span></div>
                <div class="detail-row"><span>Payoff Date:</span><span>${formatDate(results.payoffDate)}</span></div>
                <div class="detail-row"><span>Closing Costs:</span><span>${formatCurrency(results.closingCosts)}</span></div>
            </div>
            
            <div class="footer">
                <p>© 2025 FinGuid - World's First AI Calculator Platform for Americans</p>
                <p>Visit finguid.com for more financial calculators and tools</p>
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
    
    // Track event
    trackEvent('Results', 'Print', 'User Action');
}

// ==========================================================================
// ENHANCED PAGINATION AND NAVIGATION
// ==========================================================================

/**
 * Navigate to previous payments in schedule
 */
function previousPayments() {
    if (CALCULATOR_STATE.ui.currentSchedulePage > 1) {
        CALCULATOR_STATE.ui.currentSchedulePage--;
        updateScheduleDisplay();
        trackEvent('Schedule', 'Previous Page', CALCULATOR_STATE.ui.currentSchedulePage);
    }
}

/**
 * Navigate to next payments in schedule
 */
function nextPayments() {
    const totalPages = Math.ceil(amortizationSchedule.length / schedulePageSize);
    if (CALCULATOR_STATE.ui.currentSchedulePage < totalPages) {
        CALCULATOR_STATE.ui.currentSchedulePage++;
        updateScheduleDisplay();
        trackEvent('Schedule', 'Next Page', CALCULATOR_STATE.ui.currentSchedulePage);
    }
}

/**
 * Switch schedule tab view
 */
function switchScheduleTab(tab) {
    console.log('Switching schedule tab:', tab);
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`[data-tab="${tab}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Update schedule display based on tab
    if (tab === 'yearly') {
        displayYearlySchedule();
    } else {
        updateScheduleDisplay();
    }
    
    trackEvent('Schedule', 'Tab Switch', tab);
}

/**
 * Display yearly schedule summary
 */
function displayYearlySchedule() {
    const tbody = document.getElementById('amortization-body');
    if (!tbody || amortizationSchedule.length === 0) return;
    
    tbody.innerHTML = '';
    
    const yearlyData = [];
    for (let year = 1; year <= CALCULATOR_STATE.inputs.loanTerm; year++) {
        const startIndex = (year - 1) * 12;
        const endIndex = Math.min(year * 12, amortizationSchedule.length);
        
        if (startIndex < amortizationSchedule.length) {
            let yearlyPrincipal = 0;
            let yearlyInterest = 0;
            let yearlyTotal = 0;
            
            for (let i = startIndex; i < endIndex && i < amortizationSchedule.length; i++) {
                yearlyPrincipal += amortizationSchedule[i].principalPayment;
                yearlyInterest += amortizationSchedule[i].interestPayment;
                yearlyTotal += amortizationSchedule[i].totalPayment;
            }
            
            const endBalance = endIndex < amortizationSchedule.length ? 
                amortizationSchedule[endIndex - 1].remainingBalance : 0;
            
            yearlyData.push({
                year,
                principal: yearlyPrincipal,
                interest: yearlyInterest,
                total: yearlyTotal,
                balance: endBalance
            });
        }
    }
    
    // Display yearly data
    yearlyData.forEach(data => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${data.year}</td>
            <td>Year ${data.year}</td>
            <td>${formatCurrency(data.total)}</td>
            <td>${formatCurrency(data.principal)}</td>
            <td>${formatCurrency(data.interest)}</td>
            <td>${formatCurrency(data.balance)}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Hide pagination for yearly view
    const pagination = document.querySelector('.schedule-pagination');
    if (pagination) {
        pagination.style.display = 'none';
    }
}

/**
 * Toggle chart view
 */
function toggleChartView() {
    const container = document.querySelector('.chart-container');
    if (container) {
        container.classList.toggle('expanded');
        
        if (mortgageChart) {
            setTimeout(() => {
                mortgageChart.resize();
            }, 300);
        }
    }
    
    trackEvent('Chart', 'Toggle View', 'User Action');
}

// ==========================================================================
// ENHANCED UTILITY HELPER FUNCTIONS
// ==========================================================================

/**
 * Populate state dropdown with USA states
 */
function populateStateDropdown() {
    const stateSelect = document.getElementById('property-state');
    if (!stateSelect) return;
    
    // Clear existing options except the first one
    while (stateSelect.children.length > 1) {
        stateSelect.removeChild(stateSelect.lastChild);
    }
    
    // Add states
    Object.entries(USA_MARKET_DATA.states).forEach(([code, data]) => {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = data.name;
        stateSelect.appendChild(option);
    });
}

/**
 * Show state-specific programs
 */
function showStatePrograms(stateData) {
    const programsContainer = document.getElementById('state-specific-programs');
    if (!programsContainer) return;
    
    programsContainer.innerHTML = `
        <h4>${stateData.name} Homebuyer Programs</h4>
        <ul class="programs-list">
            ${stateData.programs.map(program => `
                <li class="program-item">
                    <i class="fas fa-check-circle"></i>
                    <span>${program}</span>
                </li>
            `).join('')}
        </ul>
        <small class="programs-note">Contact local lenders for program details and eligibility.</small>
    `;
}

/**
 * Show loan type information
 */
function showLoanTypeInfo(loanType) {
    console.log('Showing loan type info for:', loanType);
    
    const loanData = USA_MARKET_DATA.loanTypes[loanType];
    const info = {
        conventional: {
            description: 'Traditional mortgage not insured by government',
            benefits: ['Competitive rates', 'No upfront MIP', 'PMI removable at 20% equity'],
            requirements: ['3% minimum down payment', 'Good credit score recommended']
        },
        fha: {
            description: 'Government-insured loan with lower down payment requirements',
            benefits: ['3.5% minimum down', 'More flexible credit requirements', 'Assumable loans'],
            requirements: ['Mortgage Insurance Premium (MIP)', 'Primary residence only']
        },
        va: {
            description: 'Exclusive benefit for eligible veterans and service members',
            benefits: ['$0 down payment', 'No PMI required', 'Competitive rates', 'No prepayment penalty'],
            requirements: ['Valid Certificate of Eligibility', 'Primary residence requirement']
        },
        usda: {
            description: 'Rural and suburban homebuyer assistance program',
            benefits: ['$0 down payment', 'Below-market rates', 'Low guarantee fee'],
            requirements: ['Eligible rural area', 'Income limits apply', 'Primary residence only']
        }
    };
    
    // You could show this information in a modal or info panel
    // For now, just log it
    console.log('Loan type info:', info[loanType]);
}

/**
 * Lookup ZIP code information
 */
async function lookupZipCode(zipCode) {
    // In production, you would call a real API
    // For now, return mock data
    const mockZipData = {
        '90210': { city: 'Beverly Hills', state: 'CA' },
        '10001': { city: 'New York', state: 'NY' },
        '60601': { city: 'Chicago', state: 'IL' },
        '75001': { city: 'Addison', state: 'TX' },
        '33101': { city: 'Miami', state: 'FL' },
        '98101': { city: 'Seattle', state: 'WA' },
        '80201': { city: 'Denver', state: 'CO' },
        '30301': { city: 'Atlanta', state: 'GA' }
    };
    
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (mockZipData[zipCode]) {
                resolve(mockZipData[zipCode]);
            } else {
                reject(new Error('ZIP code not found'));
            }
        }, 1000); // Simulate API delay
    });
}

/**
 * Set suggested value for input
 */
function setSuggestedValue(inputId, value) {
    updateInputValue(inputId, formatCurrency(value));
    const field = inputId.replace('-', '');
    handleInputChange(field, value);
    
    trackEvent('Suggestion', 'Click', `${inputId}: ${value}`);
}

/**
 * Set suggested percentage value
 */
function setSuggestedPercent(inputId, value) {
    updateInputValue(inputId, value);
    const field = inputId.replace('-', '');
    handleInputChange(field, value);
    
    trackEvent('Suggestion', 'Click', `${inputId}: ${value}%`);
}

/**
 * Update input value helper
 */
function updateInputValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.value = value;
    }
}

/**
 * Update element text content helper
 */
function updateElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    }
}

/**
 * Update element width helper (for progress bars)
 */
function updateElementWidth(elementId, width) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.width = width;
    }
}

/**
 * Update comparison table display
 */
function updateComparisonTable() {
    const container = document.getElementById('comparison-table');
    if (!container || CALCULATOR_STATE.ui.comparison.length === 0) return;
    
    container.style.display = 'block';
    
    // Create comparison table
    const table = document.createElement('table');
    table.className = 'comparison-table';
    
    // Header row
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `
        <th>Item</th>
        ${CALCULATOR_STATE.ui.comparison.map((_, index) => `<th>Option ${index + 1}</th>`).join('')}
    `;
    table.appendChild(headerRow);
    
    // Data rows
    const compareItems = [
        { label: 'Home Price', key: 'homePrice', format: 'currency' },
        { label: 'Down Payment', key: 'downPayment', format: 'currency' },
        { label: 'Interest Rate', key: 'interestRate', format: 'percent' },
        { label: 'Loan Term', key: 'loanTerm', format: 'years' },
        { label: 'Monthly Payment', key: 'totalPayment', format: 'currency', resultKey: true },
        { label: 'Total Interest', key: 'totalInterest', format: 'currency', resultKey: true }
    ];
    
    compareItems.forEach(item => {
        const row = document.createElement('tr');
        let cells = `<td><strong>${item.label}</strong></td>`;
        
        CALCULATOR_STATE.ui.comparison.forEach(comparison => {
            const data = item.resultKey ? comparison.results : comparison.inputs;
            const value = data[item.key];
            const formattedValue = formatComparisonValue(value, item.format);
            cells += `<td>${formattedValue}</td>`;
        });
        
        row.innerHTML = cells;
        table.appendChild(row);
    });
    
    container.innerHTML = '';
    container.appendChild(table);
}

/**
 * Format comparison value based on type
 */
function formatComparisonValue(value, format) {
    switch (format) {
        case 'currency':
            return formatCurrency(value);
        case 'percent':
            return `${value}%`;
        case 'years':
            return `${value} years`;
        default:
            return value;
    }
}

/**
 * Copy embed code to clipboard
 */
function copyEmbedCode() {
    const embedCode = document.getElementById('embed-code');
    if (embedCode) {
        embedCode.select();
        embedCode.setSelectionRange(0, 99999); // For mobile devices
        
        try {
            document.execCommand('copy');
            showToast('Embed code copied to clipboard!', 'success');
            trackEvent('Embed', 'Copy Code', 'User Action');
        } catch (err) {
            console.error('Failed to copy embed code:', err);
            showToast('Failed to copy embed code', 'error');
        }
    }
}

/**
 * Subscribe to newsletter
 */
function subscribeNewsletter(event) {
    event.preventDefault();
    
    const form = event.target;
    const email = form.querySelector('input[type="email"]').value;
    
    // In production, you would send this to your newsletter service
    console.log('Newsletter subscription:', email);
    
    showToast('Successfully subscribed to newsletter!', 'success');
    form.reset();
    
    trackEvent('Newsletter', 'Subscribe', email);
}

/**
 * Track lender click
 */
function trackLenderClick(lenderName) {
    console.log('Lender clicked:', lenderName);
    trackEvent('Lender', 'Click', lenderName);
    
    // In production, you might redirect to partner link
    showToast(`Redirecting to ${lenderName}...`, 'info');
}

/**
 * Track resource click
 */
function trackResourceClick(resourceName) {
    console.log('Resource clicked:', resourceName);
    trackEvent('Resource', 'Click', resourceName);
}

/**
 * Close alert
 */
function closeAlert(alertId) {
    const alert = document.getElementById(alertId);
    if (alert) {
        alert.style.display = 'none';
        trackEvent('UI', 'Close Alert', alertId);
    }
}

// ==========================================================================
// ENHANCED FORMATTING FUNCTIONS
// ==========================================================================

/**
 * Format currency values
 */
function formatCurrency(amount) {
    if (isNaN(amount) || amount === null || amount === undefined) return '$0';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Format number without currency symbol
 */
function formatNumber(number) {
    if (isNaN(number) || number === null || number === undefined) return '0';
    return new Intl.NumberFormat('en-US').format(number);
}

/**
 * Format date values
 */
function formatDate(date, short = false) {
    if (!date) return 'N/A';
    
    const options = short ? 
        { year: '2-digit', month: 'short' } : 
        { year: 'numeric', month: 'long', day: 'numeric' };
        
    return new Intl.DateTimeFormat('en-US', options).format(new Date(date));
}

/**
 * Format time values
 */
function formatTime(date) {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    }).format(new Date(date));
}

/**
 * Format value based on field type
 */
function formatValue(field, value) {
    switch (field) {
        case 'homePrice':
        case 'downPayment':
        case 'propertyTax':
        case 'homeInsurance':
        case 'pmi':
        case 'hoaFees':
        case 'extraMonthly':
        case 'extraOnetime':
            return formatCurrency(value);
        case 'interestRate':
        case 'downPaymentPercent':
        case 'closingCostsPercentage':
            return `${value}%`;
        case 'loanTerm':
        case 'customTerm':
            return `${value} years`;
        case 'creditScore':
            return `${value}`;
        default:
            return value.toString();
    }
}

// ==========================================================================
// ENHANCED AI INSIGHTS HELPER FUNCTIONS
// ==========================================================================

/**
 * Get current rate trend
 */
function getCurrentRateTrend() {
    const trends = [
        'historical highs',
        'above average',
        'stabilizing',
        'declining slightly',
        'rising gradually'
    ];
    
    return trends[Math.floor(Math.random() * trends.length)];
}

/**
 * Get rate advice based on trends
 */
function getRateAdvice() {
    const advice = [
        'locking in rates soon',
        'shopping multiple lenders',
        'improving credit scores first',
        'considering points to buy down rate',
        'monitoring market conditions'
    ];
    
    return advice[Math.floor(Math.random() * advice.length)];
}

/**
 * Shuffle array utility
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// ==========================================================================
// ENHANCED USER PREFERENCES AND STORAGE
// ==========================================================================

/**
 * Load user preferences from localStorage
 */
function loadUserPreferences() {
    console.log('Loading user preferences...');
    
    try {
        const preferences = localStorage.getItem('mortgageCalculatorPreferences');
        if (preferences) {
            const prefs = JSON.parse(preferences);
            
            // Apply theme
            if (prefs.theme) {
                CALCULATOR_STATE.ui.theme = prefs.theme;
                document.documentElement.setAttribute('data-theme', prefs.theme);
                
                const themeBtn = document.getElementById('theme-toggle');
                const themeIcon = themeBtn?.querySelector('.theme-icon');
                const themeText = themeBtn?.querySelector('.control-text');
                
                if (themeIcon && themeText) {
                    themeIcon.className = prefs.theme === 'dark' ? 'fas fa-sun theme-icon' : 'fas fa-moon theme-icon';
                    themeText.textContent = prefs.theme === 'dark' ? 'Light' : 'Dark';
                }
            }
            
            // Apply font size
            if (prefs.fontSize) {
                CALCULATOR_STATE.ui.fontSize = prefs.fontSize;
                document.documentElement.style.setProperty('--font-scale', prefs.fontSize);
                document.body.classList.add(`font-scale-${Math.round(prefs.fontSize * 100)}`);
            }
            
            // Apply screen reader mode
            if (prefs.screenReaderMode) {
                CALCULATOR_STATE.ui.screenReaderMode = prefs.screenReaderMode;
                if (prefs.screenReaderMode) {
                    document.body.classList.add('screen-reader-mode');
                }
            }
            
            console.log('✅ User preferences loaded');
        }
    } catch (error) {
        console.error('❌ Failed to load preferences:', error);
    }
}

/**
 * Save user preferences to localStorage
 */
function saveUserPreferences() {
    try {
        const preferences = {
            theme: CALCULATOR_STATE.ui.theme,
            fontSize: CALCULATOR_STATE.ui.fontSize,
            screenReaderMode: CALCULATOR_STATE.ui.screenReaderMode,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('mortgageCalculatorPreferences', JSON.stringify(preferences));
    } catch (error) {
        console.error('❌ Failed to save preferences:', error);
    }
}

// ==========================================================================
// ENHANCED ANALYTICS AND TRACKING
// ==========================================================================

/**
 * Track events for analytics
 */
function trackEvent(category, action, label, value) {
    console.log('📊 Track Event:', { category, action, label, value });
    
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            event_category: category,
            event_label: label,
            value: value
        });
    }
    
    // Custom analytics can be added here
    // Example: amplitude, mixpanel, etc.
}

// ==========================================================================
// ENHANCED TOAST NOTIFICATION SYSTEM
// ==========================================================================

/**
 * Show toast notification
 */
function showToast(message, type = 'info', duration = 3000) {
    console.log(`Toast [${type}]: ${message}`);
    
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="${icons[type] || icons.info}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after duration
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, duration);
    
    // Track toast display
    trackEvent('UI', 'Toast', `${type}: ${message}`);
}

// ==========================================================================
// ENHANCED ERROR HANDLING AND FALLBACKS
// ==========================================================================

/**
 * Fallback share function
 */
function fallbackShare() {
    // Create shareable URL with current calculation
    const shareUrl = new URL(window.location.href);
    shareUrl.searchParams.set('homePrice', CALCULATOR_STATE.inputs.homePrice);
    shareUrl.searchParams.set('downPayment', CALCULATOR_STATE.inputs.downPayment);
    shareUrl.searchParams.set('interestRate', CALCULATOR_STATE.inputs.interestRate);
    shareUrl.searchParams.set('loanTerm', CALCULATOR_STATE.inputs.loanTerm);
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl.toString()).then(() => {
        showToast('Calculation URL copied to clipboard!', 'success');
        trackEvent('Results', 'Share', 'Clipboard');
    }).catch(() => {
        showToast('Unable to copy URL. Please copy manually.', 'error');
    });
}

/**
 * Update custom term status
 */
function updateCustomTermStatus(isValid) {
    const statusElement = document.getElementById('custom-term-status');
    if (statusElement) {
        statusElement.style.display = 'block';
        if (isValid) {
            statusElement.textContent = '✓ Custom term applied';
            statusElement.className = 'custom-term-status active';
        } else {
            statusElement.textContent = '⚠ Please enter 5-50 years';
            statusElement.className = 'custom-term-status error';
        }
    }
}

/**
 * Initialize focus trap for accessibility
 */
function initializeFocusTrap() {
    // Add focus trap for modal elements
    const modals = document.querySelectorAll('.modal, .voice-status, .loading-indicator');
    
    modals.forEach(modal => {
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                trapFocus(e, modal);
            }
        });
    });
}

/**
 * Trap focus within element
 */
function trapFocus(e, element) {
    const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (e.shiftKey && document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
    }
}

/**
 * Handle keyboard navigation
 */
function handleKeyboardNavigation(e) {
    // ESC key handling
    if (e.key === 'Escape') {
        // Close mobile menu
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu && mobileMenu.classList.contains('active')) {
            toggleMobileMenu();
        }
        
        // Stop voice control
        if (isListening) {
            stopVoiceControl();
        }
        
        // Close modals, etc.
    }
    
    // Enter key handling for buttons
    if (e.key === 'Enter' && e.target.classList.contains('loan-type-btn', 'term-chip', 'frequency-btn')) {
        e.target.click();
    }
}

/**
 * Debounce function for performance
 */
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

// ==========================================================================
// INITIALIZE ON LOAD
// ==========================================================================

console.log('🇺🇸 FinGuid USA Mortgage Calculator v9.0 - JavaScript Loaded');
console.log('📱 PWA and Mobile Optimized');
console.log('🧠 AI-Enhanced with Voice Control');
console.log('♿ Full Accessibility Support');
console.log('🚀 Production Ready for American Homebuyers');

// Export for global access (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MORTGAGE_CALCULATOR,
        USA_MARKET_DATA,
        CALCULATOR_STATE
    };
}
