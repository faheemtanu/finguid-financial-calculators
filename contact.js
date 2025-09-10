// ===== CONTACT FORM FUNCTIONALITY =====

document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize contact form
    initializeContactForm();
    initializeFAQ();
    
    function initializeContactForm() {
        const contactForm = document.getElementById('contact-form');
        const messageTextarea = document.getElementById('message');
        const charCount = document.getElementById('char-count');
        
        // Character counter for message field
        if (messageTextarea && charCount) {
            messageTextarea.addEventListener('input', function() {
                const currentLength = this.value.length;
                charCount.textContent = currentLength;
                
                // Change color based on character count
                if (currentLength > 450) {
                    charCount.parentElement.style.color = 'var(--color-warning)';
                } else if (currentLength > 500) {
                    charCount.parentElement.style.color = 'var(--color-error)';
                } else {
                    charCount.parentElement.style.color = 'var(--color-text-secondary)';
                }
            });
        }
        
        // Form submission
        if (contactForm) {
            contactForm.addEventListener('submit', handleContactFormSubmission);
        }
        
        // Phone number formatting
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', formatPhoneNumber);
        }
        
        // Form validation
        setupFormValidation();
    }
    
    function handleContactFormSubmission(event) {
        event.preventDefault();
        
        const form = event.target;
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        
        // Show loading state
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        submitButton.disabled = true;
        
        // Collect form data
        const formData = new FormData(form);
        const data = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            subject: formData.get('subject'),
            message: formData.get('message'),
            newsletter: formData.get('newsletter') === 'yes',
            timestamp: new Date().toISOString()
        };
        
        // Validate form data
        const validationErrors = validateContactForm(data);
        
        if (validationErrors.length > 0) {
            showFormErrors(validationErrors);
            resetSubmitButton(submitButton, originalButtonText);
            return;
        }
        
        // Simulate form submission (replace with actual API call)
        setTimeout(() => {
            // Success
            showSuccessMessage();
            form.reset();
            document.getElementById('char-count').textContent = '0';
            resetSubmitButton(submitButton, originalButtonText);
            
            // Track form submission
            trackContactFormSubmission(data.subject);
            
        }, 2000);
    }
    
    function validateContactForm(data) {
        const errors = [];
        
        // Required field validation
        if (!data.firstName || data.firstName.length < 2) {
            errors.push('First name must be at least 2 characters long');
        }
        
        if (!data.lastName || data.lastName.length < 2) {
            errors.push('Last name must be at least 2 characters long');
        }
        
        if (!data.email || !isValidEmail(data.email)) {
            errors.push('Please enter a valid email address');
        }
        
        if (!data.subject) {
            errors.push('Please select a subject');
        }
        
        if (!data.message || data.message.length < 10) {
            errors.push('Message must be at least 10 characters long');
        }
        
        if (data.message && data.message.length > 500) {
            errors.push('Message must be less than 500 characters');
        }
        
        // Phone number validation (optional but if provided, must be valid)
        if (data.phone && !isValidPhoneNumber(data.phone)) {
            errors.push('Please enter a valid phone number');
        }
        
        return errors;
    }
    
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    function isValidPhoneNumber(phone) {
        const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }
    
    function formatPhoneNumber(event) {
        const input = event.target;
        const value = input.value.replace(/\D/g, '');
        let formattedValue = '';
        
        if (value.length >= 6) {
            formattedValue = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
        } else if (value.length >= 3) {
            formattedValue = `(${value.slice(0, 3)}) ${value.slice(3)}`;
        } else {
            formattedValue = value;
        }
        
        input.value = formattedValue;
    }
    
    function setupFormValidation() {
        const requiredFields = document.querySelectorAll('input[required], select[required], textarea[required]');
        
        requiredFields.forEach(field => {
            field.addEventListener('blur', validateField);
            field.addEventListener('input', clearFieldError);
        });
    }
    
    function validateField(event) {
        const field = event.target;
        const value = field.value.trim();
        
        // Clear previous errors
        clearFieldError(event);
        
        if (!value) {
            addFieldError(field, 'This field is required');
            return false;
        }
        
        // Specific validation based on field type
        if (field.type === 'email' && !isValidEmail(value)) {
            addFieldError(field, 'Please enter a valid email address');
            return false;
        }
        
        if (field.type === 'tel' && value && !isValidPhoneNumber(value)) {
            addFieldError(field, 'Please enter a valid phone number');
            return false;
        }
        
        if (field.tagName === 'TEXTAREA' && value.length < 10) {
            addFieldError(field, 'Message must be at least 10 characters long');
            return false;
        }
        
        return true;
    }
    
    function addFieldError(field, message) {
        field.classList.add('error');
        
        const errorElement = document.createElement('div');
        errorElement.className = 'form-error';
        errorElement.textContent = message;
        
        field.parentNode.appendChild(errorElement);
    }
    
    function clearFieldError(event) {
        const field = event.target;
        field.classList.remove('error');
        
        const errorElement = field.parentNode.querySelector('.form-error');
        if (errorElement) {
            errorElement.remove();
        }
    }
    
    function showFormErrors(errors) {
        const errorContainer = createErrorContainer();
        errorContainer.innerHTML = `
            <div class="alert alert-error">
                <i class="fas fa-exclamation-triangle"></i>
                <div>
                    <h4>Please fix the following errors:</h4>
                    <ul>
                        ${errors.map(error => `<li>${error}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
        
        // Scroll to error container
        errorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Remove error container after 10 seconds
        setTimeout(() => {
            if (errorContainer.parentNode) {
                errorContainer.remove();
            }
        }, 10000);
    }
    
    function showSuccessMessage() {
        const successContainer = createErrorContainer();
        successContainer.innerHTML = `
            <div class="alert alert-success">
                <i class="fas fa-check-circle"></i>
                <div>
                    <h4>Message Sent Successfully!</h4>
                    <p>Thank you for contacting us. We'll get back to you within 24 hours.</p>
                </div>
            </div>
        `;
        
        // Scroll to success message
        successContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Remove success container after 8 seconds
        setTimeout(() => {
            if (successContainer.parentNode) {
                successContainer.remove();
            }
        }, 8000);
    }
    
    function createErrorContainer() {
        // Remove existing containers
        const existing = document.querySelector('.message-container');
        if (existing) {
            existing.remove();
        }
        
        const container = document.createElement('div');
        container.className = 'message-container';
        
        const contactSection = document.querySelector('.contact-section');
        contactSection.insertBefore(container, contactSection.firstChild);
        
        return container;
    }
    
    function resetSubmitButton(button, originalText) {
        button.innerHTML = originalText;
        button.disabled = false;
    }
    
    function trackContactFormSubmission(subject) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'contact_form_submission', {
                'event_category': 'engagement',
                'event_label': subject,
                'value': 1
            });
        }
    }
});

// ===== FAQ FUNCTIONALITY =====

function initializeFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        const icon = question.querySelector('i');
        
        question.addEventListener('click', () => {
            const isOpen = item.classList.contains('active');
            
            // Close all other FAQ items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                    const otherIcon = otherItem.querySelector('.faq-question i');
                    otherIcon.classList.remove('fa-minus');
                    otherIcon.classList.add('fa-plus');
                }
            });
            
            // Toggle current item
            if (isOpen) {
                item.classList.remove('active');
                icon.classList.remove('fa-minus');
                icon.classList.add('fa-plus');
            } else {
                item.classList.add('active');
                icon.classList.remove('fa-plus');
                icon.classList.add('fa-minus');
                
                // Track FAQ interaction
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'faq_interaction', {
                        'event_category': 'engagement',
                        'event_label': question.querySelector('h3').textContent
                    });
                }
            }
        });
    });
}

// ===== ACCESSIBILITY ENHANCEMENTS =====

document.addEventListener('DOMContentLoaded', function() {
    // Add keyboard navigation for FAQ items
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.setAttribute('tabindex', '0');
        question.setAttribute('role', 'button');
        question.setAttribute('aria-expanded', 'false');
        
        question.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                question.click();
                
                // Update aria-expanded
                const isExpanded = question.parentElement.classList.contains('active');
                question.setAttribute('aria-expanded', isExpanded);
            }
        });
    });
    
    // Add focus management for form
    const formInputs = document.querySelectorAll('#contact-form input, #contact-form select, #contact-form textarea');
    
    formInputs.forEach((input, index) => {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Tab' && !e.shiftKey && index === formInputs.length - 1) {
                // Focus management for last input
            }
        });
    });
});

// ===== UTILITY FUNCTIONS =====

function copyEmailToClipboard() {
    const email = 'contactus@finguid.com';
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(email).then(() => {
            showTooltip('Email copied to clipboard!');
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = email;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showTooltip('Email copied to clipboard!');
    }
}

function showTooltip(message) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip-popup';
    tooltip.textContent = message;
    tooltip.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--color-success);
        color: white;
        padding: 12px 16px;
        border-radius: 6px;
        font-size: 14px;
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(tooltip);
    
    setTimeout(() => {
        tooltip.remove();
    }, 3000);
}

// ===== PERFORMANCE OPTIMIZATION =====

// Lazy load contact form validation
let validationLoaded = false;

document.getElementById('contact-form')?.addEventListener('focus', function() {
    if (!validationLoaded) {
        // Load additional validation rules if needed
        validationLoaded = true;
    }
}, { once: true, capture: true });

// ===== ERROR HANDLING =====

window.addEventListener('error', function(e) {
    console.error('Contact page error:', e.error);
    
    // Track errors for debugging
    if (typeof gtag !== 'undefined') {
        gtag('event', 'exception', {
            'description': `Contact page: ${e.error.toString()}`,
            'fatal': false
        });
    }
});

// ===== CONTACT PAGE ANALYTICS =====

document.addEventListener('DOMContentLoaded', function() {
    // Track page load
    if (typeof gtag !== 'undefined') {
        gtag('event', 'page_view', {
            'event_category': 'contact',
            'event_label': 'contact_page_loaded'
        });
    }
    
    // Track email link clicks
    const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
    emailLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (typeof gtag !== 'undefined') {
                gtag('event', 'email_click', {
                    'event_category': 'contact',
                    'event_label': link.href.replace('mailto:', '')
                });
            }
        });
    });
    
    // Track phone link clicks
    const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
    phoneLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (typeof gtag !== 'undefined') {
                gtag('event', 'phone_click', {
                    'event_category': 'contact',
                    'event_label': link.href.replace('tel:', '')
                });
            }
        });
    });
});

console.log('✅ Contact page functionality loaded successfully!');