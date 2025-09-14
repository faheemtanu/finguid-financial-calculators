<!DOCTYPE html>
<html lang="en">
<head>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-NYBL2CDNQJ"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-NYBL2CDNQJ');
</script>
<!-- at the top of mortgage-calculator.html -->
<body class="page-mortgage">
  ...
</body>
  <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HomeLoan Pro - AI-Enhanced USA Mortgage Calculator | Free Home Loan Payment Estimator</title>
    <meta name="description" content="Calculate accurate mortgage payments with HomeLoan Pro's AI-enhanced calculator. Get state-specific property taxes, PMI calculations, and smart insights for all 50 US states. Free mortgage calculator with voice input.">
    <meta name="keywords" content="mortgage calculator, home loan calculator, USA mortgage rates, property tax calculator, PMI calculator, home affordability calculator">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://www.finguid.com/mortgage-calculator">
    <meta property="og:title" content="HomeLoan Pro - AI-Enhanced USA Mortgage Calculator">
    <meta property="og:description" content="Free mortgage calculator with AI insights, voice input, and state-specific data for all 50 US states.">
    <meta property="og:image" content="https://www.finguid.com/assets/mortgage-calculator-preview.jpg">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="https://www.finguid.com/mortgage-calculator">
    <meta property="twitter:title" content="HomeLoan Pro - AI-Enhanced USA Mortgage Calculator">
    <meta property="twitter:description" content="Free mortgage calculator with AI insights, voice input, and state-specific data for all 50 US states.">
    <meta property="twitter:image" content="https://www.finguid.com/assets/mortgage-calculator-preview.jpg">

    <!-- Structured Data -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "HomeLoan Pro - Mortgage Calculator",
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "Web Browser",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        },
        "description": "Free AI-enhanced mortgage calculator for USA home loans with state-specific property taxes and PMI calculations",
        "featureList": [
            "Voice Input Support",
            "50-State Property Tax Data", 
            "PMI Calculator",
            "AI Insights",
            "Amortization Schedule"
        ],
        "provider": {
            "@type": "Organization",
            "name": "Finguid",
            "url": "https://www.finguid.com"
        }
    }
    </script>

    <link rel="stylesheet" href="style.css">
    <link rel="manifest" href="manifest.json">
    <link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192x192.png">
    <link rel="apple-touch-icon" href="icons/icon-192x192.png">
    <meta name="theme-color" content="#21808d">
    
    <!-- Fonts and Icons -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <style>
        /* Additional styles for the left-right layout */
        .calculator-layout {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
        }
        
        @media (max-width: 1024px) {
            .calculator-layout {
                grid-template-columns: 1fr;
            }
        }
        
        .inputs-panel {
            background: var(--color-bg-primary);
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: var(--shadow-md);
        }
        
        .results-panel {
            background: var(--color-bg-primary);
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: var(--shadow-md);
        }
        
        /* Enhanced Advanced Options */
        .advanced-toggle.active {
            background-color: var(--color-primary);
            color: white;
            border-color: var(--color-primary-dark);
        }
        
        .advanced-toggle.active .arrow {
            transform: rotate(180deg);
        }
        
        .advanced-toggle {
            padding: 12px 16px;
            font-weight: 600;
            font-size: 1rem;
            transition: all 0.3s ease;
            border: 2px solid var(--color-border);
        }
        
        /* Enhanced Results Panel */
        .results-summary {
            background: linear-gradient(135deg, #21808d 0%, #2a9d8f 100%);
            border-radius: 12px;
            padding: 1.5rem;
            color: white;
            margin-bottom: 1.5rem;
        }
        
        .main-result {
            text-align: center;
            margin-bottom: 1rem;
        }
        
        .result-label {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .result-value {
            font-size: 2.5rem;
            font-weight: 700;
            margin: 0.5rem 0;
        }
        
        .key-metrics {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin-top: 1rem;
        }
        
        .metric {
            background: rgba(255, 255, 255, 0.15);
            padding: 0.75rem;
            border-radius: 8px;
            text-align: center;
        }
        
        .metric-label {
            display: block;
            font-size: 0.85rem;
            opacity: 0.8;
        }
        
        .metric-value {
            display: block;
            font-weight: 600;
            font-size: 1.1rem;
        }
        
        /* Enhanced Payment Breakdown */
        .breakdown-section {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        
        .breakdown-table {
            display: grid;
            gap: 0.75rem;
        }
        
        .breakdown-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem;
            border-radius: 8px;
            background: #f8fafc;
        }
        
        .breakdown-row:nth-child(1) {
            border-left: 4px solid #21808d;
        }
        
        .breakdown-row:nth-child(2) {
            border-left: 4px solid #a84b2f;
        }
        
        .breakdown-row:nth-child(3) {
            border-left: 4px solid #626c71;
        }
        
        .breakdown-row:nth-child(4) {
            border-left: 4px solid #c0152f;
        }
        
        .breakdown-row:nth-child(5) {
            border-left: 4px solid #94a3b8;
        }
        
        /* Enhanced Predefined Scenarios */
        .predefined-scenarios {
            margin: 2rem 0;
        }
        
        .scenario-buttons {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }
        
        .scenario-btn {
            padding: 1rem;
            border-radius: 8px;
            border: none;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: center;
        }
        
        .scenario-btn:nth-child(1) {
            background: linear-gradient(135deg, #21808d 0%, #2a9d8f 100%);
            color: white;
        }
        
        .scenario-btn:nth-child(2) {
            background: linear-gradient(135deg, #a84b2f 0%, #c15a2b 100%);
            color: white;
        }
        
        .scenario-btn:nth-child(3) {
            background: linear-gradient(135deg, #626c71 0%, #8191a0 100%);
            color: white;
        }
        
        .scenario-btn:nth-child(4) {
            background: linear-gradient(135deg, #c0152f 0%, #e63946 100%);
            color: white;
        }
        
        .scenario-btn:nth-child(5) {
            background: linear-gradient(135deg, #94a3b8 0%, #cbd5e1 100%);
            color: #1e293b;
        }
        
        .scenario-btn:nth-child(6) {
            background: linear-gradient(135deg, #4338ca 0%, #6366f1 100%);
            color: white;
        }
        
        .scenario-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        /* Comparison Cards */
        .comparison-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-top: 1.5rem;
        }
        
        .comparison-card {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            border-top: 4px solid #21808d;
        }
        
        .comparison-card:nth-child(2) {
            border-top-color: #a84b2f;
        }
        
        .comparison-card:nth-child(3) {
            border-top-color: #626c71;
        }
        
        .comparison-card:nth-child(4) {
            border-top-color: #c0152f;
        }
        
        .comparison-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }
        
        .comparison-title {
            font-weight: 700;
            font-size: 1.2rem;
            color: #21808d;
        }
        
        .comparison-savings {
            background: #f0fdf4;
            color: #166534;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: 600;
            font-size: 0.9rem;
        }
        
        .comparison-details {
            display: grid;
            gap: 0.75rem;
        }
        
        .comparison-row {
            display: flex;
            justify-content: space-between;
            padding: 0.5rem 0;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .comparison-row:last-child {
            border-bottom: none;
        }
        
        /* Enhanced Amortization Table */
        .amortization-section {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        
        .amortization-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1rem;
        }
        
        .amortization-table th {
            background: #f8fafc;
            padding: 0.75rem;
            text-align: left;
            font-weight: 600;
            color: #374151;
        }
        
        .amortization-table td {
            padding: 0.75rem;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .amortization-table tr:last-child td {
            border-bottom: none;
        }
        
        .amortization-table tr:hover {
            background: #f8fafc;
        }
        
        /* Enhanced AI Insights */
        .insights-section {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        
        .insights-list {
            list-style: none;
            padding: 0;
            margin: 1rem 0 0 0;
        }
        
        .insight-item {
            display: flex;
            gap: 1rem;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 0.75rem;
            background: #f8fafc;
            border-left: 4px solid #21808d;
        }
        
        .insight-item:nth-child(2) {
            border-left-color: #a84b2f;
        }
        
        .insight-item:nth-child(3) {
            border-left-color: #626c71;
        }
        
        .insight-icon {
            font-size: 1.5rem;
            color: #21808d;
        }
        
        .insight-content strong {
            display: block;
            margin-bottom: 0.25rem;
            color: #1e293b;
        }
        
        .insight-content p {
            margin: 0;
            color: #64748b;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <header class="header">
        <nav class="navbar">
            <div class="container">
                <a href="/" class="nav-brand">
                    <i class="fas fa-calculator"></i>
                    <span class="brand-text">Finguid</span>
                </a>
                <ul class="nav-menu" id="nav-menu">
                    <li><a href="/" class="nav-link">Home</a></li>
                    <li><a href="/mortgage-calculator" class="nav-link active">Mortgage</a></li>
                    <li><a href="/calculators" class="nav-link">Calculators</a></li>
                    <li><a href="/resources" class="nav-link">Resources</a></li>
                    <li><a href="/about" class="nav-link">About</a></li>
                    <li><a href="/contact" class="nav-link">Contact</a></li>
                </ul>
                <div class="hamburger" id="hamburger">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </nav>
    </header>

    <!-- Main Content -->
    <main class="main-content">
        <!-- Hero Section -->
        <section class="hero mortgage-hero">
            <div class="container">
                <div class="hero-content">
                    <h1 class="hero-title">
                        🏠 HomeLoan Pro - AI-Enhanced 
                        <span class="highlight">Mortgage Calculator</span>
                    </h1>
                    <p class="hero-description">
                        Calculate accurate mortgage payments with state-specific taxes, PMI, insurance, and AI-powered insights. Voice input enabled for effortless calculations across all 50 US states.
                    </p>
                    <div class="hero-features">
                        <div class="feature">
                            <i class="fas fa-microphone"></i>
                            <span>Voice Input</span>
                        </div>
                        <div class="feature">
                            <i class="fas fa-map-marked-alt"></i>
                            <span>50 State Data</span>
                        </div>
                        <div class="feature">
                            <i class="fas fa-robot"></i>
                            <span>AI Insights</span>
                        </div>
                        <div class="feature">
                            <i class="fas fa-mobile-alt"></i>
                            <span>Mobile PWA</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Calculator Modes -->
        <section class="calculator-section">
            <div class="container">
                <!-- Removed mode tabs for refinance and affordability -->
                
                <div class="calculator-layout">
                    <!-- Left Panel - Inputs -->
                    <div class="calculator-panel inputs-panel">
                        <div class="panel-header">
                            <h2>Loan Details</h2>
                            <p>Enter your mortgage information for precise AI-enhanced calculations</p>
                        </div>

                        <!-- Payment Mode Inputs -->
                        <div class="mode-content" id="payment-mode">
                            <div class="form-group">
                                <label for="home-price" class="form-label">
                                    <i class="fas fa-home" data-tooltip="The total purchase price of the home"></i>
                                    Home Price ($)
                                    <button class="voice-btn" data-field="home-price" title="Voice Input">
                                        <i class="fas fa-microphone"></i>
                                    </button>
                                </label>
                                <input type="number" id="home-price" class="form-input" value="400000" min="10000" max="10000000" step="1000">
                            </div>

                            <div class="form-group">
                                <label class="form-label">
                                    <i class="fas fa-percentage" data-tooltip="Your upfront payment - affects PMI requirements"></i>
                                    Down Payment
                                </label>
                                <div class="dp-tabs">
                                    <button class="tab-btn active" id="tab-amount" data-tab="amount">Amount $</button>
                                    <button class="tab-btn" id="tab-percent" data-tab="percent">Percent %</button>
                                </div>
                                <div class="dp-inputs">
                                    <div id="dp-amount-wrap" class="dp-input-wrap">
                                        <input type="number" id="dp-amount" class="form-input" value="80000" min="0" step="1000">
                                        <button class="voice-btn" data-field="dp-amount" title="Voice Input">
                                            <i class="fas fa-microphone"></i>
                                        </button>
                                    </div>
                                    <div id="dp-percent-wrap" class="dp-input-wrap hidden">
                                        <input type="number" id="dp-percent" class="form-input" value="20" min="0" max="100" step="0.1">
                                        <button class="voice-btn" data-field="dp-percent" title="Voice Input">
                                            <i class="fas fa-microphone"></i>
                                        </button>
                                    </div>
                                </div>
                                <!-- PMI Banner -->
                                <div id="pmi-banner" class="pmi-banner hidden">
                                    <i class="fas fa-exclamation-triangle"></i>
                                    <span>PMI Required - Down payment is less than 20% of home value</span>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="interest-rate" class="form-label">
                                    <i class="fas fa-chart-line" data-tooltip="Annual interest rate for your mortgage loan"></i>
                                    Interest Rate (%)
                                    <button class="voice-btn" data-field="interest-rate" title="Voice Input">
                                        <i class="fas fa-microphone"></i>
                                    </button>
                                </label>
                                <input type="number" id="interest-rate" class="form-input" value="6.75" min="0.1" max="30" step="0.01">
                            </div>

                            <div class="form-group">
                                <label class="form-label">
                                    <i class="fas fa-calendar-alt" data-tooltip="Length of your mortgage loan in years"></i>
                                    Loan Term
                                </label>
                                <div class="term-buttons" id="term-buttons">
                                    <button class="chip" data-term="10">10y</button>
                                    <button class="chip" data-term="15">15y</button>
                                    <button class="chip" data-term="20">20y</button>
                                    <button class="chip" data-term="25">25y</button>
                                    <button class="chip active" data-term="30">30y</button>
                                    <span class="or-text">or</span>
                                </div>
                                <input type="number" id="term-custom" class="form-input custom-term" placeholder="Custom years (1-40)" min="1" max="40">
                            </div>

                            <div class="form-group">
                                <label for="state" class="form-label">
                                    <i class="fas fa-map-marker-alt" data-tooltip="Select your state for accurate property tax calculations"></i>
                                    Property State
                                </label>
                                <select id="state" class="form-control">
                                    <option value="">Select State</option>
                                    <option value="AL">Alabama</option>
                                    <option value="AK">Alaska</option>
                                    <option value="AZ">Arizona</option>
                                    <option value="AR">Arkansas</option>
                                    <option value="CA">California</option>
                                    <option value="CO">Colorado</option>
                                    <option value="CT">Connecticut</option>
                                    <option value="DE">Delaware</option>
                                    <option value="FL">Florida</option>
                                    <option value="GA">Georgia</option>
                                    <option value="HI">Hawaii</option>
                                    <option value="ID">Idaho</option>
                                    <option value="IL">Illinois</option>
                                    <option value="IN">Indiana</option>
                                    <option value="IA">Iowa</option>
                                    <option value="KS">Kansas</option>
                                    <option value="KY">Kentucky</option>
                                    <option value="LA">Louisiana</option>
                                    <option value="ME">Maine</option>
                                    <option value="MD">Maryland</option>
                                    <option value="MA">Massachusetts</option>
                                    <option value="MI">Michigan</option>
                                    <option value="MN">Minnesota</option>
                                    <option value="MS">Mississippi</option>
                                    <option value="MO">Missouri</option>
                                    <option value="MT">Montana</option>
                                    <option value="NE">Nebraska</option>
                                    <option value="NV">Nebada</option>
                                    <option value="NH">New Hampshire</option>
                                    <option value="NJ">New Jersey</option>
                                    <option value="NM">New Mexico</option>
                                    <option value="NY">New York</option>
                                    <option value="NC">North Carolina</option>
                                    <option value="ND">North Dakota</option>
                                    <option value="OH">Ohio</option>
                                    <option value="OK">Oklahoma</option>
                                    <option value="OR">Oregon</option>
                                    <option value="PA">Pennsylvania</option>
                                    <option value="RI">Rhode Island</option>
                                    <option value="SC">South Carolina</option>
                                    <option value="SD">South Dakota</option>
                                    <option value="TN">Tennessee</option>
                                    <option value="TX">Texas</option>
                                    <option value="UT">Utah</option>
                                    <option value="VT">Vermont</option>
                                    <option value="VA">Virginia</option>
                                    <option value="WA">Washington</option>
                                    <option value="WV">West Virginia</option>
                                    <option value="WI">Wisconsin</option>
                                    <option value="WY">Wyoming</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="property-tax" class="form-label">
                                    <i class="fas fa-building" data-tooltip="Annual property tax - auto-calculated based on state and home value"></i>
                                    Property Tax (Annual $)
                                </label>
                                <input type="number" id="property-tax" class="form-input" value="1640" min="0" step="100">
                                <small class="help-text">Auto-calculated based on state average</small>
                            </div>

                            <!-- Advanced Options -->
                            <div class="advanced-section">
                                <button class="advanced-toggle" id="advanced-toggle">
                                    <i class="fas fa-cog"></i>
                                    <span>Advanced Options</span>
                                    <i class="fas fa-chevron-down arrow"></i>
                                </button>
                                <div id="advanced-panel" class="advanced-panel hidden">
                                    <div class="form-group">
                                        <label for="home-insurance" class="form-label">
                                            <i class="fas fa-shield-alt" data-tooltip="Annual homeowners insurance premium"></i>
                                            Home Insurance (Annual $)
                                        </label>
                                        <input type="number" id="home-insurance" class="form-input" value="960" min="0" step="50">
                                    </div>

                                    <div class="form-group">
                                        <label for="pmi-rate" class="form-label">
                                            <i class="fas fa-umbrella" data-tooltip="Private Mortgage Insurance rate (typically 0.5% - 1.5% annually)"></i>
                                            PMI Rate (Annual %)
                                        </label>
                                        <input type="number" id="pmi-rate" class="form-input" value="0.8" min="0" max="5" step="0.1">
                                    </div>

                                    <div class="form-group">
                                        <label for="hoa-fees" class="form-label">
                                            <i class="fas fa-users" data-tooltip="Monthly Homeowners Association or condo fees"></i>
                                            HOA Fees (Monthly $)
                                        </label>
                                        <input type="number" id="hoa-fees" class="form-input" value="0" min="0" step="25">
                                    </div>

                                    <div class="form-group">
                                        <label for="extra-monthly" class="form-label">
                                            <i class="fas fa-plus-circle" data-tooltip="Additional monthly payment towards principal to pay off loan faster"></i>
                                            Extra Monthly Payment ($)
                                        </label>
                                        <input type="number" id="extra-monthly" class="form-input" value="0" min="0" step="50">
                                    </div>

                                    <div class="form-group">
                                        <label for="extra-once" class="form-label">
                                            <i class="fas fa-hand-holding-usd" data-tooltip="One-time extra payment in the first month"></i>
                                            One-Time Extra Payment ($)
                                        </label>
                                        <input type="number" id="extra-once" class="form-input" value="0" min="0" step="100">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="action-buttons">
                            <button id="calculate-btn" class="btn btn-primary btn-full-width">
                                <i class="fas fa-calculator"></i>
                                Calculate Payment
                            </button>
                            <button id="reset-form" class="btn btn-secondary">
                                <i class="fas fa-undo"></i>
                                Reset
                            </button>
                        </div>
                    </div>

                    <!-- Right Panel - Results -->
                    <div class="calculator-panel results-panel">
                        <div class="panel-header">
                            <h2>Payment Results</h2>
                            <p>Your personalized mortgage calculation with AI insights</p>
                        </div>

                        <!-- Main Results -->
                        <div class="results-summary">
                            <div class="main-result">
                                <div class="result-label">Total Monthly Payment</div>
                                <div class="result-value" id="total-payment">$2,923</div>
                            </div>
                            <div class="key-metrics">
                                <div class="metric">
                                    <span class="metric-label">Loan Amount</span>
                                    <span class="metric-value" id="loan-amount">$320,000</span>
                                </div>
                                <div class="metric">
                                    <span class="metric-label">Total Interest</span>
                                    <span class="metric-value" id="total-interest">$422,983</span>
                                </div>
                            </div>
                        </div>

                        <!-- Payment Breakdown -->
                        <div class="breakdown-section">
                            <h3>Monthly Breakdown</h3>
                            <div class="breakdown-table">
                                <div class="breakdown-row">
                                    <span class="breakdown-label">P&I</span>
                                    <span class="breakdown-value" id="pi-amount">$2,590</span>
                                </div>
                                <div class="breakdown-row">
                                    <span class="breakdown-label">Taxes</span>
                                    <span class="breakdown-value" id="tax-amount">$137</span>
                                </div>
                                <div class="breakdown-row">
                                    <span class="breakdown-label">Insurance</span>
                                    <span class="breakdown-value" id="insurance-amount">$80</span>
                                </div>
                                <div class="breakdown-row" id="row-pmi">
                                    <span class="breakdown-label">PMI</span>
                                    <span class="breakdown-value" id="pmi-amount">$213</span>
                                </div>
                                <div class="breakdown-row">
                                    <span class="breakdown-label">HOA</span>
                                    <span class="breakdown-value" id="hoa-amount">$0</span>
                                </div>
                            </div>
                        </div>

                        <!-- Charts -->
                        <div class="charts-section">
                            <div class="chart-container">
                                <h4>Payment Breakdown</h4>
                                <canvas id="breakdownChart" width="300" height="200"></canvas>
                                <div id="legend-breakdown" class="chart-legend"></div>
                            </div>
                        </div>

                        <!-- AI Insights -->
                        <div class="insights-section">
                            <h3>
                                <i class="fas fa-lightbulb"></i>
                                AI Insights
                                <small>Personalized recommendations to save money</small>
                            </h3>
                            <ul id="insights-list" class="insights-list">
                                <!-- Dynamic AI insights will be populated here -->
                            </ul>
                        </div>

                        <!-- Amortization Preview -->
                        <div class="amortization-section">
                            <div class="section-header">
                                <h3>Payment Schedule (First 5 Years)</h3>
                                <button id="view-full-schedule" class="btn btn-outline">
                                    <i class="fas fa-table"></i>
                                    View Full Schedule
                                </button>
                            </div>
                            <div class="table-container">
                                <table class="amortization-table">
                                    <thead>
                                        <tr>
                                            <th>Year</th>
                                            <th>Payment</th>
                                            <th>Principal</th>
                                            <th>Interest</th>
                                            <th>End Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody id="amortization-body">
                                        <!-- Dynamic amortization data will be populated here -->
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="result-actions">
                            <button id="email-results" class="btn btn-secondary">
                                <i class="fas fa-envelope"></i>
                                Email Results
                            </button>
                            <button id="share-results" class="btn btn-secondary">
                                <i class="fas fa-share"></i>
                                Share
                            </button>
                            <button id="print-results" class="btn btn-secondary">
                                <i class="fas fa-print"></i>
                                Print
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Comparison Section -->
                <div class="comparison-section">
                    <div class="section-header">
                        <h3>Loan Comparison Scenarios</h3>
                        <p>Compare different loan options side by side</p>
                    </div>
                    
                    <!-- Predefined Scenarios -->
                    <div class="predefined-scenarios">
                        <h4>Quick Scenarios</h4>
                        <div class="scenario-buttons">
                            <button class="scenario-btn" data-scenario="15year">15-Year vs 30-Year</button>
                            <button class="scenario-btn" data-scenario="rates">Rate Comparison</button>
                            <button class="scenario-btn" data-scenario="downpayment">Down Payment Impact</button>
                            <button class="scenario-btn" data-scenario="extraPayment">Extra Payment Benefits</button>
                            <button class="scenario-btn" data-scenario="highCost">High Cost Area</button>
                            <button class="scenario-btn" data-scenario="lowRate">Low Rate Advantage</button>
                        </div>
                    </div>

                    <div id="comparison-cards" class="comparison-cards">
                        <!-- Dynamic comparison cards will be populated here -->
                    </div>
                </div>
            </div>
        </section>
    </main>

    <!-- Voice Status Indicator -->
    <div id="voice-status" class="voice-status">
        <div class="voice-animation">
            <div class="voice-dot"></div>
            <div class="voice-dot"></div>
            <div class="voice-dot"></div>
        </div>
        <span>Listening... Say "home price 400000" or "calculate"</span>
        <button class="voice-close">×</button>
    </div>

    <!-- Full Schedule Modal -->
    <dialog id="schedule-modal" class="schedule-modal">
        <div class="modal-header">
            <h2>
                <i class="fas fa-table"></i>
                Complete Amortization Schedule
            </h2>
            <button id="close-schedule" class="modal-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body">
            <div class="schedule-info">
                <div class="brand-info">
                    <img src="icons/icon-192x192.png" alt="Finguid Logo" class="brand-logo">
                    <div>
                        <strong>Finguid HomeLoan Pro</strong>
                        <br>www.finguid.com
                    </div>
                </div>
            </div>
            <div class="table-container full-schedule">
                <table class="schedule-table">
                    <thead>
                        <tr>
                            <th>Month</th>
                            <th>Payment</th>
                            <th>Principal</th>
                            <th>Interest</th>
                            <th>Extra</th>
                            <th>Balance</th>
                        </tr>
                    </thead>
                    <tbody id="full-schedule-body">
                        <!-- Dynamic full schedule data will be populated here -->
                    </tbody>
                </table>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-primary" onclick="window.print()">
                <i class="fas fa-print"></i>
                Print Schedule
            </button>
            <button class="btn btn-secondary" id="download-schedule">
                <i class="fas fa-download"></i>
                Download CSV
            </button>
        </div>
    </dialog>

    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <div class="footer-brand">
                        <i class="fas fa-calculator"></i>
                        Finguid
                    </div>
                    <p>America's first AI-enhanced financial calculator platform. Make smarter financial decisions with accurate, state-specific calculations and intelligent insights.</p>
                </div>
                <div class="footer-section">
                    <h4>Calculators</h4>
                    <ul>
                        <li><a href="/mortgage-calculator">Mortgage Calculator</a></li>
                        <li><a href="/calculators/auto-loan">Auto Loan</a></li>
                        <li><a href="/calculators/investment">Investment</a></li>
                        <li><a href="/calculators/refinance">Refinance</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>Resources</h4>
                    <ul>
                        <li><a href="/mortgage-rates">Current Rates</a></li>
                        <li><a href="/guides">Buying Guides</a></li>
                        <li><a href="/blog">Financial Blog</a></li>
                        <li><a href="/faq">FAQ</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>Company</h4>
                    <ul>
                        <li><a href="/about">About Us</a></li>
                        <li><a href="/contact">Contact</a></li>
                        <li><a href="/privacy">Privacy Policy</a></li>
                        <li><a href="/terms">Terms of Service</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2025 Finguid. All rights reserved. | Built with ❤️ for Americans</p>
            </div>
        </div>
    </footer>

    <!-- Scripts -->
    <script>
        /* HomeLoan Pro - AI-Enhanced Mortgage Calculator 2025
           Features: Voice Input, 50-State Data, PMI, AI Insights
           SEO & Performance Optimized for US Market
        */

        (() => {
            'use strict';
            
            const $ = (s) => document.querySelector(s);
            const $$ = (s) => Array.from(document.querySelectorAll(s));
            const money = (n) => `$${n.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            const formatNumber = (n) => n.toLocaleString('en-US');

            // US State tax rates (%) - All 50 states
            const stateTaxRates = {
                AL: 0.41, AK: 1.24, AZ: 0.60, AR: 0.66, CA: 0.81, CO: 0.52, CT: 2.16, DE: 0.62,
                FL: 0.89, GA: 0.95, HI: 0.29, ID: 0.63, IL: 2.29, IN: 0.83, IA: 1.59, KS: 1.40,
                KY: 0.89, LA: 0.62, ME: 1.29, MD: 1.07, MA: 1.19, MI: 1.53, MN: 1.10, MS: 0.81,
                MO: 1.00, MT: 0.83, NE: 1.70, NV: 0.55, NH: 2.09, NJ: 2.46, NM: 0.84, NY: 1.73,
                NC: 0.80, ND: 1.02, OH: 1.57, OK: 0.99, OR: 0.92, PA: 1.56, RI: 1.54, SC: 0.58,
                SD: 1.24, TN: 0.65, TX: 1.90, UT: 0.57, VT: 1.89, VA: 0.83, WA: 0.93, WV: 0.59,
                WI: 1.71, WY: 0.61
            };

            // State names for tooltips
            const stateNames = {
                AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
                CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
                HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas',
                KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts',
                MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
                NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico',
                NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
                OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
                TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia',
                WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming'
            };

            // Calculator state
            let currentMode = 'payment';
            let activeTerm = 30;
            let usePct = false;
            let comparisons = [];
            let recognition = null;
            let currentCalculation = null;

            // Elements cache
            const els = {
                // Payment mode inputs
                homePrice: $('#home-price'),
                dpAmount: $('#dp-amount'),
                dpPercent: $('#dp-percent'),
                interestRate: $('#interest-rate'),
                termCustom: $('#term-custom'),
                state: $('#state'),
                propertyTax: $('#property-tax'),
                homeInsurance: $('#home-insurance'),
                pmiRate: $('#pmi-rate'),
                hoaFees: $('#hoa-fees'),
                extraMonthly: $('#extra-monthly'),
                extraOnce: $('#extra-once'),

                // UI controls
                tabAmount: $('#tab-amount'),
                tabPercent: $('#tab-percent'),
                dpAmountWrap: $('#dp-amount-wrap'),
                dpPercentWrap: $('#dp-percent-wrap'),
                pmiBanner: $('#pmi-banner'),
                termButtons: $('#term-buttons'),
                advancedToggle: $('#advanced-toggle'),
                advancedPanel: $('#advanced-panel'),

                // Results
                totalPayment: $('#total-payment'),
                loanAmount: $('#loan-amount'),
                totalInterest: $('#total-interest'),
                piAmount: $('#pi-amount'),
                taxAmount: $('#tax-amount'),
                insuranceAmount: $('#insurance-amount'),
                pmiAmount: $('#pmi-amount'),
                hoaAmount: $('#hoa-amount'),
                rowPmi: $('#row-pmi'),

                // Charts and tables
                breakdownChart: $('#breakdownChart'),
                legendBreakdown: $('#legend-breakdown'),
                amortizationBody: $('#amortization-body'),
                fullScheduleBody: $('#full-schedule-body'),
                scheduleModal: $('#schedule-modal'),

                // Actions
                calculateBtn: $('#calculate-btn'),
                resetBtn: $('#reset-form'),
                emailBtn: $('#email-results'),
                shareBtn: $('#share-results'),
                printBtn: $('#print-results'),
                viewFullSchedule: $('#view-full-schedule'),
                closeSchedule: $('#close-schedule'),

                // Voice
                voiceBtns: $$('.voice-btn'),
                voiceStatus: $('#voice-status'),

                // Insights
                insightsList: $('#insights-list'),

                // Comparison
                comparisonCards: $('#comparison-cards'),
                scenarioBtns: $$('.scenario-btn')
            };

            // Initialize calculator
            function init() {
                setupEventListeners();
                setupVoiceRecognition();
                setupTooltips();
                setInitialValues();
                calculate();
            }

            // Event listeners setup
            function setupEventListeners() {
                // Down payment tabs
                els.tabAmount.addEventListener('click', () => switchDPMode(false));
                els.tabPercent.addEventListener('click', () => switchDPMode(true));

                // Input synchronization
                els.homePrice.addEventListener('input', handleHomePriceChange);
                els.dpAmount.addEventListener('input', () => syncDownPayment(false));
                els.dpPercent.addEventListener('input', () => syncDownPayment(true));
                els.state.addEventListener('change', updatePropertyTax);

                // Term selection
                els.termButtons.addEventListener('click', (e) => {
                    const btn = e.target.closest('.chip[data-term]');
                    if (btn) setTerm(+btn.dataset.term);
                });
                els.termCustom.addEventListener('input', handleCustomTerm);

                // Advanced options
                els.advancedToggle.addEventListener('click', toggleAdvanced);

                // Auto-calculation on input changes
                const autoCalcInputs = [
                    els.homePrice, els.dpAmount, els.dpPercent, els.interestRate,
                    els.propertyTax, els.homeInsurance, els.pmiRate, els.hoaFees,
                    els.extraMonthly, els.extraOnce
                ];
                
                autoCalcInputs.forEach(input => {
                    if (input) {
                        input.addEventListener('input', debounce(calculate, 300));
                    }
                });

                // Action buttons
                els.calculateBtn.addEventListener('click', calculate);
                els.resetBtn.addEventListener('click', resetForm);
                els.emailBtn.addEventListener('click', emailResults);
                els.shareBtn.addEventListener('click', shareResults);
                els.printBtn.addEventListener('click', () => window.print());
                els.viewFullSchedule.addEventListener('click', showFullSchedule);
                els.closeSchedule.addEventListener('click', () => els.scheduleModal.close());

                // Voice buttons
                els.voiceBtns.forEach(btn => {
                    btn.addEventListener('click', () => startVoiceInput(btn.dataset.field));
                });

                // Voice status close
                $('.voice-close')?.addEventListener('click', hideVoiceStatus);
                
                // Comparison
                els.scenarioBtns.forEach(btn => {
                    btn.addEventListener('click', () => loadScenario(btn.dataset.scenario));
                });

                // Modal backdrop click
                els.scheduleModal.addEventListener('click', (e) => {
                    if (e.target === els.scheduleModal) {
                        els.scheduleModal.close();
                    }
                });

                // Hamburger menu
                $('#hamburger')?.addEventListener('click', toggleMobileMenu);
            }

            // Voice recognition setup
            function setupVoiceRecognition() {
                try {
                    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                    if (!SpeechRecognition) {
                        // Hide voice buttons if not supported
                        els.voiceBtns.forEach(btn => btn.style.display = 'none');
                        return;
                    }

                    recognition = new SpeechRecognition();
                    recognition.continuous = false;
                    recognition.interimResults = false;
                    recognition.lang = 'en-US';
                    recognition.maxAlternatives = 1;

                    recognition.onresult = (event) => {
                        const transcript = event.results[0][0].transcript.toLowerCase();
                        processVoiceCommand(transcript);
                    };

                    recognition.onerror = (event) => {
                        console.error('Voice recognition error:', event.error);
                        hideVoiceStatus();
                        showNotification('Voice recognition error. Please try again.', 'error');
                    };

                    recognition.onend = hideVoiceStatus;

                } catch (error) {
                    console.warn('Voice recognition not available:', error);
                    els.voiceBtns.forEach(btn => btn.style.display = 'none');
                }
            }

            // Tooltip setup
            function setupTooltips() {
                $$('[data-tooltip]').forEach(element => {
                    element.addEventListener('mouseenter', showTooltip);
                    element.addEventListener('mouseleave', hideTooltip);
                });
            }

            // Set initial values
            function setInitialValues() {
                setTerm(30);
                switchDPMode(false);
                updatePropertyTax();
                updateInsurance();
            }

            // Down payment mode switching
            function switchDPMode(usePercent) {
                usePct = usePercent;
                els.tabAmount.classList.toggle('active', !usePercent);
                els.tabPercent.classList.toggle('active', usePercent);
                els.dpAmountWrap.classList.toggle('hidden', usePercent);
                els.dpPercentWrap.classList.toggle('hidden', !usePercent);
                
                syncDownPayment(usePercent);
            }

            // Sync down payment inputs
            function syncDownPayment(fromPercent) {
                const homePrice = +els.homePrice.value || 0;
                
                if (fromPercent) {
                    const pct = Math.min(100, Math.max(0, +els.dpPercent.value || 0));
                    const amt = Math.round(homePrice * pct / 100);
                    els.dpAmount.value = amt;
                } else {
                    const amt = Math.min(homePrice, Math.max(0, +els.dpAmount.value || 0));
                    const pct = homePrice > 0 ? (amt / homePrice * 100) : 0;
                    els.dpPercent.value = pct.toFixed(1);
                }

                updatePMIBanner();
            }

            // Handle home price changes
            function handleHomePriceChange() {
                syncDownPayment(usePct);
                updatePropertyTax();
                updateInsurance();
            }

            // Update PMI banner
            function updatePMIBanner() {
                const dpPct = +els.dpPercent.value || 0;
                const needsPMI = dpPct < 20;
                els.pmiBanner.classList.toggle('hidden', !needsPMI);
                
                if (needsPMI) {
                    els.pmiBanner.innerHTML = `
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>PMI Required - Down payment is ${dpPct.toFixed(1)}% (less than 20% of home value)</span>
                    `;
                }
            }

            // Update property tax based on state
            function updatePropertyTax() {
                const homePrice = +els.homePrice.value || 0;
                const state = els.state.value;
                
                if (!state || !homePrice) return;
                
                const taxRate = stateTaxRates[state] || 1.0;
                const annualTax = Math.round(homePrice * (taxRate / 100));
                els.propertyTax.value = annualTax;
                
                // Update tooltip with state info
                const stateInfo = `${stateNames[state]} average: ${taxRate}%`;
                els.propertyTax.setAttribute('title', stateInfo);
            }

            // Update insurance estimate
            function updateInsurance() {
                const homePrice = +els.homePrice.value || 0;
                const estimate = Math.round(homePrice * 0.0024); // ~0.24% of home value
                els.homeInsurance.value = Math.max(600, Math.min(estimate, 3000));
            }

            // Term selection
            function setTerm(years) {
                activeTerm = years;
                $$('[data-term]').forEach(btn => {
                    btn.classList.toggle('active', +btn.dataset.term === years);
                });
                els.termCustom.value = '';
                calculate();
            }

            // Handle custom term input
            function handleCustomTerm() {
                const customYears = +els.termCustom.value;
                if (customYears >= 1 && customYears <= 40) {
                    activeTerm = customYears;
                    $$('[data-term]').forEach(btn => btn.classList.remove('active'));
                }
                calculate();
            }

            // Toggle advanced options
            function toggleAdvanced() {
                const panel = els.advancedPanel;
                const arrow = els.advancedToggle.querySelector('.arrow');
                const button = els.advancedToggle;
                
                panel.classList.toggle('hidden');
                arrow.classList.toggle('rotated');
                button.classList.toggle('active');
            }

            // Voice input functions
            function startVoiceInput(field) {
                if (!recognition) {
                    showNotification('Voice input not supported in this browser', 'error');
                    return;
                }
                
                showVoiceStatus();
                recognition.start();
            }

            function processVoiceCommand(transcript) {
                console.log('Voice command:', transcript);
                
                const numbers = transcript.match(/\d+(?:\.\d+)?/g);
                
                if (transcript.includes('home price') || transcript.includes('house price')) {
                    if (numbers && numbers.length > 0) {
                        let value = parseFloat(numbers[0]);
                        if (value < 10000) value *= 1000;
                        els.homePrice.value = value;
                        handleHomePriceChange();
                        showNotification(`Home price set to ${money(value)}`, 'success');
                    }
                } else if (transcript.includes('down payment')) {
                    if (numbers && numbers.length > 0) {
                        let value = parseFloat(numbers[0]);
                        if (transcript.includes('percent')) {
                            usePct = true;
                            switchDPMode(true);
                            els.dpPercent.value = value;
                            syncDownPayment(true);
                        } else {
                            if (value < 1000) value *= 1000;
                            usePct = false;
                            switchDPMode(false);
                            els.dpAmount.value = value;
                            syncDownPayment(false);
                        }
                        showNotification('Down payment updated', 'success');
                    }
                } else if (transcript.includes('interest rate') || transcript.includes('rate')) {
                    if (numbers && numbers.length > 0) {
                        const value = parseFloat(numbers[0]);
                        els.interestRate.value = value;
                        showNotification(`Interest rate set to ${value}%`, 'success');
                    }
                } else if (transcript.includes('calculate')) {
                    calculate();
                    showNotification('Calculation completed!', 'success');
                } else {
                    showNotification('Try saying: "home price 400000" or "interest rate 6.5"', 'info');
                }
                
                calculate();
            }

            function showVoiceStatus() {
                els.voiceStatus.classList.add('active');
            }

            function hideVoiceStatus() {
                els.voiceStatus.classList.remove('active');
            }

            // Main calculation function
            function calculate() {
                try {
                    const result = calculatePayment();
                    
                    if (result) {
                        currentCalculation = result;
                        updateDisplay(result);
                        generateInsights(result);
                        updateCharts(result);
                        updateAmortizationTable(result);
                    }
                } catch (error) {
                    console.error('Calculation error:', error);
                    showNotification('Calculation error. Please check your inputs.', 'error');
                }
            }

            // Payment calculation
            function calculatePayment() {
                const homePrice = +els.homePrice.value || 0;
                const dpAmount = +els.dpAmount.value || 0;
                const loanAmount = Math.max(0, homePrice - dpAmount);
                const rate = (+els.interestRate.value || 0) / 100;
                const term = +els.termCustom.value || activeTerm;
                const months = term * 12;

                if (!homePrice || !rate || !term) return null;

                // Property costs
                const annualTax = +els.propertyTax.value || 0;
                const annualInsurance = +els.homeInsurance.value || 0;
                const pmiRate = (+els.pmiRate.value || 0) / 100;
                const monthlyHOA = +els.hoaFees.value || 0;
                const extraMonthly = +els.extraMonthly.value || 0;
                const extraOnce = +els.extraOnce.value || 0;

                // Calculate monthly P&I
                const monthlyRate = rate / 12;
                let monthlyPI = 0;
                if (monthlyRate > 0) {
                    monthlyPI = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                               (Math.pow(1 + monthlyRate, months) - 1);
                } else {
                    monthlyPI = loanAmount / months;
                }

                // Other monthly costs
                const monthlyTax = annualTax / 12;
                const monthlyInsurance = annualInsurance / 12;
                const dpPercent = homePrice > 0 ? (dpAmount / homePrice * 100) : 0;
                const needsPMI = dpPercent < 20;
                const monthlyPMI = needsPMI ? (loanAmount * pmiRate / 12) : 0;

                const totalMonthly = monthlyPI + monthlyTax + monthlyInsurance + monthlyPMI + monthlyHOA;

                // Generate amortization schedule with extra payments
                const schedule = generateSchedule(loanAmount, monthlyRate, monthlyPI, months, extraMonthly, extraOnce);
                const totalInterest = schedule.reduce((sum, payment) => sum + payment.interest, 0);

                return {
                    mode: 'payment',
                    homePrice,
                    dpAmount,
                    dpPercent,
                    loanAmount,
                    rate: rate * 100,
                    term,
                    monthlyPI,
                    monthlyTax,
                    monthlyInsurance,
                    monthlyPMI,
                    monthlyHOA,
                    totalMonthly,
                    totalInterest,
                    totalCost: loanAmount + totalInterest,
                    needsPMI,
                    schedule,
                    extraMonthly,
                    extraOnce
                };
            }

            // Generate amortization schedule
            function generateSchedule(loanAmount, monthlyRate, monthlyPI, totalMonths, extraMonthly = 0, extraOnce = 0) {
                const schedule = [];
                let balance = loanAmount;
                let totalExtra = 0;

                for (let month = 1; month <= totalMonths && balance > 0; month++) {
                    const interestPayment = balance * monthlyRate;
                    let principalPayment = monthlyPI - interestPayment;
                    let extraPayment = 0;

                    // Add extra payments
                    if (month === 1 && extraOnce > 0) {
                        extraPayment += Math.min(extraOnce, balance - principalPayment);
                    }
                    if (extraMonthly > 0) {
                        extraPayment += Math.min(extraMonthly, balance - principalPayment);
                    }

                    totalExtra += extraPayment;
                    principalPayment += extraPayment;
                    
                    // Ensure we don't overpay
                    if (principalPayment > balance) {
                        principalPayment = balance;
                        extraPayment = principalPayment - (monthlyPI - interestPayment);
                    }

                    balance = Math.max(0, balance - principalPayment);

                    schedule.push({
                        month,
                        payment: monthlyPI + extraPayment,
                        principal: principalPayment,
                        interest: interestPayment,
                        extra: extraPayment,
                        balance
                    });

                    if (balance === 0) break;
                }

                return schedule;
            }

            // Update display based on calculation mode
            function updateDisplay(result) {
                updatePaymentDisplay(result);
            }

            // Update payment mode display
            function updatePaymentDisplay(result) {
                els.totalPayment.textContent = money(result.totalMonthly);
                els.loanAmount.textContent = money(result.loanAmount);
                els.totalInterest.textContent = money(result.totalInterest);
                els.piAmount.textContent = money(result.monthlyPI);
                els.taxAmount.textContent = money(result.monthlyTax);
                els.insuranceAmount.textContent = money(result.monthlyInsurance);
                els.pmiAmount.textContent = money(result.monthlyPMI);
                els.hoaAmount.textContent = money(result.monthlyHOA);

                // Show/hide PMI row
                els.rowPmi.classList.toggle('hidden', !result.needsPMI);
            }

            // Update charts
            function updateCharts(result) {
                if (result.mode !== 'payment') return;

                // Pie chart for payment breakdown
                const breakdownData = [
                    result.monthlyPI,
                    result.monthlyTax,
                    result.monthlyInsurance,
                    result.monthlyPMI,
                    result.monthlyHOA
                ];
                const colors = ['#21808d', '#a84b2f', '#626c71', '#c0152f', '#94a3b8'];
                const labels = ['P&I', 'Taxes', 'Insurance', 'PMI', 'HOA'];
                
                drawPieChart(els.breakdownChart, breakdownData, colors, labels);
            }

            // Draw pie chart
            function drawPieChart(canvas, data, colors, labels) {
                const ctx = canvas.getContext('2d');
                const rect = canvas.getBoundingClientRect();
                const size = Math.min(rect.width, rect.height);
                
                canvas.width = size;
                canvas.height = size;
                
                ctx.clearRect(0, 0, size, size);
                
                const total = data.reduce((sum, value) => sum + value, 0);
                const centerX = size / 2;
                const centerY = size / 2;
                const radius = Math.min(centerX, centerY) * 0.8;
                
                let startAngle = -Math.PI / 2;
                
                data.forEach((value, index) => {
                    if (value > 0) {
                        const angle = (value / total) * 2 * Math.PI;
                        
                        ctx.beginPath();
                        ctx.moveTo(centerX, centerY);
                        ctx.arc(centerX, centerY, radius, startAngle, startAngle + angle);
                        ctx.closePath();
                        
                        ctx.fillStyle = colors[index];
                        ctx.fill();
                        
                        startAngle += angle;
                    }
                });

                // Update legend
                let legendHTML = '';
                data.forEach((value, index) => {
                    if (value > 0) {
                        legendHTML += `
                            <div class="legend-item">
                                <div class="legend-color" style="background: ${colors[index]}"></div>
                                <span>${labels[index]}: ${money(value)}</span>
                            </div>
                        `;
                    }
                });
                els.legendBreakdown.innerHTML = legendHTML;
            }

            // Update amortization table
            function updateAmortizationTable(result) {
                if (result.mode !== 'payment' || !result.schedule) return;

                let html = '';
                let currentYear = 1;
                let yearlyPayment = 0;
                let yearlyPrincipal = 0;
                let yearlyInterest = 0;
                let yearEndBalance = 0;

                result.schedule.forEach((payment, index) => {
                    yearlyPayment += payment.payment;
                    yearlyPrincipal += payment.principal;
                    yearlyInterest += payment.interest;
                    yearEndBalance = payment.balance;

                    // End of year or last payment
                    if (payment.month % 12 === 0 || index === result.schedule.length - 1) {
                        if (currentYear <= 5) {
                            html += `
                                <tr>
                                    <td>${currentYear}</td>
                                    <td>${money(yearlyPayment)}</td>
                                    <td>${money(yearlyPrincipal)}</td>
                                    <td>${money(yearlyInterest)}</td>
                                    <td>${money(yearEndBalance)}</td>
                                </tr>
                            `;
                        }
                        
                        currentYear++;
                        yearlyPayment = 0;
                        yearlyPrincipal = 0;
                        yearlyInterest = 0;
                    }
                });

                els.amortizationBody.innerHTML = html;
            }

            // Generate AI insights
            function generateInsights(result) {
                const insights = [];

                if (result.mode === 'payment') {
                    // PMI insight
                    if (result.needsPMI) {
                        const additionalDP = Math.max(0, result.homePrice * 0.2 - result.dpAmount);
                        insights.push({
                            icon: 'fas fa-shield-alt',
                            type: 'tip',
                            title: 'Eliminate PMI',
                            message: `Increase down payment by ${money(additionalDP)} to reach 20% and eliminate PMI (saves ${money(result.monthlyPMI)}/month)`
                        });
                    }

                    // Term comparison
                    if (result.term > 15) {
                        const rate15 = result.rate / 100 / 12;
                        const months15 = 15 * 12;
                        const payment15 = result.loanAmount * (rate15 * Math.pow(1 + rate15, months15)) / (Math.pow(1 + rate15, months15) - 1);
                        const interest15 = payment15 * months15 - result.loanAmount;
                        const interestSavings = result.totalInterest - interest15;
                        
                        insights.push({
                            icon: 'fas fa-calendar',
                            type: 'comparison',
                            title: 'Consider 15-Year Term',
                            message: `15-year loan: ${money(payment15)}/month, saves ${money(interestSavings)} in total interest`
                        });
                    }

                    // Extra payment benefits
                    if (result.extraMonthly > 0 || result.extraOnce > 0) {
                        const withoutExtra = generateSchedule(result.loanAmount, result.rate / 100 / 12, result.monthlyPI, result.term * 12, 0, 0);
                        const monthsSaved = withoutExtra.length - result.schedule.length;
                        const interestSaved = withoutExtra.reduce((sum, p) => sum + p.interest, 0) - result.totalInterest;
                        
                        insights.push({
                            icon: 'fas fa-rocket',
                            type: 'savings',
                            title: 'Extra Payment Impact',
                            message: `Extra payments save ${monthsSaved} months and ${money(interestSaved)} in interest`
                        });
                    } else {
                        insights.push({
                            icon: 'fas fa-plus-circle',
                            type: 'tip',
                            title: 'Consider Extra Payments',
                            message: `Adding $100/month could save years on your loan and thousands in interest`
                        });
                    }

                    // Interest rate insight
                    if (result.rate > 7) {
                        insights.push({
                            icon: 'fas fa-percentage',
                            type: 'warning',
                            title: 'High Interest Rate',
                            message: `Consider improving credit score or shopping for better rates to reduce monthly payment`
                        });
                    }
                }

                // Render insights
                let insightsHTML = '';
                insights.forEach(insight => {
                    const colorClass = {
                        'tip': 'insight-tip',
                        'savings': 'insight-savings',
                        'warning': 'insight-warning',
                        'comparison': 'insight-comparison',
                        'info': 'insight-info'
                    }[insight.type];

                    insightsHTML += `
                        <li class="insight-item ${colorClass}">
                            <div class="insight-icon">
                                <i class="${insight.icon}"></i>
                            </div>
                            <div class="insight-content">
                                <strong>${insight.title}</strong>
                                <p>${insight.message}</p>
                            </div>
                        </li>
                    `;
                });

                els.insightsList.innerHTML = insightsHTML;
            }

            // Show full schedule modal
            function showFullSchedule() {
                if (!currentCalculation || !currentCalculation.schedule) return;

                let html = '';
                currentCalculation.schedule.forEach(payment => {
                    html += `
                        <tr>
                            <td>${payment.month}</td>
                            <td>${money(payment.payment)}</td>
                            <td>${money(payment.principal)}</td>
                            <td>${money(payment.interest)}</td>
                            <td>${money(payment.extra)}</td>
                            <td>${money(payment.balance)}</td>
                        </tr>
                    `;
                });

                els.fullScheduleBody.innerHTML = html;
                els.scheduleModal.showModal();
            }

            // Email results
            function emailResults() {
                if (!currentCalculation) return;

                let subject, body;

                if (currentCalculation.mode === 'payment') {
                    subject = encodeURIComponent(`Mortgage Calculator Results - ${money(currentCalculation.totalMonthly)}/month`);
                    body = encodeURIComponent(
                        `Mortgage Calculator Results from Finguid HomeLoan Pro\n\n` +
                        `Home Price: ${money(currentCalculation.homePrice)}\n` +
                        `Down Payment: ${money(currentCalculation.dpAmount)} (${currentCalculation.dpPercent.toFixed(1)}%)\n` +
                        `Loan Amount: ${money(currentCalculation.loanAmount)}\n` +
                        `Interest Rate: ${currentCalculation.rate.toFixed(2)}%\n` +
                        `Term: ${currentCalculation.term} years\n\n` +
                        `Monthly Payment Breakdown:\n` +
                        `Principal & Interest: ${money(currentCalculation.monthlyPI)}\n` +
                        `Property Tax: ${money(currentCalculation.monthlyTax)}\n` +
                        `Insurance: ${money(currentCalculation.monthlyInsurance)}\n` +
                        `PMI: ${money(currentCalculation.monthlyPMI)}\n` +
                        `HOA: ${money(currentCalculation.monthlyHOA)}\n` +
                        `Total Monthly: ${money(currentCalculation.totalMonthly)}\n\n` +
                        `Total Interest: ${money(currentCalculation.totalInterest)}\n\n` +
                        `Calculate your mortgage at: https://www.finguid.com/mortgage-calculator`
                    );
                }

                window.location.href = `mailto:?subject=${subject}&body=${body}`;
            }

            // Share results
            function shareResults() {
                if (!navigator.share) {
                    // Fallback: copy to clipboard
                    copyToClipboard();
                    return;
                }

                const shareData = {
                    title: 'Mortgage Calculator Results',
                    text: `Check out my mortgage calculation: ${money(currentCalculation.totalMonthly)}/month`,
                    url: window.location.href
                };

                navigator.share(shareData)
                    .then(() => showNotification('Results shared successfully!', 'success'))
                    .catch(() => copyToClipboard());
            }

            // Copy results to clipboard
            function copyToClipboard() {
                const text = `My mortgage payment: ${money(currentCalculation.totalMonthly)}/month. Calculate yours at ${window.location.href}`;
                
                navigator.clipboard.writeText(text)
                    .then(() => showNotification('Results copied to clipboard!', 'success'))
                    .catch(() => showNotification('Unable to copy results', 'error'));
            }

            // Load predefined scenarios
            function loadScenario(scenarioType) {
                // Clear previous comparisons
                comparisons = [];
                
                // Set base values
                const baseValues = {
                    homePrice: 400000,
                    dpAmount: 80000,
                    interestRate: 6.75,
                    state: 'CA'
                };

                // Set base values
                Object.keys(baseValues).forEach(key => {
                    if (els[key]) els[key].value = baseValues[key];
                });

                switch (scenarioType) {
                    case '15year':
                        // Add 30-year scenario
                        setTerm(30);
                        calculate();
                        comparisons.push({
                            name: '30-Year Fixed',
                            ...currentCalculation
                        });
                        
                        // Add 15-year scenario
                        setTerm(15);
                        calculate();
                        comparisons.push({
                            name: '15-Year Fixed',
                            ...currentCalculation
                        });
                        break;

                    case 'rates':
                        // Compare different rates
                        [5.5, 6.0, 6.5, 7.0].forEach(rate => {
                            els.interestRate.value = rate;
                            calculate();
                            comparisons.push({
                                name: `${rate}% Rate`,
                                ...currentCalculation
                            });
                        });
                        break;

                    case 'downpayment':
                        // Compare different down payments
                        [40000, 80000, 120000].forEach(dp => {
                            els.dpAmount.value = dp;
                            syncDownPayment(false);
                            calculate();
                            comparisons.push({
                                name: `${money(dp)} Down`,
                                ...currentCalculation
                            });
                        });
                        break;

                    case 'extraPayment':
                        // Compare with and without extra payments
                        els.extraMonthly.value = 0;
                        calculate();
                        comparisons.push({
                            name: 'No Extra Payment',
                            ...currentCalculation
                        });

                        els.extraMonthly.value = 200;
                        calculate();
                        comparisons.push({
                            name: '$200 Extra/Month',
                            ...currentCalculation
                        });
                        break;

                    case 'highCost':
                        // High cost area scenario
                        els.homePrice.value = 750000;
                        els.dpAmount.value = 150000;
                        els.interestRate.value = 6.25;
                        els.state.value = 'CA';
                        updatePropertyTax();
                        calculate();
                        comparisons.push({
                            name: 'High Cost Area',
                            ...currentCalculation
                        });
                        break;

                    case 'lowRate':
                        // Low rate advantage
                        els.homePrice.value = 400000;
                        els.dpAmount.value = 80000;
                        els.interestRate.value = 5.5;
                        calculate();
                        comparisons.push({
                            name: 'Low Rate Advantage',
                            ...currentCalculation
                        });
                        break;
                }

                renderComparisons();
                showNotification(`${scenarioType.replace(/([A-Z])/g, ' $1')} scenarios loaded`, 'success');
            }

            function renderComparisons() {
                if (comparisons.length === 0) {
                    els.comparisonCards.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary);">No scenarios to compare. Select a scenario above.</p>';
                    return;
                }

                let html = '';
                comparisons.forEach((scenario, index) => {
                    // Find the base scenario for comparison (first one)
                    const baseScenario = comparisons[0];
                    const monthlySavings = index > 0 ? baseScenario.totalMonthly - scenario.totalMonthly : 0;
                    const interestSavings = index > 0 ? baseScenario.totalInterest - scenario.totalInterest : 0;
                    
                    html += `
                        <div class="comparison-card">
                            <div class="comparison-header">
                                <h4 class="comparison-title">${scenario.name}</h4>
                                ${monthlySavings > 0 ? `<div class="comparison-savings">Saves ${money(monthlySavings)}/mo</div>` : ''}
                            </div>
                            <div class="comparison-details">
                                <div class="comparison-row">
                                    <span>Monthly Payment:</span>
                                    <strong>${money(scenario.totalMonthly)}</strong>
                                </div>
                                <div class="comparison-row">
                                    <span>Loan Amount:</span>
                                    <span>${money(scenario.loanAmount)}</span>
                                </div>
                                <div class="comparison-row">
                                    <span>Interest Rate:</span>
                                    <span>${scenario.rate.toFixed(2)}%</span>
                                </div>
                                <div class="comparison-row">
                                    <span>Term:</span>
                                    <span>${scenario.term} years</span>
                                </div>
                                <div class="comparison-row">
                                    <span>Total Interest:</span>
                                    <span>${money(scenario.totalInterest)}</span>
                                </div>
                                ${interestSavings > 0 ? `
                                <div class="comparison-row">
                                    <span>Interest Savings:</span>
                                    <span style="color: #166534; font-weight: 600;">${money(interestSavings)}</span>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                });

                els.comparisonCards.innerHTML = html;
            }

            // Reset form
            function resetForm() {
                // Reset inputs to defaults
                els.homePrice.value = 400000;
                els.dpAmount.value = 80000;
                els.dpPercent.value = 20;
                els.interestRate.value = 6.75;
                els.state.value = '';
                els.propertyTax.value = 0;
                els.homeInsurance.value = 960;
                els.pmiRate.value = 0.8;
                els.hoaFees.value = 0;
                els.extraMonthly.value = 0;
                els.extraOnce.value = 0;
                els.termCustom.value = '';

                // Reset UI state
                setTerm(30);
                switchDPMode(false);
                comparisons = [];
                renderComparisons();

                // Recalculate
                updatePropertyTax();
                updateInsurance();
                calculate();

                showNotification('Form reset to defaults', 'info');
            }

            // Utility functions
            function debounce(func, wait) {
                let timeout;
                return function executedFunction(...args) {
                    const later = () => {
                        clearTimeout(timeout);
                        func(...args);
                    };
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                };
            }

            function showNotification(message, type = 'info') {
                // Simple notification system
                const notification = document.createElement('div');
                notification.className = `notification notification-${type}`;
                notification.innerHTML = `
                    <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}-circle"></i>
                    <span>${message}</span>
                `;
                
                document.body.appendChild(notification);
                
                setTimeout(() => {
                    notification.classList.add('show');
                }, 100);
                
                setTimeout(() => {
                    notification.classList.remove('show');
                    setTimeout(() => {
                        document.body.removeChild(notification);
                    }, 300);
                }, 3000);
            }

            function showTooltip(event) {
                const tooltip = event.target.dataset.tooltip;
                if (!tooltip) return;

                const tooltipEl = document.createElement('div');
                tooltipEl.className = 'tooltip-popup';
                tooltipEl.textContent = tooltip;
                
                document.body.appendChild(tooltipEl);
                
                const rect = event.target.getBoundingClientRect();
                tooltipEl.style.left = rect.left + rect.width / 2 - tooltipEl.offsetWidth / 2 + 'px';
                tooltipEl.style.top = rect.top - tooltipEl.offsetHeight - 10 + 'px';
            }

            function hideTooltip() {
                const tooltip = document.querySelector('.tooltip-popup');
                if (tooltip) {
                    document.body.removeChild(tooltip);
                }
            }

            function toggleMobileMenu() {
                const navMenu = $('#nav-menu');
                const hamburger = $('#hamburger');
                navMenu.classList.toggle('active');
                hamburger.classList.toggle('active');
            }

            // Initialize when DOM is loaded
            document.addEventListener('DOMContentLoaded', init);

            // Analytics tracking
            function trackEvent(action, category = 'Calculator') {
                if (typeof gtag !== 'undefined') {
                    gtag('event', action, {
                        event_category: category,
                        event_label: currentMode
                    });
                }
            }

            // Track calculator usage
            document.addEventListener('DOMContentLoaded', () => {
                els.calculateBtn.addEventListener('click', () => trackEvent('calculate'));
            });

        })();
    </script>
</body>
</html>
