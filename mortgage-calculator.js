(() => {
  "use strict";

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const money = (n) =>
    `$${n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // State data
  const stateTaxRates = { /* 50 states */ };
  const stateNames = { /* 50 states */ };

  let activeTerm = 30, usePct = false, recognition = null;

  // Elements
  const els = {
    homePrice: $("#home-price"),
    dpAmount: $("#dp-amount"),
    dpPercent: $("#dp-percent"),
    tabAmount: $("#tab-amount"),
    tabPercent: $("#tab-percent"),
    dpAmountWrap: $("#dp-amount-wrap"),
    dpPercentWrap: $("#dp-percent-wrap"),
    interestRate: $("#interest-rate"),
    termButtons: $("#term-buttons"),
    termCustom: $("#term-custom"),
    state: $("#state"),
    propertyTax: $("#property-tax"),
    pmiBanner: $("#pmi-banner"),
    pmiInfo: $("#pmi-info"),
    calcBtn: $("#calculate-btn"),
    totalPayment: $("#total-payment"),
    loanAmount: $("#loan-amount"),
    totalInterest: $("#total-interest"),
    piAmount: $("#pi-amount"),
    taxAmount: $("#tax-amount"),
    insuranceAmount: $("#insurance-amount"),
    pmiAmount: $("#pmi-amount"),
    hoaAmount: $("#hoa-amount"),
    rowPmi: $("#row-pmi"),
    breakdownChart: $("#breakdownChart"),
    amortChart: $("#amortizationChart"),
    insightsList: $("#insights-list"),
    voiceBtns: $$(".voice-btn")
  };

  function init() {
    populateStates();
    setTerm(30);
    switchDPMode(false);
    updatePropertyTax();
    setupListeners();
  }

  function populateStates() {
    const sel = els.state;
    Object.keys(stateNames).forEach(code => {
      const o = document.createElement("option");
      o.value = code; o.text = stateNames[code];
      sel.add(o);
    });
  }

  function setupListeners() {
    els.tabAmount.addEventListener("click", () => switchDPMode(false));
    els.tabPercent.addEventListener("click", () => switchDPMode(true));
    els.homePrice.addEventListener("input", () => {
      syncDP(usePct); updatePropertyTax();
    });
    els.dpAmount.addEventListener("input", () => syncDP(false));
    els.dpPercent.addEventListener("input", () => syncDP(true));
    els.state.addEventListener("change", updatePropertyTax);
    els.interestRate.addEventListener("input", calculate);
    els.termButtons.addEventListener("click", e => {
      const b = e.target.closest(".chip[data-term]");
      if (b) setTerm(+b.dataset.term);
    });
    els.termCustom.addEventListener("input", e => {
      if (+e.target.value >= 1 && +e.target.value <= 40) setTerm(+e.target.value);
    });
    els.calcBtn.addEventListener("click", calculate);
    els.voiceBtns.forEach(b => b.addEventListener("click", () => startVoice(b.dataset.field)));
  }

  function switchDPMode(toPct) {
    usePct = toPct;
    els.tabAmount.classList.toggle("active", !toPct);
    els.tabPercent.classList.toggle("active", toPct);
    els.dpAmountWrap.classList.toggle("hidden", toPct);
    els.dpPercentWrap.classList.toggle("hidden", !toPct);
    syncDP(toPct);
  }

  function syncDP(fromPct) {
    const price = +els.homePrice.value || 0;
    if (fromPct) {
      const pct = Math.min(100, +els.dpPercent.value || 0);
      els.dpAmount.value = Math.round(price * pct / 100);
    } else {
      const amt = +els.dpAmount.value || 0;
      const pct = price ? (amt / price * 100) : 0;
      els.dpPercent.value = pct.toFixed(1);
    }
    updatePMI();
  }

  function updatePropertyTax() {
    const price = +els.homePrice.value || 0;
    const rate = stateTaxRates[els.state.value]||0;
    els.propertyTax.value = Math.round(price * rate / 100);
  }

  function updatePMI() {
    const price = +els.homePrice.value || 0;
    const dp = +els.dpAmount.value||0;
    const pct = price ? (dp/price*100):0;
    if (pct<20) {
      els.pmiBanner.classList.remove("hidden");
      els.pmiInfo.textContent = pct.toFixed(1);
    } else {
      els.pmiBanner.classList.add("hidden");
    }
  }

  function setTerm(y) {
    activeTerm = y;
    $$(".chip").forEach(b => b.classList.toggle("active", +b.dataset.term===y));
    els.termCustom.value="";
  }

  function calculate() {
    const price = +els.homePrice.value||0;
    const dp = +els.dpAmount.value||0;
    const loan = Math.max(0, price-dp);
    const r = (+els.interestRate.value||0)/100/12;
    const m = activeTerm*12;
    if(!loan||!r||!m) return;

    const pi = r===0? loan/m : loan*(r*Math.pow(1+r,m))/(Math.pow(1+r,m)-1);
    const tax = (+els.propertyTax.value||0)/12;
    const ins=0, pmi=0, hoa=0;
    const total=pi+tax+ins+pmi+hoa;

    els.totalPayment.textContent=money(total);
    els.loanAmount.textContent=money(loan);
    els.totalInterest.textContent=money(pi*m-loan);
    els.piAmount.textContent=money(pi);
    els.taxAmount.textContent=money(tax);
    els.insuranceAmount.textContent=money(ins);
    els.pmiAmount.textContent=money(pmi);
    els.hoaAmount.textContent=money(hoa);

    renderCharts(loan,r,pi,m);
    renderInsights();
  }

  function renderCharts(loan,r,pi,m) {
    const dataPie={
      labels:["P&I","Taxes","Insurance","PMI","HOA"],
      datasets:[{data:[pi, +els.taxAmount.textContent.replace(/\D/g,''),0,0,0],
        backgroundColor:["#1e40af","#60a5fa","#10b981","#ef4444","#f59e0b"]}]
    };
    if(window.pieChart) pieChart.destroy();
    window.pieChart=new Chart(els.breakdownChart,{type:"pie",data:dataPie});

    const sched=[];
    let bal=loan;
    for(let i=1;i<=m&&bal>0;i++){
      const interest=bal*r; let princ=pi-interest; bal=Math.max(0,bal-princ);
      sched.push({month:i,balance:bal});
    }
    const labels=sched.map(s=>s.month),balData=sched.map(s=>s.balance);
    if(window.lineChart) lineChart.destroy();
    window.lineChart=new Chart(els.amortChart,{
      type:"line",
      data:{labels,datasets:[{data:balData,borderColor:"#1e40af"}]}
    });
  }

  function renderInsights() {
    const tips=[
      {icon:"fas fa-piggy-bank",title:"Down Payment Tip",msg:"Increasing your down payment reduces total interest."},
      {icon:"fas fa-percentage",title:"Rate Shopping Tip",msg:"Even a small rate decrease saves thousands over time."}
    ];
    els.insightsList.innerHTML=tips.map(t=>`
      <div class="insight-card">
        <div class="insight-icon"><i class="${t.icon}"></i></div>
        <div class="insight-content">
          <h4>${t.title}</h4><p>${t.msg}</p>
        </div>
      </div>`).join("");
  }

  function startVoice(field) {
    const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!Speech) return;
    recognition=new Speech();
    recognition.lang="en-US"; recognition.onresult=e=>{
      const txt=e.results[0][0].transcript.match(/\d+(\.\d+)?/);
      if(txt) els[field].value=txt[0];
      calculate();
    };
    recognition.start();
  }

  init();
})();
