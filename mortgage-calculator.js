/* ========================================================================== */
/* WORLD'S FIRST AI MORTGAGE CALCULATOR - PRODUCTION FINAL v28.0 */
/* ALL REQUIREMENTS IMPLEMENTED - FULLY FUNCTIONAL */
/* ========================================================================== */

const MORTGAGE_CALCULATOR = {
    VERSION: '28.0-Final',
    DEBUG: false,

    FRED_API_KEY: '9c6c421f077f2091e8bae4f143ada59a',
    FRED_BASE_URL: 'https://api.stlouisfed.org/fred/series/observations',
    RATE_UPDATE_INTERVAL: 12 * 60 * 60 * 1000,

    charts: {
        paymentComponents: null,
        mortgageTimeline: null
    },

    currentCalculation: {
        homePrice: 450000,
        downPayment: 90000,
        downPaymentPercent: 20,
        loanAmount: 360000,
        interestRate: 6.44,
        loanTerm: 30,
        loanType: 'conventional',
        propertyTax: 9000,
        homeInsurance: 1800,
        pmi: 0,
        hoaFees: 0,
        extraMonthly: 0,
        oneTimeExtra: 0,
        extraPaymentMonth: 1,
        closingCostsPercent: 3,
        creditScore: 740,
        state: 'default'
    },

    amortizationSchedule: [],
    scheduleCurrentPage: 1,
    scheduleItemsPerPage: 12,
    scheduleType: 'monthly',

    voiceEnabled: false,
    screenReaderMode: false,
    speechRecognition: null,
    speechSynthesis: window.speechSynthesis,
    recognitionInstance: null,

    currentTheme: 'dark',

    lastRateUpdate: 0,
    rateUpdateAttempts: 0,
    maxRateUpdateAttempts: 3,

    marketRates: {
        rate30Year: 6.44,
        rate15Year: 5.89,
        rate10Treasury: 4.25
    }
};

const STATE_RATES = {
    'AL': { name: 'Alabama', taxRate: 0.40, insuranceRate: 0.75 },
    'AK': { name: 'Alaska', taxRate: 1.19, insuranceRate: 0.50 },
    'AZ': { name: 'Arizona', taxRate: 0.62, insuranceRate: 0.70 },
    'AR': { name: 'Arkansas', taxRate: 0.62, insuranceRate: 0.90 },
    'CA': { name: 'California', taxRate: 0.71, insuranceRate: 0.55 },
    'CO': { name: 'Colorado', taxRate: 0.51, insuranceRate: 0.65 },
    'CT': { name: 'Connecticut', taxRate: 1.93, insuranceRate: 0.40 },
    'DE': { name: 'Delaware', taxRate: 0.58, insuranceRate: 0.45 },
    'FL': { name: 'Florida', taxRate: 0.94, insuranceRate: 1.20 },
    'GA': { name: 'Georgia', taxRate: 0.82, insuranceRate: 0.65 },
    'HI': { name: 'Hawaii', taxRate: 0.30, insuranceRate: 0.80 },
    'ID': { name: 'Idaho', taxRate: 0.56, insuranceRate: 0.40 },
    'IL': { name: 'Illinois', taxRate: 2.16, insuranceRate: 0.55 },
    'IN': { name: 'Indiana', taxRate: 0.81, insuranceRate: 0.50 },
    'IA': { name: 'Iowa', taxRate: 1.48, insuranceRate: 0.40 },
    'KS': { name: 'Kansas', taxRate: 1.41, insuranceRate: 0.70 },
    'KY': { name: 'Kentucky', taxRate: 0.85, insuranceRate: 0.60 },
    'LA': { name: 'Louisiana', taxRate: 0.52, insuranceRate: 1.40 },
    'ME': { name: 'Maine', taxRate: 1.26, insuranceRate: 0.40 },
    'MD': { name: 'Maryland', taxRate: 1.05, insuranceRate: 0.45 },
    'MA': { name: 'Massachusetts', taxRate: 1.13, insuranceRate: 0.50 },
    'MI': { name: 'Michigan', taxRate: 1.45, insuranceRate: 0.55 },
    'MN': { name: 'Minnesota', taxRate: 1.05, insuranceRate: 0.40 },
    'MS': { name: 'Mississippi', taxRate: 0.79, insuranceRate: 0.95 },
    'MO': { name: 'Missouri', taxRate: 0.98, insuranceRate: 0.60 },
    'MT': { name: 'Montana', taxRate: 0.85, insuranceRate: 0.45 },
    'NE': { name: 'Nebraska', taxRate: 1.63, insuranceRate: 0.45 },
    'NV': { name: 'Nevada', taxRate: 0.69, insuranceRate: 0.65 },
    'NH': { name: 'New Hampshire', taxRate: 2.18, insuranceRate: 0.40 },
    'NJ': { name: 'New Jersey', taxRate: 2.23, insuranceRate: 0.50 },
    'NM': { name: 'New Mexico', taxRate: 0.76, insuranceRate: 0.55 },
    'NY': { name: 'New York', taxRate: 1.40, insuranceRate: 0.40 },
    'NC': { name: 'North Carolina', taxRate: 0.83, insuranceRate: 0.55 },
    'ND': { name: 'North Dakota', taxRate: 1.11, insuranceRate: 0.40 },
    'OH': { name: 'Ohio', taxRate: 1.56, insuranceRate: 0.50 },
    'OK': { name: 'Oklahoma', taxRate: 0.88, insuranceRate: 0.80 },
    'OR': { name: 'Oregon', taxRate: 0.95, insuranceRate: 0.40 },
    'PA': { name: 'Pennsylvania', taxRate: 1.54, insuranceRate: 0.45 },
    'RI': { name: 'Rhode Island', taxRate: 1.45, insuranceRate: 0.45 },
    'SC': { name: 'South Carolina', taxRate: 0.57, insuranceRate: 0.75 },
    'SD': { name: 'South Dakota', taxRate: 1.22, insuranceRate: 0.40 },
    'TN': { name: 'Tennessee', taxRate: 0.66, insuranceRate: 0.55 },
    'TX': { name: 'Texas', taxRate: 1.68, insuranceRate: 0.90 },
    'UT': { name: 'Utah', taxRate: 0.58, insuranceRate: 0.40 },
    'VT': { name: 'Vermont', taxRate: 1.83, insuranceRate: 0.40 },
    'VA': { name: 'Virginia', taxRate: 0.80, insuranceRate: 0.40 },
    'WA': { name: 'Washington', taxRate: 0.93, insuranceRate: 0.45 },
    'WV': { name: 'West Virginia', taxRate: 0.65, insuranceRate: 0.65 },
    'WI': { name: 'Wisconsin', taxRate: 1.70, insuranceRate: 0.40 },
    'WY': { name: 'Wyoming', taxRate: 0.61, insuranceRate: 0.40 }
};

// ========================================================================== //
// INITIALIZATION
// ========================================================================== //

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 FinGuid AI Mortgage Calculator v' + MORTGAGE_CALCULATOR.VERSION);

    initializeInputListeners();
    initializeThemeToggle();
    initializeTabSystem();
    initializeCollapsibleSections();
    initializeVoiceCommands();
    initializeScreenReader();
    initializeShareButtons();
    initializeLoanCompare();

    fetchLiveRates();
    setInterval(fetchLiveRates, MORTGAGE_CALCULATOR.RATE_UPDATE_INTERVAL);

    updateCalculation('init');

    if (typeof gtag !== 'undefined') {
        gtag('event', 'calculator_loaded', {
            'event_category': 'engagement',
            'event_label': 'Mortgage Calculator v28'
        });
    }
});

// ========================================================================== //
// INPUT LISTENERS
// ========================================================================== //

function initializeInputListeners() {
    document.getElementById('home-price').addEventListener('input', () => updateCalculation('home-price'));
    document.getElementById('down-payment').addEventListener('input', () => updateCalculation('down-payment'));
    document.getElementById('down-payment-percent').addEventListener('input', () => updateCalculation('down-payment-percent'));
    document.getElementById('credit-score').addEventListener('change', () => updateCalculation('credit-score'));
    document.getElementById('interest-rate').addEventListener('input', () => updateCalculation('interest-rate'));
    document.getElementById('property-tax').addEventListener('input', () => updateCalculation('property-tax'));
    document.getElementById('home-insurance').addEventListener('input', () => updateCalculation('home-insurance'));
    document.getElementById('hoa-fees').addEventListener('input', () => updateCalculation('hoa-fees'));
    document.getElementById('extra-monthly').addEventListener('input', () => updateCalculation('extra-monthly'));
    document.getElementById('one-time-extra').addEventListener('input', () => updateCalculation('one-time-extra'));
    document.getElementById('extra-payment-date').addEventListener('change', () => updateCalculation('extra-payment-date'));
    document.getElementById('closing-costs-percentage').addEventListener('input', () => updateCalculation('closing-costs-percentage'));

    document.getElementById('state-select').addEventListener('change', function() {
        const state = this.value;
        if (state !== 'default' && STATE_RATES[state]) {
            const rates = STATE_RATES[state];
            const homePrice = parseFloat(document.getElementById('home-price').value) || 0;

            const annualTax = homePrice * (rates.taxRate / 100);
            const annualInsurance = homePrice * (rates.insuranceRate / 100);

            document.getElementById('property-tax').value = Math.round(annualTax);
            document.getElementById('home-insurance').value = Math.round(annualInsurance);

            document.getElementById('tax-rate-hint').textContent = 
                `Tax Rate: ${rates.taxRate.toFixed(2)}% (${rates.name})`;
            document.getElementById('insurance-rate-hint').textContent = 
                `Insurance Rate: ${rates.insuranceRate.toFixed(2)}% (${rates.name})`;

            updateCalculation('state-select');
            showToast('Rates updated for ' + rates.name, 'success');
        }
    });

    document.querySelectorAll('.chip[data-term]').forEach(chip => {
        chip.addEventListener('click', function() {
            document.querySelectorAll('.chip[data-term]').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            MORTGAGE_CALCULATOR.currentCalculation.loanTerm = parseInt(this.dataset.term);
            updateCalculation('loan-term');
        });
    });

    document.querySelectorAll('.chip[data-type]').forEach(chip => {
        chip.addEventListener('click', function() {
            document.querySelectorAll('.chip[data-type]').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            MORTGAGE_CALCULATOR.currentCalculation.loanType = this.dataset.type;

            const displayText = {
                'conventional': 'Conventional Loan',
                'fha': 'FHA Loan',
                'va': 'VA Loan',
                'usda': 'USDA Loan'
            };
            document.getElementById('loan-type-display').textContent = displayText[this.dataset.type] || 'Conventional Loan';

            updateCalculation('loan-type');
        });
    });

    document.getElementById('schedule-monthly').addEventListener('click', function() {
        MORTGAGE_CALCULATOR.scheduleType = 'monthly';
        this.classList.add('active');
        document.getElementById('schedule-yearly').classList.remove('active');
        MORTGAGE_CALCULATOR.scheduleCurrentPage = 1;
        renderPaymentScheduleTable();
    });

    document.getElementById('schedule-yearly').addEventListener('click', function() {
        MORTGAGE_CALCULATOR.scheduleType = 'yearly';
        this.classList.add('active');
        document.getElementById('schedule-monthly').classList.remove('active');
        MORTGAGE_CALCULATOR.scheduleCurrentPage = 1;
        renderPaymentScheduleTable();
    });

    document.getElementById('schedule-prev').addEventListener('click', () => {
        if (MORTGAGE_CALCULATOR.scheduleCurrentPage > 1) {
            MORTGAGE_CALCULATOR.scheduleCurrentPage--;
            renderPaymentScheduleTable();
        }
    });

    document.getElementById('schedule-next').addEventListener('click', () => {
        const schedule = MORTGAGE_CALCULATOR.scheduleType === 'yearly' ? 
            aggregateYearlySchedule() : MORTGAGE_CALCULATOR.amortizationSchedule;
        const maxPage = Math.ceil(schedule.length / MORTGAGE_CALCULATOR.scheduleItemsPerPage);
        if (MORTGAGE_CALCULATOR.scheduleCurrentPage < maxPage) {
            MORTGAGE_CALCULATOR.scheduleCurrentPage++;
            renderPaymentScheduleTable();
        }
    });

    document.getElementById('export-schedule').addEventListener('click', exportScheduleToCSV);
}

// ========================================================================== //
// VOICE COMMANDS - FULLY FUNCTIONAL
// ========================================================================== //

function initializeVoiceCommands() {
    const voiceBtn = document.getElementById('voice-control');
    const voiceStatus = document.getElementById('voice-status');
    const voiceStatusText = document.getElementById('voice-status-text');
    const voiceStatusClose = document.getElementById('voice-status-close');

    // Check browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        voiceBtn.style.display = 'none';
        console.warn('Speech Recognition not supported');
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    MORTGAGE_CALCULATOR.recognitionInstance = new SpeechRecognition();

    const recognition = MORTGAGE_CALCULATOR.recognitionInstance;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    voiceBtn.addEventListener('click', function() {
        if (MORTGAGE_CALCULATOR.voiceEnabled) {
            stopVoiceRecognition();
        } else {
            startVoiceRecognition();
        }
    });

    voiceStatusClose.addEventListener('click', function() {
        stopVoiceRecognition();
    });

    function startVoiceRecognition() {
        try {
            recognition.start();
            MORTGAGE_CALCULATOR.voiceEnabled = true;
            voiceStatus.classList.add('active');
            voiceBtn.style.background = '#10b981';
            voiceBtn.style.borderColor = '#10b981';
            voiceBtn.style.color = 'white';
            voiceStatusText.textContent = 'Listening... Say "Calculate", "Share", or "Export"';
            showToast('Voice commands activated', 'success');
        } catch (error) {
            console.error('Voice recognition error:', error);
            showToast('Could not start voice recognition', 'error');
        }
    }

    function stopVoiceRecognition() {
        try {
            recognition.stop();
            MORTGAGE_CALCULATOR.voiceEnabled = false;
            voiceStatus.classList.remove('active');
            voiceBtn.style.background = '';
            voiceBtn.style.borderColor = '';
            voiceBtn.style.color = '';
        } catch (error) {
            console.error('Stop error:', error);
        }
    }

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript.toLowerCase();
        console.log('Voice command:', transcript);
        voiceStatusText.textContent = `Heard: "${transcript}"`;

        if (transcript.includes('calculate') || transcript.includes('update')) {
            updateCalculation('voice');
            showToast('Calculation updated!', 'success');
            setTimeout(stopVoiceRecognition, 2000);
        } else if (transcript.includes('share')) {
            document.getElementById('share-btn').click();
            setTimeout(stopVoiceRecognition, 2000);
        } else if (transcript.includes('export') || transcript.includes('download')) {
            document.getElementById('export-schedule').click();
            setTimeout(stopVoiceRecognition, 2000);
        } else if (transcript.includes('pdf')) {
            document.getElementById('download-pdf-btn').click();
            setTimeout(stopVoiceRecognition, 2000);
        } else if (transcript.includes('print')) {
            window.print();
            setTimeout(stopVoiceRecognition, 2000);
        } else {
            voiceStatusText.textContent = 'Command not recognized. Try "Calculate", "Share", or "Export"';
            setTimeout(stopVoiceRecognition, 3000);
        }
    };

    recognition.onerror = function(event) {
        console.error('Recognition error:', event.error);
        voiceStatusText.textContent = `Error: ${event.error}. Please try again.`;
        setTimeout(stopVoiceRecognition, 2000);
    };

    recognition.onend = function() {
        if (MORTGAGE_CALCULATOR.voiceEnabled) {
            stopVoiceRecognition();
        }
    };
}

// ========================================================================== //
// SCREEN READER - TEXT TO SPEECH
// ========================================================================== //

function initializeScreenReader() {
    const btn = document.getElementById('screen-reader-toggle');

    if (!('speechSynthesis' in window)) {
        btn.style.display = 'none';
        console.warn('Speech Synthesis not supported');
        return;
    }

    btn.addEventListener('click', function() {
        if (MORTGAGE_CALCULATOR.screenReaderMode) {
            stopScreenReader();
        } else {
            startScreenReader();
        }
    });
}

function startScreenReader() {
    MORTGAGE_CALCULATOR.screenReaderMode = true;
    const btn = document.getElementById('screen-reader-toggle');
    btn.classList.add('screen-reader-active');

    const monthlyPayment = document.getElementById('monthly-payment-total').textContent;
    const totalCost = document.getElementById('total-cost').textContent;
    const totalInterest = document.getElementById('total-interest').textContent;
    const payoffDate = document.getElementById('payoff-date').textContent;

    const text = `Your mortgage calculation results are ready. 
        Your estimated monthly payment is ${monthlyPayment}. 
        The total loan cost is ${totalCost}. 
        You will pay ${totalInterest} in interest over the life of the loan. 
        Your loan will be paid off by ${payoffDate}. 
        Click me again to stop reading.`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = function() {
        stopScreenReader();
    };

    window.speechSynthesis.speak(utterance);
    showToast('Reading results aloud...', 'info');

    // Track with Google Analytics
    if (typeof gtag !== 'undefined') {
        gtag('event', 'screen_reader_used', {
            'event_category': 'accessibility'
        });
    }
}

function stopScreenReader() {
    MORTGAGE_CALCULATOR.screenReaderMode = false;
    const btn = document.getElementById('screen-reader-toggle');
    btn.classList.remove('screen-reader-active');

    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
}

// ========================================================================== //
// LIVE RATES FROM FRED
// ========================================================================== //

async function fetchLiveRates() {
    const now = Date.now();

    if (now - MORTGAGE_CALCULATOR.lastRateUpdate < 11 * 60 * 60 * 1000) {
        return;
    }

    try {
        const rate30Response = await fetch(
            `${MORTGAGE_CALCULATOR.FRED_BASE_URL}?series_id=MORTGAGE30US&api_key=${MORTGAGE_CALCULATOR.FRED_API_KEY}&file_type=json&sort_order=desc&limit=1`
        );

        const rate15Response = await fetch(
            `${MORTGAGE_CALCULATOR.FRED_BASE_URL}?series_id=MORTGAGE15US&api_key=${MORTGAGE_CALCULATOR.FRED_API_KEY}&file_type=json&sort_order=desc&limit=1`
        );

        const rate10Response = await fetch(
            `${MORTGAGE_CALCULATOR.FRED_BASE_URL}?series_id=DGS10&api_key=${MORTGAGE_CALCULATOR.FRED_API_KEY}&file_type=json&sort_order=desc&limit=1`
        );

        if (rate30Response.ok && rate15Response.ok && rate10Response.ok) {
            const rate30Data = await rate30Response.json();
            const rate15Data = await rate15Response.json();
            const rate10Data = await rate10Response.json();

            if (rate30Data.observations && rate30Data.observations.length > 0 &&
                rate15Data.observations && rate15Data.observations.length > 0 &&
                rate10Data.observations && rate10Data.observations.length > 0) {

                const rate30 = parseFloat(rate30Data.observations[0].value);
                const rate15 = parseFloat(rate15Data.observations[0].value);
                const rate10 = parseFloat(rate10Data.observations[0].value);

                MORTGAGE_CALCULATOR.marketRates.rate30Year = rate30;
                MORTGAGE_CALCULATOR.marketRates.rate15Year = rate15;
                MORTGAGE_CALCULATOR.marketRates.rate10Treasury = rate10;

                document.getElementById('rate-30-year').textContent = rate30.toFixed(2) + '%';
                document.getElementById('rate-15-year').textContent = rate15.toFixed(2) + '%';
                document.getElementById('rate-10-treasury').textContent = rate10.toFixed(2) + '%';

                const updateTime = new Date().toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                document.getElementById('rate-update-time').textContent = updateTime;

                document.getElementById('live-rate-status').innerHTML = 
                    '<i class="fas fa-check-circle"></i> Live rates updated';

                if (MORTGAGE_CALCULATOR.currentCalculation.loanTerm === 30) {
                    document.getElementById('interest-rate').value = rate30.toFixed(2);
                    MORTGAGE_CALCULATOR.currentCalculation.interestRate = rate30;
                    updateCalculation('live-rate-update');
                }

                MORTGAGE_CALCULATOR.lastRateUpdate = now;
                MORTGAGE_CALCULATOR.rateUpdateAttempts = 0;

                showToast('Live rates updated from FRED', 'success');
                console.log('✅ Live rates fetched successfully');
            }
        }
    } catch (error) {
        console.error('Error fetching live rates:', error);
        MORTGAGE_CALCULATOR.rateUpdateAttempts++;

        if (MORTGAGE_CALCULATOR.rateUpdateAttempts < MORTGAGE_CALCULATOR.maxRateUpdateAttempts) {
            setTimeout(fetchLiveRates, 5 * 60 * 1000);
        } else {
            document.getElementById('live-rate-status').innerHTML = 
                '<i class="fas fa-exclamation-triangle"></i> Using default rates';
            showToast('Unable to fetch live rates, using defaults', 'warning');
        }
    }
}

// ========================================================================== //
// CORE CALCULATION
// ========================================================================== //

function updateCalculation(sourceId = null) {
    const current = MORTGAGE_CALCULATOR.currentCalculation;

    current.homePrice = parseFloat(document.getElementById('home-price').value) || 0;
    current.downPayment = parseFloat(document.getElementById('down-payment').value) || 0;
    current.downPaymentPercent = parseFloat(document.getElementById('down-payment-percent').value) || 0;
    current.interestRate = parseFloat(document.getElementById('interest-rate').value) || 0;
    current.propertyTax = parseFloat(document.getElementById('property-tax').value) || 0;
    current.homeInsurance = parseFloat(document.getElementById('home-insurance').value) || 0;
    current.hoaFees = parseFloat(document.getElementById('hoa-fees').value) || 0;
    current.extraMonthly = parseFloat(document.getElementById('extra-monthly').value) || 0;
    current.oneTimeExtra = parseFloat(document.getElementById('one-time-extra').value) || 0;
    current.closingCostsPercent = parseFloat(document.getElementById('closing-costs-percentage').value) || 0;

    const extraPaymentDate = document.getElementById('extra-payment-date').value;
    if (extraPaymentDate && current.oneTimeExtra > 0) {
        const today = new Date();
        const paymentDate = new Date(extraPaymentDate);
        const monthsDiff = (paymentDate.getFullYear() - today.getFullYear()) * 12 + 
                          (paymentDate.getMonth() - today.getMonth());
        current.extraPaymentMonth = Math.max(1, monthsDiff);
    } else {
        current.extraPaymentMonth = 1;
    }

    if (sourceId === 'down-payment') {
        current.downPaymentPercent = (current.downPayment / current.homePrice) * 100 || 0;
        document.getElementById('down-payment-percent').value = current.downPaymentPercent.toFixed(2);
    } else if (sourceId === 'down-payment-percent') {
        current.downPayment = current.homePrice * (current.downPaymentPercent / 100);
        document.getElementById('down-payment').value = current.downPayment.toFixed(0);
    }

    current.loanAmount = current.homePrice - current.downPayment;

    if (current.downPaymentPercent < 20 && current.loanType === 'conventional') {
        current.pmi = (current.loanAmount * 0.005) / 12;
    } else if (current.loanType === 'fha' && current.downPaymentPercent < 10) {
        current.pmi = (current.loanAmount * 0.0085) / 12;
    } else {
        current.pmi = 0;
    }
    document.getElementById('pmi').value = current.pmi.toFixed(2);

    const principal = current.loanAmount;
    const rateMonthly = (current.interestRate / 100) / 12;
    const paymentsTotal = current.loanTerm * 12;

    let monthlyPI;
    if (rateMonthly === 0) {
        monthlyPI = principal / paymentsTotal;
    } else {
        monthlyPI = principal * (rateMonthly * Math.pow(1 + rateMonthly, paymentsTotal)) / 
                   (Math.pow(1 + rateMonthly, paymentsTotal) - 1);
    }

    if (isNaN(monthlyPI) || monthlyPI === Infinity) monthlyPI = 0;

    const monthlyTax = current.propertyTax / 12;
    const monthlyInsurance = current.homeInsurance / 12;
    const monthlyPITI = monthlyPI + monthlyTax + monthlyInsurance + current.pmi + current.hoaFees;
    const finalMonthlyPayment = monthlyPITI + current.extraMonthly;

    const amortizationData = calculateAmortization(monthlyPI, monthlyTax, monthlyInsurance);
    MORTGAGE_CALCULATOR.amortizationSchedule = amortizationData.schedule;

    document.getElementById('monthly-payment-total').textContent = formatCurrency(finalMonthlyPayment);
    document.getElementById('pi-monthly').textContent = formatCurrency(monthlyPI);
    document.getElementById('tax-monthly').textContent = formatCurrency(monthlyTax);
    document.getElementById('insurance-monthly').textContent = formatCurrency(monthlyInsurance);
    document.getElementById('other-monthly').textContent = formatCurrency(current.pmi + current.hoaFees);
    document.getElementById('total-monthly').textContent = formatCurrency(monthlyPITI);

    // SHOW EXTRA MONTHLY PAYMENT IN BREAKDOWN
    const extraMonthlyItem = document.getElementById('extra-monthly-item');
    const extraMonthlyDisplay = document.getElementById('extra-monthly-display');
    if (current.extraMonthly > 0) {
        extraMonthlyItem.style.display = 'flex';
        extraMonthlyDisplay.textContent = formatCurrency(current.extraMonthly);
    } else {
        extraMonthlyItem.style.display = 'none';
    }

    document.getElementById('total-cost').textContent = formatCurrency(amortizationData.totalCost);
    document.getElementById('total-interest').textContent = formatCurrency(amortizationData.totalInterest);
    document.getElementById('payoff-date').textContent = amortizationData.payoffDate;
    document.getElementById('closing-costs').textContent = formatCurrency(current.homePrice * (current.closingCostsPercent / 100));

    renderPaymentComponentsChart(monthlyPI, monthlyTax, monthlyInsurance, current.pmi + current.hoaFees);
    renderMortgageTimelineChart();
    renderAIPoweredInsights();
    renderPaymentScheduleTable();
    updateChartLiveStats();

    if (typeof gtag !== 'undefined' && sourceId !== 'init') {
        gtag('event', 'calculation_update', {
            'event_category': 'calculator',
            'source': sourceId
        });
    }
}

// ========================================================================== //
// AMORTIZATION CALCULATION
// ========================================================================== //

function calculateAmortization(monthlyPI, monthlyTax, monthlyInsurance) {
    const current = MORTGAGE_CALCULATOR.currentCalculation;
    let balance = current.loanAmount;
    const rateMonthly = (current.interestRate / 100) / 12;
    const schedule = [];
    let totalInterest = 0;
    let totalPayments = 0;
    const maxPayments = current.loanTerm * 12 + 60;

    for (let month = 1; month <= maxPayments && balance > 0.01; month++) {
        const interestPayment = balance * rateMonthly;
        totalInterest += interestPayment;

        let principalPayment = monthlyPI - interestPayment;
        let extraPayment = current.extraMonthly;

        if (month === current.extraPaymentMonth && current.oneTimeExtra > 0) {
            extraPayment += current.oneTimeExtra;
        }

        const totalPrincipal = principalPayment + extraPayment;

        if (balance < totalPrincipal) {
            principalPayment = balance;
            extraPayment = 0;
            balance = 0;
        } else {
            balance -= totalPrincipal;
        }

        const taxAndIns = monthlyTax + monthlyInsurance + current.pmi;

        schedule.push({
            month: month,
            year: Math.ceil(month / 12),
            date: getDateString(month),
            totalPayment: monthlyPI + taxAndIns + extraPayment + current.hoaFees,
            principal: principalPayment,
            interest: interestPayment,
            taxAndIns: taxAndIns,
            hoa: current.hoaFees,
            extra: extraPayment,
            balance: balance,
            totalInterest: totalInterest
        });

        totalPayments++;
    }

    const payoffDate = getDateString(totalPayments);
    const totalCost = current.homePrice + totalInterest + (current.homePrice * current.closingCostsPercent / 100);

    return {
        schedule: schedule,
        totalInterest: totalInterest,
        payoffDate: payoffDate,
        totalPayments: totalPayments,
        totalCost: totalCost
    };
}

function getDateString(monthsFromNow) {
    const date = new Date();
    date.setMonth(date.getMonth() + monthsFromNow);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

// UPDATE LIVE CHART STATS
function updateChartLiveStats() {
    const schedule = MORTGAGE_CALCULATOR.amortizationSchedule;
    if (schedule.length === 0) return;

    const lastEntry = schedule[schedule.length - 1];
    const current = MORTGAGE_CALCULATOR.currentCalculation;

    const remainingBalance = lastEntry.balance;
    const principalPaid = current.loanAmount - remainingBalance;
    const interestPaid = lastEntry.totalInterest;

    document.getElementById('chart-remaining-balance').textContent = formatCurrency(remainingBalance);
    document.getElementById('chart-principal-paid').textContent = formatCurrency(principalPaid);
    document.getElementById('chart-interest-paid').textContent = formatCurrency(interestPaid);
}

// ========================================================================== //
// CHARTS RENDERING
// ========================================================================== //

function renderPaymentComponentsChart(pi, tax, insurance, other) {
    const ctx = document.getElementById('paymentComponentsChart').getContext('2d');

    if (MORTGAGE_CALCULATOR.charts.paymentComponents) {
        MORTGAGE_CALCULATOR.charts.paymentComponents.destroy();
    }

    MORTGAGE_CALCULATOR.charts.paymentComponents = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Principal & Interest', 'Property Tax', 'Home Insurance', 'PMI & HOA'],
            datasets: [{
                data: [pi, tax, insurance, other],
                backgroundColor: [
                    'rgba(20, 184, 166, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(239, 68, 68, 1)',
                    'rgba(245, 158, 11, 1)'
                ],
                borderWidth: 2,
                borderColor: getComputedStyle(document.body).backgroundColor
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: getComputedStyle(document.body).getPropertyValue('color'),
                        padding: 15,
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + formatCurrency(context.parsed);
                        }
                    }
                }
            }
        }
    });
}

function renderMortgageTimelineChart() {
    const schedule = MORTGAGE_CALCULATOR.amortizationSchedule;
    if (!schedule.length) return;

    const ctx = document.getElementById('mortgageTimelineChart').getContext('2d');

    if (MORTGAGE_CALCULATOR.charts.mortgageTimeline) {
        MORTGAGE_CALCULATOR.charts.mortgageTimeline.destroy();
    }

    const yearlyData = schedule.filter((item, index) => index % 12 === 0 || index === schedule.length - 1);

    const principalPaid = [];
    const interestPaid = [];
    let cumPrincipal = 0;
    let cumInterest = 0;

    yearlyData.forEach(item => {
        cumPrincipal = MORTGAGE_CALCULATOR.currentCalculation.loanAmount - item.balance;
        cumInterest = item.totalInterest;
        principalPaid.push(cumPrincipal);
        interestPaid.push(cumInterest);
    });

    MORTGAGE_CALCULATOR.charts.mortgageTimeline = new Chart(ctx, {
        type: 'line',
        data: {
            labels: yearlyData.map(item => 'Year ' + item.year),
            datasets: [
                {
                    label: 'Remaining Balance',
                    data: yearlyData.map(item => item.balance),
                    borderColor: 'rgba(20, 184, 166, 1)',
                    backgroundColor: 'rgba(20, 184, 166, 0.1)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Principal Paid',
                    data: principalPaid,
                    borderColor: 'rgba(59, 130, 246, 1)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: false,
                    tension: 0.3
                },
                {
                    label: 'Interest Paid',
                    data: interestPaid,
                    borderColor: 'rgba(239, 68, 68, 1)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: false,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.body).getPropertyValue('color'),
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Loan Progress',
                        color: getComputedStyle(document.body).getPropertyValue('color')
                    },
                    ticks: {
                        color: getComputedStyle(document.body).getPropertyValue('color')
                    },
                    grid: {
                        color: 'rgba(128, 128, 128, 0.1)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Amount ($)',
                        color: getComputedStyle(document.body).getPropertyValue('color')
                    },
                    ticks: {
                        color: getComputedStyle(document.body).getPropertyValue('color'),
                        callback: function(value) {
                            return '$' + (value / 1000).toFixed(0) + 'k';
                        }
                    },
                    grid: {
                        color: 'rgba(128, 128, 128, 0.1)'
                    }
                }
            }
        }
    });
}

// ========================================================================== //
// AI INSIGHTS
// ========================================================================== //

function renderAIPoweredInsights() {
    const current = MORTGAGE_CALCULATOR.currentCalculation;
    const container = document.getElementById('ai-insights-container');
    container.innerHTML = '';

    const insights = [];

    if (current.creditScore >= 740) {
        insights.push({
            title: '✅ Excellent Credit Position',
            text: `Your credit score of <strong>${current.creditScore}</strong> qualifies you for the best mortgage rates. You're in a strong position to negotiate favorable terms.`
        });
    } else if (current.creditScore >= 670) {
        insights.push({
            title: '⚠️ Good Credit - Room for Improvement',
            text: `Your credit score of <strong>${current.creditScore}</strong> is good, but improving it to 740+ could reduce your interest rate by 0.25-0.5%, saving thousands over the loan term.`
        });
    } else {
        insights.push({
            title: '🔴 Credit Score Alert',
            text: `With a credit score of <strong>${current.creditScore}</strong>, you may face higher interest rates. Consider improving your credit before applying.`
        });
    }

    const dpPercent = current.downPaymentPercent;
    if (dpPercent >= 20) {
        insights.push({
            title: '💰 Optimal Down Payment',
            text: `Your <strong>${dpPercent.toFixed(1)}%</strong> down payment eliminates PMI, saving you <strong>${formatCurrency(current.pmi * 12)}/year</strong>.`
        });
    } else {
        const pmiAnnual = current.pmi * 12;
        insights.push({
            title: '📊 PMI Impact Analysis',
            text: `With <strong>${dpPercent.toFixed(1)}%</strong> down, you'll pay <strong>${formatCurrency(pmiAnnual)}/year</strong> in PMI until you reach 20% equity.`
        });
    }

    if (current.extraMonthly > 0 || current.oneTimeExtra > 0) {
        insights.push({
            title: '🚀 Accelerated Payoff Strategy',
            text: `Your extra payments will save significant interest and pay off your loan years early! Keep it up!`
        });
    } else {
        insights.push({
            title: '💡 Extra Payment Opportunity',
            text: `Adding just <strong>$200/month</strong> extra could save tens of thousands in interest. Try it in the calculator!`
        });
    }

    const avgRate = MORTGAGE_CALCULATOR.marketRates.rate30Year;
    if (current.interestRate < avgRate) {
        insights.push({
            title: '🎯 Below-Market Rate',
            text: `Your rate of <strong>${current.interestRate}%</strong> is below the current 30-year average of ${avgRate}%. Excellent rate—lock it in!`
        });
    } else if (current.interestRate > avgRate + 0.5) {
        insights.push({
            title: '⚡ Rate Optimization Opportunity',
            text: `Your rate of <strong>${current.interestRate}%</strong> is above market average (${avgRate}%). Shop around with multiple lenders.`
        });
    }

    insights.forEach(insight => {
        const insightDiv = document.createElement('div');
        insightDiv.className = 'ai-insight';
        insightDiv.innerHTML = `
            <div class="ai-insight-title">${insight.title}</div>
            <div>${insight.text}</div>
        `;
        container.appendChild(insightDiv);
    });
}

// ========================================================================== //
// PAYMENT SCHEDULE TABLE
// ========================================================================== //

function renderPaymentScheduleTable() {
    const schedule = MORTGAGE_CALCULATOR.amortizationSchedule;
    const tbody = document.querySelector('#payment-schedule-table tbody');
    tbody.innerHTML = '';

    if (!schedule.length) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No data available</td></tr>';
        return;
    }

    let displaySchedule = schedule;
    if (MORTGAGE_CALCULATOR.scheduleType === 'yearly') {
        displaySchedule = aggregateYearlySchedule();
        MORTGAGE_CALCULATOR.scheduleItemsPerPage = 30;
    } else {
        MORTGAGE_CALCULATOR.scheduleItemsPerPage = 12;
    }

    const start = (MORTGAGE_CALCULATOR.scheduleCurrentPage - 1) * MORTGAGE_CALCULATOR.scheduleItemsPerPage;
    const end = start + MORTGAGE_CALCULATOR.scheduleItemsPerPage;
    const pageData = displaySchedule.slice(start, end);

    pageData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="month-col">${row.date}</td>
            <td>${formatCurrency(row.totalPayment)}</td>
            <td class="principal-col">${formatCurrency(row.principal)}</td>
            <td class="interest-col">${formatCurrency(row.interest)}</td>
            <td>${formatCurrency(row.taxAndIns)}</td>
            <td>${formatCurrency(row.hoa)}</td>
            <td>${formatCurrency(row.extra)}</td>
            <td class="balance-col">${formatCurrency(row.balance)}</td>
        `;
        tbody.appendChild(tr);
    });

    const maxPage = Math.ceil(displaySchedule.length / MORTGAGE_CALCULATOR.scheduleItemsPerPage);
    document.getElementById('schedule-page-info').textContent = 
        `Page ${MORTGAGE_CALCULATOR.scheduleCurrentPage} of ${maxPage}`;
    document.getElementById('schedule-prev').disabled = MORTGAGE_CALCULATOR.scheduleCurrentPage === 1;
    document.getElementById('schedule-next').disabled = MORTGAGE_CALCULATOR.scheduleCurrentPage === maxPage;
}

function aggregateYearlySchedule() {
    const schedule = MORTGAGE_CALCULATOR.amortizationSchedule;
    const yearly = [];

    for (let year = 1; year <= Math.ceil(schedule.length / 12); year++) {
        const yearData = schedule.filter(item => item.year === year);
        if (yearData.length === 0) continue;

        const lastMonth = yearData[yearData.length - 1];
        yearly.push({
            date: `Year ${year}`,
            totalPayment: yearData.reduce((sum, item) => sum + item.totalPayment, 0),
            principal: yearData.reduce((sum, item) => sum + item.principal, 0),
            interest: yearData.reduce((sum, item) => sum + item.interest, 0),
            taxAndIns: yearData.reduce((sum, item) => sum + item.taxAndIns, 0),
            hoa: yearData.reduce((sum, item) => sum + item.hoa, 0),
            extra: yearData.reduce((sum, item) => sum + item.extra, 0),
            balance: lastMonth.balance
        });
    }

    return yearly;
}

function exportScheduleToCSV() {
    const schedule = MORTGAGE_CALCULATOR.amortizationSchedule;
    let csv = 'Period,Total Payment,Principal,Interest,Taxes & Insurance,HOA,Extra Payment,Remaining Balance\n';

    schedule.forEach(row => {
        csv += `${row.date},${row.totalPayment.toFixed(2)},${row.principal.toFixed(2)},${row.interest.toFixed(2)},`;
        csv += `${row.taxAndIns.toFixed(2)},${row.hoa.toFixed(2)},${row.extra.toFixed(2)},${row.balance.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mortgage-schedule-finguid.csv';
    a.click();

    showToast('Schedule exported successfully!', 'success');

    if (typeof gtag !== 'undefined') {
        gtag('event', 'export_schedule', {
            'event_category': 'engagement'
        });
    }
}

// ========================================================================== //
// SHARE BUTTONS & PDF DOWNLOAD (FIXED WITH jsPDF)
// ========================================================================== //

function initializeShareButtons() {
    // Share button
    document.getElementById('share-btn').addEventListener('click', async () => {
        const shareData = {
            title: 'FinGuid Mortgage Calculator',
            text: `My mortgage: ${document.getElementById('monthly-payment-total').textContent}/month`,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
                showToast('Shared successfully!', 'success');
            } catch (err) {
                if (err.name !== 'AbortError') {
                    navigator.clipboard.writeText(window.location.href);
                    showToast('Link copied to clipboard!', 'success');
                }
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            showToast('Link copied to clipboard!', 'success');
        }

        if (typeof gtag !== 'undefined') {
            gtag('event', 'share', {
                'event_category': 'engagement'
            });
        }
    });

    // Download PDF button (FIXED)
    document.getElementById('download-pdf-btn').addEventListener('click', generatePDF);

    // Print button
    document.getElementById('print-btn').addEventListener('click', () => {
        window.print();

        if (typeof gtag !== 'undefined') {
            gtag('event', 'print', {
                'event_category': 'engagement'
            });
        }
    });
}

function generatePDF() {
    try {
        // Check if jsPDF is available
        if (typeof jspdf === 'undefined' && typeof window.jspdf === 'undefined') {
            showToast('PDF library not loaded. Please refresh the page.', 'error');
            return;
        }

        const { jsPDF } = window.jspdf || jspdf;
        const doc = new jsPDF();

        const current = MORTGAGE_CALCULATOR.currentCalculation;
        let y = 20;

        // Header
        doc.setFontSize(20);
        doc.setTextColor(20, 184, 166);
        doc.text('FinGuid Mortgage Calculator', 20, y);
        y += 10;

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        const now = new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        doc.text(`Generated on ${now}`, 20, y);
        y += 15;

        // Loan Details
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('Loan Details', 20, y);
        y += 8;

        doc.setFontSize(10);
        const details = [
            ['Home Price:', formatCurrency(current.homePrice)],
            ['Down Payment:', formatCurrency(current.downPayment) + ` (${current.downPaymentPercent.toFixed(1)}%)`],
            ['Loan Amount:', formatCurrency(current.loanAmount)],
            ['Interest Rate:', current.interestRate.toFixed(2) + '%'],
            ['Loan Term:', current.loanTerm + ' years'],
            ['Loan Type:', current.loanType.toUpperCase()],
            ['Credit Score:', current.creditScore.toString()]
        ];

        details.forEach(([label, value]) => {
            doc.text(label, 20, y);
            doc.text(value, 100, y);
            y += 7;
        });

        // Monthly Payment
        y += 10;
        doc.setFontSize(14);
        doc.text('Monthly Payment Breakdown', 20, y);
        y += 8;

        doc.setFontSize(10);
        const monthlyPayment = document.getElementById('monthly-payment-total').textContent;
        const pi = document.getElementById('pi-monthly').textContent;
        const tax = document.getElementById('tax-monthly').textContent;
        const insurance = document.getElementById('insurance-monthly').textContent;
        const other = document.getElementById('other-monthly').textContent;

        const payments = [
            ['Principal & Interest:', pi],
            ['Property Tax:', tax],
            ['Home Insurance:', insurance],
            ['PMI/HOA/Other:', other]
        ];

        if (current.extraMonthly > 0) {
            payments.push(['Extra Monthly Payment:', formatCurrency(current.extraMonthly)]);
        }

        payments.push(['Total Monthly Payment:', monthlyPayment]);

        payments.forEach(([label, value]) => {
            doc.text(label, 20, y);
            doc.text(value, 100, y);
            y += 7;
        });

        // Loan Summary
        y += 10;
        doc.setFontSize(14);
        doc.text('Loan Summary', 20, y);
        y += 8;

        doc.setFontSize(10);
        const totals = [
            ['Total Loan Cost:', document.getElementById('total-cost').textContent],
            ['Total Interest Paid:', document.getElementById('total-interest').textContent],
            ['Payoff Date:', document.getElementById('payoff-date').textContent],
            ['Closing Costs:', document.getElementById('closing-costs').textContent]
        ];

        totals.forEach(([label, value]) => {
            doc.text(label, 20, y);
            doc.text(value, 100, y);
            y += 7;
        });

        // Disclaimer
        y += 15;
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        const disclaimer = 'This calculator provides estimates for educational purposes only. Actual rates and payments may vary based on your credit, location, and lender policies. Consult with qualified financial professionals for personalized advice.';
        doc.text(disclaimer, 20, y, { maxWidth: 170 });

        // Footer
        doc.setFontSize(10);
        doc.setTextColor(20, 184, 166);
        doc.text('Generated by FinGuid.com - World\'s First AI Mortgage Calculator', 20, 285);

        // Save PDF
        doc.save('mortgage-calculation-finguid.pdf');

        showToast('PDF downloaded successfully!', 'success');

        // Track with Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'download_pdf', {
                'event_category': 'engagement'
            });
        }
    } catch (error) {
        console.error('PDF generation error:', error);
        showToast('Error generating PDF. Please try again.', 'error');
    }
}

// ========================================================================== //
// LOAN COMPARE
// ========================================================================== //

function initializeLoanCompare() {
    document.getElementById('loan-compare-btn').addEventListener('click', () => {
        const current = MORTGAGE_CALCULATOR.currentCalculation;

        const scenarios = [
            `Current: ${formatCurrency(current.loanAmount)} at ${current.interestRate}% for ${current.loanTerm} years`,
            `Alternative 1: 15-year loan at ${MORTGAGE_CALCULATOR.marketRates.rate15Year}%`,
            `Alternative 2: 20% down payment (avoid PMI)`,
            `Alternative 3: Extra $200/month payment`
        ];

        alert('Loan Comparison Feature\n\n' + scenarios.join('\n'));

        if (typeof gtag !== 'undefined') {
            gtag('event', 'compare_opened', {
                'event_category': 'engagement'
            });
        }
    });
}

// ========================================================================== //
// UI HELPERS
// ========================================================================== //

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function initializeThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme') || 'dark';

    document.body.setAttribute('data-color-scheme', currentTheme);
    MORTGAGE_CALCULATOR.currentTheme = currentTheme;

    toggleBtn.addEventListener('click', () => {
        const newTheme = MORTGAGE_CALCULATOR.currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-color-scheme', newTheme);
        MORTGAGE_CALCULATOR.currentTheme = newTheme;
        localStorage.setItem('theme', newTheme);

        updateCalculation('theme-change');
    });
}

function initializeTabSystem() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;

            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(targetTab + '-tab').classList.add('active');
        });
    });
}

function initializeCollapsibleSections() {
    document.querySelectorAll('.collapsible-section .section-sub-heading').forEach(heading => {
        heading.addEventListener('click', () => {
            const section = heading.closest('.collapsible-section');
            section.classList.toggle('collapsed');
        });
    });
}

// Close voice status
document.getElementById('voice-status-close')?.addEventListener('click', () => {
    document.getElementById('voice-status').classList.remove('active');
    if (MORTGAGE_CALCULATOR.recognitionInstance) {
        try {
            MORTGAGE_CALCULATOR.recognitionInstance.stop();
        } catch (e) {
            console.log('Recognition already stopped');
        }
    }
    MORTGAGE_CALCULATOR.voiceEnabled = false;
});

console.log('✅ All features initialized successfully!');
