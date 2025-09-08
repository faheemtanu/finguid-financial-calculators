document.addEventListener('DOMContentLoaded', function () {
  // Populate the state dropdown with 50 US States
  const states = [
    { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" }, { code: "AZ", name: "Arizona" },
    { code: "AR", name: "Arkansas" }, { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
    { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" }, { code: "FL", name: "Florida" },
    { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" }, { code: "ID", name: "Idaho" },
    { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" },
    { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" }, { code: "LA", name: "Louisiana" },
    { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" }, { code: "MA", name: "Massachusetts" },
    { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" }, { code: "MS", name: "Mississippi" },
    { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" },
    { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" }, { code: "NJ", name: "New Jersey" },
    { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" }, { code: "NC", name: "North Carolina" },
    { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" }, { code: "OK", name: "Oklahoma" },
    { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" }, { code: "RI", name: "Rhode Island" },
    { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" },
    { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" }, { code: "VT", name: "Vermont" },
    { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" },
    { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" }
  ];

  const stateSelect = document.getElementById('state');
  if (stateSelect) {
    // Clear existing options except first
    stateSelect.innerHTML = '<option value="">Select State</option>';
    states.forEach(state => {
      const opt = document.createElement('option');
      opt.value = state.code;
      opt.textContent = state.name;
      stateSelect.appendChild(opt);
    });
  }

  // Handle PMI checkbox toggle show/hide PMI rate input
  const pmiCheckbox = document.getElementById('pmiRequired');
  const pmiSection = document.getElementById('pmiSection');

  if (pmiCheckbox && pmiSection) {
    pmiCheckbox.addEventListener('change', () => {
      if (pmiCheckbox.checked) {
        pmiSection.classList.remove('hidden');
      } else {
        pmiSection.classList.add('hidden');
      }
    });
  }

  // Attach form submission handler
  const form = document.getElementById('mortgageForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      calculateMortgage();
    });
  }

  // Mortgage calculation function
  function calculateMortgage() {
    const homePrice = parseFloat(document.getElementById('homePrice').value) || 0;
    const downPayment = parseFloat(document.getElementById('downPayment').value) || 0;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
    const loanTermYears = parseInt(document.getElementById('loanTerm').value) || 30;
    const propertyTax = parseFloat(document.getElementById('propertyTax').value) || 0;
    const homeInsurance = parseFloat(document.getElementById('homeInsurance').value) || 0;
    const hoaFees = parseFloat(document.getElementById('hoaFees').value) || 0;
    const stateCode = document.getElementById('state').value;
    const pmiRequired = document.getElementById('pmiRequired').checked;
    let pmiRate = parseFloat(document.getElementById('pmiRate').value);
    if (isNaN(pmiRate)) pmiRate = 0;

    const loanAmount = homePrice - downPayment;

    // Basic validation
    if (homePrice <= 0 || loanAmount <= 0) {
      alert("Home price must be greater than down payment.");
      return;
    }
    if (interestRate <= 0) {
      alert("Interest rate must be positive.");
      return;
    }

    const monthlyInterestRate = interestRate / 100 / 12;
    const numberOfPayments = loanTermYears * 12;

    // Calculate monthly principal and interest payment using standard formula
    let monthlyPI = 0;
    if (monthlyInterestRate === 0) {
      // No interest case
      monthlyPI = loanAmount / numberOfPayments;
    } else {
      monthlyPI = loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) /
        (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
    }

    // Calculate monthly property tax, insurance, HOA fees
    let monthlyPropertyTax = propertyTax / 12;
    let monthlyInsurance = homeInsurance / 12;
    let monthlyHoaFees = hoaFees;

    // Determine if PMI applies automatically if downpayment < 20% (LTV > 0.8)
    const ltv = loanAmount / homePrice;
    let monthlyPMI = 0;
    if (pmiRequired || ltv > 0.8) {
      // Use provided PMI rate or default to 0.5% annual
      const effectivePmiRate = (pmiRate > 0) ? pmiRate : 0.5;
      monthlyPMI = (loanAmount * (effectivePmiRate / 100)) / 12;
    }

    // Total monthly payment
    const totalMonthlyPayment = monthlyPI + monthlyPropertyTax + monthlyInsurance + monthlyHoaFees + monthlyPMI;

    // Total interest paid over life of loan
    const totalInterest = (monthlyPI * numberOfPayments) - loanAmount;

    // Find full state name from code for display
    const state = states.find(s => s.code === stateCode);
    const stateName = state ? state.name : "Not Selected";

    // Compose output HTML
    const outputHTML = `
      <div style="font-size: 24px; font-weight: bold; color: #1e40af;">$${totalMonthlyPayment.toFixed(2)}</div>
      <div style="color: #6b7280; margin-bottom: 10px;">Estimated Total Monthly Payment</div>
      <ul style="list-style: none; padding-left: 0;">
        <li><strong>Principal & Interest:</strong> $${monthlyPI.toFixed(2)}</li>
        <li><strong>Property Tax:</strong> $${monthlyPropertyTax.toFixed(2)}</li>
        <li><strong>Home Insurance:</strong> $${monthlyInsurance.toFixed(2)}</li>
        <li><strong>HOA Fees:</strong> $${monthlyHoaFees.toFixed(2)}</li>
        <li><strong>PMI:</strong> $${monthlyPMI.toFixed(2)}</li>
      </ul>
      <hr style="border-color: #e2e8f0; margin: 10px 0;" />
      <div><strong>Total Interest Paid:</strong> $${totalInterest.toFixed(2)}</div>
      <div><strong>Loan Term:</strong> ${loanTermYears} years (${numberOfPayments} months)</div>
      <div><strong>Selected State:</strong> ${stateName}</div>
      <div style="margin-top: 10px; padding: 10px; background-color: #effaf0; border-left: 4px solid #34d399;">
        💡 <em>Tip:</em> Consider making extra principal payments to reduce total interest paid.
      </div>
    `;

    // Display results
    const resultDiv = document.getElementById('mortgageOutput');
    resultDiv.innerHTML = outputHTML;

    // Show results container
    const container = document.getElementById('mortgageResult');
    if (container) container.classList.add('show');
  }
});
