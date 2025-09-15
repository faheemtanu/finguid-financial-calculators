// Enhanced Mortgage Calculator JavaScript Implementation
document.addEventListener('DOMContentLoaded', function() {
  'use strict';

  // Utility functions
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  
  // Formatting utilities
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  const formatCurrencyDetailed = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };
  
  const formatPercentage = (num, decimals = 1) => {
    return `${num.toFixed(decimals)}%`;
  };

  // Debounce utility for performance
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // US State property tax rates (annual percentage)
  const stateTaxRates = {
    'AL': 0.41, 'AK': 1.19, 'AZ': 0.62, 'AR': 0.61, 'CA': 0.75,
    'CO': 0.51, 'CT': 2.14, 'DE': 0.57, 'FL': 0.83, 'GA': 0.89,
    'HI': 0.28, 'ID': 0.63, 'IL': 2.27, 'IN': 0.85, 'IA': 1.53,
    'KS': 1.41, 'KY': 0.86, 'LA': 0.55, 'ME': 1.28, 'MD': 1.06,
    'MA': 1.17, 'MI': 1.54, 'MN': 1.12, 'MS': 0.61, 'MO': 0.97,
    'MT': 0.84, 'NE': 1.73, 'NV': 0.53, 'NH': 2.05, 'NJ': 2.49,
    'NM': 0.55, 'NY': 1.69, 'NC': 0.84, 'ND': 0.98, 'OH': 1.56,
    'OK': 0.90, 'OR': 0.87, 'PA': 1.58, 'RI': 1.53, 'SC': 0.57,
    'SD': 1.32, 'TN': 0.64, 'TX': 1.81, 'UT': 0.58, 'VT': 1.90,
    'VA': 0.82, 'WA': 0.94, 'WV': 0.59, 'WI': 1.85, 'WY': 0.62
  };

  // State names for reference
  const stateNames = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
    'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
    'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
    'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
    'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
    'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
    'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
    'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
    'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
    'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
    'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
    'WI': 'Wisconsin', 'WY': 'Wyoming'
  };

  // Calculator state
  let calculatorState = {
    currentMode: 'payment',
    activeTerm: 30,
    usePctDownPayment: false,
    comparisons: [],
    recognition: null,
    currentCalculation: null,
    isAdvancedMode: false
  };

  // DOM Elements cache
  const elements = {
    // Form inputs
    homePrice: $('#home-price'),
    dpAmount: $('#dp-amount'),
    dpPercent: $('#dp-percent'),
    interestRate: $('#interest-rate'),
    termCustom: $('#term-custom'),
    state: $('#state'),
    propertyTax: $('#property-tax'),
    homeInsurance: $('#home-insurance'),
    pmiRate: $('#pmi-rate'),
    hoaFees: $('#hoa-fees'),
    extraMonthly: $('#extra-monthly'),
    extraOnce: $('#extra-once'),

    // UI controls
    tabAmount: $('#tab-amount'),
    tabPercent: $('#tab-percent'),
    dpAmountWrap: $('#dp-amount-wrap'),
    dpPercentWrap: $('#dp-percent-wrap'),
    pmiBanner: $('#pmi-banner'),
    termButtons: $('#term-buttons'),
    advancedToggle: $('#advanced-toggle'),
    advancedPanel: $('#advanced-panel'),

    // Results
    totalPayment: $('#total-payment'),
    loanAmount: $('#loan-amount'),
    totalInterest: $('#total-interest'),
    piAmount: $('#pi-amount'),
    taxAmount: $('#tax-amount'),
    insuranceAmount: $('#insurance-amount'),
    pmiAmount: $('#pmi-amount'),
    hoaAmount: $('#hoa-amount'),
    rowPmi: $('#row-pmi'),

    // Charts and tables
    breakdownChart: $('#breakdownChart'),
    legendBreakdown: $('#legend-breakdown'),
    amortizationBody: $('#amortization-body'),
    fullScheduleBody: $('#full-schedule-body'),
    scheduleModal: $('#schedule-modal'),

    // Modal elements
    modalLoanAmount: $('#modal-loan-amount'),
    modalInterestRate: $('#modal-interest-rate'),
    modalLoanTerm: $('#modal-loan-term'),

    // Action buttons
    calculateBtn: $('#calculate-btn'),
    resetBtn: $('#reset-form'),
    emailBtn: $('#email-results'),
    shareBtn: $('#share-results'),
    printBtn: $('#print-results'),
    viewFullSchedule: $('#view-full-schedule'),
    closeSchedule: $('#close-schedule'),

    // Voice and AI
    voiceBtns: $$('.voice-btn'),
    voiceStatus: $('#voice-status'),

    // Insights and comparison
    insightsList: $('#insights-list'),
    comparisonCards: $('#comparison-cards'),
    scenarioBtns: $$('.scenario-btn')
  };

  // Initialize calculator
  function init() {
    setupEventListeners();
    setupVoiceRecognition();
    setInitialValues();
    populateStateDropdown();
    calculate();
  }

  // Event listeners setup
  function setupEventListeners() {
    // Down payment tabs
    if (elements.tabAmount) {
      elements.tabAmount.addEventListener('click', () => switchDPMode(false));
    }
    if (elements.tabPercent) {
      elements.tabPercent.addEventListener('click', () => switchDPMode(true));
    }

    // Input synchronization
    if (elements.homePrice) {
      elements.homePrice.addEventListener('input', handleHomePriceChange);
    }
    if (elements.dpAmount) {
      elements.dpAmount.addEventListener('input', () => syncDownPayment(false));
    }
    if (elements.dpPercent) {
      elements.dpPercent.addEventListener('input', () => syncDownPayment(true));
    }
    if (elements.state) {
      elements.state.addEventListener('change', updatePropertyTax);
      elements.state.addEventListener('change', calculate);
    }

    // Property tax change should trigger calculation
    if (elements.propertyTax) {
      elements.propertyTax.addEventListener('input', debounce(calculate, 300));
    }

    // Term selection
    if (elements.termButtons) {
      elements.termButtons.addEventListener('click', (e) => {
        const btn = e.target.closest('.chip[data-term]');
        if (btn) setTerm(parseInt(btn.dataset.term));
      });
    }

    if (elements.termCustom) {
      elements.termCustom.addEventListener('input', handleCustomTerm);
    }

    // Advanced options
    if (elements.advancedToggle) {
      elements.advancedToggle.addEventListener('click', toggleAdvanced);
    }

    // Auto-calculation on input changes
    const autoCalcInputs = [
      elements.homePrice, elements.dpAmount, elements.dpPercent,
      elements.interestRate, elements.homeInsurance,
      elements.pmiRate, elements.hoaFees, elements.extraMonthly, elements.extraOnce
    ].filter(Boolean);

    autoCalcInputs.forEach(input => {
      input.addEventListener('input', debounce(calculate, 300));
    });

    // Action buttons
    if (elements.calculateBtn) {
      elements.calculateBtn.addEventListener('click', calculate);
    }
    if (elements.resetBtn) {
      elements.resetBtn.addEventListener('click', resetForm);
    }
    if (elements.emailBtn) {
      elements.emailBtn.addEventListener('click', emailResults);
    }
    if (elements.shareBtn) {
      elements.shareBtn.addEventListener('click', shareResults);
    }
    if (elements.printBtn) {
      elements.printBtn.addEventListener('click', () => window.print());
    }
    if (elements.viewFullSchedule) {
      elements.viewFullSchedule.addEventListener('click', showFullSchedule);
    }
    if (elements.closeSchedule) {
      elements.closeSchedule.addEventListener('click', () => elements.scheduleModal?.close());
    }

    // Voice buttons
    elements.voiceBtns.forEach(btn => {
      btn.addEventListener('click', () => startVoiceInput(btn.dataset.field));
    });

    // Voice status close
    const voiceClose = $('.voice-close');
    if (voiceClose) {
      voiceClose.addEventListener('click', hideVoiceStatus);
    }

    // Comparison scenarios
    elements.scenarioBtns.forEach(btn => {
      btn.addEventListener('click', () => loadScenario(btn.dataset.scenario));
    });

    // Modal backdrop click
    if (elements.scheduleModal) {
      elements.scheduleModal.addEventListener('click', (e) => {
        if (e.target === elements.scheduleModal) {
          elements.scheduleModal.close();
        }
      });
    }

    // Mobile menu toggle
    const mobileToggle = $('.mobile-menu-toggle');
    const navMenu = $('.nav-menu');
    if (mobileToggle && navMenu) {
      mobileToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
      });
    }
  }

  // Voice recognition setup
  function setupVoiceRecognition() {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        elements.voiceBtns.forEach(btn => btn.style.display = 'none');
        return;
      }

      calculatorState.recognition = new SpeechRecognition();
      calculatorState.recognition.continuous = false;
      calculatorState.recognition.interimResults = false;
      calculatorState.recognition.lang = 'en-US';
      calculatorState.recognition.maxAlternatives = 1;

      calculatorState.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        processVoiceCommand(transcript);
      };

      calculatorState.recognition.onerror = (event) => {
        console.error('Voice recognition error:', event.error);
        hideVoiceStatus();
        showNotification('Voice recognition error. Please try again.', 'error');
      };

      calculatorState.recognition.onend = hideVoiceStatus;
    } catch (error) {
      console.warn('Voice recognition not available:', error);
      elements.voiceBtns.forEach(btn => btn.style.display = 'none');
    }
  }

  // Populate state dropdown
  function populateStateDropdown() {
    if (!elements.state) return;

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select State';
    elements.state.appendChild(defaultOption);

    Object.entries(stateNames).forEach(([code, name]) => {
      const option = document.createElement('option');
      option.value = code;
      option.textContent = `${name} (${code})`;
      elements.state.appendChild(option);
    });

    // Set default to California
    elements.state.value = 'CA';
  }

  // Set initial values
  function setInitialValues() {
    setTerm(30);
    switchDPMode(false);
    updatePropertyTax();
    updateInsurance();
  }

  // Down payment mode switching
  function switchDPMode(usePercent) {
    calculatorState.usePctDownPayment = usePercent;
    
    if (elements.tabAmount) elements.tabAmount.classList.toggle('active', !usePercent);
    if (elements.tabPercent) elements.tabPercent.classList.toggle('active', usePercent);
    if (elements.dpAmountWrap) elements.dpAmountWrap.classList.toggle('hidden', usePercent);
    if (elements.dpPercentWrap) elements.dpPercentWrap.classList.toggle('hidden', !usePercent);
    
    syncDownPayment(usePercent);
  }

  // Sync down payment inputs
  function syncDownPayment(fromPercent) {
    const homePrice = parseFloat(elements.homePrice?.value || 0);
    
    if (fromPercent) {
      const pct = Math.min(100, Math.max(0, parseFloat(elements.dpPercent?.value || 0)));
      const amt = Math.round(homePrice * pct / 100);
      if (elements.dpAmount) elements.dpAmount.value = amt;
    } else {
      const amt = Math.min(homePrice, Math.max(0, parseFloat(elements.dpAmount?.value || 0)));
      const pct = homePrice > 0 ? (amt / homePrice * 100) : 0;
      if (elements.dpPercent) elements.dpPercent.value = pct.toFixed(1);
    }
    
    updatePMIBanner();
  }

  // Handle home price changes
  function handleHomePriceChange() {
    syncDownPayment(calculatorState.usePctDownPayment);
    updatePropertyTax();
    updateInsurance();
    calculate();
  }

  // Update PMI banner
  function updatePMIBanner() {
    if (!elements.pmiBanner || !elements.dpPercent) return;
    
    const dpPct = parseFloat(elements.dpPercent.value || 0);
    const needsPMI = dpPct < 20;
    
    elements.pmiBanner.classList.toggle('hidden', !needsPMI);
    
    if (needsPMI) {
      elements.pmiBanner.innerHTML = `
        <i class="fas fa-info-circle"></i>
        <div>
          <strong>PMI Required</strong><br>
          Down payment is ${formatPercentage(dpPct)} (less than 20% of home value)
        </div>
      `;
    }
  }

  // Update property tax based on state
  function updatePropertyTax() {
    if (!elements.propertyTax || !elements.state || !elements.homePrice) return;
    
    const homePrice = parseFloat(elements.homePrice.value || 0);
    const state = elements.state.value;
    
    if (!state || !homePrice) return;
    
    const taxRate = stateTaxRates[state] || 1.0;
    const annualTax = Math.round(homePrice * (taxRate / 100));
    elements.propertyTax.value = annualTax;
  }

  // Update insurance estimate
  function updateInsurance() {
    if (!elements.homeInsurance || !elements.homePrice) return;
    
    const homePrice = parseFloat(elements.homePrice.value || 0);
    const estimate = Math.round(homePrice * 0.0024); // ~0.24% of home value
    elements.homeInsurance.value = Math.max(600, Math.min(estimate, 3000));
  }

  // Term selection
  function setTerm(years) {
    calculatorState.activeTerm = years;
    
    $$('[data-term]').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.term) === years);
    });
    
    if (elements.termCustom) elements.termCustom.value = '';
    calculate();
  }

  // Handle custom term input
  function handleCustomTerm() {
    if (!elements.termCustom) return;
    
    const customYears = parseInt(elements.termCustom.value);
    if (customYears >= 1 && customYears <= 40) {
      calculatorState.activeTerm = customYears;
      $$('[data-term]').forEach(btn => btn.classList.remove('active'));
    }
    calculate();
  }

  // Toggle advanced options
  function toggleAdvanced() {
    if (!elements.advancedPanel || !elements.advancedToggle) return;
    
    calculatorState.isAdvancedMode = !calculatorState.isAdvancedMode;
    
    elements.advancedPanel.classList.toggle('hidden', !calculatorState.isAdvancedMode);
    elements.advancedToggle.classList.toggle('active', calculatorState.isAdvancedMode);
    
    const arrow = elements.advancedToggle.querySelector('.arrow');
    if (arrow) {
      arrow.classList.toggle('rotated', calculatorState.isAdvancedMode);
    }
  }

  // Voice input functions
  function startVoiceInput(field) {
    if (!calculatorState.recognition) {
      showNotification('Voice input not supported in this browser', 'error');
      return;
    }
    
    showVoiceStatus();
    calculatorState.recognition.start();
  }

  function processVoiceCommand(transcript) {
    console.log('Voice command:', transcript);
    
    const numbers = transcript.match(/\d+(?:\.\d+)?/g);
    
    if (transcript.includes('home price') || transcript.includes('house price')) {
      if (numbers && numbers.length > 0) {
        let value = parseFloat(numbers[0]);
        if (value < 10000) value *= 1000;
        if (elements.homePrice) {
          elements.homePrice.value = value;
          handleHomePriceChange();
        }
        showNotification(`Home price set to ${formatCurrency(value)}`, 'success');
      }
    } else if (transcript.includes('down payment')) {
      if (numbers && numbers.length > 0) {
        let value = parseFloat(numbers[0]);
        if (transcript.includes('percent')) {
          calculatorState.usePctDownPayment = true;
          switchDPMode(true);
          if (elements.dpPercent) {
            elements.dpPercent.value = value;
            syncDownPayment(true);
          }
        } else {
          if (value < 1000) value *= 1000;
          calculatorState.usePctDownPayment = false;
          switchDPMode(false);
          if (elements.dpAmount) {
            elements.dpAmount.value = value;
            syncDownPayment(false);
          }
        }
        showNotification('Down payment updated', 'success');
      }
    } else if (transcript.includes('interest rate') || transcript.includes('rate')) {
      if (numbers && numbers.length > 0) {
        const value = parseFloat(numbers[0]);
        if (elements.interestRate) {
          elements.interestRate.value = value;
        }
        showNotification(`Interest rate set to ${formatPercentage(value)}`, 'success');
      }
    } else if (transcript.includes('calculate')) {
      calculate();
      showNotification('Calculation completed!', 'success');
    } else {
      showNotification('Try saying: "home price 400000" or "interest rate 6.5"', 'info');
    }
    
    calculate();
  }

  function showVoiceStatus() {
    if (elements.voiceStatus) {
      elements.voiceStatus.classList.add('active');
    }
  }

  function hideVoiceStatus() {
    if (elements.voiceStatus) {
      elements.voiceStatus.classList.remove('active');
    }
  }

  // Main calculation function
  function calculate() {
    try {
      const result = calculatePayment();
      if (result) {
        calculatorState.currentCalculation = result;
        updateDisplay(result);
        generateInsights(result);
        updateCharts(result);
        updateAmortizationTable(result);
        updateComparisonScenarios(result);
      }
    } catch (error) {
      console.error('Calculation error:', error);
      showNotification('Calculation error. Please check your inputs.', 'error');
    }
  }

  // Payment calculation
  function calculatePayment() {
    const homePrice = parseFloat(elements.homePrice?.value || 0);
    const dpAmount = parseFloat(elements.dpAmount?.value || 0);
    const loanAmount = Math.max(0, homePrice - dpAmount);
    const rate = parseFloat(elements.interestRate?.value || 0) / 100;
    const term = parseInt(elements.termCustom?.value) || calculatorState.activeTerm;
    const months = term * 12;

    if (!homePrice || !rate || !term) return null;

    // Property costs
    const annualTax = parseFloat(elements.propertyTax?.value || 0);
    const annualInsurance = parseFloat(elements.homeInsurance?.value || 0);
    const pmiRate = parseFloat(elements.pmiRate?.value || 0) / 100;
    const monthlyHOA = parseFloat(elements.hoaFees?.value || 0);
    const extraMonthly = parseFloat(elements.extraMonthly?.value || 0);
    const extraOnce = parseFloat(elements.extraOnce?.value || 0);

    // Calculate monthly P&I
    const monthlyRate = rate / 12;
    let monthlyPI = 0;
    
    if (monthlyRate > 0) {
      monthlyPI = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                  (Math.pow(1 + monthlyRate, months) - 1);
    } else {
      monthlyPI = loanAmount / months;
    }

    // Other monthly costs
    const monthlyTax = annualTax / 12;
    const monthlyInsurance = annualInsurance / 12;
    const dpPercent = homePrice > 0 ? (dpAmount / homePrice * 100) : 0;
    const needsPMI = dpPercent < 20;
    const monthlyPMI = needsPMI ? (loanAmount * pmiRate / 12) : 0;
    const totalMonthly = monthlyPI + monthlyTax + monthlyInsurance + monthlyPMI + monthlyHOA;

    // Generate amortization schedule with extra payments
    const schedule = generateSchedule(loanAmount, monthlyRate, monthlyPI, months, extraMonthly, extraOnce);
    const totalInterest = schedule.reduce((sum, payment) => sum + payment.interest, 0);

    return {
      mode: 'payment',
      homePrice,
      dpAmount,
      dpPercent,
      loanAmount,
      rate: rate * 100,
      term,
      monthlyPI,
      monthlyTax,
      monthlyInsurance,
      monthlyPMI,
      monthlyHOA,
      totalMonthly,
      totalInterest,
      totalCost: loanAmount + totalInterest,
      needsPMI,
      schedule,
      extraMonthly,
      extraOnce
    };
  }

  // Generate amortization schedule
  function generateSchedule(loanAmount, monthlyRate, monthlyPI, totalMonths, extraMonthly = 0, extraOnce = 0) {
    const schedule = [];
    let balance = loanAmount;
    let totalExtra = 0;

    for (let month = 1; month <= totalMonths && balance > 0; month++) {
      const interestPayment = balance * monthlyRate;
      let principalPayment = monthlyPI - interestPayment;
      let extraPayment = 0;

      // Add extra payments
      if (month === 1 && extraOnce > 0) {
        extraPayment += Math.min(extraOnce, balance - principalPayment);
      }
      if (extraMonthly > 0) {
        extraPayment += Math.min(extraMonthly, balance - principalPayment);
      }

      totalExtra += extraPayment;
      principalPayment += extraPayment;

      // Ensure we don't overpay
      if (principalPayment > balance) {
        principalPayment = balance;
        extraPayment = principalPayment - (monthlyPI - interestPayment);
      }

      balance = Math.max(0, balance - principalPayment);

      schedule.push({
        month,
        payment: monthlyPI + extraPayment,
        principal: principalPayment,
        interest: interestPayment,
        extra: extraPayment,
        balance
      });

      if (balance === 0) break;
    }

    return schedule;
  }

  // Update display based on calculation mode
  function updateDisplay(result) {
    updatePaymentDisplay(result);
  }

  // Update payment mode display
  function updatePaymentDisplay(result) {
    if (elements.totalPayment) elements.totalPayment.textContent = formatCurrency(result.totalMonthly);
    if (elements.loanAmount) elements.loanAmount.textContent = formatCurrency(result.loanAmount);
    if (elements.totalInterest) elements.totalInterest.textContent = formatCurrency(result.totalInterest);
    if (elements.piAmount) elements.piAmount.textContent = formatCurrency(result.monthlyPI);
    if (elements.taxAmount) elements.taxAmount.textContent = formatCurrency(result.monthlyTax);
    if (elements.insuranceAmount) elements.insuranceAmount.textContent = formatCurrency(result.monthlyInsurance);
    if (elements.pmiAmount) elements.pmiAmount.textContent = formatCurrency(result.monthlyPMI);
    if (elements.hoaAmount) elements.hoaAmount.textContent = formatCurrency(result.monthlyHOA);

    // Show/hide PMI row
    if (elements.rowPmi) {
      elements.rowPmi.classList.toggle('hidden', !result.needsPMI);
    }
  }

  // Update charts
  function updateCharts(result) {
    if (result.mode !== 'payment') return;

    const breakdownData = [
      result.monthlyPI,
      result.monthlyTax,
      result.monthlyInsurance,
      result.monthlyPMI,
      result.monthlyHOA
    ].filter(value => value > 0);

    const colors = ['#21808d', '#a84b2f', '#626c71', '#ef4444', '#94a3b8'];
    const labels = ['Principal & Interest', 'Taxes', 'Insurance', 'PMI', 'HOA'].filter((_, index) => 
      [result.monthlyPI, result.monthlyTax, result.monthlyInsurance, result.monthlyPMI, result.monthlyHOA][index] > 0
    );

    if (elements.breakdownChart) {
      drawPieChart(elements.breakdownChart, breakdownData, colors, labels);
    }
  }

  // Draw pie chart
  function drawPieChart(canvas, data, colors, labels) {
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height, 300);
    
    canvas.width = size;
    canvas.height = size;
    
    ctx.clearRect(0, 0, size, size);
    
    const total = data.reduce((sum, value) => sum + value, 0);
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = Math.min(centerX, centerY) * 0.8;
    
    let startAngle = -Math.PI / 2;
    
    data.forEach((value, index) => {
      if (value > 0) {
        const angle = (value / total) * 2 * Math.PI;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + angle);
        ctx.closePath();
        ctx.fillStyle = colors[index];
        ctx.fill();
        
        startAngle += angle;
      }
    });

    // Update legend
    if (elements.legendBreakdown) {
      let legendHTML = '';
      data.forEach((value, index) => {
        if (value > 0) {
          legendHTML += `
            <div class="legend-item">
              <span class="legend-color" style="background-color: ${colors[index]}"></span>
              <span>${labels[index]}: ${formatCurrency(value)}</span>
            </div>
          `;
        }
      });
      elements.legendBreakdown.innerHTML = legendHTML;
    }
  }

  // Generate insights
  function generateInsights(result) {
    if (!elements.insightsList) return;

    const insights = [];

    // PMI insight
    if (result.needsPMI) {
      const monthlyPMI = result.monthlyPMI;
      const annualPMI = monthlyPMI * 12;
      insights.push({
        icon: 'fas fa-shield-alt',
        title: 'PMI Impact',
        message: `You'll pay ${formatCurrency(monthlyPMI)}/month (${formatCurrency(annualPMI)}/year) for PMI. Consider increasing your down payment to 20% to eliminate PMI.`,
        type: 'warning'
      });
    }

    // Interest vs principal insight
    const totalPaid = result.totalCost;
    const interestRatio = (result.totalInterest / totalPaid) * 100;
    insights.push({
      icon: 'fas fa-chart-pie',
      title: 'Interest vs Principal',
      message: `Over the life of the loan, ${formatPercentage(interestRatio, 1)} of your payments (${formatCurrency(result.totalInterest)}) will go toward interest.`,
      type: 'info'
    });

    // Extra payment insight
    if (result.extraMonthly > 0) {
      const scheduleWithoutExtra = generateSchedule(result.loanAmount, result.rate / 100 / 12, result.monthlyPI, result.term * 12, 0, 0);
      const regularInterest = scheduleWithoutExtra.reduce((sum, payment) => sum + payment.interest, 0);
      const interestSaved = regularInterest - result.totalInterest;
      const monthsSaved = (result.term * 12) - result.schedule.length;
      
      insights.push({
        icon: 'fas fa-piggy-bank',
        title: 'Extra Payment Benefits',
        message: `Your extra ${formatCurrency(result.extraMonthly)}/month saves ${formatCurrency(interestSaved)} in interest and pays off your loan ${monthsSaved} months early.`,
        type: 'success'
      });
    } else {
      const extraAmount = Math.round(result.monthlyPI * 0.1);
      const scheduleWithExtra = generateSchedule(result.loanAmount, result.rate / 100 / 12, result.monthlyPI, result.term * 12, extraAmount, 0);
      const regularInterest = result.totalInterest;
      const extraInterest = scheduleWithExtra.reduce((sum, payment) => sum + payment.interest, 0);
      const potentialSavings = regularInterest - extraInterest;
      const monthsSaved = (result.term * 12) - scheduleWithExtra.length;
      
      insights.push({
        icon: 'fas fa-lightbulb',
        title: 'Extra Payment Opportunity',
        message: `Adding just ${formatCurrency(extraAmount)}/month could save ${formatCurrency(potentialSavings)} in interest and pay off your loan ${monthsSaved} months early.`,
        type: 'tip'
      });
    }

    // Refinancing insight
    if (result.rate > 6.0) {
      insights.push({
        icon: 'fas fa-sync-alt',
        title: 'Refinancing Opportunity',
        message: `Your rate of ${formatPercentage(result.rate)} is above current market averages. Consider refinancing if rates drop to save on monthly payments.`,
        type: 'tip'
      });
    }

    renderInsights(insights);
  }

  // Render insights
  function renderInsights(insights) {
    if (!elements.insightsList) return;

    const iconMap = {
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle',
      success: 'fas fa-check-circle',
      tip: 'fas fa-lightbulb'
    };

    const html = insights.map(insight => `
      <li class="insight-item">
        <div class="insight-icon">
          <i class="${insight.icon || iconMap[insight.type]}"></i>
        </div>
        <div class="insight-content">
          <h4>${insight.title}</h4>
          <p>${insight.message}</p>
        </div>
      </li>
    `).join('');

    elements.insightsList.innerHTML = html;
  }

  // Update amortization table
  function updateAmortizationTable(result) {
    if (!elements.amortizationBody) return;

    const schedule = result.schedule.slice(0, 60); // First 5 years
    
    const html = schedule.map(payment => `
      <tr>
        <td>${payment.month}</td>
        <td class="currency">${formatCurrencyDetailed(payment.payment)}</td>
        <td class="currency">${formatCurrencyDetailed(payment.principal)}</td>
        <td class="currency">${formatCurrencyDetailed(payment.interest)}</td>
        <td class="currency">${formatCurrency(payment.balance)}</td>
      </tr>
    `).join('');

    elements.amortizationBody.innerHTML = html;
  }

  // Update comparison scenarios
  function updateComparisonScenarios(result) {
    if (!elements.comparisonCards) return;
    
    const scenarios = [
      {
        title: 'Current Scenario',
        icon: 'fas fa-home',
        color: 'primary',
        data: result
      },
      {
        title: 'Lower Interest Rate',
        icon: 'fas fa-arrow-down',
        color: 'warning',
        data: calculateScenario(result, { rate: result.rate * 0.8 }) // 20% lower rate
      },
      {
        title: 'Higher Down Payment',
        icon: 'fas fa-arrow-up',
        color: 'info',
        data: calculateScenario(result, { dpPercent: Math.min(100, result.dpPercent + 10) }) // 10% more down payment
      },
      {
        title: 'Shorter Term',
        icon: 'fas fa-clock',
        color: 'error',
        data: calculateScenario(result, { term: Math.max(5, result.term - 5) }) // 5 years shorter term
      }
    ];
    
    const html = scenarios.map((scenario, index) => {
      const savings = scenario.data.totalMonthly - result.totalMonthly;
      const savingsPercent = ((savings / result.totalMonthly) * 100).toFixed(1);
      
      return `
        <div class="comparison-card">
          <div class="comparison-header">
            <h4 class="comparison-title">${scenario.title}</h4>
            ${savings < 0 ? `<span class="comparison-savings">Save ${formatCurrency(-savings)}/mo</span>` : ''}
          </div>
          <div class="comparison-details">
            <div class="comparison-row">
              <span>Monthly Payment</span>
              <span class="currency">${formatCurrency(scenario.data.totalMonthly)}</span>
            </div>
            <div class="comparison-row">
              <span>Total Interest</span>
              <span class="currency">${formatCurrency(scenario.data.totalInterest)}</span>
            </div>
            <div class="comparison-row">
              <span>Loan Term</span>
              <span>${scenario.data.term} years</span>
            </div>
            <div class="comparison-row">
              <span>Interest Rate</span>
              <span>${formatPercentage(scenario.data.rate)}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    elements.comparisonCards.innerHTML = html;
  }

  // Calculate scenario based on changes
  function calculateScenario(baseResult, changes) {
    const homePrice = baseResult.homePrice;
    const dpPercent = changes.dpPercent || baseResult.dpPercent;
    const dpAmount = homePrice * (dpPercent / 100);
    const loanAmount = Math.max(0, homePrice - dpAmount);
    const rate = changes.rate || baseResult.rate;
    const term = changes.term || baseResult.term;
    const months = term * 12;
    
    // Property costs (use same as base)
    const annualTax = parseFloat(elements.propertyTax?.value || 0);
    const annualInsurance = parseFloat(elements.homeInsurance?.value || 0);
    const pmiRate = parseFloat(elements.pmiRate?.value || 0) / 100;
    const monthlyHOA = parseFloat(elements.hoaFees?.value || 0);
    
    // Calculate monthly P&I
    const monthlyRate = rate / 100 / 12;
    let monthlyPI = 0;
    
    if (monthlyRate > 0) {
      monthlyPI = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                  (Math.pow(1 + monthlyRate, months) - 1);
    } else {
      monthlyPI = loanAmount / months;
    }
    
    // Other monthly costs
    const monthlyTax = annualTax / 12;
    const monthlyInsurance = annualInsurance / 12;
    const needsPMI = dpPercent < 20;
    const monthlyPMI = needsPMI ? (loanAmount * pmiRate / 12) : 0;
    const totalMonthly = monthlyPI + monthlyTax + monthlyInsurance + monthlyPMI + monthlyHOA;
    
    // Generate amortization schedule
    const schedule = generateSchedule(loanAmount, monthlyRate, monthlyPI, months, 0, 0);
    const totalInterest = schedule.reduce((sum, payment) => sum + payment.interest, 0);
    
    return {
      mode: 'payment',
      homePrice,
      dpAmount,
      dpPercent,
      loanAmount,
      rate,
      term,
      monthlyPI,
      monthlyTax,
      monthlyInsurance,
      monthlyPMI,
      monthlyHOA,
      totalMonthly,
      totalInterest,
      totalCost: loanAmount + totalInterest,
      needsPMI,
      schedule
    };
  }

  // Utility functions for actions
  function resetForm() {
    // Reset form inputs
    if (elements.homePrice) elements.homePrice.value = 500000;
    if (elements.dpAmount) elements.dpAmount.value = 100000;
    if (elements.dpPercent) elements.dpPercent.value = 20;
    if (elements.interestRate) elements.interestRate.value = 6.5;
    if (elements.termCustom) elements.termCustom.value = '';
    if (elements.state) elements.state.value = 'CA';
    if (elements.propertyTax) elements.propertyTax.value = 3750;
    if (elements.homeInsurance) elements.homeInsurance.value = 1200;
    if (elements.pmiRate) elements.pmiRate.value = 0.5;
    if (elements.hoaFees) elements.hoaFees.value = 0;
    if (elements.extraMonthly) elements.extraMonthly.value = 0;
    if (elements.extraOnce) elements.extraOnce.value = 0;
    
    // Reset term selection
    setTerm(30);
    switchDPMode(false);
    
    // Update property tax and insurance
    updatePropertyTax();
    updateInsurance();
    
    // Recalculate
    calculate();
    
    showNotification('Form has been reset to default values', 'success');
  }

  function emailResults() {
    if (!calculatorState.currentCalculation) return;
    
    const result = calculatorState.currentCalculation;
    const subject = 'Mortgage Calculator Results';
    const body = `
Home Price: ${formatCurrency(result.homePrice)}
Down Payment: ${formatCurrency(result.dpAmount)} (${formatPercentage(result.dpPercent)})
Loan Amount: ${formatCurrency(result.loanAmount)}
Interest Rate: ${formatPercentage(result.rate)}
Loan Term: ${result.term} years

Monthly Payment: ${formatCurrency(result.totalMonthly)}
- Principal & Interest: ${formatCurrency(result.monthlyPI)}
- Property Tax: ${formatCurrency(result.monthlyTax)}
- Insurance: ${formatCurrency(result.monthlyInsurance)}
- PMI: ${formatCurrency(result.monthlyPMI)}
- HOA: ${formatCurrency(result.monthlyHOA)}

Total Interest: ${formatCurrency(result.totalInterest)}

Generated by Finguid Mortgage Calculator
    `.trim();

    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  }

  function shareResults() {
    if (!calculatorState.currentCalculation) return;
    
    const result = calculatorState.currentCalculation;
    const shareData = {
      title: 'Mortgage Calculator Results',
      text: `Monthly payment of ${formatCurrency(result.totalMonthly)} for a ${formatCurrency(result.homePrice)} home`,
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData).catch(err => console.log('Share failed:', err));
    } else {
      // Fallback: copy to clipboard
      const textToCopy = `${shareData.text} - ${shareData.url}`;
      navigator.clipboard.writeText(textToCopy).then(() => {
        showNotification('Results copied to clipboard!', 'success');
      }).catch(() => {
        showNotification('Unable to share results', 'error');
      });
    }
  }

  function showFullSchedule() {
    if (!elements.scheduleModal || !elements.fullScheduleBody) return;
    
    const result = calculatorState.currentCalculation;
    if (!result) return;

    // Update modal details
    if (elements.modalLoanAmount) elements.modalLoanAmount.textContent = formatCurrency(result.loanAmount);
    if (elements.modalInterestRate) elements.modalInterestRate.textContent = formatPercentage(result.rate);
    if (elements.modalLoanTerm) elements.modalLoanTerm.textContent = `${result.term} years`;

    const html = result.schedule.map(payment => `
      <tr>
        <td>${payment.month}</td>
        <td class="currency">${formatCurrencyDetailed(payment.payment)}</td>
        <td class="currency">${formatCurrencyDetailed(payment.principal)}</td>
        <td class="currency">${formatCurrencyDetailed(payment.interest)}</td>
        <td class="currency">${formatCurrency(payment.balance)}</td>
      </tr>
    `).join('');

    elements.fullScheduleBody.innerHTML = html;
    elements.scheduleModal.showModal();
  }

  function loadScenario(scenario) {
    if (!calculatorState.currentCalculation) return;
    
    const result = calculatorState.currentCalculation;
    let changes = {};
    
    switch(scenario) {
      case 'lower-rate':
        changes.rate = result.rate * 0.8; // 20% lower rate
        break;
      case 'higher-dp':
        changes.dpPercent = Math.min(100, result.dpPercent + 10); // 10% more down payment
        break;
      case 'shorter-term':
        changes.term = Math.max(5, result.term - 5); // 5 years shorter term
        break;
      default:
        // Current scenario - no changes
        break;
    }
    
    const scenarioResult = calculateScenario(result, changes);
    calculatorState.currentCalculation = scenarioResult;
    updateDisplay(scenarioResult);
    generateInsights(scenarioResult);
    updateCharts(scenarioResult);
    updateAmortizationTable(scenarioResult);
    
    showNotification(`Loaded ${scenario.replace('-', ' ')} scenario`, 'success');
  }

  // Notification system
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle'}"></i>
      <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  // Analytics tracking
  function trackCalculatorUsage() {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'calculator_use', {
        event_category: 'Calculator',
        event_label: 'Mortgage Calculator',
        value: 1
      });
    }
  }

  // Initialize the calculator when DOM is ready
  init();

  // Track usage on calculation
  document.addEventListener('calculate', trackCalculatorUsage);
});
