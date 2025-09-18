// mortgage-calculator.js
'use strict';

// Global State
const MortgageCalculator = {
    state: {
        calculation: null,
        amortizationData: [],
        view: 'monthly'
    },
    config: {
        debounce: 300,
        chartColors: {
            principal: '#21808d',
            tax: '#f59e0b',
            insurance: '#10b981',
            pmi: '#ef4444',
            hoa: '#8b5cf6'
        }
    }
};

// Utils
const Utils = {
    $: s => document.querySelector(s),
    $$: s => Array.from(document.querySelectorAll(s)),
    formatCurrency: (n, d=0) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:d}).format(n),
    debounce(fn, t) {let timer; return(...a)=>{clearTimeout(timer); timer=setTimeout(()=>fn(...a),t);};},
    getNextMonth() {
        const d = new Date();
        d.setMonth(d.getMonth()+1);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    }
};

// Calculation Engine
const Engine = {
    monthlyPayment(P, r, y) {
        if(r===0) return P/(y*12);
        const m = r/1200, n = y*12;
        return P*m*Math.pow(1+m,n)/(Math.pow(1+m,n)-1);
    },
    calc(inputs) {
        const loanAmt = inputs.homePrice - inputs.downPayment;
        const mPI = this.monthlyPayment(loanAmt,inputs.interest,inputs.term);
        const monthlyTax = inputs.propTax/12;
        const mIns = inputs.ins/12;
        const mHOA = inputs.hoa;
        const total = mPI + monthlyTax + mIns + mHOA;
        return {loanAmt,mPI,monthlyTax,mIns,mHOA,total};
    }
};

// UI Handlers
const UI = {
    getInputs() {
        return {
            homePrice: parseFloat(Utils.$('#home-price').value)||0,
            downPayment: parseFloat(Utils.$('#down-payment-amount').value)||0,
            interest: parseFloat(Utils.$('#interest-rate').value)||0,
            term: parseFloat(Utils.$('#loan-term').value)||0,
            propTax: parseFloat(Utils.$('#property-tax').value)||0,
            ins: parseFloat(Utils.$('#home-insurance').value)||0,
            hoa: parseFloat(Utils.$('#hoa-fees').value)||0
        };
    },
    display(results) {
        Utils.$('#total-payment').textContent = Utils.formatCurrency(results.total);
        Utils.$('#principal-interest').textContent = Utils.formatCurrency(results.mPI);
        Utils.$('#monthly-property-tax').textContent = Utils.formatCurrency(results.monthlyTax);
        Utils.$('#monthly-insurance').textContent = Utils.formatCurrency(results.mIns);
    }
};

// Main Calculate
const calculate = Utils.debounce(()=>{
    const inp = UI.getInputs();
    const res = Engine.calc(inp);
    UI.display(res);
}, MortgageCalculator.config.debounce);

// Event Listeners
document.addEventListener('DOMContentLoaded', ()=>{
    // Default date
    const sd = Utils.$('#start-date');
    if(sd) sd.value = Utils.getNextMonth();

    // Inputs trigger calc
    Utils.$$('#calculator-form input').forEach(i=>{
        i.addEventListener('input', calculate);
    });

    // Collapsed amortization by default
    Utils.$('#table-container').classList.add('collapsed');
    
    // Collapse/Expand
    Utils.$('#collapse-schedule').addEventListener('click', ()=>Utils.$('#table-container').classList.add('collapsed'));
    Utils.$('#expand-schedule').addEventListener('click', ()=>Utils.$('#table-container').classList.remove('collapsed'));
    
    // Export
    Utils.$('#export-schedule').addEventListener('click', ()=>{
        const rows = MortgageCalculator.state.amortizationData;
        if(!rows.length) return;
        let csv = 'Payment#,Date,Payment,Principal,Interest,Balance,Equity\n';
        rows.forEach(r=>{
            csv += `${r.paymentNumber},${r.date.toLocaleDateString()},${r.payment.toFixed(2)},${r.principal.toFixed(2)},${r.interest.toFixed(2)},${r.balance.toFixed(2)},${r.equity.toFixed(2)}\n`;
        });
        const blob = new Blob([csv],{type:'text/csv'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href=url; a.download='schedule.csv'; a.click();
        URL.revokeObjectURL(url);
    });
    
    // Print
    Utils.$('#print-schedule').addEventListener('click',()=>window.print());
});
