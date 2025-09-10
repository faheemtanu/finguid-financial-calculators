/* Mortgage Calculator 2025 — Finguid
   Features:
   • Fixed/Custom term with highlight
   • $/ % DP tabs with sync + PMI banner
   • Advanced options accordion
   • Extra payments (monthly + one-time)
   • Pie & line charts via Canvas
   • Loan comparison scenarios
   • Full schedule modal per custom term
   • Voice input (Web Speech API fallback)
   • Actionable AI Insights
   • Email Results via mailto (no backend)
*/

(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const money = (n) =>
    `$${n.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  // State tax rates (%)
  const stateTaxRates = {
    AL:0.41,AK:1.24,AZ:0.60,AR:0.66,CA:0.81,CO:0.52,CT:2.16,DE:0.62,FL:0.89,GA:0.95,
    HI:0.29,ID:0.63,IL:2.29,IN:0.83,IA:1.59,KS:1.40,KY:0.89,LA:0.62,ME:1.29,MD:1.07,
    MA:1.19,MI:1.53,MN:1.10,MS:0.81,MO:1.00,MT:0.83,NE:1.70,NV:0.55,NH:2.09,NJ:2.46,
    NM:0.84,NY:1.73,NC:0.80,ND:1.02,OH:1.57,OK:0.99,OR:0.92,PA:1.56,RI:1.54,SC:0.58,
    SD:1.24,TN:0.65,TX:1.90,UT:0.57,VT:1.89,VA:0.83,WA:0.93,WV:0.59,WI:1.71,WY:0.61
  };

  // Elements
  const els = {
    homePrice: $('#home-price'),
    interestRate: $('#interest-rate'),
    dpAmt: $('#dp-amount'),
    dpPct: $('#dp-percent'),
    tabAmt: $('#tab-amount'),
    tabPct: $('#tab-percent'),
    state: $('#state'),
    propTax: $('#property-tax'),
    insurance: $('#home-insurance'),
    pmiRate: $('#pmi-rate'),
    hoa: $('#hoa-fees'),
    extraM: $('#extra-monthly'),
    extraOnce: $('#extra-once'),
    termBtns: $('#term-buttons'),
    termCustom: $('#term-custom'),
    pmiBanner: $('#pmi-banner'),
    advToggle: $('#advanced-toggle'),
    advPanel: $('#advanced-panel'),
    calcBtn: $('#calculate-btn'),
    saveCmp: $('#save-comparison'),
    resetBtn: $('#reset-form'),
    emailBtn: $('#email-results'),
    vBtns: $$('.voice-btn'),
    vStatus: $('#voice-status'),
    totalPay: $('#total-payment'),
    loanAmt: $('#loan-amount'),
    totInt: $('#total-interest'),
    piAmt: $('#pi-amount'),
    txAmt: $('#tax-amount'),
    insAmt: $('#insurance-amount'),
    pmiAmt: $('#pmi-amount'),
    hoaAmt: $('#hoa-amount'),
    rowPmi: $('#row-pmi'),
    bdChart: $('#breakdownChart'),
    atChart: $('#amortizationChart'),
    lgBreak: $('#legend-breakdown'),
    amortBody: $('#amortization-body'),
    fullSchedBtn: $('#view-full-schedule'),
    schedModal: $('#schedule-modal'),
    fullBody: $('#full-schedule-body'),
    closeSched: $('#close-schedule'),
    insights: $('#insights-list'),
    scenName: $('#scenario-name'),
    addScen: $('#add-scenario'),
    clrScen: $('#clear-scenarios'),
    cmpGrid: $('#comparison-grid')
  };

  let activeTerm = 30, usePct = false, comps = [], recognition = null;

  // Sync DP
  function syncDP() {
    const price = +els.homePrice.value || 0;
    let amt = +els.dpAmt.value || 0, pct = +els.dpPct.value || 0;
    if (usePct) {
      pct = Math.min(100, Math.max(0, pct));
      amt = price * pct/100;
      els.dpAmt.value = Math.round(amt);
    } else {
      amt = Math.min(price, Math.max(0, amt));
      pct = price>0?(amt/price*100):0;
      els.dpPct.value = pct.toFixed(1);
    }
    els.pmiBanner.classList.toggle('hidden', pct>=20);
  }

  // Update tax & insurance
  function updateTax() {
    const price = +els.homePrice.value||0, st=els.state.value;
    els.propTax.value = st ? Math.round(price*(stateTaxRates[st]/100)) : 0;
  }
  function updateIns() {
    const price = +els.homePrice.value||0;
    const est= Math.round(price*0.0024);
    els.insurance.value = Math.max(800, Math.min(3000, est));
  }

  // Term highlight
  function setTerm(t) {
    activeTerm=t;
    $$('[data-term]').forEach(b=>b.classList.toggle('active',+b.dataset.term===t));
    els.termCustom.value='';
  }

  // Canvas charts
  function drawPie(parts,colors){
    const ctx=els.bdChart.getContext('2d'),w=ctx.canvas.width,h=ctx.canvas.height;
    ctx.clearRect(0,0,w,h);
    const total=parts.reduce((a,b)=>a+b,1),r=Math.min(w,h)*0.42,cx=w/2,cy=h/2;
    let start=-Math.PI/2;
    parts.forEach((v,i)=>{
      const ang=v/total*Math.PI*2;
      ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,start,start+ang);ctx.closePath();
      ctx.fillStyle=colors[i];ctx.fill();
      start+=ang;
    });
  }
  function drawLine(points){
    const ctx=els.atChart.getContext('2d'),w=ctx.canvas.width,h=ctx.canvas.height,pad=24;
    ctx.clearRect(0,0,w,h);
    const maxY=Math.max(...points.map(p=>p.y),1);
    ctx.strokeStyle='#ccc';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(pad,pad);ctx.lineTo(pad,pad+h-2*pad);ctx.lineTo(pad+w-2*pad,pad+h-2*pad);ctx.stroke();
    ctx.beginPath();ctx.strokeStyle='#21808d';ctx.lineWidth=2;
    points.forEach((p,i)=>{
      const x=pad+(i/(points.length-1))*(w-2*pad);
      const y=pad+h-2*pad-(p.y/maxY)*(h-2*pad);
      i?ctx.lineTo(x,y):ctx.moveTo(x,y);
    });
    ctx.stroke();
  }

  // PMT formula
  function PMT(P, r, n){
    if(r===0) return P/n;
    return P*(r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1);
  }

  // Compute all
  function compute(extra=true){
    const price=+els.homePrice.value||0,dpAmt=+els.dpAmt.value||0,loan=Math.max(0,price-dpAmt);
    const rate=+els.interestRate.value||0,term=+els.termCustom.value||activeTerm,n=term*12;
    if(!els.propTax.value)updateTax();if(!els.insurance.value)updateIns();
    const taxA=+els.propTax.value||0,insA=+els.insurance.value||0,pmiR=+els.pmiRate.value||0,hoa=+els.hoa.value||0;
    const dpPct=price?dpAmt/price*100:0,needsPMI=dpPct<20;
    const mi=PMT(loan,rate/100/12,n),taxM=taxA/12,insM=insA/12,pmiM=needsPMI?(loan*(pmiR/100)/12):0;
    const baseM=mi+taxM+insM+pmiM+hoa;
    // schedule
    let bal=loan,totalInt=0;
    const extraM=extra?(+els.extraM.value||0):0,extra1=extra?(+els.extraOnce.value||0):0;
    const schedule=[];const pts=[];
    for(let m=1;m<=n;m++){
      let intp=bal*(rate/100/12),prin=mi-intp,ex=0;
      if(m===1&&extra1>0)ex+=Math.min(extra1,Math.max(0,bal-prin));
      if(extraM>0)ex+=Math.min(extraM,Math.max(0,bal-prin));
      prin+=ex;bal=Math.max(0,bal-prin);totalInt+=intp;
      schedule.push({m,payment:mi+ex,principal:prin,interest:intp,extra:ex,balance:bal});
      if(m%12===0||m===n||bal===0)pts.push({x:m,y:bal});
      if(bal===0)break;
    }
    // first 5 years
    const yearRows=[];let idx=0,yrBal=loan;
    for(let y=1;y<=Math.min(5,term);y++){
      let sumP=0,sumI=0,sumPay=0;
      for(let k=0;k<12&&idx<schedule.length;k++){const r=schedule[idx];sumP+=r.principal;sumI+=r.interest;sumPay+=r.payment;yrBal=r.balance;idx++;}
      yearRows.push({y,pay:sumPay,prin:sumP,int:sumI,bal:yrBal});
      if(yrBal===0)break;
    }
    return {price,dpAmt,dpPct,loan,rate,term,n,mi,taxM,insM,pmiM,hoa,baseM,needsPMI,totalInt,schedule,pts,yearRows};
  }

  // Render results
  function render(res){
    els.totalPay.textContent=money(res.baseM);
    els.loanAmt.textContent=money(res.loan);
    els.totInt.textContent=money(res.totalInt);
    els.piAmt.textContent=money(res.mi);
    els.txAmt.textContent=money(res.taxM);
    els.insAmt.textContent=money(res.insM);
    els.pmiAmt.textContent=money(res.pmiM);
    els.hoaAmt.textContent=money(res.hoa);
    els.rowPmi.classList.toggle('hidden',!res.needsPMI);
    drawPie([res.mi,res.taxM,res.insM,res.pmiM,res.hoa],['#21808d','#b08968','#6b7280','#c0152f','#a84b2f']);
    els.lgBreak.innerHTML=['P&I','Tax','Ins','PMI','HOA']
      .map((t,i)=>`<span style="border-color:${['#21808d','#b08968','#6b7280','#c0152f','#a84b2f'][i]};">${t}: ${money([res.mi,res.taxM,res.insM,res.pmiM,res.hoa][i])}</span>`)
      .join('');
    drawLine(res.pts);
    els.amortBody.innerHTML=res.yearRows.map(r=>
      `<tr><td>${r.y}</td><td>${money(r.pay)}</td><td>${money(r.prin)}</td><td>${money(r.int)}</td><td>${money(r.bal)}</td></tr>`
    ).join('');
    renderInsights(res);
  }

  // Insights
  function renderInsights(res){
    const ul=els.insights;ul.innerHTML='';
    if(res.dpPct<20){
      const req=Math.max(0,res.price*0.2-res.dpAmt);
      ul.innerHTML+=`<li>Increase DP by ${money(req)} to reach 20% and remove PMI (~${money(res.pmiM)}/mo).</li>`;
    }
    if(res.term>15){
      const mi15=PMT(res.loan,res.rate/100/12,180),int15=mi15*180-res.loan;
      ul.innerHTML+=`<li>15y term → P&I ${money(mi15)}, save ~$${money(res.totalInt-int15)} interest.</li>`;
    }
    const noExtra=compute(false);
    if(noExtra.schedule.length>res.schedule.length){
      const monthsSaved=noExtra.schedule.length-res.schedule.length;
      const intSaved=noExtra.totalInt-res.totalInt;
      ul.innerHTML+=`<li>Extra payments save ${monthsSaved} mo and ~$${money(intSaved)} interest.</li>`;
    }
  }

  // Full schedule modal
  function showFull(res){
    if(!els.fullBody.dataset.ready){
      els.fullBody.innerHTML=res.schedule.map(r=>
        `<tr><td>${r.m}</td><td>${money(r.payment)}</td><td>${money(r.principal)}</td><td>${money(r.interest)}</td><td>${money(r.extra)}</td><td>${money(r.balance)}</td></tr>`
      ).join('');
      els.fullBody.dataset.ready=1;
    }
    els.schedModal.showModal();
  }

  // Email results
  function emailRes(res){
    const subject=encodeURIComponent(`Mortgage Calc – ${money(res.baseM)}/mo`);
    const body=encodeURIComponent(
      `Home: ${money(res.price)}\nDP: ${money(res.dpAmt)} (${res.dpPct.toFixed(1)}%)\n`+
      `Loan: ${money(res.loan)}\nRate: ${res.rate}% | Term: ${res.term}y\n`+
      `Pay: ${money(res.baseM)} (P&I ${money(res.mi)}, Tax ${money(res.taxM)}, Ins ${money(res.insM)}, PMI ${money(res.pmiM)}, HOA ${money(res.hoa)})\n`+
      `Interest: ${money(res.totalInt)}\nShared via Finguid Mortgage Calc`
    );
    window.location.href=`mailto:?subject=${subject}&body=${body}`;
  }

  // Comparison
  function addComp(res){
    const name=els.scenName.value.trim()||`Sc ${comps.length+1}`;
    comps.push({name,rate:res.rate,term:res.term,dp:`${res.dpPct.toFixed(1)}%`,pay:res.baseM,int:res.totalInt,cost:res.loan+res.totalInt});
    renderComps();
  }
  function renderComps(){
    els.cmpGrid.innerHTML=comps.map(c=>
      `<div class="card"><div class="card-header"><strong>${c.name}</strong></div><div class="card-body">
        <div>Rate: <strong>${c.rate}%</strong></div>
        <div>Term: <strong>${c.term}y</strong></div>
        <div>Down: <strong>${c.dp}</strong></div>
        <div>Payment: <strong>${money(c.pay)}</strong></div>
        <div>Total Int: <strong>${money(c.int)}</strong></div>
        <div>Total Cost: <strong>${money(c.cost)}</strong></div>
      </div></div>`
    ).join('');
  }

  // Voice
  function setupVoice(){
    try{
      const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
      if(!SR)return;
      recognition=new SR();
      recognition.continuous=false;recognition.interimResults=false;recognition.lang='en-US';
      recognition.onresult=(e)=>{
        const t=e.results[0][0].transcript.toLowerCase(),num=t.match(/\d+(\.\d+)?/g);
        if(t.includes('home price')&&num){els.homePrice.value=num[0]<10000?num[0]*1000:num[0];updateTax();updateIns();}
        else if(t.includes('down payment')&&num){
          if(t.includes('percent')){usePct=true;toggleTabs();els.dpPct.value=num[0];}
          else{usePct=false;toggleTabs();els.dpAmt.value=num[0]<1000?num[0]*1000:num[0];}
        }
        else if((t.includes('interest')||t.includes('rate'))&&num){els.interestRate.value=num[0];}
        else if(t.includes('calculate')){runCalc();}
        els.vStatus.classList.remove('active');
      };
      recognition.onerror=()=>els.vStatus.classList.remove('active');
      els.vBtns.forEach(b=>b.addEventListener('click',()=>{
        if(recognition){els.vStatus.classList.add('active');recognition.start();}
      }));
    }catch{}
  }

  // Tabs
  function toggleTabs(){
    els.tabAmt.classList.toggle('active',!usePct);
    els.tabPct.classList.toggle('active',usePct);
    $('#dp-amount-wrap').classList.toggle('hidden',usePct);
    $('#dp-percent-wrap').classList.toggle('hidden',!usePct);
  }

  // Reset
  function resetAll(){
    els.homePrice.value=0;els.interestRate.value=0;els.dpAmt.value=0;els.dpPct.value=0;
    els.state.value='';els.propTax.value=0;els.insurance.value=0;els.pmiRate.value=0.8;
    els.hoa.value=0;els.extraM.value=0;els.extraOnce.value=0;els.termCustom.value='';
    setTerm(30);usePct=false;toggleTabs();syncDP();
    els.totalPay.textContent='$0.00';els.loanAmt.textContent='$0';els.totInt.textContent='$0';
    [els.piAmt,els.txAmt,els.insAmt,els.pmiAmt,els.hoaAmt].forEach(e=>e.textContent='$0');
    els.lgBreak.innerHTML='';els.amortBody.innerHTML='';els.insights.innerHTML='';comps=[];renderComps();
    els.bdChart.getContext('2d').clearRect(0,0,els.bdChart.width,els.bdChart.height);
    els.atChart.getContext('2d').clearRect(0,0,els.atChart.width,els.atChart.height);
  }

  // Main
  function runCalc(){
    const res=compute(true);
    render(res);
    els.fullSchedBtn.onclick=()=>showFull(res);
    els.emailBtn.onclick=()=>emailRes(res);
    els.saveCmp.onclick=()=>addComp(res);
  }

  // Init
  function init(){
    $$('.voice-btn').forEach(b=>b);setupVoice();
    els.tabAmt.onclick=()=>{usePct=false;toggleTabs();syncDP()};
    els.tabPct.onclick=()=>{usePct=true;toggleTabs();syncDP()};
    els.dpAmt.oninput=syncDP;els.dpPct.oninput=syncDP;
    els.homePrice.oninput=()=>{syncDP();updateTax();updateIns()};
    els.state.onchange=updateTax;
    els.termBtns.onclick=(e)=>{const b=e.target.closest('.chip[data-term]');if(b)setTerm(+b.dataset.term)};
    els.termCustom.oninput=()=>{setTerm(+els.termCustom.value||activeTerm)};
    els.advToggle.onclick=()=>els.advPanel.classList.toggle('hidden');
    els.calcBtn.onclick=runCalc;
    els.resetBtn.onclick=resetAll;
    els.addScen.onclick=runCalc;
    els.clrScen.onclick=()=>{comps=[];renderComps()};
    els.closeSched.onclick=()=>els.schedModal.close();
    setTerm(30);toggleTabs();syncDP();updateTax();updateIns();runCalc();
  }

  document.addEventListener('DOMContentLoaded',init);
})();
