// mortigage.js — Production-ready Mortgage Calculator
// Notes:
// - Insurance input assumed annual; converted to monthly.
// - Property tax auto-filled from state selection (annual % of assessed value).
// - PMI charged monthly until current LTV <= 80%.
// - Extra monthly payments and one-time payment (applied at month 1) supported.
// - All UI elements are optional; script guards against missing nodes.

(() => {
  'use strict';

  // ---------- DOM helpers ----------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  // ---------- Format helpers ----------
  const fmtCurrency0 = (v) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

  const fmtCurrency2 = (v) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  const fmtNum = (v) => new Intl.NumberFormat('en-US').format(v);
  const fmtPct = (v, d = 2) => `${Number(v).toFixed(d)}%`;

  const debounce = (fn, wait = 300) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  };

  const parseNum = (val, fallback = 0) => {
    if (val == null) return fallback;
    if (typeof val === 'number') return isFinite(val) ? val : fallback;
    const s = String(val).replace(/[$,%\s,]/g, '');
    const n = parseFloat(s);
    return isFinite(n) ? n : fallback;
  };

  // ---------- Data: State names and annual property tax rates (%) ----------
  const stateTaxRates = {
    AL: 0.41, AK: 1.19, AZ: 0.62, AR: 0.61, CA: 0.75, CO: 0.51, CT: 2.14, DE: 0.57, FL: 0.83,
    GA: 0.89, HI: 0.28, ID: 0.63, IL: 2.27, IN: 0.85, IA: 1.53, KS: 1.41, KY: 0.86, LA: 0.55,
    ME: 1.28, MD: 1.06, MA: 1.17, MI: 1.54, MN: 1.12, MS: 0.61, MO: 0.97, MT: 0.84, NE: 1.73,
    NV: 0.53, NH: 2.05, NJ: 2.49, NM: 0.55, NY: 1.69, NC: 0.84, ND: 0.98, OH: 1.56, OK: 0.90,
    OR: 0.87, PA: 1.58, RI: 1.53, SC: 0.57, SD: 1.32, TN: 0.64, TX: 1.81, UT: 0.58, VT: 1.90,
    VA: 0.82, WA: 0.94, WV: 0.59, WI: 1.85, WY: 0.62
  };

  const stateNames = {
    AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut',
    DE: 'Delaware', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana',
    IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts',
    MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska',
    NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina',
    ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island',
    SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
    VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming'
  };

  // ---------- App state ----------
  const st = {
    usePctDownPayment: false,
    activeTermYears: 30,
    recognition: null,
    isAdvancedMode: false,
  };

  // ---------- Cache elements ----------
  const el = {
    // Inputs
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

    // Controls
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

    // Tables / modal
    amortizationBody: $('#amortization-body'),
    fullScheduleBody: $('#full-schedule-body'),
    scheduleModal: $('#schedule-modal'),
    viewFullSchedule: $('#view-full-schedule'),
    closeSchedule: $('#close-schedule'),

    // Actions
    calculateBtn: $('#calculate-btn'),
    resetBtn: $('#reset-form'),
    emailBtn: $('#email-results'),
    shareBtn: $('#share-results'),
    printBtn: $('#print-results'),

    // Voice
    voiceBtns: $$('.voice-btn'),
    voiceStatus: $('#voice-status'),

    // Scenarios
    scenarioBtns: $$('.scenario-btn'),
    insightsList: $('#insights-list'),
  };

  // ---------- Initialization ----------
  function init() {
    populateStates();
    setDefaults();
    bindEvents();
    setupVoice();
    calculate(); // initial
  }

  function populateStates() {
    if (!el.state) return;
    if (!el.state.querySelector('option[value=""]')) {
      const opt0 = document.createElement('option');
      opt0.value = '';
      opt0.textContent = 'Select State';
      el.state.appendChild(opt0);
    }
    // populate if not already populated
    const existingCodes = new Set(Array.from(el.state.options).map(o => o.value));
    Object.entries(stateNames).forEach(([code, name]) => {
      if (!existingCodes.has(code)) {
        const o = document.createElement('option');
        o.value = code;
        o.textContent = `${name} (${code})`;
        el.state.appendChild(o);
      }
    });
    el.state.value = el.state.value || 'CA';
  }

  function setDefaults() {
    setTerm(30);
    switchDPMode(false);
    updateTaxFromState();
    if (el.homeInsurance && !el.homeInsurance.value) el.homeInsurance.value = '1200'; // default annual insurance
    if (el.pmiRate && !el.pmiRate.value) el.pmiRate.value = '0.5'; // annual PMI rate %
  }

  // ---------- Event binding ----------
  function bindEvents() {
    if (el.tabAmount) el.tabAmount.addEventListener('click', () => switchDPMode(false));
    if (el.tabPercent) el.tabPercent.addEventListener('click', () => switchDPMode(true));

    if (el.homePrice) el.homePrice.addEventListener('input', () => {
      syncDownPayment(st.usePctDownPayment);
      updateTaxFromState();
      calculate();
    });

    if (el.dpAmount) el.dpAmount.addEventListener('input', debounce(() => {
      syncDownPayment(false);
      calculate();
    }));

    if (el.dpPercent) el.dpPercent.addEventListener('input', debounce(() => {
      syncDownPayment(true);
      calculate();
    }));

    if (el.state) el.state.addEventListener('change', () => {
      updateTaxFromState();
      calculate();
    });

    if (el.termButtons) {
      el.termButtons.addEventListener('click', (e) => {
        const btn = e.target.closest('.chip[data-term]');
        if (!btn) return;
        const y = parseInt(btn.dataset.term, 10);
        if (isFinite(y)) setTerm(y);
        calculate();
      });
    }

    if (el.termCustom) el.termCustom.addEventListener('input', debounce(() => {
      const y = parseInt(el.termCustom.value, 10);
      if (isFinite(y) && y > 0 && y <= 40) setTerm(y);
      calculate();
    }));

    if (el.advancedToggle) el.advancedToggle.addEventListener('click', () => {
      st.isAdvancedMode = !st.isAdvancedMode;
      if (el.advancedPanel) el.advancedPanel.classList.toggle('hidden', !st.isAdvancedMode);
    });

    // Auto-calc common inputs
    [
      el.interestRate, el.propertyTax, el.homeInsurance, el.pmiRate,
      el.hoaFees, el.extraMonthly, el.extraOnce
    ].filter(Boolean).forEach((input) => input.addEventListener('input', debounce(calculate)));

    if (el.calculateBtn) el.calculateBtn.addEventListener('click', calculate);
    if (el.resetBtn) el.resetBtn.addEventListener('click', resetForm);
    if (el.emailBtn) el.emailBtn.addEventListener('click', emailResults);
    if (el.shareBtn) el.shareBtn.addEventListener('click', shareResults);
    if (el.printBtn) el.printBtn.addEventListener('click', () => window.print());

    if (el.viewFullSchedule) el.viewFullSchedule.addEventListener('click', showFullSchedule);
    if (el.closeSchedule) el.closeSchedule.addEventListener('click', () => el.scheduleModal?.close());
    if (el.scheduleModal) {
      el.scheduleModal.addEventListener('click', (e) => {
        if (e.target === el.scheduleModal) el.scheduleModal.close();
      });
    }

    el.voiceBtns.forEach((btn) => {
      btn.addEventListener('click', () => startVoiceInput(btn.dataset.field));
    });

    el.scenarioBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const sc = btn.dataset.scenario;
        loadScenario(sc);
        calculate();
      });
    });
  }

  // ---------- Down payment ----------
  function switchDPMode(usePercent) {
    st.usePctDownPayment = !!usePercent;
    if (el.tabAmount) el.tabAmount.classList.toggle('active', !usePercent);
    if (el.tabPercent) el.tabPercent.classList.toggle('active', usePercent);
    if (el.dpAmountWrap) el.dpAmountWrap.classList.toggle('hidden', usePercent);
    if (el.dpPercentWrap) el.dpPercentWrap.classList.toggle('hidden', !usePercent);
    syncDownPayment(usePercent);
  }

  function syncDownPayment(fromPercent) {
    const price = parseNum(el.homePrice?.value, 0);
    if (!isFinite(price) || price <= 0) {
      if (el.dpAmount) el.dpAmount.value = '';
      if (el.dpPercent) el.dpPercent.value = '';
      updatePMIBanner(0);
      return;
    }
    if (fromPercent) {
      const pct = Math.min(100, Math.max(0, parseNum(el.dpPercent?.value, 0)));
      const amt = Math.round(price * pct / 100);
      if (el.dpAmount) el.dpAmount.value = String(amt);
      updatePMIBanner(pct);
    } else {
      const amt = Math.min(price, Math.max(0, parseNum(el.dpAmount?.value, 0)));
      const pct = price > 0 ? (amt / price * 100) : 0;
      if (el.dpPercent) el.dpPercent.value = pct.toFixed(1);
      updatePMIBanner(pct);
    }
  }

  function updatePMIBanner(dpPct) {
    if (!el.pmiBanner) return;
    const needsPMI = dpPct < 20;
    el.pmiBanner.classList.toggle('hidden', !needsPMI);
    if (needsPMI) {
      el.pmiBanner.innerHTML = `<div class="pmi-note">Down payment under 20% will trigger PMI until LTV reaches 80%.</div>`;
    } else {
      el.pmiBanner.textContent = '';
    }
  }

  // ---------- Term ----------
  function setTerm(years) {
    st.activeTermYears = years;
    if (!el.termButtons) return;
    $$('[data-term].chip', el.termButtons).forEach(c => c.classList.remove('active'));
    const btn = el.termButtons.querySelector(`[data-term="${years}"]`);
    if (btn) btn.classList.add('active');
  }

  // ---------- Property tax ----------
  function updateTaxFromState() {
    if (!el.propertyTax || !el.state) return;
    const code = el.state.value;
    const rate = stateTaxRates[code] ?? 0;
    el.propertyTax.value = String(rate);
  }

  // ---------- Voice ----------
  function setupVoice() {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        el.voiceBtns.forEach((b) => b.style.display = 'none');
        return;
      }
      st.recognition = new SpeechRecognition();
      st.recognition.continuous = false;
      st.recognition.interimResults = false;
      st.recognition.lang = 'en-US';
      st.recognition.maxAlternatives = 1;
      st.recognition.onresult = (ev) => {
        const transcript = ev.results.transcript.toLowerCase();
        processVoiceCommand(transcript);
        hideVoiceStatus();
      };
      st.recognition.onerror = () => {
        hideVoiceStatus();
        notify('Voice recognition error. Try again.');
      };
      st.recognition.onend = hideVoiceStatus;
    } catch {
      el.voiceBtns.forEach((b) => b.style.display = 'none');
    }
  }

  function startVoiceInput(field) {
    if (!st.recognition) return;
    showVoiceStatus(`Listening for ${field || 'input'}...`);
    try { st.recognition.start(); } catch { /* ignore */ }
  }

  function showVoiceStatus(msg) {
    if (!el.voiceStatus) return;
    el.voiceStatus.querySelector('.text')?.replaceChildren(document.createTextNode(msg));
    el.voiceStatus.classList.remove('hidden');
    const close = el.voiceStatus.querySelector('.voice-close');
    if (close) close.addEventListener('click', hideVoiceStatus, { once: true });
  }

  function hideVoiceStatus() {
    el.voiceStatus?.classList.add('hidden');
  }

  function processVoiceCommand(t) {
    // Simple extraction examples
    // "home price 450000", "down payment 20 percent", "interest 6.5", "hoa 100"
    const num = (re) => {
      const m = t.match(re);
      return m ? parseNum(m[1]) : null;
    };
    if (el.homePrice) {
      const v = num(/home price\\s+(\\d+[\\d,\\.]*)/);
      if (v != null) el.homePrice.value = String(v);
    }
    if (el.dpPercent) {
      const v = num(/down payment\\s+(\\d+[\\d\\.]*)\\s*percent/);
      if (v != null) {
        switchDPMode(true);
        el.dpPercent.value = String(v);
        syncDownPayment(true);
      }
    }
    if (el.interestRate) {
      const v = num(/interest\\s+(\\d+[\\d\\.]*)/);
      if (v != null) el.interestRate.value = String(v);
    }
    if (el.hoaFees) {
      const v = num(/hoa\\s+(\\d+[\\d\\.]*)/);
      if (v != null) el.hoaFees.value = String(v);
    }
    calculate();
  }

  // ---------- Notifications ----------
  function notify(msg) {
    // Hook to UI toast/snackbar if available
    console.log(msg);
  }

  // ---------- Core calculations ----------
  function monthlyPI(principal, rateAnnualPct, termYears) {
    const n = Math.round(termYears * 12);
    const r = parseNum(rateAnnualPct, 0) / 1200;
    if (n <= 0) return 0;
    if (r === 0) return principal / n;
    const pmt = principal * (r / (1 - Math.pow(1 + r, -n)));
    return pmt;
  }

  function buildSchedule(opts) {
    const {
      price, principal, rateAnnualPct, termYears,
      annualTaxPct, annualInsurance, pmiAnnualPct,
      hoaMonthly, extraMonthly, extraOnce
    } = opts;

    const n = Math.round(termYears * 12);
    const r = parseNum(rateAnnualPct, 0) / 1200;
    const taxMonthly = (price * (parseNum(annualTaxPct, 0) / 100)) / 12;
    const insMonthly = parseNum(annualInsurance, 0) / 12;
    const hoa = parseNum(hoaMonthly, 0);
    const extraM = Math.max(0, parseNum(extraMonthly, 0));
    let bal = principal;
    let schedule = [];
    let totalInterest = 0;
    let totalPrincipal = 0;

    const pmiAnnualRate = Math.max(0, parseNum(pmiAnnualPct, 0)) / 100;
    const ltvDropBalance = price * 0.8; // PMI stops when balance <= 80% of price

    for (let m = 1; m <= n && bal > 0.01; m++) {
      const interest = r > 0 ? bal * r : 0;
      let basePI = r > 0 ? principal * (r / (1 - Math.pow(1 + r, -n))) : principal / n; // fixed PI
      let pmiMonthly = (pmiAnnualRate > 0 && bal > ltvDropBalance) ? (principal * pmiAnnualRate) / 12 : 0;

      // Apply extra payments
      let principalPart = basePI - interest;
      let extraThisMonth = extraM + (m === 1 ? Math.max(0, parseNum(extraOnce, 0)) : 0);
      let totalPrincipalThisMonth = Math.min(bal, principalPart + extraThisMonth);

      bal = Math.max(0, bal - totalPrincipalThisMonth);
      totalInterest += interest;
      totalPrincipal += totalPrincipalThisMonth;

      schedule.push({
        month: m,
        interest,
        principal: totalPrincipalThisMonth,
        balance: bal,
        tax: taxMonthly,
        insurance: insMonthly,
        pmi: pmiMonthly,
        hoa
      });
    }
    return { schedule, totals: { totalInterest, totalPrincipal } };
  }

  function collectInputs() {
    const price = parseNum(el.homePrice?.value, 0);
    const dpAmt = parseNum(el.dpAmount?.value, 0);
    const dpPct = parseNum(el.dpPercent?.value, 0);
    const ir = parseNum(el.interestRate?.value, 0);
    const termY = st.activeTermYears;

    const stateCode = el.state?.value || '';
    // Property tax can be overridden by user; default from state
    const taxPct = parseNum(el.propertyTax?.value, stateTaxRates[stateCode] || 0);

    const insAnnual = parseNum(el.homeInsurance?.value, 0);
    const pmiPct = parseNum(el.pmiRate?.value, 0);
    const hoa = parseNum(el.hoaFees?.value, 0);
    const extraM = parseNum(el.extraMonthly?.value, 0);
    const extraOnce = parseNum(el.extraOnce?.value, 0);

    // Resolve down payment
    let downAmt = dpAmt;
    if (st.usePctDownPayment) {
      downAmt = Math.round(price * Math.min(100, Math.max(0, dpPct)) / 100);
    }
    const principal = Math.max(0, price - downAmt);
    return {
      price, downAmt, dpPct: price > 0 ? (downAmt / price * 100) : 0,
      ir, termY, taxPct, insAnnual, pmiPct, hoa, extraM, extraOnce, principal
    };
  }

  function calculate() {
    const inp = collectInputs();
    if (inp.price <= 0 || inp.principal <= 0 || inp.termY <= 0) {
      renderResults(null, inp);
      return;
    }

    const pi = monthlyPI(inp.principal, inp.ir, inp.termY);
    const taxM = (inp.price * (inp.taxPct / 100)) / 12;
    const insM = inp.insAnnual / 12;
    const pmiM = (inp.dpPct < 20 && inp.pmiPct > 0) ? (inp.principal * (inp.pmiPct / 100)) / 12 : 0;
    const hoa = inp.hoa;

    const { schedule, totals } = buildSchedule({
      price: inp.price,
      principal: inp.principal,
      rateAnnualPct: inp.ir,
      termYears: inp.termY,
      annualTaxPct: inp.taxPct,
      annualInsurance: inp.insAnnual,
      pmiAnnualPct: inp.pmiPct,
      hoaMonthly: inp.hoa,
      extraMonthly: inp.extraM,
      extraOnce: inp.extraOnce
    });

    const monthlyTotal = pi + taxM + insM + pmiM + hoa;
    const totalPayment = monthlyTotal * schedule.length;

    renderResults({
      monthlyTotal, pi, taxM, insM, pmiM, hoa, totalPayment,
      loanAmount: inp.principal, totalInterest: totals.totalInterest, schedule
    }, inp);
  }

  // ---------- Rendering ----------
  function renderResults(res, inp) {
    // Handle totals and rows visibility
    if (!res) {
      setText(el.totalPayment, '—');
      setText(el.loanAmount, '—');
      setText(el.totalInterest, '—');
      setText(el.piAmount, '—');
      setText(el.taxAmount, '—');
      setText(el.insuranceAmount, '—');
      if (el.rowPmi) el.rowPmi.classList.add('hidden');
      setText(el.pmiAmount, '—');
      setText(el.hoaAmount, '—');
      if (el.amortizationBody) el.amortizationBody.innerHTML = '';
      if (el.fullScheduleBody) el.fullScheduleBody.innerHTML = '';
      return;
    }

    setText(el.totalPayment, fmtCurrency0(res.totalPayment));
    setText(el.loanAmount, fmtCurrency0(res.loanAmount));
    setText(el.totalInterest, fmtCurrency0(res.totalInterest));
    setText(el.piAmount, fmtCurrency0(res.pi));
    setText(el.taxAmount, fmtCurrency0(res.taxM));
    setText(el.insuranceAmount, fmtCurrency0(res.insM));

    if (res.pmiM > 0) {
      if (el.rowPmi) el.rowPmi.classList.remove('hidden');
      setText(el.pmiAmount, fmtCurrency0(res.pmiM));
    } else {
      if (el.rowPmi) el.rowPmi.classList.add('hidden');
      setText(el.pmiAmount, fmtCurrency0(0));
    }
    setText(el.hoaAmount, fmtCurrency0(res.hoa));

    // Amortization table (short view)
    if (el.amortizationBody) {
      const first = res.schedule.slice(0, 12);
      el.amortizationBody.innerHTML = first.map(rowToTr).join('');
    }
    // Full schedule (lazy; filled on demand too)
    if (el.fullScheduleBody && el.fullScheduleBody.dataset.ready !== '1') {
      el.fullScheduleBody.innerHTML = res.schedule.map(rowToTr).join('');
      el.fullScheduleBody.dataset.ready = '1';
    }

    // PMI banner state based on inputs
    updatePMIBanner(inp.dpPct);
  }

  function rowToTr(r) {
    return `<tr>
      <td>${r.month}</td>
      <td>${fmtCurrency2(r.principal)}</td>
      <td>${fmtCurrency2(r.interest)}</td>
      <td>${fmtCurrency2(r.tax)}</td>
      <td>${fmtCurrency2(r.insurance)}</td>
      <td>${fmtCurrency2(r.pmi)}</td>
      <td>${fmtCurrency2(r.hoa)}</td>
      <td>${fmtCurrency2(r.balance)}</td>
    </tr>`;
  }

  function setText(node, text) {
    if (!node) return;
    node.textContent = text;
  }

  // ---------- Actions ----------
  function resetForm() {
    if (el.homePrice) el.homePrice.value = '';
    if (el.dpAmount) el.dpAmount.value = '';
    if (el.dpPercent) el.dpPercent.value = '';
    if (el.interestRate) el.interestRate.value = '';
    if (el.termCustom) el.termCustom.value = '';
    if (el.state) el.state.value = 'CA';
    updateTaxFromState();
    if (el.homeInsurance) el.homeInsurance.value = '1200';
    if (el.pmiRate) el.pmiRate.value = '0.5';
    if (el.hoaFees) el.hoaFees.value = '';
    if (el.extraMonthly) el.extraMonthly.value = '';
    if (el.extraOnce) el.extraOnce.value = '';
    setTerm(30);
    switchDPMode(false);
    calculate();
  }

  function emailResults() {
    // Build a simple mailto with summary
    const total = el.totalPayment?.textContent || '';
    const loan = el.loanAmount?.textContent || '';
    const subject = encodeURIComponent('Mortgage Calculation Results');
    const body = encodeURIComponent(`Loan Amount: ${loan}\nTotal Payment (est.): ${total}\n\nGenerated by Mortgage Calculator`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  function shareResults() {
    const data = {
      title: 'Mortgage Calculation',
      text: 'Check out these mortgage calculation results.',
      url: window.location.href
    };
    if (navigator.share) {
      navigator.share(data).catch(() => notify('Share cancelled'));
    } else {
      navigator.clipboard?.writeText(window.location.href);
      notify('Link copied to clipboard');
    }
  }

  function showFullSchedule() {
    if (el.scheduleModal) el.scheduleModal.showModal?.();
    // Full schedule already rendered in renderResults
  }

  // ---------- Scenarios ----------
  function loadScenario(id) {
    // Example scenarios; adapt as needed
    if (!id) return;
    const price = parseNum(el.homePrice?.value, 400000);

    if (id === 'low-rate') {
      if (el.interestRate) el.interestRate.value = '5.5';
      if (el.dpPercent) { switchDPMode(true); el.dpPercent.value = '20'; syncDownPayment(true); }
    } else if (id === 'low-down') {
      if (el.interestRate) el.interestRate.value = '6.8';
      if (el.dpPercent) { switchDPMode(true); el.dpPercent.value = '5'; syncDownPayment(true); }
    } else if (id === 'extra-pay') {
      if (el.interestRate) el.interestRate.value = '6.25';
      if (el.dpPercent) { switchDPMode(true); el.dpPercent.value = '15'; syncDownPayment(true); }
      if (el.extraMonthly) el.extraMonthly.value = '200';
    } else if (id === 'starter') {
      if (el.homePrice) el.homePrice.value = String(price);
      if (el.interestRate) el.interestRate.value = '6.5';
      if (el.dpPercent) { switchDPMode(true); el.dpPercent.value = '10'; syncDownPayment(true); }
      if (el.extraMonthly) el.extraMonthly.value = '0';
      if (el.extraOnce) el.extraOnce.value = '0';
    }
  }

  // ---------- Boot ----------
  document.addEventListener('DOMContentLoaded', init);
})();
