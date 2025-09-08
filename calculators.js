/**
 * Core calculation engine for all calculators
 * Uses state-specific data from `config.js`.
 */
const STATE_DATA = CONFIG.stateData; // propertyTaxRates, salesTax, insuranceRates

// Mortgage Calculator
function calculateMortgage() {
  const P = parseFloat(el('loanAmount').value);
  const annualRate = parseFloat(el('interestRate').value) / 100;
  const n = parseFloat(el('loanTerm').value) * 12;
  const tax = parseFloat(el('propertyTax').value) / 12;
  const ins = parseFloat(el('insurance').value) / 12;

  if (!P||!annualRate||!n) return alert('Fill required fields');

  const r = annualRate/12;
  const monthlyPI = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const total = monthlyPI + tax + ins;
  const totalInterest = (monthlyPI * n) - P;

  showResult('mortgageResult', `
    <strong>$${total.toFixed(2)}</strong> /month<br>
    <small>Principal+Interest: $${monthlyPI.toFixed(2)}</small><br>
    <small>Tax: $${tax.toFixed(2)}</small>, <small>Insurance: $${ins.toFixed(2)}</small><br>
    <small>Total Interest: $${totalInterest.toFixed(2)}</small>
  `);
  AIInsights.generate('mortgage', {P,annualRate,n,total});
}

// Auto Loan Calculator
function calculateAuto() {
  const price = parseFloat(el('carPrice').value);
  const down = parseFloat(el('downPayment').value) || 0;
  const rate = parseFloat(el('autoRate').value)/100/12;
  const n = parseFloat(el('autoTerm').value);

  if (!price||!rate||!n) return alert('Fill required fields');
  const principal = price - down;
  const pay = principal * (rate * Math.pow(1+rate,n)) / (Math.pow(1+rate,n)-1);
  const totalInt = (pay*n) - principal;

  showResult('autoResult', `
    <strong>$${pay.toFixed(2)}</strong> /month<br>
    <small>Loan Amount: $${principal.toFixed(2)}</small><br>
    <small>Total Interest: $${totalInt.toFixed(2)}</small>
  `);
  AIInsights.generate('auto', {price,down,rate,n});
}

// Investment Calculator
function calculateInvestment() {
  const P = parseFloat(el('initialInvestment').value);
  const contrib = parseFloat(el('monthlyContribution').value) || 0;
  const rAnnual = parseFloat(el('investmentRate').value)/100;
  const years = parseFloat(el('investmentYears').value);

  if (!P||!rAnnual||!years) return alert('Fill required fields');
  const r = rAnnual/12;
  const months = years * 12;
  const fvP = P * Math.pow(1+r, months);
  const fvC = contrib * ((Math.pow(1+r, months)-1)/r);
  const total = fvP + fvC;

  showResult('investmentResult', `
    <strong>$${total.toFixed(2)}</strong><br>
    <small>From principal: $${fvP.toFixed(2)}</small><br>
    <small>From contributions: $${fvC.toFixed(2)}</small>
  `);
  AIInsights.generate('investment', {P,contrib,rAnnual,years});
}

// Utility
function el(id){return document.getElementById(id);}
function showResult(containerId, html){
  const c = el(containerId);
  c.innerHTML = html;
  c.classList.add('show');
}
