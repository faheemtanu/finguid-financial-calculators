// mortgage-calculator.js - full functionality with voice, tabs, toggles, persistent highlights

document.addEventListener('DOMContentLoaded', () => {
  // Tabs Elements
  const tabs = {
    monthly: document.getElementById('tab-monthly'),
    refinance: document.getElementById('tab-refinance'),
    affordability: document.getElementById('tab-affordability'),
  };
  let activeTab = 'monthly';

  // Toggle controls - Down payment mode
  const dpTabs = Array.from(document.querySelectorAll('.dp-tab[data-mode]'));
  let dpMode = 'amount'; // default

  // Loan term buttons
  const termBtns = Array.from(document.querySelectorAll('.term-btn'));
  let loanTerm = 10;

  const advToggle = document.getElementById('advancedToggle');
  const advOptions = document.getElementById('advancedOptions');

  const voiceBtn = document.getElementById('voiceBtn');
  const calcBtn = document.getElementById('calculateBtn');
  const statusAnnounce = document.getElementById('calc-status');

  // Make Monthly Payment tab active initially
  function setActiveTab(tabName) {
    Object.entries(tabs).forEach(([name, el]) => {
      if (name === tabName) {
        el.classList.add('active');
        el.setAttribute('aria-selected', 'true');
      } else {
        el.classList.remove('active');
        el.setAttribute('aria-selected', 'false');
      }
    });
    activeTab = tabName;
  }
  setActiveTab(activeTab);

  // Tabs click behavior
  Object.entries(tabs).forEach(([name, el]) => {
    el.addEventListener('click', () => {
      setActiveTab(name);
    });
  });

  // Down Payment toggle behavior
  dpTabs.forEach(dpTab => {
    dpTab.addEventListener('click', () => {
      if (dpTab.dataset.mode === dpMode) return;
      dpTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-checked', 'false');
        t.setAttribute('tabindex', '-1');
      });
      dpTab.classList.add('active');
      dpTab.setAttribute('aria-checked', 'true');
      dpTab.setAttribute('tabindex', '0');
      dpMode = dpTab.dataset.mode;
      const dpInput = document.getElementById('downPayment');
      dpInput.value = '';
      dpInput.placeholder = dpMode === 'amount' ? '80,000' : '20';
      dpInput.focus();
    });
  });

  // Loan Term toggle
  termBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (loanTerm === +btn.dataset.term) return;
      termBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-checked', 'false');
        b.setAttribute('tabindex', '-1');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-checked', 'true');
      btn.setAttribute('tabindex', '0');
      loanTerm = +btn.dataset.term;
      document.getElementById('loanTermCustom').value = '';
    });
  });

  // Advanced options toggle
  advToggle.addEventListener('click', () => {
    const shown = !advOptions.classList.toggle('hidden');
    if (shown) {
      advToggle.classList.add('active');
      advToggle.setAttribute('aria-pressed', 'true');
      advOptions.setAttribute('aria-expanded', 'true');
    } else {
      advToggle.classList.remove('active');
      advToggle.setAttribute('aria-pressed', 'false');
      advOptions.setAttribute('aria-expanded', 'false');
    }
  });

  // Voice input integration
  let recognition, recognizing = false;
  if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      recognizing = true;
      voiceBtn.classList.add('active');
      voiceBtn.title = 'Listening... Click to stop';
      statusAnnounce.textContent = 'Voice input started.';
    };
    recognition.onend = () => {
      recognizing = false;
      voiceBtn.classList.remove('active');
      voiceBtn.title = 'Start voice input';
      statusAnnounce.textContent = 'Voice input ended.';
    };
    recognition.onerror = (e) => {
      recognizing = false;
      voiceBtn.classList.remove('active');
      voiceBtn.title = 'Start voice input';
      statusAnnounce.textContent = 'Voice input error: ' + e.error;
    };
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript.toLowerCase().trim();
      statusAnnounce.textContent = `Recognized: ${transcript}`;
      // Simple phrases parsing
      if (/home price (\d+(?:,\d{3})*)/.test(transcript)) {
        const val = transcript.match(/home price (\d+(?:,\d{3})*)/)[1].replace(/,/g, '');
        document.getElementById('homePrice').value = val;
      }
      if (/interest rate (\d+\.?\d*)/.test(transcript)) {
        const val = transcript.match(/interest rate (\d+\.?\d*)/)[1];
        document.getElementById('interestRate').value = val;
      }
      if (/down payment (\d+\.?\d*)/.test(transcript)) {
        const val = transcript.match(/down payment (\d+\.?\d*)/)[1];
        dpMode = 'amount';
        dpTabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-checked', 'false');
          t.setAttribute('tabindex', '-1');
        });
        const dpAmountTab = dpTabs.find(t => t.dataset.mode === 'amount');
        if (dpAmountTab) {
          dpAmountTab.classList.add('active');
          dpAmountTab.setAttribute('aria-checked', 'true');
          dpAmountTab.setAttribute('tabindex', '0');
        }
        document.getElementById('downPayment').value = val;
      }
      if (/loan term (\d+)/.test(transcript)) {
        const val = +transcript.match(/loan term (\d+)/)[1];
        if ([10, 15, 20, 25, 30].includes(val)) {
          loanTerm = val;
          termBtns.forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-checked', 'false');
            b.setAttribute('tabindex', '-1');
          });
          const termBtn = termBtns.find(b => +b.dataset.term === val);
          if (termBtn) {
            termBtn.classList.add('active');
            termBtn.setAttribute('aria-checked', 'true');
            termBtn.setAttribute('tabindex', '0');
          }
          document.getElementById('loanTermCustom').value = '';
        } else {
          loanTerm = null;
          termBtns.forEach(b => b.classList.remove('active'));
          document.getElementById('loanTermCustom').value = val;
        }
      }
      recognition.stop();
      statusAnnounce.textContent = 'Voice input processed.';
    };

    voiceBtn.addEventListener('click', () => {
      if (recognizing) {
        recognition.stop();
      } else {
        recognition.start();
      }
    });
  } else {
    voiceBtn.style.display = 'none';
  }

  function formatCurrency(num) {
    return num.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  }

  // Perform calculation preserving highlight states
  function performCalculation() {
    // Inputs
    const hpRaw = document.getElementById('homePrice').value.replace(/,/g, '');
    const hp = parseFloat(hpRaw);
    let dpRaw = document.getElementById('downPayment').value.replace(/,/g, '');
    let dp = parseFloat(dpRaw);
    const ir = parseFloat(document.getElementById('interestRate').value);
    let ltStr = document.getElementById('loanTermCustom').value;
    let lt = ltStr ? parseInt(ltStr) : loanTerm;
    const loanType = document.getElementById('loanType').value;
    const propTaxAnnual = parseFloat(document.getElementById('propertyTax').value) || 0;
    const insuranceAnnual = parseFloat(document.getElementById('homeInsurance').value) || 0;
    const pmiRate = parseFloat(document.getElementById('pmiRate').value) || 0;
    const hoaFees = parseFloat(document.getElementById('hoaFees').value) || 0;

    // Validations
    if (isNaN(hp) || hp < 10000) {
      alert('Please enter a valid Home Price >= $10,000');
      return false;
    }
    if (isNaN(dp) || dp < 0) {
      alert('Please enter a valid Down Payment');
      return false;
    }
    if (isNaN(ir) || ir <= 0 || ir > 30) {
      alert('Please enter a valid Interest Rate (1-30%)');
      return false;
    }
    if (isNaN(lt) || lt < 1 || lt > 50) {
      alert('Please enter a valid Loan Term (1 - 50 years)');
      return false;
    }

    // Apply Down Payment Mode
    if (dpMode === 'percent') {
      dp = (dp / 100) * hp;
    }

    if (dp >= hp) {
      alert('Down payment cannot be equal or greater than the Home Price');
      return false;
    }

    // Calculations
    const principal = hp - dp;
    const monthlyInterest = ir / 100 / 12;
    const totalPayments = lt * 12;

    // Monthly principal + interest using amortization formula
    const monthlyPI =
      (principal * monthlyInterest) / (1 - Math.pow(1 + monthlyInterest, -totalPayments));

    // PMI calculation
    let monthlyPMI = 0;
    const downPaymentPct = (dp / hp) * 100;

    if (loanType === 'fha') {
      monthlyPMI = (principal * (pmiRate / 100)) / 12;
    } else if (loanType !== 'va' && downPaymentPct < 20) {
      monthlyPMI = (principal * (pmiRate / 100)) / 12;
    }

    // Monthly property tax and insurance
    const monthlyPropertyTax = propTaxAnnual / 12;
    const monthlyInsurance = insuranceAnnual / 12;

    // Total monthly payment
    const totalMonthlyPayment = monthlyPI + monthlyPropertyTax + monthlyInsurance + monthlyPMI + hoaFees;

    // Update results and maintain state highlights

    // Tab highlight - keep the same selected tab
    setActiveTab(activeTab);

    // Highlight toggles active status
    dpTabs.forEach(t => {
      t.classList.toggle('active', t.dataset.mode === dpMode);
      t.setAttribute('aria-checked', t.dataset.mode === dpMode ? 'true' : 'false');
    });

    termBtns.forEach(t => {
      t.classList.toggle('active', +t.dataset.term === lt);
      t.setAttribute('aria-checked', +t.dataset.term === lt ? 'true' : 'false');
    });

    advToggle.classList.add('active');
    advToggle.setAttribute('aria-pressed', 'true');
    advOptions.classList.remove('hidden');
    advOptions.setAttribute('aria-expanded', 'true');

    // Voice button highlight remains until next command or automatic removal by voice interface

    // Display results with table
    const resultTotal = document.getElementById('resultTotal');
    const breakdown = document.getElementById('resultBreakdown');

    resultTotal.textContent = formatCurrency(totalMonthlyPayment);
    breakdown.innerHTML = '';

    function addRow(label, value) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${label}</td><td style="text-align:right;">${formatCurrency(value)}</td>`;
      breakdown.appendChild(tr);
    }

    addRow('Principal & Interest', monthlyPI);
    addRow('Property Tax', monthlyPropertyTax);
    addRow('Insurance', monthlyInsurance);

    if (monthlyPMI > 0) {
      addRow('PMI', monthlyPMI);
    }

    if (hoaFees > 0) {
      addRow('HOA Fees', hoaFees);
    }

    const totalInterest = (monthlyPI * totalPayments) - principal;
    addRow('Estimated Total Interest', totalInterest);

    // Announce calculation done
    statusAnnounce.textContent = 'Calculation complete.';

    return true;
  }

  // Bind calculate button
  calcBtn.addEventListener('click', performCalculation);

});
