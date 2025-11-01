
// ============================================
// SOLID Principles-Compliant Privacy System
// ============================================

// ============================================
// ABSTRACTION LAYER (Dependency Inversion)
// ============================================

/**
 * Cookie Storage Interface
 * Defines contract for cookie operations
 */
class ICookieStorage {
    setCookie(name, value, days) {
        throw new Error('setCookie() must be implemented');
    }

    getCookie(name) {
        throw new Error('getCookie() must be implemented');
    }

    deleteCookie(name) {
        throw new Error('deleteCookie() must be implemented');
    }
}

/**
 * DOM Manipulator Interface
 * Defines contract for DOM operations
 */
class IDOMManipulator {
    getElementById(id) {
        throw new Error('getElementById() must be implemented');
    }

    querySelector(selector) {
        throw new Error('querySelector() must be implemented');
    }

    querySelectorAll(selector) {
        throw new Error('querySelectorAll() must be implemented');
    }

    addEventListener(element, event, handler) {
        throw new Error('addEventListener() must be implemented');
    }
}

/**
 * Logger Interface
 * Defines contract for logging operations
 */
class ILogger {
    log(message) {
        throw new Error('log() must be implemented');
    }

    warn(message) {
        throw new Error('warn() must be implemented');
    }

    error(message) {
        throw new Error('error() must be implemented');
    }
}

// ============================================
// CONCRETE IMPLEMENTATIONS
// ============================================

/**
 * CookieStorageImpl - Single Responsibility: Cookie Management
 * Handles all cookie operations - only reason to change is if cookie API changes
 */
class CookieStorageImpl extends ICookieStorage {
    setCookie(name, value, days) {
        const expires = new Date();
        expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax;Secure`;
    }

    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i].trim();
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length);
        }
        return null;
    }

    deleteCookie(name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    }
}

/**
 * DOMManipulatorImpl - Single Responsibility: DOM Operations
 * Handles all DOM interactions - only reason to change is if DOM API changes
 */
class DOMManipulatorImpl extends IDOMManipulator {
    getElementById(id) {
        return document.getElementById(id);
    }

    querySelector(selector) {
        return document.querySelector(selector);
    }

    querySelectorAll(selector) {
        return document.querySelectorAll(selector);
    }

    addEventListener(element, event, handler) {
        if (element) {
            element.addEventListener(event, handler);
        }
    }

    setDisplay(element, display) {
        if (element) {
            element.style.display = display;
        }
    }

    addClass(element, className) {
        if (element) {
            element.classList.add(className);
        }
    }

    removeClass(element, className) {
        if (element) {
            element.classList.remove(className);
        }
    }
}

/**
 * ConsoleLoggerImpl - Single Responsibility: Logging
 * Handles console logging - only reason to change is if logging strategy changes
 */
class ConsoleLoggerImpl extends ILogger {
    log(message) {
        console.log(message);
    }

    warn(message) {
        console.warn(message);
    }

    error(message) {
        console.error(message);
    }
}

// ============================================
// CORE BUSINESS LOGIC (Segregated Interfaces)
// ============================================

/**
 * ConsentPreferences - Single Responsibility: Preference Data Model
 * Only manages consent preference structure
 */
class ConsentPreferences {
    constructor() {
        this.essential = true;
        this.analytics = false;
        this.advertising = false;
        this.timestamp = new Date().toISOString();
    }

    toJSON() {
        return {
            essential: this.essential,
            analytics: this.analytics,
            advertising: this.advertising,
            timestamp: this.timestamp
        };
    }

    static fromJSON(json) {
        const prefs = new ConsentPreferences();
        if (json) {
            prefs.essential = json.essential !== false;
            prefs.analytics = json.analytics === true;
            prefs.advertising = json.advertising === true;
            prefs.timestamp = json.timestamp || new Date().toISOString();
        }
        return prefs;
    }

    areAllAccepted() {
        return this.essential && this.analytics && this.advertising;
    }
}

/**
 * ConsentStorage - Single Responsibility: Persistence Layer
 * Only manages reading/writing consent to storage
 */
class ConsentStorage {
    constructor(cookieStorage, logger) {
        this.cookieStorage = cookieStorage;
        this.logger = logger;
        this.CONSENT_KEY = 'cookieConsent';
        this.CONSENT_DAYS = 365;
    }

    saveConsent(preferences) {
        try {
            this.cookieStorage.setCookie(
                this.CONSENT_KEY,
                JSON.stringify(preferences.toJSON()),
                this.CONSENT_DAYS
            );
            this.logger.log('Consent saved successfully');
        } catch (error) {
            this.logger.error(`Failed to save consent: ${error.message}`);
        }
    }

    loadConsent() {
        try {
            const consentJSON = this.cookieStorage.getCookie(this.CONSENT_KEY);
            if (consentJSON) {
                return ConsentPreferences.fromJSON(JSON.parse(consentJSON));
            }
            return null;
        } catch (error) {
            this.logger.error(`Failed to load consent: ${error.message}`);
            return null;
        }
    }

    hasConsent() {
        return this.loadConsent() !== null;
    }

    clearConsent() {
        this.cookieStorage.deleteCookie(this.CONSENT_KEY);
        this.logger.log('Consent cleared');
    }
}

/**
 * ScriptLoader - Single Responsibility: Script Loading
 * Only manages loading external scripts based on preferences
 */
class ScriptLoader {
    constructor(logger) {
        this.logger = logger;
    }

    loadAnalyticsScripts() {
        try {
            // Uncomment and customize when ready to use Google Analytics
            /*
            const script = document.createElement('script');
            script.async = true;
            script.src = 'https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID';
            document.head.appendChild(script);
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'GA_MEASUREMENT_ID');
            */
            this.logger.log('Analytics scripts ready to load');
        } catch (error) {
            this.logger.error(`Failed to load analytics scripts: ${error.message}`);
        }
    }

    loadAdvertisingScripts() {
        try {
            // Uncomment and customize when ready to use Google AdSense
            /*
            const script = document.createElement('script');
            script.async = true;
            script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX';
            script.crossOrigin = 'anonymous';
            document.head.appendChild(script);
            */
            this.logger.log('Advertising scripts ready to load');
        } catch (error) {
            this.logger.error(`Failed to load advertising scripts: ${error.message}`);
        }
    }

    loadScriptsByPreferences(preferences) {
        if (preferences.analytics) {
            this.loadAnalyticsScripts();
        }
        if (preferences.advertising) {
            this.loadAdvertisingScripts();
        }
    }
}

/**
 * UIRenderer - Single Responsibility: UI Rendering
 * Only manages showing/hiding UI elements
 */
class UIRenderer {
    constructor(domManipulator, logger) {
        this.domManipulator = domManipulator;
        this.logger = logger;
    }

    showBanner() {
        try {
            const banner = this.domManipulator.getElementById('cookieConsentBanner');
            this.domManipulator.addClass(banner, 'show');
        } catch (error) {
            this.logger.error(`Failed to show banner: ${error.message}`);
        }
    }

    hideBanner() {
        try {
            const banner = this.domManipulator.getElementById('cookieConsentBanner');
            this.domManipulator.removeClass(banner, 'show');
        } catch (error) {
            this.logger.error(`Failed to hide banner: ${error.message}`);
        }
    }

    openModal(modalId) {
        try {
            const modal = this.domManipulator.getElementById(modalId);
            this.domManipulator.setDisplay(modal, 'block');
        } catch (error) {
            this.logger.error(`Failed to open modal: ${error.message}`);
        }
    }

    closeModal(modalId) {
        try {
            const modal = this.domManipulator.getElementById(modalId);
            this.domManipulator.setDisplay(modal, 'none');
        } catch (error) {
            this.logger.error(`Failed to close modal: ${error.message}`);
        }
    }

    populateCheckboxes(preferences) {
        try {
            const analyticsCb = this.domManipulator.getElementById('analyticsCookies');
            const advertisingCb = this.domManipulator.getElementById('advertisingCookies');

            if (analyticsCb) analyticsCb.checked = preferences.analytics;
            if (advertisingCb) advertisingCb.checked = preferences.advertising;
        } catch (error) {
            this.logger.error(`Failed to populate checkboxes: ${error.message}`);
        }
    }

    getCheckboxPreferences() {
        const preferences = new ConsentPreferences();
        const analyticsCb = this.domManipulator.getElementById('analyticsCookies');
        const advertisingCb = this.domManipulator.getElementById('advertisingCookies');

        if (analyticsCb) preferences.analytics = analyticsCb.checked;
        if (advertisingCb) preferences.advertising = advertisingCb.checked;

        return preferences;
    }
}

/**
 * EventBinder - Single Responsibility: Event Binding
 * Only manages attaching event listeners
 */
class EventBinder {
    constructor(domManipulator, logger) {
        this.domManipulator = domManipulator;
        this.logger = logger;
    }

    bindBannerEvents(handlers) {
        try {
            this.domManipulator.addEventListener(
                this.domManipulator.getElementById('acceptAllCookies'),
                'click',
                handlers.onAcceptAll
            );

            this.domManipulator.addEventListener(
                this.domManipulator.getElementById('rejectCookies'),
                'click',
                handlers.onRejectNonEssential
            );

            this.domManipulator.addEventListener(
                this.domManipulator.getElementById('manageCookies'),
                'click',
                handlers.onManageCookies
            );
        } catch (error) {
            this.logger.error(`Failed to bind banner events: ${error.message}`);
        }
    }

    bindModalEvents(handlers) {
        try {
            this.domManipulator.addEventListener(
                this.domManipulator.getElementById('savePreferences'),
                'click',
                handlers.onSavePreferences
            );

            this.domManipulator.addEventListener(
                this.domManipulator.getElementById('cancelPreferences'),
                'click',
                handlers.onCancelPreferences
            );

            this.domManipulator.addEventListener(
                this.domManipulator.querySelector('.cookie-modal-close'),
                'click',
                handlers.onCancelPreferences
            );
        } catch (error) {
            this.logger.error(`Failed to bind modal events: ${error.message}`);
        }
    }

    bindCCPAEvents(handlers) {
        try {
            const ccpaLinks = this.domManipulator.querySelectorAll('a[href="#ccpa-rights"]');
            ccpaLinks.forEach(link => {
                this.domManipulator.addEventListener(link, 'click', handlers.onCCPAClick);
            });
        } catch (error) {
            this.logger.error(`Failed to bind CCPA events: ${error.message}`);
        }
    }

    bindAffiliateEvents(handlers) {
        try {
            const affiliateLinks = this.domManipulator.querySelectorAll(
                'a[href*="affiliate"], a[href*="ref="], a[href*="utm_"]'
            );
            affiliateLinks.forEach(link => {
                handlers.onAffiliateLinksFound(link);
            });
        } catch (error) {
            this.logger.error(`Failed to bind affiliate events: ${error.message}`);
        }
    }
}

/**
 * AffiliateDisclosureHandler - Single Responsibility: Affiliate Link Management
 * Only manages marking and processing affiliate links
 */
class AffiliateDisclosureHandler {
    constructor(domManipulator, logger) {
        this.domManipulator = domManipulator;
        this.logger = logger;
    }

    processAffiliateLinks() {
        try {
            const affiliateLinks = this.domManipulator.querySelectorAll(
                'a[href*="affiliate"], a[href*="ref="], a[href*="utm_"]'
            );

            affiliateLinks.forEach(link => {
                this.markAffiliateLink(link);
            });

            this.logger.log(`Processed ${affiliateLinks.length} affiliate links`);
        } catch (error) {
            this.logger.error(`Failed to process affiliate links: ${error.message}`);
        }
    }

    markAffiliateLink(link) {
        // Add required attributes for FTC compliance
        if (!link.hasAttribute('rel')) {
            link.setAttribute('rel', 'nofollow sponsored');
        }

        // Add visual indicator if not already present
        if (!link.querySelector('.affiliate-indicator')) {
            const indicator = document.createElement('sup');
            indicator.className = 'affiliate-indicator';
            indicator.textContent = '⚡';
            indicator.title = 'Affiliate Link - We may earn a commission';
            link.appendChild(indicator);
        }
    }
}

/**
 * CCPAHandler - Single Responsibility: CCPA Compliance
 * Only manages CCPA-specific operations
 */
class CCPAHandler {
    constructor(logger) {
        this.logger = logger;
        this.DO_NOT_SELL_KEY = 'ccpa_do_not_sell';
    }

    setDoNotSellPreference(value) {
        try {
            localStorage.setItem(this.DO_NOT_SELL_KEY, value.toString());
            this.logger.log(`CCPA Do Not Sell preference set to: ${value}`);
        } catch (error) {
            this.logger.error(`Failed to set CCPA preference: ${error.message}`);
        }
    }

    getDoNotSellPreference() {
        try {
            const preference = localStorage.getItem(this.DO_NOT_SELL_KEY);
            return preference === 'true';
        } catch (error) {
            this.logger.error(`Failed to get CCPA preference: ${error.message}`);
            return false;
        }
    }

    showOptOutDialog() {
        const optOut = confirm(
            'Do you want to opt-out of the sale of your personal information?\n\n' +
            'California residents have the right to opt-out of the sale of personal information under CCPA.\n\n' +
            'Click OK to opt-out, or Cancel to keep current settings.'
        );

        if (optOut) {
            this.setDoNotSellPreference(true);
            alert('Your preference has been saved. We will not sell your personal information.');
        }
    }
}

// ============================================
// MAIN APPLICATION ORCHESTRATOR
// ============================================

/**
 * PrivacyComplianceSystem - Orchestrator (Open/Closed: Extensible architecture)
 * Coordinates all components - only changes for adding new major features
 * Uses dependency injection for all dependencies
 */
class PrivacyComplianceSystem {
    constructor(dependencies = {}) {
        // Dependency Injection - inject all dependencies
        this.cookieStorage = dependencies.cookieStorage || new CookieStorageImpl();
        this.domManipulator = dependencies.domManipulator || new DOMManipulatorImpl();
        this.logger = dependencies.logger || new ConsoleLoggerImpl();

        // Initialize all specialized components
        this.consentStorage = new ConsentStorage(this.cookieStorage, this.logger);
        this.scriptLoader = new ScriptLoader(this.logger);
        this.uiRenderer = new UIRenderer(this.domManipulator, this.logger);
        this.eventBinder = new EventBinder(this.domManipulator, this.logger);
        this.affiliateHandler = new AffiliateDisclosureHandler(this.domManipulator, this.logger);
        this.ccpaHandler = new CCPAHandler(this.logger);

        this.logger.log('PrivacyComplianceSystem initialized');
    }

    initialize() {
        try {
            this.logger.log('Initializing Privacy Compliance System');

            // Load existing consent
            const existingConsent = this.consentStorage.loadConsent();

            if (existingConsent) {
                // User already has preferences - load scripts accordingly
                this.scriptLoader.loadScriptsByPreferences(existingConsent);
            } else {
                // New user - show consent banner
                this.uiRenderer.showBanner();
            }

            // Bind all events
            this.bindAllEvents();

            // Process affiliate links
            this.affiliateHandler.processAffiliateLinks();

            this.logger.log('Privacy Compliance System ready');
        } catch (error) {
            this.logger.error(`Initialization failed: ${error.message}`);
        }
    }

    bindAllEvents() {
        const bannerHandlers = {
            onAcceptAll: () => this.handleAcceptAll(),
            onRejectNonEssential: () => this.handleRejectNonEssential(),
            onManageCookies: () => this.handleManageCookies()
        };

        const modalHandlers = {
            onSavePreferences: () => this.handleSavePreferences(),
            onCancelPreferences: () => this.handleCancelPreferences()
        };

        const ccpaHandlers = {
            onCCPAClick: (e) => {
                e.preventDefault();
                this.ccpaHandler.showOptOutDialog();
            }
        };

        const affiliateHandlers = {
            onAffiliateLinksFound: (link) => {
                this.affiliateHandler.markAffiliateLink(link);
            }
        };

        this.eventBinder.bindBannerEvents(bannerHandlers);
        this.eventBinder.bindModalEvents(modalHandlers);
        this.eventBinder.bindCCPAEvents(ccpaHandlers);
        this.eventBinder.bindAffiliateEvents(affiliateHandlers);
    }

    handleAcceptAll() {
        const preferences = new ConsentPreferences();
        preferences.essential = true;
        preferences.analytics = true;
        preferences.advertising = true;

        this.consentStorage.saveConsent(preferences);
        this.uiRenderer.hideBanner();
        this.scriptLoader.loadScriptsByPreferences(preferences);
        this.logger.log('All cookies accepted');
    }

    handleRejectNonEssential() {
        const preferences = new ConsentPreferences();
        preferences.essential = true;
        preferences.analytics = false;
        preferences.advertising = false;

        this.consentStorage.saveConsent(preferences);
        this.uiRenderer.hideBanner();
        this.logger.log('Non-essential cookies rejected');
    }

    handleManageCookies() {
        const preferences = this.consentStorage.loadConsent() || new ConsentPreferences();
        this.uiRenderer.populateCheckboxes(preferences);
        this.uiRenderer.openModal('cookieSettingsModal');
    }

    handleSavePreferences() {
        const preferences = this.uiRenderer.getCheckboxPreferences();
        this.consentStorage.saveConsent(preferences);
        this.uiRenderer.closeModal('cookieSettingsModal');
        this.uiRenderer.hideBanner();
        this.scriptLoader.loadScriptsByPreferences(preferences);
        this.logger.log('Preferences saved');
    }

    handleCancelPreferences() {
        this.uiRenderer.closeModal('cookieSettingsModal');
    }
}

// ============================================
// INITIALIZATION ON PAGE LOAD
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Create and initialize the privacy compliance system with dependency injection
    // This allows easy testing and extension
    window.privacySystem = new PrivacyComplianceSystem();
    window.privacySystem.initialize();
});
