// ===================================
// MORTGAGE CALCULATOR JAVASCRIPT
// ===================================

class MortgageCalculator {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.initializeDefaults();
        this.initializeDatePicker();
    }

    initializeElements() {
        // Form elements
        this.form = document.getElementById('mortgageForm');
        this.homePrice = document.getElementById('homePrice');
        this.downPayment = document.getElementById('downPayment');
        this.interestRate = document.getElementById('interestRate');
        this.loanTerm = document.getElementById('loanTerm');
        this.state = document.getElementById('state');
        this.propertyTax = document.getElementById('propertyTax');
        this.homeInsurance = document.getElementById('homeInsurance');
        this.hoaFees = document.getElementById('hoaFees');
        this.pmiRate = document.getElementById('pmiRate');
        this.extraMonthly = document.getElementById('extraMonthly');
        this.extraYearly = document.getElementById('extraYearly');
        this.startDate = document.getElementById('startDate');

        // Loan type cards
        this.loanTypeCards = document.querySelectorAll('.loan-type-card');

        // Term buttons
        this.termButtons = document.querySelectorAll('.term-btn');

        // Results elements
        this.resultsSection = document.getElementById('resultsSection');
        this.totalPayment = document.getElementById('totalPayment');
        this.principalInterest = document.getElementById('principalInterest');
        this.monthlyPropertyTax = document.getElementById('monthlyPropertyTax');
        this.monthlyInsurance = document.getElementById('monthlyInsurance');
        this.monthlyPMI = document.getElementById('monthlyPMI');
        this.monthlyHOA = document.getElementById('monthlyHOA');
        this.loanAmount = document.getElementById('loanAmount');
        this.totalInterest = document.getElementById('totalInterest');
        this.totalCost = document.getElementById('totalCost');

        // PMI and HOA rows
        this.pmiRow = document.getElementById('pmiRow');
        this.hoaRow = document.getElementById('hoaRow');

        // AI Insights
        this.incomeRecommendation = document.getElementById('incomeRecommendation');
        this.emergencyFund = document.getElementById('emergencyFund');
        this.refinancingTip = document.getElementById('refinancingTip');

        // Amortization
        this.toggleSchedule = document.getElementById('toggleSchedule');
        this.amortizationSchedule = document.getElementById('amortizationSchedule');
        this.scheduleTableBody = document.getElementById('scheduleTableBody');

        // Chart
        this.paymentChart = document.getElementById('paymentChart');
        this.chartLegend = document.getElementById('chartLegend');

        // Mobile menu
        this.mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        this.navMenu = document.querySelector('.nav-menu');
    }

    bindEvents() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Real-time calculation on input change
        this.form.addEventListener('input', (e) => this.handleInputChange(e));
        this.form.addEventListener('change', (e) => this.handleInputChange(e));

        // Loan type selection
        this.loanTypeCards.forEach(card => {
            card.addEventListener('click', (e) => this.handleLoanTypeChange(e));
        });

        // Term button selection
        this.termButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleTermButtonClick(e));
        });

        // State change for auto property tax calculation
        this.state.addEventListener('change', () => this.updatePropertyTaxFromState());

        // Amortization schedule toggle
        this.toggleSchedule.addEventListener('click', () => this.toggleAmortizationSchedule());

        // Mobile menu toggle
        if (this.mobileMenuBtn) {
            this.mobileMenuBtn.addEventListener('click', () => this.toggleMobileMenu());
        }

        // Manual loan term input synchronization
        this.loanTerm.addEventListener('input', () => this.syncTermButtons());
    }

    initializeDefaults() {
        // Set default loan type as active
        this.loanTypeCards[0].classList.add('active');

        // Set default term button as active (30 years)
        this.termButtons.forEach(btn => btn.classList.remove('active'));
        const defaultTermBtn = document.querySelector('[data-term="30"]');
        if (defaultTermBtn) {
            defaultTermBtn.classList.add('active');
        }

        // Set default start date to current month
        const now = new Date();
        const currentMonth = now.toISOString().slice(0, 7) + '-01';
        this.startDate.value = currentMonth;
    }

    initializeDatePicker() {
        // Set minimum date to current month
        const now = new Date();
        const currentMonth = now.toISOString().slice(0, 7);
        this.startDate.min = currentMonth + '-01';

        // Set maximum date to 2 years from now
        const maxDate = new Date(now.getFullYear() + 2, now.getMonth(), 1);
        this.startDate.max = maxDate.toISOString().slice(0, 7) + '-01';
    }

    handleFormSubmit(e) {
        e.preventDefault();
        this.calculateMortgage();
    }

    handleInputChange(e) {
        // Debounce real-time calculations
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.calculateMortgage();
        }, 300);
    }

    handleLoanTypeChange(e) {
        // Remove active class from all cards
        this.loanTypeCards.forEach(card => card.classList.remove('active'));

        // Add active class to clicked card
        e.currentTarget.classList.add('active');

        // Update loan parameters based on type
        const loanType = e.currentTarget.dataset.type;
        this.updateLoanTypeParameters(loanType);

        // Recalculate
        this.calculateMortgage();
    }

    handleTermButtonClick(e) {
        e.preventDefault();

        // Remove active class from all buttons
        this.termButtons.forEach(btn => btn.classList.remove('active'));

        // Add active class to clicked button
        e.currentTarget.classList.add('active');

        // Update loan term input
        const term = e.currentTarget.dataset.term;
        this.loanTerm.value = term;

        // Recalculate
        this.calculateMortgage();
    }

    syncTermButtons() {
        const currentTerm = this.loanTerm.value;

        // Remove active class from all buttons
        this.termButtons.forEach(btn => btn.classList.remove('active'));

        // Add active class to matching button
        const matchingBtn = document.querySelector(`[data-term="${currentTerm}"]`);
        if (matchingBtn) {
            matchingBtn.classList.add('active');
        }
    }

    updateLoanTypeParameters(loanType) {
        switch (loanType) {
            case 'fha':
                this.downPayment.value = Math.min(parseFloat(this.downPayment.value) || 20, 3.5);
                this.pmiRate.value = 0.85;
                break;
            case 'va':
                this.downPayment.value = 0;
                this.pmiRate.value = 0;
                break;
            case 'usda':
                this.downPayment.value = 0;
                this.pmiRate.value = 0.35;
                break;
            case 'conventional':
            default:
                this.pmiRate.value = 0.5;
                break;
        }
    }

    updatePropertyTaxFromState() {
        const selectedOption = this.state.options[this.state.selectedIndex];
        if (selectedOption && selectedOption.dataset.taxRate) {
            const taxRate = parseFloat(selectedOption.dataset.taxRate);
            const homeValue = parseFloat(this.homePrice.value) || 400000;
            const annualPropertyTax = (homeValue * taxRate) / 100;
            this.propertyTax.value = Math.round(annualPropertyTax);

            // Trigger recalculation
            this.calculateMortgage();
        }
    }

    calculateMortgage() {
        try {
            const data = this.getFormData();
            if (!this.validateData(data)) return;

            const results = this.performCalculations(data);
            this.displayResults(results);
            this.generateAIInsights(results, data);
            this.updatePaymentChart(results);
            this.generateAmortizationSchedule(results, data);

            // Show results section
            this.resultsSection.style.display = 'block';
            this.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

        } catch (error) {
            console.error('Calculation error:', error);
            this.showError('An error occurred during calculation. Please check your inputs.');
        }
    }

    getFormData() {
        return {
            homePrice: parseFloat(this.homePrice.value) || 0,
            downPaymentPercent: parseFloat(this.downPayment.value) || 0,
            interestRate: parseFloat(this.interestRate.value) || 0,
            loanTermYears: parseFloat(this.loanTerm.value) || 0,
            annualPropertyTax: parseFloat(this.propertyTax.value) || 0,
            annualInsurance: parseFloat(this.homeInsurance.value) || 0,
            monthlyHOA: parseFloat(this.hoaFees.value) || 0,
            pmiRate: parseFloat(this.pmiRate.value) || 0,
            extraMonthlyPayment: parseFloat(this.extraMonthly.value) || 0,
            extraYearlyPayment: parseFloat(this.extraYearly.value) || 0,
            startDate: this.startDate.value || new Date().toISOString().slice(0, 10)
        };
    }

    validateData(data) {
        if (data.homePrice <= 0) {
            this.showError('Please enter a valid home price.');
            return false;
        }
        if (data.downPaymentPercent < 0 || data.downPaymentPercent >= 100) {
            this.showError('Down payment must be between 0% and 99%.');
            return false;
        }
        if (data.interestRate <= 0 || data.interestRate > 30) {
            this.showError('Please enter a valid interest rate.');
            return false;
        }
        if (data.loanTermYears <= 0 || data.loanTermYears > 50) {
            this.showError('Loan term must be between 1 and 50 years.');
            return false;
        }
        return true;
    }

    performCalculations(data) {
        // Basic calculations
        const downPaymentAmount = (data.homePrice * data.downPaymentPercent) / 100;
        const loanAmount = data.homePrice - downPaymentAmount;
        const monthlyRate = data.interestRate / 100 / 12;
        const numberOfPayments = data.loanTermYears * 12;

        // Monthly principal and interest
        let monthlyPI = 0;
        if (monthlyRate > 0) {
            monthlyPI = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
                       (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
        } else {
            monthlyPI = loanAmount / numberOfPayments;
        }

        // PMI calculation
        const needsPMI = data.downPaymentPercent < 20;
        const monthlyPMI = needsPMI ? (loanAmount * data.pmiRate / 100) / 12 : 0;

        // Other monthly costs
        const monthlyPropertyTax = data.annualPropertyTax / 12;
        const monthlyInsurance = data.annualInsurance / 12;
        const monthlyHOA = data.monthlyHOA;

        // Total monthly payment
        const totalMonthlyPayment = monthlyPI + monthlyPMI + monthlyPropertyTax + 
                                   monthlyInsurance + monthlyHOA;

        // Total interest calculation
        const totalInterest = (monthlyPI * numberOfPayments) - loanAmount;
        const totalCost = loanAmount + totalInterest;

        return {
            loanAmount,
            downPaymentAmount,
            monthlyPI,
            monthlyPMI,
            monthlyPropertyTax,
            monthlyInsurance,
            monthlyHOA,
            totalMonthlyPayment,
            totalInterest,
            totalCost,
            needsPMI,
            numberOfPayments,
            monthlyRate
        };
    }

    displayResults(results) {
        // Format currency values
        this.totalPayment.textContent = this.formatCurrency(results.totalMonthlyPayment);
        this.principalInterest.textContent = this.formatCurrency(results.monthlyPI);
        this.monthlyPropertyTax.textContent = this.formatCurrency(results.monthlyPropertyTax);
        this.monthlyInsurance.textContent = this.formatCurrency(results.monthlyInsurance);
        this.loanAmount.textContent = this.formatCurrency(results.loanAmount);
        this.totalInterest.textContent = this.formatCurrency(results.totalInterest);
        this.totalCost.textContent = this.formatCurrency(results.totalCost);

        // PMI row visibility and value
        if (results.needsPMI && results.monthlyPMI > 0) {
            this.monthlyPMI.textContent = this.formatCurrency(results.monthlyPMI);
            this.pmiRow.style.display = 'flex';
        } else {
            this.pmiRow.style.display = 'none';
        }

        // HOA row visibility and value
        if (results.monthlyHOA > 0) {
            this.monthlyHOA.textContent = this.formatCurrency(results.monthlyHOA);
            this.hoaRow.style.display = 'flex';
        } else {
            this.hoaRow.style.display = 'none';
        }
    }

    generateAIInsights(results, data) {
        // Income recommendation (28% rule)
        const recommendedIncome = results.totalMonthlyPayment / 0.28;
        const annualIncome = recommendedIncome * 12;

        this.incomeRecommendation.textContent = 
            `For comfortable affordability (28% housing ratio), your gross monthly income should be at least ${this.formatCurrency(recommendedIncome)} (${this.formatCurrency(annualIncome)} annually).`;

        // Emergency fund recommendation
        const emergencyFundAmount = results.totalMonthlyPayment * 6;
        this.emergencyFund.textContent = 
            `Maintain an emergency fund of at least ${this.formatCurrency(emergencyFundAmount)} (6 months of housing payments) before purchasing.`;

        // Refinancing tip
        const breakEvenRate = data.interestRate - 1.5;
        this.refinancingTip.textContent = 
            `If rates drop to ${breakEvenRate.toFixed(1)}% or below, refinancing could potentially save you significant money. Monitor rates regularly.`;
    }

    updatePaymentChart(results) {
        if (!this.paymentChart || !this.paymentChart.getContext) return;

        const ctx = this.paymentChart.getContext('2d');
        const data = [];
        const labels = [];
        const colors = ['#1e40af', '#059669', '#f59e0b', '#ef4444', '#8b5cf6'];

        // Add data points
        data.push(results.monthlyPI);
        labels.push('Principal & Interest');

        if (results.monthlyPropertyTax > 0) {
            data.push(results.monthlyPropertyTax);
            labels.push('Property Tax');
        }

        if (results.monthlyInsurance > 0) {
            data.push(results.monthlyInsurance);
            labels.push('Home Insurance');
        }

        if (results.monthlyPMI > 0) {
            data.push(results.monthlyPMI);
            labels.push('PMI');
        }

        if (results.monthlyHOA > 0) {
            data.push(results.monthlyHOA);
            labels.push('HOA Fees');
        }

        // Create simple pie chart
        this.drawPieChart(ctx, data, labels, colors);
        this.updateChartLegend(data, labels, colors);
    }

    drawPieChart(ctx, data, labels, colors) {
        const centerX = 150;
        const centerY = 150;
        const radius = 120;
        const total = data.reduce((sum, value) => sum + value, 0);

        let startAngle = 0;

        // Clear canvas
        ctx.clearRect(0, 0, 300, 300);

        data.forEach((value, index) => {
            const sliceAngle = (value / total) * 2 * Math.PI;

            // Draw slice
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
            ctx.lineTo(centerX, centerY);
            ctx.fillStyle = colors[index % colors.length];
            ctx.fill();
            ctx.stroke();

            startAngle += sliceAngle;
        });
    }

    updateChartLegend(data, labels, colors) {
        const total = data.reduce((sum, value) => sum + value, 0);

        this.chartLegend.innerHTML = labels.map((label, index) => {
            const value = data[index];
            const percentage = ((value / total) * 100).toFixed(1);
            return `
                <div class="legend-item">
                    <div class="legend-color" style="background-color: ${colors[index % colors.length]}"></div>
                    <span>${label}: ${this.formatCurrency(value)} (${percentage}%)</span>
                </div>
            `;
        }).join('');
    }

    generateAmortizationSchedule(results, data) {
        const schedule = this.calculateAmortizationSchedule(results, data);
        this.populateScheduleTable(schedule);
    }

    calculateAmortizationSchedule(results, data) {
        const schedule = [];
        let balance = results.loanAmount;
        const monthlyPayment = results.monthlyPI;
        const monthlyRate = results.monthlyRate;
        const startDate = new Date(data.startDate);

        for (let payment = 1; payment <= Math.min(results.numberOfPayments, 360); payment++) {
            const interestPayment = balance * monthlyRate;
            const principalPayment = monthlyPayment - interestPayment;
            balance -= principalPayment;

            const paymentDate = new Date(startDate);
            paymentDate.setMonth(paymentDate.getMonth() + payment - 1);

            const equity = results.loanAmount - balance;

            schedule.push({
                paymentNumber: payment,
                date: paymentDate,
                payment: monthlyPayment,
                principal: principalPayment,
                interest: interestPayment,
                balance: Math.max(0, balance),
                equity: equity
            });

            if (balance <= 0) break;
        }

        return schedule;
    }

    populateScheduleTable(schedule) {
        // Clear existing rows
        this.scheduleTableBody.innerHTML = '';

        // Add rows (limit to first 12 months for initial display)
        const displayCount = Math.min(schedule.length, 12);

        for (let i = 0; i < displayCount; i++) {
            const payment = schedule[i];
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${payment.paymentNumber}</td>
                <td>${this.formatDate(payment.date)}</td>
                <td>${this.formatCurrency(payment.payment)}</td>
                <td>${this.formatCurrency(payment.principal)}</td>
                <td>${this.formatCurrency(payment.interest)}</td>
                <td>${this.formatCurrency(payment.balance)}</td>
                <td>${this.formatCurrency(payment.equity)}</td>
            `;

            this.scheduleTableBody.appendChild(row);
        }

        // Add "show more" functionality if there are more payments
        if (schedule.length > 12) {
            const showMoreRow = document.createElement('tr');
            showMoreRow.innerHTML = `
                <td colspan="7" style="text-align: center; padding: 1rem;">
                    <button type="button" class="show-more-btn" onclick="calculator.showFullSchedule()">
                        Show All ${schedule.length} Payments
                    </button>
                </td>
            `;
            this.scheduleTableBody.appendChild(showMoreRow);
        }

        // Store full schedule for later use
        this.fullSchedule = schedule;
    }

    showFullSchedule() {
        if (!this.fullSchedule) return;

        // Clear and populate with full schedule
        this.scheduleTableBody.innerHTML = '';

        this.fullSchedule.forEach(payment => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${payment.paymentNumber}</td>
                <td>${this.formatDate(payment.date)}</td>
                <td>${this.formatCurrency(payment.payment)}</td>
                <td>${this.formatCurrency(payment.principal)}</td>
                <td>${this.formatCurrency(payment.interest)}</td>
                <td>${this.formatCurrency(payment.balance)}</td>
                <td>${this.formatCurrency(payment.equity)}</td>
            `;
            this.scheduleTableBody.appendChild(row);
        });
    }

    toggleAmortizationSchedule() {
        const schedule = this.amortizationSchedule;
        const button = this.toggleSchedule;
        const icon = button.querySelector('i');

        if (schedule.style.display === 'none' || !schedule.style.display) {
            schedule.style.display = 'block';
            schedule.classList.add('expanded');
            button.classList.add('expanded');
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
        } else {
            schedule.style.display = 'none';
            schedule.classList.remove('expanded');
            button.classList.remove('expanded');
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }
    }

    toggleMobileMenu() {
        this.navMenu.classList.toggle('mobile-active');
        const icon = this.mobileMenuBtn.querySelector('i');

        if (this.navMenu.classList.contains('mobile-active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short'
        }).format(date);
    }

    showError(message) {
        // Create or update error message display
        let errorDiv = document.getElementById('calculatorError');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'calculatorError';
            errorDiv.style.cssText = `
                background: #fee2e2;
                border: 1px solid #fca5a5;
                color: #dc2626;
                padding: 1rem;
                border-radius: 0.5rem;
                margin: 1rem 0;
                font-weight: 500;
            `;
            this.form.insertBefore(errorDiv, this.form.firstChild);
        }

        errorDiv.textContent = message;
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
}

// ===================================
// INITIALIZE CALCULATOR
// ===================================

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the calculator
    window.calculator = new MortgageCalculator();

    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add intersection observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.calculator-card, .insight-card, .loan-type-card').forEach(el => {
        observer.observe(el);
    });

    // Add loading state management
    window.addEventListener('beforeunload', () => {
        document.body.style.opacity = '0.7';
    });

    // Performance optimization: Preload critical resources
    const preloadLinks = [
        'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
    ];

    preloadLinks.forEach(href => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'style';
        link.href = href;
        document.head.appendChild(link);
    });

    // Add keyboard navigation support
    document.addEventListener('keydown', (e) => {
        // ESC key to close mobile menu
        if (e.key === 'Escape' && window.calculator.navMenu.classList.contains('mobile-active')) {
            window.calculator.toggleMobileMenu();
        }

        // Enter key to calculate when form is focused
        if (e.key === 'Enter' && e.target.form === window.calculator.form) {
            e.preventDefault();
            window.calculator.calculateMortgage();
        }
    });

    // Add form validation feedback
    const inputs = document.querySelectorAll('input[required], select[required]');
    inputs.forEach(input => {
        input.addEventListener('invalid', (e) => {
            e.target.style.borderColor = '#dc2626';
        });

        input.addEventListener('input', (e) => {
            if (e.target.checkValidity()) {
                e.target.style.borderColor = '';
            }
        });
    });

    console.log('🏠 Mortgage Calculator initialized successfully!');
});

// ===================================
// UTILITY FUNCTIONS
// ===================================

// Debounce function for performance
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

// Format number with commas
function formatNumber(num) {
    return new Intl.NumberFormat('en-US').format(num);
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Get URL parameters
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\[').replace(/[\]]/, '\]');
    const regex = new RegExp('[\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Local storage helpers
const Storage = {
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn('LocalStorage not available:', e);
        }
    },

    get: (key) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.warn('LocalStorage not available:', e);
            return null;
        }
    },

    remove: (key) => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn('LocalStorage not available:', e);
        }
    }
};

// Analytics tracking helper
function trackEvent(category, action, label, value) {
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            event_category: category,
            event_label: label,
            value: value
        });
    }
}

// Export for global access
window.MortgageCalculator = MortgageCalculator;
window.debounce = debounce;
window.formatNumber = formatNumber;
window.Storage = Storage;
window.trackEvent = trackEvent;
