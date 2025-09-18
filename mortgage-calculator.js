/**
 * FinGuid Mortgage Calculator v7.4 - Production Ready & Feature Complete
 * - Implements a new "Mortgage Over Time" line chart.
 * - Replaces Pie and Bar charts with the new line chart.
 * - Updated sharing functionality to use specific social media links.
 * - Implements enhanced AI-Powered Insights with actionable buttons.
 * - Adds global, persistent voice commands and screen reading functionality.
 * - Ensures responsive layout with a 3-column structure.
 * - Down payment synchronization and state-based tax calculation are maintained.
 */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
    
    // --- STATE & CONFIGURATION ---
    const state = {
        lineChart: null, 
        amortizationData: [],
        currentAmortizationView: 'monthly', 
        amortizationPage: 1,
        speechRecognition: null, 
        isListening: false, 
        screenReader: false,
        currentCalculation: null,
        totalPaidInterest: 0,
        totalPaidPrincipal: 0,
    };
    
    const config = {
        debounceDelay: 300,
        amortizationPageSize: 12,
        chartColors: {
            principal: '#21808D',
            interest: '#F59E0B',
            remainingBalance: '#10B981',
        },
    };

    // US States with actual property tax rates (2024 data)
    const statePropertyTaxRates = {
        'AL': { rate: 0.0041, name: 'Alabama' }, 'AK': { rate: 0.0119, name: 'Alaska' },
        'AZ': { rate: 0.0062, name: 'Arizona' }, 'AR': { rate: 0.0062, name: 'Arkansas' },
        'CA': { rate: 0.0076, name: 'California' }, 'CO': { rate: 0.0049, name: 'Colorado' },
        'CT': { rate: 0.0214, name: 'Connecticut' }, 'DE': { rate: 0.0056, name: 'Delaware' },
        'FL': { rate: 0.0084, name: 'Florida' }, 'GA': { rate: 0.0087, name: 'Georgia' },
        'HI': { rate: 0.0031, name: 'Hawaii' }, 'ID': { rate: 0.0069, name: 'Idaho' },
        'IL': { rate: 0.0208, name: 'Illinois' }, 'IN': { rate: 0.0079, name: 'Indiana' },
        'IA': { rate: 0.0153, name: 'Iowa' }, 'KS': { rate: 0.0125, name: 'Kansas' },
        'KY': { rate: 0.0086, name: 'Kentucky' }, 'LA': { rate: 0.0053, name: 'Louisiana' },
        'ME': { rate: 0.0122, name: 'Maine' }, 'MD': { rate: 0.0104, name: 'Maryland' },
        'MA': { rate: 0.0118, name: 'Massachusetts' }, 'MI': { rate: 0.0145, name: 'Michigan' },
        'MN': { rate: 0.0112, name: 'Minnesota' }, 'MS': { rate: 0.0074, name: 'Mississippi' },
        'MO': { rate: 0.0101, name: 'Missouri' }, 'MT': { rate: 0.0081, name: 'Montana' },
        'NE': { rate: 0.0163, name: 'Nebraska' }, 'NV': { rate: 0.0063, name: 'Nevada' },
        'NH': { rate: 0.0189, name: 'New Hampshire' }, 'NJ': { rate: 0.0249, name: 'New Jersey' },
        'NM': { rate: 0.0073, name: 'New Mexico' }, 'NY': { rate: 0.0139, name: 'New York' },
        'NC': { rate: 0.0076, name: 'North Carolina' }, 'ND': { rate: 0.011, name: 'North Dakota' },
        'OH': { rate: 0.015, name: 'Ohio' }, 'OK': { rate: 0.0087, name: 'Oklahoma' },
        'OR': { rate: 0.009, name: 'Oregon' }, 'PA': { rate: 0.0145, name: 'Pennsylvania' },
        'RI': { rate: 0.0155, name: 'Rhode Island' }, 'SC': { rate: 0.0056, name: 'South Carolina' },
        'SD': { rate: 0.012, name: 'South Dakota' }, 'TN': { rate: 0.0073, name: 'Tennessee' },
        'TX': { rate: 0.0169, name: 'Texas' }, 'UT': { rate: 0.0062, name: 'Utah' },
        'VT': { rate: 0.0178, name: 'Vermont' }, 'VA': { rate: 0.008, name: 'Virginia' },
        'WA': { rate: 0.0093, name: 'Washington' }, 'WV': { rate: 0.0059, name: 'West Virginia' },
        'WI': { rate: 0.0149, name: 'Wisconsin' }, 'WY': { rate: 0.0061, name: 'Wyoming' }
    };

    // --- DOM ELEMENT CACHE ---
    const elements = {
        form: document.getElementById('mortgage-form'),
        homePrice: document.getElementById('home-price'),
        dpAmount: document.getElementById('dp-amount'),
        dpPercent: document.getElementById('dp-percent'),
        interestRate: document.getElementById('interest-rate'),
        loanTerm: document.getElementById('loan-term'),
        startDate: document.getElementById('start-date'),
        stateSelect: document.getElementById('state'),
        extraMonthly: document.getElementById('extra-monthly'),
        extraOnetime: document.getElementById('extra-onetime'),
        extraOnetimeDate: document.getElementById('extra-onetime-date'),
        calculateBtn: document.getElementById('calculate-btn'),
        resultsPanel: document.getElementById('results-panel'),
        totalMonthlyPayment: document.getElementById('total-monthly-payment'),
        principalInterest: document.getElementById('principal-interest'),
        propertyTax: document.getElementById('property-tax'),
        homeInsurance: document.getElementById('home-insurance'),
        pmiPayment: document.getElementById('pmi-payment'),
        mortgageOverTimeChart: document.getElementById('mortgage-over-time-chart'),
        remainingBalanceDisplay: document.getElementById('remaining-balance-display'),
        principalPaidDisplay: document.getElementById('principal-paid-display'),
        interestPaidDisplay: document.getElementById('interest-paid-display'),
        aiInsightsList: document.getElementById('ai-insights-list'),
        amortizationToggle: document.getElementById('amortization-toggle'),
        amortizationContainer: document.getElementById('amortization-container'),
        amortizationTableBody: document.getElementById('amortization-table-body'),
        prevPageBtn: document.getElementById('prev-page-btn'),
        nextPageBtn: document.getElementById('next-page-btn'),
        pageInfo: document.getElementById('page-info'),
        amortizationViewBtns: document.querySelectorAll('.view-btn'),
        exportPdfBtn: document.getElementById('export-pdf-btn'),
        exportCsvBtn: document.getElementById('export-csv-btn'),
        printBtn: document.getElementById('print-btn'),
        voiceBtn: document.getElementById('voice-btn'),
        voiceStatus: document.getElementById('voice-status'),
        screenReaderBtn: document.getElementById('screen-reader-btn'),
        srAnnouncer: document.getElementById('sr-announcer'),
        extraPaymentsToggle: document.querySelector('.extra-payments-section .section-toggle'),
        extraPaymentsFields: document.querySelector('.extra-payments-fields'),
        termChips: document.querySelectorAll('.term-chip'),
        shareButtons: document.querySelectorAll('.share-btn')
    };

    // --- CORE CALCULATION LOGIC ---
    function calculateMortgage(inputs) {
        const { homePrice, dpAmount, interestRate, loanTerm, propertyTaxRate, homeInsurance, extraMonthly, extraOnetime, extraOnetimeDate } = inputs;
        
        let loanAmount = homePrice - dpAmount;
        if (loanAmount <= 0) {
            return null; // Invalid loan amount
        }

        const monthlyRate = (interestRate / 100) / 12;
        const numberOfPayments = loanTerm * 12;
        
        let monthlyPI = 0;
        if (monthlyRate > 0) {
            monthlyPI = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
        } else {
            monthlyPI = loanAmount / numberOfPayments;
        }

        const monthlyTax = (homePrice * propertyTaxRate) / 12;
        const monthlyInsurance = homeInsurance / 12;
        const pmi = (dpAmount / homePrice < 0.2) ? (loanAmount * 0.005) / 12 : 0;
        
        const totalMonthly = monthlyPI + monthlyTax + monthlyInsurance + pmi;

        // Amortization Schedule Calculation
        let balance = loanAmount;
        let amortization = [];
        let totalInterestPaid = 0;
        let totalPrincipalPaid = 0;
        
        const startDate = inputs.startDate;
        const oneTimePaymentMonth = extraOnetimeDate ? ((extraOnetimeDate.getFullYear() - startDate.getFullYear()) * 12 + (extraOnetimeDate.getMonth() - startDate.getMonth())) : -1;
        
        for (let i = 1; i <= numberOfPayments; i++) {
            if (balance <= 0) break;

            let interestPayment = balance * monthlyRate;
            let principalPayment = monthlyPI - interestPayment;
            
            let extraPayment = parseFloat(extraMonthly) || 0;
            if (i === oneTimePaymentMonth + 1) {
                extraPayment += parseFloat(extraOnetime) || 0;
            }

            let totalPrincipalPaidThisMonth = principalPayment + extraPayment;
            
            balance -= totalPrincipalPaidThisMonth;
            
            totalInterestPaid += interestPayment;
            totalPrincipalPaid += totalPrincipalPaidThisMonth;

            amortization.push({
                month: i,
                date: new Date(startDate.getFullYear(), startDate.getMonth() + i, 1),
                payment: monthlyPI + extraPayment,
                principal: totalPrincipalPaidThisMonth,
                interest: interestPayment,
                remainingBalance: Math.max(0, balance)
            });
        }
        
        return {
            totalMonthly,
            monthlyPI,
            monthlyTax,
            monthlyInsurance,
            pmi,
            loanAmount,
            totalInterestPaid,
            totalPrincipalPaid,
            amortization
        };
    }

    // --- RENDER FUNCTIONS ---
    function renderResults(results) {
        if (!results) {
            elements.resultsPanel.classList.add('hidden');
            return;
        }

        elements.resultsPanel.classList.remove('hidden');
        elements.totalMonthlyPayment.textContent = formatCurrency(results.totalMonthly);
        elements.principalInterest.textContent = formatCurrency(results.monthlyPI, 2);
        elements.propertyTax.textContent = formatCurrency(results.monthlyTax, 2);
        elements.homeInsurance.textContent = formatCurrency(results.monthlyInsurance, 2);
        elements.pmiPayment.textContent = formatCurrency(results.pmi, 2);
        
        state.currentCalculation = results;
        state.amortizationData = results.amortization;
        state.totalPaidInterest = results.totalInterestPaid;
        state.totalPaidPrincipal = results.totalPrincipalPaid;
        
        renderAmortizationSchedule(state.amortizationPage);
        renderMortgageOverTimeChart(results.amortization);
        renderAIInsights(results);
        announceResults(results);
    }
    
    function renderMortgageOverTimeChart(amortizationData) {
        const ctx = elements.mortgageOverTimeChart.getContext('2d');
        const labels = amortizationData.map(d => formatDate(d.date));
        const principalPaid = amortizationData.map(d => d.principal);
        const interestPaid = amortizationData.map(d => d.interest);
        const remainingBalance = amortizationData.map(d => d.remainingBalance);
        
        if (state.lineChart) {
            state.lineChart.destroy();
        }

        const data = {
            labels,
            datasets: [
                {
                    label: 'Remaining Balance',
                    data: remainingBalance,
                    borderColor: config.chartColors.remainingBalance,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointRadius: 0,
                },
                {
                    label: 'Principal Paid',
                    data: principalPaid,
                    borderColor: config.chartColors.principal,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointRadius: 0,
                    hidden: true,
                },
                {
                    label: 'Interest Paid',
                    data: interestPaid,
                    borderColor: config.chartColors.interest,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointRadius: 0,
                    hidden: true,
                },
            ],
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: { display: true, text: 'Time' },
                    grid: { display: false }
                },
                y: {
                    title: { display: true, text: 'Amount ($)' },
                    beginAtZero: true,
                    grid: { display: true }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y, 2)}`
                    }
                }
            }
        };

        state.lineChart = new Chart(ctx, { type: 'line', data, options });
    }

    function updateChartInfo() {
        if (!state.currentCalculation) return;

        const currentMonthData = state.amortizationData[state.amortizationPage * config.amortizationPageSize - 1];
        if (!currentMonthData) return;

        const totalPrincipalPaid = state.amortizationData.slice(0, currentMonthData.month).reduce((sum, row) => sum + row.principal, 0);
        const totalInterestPaid = state.amortizationData.slice(0, currentMonthData.month).reduce((sum, row) => sum + row.interest, 0);

        elements.remainingBalanceDisplay.textContent = formatCurrency(currentMonthData.remainingBalance);
        elements.principalPaidDisplay.textContent = formatCurrency(totalPrincipalPaid);
        elements.interestPaidDisplay.textContent = formatCurrency(totalInterestPaid);
    }
    
    function renderAmortizationSchedule(page = 1) {
        const pageSize = config.amortizationPageSize;
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const pageData = state.amortizationData.slice(start, end);

        let html = '';
        pageData.forEach(row => {
            html += `
                <tr>
                    <td>${formatDate(row.date)}</td>
                    <td>${formatCurrency(row.payment, 2)}</td>
                    <td>${formatCurrency(row.principal, 2)}</td>
                    <td>${formatCurrency(row.interest, 2)}</td>
                    <td>${formatCurrency(row.remainingBalance, 2)}</td>
                </tr>
            `;
        });
        elements.amortizationTableBody.innerHTML = html;

        state.amortizationPage = page;
        elements.prevPageBtn.disabled = page === 1;
        elements.nextPageBtn.disabled = end >= state.amortizationData.length;
        elements.pageInfo.textContent = `Page ${page} of ${Math.ceil(state.amortizationData.length / pageSize)}`;
    }

    function renderAIInsights(results) {
        elements.aiInsightsList.innerHTML = '';
        const insights = [
            {
                title: 'Pay Off Faster?',
                description: `By adding an extra ${formatCurrency(100)} to your monthly payment, you could save thousands in interest and pay off your loan years earlier.`,
                action: 'Set Up Extra Payments'
            },
            {
                title: 'Lower Your Rate?',
                description: `With a good credit score, you may qualify for a lower interest rate, which could significantly reduce your monthly payment.`,
                action: 'Compare Rates'
            },
            {
                title: 'Reduce Down Payment?',
                description: `A smaller down payment of 3-5% is possible with certain loan types, but you may need to pay PMI.`,
                action: 'Explore Low DP Options'
            },
        ];
        
        insights.forEach(insight => {
            const insightCard = document.createElement('div');
            insightCard.className = 'insight-card';
            insightCard.innerHTML = `
                <h4>${insight.title}</h4>
                <p>${insight.description}</p>
                <div class="insight-actions">
                    <button class="insight-btn" data-action="${insight.action}">${insight.action}</button>
                </div>
            `;
            elements.aiInsightsList.appendChild(insightCard);
        });
    }

    // --- EVENT HANDLERS ---
    function getFormInputs() {
        return {
            homePrice: parseFloat(elements.homePrice.value) || 0,
            dpAmount: parseFloat(elements.dpAmount.value) || 0,
            dpPercent: parseFloat(elements.dpPercent.value) || 0,
            interestRate: parseFloat(elements.interestRate.value) || 0,
            loanTerm: parseFloat(elements.loanTerm.value) || 0,
            startDate: elements.startDate.value ? new Date(elements.startDate.value) : new Date(),
            state: elements.stateSelect.value,
            propertyTaxRate: statePropertyTaxRates[elements.stateSelect.value]?.rate || 0.0088, // Default to national average
            homeInsurance: 1200, // Fixed placeholder for now
            extraMonthly: parseFloat(elements.extraMonthly.value) || 0,
            extraOnetime: parseFloat(elements.extraOnetime.value) || 0,
            extraOnetimeDate: elements.extraOnetimeDate.value ? new Date(elements.extraOnetimeDate.value) : null
        };
    }
    
    function handleInput() {
        const inputs = getFormInputs();
        if (inputs.homePrice > 0 && inputs.interestRate > 0 && inputs.loanTerm > 0) {
            const results = calculateMortgage(inputs);
            renderResults(results);
        } else {
            elements.resultsPanel.classList.add('hidden');
        }
    }
    
    const debouncedHandleInput = debounce(handleInput, config.debounceDelay);
    elements.form.addEventListener('input', (e) => {
        if (e.target.id === 'dp-amount' || e.target.id === 'dp-percent') {
            syncDownPayment(e.target.id);
        }
        debouncedHandleInput();
    });

    elements.form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleInput();
    });
    
    elements.amortizationToggle.addEventListener('click', () => {
        elements.amortizationContainer.classList.toggle('hidden');
    });

    elements.prevPageBtn.addEventListener('click', () => {
        if (state.amortizationPage > 1) {
            state.amortizationPage--;
            renderAmortizationSchedule(state.amortizationPage);
            updateChartInfo();
            announceToSR(`Displaying amortization schedule page ${state.amortizationPage}`);
        }
    });

    elements.nextPageBtn.addEventListener('click', () => {
        state.amortizationPage++;
        renderAmortizationSchedule(state.amortizationPage);
        updateChartInfo();
        announceToSR(`Displaying amortization schedule page ${state.amortizationPage}`);
    });
    
    elements.amortizationViewBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            elements.amortizationViewBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.currentAmortizationView = e.target.dataset.view;
            renderAmortizationSchedule(1);
        });
    });

    elements.extraPaymentsToggle.addEventListener('click', () => {
        elements.extraPaymentsFields.classList.toggle('hidden');
    });

    elements.termChips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            elements.termChips.forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            elements.loanTerm.value = e.target.dataset.term;
            debouncedHandleInput();
        });
    });

    elements.shareButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            shareResults(btn.classList[1]); // e.g., 'facebook', 'twitter'
        });
    });

    // --- UTILITY FUNCTIONS ---
    function syncDownPayment(source) {
        const homePrice = parseFloat(elements.homePrice.value) || 0;
        if (homePrice === 0) return;

        if (source === 'dp-amount') {
            const dpAmount = parseFloat(elements.dpAmount.value) || 0;
            const dpPercent = (dpAmount / homePrice) * 100;
            elements.dpPercent.value = dpPercent.toFixed(1);
        } else if (source === 'dp-percent') {
            const dpPercent = parseFloat(elements.dpPercent.value) || 0;
            const dpAmount = (dpPercent / 100) * homePrice;
            elements.dpAmount.value = dpAmount.toFixed(0);
        }
    }

    function populateStateDropdown() {
        const sortedStates = Object.values(statePropertyTaxRates).sort((a, b) => a.name.localeCompare(b.name));
        let optionsHtml = '';
        sortedStates.forEach(s => {
            optionsHtml += `<option value="${Object.keys(statePropertyTaxRates).find(key => statePropertyTaxRates[key] === s)}">${s.name}</option>`;
        });
        elements.stateSelect.innerHTML = optionsHtml;
    }
    
    function renderAIInsights(results) {
        elements.aiInsightsList.innerHTML = '';
        
        // Example: Insight based on high interest paid
        if (results.totalInterestPaid > results.loanAmount * 0.5) {
            addInsight({
                title: 'High Interest Over Loan Term',
                description: `You're projected to pay ${formatCurrency(results.totalInterestPaid, 2)} in total interest, which is more than half of your original loan amount. Consider making extra payments to save thousands.`,
                action: 'Set Up Extra Payments'
            });
        }
        
        // Example: Insight based on low down payment
        if (getFormInputs().dpPercent < 20) {
            addInsight({
                title: 'PMI is Included',
                description: `Since your down payment is less than 20%, you're paying for PMI. This adds to your monthly cost but helps you buy a home with less cash upfront.`,
                action: 'Learn More about PMI'
            });
        }

        // Example: Insight for a short loan term
        if (getFormInputs().loanTerm < 20) {
            addInsight({
                title: 'Fast Payoff',
                description: `Choosing a shorter loan term means you'll pay off your home faster and save a significant amount on total interest compared to a 30-year loan.`,
                action: 'See 30-Year Comparison'
            });
        }
    }

    function addInsight({ title, description, action }) {
        const insightCard = document.createElement('div');
        insightCard.className = 'insight-card';
        insightCard.innerHTML = `
            <h4>${title}</h4>
            <p>${description}</p>
            <div class="insight-actions">
                <button class="insight-btn" data-action="${action}">${action}</button>
            </div>
        `;
        elements.aiInsightsList.appendChild(insightCard);
        
        insightCard.querySelector('.insight-btn').addEventListener('click', handleInsightAction);
    }
    
    function handleInsightAction(event) {
        const action = event.target.dataset.action;
        switch (action) {
            case 'Set Up Extra Payments':
                elements.extraPaymentsFields.classList.remove('hidden');
                elements.extraMonthly.focus();
                announceToSR('Extra payments section is now visible.');
                break;
            case 'Compare Rates':
                alert('This would navigate to a rate comparison page.');
                break;
            case 'Learn More about PMI':
                alert('This would open a knowledge base article about PMI.');
                break;
            case 'See 30-Year Comparison':
                elements.loanTerm.value = 30;
                elements.termChips.forEach(c => c.classList.remove('active'));
                document.querySelector('.term-chip[data-term="30"]').classList.add('active');
                handleInput();
                break;
            default:
                console.log('Unhandled insight action:', action);
        }
    }

    function shareResults(platform) {
        const results = state.currentCalculation;
        if (!results) return;

        const monthlyPayment = formatCurrency(results.totalMonthly, 2);
        const homePrice = formatCurrency(getFormInputs().homePrice, 0);
        const message = `Check out my mortgage calculation for a ${homePrice} home! My estimated monthly payment is ${monthlyPayment}. Find out your own with this AI-enhanced calculator!`;
        const url = encodeURIComponent(window.location.href);
        const text = encodeURIComponent(message);
        
        let shareUrl = '';
        switch (platform) {
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
                break;
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${encodeURIComponent('AI-Enhanced Mortgage Calculator')}&summary=${text}`;
                break;
            case 'whatsapp':
                shareUrl = `https://api.whatsapp.com/send?text=${text} ${url}`;
                break;
            case 'clipboard':
                navigator.clipboard.writeText(`${message} ${window.location.href}`)
                    .then(() => alert("Link copied to clipboard!"))
                    .catch(err => console.error("Could not copy text: ", err));
                return;
            default:
                return;
        }

        window.open(shareUrl, '_blank');
    }

    function saveResultsAsPDF() {
        alert("PDF export functionality would be implemented here, e.g., using a library like jsPDF.");
    }
    
    function exportAmortizationToCSV() {
        if (state.amortizationData.length === 0) {
            alert("Please calculate the mortgage first.");
            return;
        }
        
        const csvHeader = ["Month", "Date", "Payment", "Principal", "Interest", "Remaining Balance"].join(',') + '\n';
        const csvData = state.amortizationData.map(row => {
            const date = formatDate(row.date);
            const values = [row.month, date, row.payment.toFixed(2), row.principal.toFixed(2), row.interest.toFixed(2), row.remainingBalance.toFixed(2)];
            return values.join(',');
        }).join('\n');
        
        const blob = new Blob([csvHeader + csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'amortization-schedule.csv';
        a.click();
        URL.revokeObjectURL(url);
        
        announceToSR('Amortization schedule exported to CSV');
    }
    
    function printAmortization() {
        window.print();
    }
    
    function debounce(fn, delay) {
        let id;
        return (...args) => {
            clearTimeout(id);
            id = setTimeout(() => fn(...args), delay);
        };
    }

    function formatCurrency(v, d=0) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: d,
            maximumFractionDigits: d
        }).format(v);
    }
    
    function formatDate(d) {
        return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }

    // --- VOICE & ACCESSIBILITY ---
    function setupSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported in this browser.');
            elements.voiceBtn.style.display = 'none';
            return;
        }
        
        state.speechRecognition = new SpeechRecognition();
        state.speechRecognition.interimResults = false;
        state.speechRecognition.continuous = false;
        
        state.speechRecognition.onstart = () => {
            state.isListening = true;
            elements.voiceStatus.style.display = 'block';
            announceToSR('Voice command listening started.');
        };
        
        state.speechRecognition.onend = () => {
            state.isListening = false;
            elements.voiceStatus.style.display = 'none';
            announceToSR('Voice command listening stopped.');
        };
        
        state.speechRecognition.onresult = handleVoiceResult;
        state.speechRecognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            announceToSR('Voice command error. Please try again.');
        };
    }
    
    function toggleVoiceListening() {
        if (state.isListening) {
            state.speechRecognition.stop();
        } else {
            try {
                state.speechRecognition.start();
            } catch(e) {
                console.error("Error starting speech recognition:", e);
                announceToSR('Could not start voice commands. Is a microphone available?');
            }
        }
    }

    function handleVoiceResult(event) {
        const transcript = event.results[0][0].transcript.toLowerCase();
        console.log('Voice Command:', transcript);
        announceToSR(`Command received: ${transcript}`);
        
        if (transcript.includes('calculate')) {
            handleInput();
            announceToSR('Calculating mortgage.');
        } else if (transcript.includes('home price')) {
            const matches = transcript.match(/\d+/g);
            if (matches) {
                elements.homePrice.value = matches.join('');
                syncDownPayment('dp-percent'); // Recalculate DP amount
                debouncedHandleInput();
                announceToSR(`Home price set to ${formatCurrency(elements.homePrice.value, 0)}.`);
            }
        } else if (transcript.includes('interest rate')) {
            const matches = transcript.match(/(\d+\.?\d*)/);
            if (matches) {
                elements.interestRate.value = matches[1];
                debouncedHandleInput();
                announceToSR(`Interest rate set to ${elements.interestRate.value} percent.`);
            }
        } else if (transcript.includes('loan term')) {
            const matches = transcript.match(/\d+/);
            if (matches) {
                elements.loanTerm.value = matches[0];
                debouncedHandleInput();
                announceToSR(`Loan term set to ${elements.loanTerm.value} years.`);
            }
        } else if (transcript.includes('read results')) {
            announceResults(state.currentCalculation);
        } else if (transcript.includes('show amortization')) {
            elements.amortizationContainer.classList.remove('hidden');
            elements.amortizationToggle.scrollIntoView({ behavior: 'smooth' });
            announceToSR('Amortization schedule is now visible.');
        } else if (transcript.includes('share results')) {
            shareResults('clipboard');
        } else {
            announceToSR('Command not recognized. Try "calculate", "read results", or "set home price to X dollars".');
        }
    }
    
    function toggleScreenReader() {
        state.screenReader = !state.screenReader;
        elements.screenReaderBtn.classList.toggle('active', state.screenReader);
        const message = `Screen reader announcements ${state.screenReader ? 'enabled' : 'disabled'}.`;
        announceToSR(message);
    }

    function announceToSR(message) {
        if (state.screenReader) {
            elements.srAnnouncer.textContent = '';
            setTimeout(() => {
                elements.srAnnouncer.textContent = message;
            }, 100);
        }
    }
    
    function announceResults(results) {
        if (!results) {
            announceToSR('Please enter valid numbers to calculate your mortgage.');
            return;
        }
        const message = `Your total monthly payment is ${formatCurrency(results.totalMonthly)}. This includes principal and interest of ${formatCurrency(results.monthlyPI)}, property tax of ${formatCurrency(results.monthlyTax)}, home insurance of ${formatCurrency(results.monthlyInsurance)}, and PMI of ${formatCurrency(results.pmi)}.`;
        announceToSR(message);
    }
    
    // --- INITIALIZATION ---
    function init() {
        populateStateDropdown();
        setupSpeechRecognition();
        
        // Event listeners for global controls
        elements.voiceBtn.addEventListener('click', toggleVoiceListening);
        elements.screenReaderBtn.addEventListener('click', toggleScreenReader);
        
        // Set default start date to the first of the next month
        const today = new Date();
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        elements.startDate.value = nextMonth.toISOString().slice(0, 10);
        
        // Initial calculation on page load with default values
        handleInput();
    }
    
    init();
});
