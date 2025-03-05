/**
 * LX Pest Solutions - Contact Form JavaScript
 * Version: 1.0.0
 * 
 * Handles contact form validation and submission
 * Features:
 * - Real-time validation with detailed error messages
 * - Client-side sanitization to prevent XSS attacks
 * - AJAX form submission with error handling
 * - Form state persistence
 * - Intelligent response time display
 * 
 * @author LX Pest Solutions Development Team
 */

/**
 * Contact Form module
 * Uses IIFE pattern for encapsulation and preventing global namespace pollution
 */
const ContactForm = (function() {
    'use strict';
    
    // Private variables
    let form = null;
    let formElements = {};
    let errorElements = {};
    let formSuccess = null;
    let submitButton = null;
    let responseTime = null;
    let isSubmitting = false;
    
    /**
     * RegExp patterns for validation
     * @type {Object}
     */
    const patterns = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      phone: /^(?:\+61|0)[2-478](?:[ -]?[0-9]){8}$/,
      minLength: (length) => new RegExp(`^.{${length},}$`)
    };
    
    /**
     * Initialize the contact form
     */
    function init() {
      // Get form element
      form = document.getElementById('contactForm');
      if (!form) return;
      
      // Cache form elements for better performance
      cacheElements();
      
      // Set up form submission handler
      form.addEventListener('submit', handleSubmit);
      
      // Set up input validation
      setupValidation();
      
      // Initialize response time indicator
      initResponseTimeIndicator();
      
      // Restore form state if available
      restoreFormState();
      
      // Set up periodic form state saving
      setInterval(saveFormState, 10000); // Save every 10 seconds
    }
    
    /**
     * Cache DOM elements for better performance
     */
    function cacheElements() {
      // Form elements
      formElements = {
        name: form.querySelector('#name'),
        email: form.querySelector('#email'),
        phone: form.querySelector('#phone'),
        service: form.querySelector('#service'),
        message: form.querySelector('#message'),
        consent: form.querySelector('#consent')
      };
      
      // Error message elements
      errorElements = {
        name: document.getElementById('nameError'),
        email: document.getElementById('emailError'),
        phone: document.getElementById('phoneError'),
        message: document.getElementById('messageError'),
        consent: document.getElementById('consentError')
      };
      
      // Other UI elements
      formSuccess = document.getElementById('formSuccess');
      submitButton = form.querySelector('button[type="submit"]');
      responseTime = document.querySelector('.response-time p strong');
    }
    
    /**
     * Set up form validation with real-time feedback
     */
    function setupValidation() {
      // Validation rules for each field
      const validationRules = {
        name: {
          required: true,
          minLength: 2,
          errorMessage: 'Please enter your name (minimum 2 characters)'
        },
        email: {
          required: true,
          pattern: patterns.email,
          errorMessage: 'Please enter a valid email address'
        },
        phone: {
          required: false,
          pattern: patterns.phone,
          errorMessage: 'Please enter a valid Australian phone number'
        },
        message: {
          required: true,
          minLength: 10,
          errorMessage: 'Please enter your message (minimum 10 characters)'
        },
        consent: {
          required: true,
          errorMessage: 'You must consent to our privacy policy'
        }
      };
      
      // Create a debounced validation function for each field
      Object.keys(formElements).forEach(fieldName => {
        if (!formElements[fieldName]) return;
        
        const element = formElements[fieldName];
        const rules = validationRules[fieldName];
        
        if (!rules) return;
        
        // Use different events for different input types
        const eventName = element.type === 'checkbox' ? 'change' : 'input';
        
        // Create debounced validator for each field
        const debouncedValidator = debounce(() => {
          validateField(fieldName, element.value, rules);
        }, 300);
        
        // Add event listeners for real-time validation
        element.addEventListener(eventName, debouncedValidator);
        
        // Also validate on blur for immediate feedback
        element.addEventListener('blur', () => {
          validateField(fieldName, element.value, rules);
        });
      });
    }
    
    /**
     * Validate a single form field
     * 
     * @param {string} fieldName - The name of the field to validate
     * @param {string|boolean} value - The field value
     * @param {Object} rules - Validation rules for the field
     * @returns {boolean} - Whether the field is valid
     */
    function validateField(fieldName, value, rules) {
      // Skip validation during submission to prevent conflicting error messages
      if (isSubmitting) return true;
      
      const element = formElements[fieldName];
      const errorElement = errorElements[fieldName];
      
      // Skip if element doesn't exist
      if (!element || !errorElement) return true;
      
      // Handle checkbox value
      if (element.type === 'checkbox') {
        value = element.checked;
      }
      
      let isValid = true;
      let errorMessage = '';
      
      // Check required fields
      if (rules.required && (value === '' || value === false)) {
        isValid = false;
        errorMessage = rules.errorMessage;
      }
      
      // Check minimum length
      else if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
        isValid = false;
        errorMessage = rules.errorMessage;
      }
      
      // Check pattern
      else if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        isValid = false;
        errorMessage = rules.errorMessage;
      }
      
      // Update UI based on validation result
      if (isValid) {
        element.classList.remove('error');
        errorElement.classList.remove('show');
      } else {
        element.classList.add('error');
        errorElement.textContent = errorMessage;
        errorElement.classList.add('show');
      }
      
      return isValid;
    }
    
    /**
     * Validate the entire form
     * 
     * @returns {boolean} - Whether the form is valid
     */
    function validateForm() {
      let isValid = true;
      
      // Validation rules (simplified version for re-validation)
      const rules = {
        name: { required: true, minLength: 2 },
        email: { required: true, pattern: patterns.email },
        phone: { required: false, pattern: patterns.phone },
        message: { required: true, minLength: 10 },
        consent: { required: true }
      };
      
      // Validate each field
      Object.keys(formElements).forEach(fieldName => {
        if (!formElements[fieldName]) return;
        
        const element = formElements[fieldName];
        const value = element.type === 'checkbox' ? element.checked : element.value;
        
        // Skip fields without rules
        if (!rules[fieldName]) return;
        
        const fieldValid = validateField(fieldName, value, rules[fieldName]);
        isValid = isValid && fieldValid;
      });
      
      return isValid;
    }
    
    /**
     * Initialize the response time indicator
     * Displays estimated response time based on time of day and day of week
     */
    function initResponseTimeIndicator() {
      if (!responseTime) return;
      
      // Calculate expected response time based on current time
      updateResponseTime();
      
      // Update hourly
      setInterval(updateResponseTime, 3600000);
    }
    
    /**
     * Update the response time based on current time and day
     */
    function updateResponseTime() {
      const now = new Date();
      const hour = now.getHours();
      const day = now.getDay(); // 0 = Sunday, 6 = Saturday
      
      let responseText = '1-2 hours';
      
      // Outside business hours (9 AM - 5 PM)
      if (hour < 9 || hour >= 17) {
        responseText = 'next business day';
      }
      
      // Weekend
      if (day === 0 || day === 6) {
        responseText = 'Monday';
      }
      
      // Near end of business day
      if ((day >= 1 && day <= 5) && hour >= 16) {
        responseText = 'tomorrow morning';
      }
      
      // Update the element text
      if (responseTime) {
        responseTime.textContent = responseText;
      }
    }
    
    /**
     * Handle form submission
     * 
     * @param {Event} e - The submit event
     */
    function handleSubmit(e) {
      e.preventDefault();
      
      // Prevent double submission
      if (isSubmitting) return;
      
      // Mark form as submitting to prevent validation conflicts
      isSubmitting = true;
      
      // Validate form
      if (!validateForm()) {
        // Focus the first invalid field
        focusFirstInvalidField();
        isSubmitting = false;
        return;
      }
      
      // Show loading state
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner"></span> Sending...';
      }
      
      // Get form data
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      
      // Remove any existing error messages
      removeFormErrors();
      
      // Submit the form via AJAX
      submitForm(data)
        .then(result => {
          handleSubmitSuccess(result);
        })
        .catch(error => {
          handleSubmitError(error);
        })
        .finally(() => {
          // Reset submission state
          isSubmitting = false;
          
          // Reset button state
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Submit';
          }
        });
    }
    
    /**
     * Focus the first invalid field in the form
     */
    function focusFirstInvalidField() {
      const firstInvalidField = form.querySelector('.error');
      if (firstInvalidField) {
        firstInvalidField.focus();
        
        // Scroll to the field for better UX
        firstInvalidField.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }
    
    /**
     * Remove any existing form-level error messages
     */
    function removeFormErrors() {
      const formError = form.querySelector('.form-error');
      if (formError) {
        formError.remove();
      }
    }
    
    /**
     * Submit the form data to the server
     * 
     * @param {Object} data - The form data
     * @returns {Promise} - Promise resolving with the server response
     */
    function submitForm(data) {
      // In production, this would be your API endpoint
      const endpoint = form.getAttribute('action') || '/api/contact';
      
      // Sanitize data to prevent XSS attacks
      Object.keys(data).forEach(key => {
        if (typeof data[key] === 'string') {
          data[key] = sanitizeInput(data[key]);
        }
      });
      
      // For demo purposes, we'll simulate a server response
      // In production, use the following fetch code instead
      
      /* 
      return fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(data),
        credentials: 'same-origin'
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(errorData => {
            throw errorData;
          });
        }
        return response.json();
      });
      */
      
      // Simulated server response for demo
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          // 90% success rate for demonstration
          if (Math.random() < 0.9) {
            resolve({
              success: true,
              message: 'Your message has been sent successfully. We\'ll get back to you as soon as possible.',
              data: {
                id: generateRequestId(),
                timestamp: new Date().toISOString()
              }
            });
          } else {
            // Simulate server error
            reject({
              success: false,
              message: 'There was a problem sending your message.',
              errors: [
                {
                  param: 'email',
                  msg: 'This email address appears to be invalid.'
                }
              ]
            });
          }
        }, 1500); // Simulate network delay
      });
    }
    
    /**
     * Handle successful form submission
     * 
     * @param {Object} result - The server response
     */
    function handleSubmitSuccess(result) {
      // Show success message
      if (formSuccess) {
        formSuccess.classList.add('show');
        formSuccess.setAttribute('aria-hidden', 'false');
        
        // Focus the success message for screen readers
        formSuccess.setAttribute('tabindex', '-1');
        formSuccess.focus();
        
        // Scroll to success message
        formSuccess.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
      
      // Reset the form
      form.reset();
      
      // Clear form state from storage
      clearFormState();
      
      // Hide success message after some time
      setTimeout(() => {
        if (formSuccess) {
          formSuccess.classList.remove('show');
          formSuccess.setAttribute('aria-hidden', 'true');
        }
      }, 8000);
      
      // Track conversion (in production, this would use your analytics platform)
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'form_submission', {
          'event_category': 'Contact',
          'event_label': 'Contact Form'
        });
      }
    }
    
    /**
     * Handle form submission error
     * 
     * @param {Object} error - The error response
     */
    function handleSubmitError(error) {
      console.error('Form submission error:', error);
      
      // Handle backend validation errors
      if (error.errors && Array.isArray(error.errors)) {
        error.errors.forEach(err => {
          const field = formElements[err.param];
          const errorElement = errorElements[err.param];
          
          if (field && errorElement) {
            field.classList.add('error');
            errorElement.textContent = err.msg;
            errorElement.classList.add('show');
          }
        });
        
        // Focus the first field with an error
        const firstErrorField = Object.keys(formElements)
          .find(key => error.errors.some(err => err.param === key));
        
        if (firstErrorField && formElements[firstErrorField]) {
          formElements[firstErrorField].focus();
        }
      } else {
        // Show general error message
        const errorMessage = error.message || 'There was a problem sending your message. Please try again later.';
        const errorContainer = document.createElement('div');
        errorContainer.className = 'form-error';
        errorContainer.textContent = errorMessage;
        
        // Insert before the submit button
        if (submitButton && submitButton.parentNode) {
          submitButton.parentNode.insertBefore(errorContainer, submitButton);
        } else {
          form.appendChild(errorContainer);
        }
        
        // Remove error after 5 seconds
        setTimeout(() => {
          if (errorContainer.parentNode) {
            errorContainer.parentNode.removeChild(errorContainer);
          }
        }, 5000);
      }
    }
    
    /**
     * Save form state to sessionStorage
     * This allows recovery of user input if they navigate away
     */
    function saveFormState() {
      if (!form || !('sessionStorage' in window)) return;
      
      try {
        const formState = {};
        
        // Save text inputs, textareas, and selects
        form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea, select').forEach(element => {
          if (element.name) {
            formState[element.name] = element.value;
          }
        });
        
        // Save checkboxes
        form.querySelectorAll('input[type="checkbox"]').forEach(element => {
          if (element.name) {
            formState[element.name] = element.checked;
          }
        });
        
        // Only save if there's actual data
        if (Object.keys(formState).length > 0 && Object.values(formState).some(v => v)) {
          sessionStorage.setItem('lx_contact_form_state', JSON.stringify(formState));
        }
      } catch (error) {
        console.error('Error saving form state:', error);
      }
    }
    
    /**
     * Restore form state from sessionStorage
     */
    function restoreFormState() {
      if (!form || !('sessionStorage' in window)) return;
      
      try {
        const formState = sessionStorage.getItem('lx_contact_form_state');
        if (!formState) return;
        
        const state = JSON.parse(formState);
        
        // Restore values to form fields
        Object.entries(state).forEach(([name, value]) => {
          const element = form.elements[name];
          if (!element) return;
          
          if (element.type === 'checkbox') {
            element.checked = value;
          } else {
            element.value = value;
          }
        });
      } catch (error) {
        console.error('Error restoring form state:', error);
      }
    }
    
    /**
     * Clear form state from sessionStorage
     */
    function clearFormState() {
      if (!('sessionStorage' in window)) return;
      
      try {
        sessionStorage.removeItem('lx_contact_form_state');
      } catch (error) {
        console.error('Error clearing form state:', error);
      }
    }
    
    /**
     * Generate a unique request ID
     * Used for tracking form submissions
     * 
     * @returns {string} - A unique request ID
     */
    function generateRequestId() {
      return 'req_' + Math.random().toString(36).substring(2, 15) + 
             Math.random().toString(36).substring(2, 15);
    }
    
    /**
     * Sanitize user input to prevent XSS attacks
     * 
     * @param {string} input - The input to sanitize
     * @returns {string} - The sanitized input
     */
    function sanitizeInput(input) {
      const element = document.createElement('div');
      element.textContent = input;
      return element.innerHTML;
    }
    
    /**
     * Debounce function to limit how often a function can run
     * Useful for input events that fire rapidly
     * 
     * @param {Function} func - The function to debounce
     * @param {number} wait - The debounce wait time in milliseconds
     * @returns {Function} - The debounced function
     */
    function debounce(func, wait = 300) {
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
    
    // Public API
    return {
      init
    };
  })();
  
  // Initialize the contact form when the DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    ContactForm.init();
  });