document.addEventListener('DOMContentLoaded', () => {
  'use strict';
  // Utility selectors
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  // Formatting
  const formatCurrency = amt =>
    new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(amt);
  const formatNumber = num =>
    new Intl.NumberFormat('en-US').format(num);
  // State
  let calculatorState = { recognition: null, currentCalculation: null, voiceFieldIndex: 0 };
  // DOM
  const homePrice     = $('#home-price');
  const dpAmount      = $('#dp-amount');
  const dpPercent     = $('#dp-percent');
  const rateInput     = $('#interest-rate');
  const termInput     = $('#term-custom');
  const stateSelect   = $('#state');
  const propertyTax   = $('#property-tax');
  const pmiRateInput  = $('#pmi-rate');
  const hoaInput      = $('#hoa-fees');
  const insInput      = $('#home-insurance');
  const extraMonthly  = $('#extra-monthly');
  const extraOnce     = $('#extra-once');
  const calcBtn       = $('#calculate-btn');
  const advToggle     = $('#advanced-toggle');
  const advPanel      = $('#advanced-panel');
  const totalPayEl    = $('#total-payment');
  const loanAmtEl     = $('#loan-amount');
  const totalIntEl    = $('#total-interest');
  const amortBody     = $('#amortization-body');
  const emailBtn      = $('#email-results');
  const shareBtn      = $('#share-results');
  const printBtn      = $('#print-results');
  const voiceBtns     = $$('.voice-btn');
  const globalMic     = $('#global-mic');
  const termButtons   = $('#term-buttons');
  const tabAmount     = $('#tab-amount');
  const tabPercent    = $('#tab-percent');
  const dpAmountWrap  = $('#dp-amount-wrap');
  const dpPercentWrap = $('#dp-percent-wrap');
  const pmiBanner     = $('#pmi-banner');

  // Tax data
  const stateNames = {
    AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',
    CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',
    IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',
    ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',
    MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',
    NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',
    OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',
    SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',
    WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming'
  };
  const stateTaxRates = {
    AL:0.41,AK:1.19,AZ:0.62,AR:0.61,CA:0.75,CO:0.51,CT:2.14,DE:0.57,FL:0.83,GA:0.89,
    HI:0.28,ID:0.63,IL:2.27,IN:0.85,IA:1.53,KS:1.41,KY:0.86,LA:0.55,ME:1.28,MD:1.06,
    MA:1.17,MI:1.54,MN:1.12,MS:0.61,MO:0.97,MT:0.84,NE:1.73,NV:0.53,NH:2.05,NJ:2.49,
    NM:0.55,NY:1.69,NC:0.84,ND:0.98,OH:1.56,OK:0.90,OR:0.87,PA:1.58,RI:1.53,SC:0.57,
    SD:1.32,TN:0.64,TX:1.81,UT:0.58,VT:1.90,VA:0.82,WA:0.94,WV:0.59,WI:1.85,WY:0.62
  };

  // Populate state dropdown
  Object.entries(stateNames).forEach(([code,name]) => {
    stateSelect.insertAdjacentHTML('beforeend',
      `<option value="${code}">${name} (${code})</option>`);
  });
  stateSelect.value = 'CA';

  // Voice fields ordered for global voice navigation
  const voiceFields = [
    homePrice, dpAmount, dpPercent, rateInput, termInput,
    stateSelect, propertyTax, pmiRateInput, hoaInput, insInput,
    extraMonthly, extraOnce
  ].filter(Boolean);

  // Down payment mode switching
  function switchDPMode(usePercent) {
    calculatorState.usePctDownPayment = usePercent;
    if(tabAmount) tabAmount.classList.toggle('active', !usePercent);
    if(tabPercent) tabPercent.classList.toggle('active', usePercent);
    if(dpAmountWrap) dpAmountWrap.classList.toggle('hidden', usePercent);
    if(dpPercentWrap) dpPercentWrap.classList.toggle('hidden', !usePercent);
    syncDownPayment(usePercent);
  }

  // Sync down payment inputs
  function syncDownPayment(fromPercent) {
    const homePriceVal = parseFloat(homePrice?.value || 0);
    if (fromPercent) {
      const pct = Math.min(100, Math.max(0, parseFloat(dpPercent?.value || 0)));
      const amt = Math.round(homePriceVal * pct / 100);
      if (dpAmount) dpAmount.value = amt;
    } else {
      const amt = Math.min(homePriceVal, Math.max(0, parseFloat(dpAmount?.value || 0)));
      const pct = homePriceVal > 0 ? (amt / homePriceVal * 100) : 0;
      if (dpPercent) dpPercent.value = pct.toFixed(1);
    }
    updatePMIBanner();
  }

  // Update PMI Banner visibility
  function updatePMIBanner(){
    if(!pmiBanner || !dpPercent) return;
    const dpPct = parseFloat(dpPercent.value || 0);
    const needsPMI = dpPct < 20;
    pmiBanner.classList.toggle('hidden', !needsPMI);
    if(needsPMI){
      pmiBanner.textContent = "PMI applies for down payments under 20%";
    }
  }

  // Handle home price changes
  function handleHomePriceChange(){
    syncDownPayment(calculatorState.usePctDownPayment);
    updatePropertyTax();
    updateInsurance();
  }

  // Update property tax based on state selection and home price
  function updatePropertyTax() {
    if(!propertyTax || !stateSelect) return;
    const rate = stateTaxRates[stateSelect.value] || 0;
    const val = parseFloat(homePrice.value)||0;
    const annualTax = val * rate / 100;
    propertyTax.value = annualTax.toFixed(2);
  }

  // Update insurance (placeholder logic)
  function updateInsurance(){
    if(!insInput) return;
    // Assuming a simple fixed annual insurance rate for demonstration; customize as needed
    insInput.value = (parseFloat(homePrice.value) * 0.005).toFixed(2); // 0.5% yearly insurance
  }

  // Toggle advanced section
  advToggle.addEventListener('click', () => {
    const expanded = advToggle.getAttribute('aria-expanded') === 'true';
    advToggle.setAttribute('aria-expanded', !expanded);
    advToggle.classList.toggle('active');
    advPanel.hidden = expanded;
  });

  // Calculate mortgage and update UI
  function calculate() {
    try {
      const P = parseFloat(homePrice.value)||0;
      const dp = parseFloat(dpAmount.value)||0;
      const L = Math.max(P-dp, 0);
      const annualRate = parseFloat(rateInput.value)||0;
      const r = annualRate/100/12;
      const n = (parseFloat(termInput.value)||30)*12;
      const M0 = L>0 ? L*r/(1-Math.pow(1+r,-n)) : 0;
      // extras
      const extraM = parseFloat(extraMonthly.value)||0;
      const extraO = parseFloat(extraOnce.value)||0;
      const HOA   = parseFloat(hoaInput.value)||0;
      const INS   = (parseFloat(insInput.value)||0)/12;
      const PMIrate = (parseFloat(pmiRateInput.value)||0)/100;
      const PMI   = dp/P < 0.2 ? (L*PMIrate/12) : 0;
      const M = M0 + extraM + HOA + INS + PMI;
      totalPayEl.textContent = formatCurrency(M);
      loanAmtEl.textContent  = formatCurrency(L);
      totalIntEl.textContent = formatCurrency(M*n - L);
      // amort schedule
      amortBody.innerHTML = '';
      let bal = L;
      for(let i=1; i<=60; i++){
        const ip = bal * r;
        const pp = M0 - ip;
        bal -= pp;
        amortBody.insertAdjacentHTML('beforeend',
          `<tr>
             <td>${i}</td>
             <td class="currency">${formatCurrency(M)}</td>
             <td class="currency">${formatCurrency(pp)}</td>
             <td class="currency">${formatCurrency(ip)}</td>
             <td class="currency">${formatCurrency(bal)}</td>
           </tr>`
        );
      }
      calculatorState.currentCalculation = { monthlyPayment: M };
      // analytics event trigger placeholder
      window.gtag?.('event','calculate',{
        event_category:'Mortgage',
        event_label:'Standard',
        value:Math.round(M)
      });
    } catch(e){
      console.error('Calc error', e);
    }
  }

  // Email results
  function emailResults(){
    const c = calculatorState.currentCalculation;
    if(!c) return;
    const body = `Payment: ${formatCurrency(c.monthlyPayment)}`;
    window.location = `mailto:?subject=Mortgage Calculation&body=${encodeURIComponent(body)}`;
  }

  // Share results
  function shareResults(){
    if(navigator.share){
      navigator.share({
        title: 'Mortgage Calculation',
        text: `Monthly payment: ${formatCurrency(calculatorState.currentCalculation.monthlyPayment)}`,
        url: location.href
      });
    }
  }

  // Voice recognition setup with reading and auto next focus
  function setupVoiceRecognition() {
    try {
      const SR = window.SpeechRecognition||window.webkitSpeechRecognition;
      if (!SR) throw 'no support';
      calculatorState.recognition = new SR();
      calculatorState.recognition.continuous = false;
      calculatorState.recognition.interimResults = false;
      calculatorState.recognition.lang = 'en-US';
      calculatorState.recognition.maxAlternatives = 1;

      calculatorState.recognition.onresult = e => {
        const transcriptRaw = e.results[0][0].transcript.trim();
        const currentField = voiceFields[calculatorState.voiceFieldIndex];
        let valToSet = '';

        // For select: match option text if possible
        if (currentField.tagName === 'SELECT') {
          const lowerTranscript = transcriptRaw.toLowerCase();
          const option = Array.from(currentField.options).find(opt =>
            opt.text.toLowerCase().includes(lowerTranscript));
          if(option){
            valToSet = option.value;
          }
        } else {
          // Extract numbers and decimal points only for input fields
          const numbers = transcriptRaw.match(/[\d\.]+/g);
          if(numbers) valToSet = numbers.join('');
        }

        if(valToSet){
          currentField.value = valToSet;
          if(currentField.id === 'dp-amount' || currentField.id === 'dp-percent'){
            // Sync the down payment fields after voice input
            if(currentField.id === 'dp-amount'){
              // sync percent from amount
              const homeVal = parseFloat(homePrice.value) || 0;
              if(homeVal > 0){
                dpPercent.value = ((parseFloat(valToSet)||0) / homeVal * 100).toFixed(1);
              }
            } else if(currentField.id === 'dp-percent'){
              // sync amount from percent
              const homeVal = parseFloat(homePrice.value) || 0;
              if(homeVal > 0){
                dpAmount.value = Math.round(homeVal * (parseFloat(valToSet)||0) / 100);
              }
            }
            updatePMIBanner();
          }
          if(currentField.id === 'home-price'){
            updatePropertyTax();
            updateInsurance();
            syncDownPayment(calculatorState.usePctDownPayment || false);
          }
          if(currentField.id === 'state'){
            updatePropertyTax();
          }
        }

        // Speak back confirmed value with speech synthesis
        let speakText = '';
        if(currentField.tagName === 'SELECT'){
          speakText = (currentField.options[currentField.selectedIndex]?.text) || valToSet;
        }
        else if(currentField.type === 'number'){
          if(valToSet.includes('.')){
            // Format as decimal number for speaking
            speakText = valToSet.replace('.', ' point ');
          } else {
            // Format with commas for thousands
            speakText = formatNumber(parseFloat(valToSet) || valToSet);
          }
        } else {
          speakText = valToSet || transcriptRaw;
        }
        const utterance = new SpeechSynthesisUtterance(speakText);
        utterance.lang = 'en-US';

        utterance.onend = () => {
          // Advance to next field and focus
          calculatorState.voiceFieldIndex++;
          if(calculatorState.voiceFieldIndex >= voiceFields.length){
            calculatorState.voiceFieldIndex = 0; // loop to first field
          }
          voiceFields[calculatorState.voiceFieldIndex].focus();
        };

        window.speechSynthesis.speak(utterance);
      };

      calculatorState.recognition.onerror = e => {
        console.error('Voice Recognition Error:', e.error);
      };
    } catch(e){
      console.warn('SpeechRecognition not supported or error:', e);
      voiceBtns.forEach(b => b.style.display = 'none');
      if(globalMic) globalMic.style.display = 'none';
    }
  }

  // When any voice button clicked (per field)
  function startVoiceInput(fieldId){
    const index = voiceFields.findIndex(f => f.id === fieldId);
    if(index >= 0){
      calculatorState.voiceFieldIndex = index;
    }
    calculatorState.recognition.start();
  }

  // Global voice input button for ordered navigation
  if(globalMic){
    globalMic.addEventListener('click', () =>{
      voiceFields[calculatorState.voiceFieldIndex].focus();
      calculatorState.recognition.start();
    });
  }

  // Handle home price input sync
  homePrice.addEventListener('input', () => {
    syncDownPayment(calculatorState.usePctDownPayment || false);
    updatePropertyTax();
    updateInsurance();
  });

  // Sync down payment inputs events
  if(dpAmount) dpAmount.addEventListener('input', () => {
    syncDownPayment(false);
  });
  if(dpPercent) dpPercent.addEventListener('input', () => {
    syncDownPayment(true);
  });

  // State change event for tax update
  if(stateSelect) stateSelect.addEventListener('change', updatePropertyTax);

  // Term selection buttons event - if they exist
  if(termButtons){
    termButtons.addEventListener('click', e => {
      const btn = e.target.closest('.chip[data-term]');
      if(btn){
        setTerm(parseInt(btn.dataset.term));
      }
    });
  }

  // Custom term input event
  if(termInput){
    termInput.addEventListener('input', e => {
      const val = parseInt(e.target.value);
      if (val > 0) {
        setTerm(val);
      }
    });
  }

  // Set term function
  function setTerm(years){
    if(termInput) termInput.value = years;
    calculatorState.activeTerm = years;
  }

  // Setup down payment mode toggle events
  if(tabAmount) tabAmount.addEventListener('click', () => switchDPMode(false));
  if(tabPercent) tabPercent.addEventListener('click', () => switchDPMode(true));

  // Toggle advanced panel handled above in advToggle event

  // Calculate, email, share, print event listeners
  calcBtn.addEventListener('click', calculate);
  emailBtn.addEventListener('click', emailResults);
  shareBtn.addEventListener('click', shareResults);
  printBtn.addEventListener('click', () => window.print());

  // Voice buttons event listeners
  voiceBtns.forEach(b => {
    b.addEventListener('click', () => startVoiceInput(b.dataset.field));
  });

  // Initialize features
  switchDPMode(false);
  updatePropertyTax();
  updateInsurance();
  setupVoiceRecognition();
  calculate();

});
