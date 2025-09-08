// ===== CONFIGURATION SETTINGS =====
// USA Financial Calculators - Application Configuration
// Version: 2.0.0

'use strict';

// Main application configuration
const CONFIG = {
    // Application metadata
    app: {
        name: 'USA Financial Calculators',
        version: '2.0.0',
        description: 'AI-Enhanced Financial Calculator Platform',
        author: 'Finguid Team',
        website: 'https://www.finguid.com',
        supportEmail: 'support@finguid.com',
        contactEmail: 'hello@finguid.com'
    },

    // API Configuration
    api: {
        baseUrl: 'https://api.finguid.com/v1',
        emailEndpoint: 'https://api.finguid.com/v1/send-email',
        analyticsEndpoint: 'https://api.finguid.com/v1/analytics',
        feedbackEndpoint: 'https://api.finguid.com/v1/feedback',
        
        // Backup/Fallback services
        fallback: {
            emailService: 'https://formspree.io/f/xoqgrjzq', // Replace with your Formspree ID
            contactForm: 'https://formspree.io/f/xoqgrjzr'   // Replace with your Formspree ID
        },

        // API timeouts (in milliseconds)
        timeout: {
            default: 10000,  // 10 seconds
            email: 30000,    // 30 seconds
            upload: 60000    // 1 minute
        }
    },

    // Analytics & Tracking
    analytics: {
        googleAnalytics: {
            enabled: true,
            trackingId: 'GA_MEASUREMENT_ID', // Replace with your GA4 Measurement ID
            config: {
                page_title: 'USA Financial Calculators',
                custom_map: {
                    'calculator_type': 'custom_parameter_1'
                }
            }
        },
        
        hotjar: {
            enabled: false, // Enable when you have Hotjar account
            siteId: 'YOUR_HOTJAR_SITE_ID'
        },
        
        customEvents: {
            calculationCompleted: 'calculation_completed',
            emailSent: 'email_sent',
            calculatorOpened: 'calculator_opened',
            errorOccurred: 'error_occurred'
        }
    },

    // Feature flags
    features: {
        aiInsights: true,
        emailResults: true,
        offlineMode: true,
        pwaInstall: true,
        socialSharing: true,
        calculatorHistory: true,
        exportToPDF: false, // Disabled until PDF service is implemented
        voiceInput: false,  // Future feature
        liveChat: false,    // Future feature
        multiLanguage: false, // Future feature
        darkMode: true,
        currencyFormatter: true,
        stateDataUpdate: true,
        marketDataSync: false // Future feature for real-time rates
    },

    // User interface settings
    ui: {
        theme: {
            default: 'light', // 'light', 'dark', or 'auto'
            allowUserToggle: true,
            persistPreference: true
        },
        
        animation: {
            enabled: true,
            duration: 250, // milliseconds
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
        },
        
        toast: {
            duration: 4000,
            position: 'top-right' // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
        },

        accessibility: {
            highContrast: false,
            largeText: false,
            reducedMotion: false,
            screenReaderAnnouncements: true
        }
    },

    // Storage configuration
    storage: {
        localStorage: {
            prefix: 'finguid_',
            keys: {
                calculationHistory: 'calculation_history',
                lastCalculation: 'last_calculation',
                userPreferences: 'user_preferences',
                theme: 'theme_preference',
                installPromptDismissed: 'install_prompt_dismissed'
            },
            maxHistoryItems: 10,
            expirationDays: 30
        },
        
        sessionStorage: {
            prefix: 'finguid_session_',
            keys: {
                currentCalculation: 'current_calculation',
                formData: 'form_data',
                scrollPosition: 'scroll_position'
            }
        }
    },

    // Email configuration
    email: {
        from: {
            name: 'Finguid Financial Calculators',
            address: 'noreply@finguid.com'
        },
        
        templates: {
            calculationResults: 'calculation-results',
            newsletter: 'newsletter-signup',
            contact: 'contact-form',
            feedback: 'user-feedback'
        },
        
        subjectPrefixes: {
            'mortgage-calculator': 'Your Mortgage Calculator Results',
            'auto-loan-calculator': 'Your Auto Loan Calculator Results',
            'investment-calculator': 'Your Investment Calculator Results',
            'credit-card-calculator': 'Your Credit Card Calculator Results',
            'retirement-calculator': 'Your Retirement Calculator Results',
            'refinance-calculator': 'Your Refinance Calculator Results'
        }
    },

    // Calculator-specific settings
    calculators: {
        // Default values and limits
        defaults: {
            mortgage: {
                interestRate: 7.2,
                loanTerm: 30,
                downPaymentPercent: 20,
                pmiRate: 0.5 // 0.5% annually
            },
            
            auto: {
                interestRate: 5.8,
                loanTerm: 60,
                downPaymentPercent: 15
            },
            
            investment: {
                expectedReturn: 8.0,
                inflationRate: 2.5,
                taxRate: 20
            },
            
            creditCard: {
                apr: 24.8,
                minimumPaymentPercent: 2.5
            },
            
            retirement: {
                expectedReturn: 7.0,
                salaryIncreaseRate: 2.5,
                replacementRatio: 80
            }
        },
        
        // Input validation limits
        limits: {
            mortgage: {
                homePrice: { min: 50000, max: 10000000 },
                downPayment: { min: 0, max: 5000000 },
                interestRate: { min: 0.1, max: 20 },
                loanTerm: { min: 5, max: 50 }
            },
            
            auto: {
                vehiclePrice: { min: 5000, max: 500000 },
                downPayment: { min: 0, max: 250000 },
                interestRate: { min: 0.1, max: 25 },
                loanTerm: { min: 12, max: 96 }
            },
            
            investment: {
                initialAmount: { min: 0, max: 10000000 },
                monthlyContribution: { min: 0, max: 100000 },
                expectedReturn: { min: -10, max: 30 },
                investmentPeriod: { min: 1, max: 50 }
            }
        }
    },

    // State-specific data update settings
    stateData: {
        // URLs for automatic data updates (future feature)
        sources: {
            propertyTaxRates: 'https://api.finguid.com/v1/data/property-tax-rates',
            salesTaxRates: 'https://api.finguid.com/v1/data/sales-tax-rates',
            insuranceRates: 'https://api.finguid.com/v1/data/insurance-rates',
            currentRates: 'https://api.finguid.com/v1/data/current-rates'
        },
        
        updateFrequency: {
            taxRates: 'quarterly',      // Update quarterly
            insuranceRates: 'annually', // Update annually
            interestRates: 'daily'      // Update daily (future feature)
        },
        
        lastUpdated: {
            propertyTaxRates: '2024-12-01',
            salesTaxRates: '2024-12-01',
            insuranceRates: '2024-12-01',
            currentRates: '2025-01-09'
        }
    },

    // SEO Configuration
    seo: {
        siteName: 'USA Financial Calculators | Finguid',
        defaultTitle: 'USA Financial Calculators - AI Enhanced Tools | Finguid',
        defaultDescription: 'Free AI-enhanced financial calculators for mortgage, auto loans, investments, credit cards, insurance, and taxes. Get accurate results with state-specific data and AI insights.',
        defaultKeywords: 'financial calculator, mortgage calculator, auto loan calculator, investment calculator, credit card calculator, AI financial tools, USA financial planning, retirement calculator',
        
        openGraph: {
            siteName: 'Finguid Financial Calculators',
            type: 'website',
            imageUrl: 'https://www.finguid.com/images/og-image.jpg',
            imageAlt: 'USA Financial Calculators - AI Enhanced Tools'
        },
        
        twitter: {
            site: '@finguid',
            creator: '@finguid',
            cardType: 'summary_large_image'
        },
        
        structuredData: {
            organization: {
                '@type': 'Organization',
                name: 'Finguid',
                url: 'https://www.finguid.com',
                logo: 'https://www.finguid.com/images/logo.png',
                contactPoint: {
                    '@type': 'ContactPoint',
                    telephone: '+1-800-FINGUID',
                    contactType: 'Customer Service'
                }
            }
        }
    },

    // Performance settings
    performance: {
        // Critical metrics targets
        coreWebVitals: {
            LCP: 2.5,    // Largest Contentful Paint (seconds)
            FID: 100,    // First Input Delay (milliseconds)
            CLS: 0.1,    // Cumulative Layout Shift
            INP: 200     // Interaction to Next Paint (milliseconds)
        },
        
        // Resource optimization
        optimization: {
            enableCompression: true,
            enableCaching: true,
            lazyLoadImages: true,
            preloadCriticalResources: true,
            minifyAssets: true
        },
        
        // Monitoring thresholds
        monitoring: {
            slowCalculationThreshold: 2000,    // 2 seconds
            errorRateThreshold: 0.05,          // 5%
            bounceRateThreshold: 0.5           // 50%
        }
    },

    // Security settings
    security: {
        // Content Security Policy
        csp: {
            enabled: true,
            reportOnly: false,
            directives: {
                'default-src': ["'self'"],
                'script-src': ["'self'", "'unsafe-inline'", 'https://www.googletagmanager.com', 'https://www.google-analytics.com'],
                'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
                'font-src': ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
                'img-src': ["'self'", 'data:', 'https:'],
                'connect-src': ["'self'", 'https://api.finguid.com', 'https://www.google-analytics.com']
            }
        },
        
        // Rate limiting (for future API implementation)
        rateLimiting: {
            enabled: false,
            requestsPerMinute: 60,
            requestsPerHour: 1000
        },
        
        // Input validation
        inputValidation: {
            strictMode: true,
            sanitizeInputs: true,
            maxInputLength: 1000
        }
    },

    // Development settings
    development: {
        debug: {
            enabled: false, // Set to true for development
            level: 'info',  // 'error', 'warn', 'info', 'debug'
            showCalculationSteps: false,
            showPerformanceMetrics: false
        },
        
        testing: {
            enableTestMode: false,
            mockApiResponses: false,
            skipValidation: false
        }
    },

    // Error handling
    errorHandling: {
        captureErrors: true,
        reportToConsole: true,
        showUserFriendlyMessages: true,
        
        // Error categories
        errorTypes: {
            CALCULATION_ERROR: 'calculation_error',
            VALIDATION_ERROR: 'validation_error',
            API_ERROR: 'api_error',
            NETWORK_ERROR: 'network_error',
            UI_ERROR: 'ui_error'
        },
        
        // Fallback behaviors
        fallbacks: {
            enableOfflineMode: true,
            showCachedResults: true,
            gracefulDegradation: true
        }
    },

    // Internationalization (future feature)
    i18n: {
        enabled: false,
        defaultLocale: 'en-US',
        supportedLocales: ['en-US'],
        currencyLocale: 'en-US',
        dateLocale: 'en-US'
    },

    // PWA settings
    pwa: {
        enabled: true,
        scope: '/',
        startUrl: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        themeColor: '#2196f3',
        backgroundColor: '#ffffff',
        
        caching: {
            strategy: 'cacheFirst',
            cacheName: 'finguid-calculators-v2',
            maxAge: 86400000, // 24 hours in milliseconds
            maxEntries: 100
        },
        
        installPrompt: {
            enabled: true,
            showAfterPageViews: 3,
            showAfterMinutes: 5,
            dismissForDays: 7
        }
    },

    // Social sharing
    socialSharing: {
        platforms: ['twitter', 'facebook', 'linkedin', 'email'],
        shareText: 'Check out these free AI-enhanced financial calculators: {url}',
        hashtags: ['financial', 'calculator', 'planning', 'finance']
    }
};

// Environment-specific overrides
const ENVIRONMENT = {
    development: {
        debug: {
            enabled: true,
            level: 'debug',
            showCalculationSteps: true,
            showPerformanceMetrics: true
        },
        analytics: {
            googleAnalytics: {
                enabled: false
            }
        },
        api: {
            baseUrl: 'http://localhost:3000/api/v1'
        }
    },
    
    staging: {
        debug: {
            enabled: true,
            level: 'info'
        },
        api: {
            baseUrl: 'https://staging-api.finguid.com/v1'
        },
        analytics: {
            googleAnalytics: {
                trackingId: 'GA_STAGING_MEASUREMENT_ID'
            }
        }
    },
    
    production: {
        debug: {
            enabled: false,
            level: 'error'
        },
        security: {
            csp: {
                reportOnly: false
            },
            rateLimiting: {
                enabled: true
            }
        }
    }
};

// Get current environment
function getCurrentEnvironment() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'development';
    } else if (window.location.hostname.includes('staging') || window.location.hostname.includes('preview')) {
        return 'staging';
    } else {
        return 'production';
    }
}

// Merge configuration with environment-specific settings
function getConfig() {
    const currentEnv = getCurrentEnvironment();
    const envConfig = ENVIRONMENT[currentEnv] || {};
    
    // Deep merge configuration
    return deepMerge(CONFIG, envConfig);
}

// Deep merge utility function
function deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
    }
    
    return result;
}

// Export configuration
const AppConfig = getConfig();

// Make configuration available globally
if (typeof window !== 'undefined') {
    window.AppConfig = AppConfig;
}

// Utility functions for configuration access
const ConfigUtils = {
    // Get nested configuration value
    get: function(path, defaultValue = null) {
        const keys = path.split('.');
        let value = AppConfig;
        
        for (const key of keys) {
            if (value && value.hasOwnProperty(key)) {
                value = value[key];
            } else {
                return defaultValue;
            }
        }
        
        return value;
    },
    
    // Check if feature is enabled
    isFeatureEnabled: function(feature) {
        return this.get(`features.${feature}`, false);
    },
    
    // Get API endpoint
    getApiEndpoint: function(endpoint) {
        const baseUrl = this.get('api.baseUrl', '');
        return `${baseUrl}/${endpoint}`.replace(/\/+/g, '/');
    },
    
    // Get storage key with prefix
    getStorageKey: function(key) {
        const prefix = this.get('storage.localStorage.prefix', '');
        return `${prefix}${key}`;
    },
    
    // Get calculator default value
    getCalculatorDefault: function(calculator, field) {
        return this.get(`calculators.defaults.${calculator}.${field}`, null);
    },
    
    // Get calculator limits
    getCalculatorLimits: function(calculator, field) {
        return this.get(`calculators.limits.${calculator}.${field}`, null);
    },
    
    // Check if in debug mode
    isDebugMode: function() {
        return this.get('development.debug.enabled', false);
    },
    
    // Get error configuration
    getErrorConfig: function() {
        return this.get('errorHandling', {});
    },
    
    // Get performance thresholds
    getPerformanceThresholds: function() {
        return this.get('performance.monitoring', {});
    }
};

// Make utilities available globally
if (typeof window !== 'undefined') {
    window.ConfigUtils = ConfigUtils;
}

// Console welcome message in development
if (ConfigUtils.isDebugMode()) {
    console.log(`
    🧮 USA Financial Calculators v${AppConfig.app.version}
    🌐 Environment: ${getCurrentEnvironment()}
    🔧 Debug Mode: ${ConfigUtils.isDebugMode() ? 'ON' : 'OFF'}
    🤖 AI Insights: ${ConfigUtils.isFeatureEnabled('aiInsights') ? 'ON' : 'OFF'}
    📧 Email Results: ${ConfigUtils.isFeatureEnabled('emailResults') ? 'ON' : 'OFF'}
    📱 PWA Mode: ${ConfigUtils.isFeatureEnabled('pwaInstall') ? 'ON' : 'OFF'}
    
    Built with ❤️ by the Finguid team
    `);
}

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AppConfig, ConfigUtils };
}