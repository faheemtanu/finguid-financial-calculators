// mortgage-calculator.js
// AI-Enhanced Mortgage Calculator v3.0.0
// Implements Monthly Payment, Refinance & Affordability tabs, voice input, scenarios, API endpoint, CSV export, charts, accessibility

class MortgageCalculator {
  constructor() {
    this.currentTab = 'monthly';
    this.recognition = null;
    this.currentCalculation = null;
    this.scenarios = this.initScenarios();
    this.stateTaxRates = this.initStateTaxRates();
    this.init();
  }

  init() {
    this.cacheElements();
    this.bindEvents();
    this.setupVoiceRecognition();
    this.initChart();
    this.loadDefaults();
    this.autoCalculate();
  }

  cacheElements() {
    this.tabs = document.querySelectorAll('.tab-button');
    this.panels = document.querySelectorAll('.tab-content');
    this.calculateButtons = {
      monthly: document.getElementById('calculate-monthly'),
      refinance: document.getElementById('calculate-refinance'),
      affordability: document.getElementById('calculate-affordability')
    };
    this.downloadCsvBtn = document.getElementById('download-csv');
    this.viewScheduleBtn = document.getElementById('view-schedule');
  }

  bindEvents() {
    this.tabs.forEach(tab => {
      tab.addEventListener('click', e => this.switchTab(e.target.id.replace('tab-','')));
    });

    this.calculateButtons.monthly.addEventListener('click', () => this.calculateMonthly());
    this.calculateButtons.refinance.addEventListener('click', () => this.calculateRefinance());
    this.calculateButtons.affordability.addEventListener('click', () => this.calculateAffordability());
    this.downloadCsvBtn.addEventListener('click', () => this.downloadCsv());
    this.viewScheduleBtn.addEventListener('click', () => this.viewSchedule());

    document.getElementById('loan-type').addEventListener('change', () => this.onLoanTypeChange());
    document.getElementById('property-state').addEventListener('change', () => this.updatePropertyTax());

    ['home-price','down-payment','interest-rate','loan-term','custom-term',
     'property-tax','home-insurance','pmi-rate','va-funding-fee','hoa-fees',
     'current-balance','current-rate','new-rate','remaining-term','new-term','closing-costs',
     'annual-income','monthly-debts','down-payment-saved','dti-ratio']
      .forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', this.debounce(() => this.autoCalculate(),300));
      });

    document.getElementById('monthly-scenarios').addEventListener('change', () => this.loadScenario('monthly'));
    document.getElementById('refinance-scenarios').addEventListener('change', () => this.loadScenario('refinance'));
    document.getElementById('affordability-scenarios').addEventListener('change', () => this.loadScenario('affordability'));

    document.getElementById('start-voice').addEventListener('click', () => this.startVoice());
  }

  switchTab(tab) {
    this.tabs.forEach(t => t.classList.toggle('active', t.id==='tab-'+tab));
    this.panels.forEach(p => p.classList.toggle('active', p.id===tab+'-panel'));
    this.currentTab = tab;
    this.autoCalculate();
  }

  setupVoiceRecognition() {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) return;
    const Rec = window.SpeechRecognition||window.webkitSpeechRecognition;
    this.recognition = new Rec();
    this.recognition.lang = 'en-US';
    this.recognition.onresult = e => this.processVoice(e.results[0][0].transcript.toLowerCase());
    this.recognition.onend = () => document.getElementById('start-voice').innerHTML='<i class="fas fa-microphone"></i>';
  }

  startVoice() {
    if (!this.recognition) return;
    document.getElementById('start-voice').innerHTML='<i class="fas fa-stop"></i>';
    this.recognition.start();
  }

  processVoice(text) {
    const nums = (text.match(/\d+(\.\d+)?/g)||[]).map(n=>parseFloat(n));
    if (text.includes('home price') && nums[0]!=null) document.getElementById('home-price').value=nums[0];
    if (text.includes('down payment') && nums[0]!=null) document.getElementById('down-payment').value=nums[0];
    if (text.includes('interest rate') && nums[0]!=null) document.getElementById('interest-rate').value=nums[0];
    if (text.includes('calculate')) this.autoCalculate();
    this.autoCalculate();
  }

  initChart() {
    const ctx = document.getElementById('amortization-chart');
    if (!ctx) return;
    this.chart = new Chart(ctx, {
      type:'line', data:{
        labels:[], datasets:[
          {label:'Principal', data:[], borderColor:'#21808d', backgroundColor:'rgba(33,128,141,0.2)'},
          {label:'Interest', data:[], borderColor:'#f59e0b', backgroundColor:'rgba(245,158,11,0.2)'},
          {label:'Balance', data:[], borderColor:'#ef4444', backgroundColor:'rgba(239,68,68,0.2)', yAxisID:'y1'}
        ]
      }, options:{
        responsive:true, scales:{
          y:{position:'left', title:{display:true,text:'Payment'}},
          y1:{position:'right', title:{display:true,text:'Balance'}, grid:{drawOnChartArea:false}}
        }
      }
    });
  }

  loadDefaults() {
    document.getElementById('home-price').value=400000;
    document.getElementById('down-payment').value=80000;
    document.getElementById('interest-rate').value=6.75;
    document.getElementById('loan-term').value=30;
    this.onLoanTypeChange();
    this.updatePropertyTax();
  }

  getInputs(type) {
    const parse = id=>parseFloat(document.getElementById(id)?.value)||0;
    if (type==='monthly') {
      return {
        homePrice:parse('home-price'), downPayment:parse('down-payment'),
        rate:parse('interest-rate')/100, term:parse('loan-term')||parse('custom-term'),
        loanType:document.getElementById('loan-type').value,
        tax:parse('property-tax'), insurance:parse('home-insurance'),
        pmi:parse('pmi-rate')/100, vaFee:parse('va-funding-fee')/100, hoa:parse('hoa-fees')
      };
    }
    if (type==='refinance') {
      return {
        balance:parse('current-balance'), oldRate:parse('current-rate')/100,
        newRate:parse('new-rate')/100, oldTerm:parse('remaining-term'),
        newTerm:parse('new-term'), costs:parse('closing-costs')
      };
    }
    if (type==='affordability') {
      return {
        income:parse('annual-income'), debts:parse('monthly-debts'),
        down:parse('down-payment-saved'), dti:parse('dti-ratio')/100
      };
    }
  }

  validate(inputs,type) {
    if (type==='monthly' && (!inputs.homePrice||!inputs.rate||!inputs.term)) {
      alert('Enter Home price, rate & term'); return false;
    }
    if (type==='refinance' && (!inputs.balance||!inputs.oldRate||!inputs.newRate)) {
      alert('Enter balance and rates'); return false;
    }
    if (type==='affordability' && !inputs.income) {
      alert('Enter income'); return false;
    }
    return true;
  }

  calculateMonthly() {
    const i = this.getInputs('monthly'); if (!this.validate(i,'monthly')) return;
    const loan = i.homePrice - i.downPayment;
    const mRate = i.rate/12, n=i.term*12;
    const pi = loan*mRate*Math.pow(1+mRate,n)/(Math.pow(1+mRate,n)-1);
    const taxM=i.tax/12, insM=i.insurance/12, hoaM=i.hoa;
    let mi=0;
    const dpct=i.downPayment/i.homePrice*100;
    if (i.loanType==='fha') mi=loan*i.pmi/12;
    else if (i.loanType==='va') mi=0;
    else if (dpct<20) mi=loan*i.pmi/12;
    const total=pi+taxM+insM+hoaM+mi;
    const schedule=this.genSchedule(loan,mRate,pi,n);
    const totalInt=schedule.reduce((s,p)=>s+p.interest,0);
    this.displayMonthly({pi,taxM,insM,hoaM,mi,total,loan,schedule});
    this.updateChart(schedule);
    this.saveApi({monthlyPayment:Math.round(total),
      breakdown:{principalInterest:Math.round(pi),taxes:Math.round(taxM),
        insurance:Math.round(insM),pmi:Math.round(mi),hoa:Math.round(hoaM)},
      totalInterest:Math.round(totalInt)
    });
  }

  displayMonthly(r) {
    document.getElementById('monthly-payment-result').textContent=this.fmt(r.total);
    const bd=document.getElementById('monthly-breakdown');
    bd.innerHTML=`
      <tr><td>Principal & Interest</td><td class="amount">${this.fmt(r.pi)}</td></tr>
      <tr><td>Property Tax</td><td class="amount">${this.fmt(r.taxM)}</td></tr>
      <tr><td>Home Insurance</td><td class="amount">${this.fmt(r.insM)}</td></tr>
      <tr id="pmi-row" style="${r.mi>0?'':'display:none'}"><td>${document.getElementById('insurance-type').textContent}</td><td class="amount">${this.fmt(r.mi)}</td></tr>
      <tr><td>HOA Fees</td><td class="amount">${this.fmt(r.hoaM)}</td></tr>`;
    this.currentCalculation=r;
  }

  calculateRefinance() {
    const i=this.getInputs('refinance'); if (!this.validate(i,'refinance')) return;
    const oldN=i.oldTerm*12, newN=i.newTerm*12;
    const oldP=i.balance*(i.oldRate/12)*Math.pow(1+i.oldRate/12,oldN)/(Math.pow(1+i.oldRate/12,oldN)-1);
    const newP=i.balance*(i.newRate/12)*Math.pow(1+i.newRate/12,newN)/(Math.pow(1+i.newRate/12,newN)-1);
    const save=oldP-newP, breakeven=i.costs/Math.abs(save);
    document.getElementById('monthly-savings').textContent=this.fmt(Math.abs(save));
    const cmp=document.getElementById('refinance-comparison');
    cmp.innerHTML=`
      <tr><td>Monthly Payment</td><td class="amount">${this.fmt(oldP)}</td><td class="amount">${this.fmt(newP)}</td><td class="amount" style="color:${save>0?'var(--color-success)':'var(--color-error)'}">${save>0?'-':'+'}${this.fmt(Math.abs(save))}</td></tr>
      <tr><td>Interest Rate</td><td>${(i.oldRate*100).toFixed(2)}%</td><td>${(i.newRate*100).toFixed(2)}%</td><td style="color:var(--color-success)">${(i.oldRate - i.newRate).toFixed(2)}%</td></tr>
      <tr><td>Break-Even Point</td><td colspan="3">${Math.ceil(breakeven)} months</td></tr>`;
  }

  calculateAffordability() {
    const i=this.getInputs('affordability'); if (!this.validate(i,'affordability')) return;
    const mIncome=i.income/12, maxPay=mIncome*i.dti - i.debts;
    const estRate=0.065/12, estN=30*12;
    const estPI=maxPay*0.75;
    const loan=estPI/(estRate*Math.pow(1+estRate,estN)/(Math.pow(1+estRate,estN)-1));
    const maxPrice=loan + i.down;
    document.getElementById('max-home-price').textContent=this.fmt(maxPrice);
    const bd=document.getElementById('affordability-breakdown');
    bd.innerHTML=`
      <tr><td>Monthly Income</td><td class="amount">${this.fmt(mIncome)}</td></tr>
      <tr><td>Max Monthly Payment</td><td class="amount">${this.fmt(maxPay)}</td></tr>
      <tr><td>Estimated PI</td><td class="amount">${this.fmt(estPI)}</td></tr>
      <tr><td>Down Payment</td><td class="amount">${this.fmt(i.down)}</td></tr>
      <tr><td>Loan Amount</td><td class="amount">${this.fmt(loan)}</td></tr>`;
  }

  genSchedule(loan, mRate, payment, n) {
    let balance=loan, arr=[];
    for (let m=1; m<=n && balance>0; m++) {
      const interest=balance*mRate;
      let principal=payment-interest;
      if (principal>balance) principal=balance;
      balance-=principal;
      arr.push({month:m,principal,interest,balance});
    }
    return arr;
  }

  updateChart(schedule) {
    const yearly=[], labels=[], pr=[], ir=[], bal=[];
    let yr=1, sumP=0, sumI=0;
    schedule.forEach((p,i) => {
      sumP+=p.principal; sumI+=p.interest;
      if ((i+1)%12===0 || i===schedule.length-1) {
        labels.push('Year '+yr); pr.push(sumP); ir.push(sumI); bal.push(p.balance);
        yr++; sumP=0; sumI=0;
      }
    });
    this.chart.data.labels=labels;
    this.chart.data.datasets[0].data=pr;
    this.chart.data.datasets[1].data=ir;
    this.chart.data.datasets[2].data=bal;
    this.chart.update();
  }

  downloadCsv() {
    if (!this.currentCalculation?.schedule) return alert('No schedule');
    const rows=['Month,Principal,Interest,Total,Balance'];
    this.currentCalculation.schedule.forEach(p => {
      rows.push(`${p.month},${p.principal.toFixed(2)},${p.interest.toFixed(2)},${(p.principal+p.interest).toFixed(2)},${p.balance.toFixed(2)}`);
    });
    const blob=new Blob([rows.join('\n')],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download='schedule.csv';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  viewSchedule() {
    if (!this.currentCalculation?.schedule) return alert('No schedule');
    const modal=document.createElement('div');
    modal.className='modal'; modal.innerHTML=`
      <div class="modal-content">
        <h3>Amortization Schedule</h3>
        <table><thead><tr><th>#</th><th>Principal</th><th>Interest</th><th>Total</th><th>Balance</th></tr></thead><tbody>
          ${this.currentCalculation.schedule.map(p=>`
            <tr><td>${p.month}</td><td>${this.fmt(p.principal)}</td><td>${this.fmt(p.interest)}</td><td>${this.fmt(p.principal+p.interest)}</td><td>${this.fmt(p.balance)}</td></tr>
          `).join('')}
        </tbody></table>
        <button class="modal-close">Close</button>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector('.modal-close').onclick=()=>modal.remove();
  }

  saveApi(data) {
    localStorage.setItem('latestCalculationResults', JSON.stringify(data));
  }

  loadScenario(type) {
    const key=document.getElementById(type+'-scenarios').value;
    const data=this.scenarios[type][key];
    if (!data) return;
    Object.entries(data).forEach(([id,val])=>document.getElementById(id).value=val);
    this.autoCalculate();
  }

  onLoanTypeChange() {
    const type=document.getElementById('loan-type').value;
    document.getElementById('pmi-group').style.display=type==='va'?'none':'block';
    document.getElementById('va-fee-group').style.display=type==='va'?'block':'none';
    document.getElementById('pmi-label').textContent=type==='fha'?'MIP Rate (%)':'PMI Rate (%)';
    this.autoCalculate();
  }

  updatePropertyTax() {
    const state=document.getElementById('property-state').value;
    const price=parseFloat(document.getElementById('home-price').value)||0;
    const rate=this.stateTaxRates[state]||0;
    document.getElementById('property-tax').value=Math.round(price*rate);
  }

  initScenarios() {
    return {
      monthly:{
        'starter-home':{'home-price':'300000','down-payment':'60000','interest-rate':'6.5','loan-type':'conventional'},
        'fha-first-time':{'home-price':'250000','down-payment':'8750','interest-rate':'6.875','loan-type':'fha'},
        'va-loan':{'home-price':'350000','down-payment':'0','interest-rate':'6.25','loan-type':'va'}
      },
      refinance:{
        'rate-drop-1':{'current-balance':'320000','current-rate':'7.5','new-rate':'6.5','remaining-term':'27','new-term':'30','closing-costs':'8000'}
      },
      affordability:{
        'first-time-buyer':{'annual-income':'60000','monthly-debts':'400','down-payment-saved':'20000','dti-ratio':'43'}
      }
    };
  }

  initStateTaxRates() {
    return {CA:0.0081,TX:0.019,FL:0.0089,NY:0.0173};
  }

  fmt(val) {
    return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:0}).format(val);
  }

  debounce(fn,ms) {
    let t; return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms);};
  }

  autoCalculate() {
    if (this.currentTab==='monthly') this.calculateMonthly();
    if (this.currentTab==='refinance') this.calculateRefinance();
    if (this.currentTab==='affordability') this.calculateAffordability();
  }
}

document.addEventListener('DOMContentLoaded',()=>new MortgageCalculator());
