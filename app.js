// app.js
'use strict';

// Load data & initialize
document.addEventListener('DOMContentLoaded', () => {
  initializeCalculatorsPage();
  registerServiceWorker();
});

function initializeCalculatorsPage() {
  createCalculatorCards();
  setupCategoryFilters();
  setupSearchFunctionality();
  setupCalculatorTracking();
  initializeNewsletter();
}

// Create cards from config (structured JSON inside)
function createCalculatorCards() {
  const calculators = [ /* mortgage, auto, investment… etc. */ ];
  const grid = document.getElementById('calculatorsGrid');
  calculators.forEach(cfg => {
    const card = document.createElement('div');
    card.className = 'calculator-card';
    card.dataset.category = cfg.category;
    card.innerHTML = `
      <div class="card-icon"><i class="${cfg.icon}"></i></div>
      <h3 id="${cfg.id}-title">${cfg.title}</h3>
      <p>${cfg.subtitle}</p>
      <button class="btn btn-primary" onclick="openCalculator('${cfg.id}')">Open</button>
    `;
    grid.appendChild(card);
  });
}

// … include the rest of your filter, search, tracking, AI-insight logic …
