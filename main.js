/**
 * AI insights, email service, analytics & PWA handlers
 */

// AI Insights Generator
const AIInsights = {
  generate(type, data) {
    // Example: append tip below result
    const insight = this.templates[type](data);
    console.log('AI Insight:', insight);
    this.injectTip(type, insight);
  },
  templates: {
    mortgage: d => `💡 AI Tip: Adding $${(d.P*0.1).toFixed(0)} extra principal could save interest.`,
    auto:    d => `💡 AI Tip: Consider a 20% down payment to lower total cost.`,
    investment: d => `💡 AI Tip: Compound interest works best over longer periods.`
  },
  injectTip(type, tip){
    const container = document.querySelector(`#${type}Result`);
    if(container) {
      container.insertAdjacentHTML('beforeend', `<p style="color:#059669">${tip}</p>`);
    }
  }
};

// Email Results (via Formspree)
function sendEmail(formData, resultsHtml) {
  const payload = { _subject: 'Your Calculation Results', ...formData, results: resultsHtml };
  fetch(CONFIG.api.fallback.emailService, {
    method: 'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify(payload)
  });
}

// Analytics
(function initGA(){
  if(CONFIG.analytics.googleAnalytics.trackingId){
    window.dataLayer=window.dataLayer||[];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', CONFIG.analytics.googleAnalytics.trackingId);
  }
})();

// PWA: register service worker
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js'));
}
