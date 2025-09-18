/* mortgage-calculator.css */
/* FinGuid Mortgage Calculator CSS - Enhanced v6.0.0 */
/* Based on style-1.css design system with all requested improvements */

:root {
    /* Primitive Color Tokens */
    --color-white: rgba(255, 255, 255, 1);
    --color-black: rgba(0, 0, 0, 1);
    --color-cream-50: rgba(252, 252, 249, 1);
    --color-cream-100: rgba(255, 255, 253, 1);
    --color-gray-200: rgba(245, 245, 245, 1);
    --color-gray-300: rgba(167, 169, 169, 1);
    --color-gray-400: rgba(119, 124, 124, 1);
    --color-slate-500: rgba(98, 108, 113, 1);
    --color-brown-600: rgba(94, 82, 64, 1);
    --color-charcoal-700: rgba(31, 33, 33, 1);
    --color-charcoal-800: rgba(38, 40, 40, 1);
    --color-slate-900: rgba(19, 52, 59, 1);
    --color-teal-300: rgba(50, 184, 198, 1);
    --color-teal-400: rgba(45, 166, 178, 1);
    --color-teal-500: rgba(33, 128, 141, 1);
    --color-teal-600: rgba(29, 116, 128, 1);
    --color-teal-700: rgba(26, 104, 115, 1);
    --color-teal-800: rgba(41, 150, 161, 1);
    --color-red-400: rgba(255, 84, 89, 1);
    --color-red-500: rgba(192, 21, 47, 1);
    --color-orange-400: rgba(230, 129, 97, 1);
    --color-orange-500: rgba(168, 75, 47, 1);
    /* RGB tokens */
    --color-brown-600-rgb: 94, 82, 64;
    --color-teal-500-rgb: 33, 128, 141;
    --color-slate-900-rgb: 19, 52, 59;
    --color-slate-500-rgb: 98, 108, 113;
    --color-red-500-rgb: 192, 21, 47;
    --color-red-400-rgb: 255, 84, 89;
    --color-orange-500-rgb: 168, 75, 47;
    --color-orange-400-rgb: 230, 129, 97;
    /* Semantic */
    --color-background: var(--color-cream-50);
    --color-surface: var(--color-cream-100);
    --color-text: var(--color-slate-900);
    --color-text-secondary: var(--color-slate-500);
    --color-primary: var(--color-teal-500);
    --color-primary-hover: var(--color-teal-600);
    --color-primary-active: var(--color-teal-700);
    --color-secondary: rgba(var(--color-brown-600-rgb), 0.12);
    --color-secondary-hover: rgba(var(--color-brown-600-rgb), 0.2);
    --color-border: rgba(var(--color-brown-600-rgb), 0.2);
    --color-card-border: rgba(var(--color-brown-600-rgb), 0.12);
    --color-error: var(--color-red-500);
    --color-success: var(--color-teal-500);
    --color-warning: var(--color-orange-500);
    --color-info: var(--color-slate-500);
    --color-focus-ring: rgba(var(--color-teal-500-rgb), 0.4);
    /* Typography */
    --font-family-base: "FKGroteskNeue", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --font-size-xs: 11px;
    --font-size-sm: 12px;
    --font-size-base: 14px;
    --font-size-lg: 16px;
    --font-size-xl: 18px;
    --font-size-2xl: 20px;
    --font-size-3xl: 24px;
    --font-size-4xl: 30px;
    --font-weight-medium: 500;
    --font-weight-semibold: 550;
    --font-weight-bold: 600;
    --line-height-normal: 1.5;
    --line-height-tight: 1.2;
    /* Spacing */
    --space-4: 4px;
    --space-6: 6px;
    --space-8: 8px;
    --space-10: 10px;
    --space-12: 12px;
    --space-16: 16px;
    --space-20: 20px;
    --space-24: 24px;
    --space-32: 32px;
    /* Border radius */
    --radius-base: 8px;
    --radius-md: 10px;
    --radius-lg: 12px;
    --radius-full: 9999px;
    /* Shadows */
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.04);
    --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.04);
    --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.04);
    /* Animation */
    --duration-fast: 150ms;
    --duration-normal: 250ms;
    --ease-standard: cubic-bezier(0.16, 1, 0.3, 1);
}
/* Dark mode */
@media (prefers-color-scheme: dark) {
    :root {
        --color-background: var(--color-charcoal-700);
        --color-surface: var(--color-charcoal-800);
        --color-text: var(--color-gray-200);
        --color-text-secondary: rgba(var(--color-gray-300-rgb,167,169,169),0.7);
        --color-primary: var(--color-teal-300);
        --color-primary-hover: var(--color-teal-400);
        --color-secondary: rgba(var(--color-gray-400-rgb,119,124,124),0.15);
        --color-border: rgba(var(--color-gray-400-rgb,119,124,124),0.3);
    }
}
/* Global resets */
*{box-sizing:border-box;}
html{font-family:var(--font-family-base);font-size:var(--font-size-base);background:var(--color-background);color:var(--color-text);scroll-behavior:smooth;}
body{margin:0;padding:0;line-height:var(--line-height-normal);}
.container{max-width:1280px;margin:0 auto;padding:0 var(--space-16);}
/* Skip nav */
.skip-nav{position:absolute;top:-40px;left:var(--space-16);background:var(--color-primary);color:var(--color-white);padding:var(--space-6) var(--space-12);border-radius:var(--radius-base);transition:top .3s;}
.skip-nav:focus{top:var(--space-16);}
/* Header */
.header{position:fixed;top:0;width:100%;background:var(--color-surface);border-bottom:1px solid var(--color-border);z-index:1000;box-shadow:var(--shadow-sm);}
.navbar{display:flex;justify-content:space-between;align-items:center;padding:var(--space-12) 0;}
.nav-brand .brand-link{display:flex;align-items:center;color:var(--color-primary);text-decoration:none;font-weight:var(--font-weight-bold);} 
.brand-icon{margin-right:var(--space-6);font-size:var(--font-size-2xl);} 
.nav-menu{display:flex;gap:var(--space-16);} 
.nav-link{text-decoration:none;color:var(--color-text-secondary);transition:color var(--duration-fast);} 
.nav-link:hover{color:var(--color-primary);} 
.mobile-menu-toggle{display:none;flex-direction:column;gap:2px;border:none;background:none;cursor:pointer;} 
.hamburger-line{width:24px;height:2px;background:var(--color-text);}
/* Global controls */
.global-controls{display:flex;gap:var(--space-8);align-items:center;}
.control-btn{width:32px;height:32px;border:none;border-radius:50%;background:var(--color-secondary);color:var(--color-primary);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background var(--duration-fast);}
.control-btn:hover{background:var(--color-secondary-hover);}
/* Hero */
.hero-section{padding:40px 0  var(--space-20);margin-top:64px;background:linear-gradient(135deg,var(--color-primary),var(--color-primary-hover));color:var(--color-white);text-align:center;}
.hero-card{max-width:600px;margin:0 auto;background:rgba(255,255,255,0.1);padding:var(--space-20);border-radius:var(--radius-lg);backdrop-filter:blur(10px);}
.hero-title{font-size:var(--font-size-2xl);margin-bottom:var(--space-12);}
.hero-subtitle{font-size:var(--font-size-base);opacity:.9;}
/* Main */
.main-content{padding:var(--space-24) 0;}
.calculator-layout{display:grid;gap:var(--space-24);}
@media(min-width:1024px){.calculator-layout{grid-template-columns:1fr 1fr;}}
.compact-card{transform:scale(.9);transform-origin:top left;}
.half-size-card{transform:scale(.7);transform-origin:center;}
/* Panels */
.calculator-panel, .results-panel, .ai-insights, .chart-section, .amortization-section, .related-section{background:var(--color-surface);border:1px solid var(--color-card-border);border-radius:var(--radius-lg);box-shadow:var(--shadow-md);margin-bottom:var(--space-24);padding:var(--space-16);}
.panel-header h2{display:flex;align-items:center;gap:var(--space-6);font-size:var(--font-size-xl);color:var(--color-primary);margin:0;}
fieldset{border:none;margin:0;padding:0;}
legend{font-weight:var(--font-weight-semibold);font-size:var(--font-size-base);margin-bottom:var(--space-12);}
label{display:block;margin-bottom:var(--space-12);font-size:var(--font-size-sm);}
.input-group{display:flex;align-items:center;position:relative;}
.input-group span{position:absolute;left:var(--space-6);color:var(--color-text-secondary);}
.input-group input{width:100%;padding:var(--space-6) var(--space-12);padding-left:calc(var(--space-6)*2+8px);border:1px solid var(--color-border);border-radius:var(--radius-base);}
.dp-tabs{display:flex;margin-bottom:var(--space-10);background:var(--color-secondary);border:1px solid var(--color-border);border-radius:var(--radius-md);}
.dp-tabs button{flex:1;padding:var(--space-6);border:none;background:none;color:var(--color-text-secondary);cursor:pointer;}
.dp-tabs .active{background:var(--color-surface);color:var(--color-primary);}
.dp-panel{display:none;}
.dp-panel.active{display:block;}
.term-chips{display:flex;gap:var(--space-6);flex-wrap:wrap;}
.term-chips button{padding:var(--space-6) var(--space-12);border:1px solid var(--color-border);background:var(--color-secondary);border-radius:var(--radius-full);font-size:var(--font-size-xs);cursor:pointer;}
.term-chips .active{background:var(--color-primary);color:var(--color-white);border-color:var(--color-primary);}
input[type="month"]{width:150px;padding:var(--space-6);border:1px solid var(--color-border);border-radius:var(--radius-base);}
#btn-today{margin-left:var(--space-12);padding:var(--space-6) var(--space-10);background:var(--color-secondary);border:1px solid var(--color-border);border-radius:var(--radius-base);cursor:pointer;}
details{border:1px solid var(--color-border);border-radius:var(--radius-md);margin-top:var(--space-12);}
summary{padding:var(--space-12);background:var(--color-secondary);cursor:pointer;font-weight:var(--font-weight-medium);}
summary:hover{background:var(--color-secondary-hover);}
.amortization-section .controls{display:flex;gap:var(--space-6);margin-bottom:var(--space-12);}
#table-container{overflow-x:auto;transition:max-height var(--duration-normal);}
#table-container.collapsed{max-height:0;overflow:hidden;}
#table-container.expanded{max-height:500px;overflow-y:auto;}
.amortization-table{width:100%;border-collapse:collapse;font-size:var(--font-size-xs);}
.amortization-table th, .amortization-table td{padding:var(--space-6);border:1px solid var(--color-border);}
.amortization-table th{background:var(--color-secondary);position:sticky;top:0;}
/* AI Insights */
.ai-insights h3{display:flex;align-items:center;gap:var(--space-6);font-size:var(--font-size-base);}
.ai-insights #insights-list{display:grid;gap:var(--space-12);}
/* Charts */
.chart-grid{display:grid;grid-template-columns:1fr auto;gap:var(--space-16);}
@media(max-width:640px){.chart-grid{grid-template-columns:1fr;}}
#payment-chart{width:100%;height:200px;}
#chart-legend{display:flex;flex-direction:column;gap:var(--space-8);}
/* CTA */
.lead-cta-section{text-align:center;padding:var(--space-16);}
.lead-cta-section h3{font-size:var(--font-size-xl);}
.lead-cta-section button{padding:var(--space-12) var(--space-20);background:var(--color-primary);color:var(--color-white);border:none;border-radius:var(--radius-lg);cursor:pointer;}
/* Related */
.related-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:var(--space-16);}
.related-grid a{display:flex;align-items:center;gap:var(--space-6);padding:var(--space-12);background:var(--color-surface);border:1px solid var(--color-card-border);border-radius:var(--radius-md);text-decoration:none;color:inherit;}
/* Footer */
.footer{background:var(--color-charcoal-700);color:var(--color-gray-200);padding:var(--space-24) 0;}
.newsletter-section{background:var(--color-teal-500);color:var(--color-white);padding:var(--space-24);text-align:center;}
.newsletter-form{display:flex;justify-content:center;gap:0;max-width:400px;margin:0 auto;box-shadow:var(--shadow-lg);border-radius:var(--radius-lg);overflow:hidden;}
.newsletter-form input{flex:1;padding:var(--space-12);border:none;}
.newsletter-form button{padding:var(--space-12) var(--space-20);background:var(--color-orange-500);border:none;color:var(--color-white);cursor:pointer;}
.newsletter-form button:hover{background:var(--color-orange-400);}
.footer-content{display:grid;grid-template-columns:1fr;gap:var(--space-24);padding:var(--space-24);}
.footer-links{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:var(--space-24);}
.footer-links a{display:block;color:var(--color-gray-200);text-decoration:none;margin-bottom:var(--space-6);}
.footer-links h4{margin-bottom:var(--space-8);color:var(--color-teal-300);}
.footer-bottom{text-align:center;padding:var(--space-16);border-top:1px solid rgba(var(--color-gray-400-rgb,119,124,124),0.3);}
.skip-nav, .sr-only {position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}
@media(max-width:768px){
  .mobile-menu-toggle{display:flex;}
  .nav-menu{position:fixed;top:64px;left:0;width:100%;background:var(--color-surface);flex-direction:column;padding:var(--space-16);transform:translateY(-100%);transition:transform var(--duration-normal);}
  .nav-menu.active{transform:translateY(0);}
  .calculator-layout{grid-template-columns:1fr;}
}  
