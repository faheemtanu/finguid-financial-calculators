// mortgage-calculator.js

(() => {
  'use strict';

  // Cached elements
  const els = {
    homePrice: document.getElementById('homePrice'),
    interestRate: document.getElementById('interestRate'),
    dpAmountTab: document.getElementById('dpAmountTab'),
    dpPercentTab: document.getElementById('dpPercentTab'),
    downPaymentAmount: document.getElementById('downPaymentAmount'),
    downPaymentPercent: document.getElementById('downPaymentPercent'),
    dpAmountWrapper: document.getElementById('dpAmountWrapper'),
    dpPercentWrapper: document.getElementById('dpPercentWrapper'),
    termButtons: document.getElementById('termButtons'),
    customTerm: document.getElementById('customTerm'),
    state: document.getElementById('state'),
    advancedToggle: document.getElementById('advancedToggle'),
    advancedOptions: document.getElementById('advancedOptions'),
    homeInsurance: document.getElementById('homeInsurance'),
    pmiRate: document.getElementById('pmiRate'),
    hoaFees: document.getElementById('hoaFees'),
    extraPaymentMonthly: document.getElementById('extraPaymentMonthly'),
    extraPaymentOneTime: document.getElementById('extraPaymentOneTime'),
    calculateBtn: document.getElementById('calculateBtn'),
    resetBtn: document.getElementById('resetBtn'),

    totalMonthlyPayment: document.getElementById('totalMonthlyPayment'),
    loanAmount: document.getElementById('loanAmount'),
    totalInterest: document.getElementById('totalInterest'),

    piAmount: document.getElementById('piAmount'),
    taxAmount: document.getElementById('taxAmount'),
    insuranceAmount: document.getElementById('insuranceAmount'),
    pmiAmount: document.getElementById('pmiAmount'),
    pmiRow: document.getElementById('pmiRow'),
    hoaAmount: document.getElementById('hoaAmount'),

    comparisonBody: document.getElementById('comparisonBody')
  };

  // State tax rates (%)
  const stateTaxRates = {
    AL:0.41,AK:1.24,AZ:0.60,AR:0.66,CA:0.81,CO:0.52,CT:2.16,DE:0.62,
    FL:0.89,GA:0.95,HI:0.29,ID:0.63,IL:2.29,IN:0.83,IA:1.59,KS:1.40,
    KY:0.89,LA:0.62,ME:1.29,MD:1.07,MA:1.19,MI:1.53,MN:1.10,MS:0.81,
    MO:1.00,MT:1.30,NE:1.70,NV:0.55,NH:2.09,NJ:2.46,NM:0.84,NY:1.73,
    NC:0.80,ND:1.02,OH:1.57,OK:0.99,OR:0.92,PA:1.58,RI:1.36,SC:0.57,
    SD:1.32,TN:0.65,TX:1.90,UT:0.57,VT:1.89,VA:0.83,WA:0.93,WV:0.59,
    WI:1.72,WY:0.61
  };

  let usePercent = false;
  let activeTerm = 30; // default selected term
  let advancedVisible = false;

  // UI helpers
  function formatMoney(amount) {
    return `$${amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  }

  function debounce(func, wait = 300) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(null, args), wait);
    };
  }

  // Synchronize DP inputs
  function syncDownPayment(fromPercent) {
    const homePrice = Number(els.homePrice.value) || 0;
    if (fromPercent) {
      let pct = Math.min(100, Math.max(0, Number(els.downPaymentPercent.value)));
      let amt = Math.round(homePrice * pct / 100);
      els.downPaymentAmount.value = amt;
    } else {
      let amt = Math.min(homePrice, Math.max(0, Number(els.downPaymentAmount.value)));
      let pct = homePrice > 0 ? (amt / homePrice) * 100 : 0;
      els.downPaymentPercent.value = pct.toFixed(1);
    }
    updatePMIBanner();
  }

  // Update PMI banner show/hide
  function updatePMIBanner() {
    const dpPct = Number(els.downPaymentPercent.value) || 0;
    const showPMI = dpPct < 20;
    els.pmiRow.style.display = showPMI ? 'block' : 'none';
  }

  // Update Property Tax based on state and home price input
  function updatePropertyTax() {
    const homePrice = Number(els.homePrice.value) || 0;
    const state = els.state.value || '';
    const taxRate = stateTaxRates[state] || 1.0;
    const taxAnnual = Math.round(homePrice * taxRate / 100);
    if(els.homePrice.value && els.state.value) {
      const toolTip = `Average property tax in ${state} is approx. ${taxRate.toFixed(2)}%`;
      els.taxAmount.setAttribute('title', toolTip);
      els.taxAmount.classList.add('tooltip');
    }
    els.advancedVisible ? null : els.taxAmount.title = '';
    els.taxAmount.classList.remove('tooltip');
    els.advancedVisible ? els.advancedOptions.querySelector('#propertyTax')?.setAttribute('value', taxAnnual) : null;
  }

  // Format term buttons and custom term input
  function setTerm(years) {
    activeTerm = years;
    Array.from(els.termButtons.children).forEach(btn => {
      if(btn.dataset.term && Number(btn.dataset.term) === years) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    els.customTerm.value = '';
  }

  // Calculation functions
  function calculate() {
    const homePrice = Number(els.homePrice.value);
    let downPayment = 0;
    if(usePercent) {
      const pct = Number(els.downPaymentPercent.value);
      downPayment = Math.round(homePrice * pct / 100);
    } else {
      downPayment = Number(els.downPaymentAmount.value);
    }
    const loanAmount = Math.max(homePrice - downPayment, 0);

    const interestRate = Number(els.interestRate.value) / 100;
    const term = Number(els.customTerm.value) || activeTerm;
    const totalMonths = term * 12;

    if(!homePrice || !interestRate || !loanAmount || !term) return;

    // Fixed monthly interest rate
    const monthlyInterest = interestRate / 12;

    // Monthly PI payment calculation (standard formula)
    let monthlyPI = 0;
    if(monthlyInterest === 0) {
      monthlyPI = loanAmount / totalMonths;
    } else {
      monthlyPI = loanAmount * monthlyInterest * Math.pow(1 + monthlyInterest, totalMonths) / (Math.pow(1 + monthlyInterest, totalMonths) -1);
    }

    // Other monthly costs
    const annualTax = els.state.value ? Math.round(homePrice * (stateTaxRates[els.state.value] / 100)) : 0;
    const monthlyTax = annualTax / 12;
    const homeInsuranceAnnual = Number(els.homeInsurance.value) || 960;
    const monthlyInsurance = homeInsuranceAnnual / 12;
    const pmiRate = Number(els.pmiRate.value) || 0.008;
    const needsPMI = ((downPayment / homePrice) * 100) < 20;
    const monthlyPMI = needsPMI ? (loanAmount * pmiRate / 12) : 0;
    const monthlyHOA = Number(els.hoaFees.value) || 0;

    // Additional payments
    const extraMonthly = Number(els.extraPaymentMonthly.value) || 0;
    const extraOneTime = Number(els.extraPaymentOneTime.value) || 0;

    // Calculate total monthly payment
    const totalMonthly = monthlyPI + monthlyTax + monthlyInsurance + monthlyPMI + monthlyHOA + extraMonthly;

    // Calculate total interest over the loan
    let totalInterest = 0;

    // Amortization simulation without chart (for calculation)
    let balance = loanAmount;
    let month = 0;
    let interestSum = 0;
    while(balance > 0 && month < totalMonths) {
      const interestPayment = balance * monthlyInterest;
      let principalPayment = monthlyPI - interestPayment;
      let totalPaymentMonth = monthlyPI;
      if(month === 0) { // Include one-time extra payment after first month payment
        totalPaymentMonth += extraOneTime;
        principalPayment += extraOneTime;
      }
      principalPayment += extraMonthly;
      if(balance < principalPayment) {
        principalPayment = balance;
      }
      balance -= principalPayment;
      interestSum += interestPayment;
      month++;
    }
    totalInterest = interestSum;

    // Update UI
    els.totalMonthlyPayment.textContent = formatMoney(totalMonthly);
    els.loanAmount.textContent = formatMoney(loanAmount);
    els.totalInterest.textContent = formatMoney(totalInterest);

    els.piAmount.textContent = formatMoney(monthlyPI);
    els.taxAmount.textContent = formatMoney(monthlyTax);
    els.insuranceAmount.textContent = formatMoney(monthlyInsurance);
    els.pmiAmount.textContent = formatMoney(monthlyPMI);
    els.hoaAmount.textContent = formatMoney(monthlyHOA);

    els.pmiRow.style.display = needsPMI ? 'block' : 'none';

    generateComparisonScenarios(loanAmount);
  }

  // Generate predefined comparison scenarios table
  function generateComparisonScenarios(loanAmount) {
    const ratesAndTerms = [
      {name: '30 Year Fixed', rate: 6.75, term: 30},
      {name: '25 Year Fixed', rate: 6.50, term: 25},
      {name: '20 Year Fixed', rate: 6.25, term: 20},
      {name: '15 Year Fixed', rate: 6.00, term: 15},
      {name: '10 Year Fixed', rate: 5.75, term: 10}
    ];

    let html = '';
    for(let scenario of ratesAndTerms) {
      const monthlyPayment = calculateMonthlyPI(loanAmount, scenario.rate / 100, scenario.term);
      const totalInterest = monthlyPayment * scenario.term * 12 - loanAmount;
      html += `<tr>
        <td>${scenario.name}</td>
        <td>${scenario.rate.toFixed(2)}</td>
        <td>${scenario.term}</td>
        <td>${formatMoney(monthlyPayment)}</td>
        <td>${formatMoney(totalInterest)}</td>
      </tr>`;
    }
    els.comparisonBody.innerHTML = html;
  }

  // Utility: monthly PI calc
  function calculateMonthlyPI(principal, annualRate, years) {
    const n = years * 12;
    const r = annualRate / 12;
    if(r === 0) return principal / n;
    return principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  }

  // Reset form and UI
  function resetForm() {
    els.homePrice.value = '';
    els.interestRate.value = '';
    els.downPaymentAmount.value = '';
    els.downPaymentPercent.value = '';
    els.state.value = '';
    els.customTerm.value = '';
    els.homeInsurance.value = '960';
    els.pmiRate.value = '0.8';
    els.hoaFees.value = '0';
    els.extraPaymentMonthly.value = '0';
    els.extraPaymentOneTime.value = '0';
    setTerm(30);
    usePercent = false;
    els.dpPercentWrapper.style.display = 'none';
    els.dpAmountWrapper.style.display = 'block';
    els.dpAmountTab.classList.add('active');
    els.dpPercentTab.classList.remove('active');
    els.pmiRow.style.display = 'none';
    els.totalMonthlyPayment.textContent = '$0.00';
    els.loanAmount.textContent = '$0.00';
    els.totalInterest.textContent = '$0.00';
    els.piAmount.textContent = '$0.00';
    els.taxAmount.textContent = '$0.00';
    els.insuranceAmount.textContent = '$0.00';
    els.pmiAmount.textContent = '$0.00';
    els.hoaAmount.textContent = '$0.00';
    els.comparisonBody.innerHTML = '';
  }

  // Event bindings for DP tab toggle
  els.dpAmountTab.addEventListener('click', () => {
    if(usePercent) {
      usePercent = false;
      els.dpAmountWrapper.style.display = 'block';
      els.dpPercentWrapper.style.display = 'none';
      els.dpAmountTab.classList.add('active');
      els.dpPercentTab.classList.remove('active');
      syncDownPayment(false);
      calculate();
    }
  });
  els.dpPercentTab.addEventListener('click', () => {
    if(!usePercent) {
      usePercent = true;
      els.dpAmountWrapper.style.display = 'none';
      els.dpPercentWrapper.style.display = 'block';
      els.dpAmountTab.classList.remove('active');
      els.dpPercentTab.classList.add('active');
      syncDownPayment(true);
      calculate();
    }
  });

  // DP input sync listeners
  els.downPaymentAmount.addEventListener('input', () => {
    if (!usePercent) {
      syncDownPayment(false);
      calculate();
    }
  });
  els.downPaymentPercent.addEventListener('input', () => {
    if (usePercent) {
      syncDownPayment(true);
      calculate();
    }
  });

  // Home Price change updates
  els.homePrice.addEventListener('input', () => {
    syncDownPayment(usePercent);
    updatePropertyTax();
    calculate();
  });

  // State change updates property tax and recalc
  els.state.addEventListener('change', () => {
    updatePropertyTax();
    calculate();
  });

  // Term selection buttons listener
  els.termButtons.querySelectorAll('.term-btn').forEach(button => {
    button.addEventListener('click', e => {
      const term = Number(e.target.dataset.term);
      if (term) {
        setTerm(term);
        calculate();
      }
    });
  });

  // Custom term input
  els.customTerm.addEventListener('input', () => {
    let val = Number(els.customTerm.value);
    if (val >= 1 && val <= 40) {
      setTerm(val);
      calculate();
    }
  });

  // Advanced options toggle
  els.advancedToggle.addEventListener('click', () => {
    advancedVisible = !advancedVisible;
    els.advancedOptions.style.display = advancedVisible ? 'block' : 'none';
    els.advancedToggle.textContent = advancedVisible ? 'Advanced Options ▲' : 'Advanced Options ▼';
  });

  // Button actions
  els.calculateBtn.addEventListener('click', () => {
    calculate();
  });
  els.resetBtn.addEventListener('click', () => {
    resetForm();
  });

  // Initial setup on page load
  window.addEventListener('DOMContentLoaded', () => {
    resetForm();
  });
})();
