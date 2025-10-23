/**
 * FinGuid AI Mortgage Calculator - Core JavaScript
 * Handles calculation, FRED API integration, UI/UX features, and PWA setup.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize PWA, Voice, and Footer Year
    registerServiceWorker();
    initVoiceCommand();
    document.getElementById('year').textContent = new Date().getFullYear();

    const form = document.getElementById('mortgage-form');
    const resultBox = document.getElementById('results');
    const monthlyPaymentEl = document.getElementById('monthly-payment');
    const summaryEl = document.getElementById('loan-summary');
    const aiRecommendationEl = document.getElementById('ai-recommendation');

    // 2. Event Listeners
    form.addEventListener('submit', handleCalculation);
    document.getElementById('mode-toggle').addEventListener('click', toggleDarkMode);
    document.getElementById('tts-btn').addEventListener('click', toggleTextToSpeech);
    document.getElementById('voice-command-btn').addEventListener('click', startVoiceCommand);


    /**
     * CORE CALCULATION LOGIC
     */
    function handleCalculation(event) {
        event.preventDefault();

        // 1. Get input values
        const price = parseFloat(document.getElementById('price').value);
        const downPayment = parseFloat(document.getElementById('down-payment').value);
        const annualRate = parseFloat(document.getElementById('rate').value);
        const termYears = parseFloat(document.getElementById('term').value);

        // Validation
        if (isNaN(price) || isNaN(downPayment) || isNaN(annualRate) || price <= 0 || price < downPayment) {
            alert('Please enter valid, realistic numbers for the calculation.');
            return;
        }

        // 2. Calculate Loan Details
        const loanAmount = price - downPayment;
        const monthlyRate = (annualRate / 100) / 12;
        const totalMonths = termYears * 12;

        let monthlyPayment = 0;

        if (annualRate > 0) {
            // Standard Mortgage Formula (M = P [ i(1 + i)^n ] / [ (1 + i)^n – 1 ])
            const numerator = loanAmount * monthlyRate * Math.pow((1 + monthlyRate), totalMonths);
            const denominator = Math.pow((1 + monthlyRate), totalMonths) - 1;
            monthlyPayment = numerator / denominator;
        } else {
            // Special case: 0% interest (rare, but mathematically required)
            monthlyPayment = loanAmount / totalMonths;
        }

        // 3. Display Results
        const paymentFormatted = monthlyPayment.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        
        monthlyPaymentEl.textContent = paymentFormatted;
        summaryEl.innerHTML = `
            <p><strong>Loan Amount:</strong> $${loanAmount.toLocaleString('en-US')}</p>
            <p><strong>Total Payments:</strong> ${totalMonths} months</p>
            <p><strong>Rate:</strong> ${annualRate}%</p>
        `;
        resultBox.classList.remove('hidden');

        // 4. Trigger AI/Monetization Analysis
        getAIRecommendation({ loanAmount, monthlyPayment, price, annualRate });
    }

    /**
     * AI FRIENDLY & MONETIZATION LOGIC (The Core of the "AI Calculator")
     * This function analyzes the result and generates personalized recommendations for affiliate income.
     */
    function getAIRecommendation(loanDetails) {
        aiRecommendationEl.classList.remove('hidden');
        let aiContent = '';

        // Rule 1: High Loan Amount (Suggest Refinance/Insurance/High-Value Partner)
        if (loanDetails.loanAmount > 450000) {
            aiContent += `<div class="ai-tip">🏦 **AI Tip:** Considering your large loan amount, a top-tier mortgage broker could save you thousands. <a href="/affiliate-link-high-value" target="_blank" class="ai-link">Compare Top American Lenders Now</a>.</div>`;
        }

        // Rule 2: Low Down Payment (Suggest First-time Buyer/Low-DP Partner)
        if ((loanDetails.price * 0.20) > loanDetails.downPayment) {
             aiContent += `<div class="ai-tip">💰 **AI Tip:** You might need Private Mortgage Insurance (PMI). We recommend lenders with the best PMI rates. <a href="/affiliate-link-pmi" target="_blank" class="ai-link">Check PMI Options</a>.</div>`;
        }

        // Rule 3: High Monthly Payment (Suggest Longer Term/Budgeting App Partner)
        if (loanDetails.monthlyPayment > 2500) {
            aiContent += `<div class="ai-tip">💸 **AI Tip:** A payment over $2,500/month impacts cash flow. Optimize your budget with our partner budgeting app. <a href="/affiliate-link-budget" target="_blank" class="ai-link">Start Budgeting for Your Home</a>.</div>`;
        }
        
        // Default call-to-action (General Sponsor/Ad slot)
        if (aiContent === '') {
            aiContent += `<div class="ai-tip">🤝 **Sponsor Spotlight:** Today's featured American moving service offers 10% off for FinGuid users! <a href="/sponsor-link-moving" target="_blank" class="ai-link">Claim Offer</a>.</div>`;
        }


        document.getElementById('ai-content').innerHTML = aiContent;
        // This structure is easily updated to call a true server-side AI model later.
    }


    /**
     * ADVANCED FEATURES LOGIC
     */

    // Dark Mode / Light Mode Toggle
    function toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        // Save preference for persistence (SEO/UX best practice)
        localStorage.setItem('mode', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    }
    // Apply saved mode on load
    if (localStorage.getItem('mode') === 'dark') {
        document.body.classList.add('dark-mode');
    }

    // Text-to-Speech (TTS) Logic
    let isTtsEnabled = false;
    function toggleTextToSpeech() {
        isTtsEnabled = !isTtsEnabled;
        const button = document.getElementById('tts-btn');
        if (isTtsEnabled) {
            button.textContent = '🔇 TTS Enabled';
            button.style.backgroundColor = '#28a745'; // Green
            speakResult();
        } else {
            button.textContent = '🗣️ Read Results';
            button.style.backgroundColor = '#6c757d'; // Gray
            window.speechSynthesis.cancel();
        }
    }

    function speakResult() {
        if (!isTtsEnabled || resultBox.classList.contains('hidden')) return;

        const paymentText = monthlyPaymentEl.textContent;
        const ttsMessage = new SpeechSynthesisUtterance(`Your calculated monthly mortgage payment is ${paymentText}.`);
        // Use American English voice
        ttsMessage.lang = 'en-US';
        window.speechSynthesis.speak(ttsMessage);
    }

    // Voice Command Placeholder (Requires Web Speech API / Browser support)
    function initVoiceCommand() {
        // Simple check for browser compatibility
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            document.getElementById('voice-command-btn').disabled = true;
            document.getElementById('voice-command-btn').textContent = '🎙️ Not Supported';
        }
        // Full voice command logic (e.g., "Set price to 400,000") is complex and omitted for brevity.
    }

    function startVoiceCommand() {
        alert("🎙️ Voice Command feature initiated. Speak your inputs (e.g., 'Home price 350,000'). This requires full implementation of the Web Speech API.");
        // **TODO:** Implement the full SpeechRecognition API logic here.
    }


    /**
     * FRED API INTEGRATION (For Live Interest Rate)
     * NOTE: For production, this MUST be done via a secure backend/proxy 
     * to prevent exposing the API key to the client-side.
     */
    function fetchLiveRate() {
        // DO NOT DISCLOSE THE KEY DIRECTLY IN LIVE CLIENT-SIDE CODE. 
        // Use a backend service to proxy this request securely.
        const FRED_API_KEY = '9c6c421f077f2091e8bae4f143ada59a'; // User provided key (Secure via backend)
        const FRED_SERIES_ID = 'MORTGAGE30US'; // 30-Year Fixed Rate Mortgage Average

        console.log("Attempting to fetch live rate from FRED API...");

        // Placeholder for secure AJAX call (e.g., via a Lambda function or Node backend)
        const secureEndpoint = `/api/fred/rate?series=${FRED_SERIES_ID}`; 
        
        // Simulating the fetch call:
        // fetch(secureEndpoint) 
        //     .then(response => response.json())
        //     .then(data => {
        //         const latestRate = data.latest_value; 
        //         document.getElementById('rate').value = latestRate;
        //         document.getElementById('rate-source').textContent = `Rate updated from FRED® API: ${new Date().toLocaleDateString()}`;
        //         handleCalculation(new Event('submit')); // Recalculate with new rate
        //     })
        //     .catch(error => {
        //         console.error('Error fetching FRED rate:', error);
        //         document.getElementById('rate-source').textContent = 'Could not fetch live rate. Using default.';
        //     });
        
        // For demonstration, just logging the request structure:
        document.getElementById('rate-source').innerHTML = `<strong>FRED API Structure Ready:</strong> Implement backend proxy to use key/series.`;
    }

    /**
     * PWA - Progressive Web App Registration
     */
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js')
                    .then(reg => console.log('Service Worker registered for PWA:', reg.scope))
                    .catch(err => console.error('Service Worker registration failed:', err));
            });
        }
    }

    // Initial calculation on load for a good UX
    handleCalculation(new Event('submit'));
});
