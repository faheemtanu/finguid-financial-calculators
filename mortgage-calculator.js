/* Filename: mortgage-calculator-enhanced.js */

// Mortgage Calculator Enhanced JS
// Handles inputs, results rendering, tabs, chart, sharing, extra payments, feedback API integration

// Utility functions
function formatCurrency(amount) {
    return isNaN(amount) ? '$0' : amount.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });
}

function formatDate(date) {
    // date: JS Date object
    if (!date || isNaN(date.getTime())) return '--';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => { container.removeChild(toast); }, 3400);
}

// Mortgage Calculation Logic
function calculateMortgage(options) {
    // ... implement calculation logic (including extra payments, taxes, insurance, pmi)
    // returns {monthly, principalInterest, breakdown, totalInterest, totalCost, loanAmount, payoffDate, amortization}
}

// Chart rendering logic
function renderMortgageChart(data) {
    // Setup/refresh Chart.js loan-progress chart
}

// Tab logic
function setupTabs() {
    // Tab switch: chart & AI insights
    const tabBtns = document.querySelectorAll('.tab-controls .tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    tabBtns.forEach((btn, idx) => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(tb => tb.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));
            btn.classList.add('active');
            tabContents[idx].classList.add('active');
        });
    });
    // Show Graph tab by default
    tabBtns[0].classList.add('active');
    tabContents[0].classList.add('active');
}

// Collapsible amortization schedule
function setupAmortizationCollapsible() {
    const detailsElem = document.querySelector('.amortization-section details.collapsible-section');
    if (detailsElem) {
        detailsElem.open = false;
    }
}

// Feedback submit (GitHub Issue API)
function setupFeedbackForm() {
    const form = document.getElementById('feedback-form');
    if (form){
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const type = form.type.value;
            const message = form.message.value;
            const email = form.email.value;
            // GitHub Issue POST
            const issue = {
                title: `[MortgageCalc Feedback] ${type}`,
                body: `Feedback: ${message}\nEmail: ${email || '(anonymous)'}`,
                labels: [type]
            };
            // You must create a public repo and GitHub PAT with issues:write scope
            const resp = await fetch('https://api.github.com/repos/[YOUR_GITHUB_USERNAME]/[YOUR_REPO]/issues', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'token [YOUR_GITHUB_TOKEN]'
                },
                body: JSON.stringify(issue)
            });
            if (resp.ok) {
                showToast('Thanks for your feedback!', 'success');
                form.reset();
            } else {
                showToast('Could not submit feedback. Try again!', 'error');
            }
        });
    }
}

// Sharing Logic
function setupSharingButtons() {
    // Share: navigator.share API
    // PDF: jsPDF capture (all results)
    // Print: window.print()
    document.getElementById('share-btn').onclick = function() {
        if (navigator.share) {
            navigator.share({
                title: document.title,
                text: 'Check my personalized mortgage results!',
                url: location.href
            });
        } else {
            showToast('Sharing not supported on your device');
        }
    };
    document.getElementById('pdf-btn').onclick = function() {
        // jsPDF logic to snapshot results and chart
        // ...
    };
    document.getElementById('print-btn').onclick = function() {
        window.print();
    };
}

// Initial setup
window.addEventListener('DOMContentLoaded', function() {
    setupTabs();
    setupAmortizationCollapsible();
    setupFeedbackForm();
    setupSharingButtons();
    // TODO: setup calculator events / chart etc.
});
