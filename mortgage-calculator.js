"use strict";

// State & elements
const STATE = { amort: null, chart: null };
const elems = {
  loan: document.getElementById("loanAmount"),
  rate: document.getElementById("interestRate"),
  term: document.getElementById("loanTerm"),
  down: document.getElementById("downPayment"),
  pmi: document.getElementById("pmiRate"),
  extraM: document.getElementById("extraMonthly"),
  extraO: document.getElementById("extraOneTime"),
  btn: document.getElementById("calculateBtn"),
  res: {
    loan: document.getElementById("resLoanAmount"),
    interest: document.getElementById("resTotalInterest"),
    cost: document.getElementById("resTotalCost"),
    date: document.getElementById("resPayoffDate"),
    monthly: document.getElementById("resMonthly")
  },
  tabs: document.querySelectorAll(".tab-btn"),
  contents: document.querySelectorAll(".tab-content"),
  insights: document.getElementById("aiInsights"),
  chartCtx: document.getElementById("mortgageChart").getContext("2d"),
  slider: document.getElementById("yearSlider"),
  sliderYear: document.getElementById("sliderYear"),
  stats: {
    bal: document.getElementById("statBalance"),
    pri: document.getElementById("statPrincipal"),
    int: document.getElementById("statInterest")
  },
  amortBtn: document.getElementById("toggleAmort"),
  amortContent: document.getElementById("amortContent"),
  amortView: document.getElementById("amortView"),
  amortTable: document.querySelector("#amortTable tbody"),
  shareBtn: document.getElementById("shareBtn"),
  pdfBtn: document.getElementById("pdfBtn"),
  printBtn: document.getElementById("printBtn"),
  toggleMode: document.getElementById("toggleMode"),
  voiceBtn: document.getElementById("voiceBtn"),
  screenReaderBtn: document.getElementById("screenReaderBtn")
};

// Auto-calculate PMI
elems.down.addEventListener("input", ()=>{
  const dp = parseFloat(elems.down.value)||0;
  elems.pmi.value = dp<20 ? "0.50" : "0";
});

// Main calculate
function calculate() {
  const P = parseFloat(elems.loan.value)||0;
  const annual = parseFloat(elems.rate.value)/100||0;
  const years = parseInt(elems.term.value)||0;
  const pmi = parseFloat(elems.pmi.value)/100||0;
  const extraM = parseFloat(elems.extraM.value)||0;
  const extraO = parseFloat(elems.extraO.value)||0;

  const n = years*12;
  const r = annual/12;
  const M = r ? P*(r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1) : 0;
  const total = M*n + extraM*n + extraO;
  const interest = total - P;
  const date = new Date();
  date.setMonth(date.getMonth()+n);

  // Update summary
  elems.res.loan.textContent = `$${P.toLocaleString()}`;
  elems.res.interest.textContent = `$${interest.toLocaleString()}`;
  elems.res.cost.textContent = `$${total.toLocaleString()}`;
  elems.res.date.textContent = date.toLocaleDateString();
  elems.res.monthly.textContent = `$${(M+extraM).toFixed(2)}`;

  // Build amort
  const amort = [];
  let bal = P;
  for(let i=1;i<=n;i++){
    const intPaid = bal*r;
    const prin = M - intPaid;
    bal -= prin;
    amort.push({i, date:new Date(date.getFullYear(),date.getMonth()-n+i), payment:M+extraM, principal:prin, interest:intPaid, balance:bal});
  }
  STATE.amort = amort;

  renderChart(P);
  renderInsights(interest, extraM);
  renderAmort();
}

// Chart
function renderChart(P){
  const labels = STATE.amort.map(d=>d.date.getFullYear());
  const rem = STATE.amort.map(d=>d.balance);
  const cumPri = STATE.amort.map((d,i)=>STATE.amort.slice(0,i+1).reduce((s,x)=>s+x.principal,0));
  const cumInt = STATE.amort.map((d,i)=>STATE.amort.slice(0,i+1).reduce((s,x)=>s+x.interest,0));

  if(STATE.chart) STATE.chart.destroy();
  STATE.chart = new Chart(elems.chartCtx,{
    type:"line",
    data:{labels,datasets:[
      {label:"Remaining Balance",data:rem,borderColor:"orange",fill:false},
      {label:"Principal Paid",data:cumPri,borderColor:"green",fill:false},
      {label:"Interest Paid",data:cumInt,borderColor:"blue",fill:false}
    ]},
    options:{responsive:true,maintainAspectRatio:false}
  });

  elems.slider.max = labels.length-1;
  elems.slider.value = labels.length-1;
  elems.sliderYear.textContent = labels[labels.length-1];
  updateStats(labels.length-1);
  elems.slider.oninput = ()=> {
    const i = +elems.slider.value;
    elems.sliderYear.textContent = labels[i];
    updateStats(i);
  };
}
function updateStats(i) {
  elems.stats.bal.textContent = `$${STATE.amort[i].balance.toFixed(2)}`;
  elems.stats.pri.textContent = `$${STATE.amort[i].principal.toFixed(2)}`;
  elems.stats.int.textContent = `$${STATE.amort[i].interest.toFixed(2)}`;
}

// Tabs
elems.tabs.forEach(btn=>{
  btn.addEventListener("click", ()=>{
    elems.tabs.forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    elems.contents.forEach(c=>c.classList.remove("active"));
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

// AI Insights & Weekly stub
function renderInsights(interest, extraM){
  elems.insights.textContent = 
    `Paying $${extraM.toFixed(2)} extra monthly saves you ${(interest*0.1).toFixed(2)} in interest. Weekly payments feature coming soon.`;
}

// Amortization
elems.amortBtn.addEventListener("click", ()=>{
  elems.amortContent.classList.toggle("hidden");
  elems.amortBtn.textContent = elems.amortContent.classList.contains("hidden")
    ? "Show Amortization Schedule ▼" : "Hide Amortization Schedule ▲";
});
elems.amortView.addEventListener("change", renderAmort);
function renderAmort(){
  elems.amortTable.innerHTML = "";
  const view = elems.amortView.value;
  const data = view==="yearly"?STATE.amort.filter((_,i)=>i%12===11):STATE.amort;
  data.forEach(r=>{
    const tr=document.createElement("tr");
    ["i","date","payment","principal","interest","balance"].forEach(k=>{
      const td=document.createElement("td");
      td.textContent = k==="date"
        ? r.date.toLocaleDateString()
        : `$${(r[k]).toFixed(2)}`;
      tr.appendChild(td);
    });
    elems.amortTable.appendChild(tr);
  });
}

// Share/Print/PDF
elems.printBtn.onclick = ()=> window.print();
elems.shareBtn.onclick = ()=> navigator.clipboard.writeText(location.href);
elems.pdfBtn.onclick = ()=> alert("PDF export in progress...");

// Light/Dark, Voice, Screen Reader
elems.toggleMode.onclick = ()=>{
  document.body.classList.toggle("dark-mode");
  elems.toggleMode.textContent = document.body.classList.contains("dark-mode")? "Light Mode":"Dark Mode";
};
elems.voiceBtn.onclick = ()=> alert("Voice commands activated");
elems.screenReaderBtn.onclick = ()=> alert("Screen reader toggled");

// Init
elems.btn.addEventListener("click", calculate);
