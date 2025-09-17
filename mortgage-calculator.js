// mortgage-calculator.js
"use strict";

// List of states and current average rates (30-year fixed, 2025 values in percent)
const STATE_RATE_DATA = {
  "Alabama": 6.81, "Alaska": 6.93, "Arizona": 6.86, "Arkansas": 6.79,
  "California": 6.80, "Colorado": 6.87, "Connecticut": 6.91, "Delaware": 6.89,
  "Florida": 6.88, "Georgia": 6.83, "Hawaii": 6.95, "Idaho": 6.90,
  "Illinois": 6.88, "Indiana": 6.85, "Iowa": 6.94, "Kansas": 6.88,
  "Kentucky": 6.84, "Louisiana": 6.88, "Maine": 6.81, "Maryland": 6.90,
  "Massachusetts": 6.89, "Michigan": 6.79, "Minnesota": 6.82, "Mississippi": 6.86,
  "Missouri": 6.78, "Montana": 6.84, "Nebraska": 6.92, "Nevada": 6.87,
  "New Hampshire": 6.85, "New Jersey": 6.78, "New Mexico": 6.92, "New York": 6.79,
  "North Carolina": 6.80, "North Dakota": 6.88, "Ohio": 6.85, "Oklahoma": 6.89,
  "Oregon": 6.90, "Pennsylvania": 6.89, "Rhode Island": 6.88, "South Carolina": 6.80,
  "South Dakota": 6.85, "Tennessee": 6.82, "Texas": 6.83, "Utah": 6.88,
  "Vermont": 6.91, "Virginia": 6.84, "Washington": 6.88, "West Virginia": 6.96,
  "Wisconsin": 6.80, "Wyoming": 6.89, "Washington D.C.": 6.92
};

const CURRENCY_OPTS = { style: 'currency', currency: 'USD', minimumFractionDigits: 2 };

// Utility functions
function formatMoney(amount) {
  return amount.toLocaleString('en-US', CURRENCY_OPTS);
}
function getAvgRate(state) {
  return (STATE_RATE_DATA[state] || 6.85).toFixed(2);
}

// DOM Elements
const form = document.getElementById('mortgage-form');
const stateSelect = document.getElementById('state');
const amountInput = document.getElementById('amount');
const downInput = document.getElementById('downpayment');
const termInput = document.getElementById('term');
const rateInput = document.getElementById('rate');
const avgRateDisplay = document.getElementById('avg-rate-display');
const calcBtn = document.getElementById('calculate-btn');
const resetBtn = document.getElementById('reset-btn');
const termBtns = document.querySelectorAll('.term-btn');
const summaries = document.getElementById('calc-summaries');
const amortSection = document.getElementById('amortization-schedule');
const amortTabs = document.querySelectorAll('.amort-tab');
const amortMonthly = document.getElementById('amort-table-monthly');
const amortYearly = document.getElementById('amort-table-yearly');
const voiceBtn = document.getElementById('voice-btn');
const tooltipEl = document.getElementById('global-tooltip');

// 1. Populate state list & set event listeners
(function populateStates() {
  stateSelect.innerHTML = Object.keys(STATE_RATE_DATA).map(state =>
    `<option value="${state}">${state}</option>`).join('');
})();
stateSelect.value = "California"; // default

function updateAvgRate() {
  const avg = getAvgRate(stateSelect.value);
  avgRateDisplay.textContent = `Current Avg: ${avg}%`;
  rateInput.placeholder = avg;
  // (Optional) visually highlight if user's rate <, =, or > avg
  if (Number(rateInput.value) === Number(avg)) {
    avgRateDisplay.className = "rate-hint neutral";
  } else if (parseFloat(rateInput.value) < avg) {
    avgRateDisplay.className = "rate-hint plus";
  } else if (parseFloat(rateInput.value) > avg) {
    avgRateDisplay.className = "rate-hint minus";
  } else {
    avgRateDisplay.className = "rate-hint";
  }
}
stateSelect.addEventListener('change', function () {
  updateAvgRate();
  rateInput.value = getAvgRate(this.value);
  updateAvgRate();
});

// 2. Loan term buttons: pick + manual
termBtns.forEach(btn => btn.addEventListener('click', function () {
  termInput.value = this.dataset.term;
  termBtns.forEach(b => b.classList.remove('active'));
  this.classList.add('active');
}));
termInput.addEventListener('input', function () {
  termBtns.forEach(b => b.classList.remove('active'));
  if (parseInt(this.value, 10) === 10) termBtns[0].classList.add('active');
  if (parseInt(this.value, 10) === 15) termBtns[1].classList.add('active');
  if (parseInt(this.value, 10) === 20) termBtns[2].classList.add('active');
  if (parseInt(this.value, 10) === 30) termBtns[3].classList.add('active');
});

// 3. Update rate when state changes, or manual override
rateInput.addEventListener('focus', updateAvgRate);
rateInput.addEventListener('input', updateAvgRate);
document.addEventListener('DOMContentLoaded', function() {
  rateInput.value = getAvgRate(stateSelect.value);
  updateAvgRate();
});

// 4. Reset handling
form.addEventListener('reset', function (e) {
  setTimeout(() => {
    // Return custom fields to form defaults
    termBtns.forEach(b => b.classList.remove('active'));
    stateSelect.value = "California";
    rateInput.value = getAvgRate(stateSelect.value);
    termInput.value = "";
    avgRateDisplay.textContent = '';
    avgRateDisplay.className = "rate-hint";
    summaries.style.display = 'none';
    amortSection.style.display = 'none';
    amortMonthly.innerHTML = '';
    amortYearly.innerHTML = '';
  }, 10);
});

// 5. Calculation engine and validate
form.addEventListener('submit', function (e) {
  e.preventDefault();

  const state = stateSelect.value;
  const price = parseFloat(amountInput.value) || 0;
  const down = parseFloat(downInput.value) || 0;
  const principal = Math.max(price - down, 0);
  let years = parseInt(termInput.value, 10);
  if (!years || years < 5 || years > 40) {
    alert("Please enter a valid loan term (5-40 years).");
    termInput.focus();
    return;
  }
  let rate = parseFloat(rateInput.value);
  if (!rate || rate < 0.1 || rate > 20) {
    alert("Enter a valid interest rate.");
    rateInput.focus();
    return;
  }
  // Compute mortgage
  const months = years * 12;
  const monthlyRate = rate / 100 / 12;
  let payment = principal > 0 && monthlyRate > 0
    ? principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1)
    : 0;
  payment = Math.round(payment * 100) / 100;
  const totalPaid = payment * months;
  const totalInterest = totalPaid - principal;

  // Populate summaries
  document.getElementById('summary-monthly').textContent = formatMoney(payment);
  document.getElementById('summary-interest').textContent = formatMoney(totalInterest);
  document.getElementById('summary-total').textContent = formatMoney(totalPaid);
  summaries.style.display = '';
  
  // Generate amortization data
  const rowsMonthly = [];
  const rowsYearly = [];
  let currBalance = principal;
  let totalAnnualPaid = 0, totalAnnualPrin = 0, totalAnnualInt = 0;
  let currYear = 1;
  for (let i = 1; i <= months; ++i) {
    let interestPayment = Math.round(currBalance * monthlyRate * 100) / 100;
    let principalPayment = Math.round((payment - interestPayment) * 100) / 100;
    // On last payment, adjust for rounding
    if (i === months) principalPayment = currBalance;
    currBalance = Math.round((currBalance - principalPayment) * 100) / 100;
    if (currBalance < 0.01) currBalance = 0;

    // Per month table (first 12 months)
    if (i <= 12) {
      rowsMonthly.push(
        `<tr>
          <td>${currYear}</td>
          <td>${i}</td>
          <td>${formatMoney(payment)}</td>
          <td>${formatMoney(principalPayment)}</td>
          <td>${formatMoney(interestPayment)}</td>
          <td>${formatMoney(currBalance)}</td>
        </tr>`
      );
    }
    // Yearly aggregation
    totalAnnualPaid += payment;
    totalAnnualPrin += principalPayment;
    totalAnnualInt += interestPayment;
    if (i % 12 === 0 || i === months) {
      rowsYearly.push(
        `<tr>
          <td>${currYear}</td>
          <td>${formatMoney(totalAnnualPaid)}</td>
          <td>${formatMoney(totalAnnualPrin)}</td>
          <td>${formatMoney(totalAnnualInt)}</td>
          <td>${formatMoney(currBalance)}</td>
        </tr>`
      );
      currYear++;
      totalAnnualPaid = totalAnnualPrin = totalAnnualInt = 0;
    }
  }
  // Build amortization tables
  amortMonthly.innerHTML = `
    <table class="fg-amort-table">
      <thead>
        <tr>
          <th>Year</th>
          <th>Month</th>
          <th>Payment</th>
          <th>Principal</th>
          <th>Interest</th>
          <th>Remaining Balance</th>
        </tr>
      </thead>
      <tbody>
        ${rowsMonthly.join("\n")}
      </tbody>
    </table>
    <p class="amort-table-note">First 12 months shown. See yearly summary for overview.</p>
  `;
  amortYearly.innerHTML = `
    <table class="fg-amort-table">
      <thead>
        <tr>
          <th>Year</th>
          <th>Total Payments</th>
          <th>Principal Paid</th>
          <th>Interest Paid</th>
          <th>End-of-Year Balance</th>
        </tr>
      </thead>
      <tbody>
        ${rowsYearly.join("\n")}
      </tbody>
    </table>
  `;
  amortSection.style.display = '';
  switchAmortView('monthly');
});

// 6. Amortization tabs
amortTabs.forEach(tab =>
  tab.addEventListener('click', function () {
    amortTabs.forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    switchAmortView(this.dataset.view);
  })
);
function switchAmortView(view) {
  amortMonthly.style.display = (view === 'monthly') ? '' : 'none';
  amortYearly.style.display = (view === 'yearly') ? '' : 'none';
}

// 7. Voice input (Web Speech API)
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  let recognizing = false;
  let recognition = null;
  function startVoiceInput() {
    if (!recognition) {
      recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.onresult = function (event) {
        const transcript = event.results[0][0].transcript;
        // Naive rule extraction for demo (can improve)
        const amtMatch = transcript.match(/(?:home|house|loan|mortgage)?\s*amount\s*(?:is)?\s*\$?([\d,]+)/i);
        const dpMatch = transcript.match(/down\s*payment\s*(?:is)?\s*\$?([\d,]+)/i);
        const rateMatch = transcript.match(/(interest|rate)\s*(?:is)?\s*([\d.]+)\%?/i);
        const yearsMatch = transcript.match(/(term|years)\s*(?:is)?\s*(\d{1,2})/i);
        if (amtMatch) amountInput.value = amtMatch[1].replace(/,/g, '');
        if (dpMatch) downInput.value = dpMatch[1].replace(/,/g, '');
        if (rateMatch) rateInput.value = rateMatch[2];
        if (yearsMatch) termInput.value = yearsMatch[2];
        // Notify user
        voiceBtn.textContent = "Voice Input";
        recognizing = false;
      };
      recognition.onstart = () => {
        recognizing = true;
        voiceBtn.textContent = "Listening...";
      };
      recognition.onend = () => {
        recognizing = false;
        voiceBtn.textContent = "Voice Input";
      };
      recognition.onerror = (event) => {
        recognizing = false;
        voiceBtn.textContent = "Voice Input (Error)";
      };
    }
    if (!recognizing) recognition.start();
    else recognition.stop();
  }
  voiceBtn.addEventListener('click', (e) => {
    startVoiceInput();
  });
  voiceBtn.disabled = false;
} else {
  voiceBtn.textContent = "Voice Input (N/A)";
  voiceBtn.disabled = true;
}

// 8. Accessible tooltips (singleton popover)
document.addEventListener('mouseover', showTooltip);
document.addEventListener('focusin', showTooltip);
document.addEventListener('mouseout', hideTooltip);
document.addEventListener('focusout', hideTooltip);

function showTooltip(e) {
  const trigger = e.target.closest('.tooltip');
  if (!trigger) return;
  const tipText = trigger.getAttribute('data-tooltip');
  if (tipText) {
    tooltipEl.innerHTML = tipText;
    const rect = trigger.getBoundingClientRect();
    tooltipEl.style.top = `${window.scrollY + rect.bottom + 6}px`;
    tooltipEl.style.left = `${window.scrollX + rect.left}px`;
    tooltipEl.setAttribute('aria-hidden', 'false');
    tooltipEl.style.display = 'block';
    tooltipEl.style.opacity = 1;
  }
}
function hideTooltip(e) {
  tooltipEl.setAttribute('aria-hidden', 'true');
  tooltipEl.style.opacity = 0;
  tooltipEl.style.display = 'none';
}
