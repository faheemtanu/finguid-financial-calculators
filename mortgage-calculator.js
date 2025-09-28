document.addEventListener('DOMContentLoaded', () => {
    // Select all necessary elements
    const elements = {
        form: document.getElementById('mortgage-form'),
        calculateBtn: document.getElementById('calculate-btn'),
        compareBtn: document.getElementById('compare-btn'),

        homePrice: document.getElementById('home-price'),
        downPayment: document.getElementById('down-payment'),
        loanTermInput: document.getElementById('loan-term-years'),
        interestRate: document.getElementById('interest-rate'),
        extraPayment: document.getElementById('extra-payment'),
        propertyTax: document.getElementById('property-tax'),
        homeInsuranceRate: document.getElementById('home-insurance-rate'),

        monthlyPaymentDisplay: document.getElementById('monthly-payment-display'),
        propertyTaxDisplay: document.getElementById('property-tax-display'),
        homeInsuranceDisplay: document.getElementById('home-insurance-display'),
        pmiDisplay: document.getElementById('pmi-display'),

        chartTab: document.getElementById('chart-tab'),
        insightsTab: document.getElementById('insights-tab'),
        amortizationTab: document.getElementById('amortization-tab'),

        chartPanel: document.getElementById('chart-panel'),
        insightsPanel: document.getElementById('insights-panel'),
        amortizationDetails: document.getElementById('amortization-details'),
        amortizationTableBody: document.getElementById('amortization-table-body'),

        insightsList: document.getElementById('insights-list'),

        loadingOverlay: document.getElementById('loading-overlay'),
        toastContainer: document.getElementById('toast-container'),
    };

    let savedMortgageData = null;

    // Initialize Tippy.js tooltips
    tippy('[data-tippy-content]');

    // Event listeners
    function init() {
        elements.calculateBtn.addEventListener('click', calculateMortgage);
        elements.compareBtn.addEventListener('click', compareMortgage);

        // Form input listeners for recalculation on change
        elements.homePrice.addEventListener('input', calculateMortgage);
        elements.downPayment.addEventListener('input', calculateMortgage);
        elements.loanTermInput.addEventListener('input', calculateMortgage);
        elements.interestRate.addEventListener('input', calculateMortgage);
        elements.extraPayment.addEventListener('input', calculateMortgage);
        elements.propertyTax.addEventListener('input', calculateMortgage);
        elements.homeInsuranceRate.addEventListener('input', calculateMortgage);

        // Tab listeners
        elements.chartTab.addEventListener('click', () => switchTab('chart'));
        elements.insightsTab.addEventListener('click', () => switchTab('insights'));

        // Calculate mortgage on initial load
        calculateMortgage();
    }

    function switchTab(tabName) {
        const tabs = ['chart', 'insights'];
        tabs.forEach(tab => {
            const tabBtn = document.getElementById(`${tab}-tab`);
            const tabPanel = document.getElementById(`${tab}-panel`);
            if (tab === tabName) {
                tabBtn.classList.add('active');
                tabPanel.classList.add('active');
                tabBtn.setAttribute('aria-selected', 'true');
                tabPanel.setAttribute('aria-hidden', 'false');
            } else {
                tabBtn.classList.remove('active');
                tabPanel.classList.remove('active');
                tabBtn.setAttribute('aria-selected', 'false');
                tabPanel.setAttribute('aria-hidden', 'true');
            }
        });
    }

    function calculateMortgage() {
        showLoading();

        // Get values from form
        const homePrice = parseFloat(elements.homePrice.value);
        const downPayment = parseFloat(elements.downPayment.value);
        const loanTerm = parseFloat(elements.loanTermInput.value);
        const interestRate = parseFloat(elements.interestRate.value) / 100;
        const extraPayment = parseFloat(elements.extraPayment.value);
        const annualPropertyTax = parseFloat(elements.propertyTax.value);
        const homeInsuranceRate = parseFloat(elements.homeInsuranceRate.value) / 100;

        const loanAmount = homePrice - downPayment;
        const monthlyInterestRate = interestRate / 12;
        const numberOfPayments = loanTerm * 12;

        // Set calculated insurance rate display
        document.getElementById('calculated-insurance-rate').textContent = `${(homeInsuranceRate * 100).toFixed(2)}%`;

        // Calculate P&I payment
        let monthlyPayment;
        if (monthlyInterestRate === 0) {
            monthlyPayment = loanAmount / numberOfPayments;
        } else {
            monthlyPayment = loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
        }

        // Calculate additional costs
        const monthlyPropertyTax = annualPropertyTax / 12;
        const monthlyHomeInsurance = homePrice * homeInsuranceRate / 12;
        const pmi = downPayment < homePrice * 0.2 ? loanAmount * 0.005 / 12 : 0; // 0.5% PMI

        // Total monthly payment
        const totalMonthlyPayment = monthlyPayment + monthlyPropertyTax + monthlyHomeInsurance + pmi;

        // Update displays
        elements.monthlyPaymentDisplay.textContent = `$${totalMonthlyPayment.toFixed(2)}`;
        elements.propertyTaxDisplay.textContent = `$${monthlyPropertyTax.toFixed(2)}`;
        elements.homeInsuranceDisplay.textContent = `$${monthlyHomeInsurance.toFixed(2)}`;
        elements.pmiDisplay.textContent = `$${pmi.toFixed(2)}`;

        // Generate amortization schedule and chart data
        const amortizationSchedule = generateAmortizationSchedule(loanAmount, monthlyInterestRate, monthlyPayment, numberOfPayments, extraPayment);
        renderAmortizationSchedule(amortizationSchedule);
        renderChart(amortizationSchedule);
        generateAIInsights(loanAmount, monthlyPayment, extraPayment, loanTerm, amortizationSchedule);

        hideLoading();
    }

    function generateAmortizationSchedule(loanAmount, monthlyInterestRate, monthlyPayment, numberOfPayments, extraPayment) {
        let schedule = [];
        let balance = loanAmount;
        let month = 0;
        let totalInterestPaid = 0;

        while (balance > 0 && month < numberOfPayments) {
            month++;
            const interestThisMonth = balance * monthlyInterestRate;
            const principalThisMonth = monthlyPayment - interestThisMonth;

            balance -= principalThisMonth + extraPayment;
            totalInterestPaid += interestThisMonth;

            schedule.push({
                month: month,
                startingBalance: balance + principalThisMonth + extraPayment,
                payment: monthlyPayment + extraPayment,
                principal: principalThisMonth,
                interest: interestThisMonth,
                endingBalance: Math.max(0, balance)
            });
        }
        return schedule;
    }

    function renderAmortizationSchedule(schedule) {
        const tableBody = elements.amortizationTableBody;
        tableBody.innerHTML = '';
        schedule.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.month}</td>
                <td>$${row.startingBalance.toFixed(2)}</td>
                <td>$${row.payment.toFixed(2)}</td>
                <td>$${row.principal.toFixed(2)}</td>
                <td>$${row.interest.toFixed(2)}</td>
                <td>$${row.endingBalance.toFixed(2)}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    function renderChart(schedule) {
        const labels = [];
        const principalData = [];
        const interestData = [];
        const monthly = schedule.filter((_, i) => i % 12 === 0);

        monthly.forEach(entry => {
            labels.push(`Year ${entry.month / 12}`);
            principalData.push(entry.principal);
            interestData.push(entry.interest);
        });

        const data = {
            labels: labels,
            series: [
                { name: 'Principal', data: principalData },
                { name: 'Interest', data: interestData }
            ]
        };

        const options = {
            stackBars: true,
            axisX: {
                labelInterpolationFnc: function(value, index) {
                    return index % 2 === 0 ? value : null;
                }
            },
            plugins: [
                Chartist.plugins.legend()
            ]
        };

        new Chartist.Bar('#mortgage-chart', data, options);
    }

    function generateAIInsights(loanAmount, monthlyPayment, extraPayment, loanTerm, schedule) {
        const insightsList = elements.insightsList;
        insightsList.innerHTML = '';

        let totalInterest = 0;
        schedule.forEach(entry => totalInterest += entry.interest);

        // Insight 1: Total Interest Paid
        const totalPayment = monthlyPayment * loanTerm * 12;
        const totalInterestPaid = totalPayment - loanAmount;
        const interestSavings = totalInterestPaid - totalInterest;

        const interestInsight = `Your total interest paid will be **$${totalInterest.toFixed(2)}**. This is a significant amount over the life of the loan.`;
        addInsight('info', 'Total Interest', interestInsight);

        // Insight 2: Extra Payment Savings
        if (extraPayment > 0) {
            const yearsSaved = (loanTerm * 12 - schedule.length) / 12;
            const extraPaymentInsight = `By paying an extra **$${extraPayment.toFixed(2)}** each month, you could pay off your loan **${yearsSaved.toFixed(1)} years** earlier and save **$${interestSavings.toFixed(2)}** in interest!`;
            addInsight('success', 'Extra Payment Power', extraPaymentInsight);
        }

        // Insight 3: Weekly Payment
        const totalInterestMonthly = totalPayment - loanAmount;
        const totalPaymentsWeekly = (monthlyPayment / 4) * (loanTerm * 52);
        const totalInterestWeekly = totalPaymentsWeekly - loanAmount;
        const weeklySavings = totalInterestMonthly - totalInterestWeekly;

        const weeklyInsight = `By paying weekly, your payment would be approximately $${(monthlyPayment / 4).toFixed(2)}. This could save you up to $${weeklySavings.toFixed(2)} in total interest over the life of the loan.`;
        addInsight('success', 'Weekly Payment Savings', weeklyInsight);
    }

    function addInsight(type, title, text) {
        const insightsList = elements.insightsList;
        const li = document.createElement('li');
        li.className = `insight-item ${type}`;
        li.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} icon"></i>
            <div class="text">
                <h4>${title}</h4>
                <p>${text}</p>
            </div>
        `;
        insightsList.appendChild(li);
    }

    function compareMortgage() {
        if (!savedMortgageData) {
            savedMortgageData = {
                homePrice: parseFloat(elements.homePrice.value),
                downPayment: parseFloat(elements.downPayment.value),
                loanTerm: parseFloat(elements.loanTermInput.value),
                interestRate: parseFloat(elements.interestRate.value) / 100,
                extraPayment: parseFloat(elements.extraPayment.value),
                propertyTax: parseFloat(elements.propertyTax.value),
                homeInsuranceRate: parseFloat(elements.homeInsuranceRate.value) / 100,
            };
            showToast('Current loan saved for comparison. Enter new values to compare.', 'info');
            elements.compareBtn.textContent = 'Show Comparison';
            elements.calculateBtn.textContent = 'Recalculate';
        } else {
            const currentData = {
                homePrice: parseFloat(elements.homePrice.value),
                downPayment: parseFloat(elements.downPayment.value),
                loanTerm: parseFloat(elements.loanTermInput.value),
                interestRate: parseFloat(elements.interestRate.value) / 100,
                extraPayment: parseFloat(elements.extraPayment.value),
                propertyTax: parseFloat(elements.propertyTax.value),
                homeInsuranceRate: parseFloat(elements.homeInsuranceRate.value) / 100,
            };
            displayComparison(savedMortgageData, currentData);
            savedMortgageData = null;
            elements.compareBtn.textContent = 'Compare Mortgage';
            elements.calculateBtn.textContent = 'Calculate Mortgage';
        }
    }

    function displayComparison(data1, data2) {
        // This is a placeholder. You would need to create a new section in your HTML
        // to display a comparison table or chart.
        alert(`Comparison:
        Loan 1: Term ${data1.loanTerm} years, Rate ${data1.interestRate * 100}%
        Loan 2: Term ${data2.loanTerm} years, Rate ${data2.interestRate * 100}%
        (You need to implement the full comparison UI)`);
    }

    function showLoading() {
        elements.loadingOverlay.style.display = 'flex';
    }

    function hideLoading() {
        elements.loadingOverlay.style.display = 'none';
    }

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        `;

        elements.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toast-out 0.3s ease-out forwards';
            setTimeout(() => {
                elements.toastContainer.removeChild(toast);
            }, 300);
        }, 3000);
    }

    init();
});
