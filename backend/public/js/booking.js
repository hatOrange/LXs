/**
 * LX Pest Solutions - Booking Page JavaScript
 * Version: 1.0.0
 * 
 * Specialized functionality for the booking page including:
 * - Multi-step form management
 * - Service selection
 * - Date and time selection
 * - Form validation
 * - Pricing calculation
 * - Real-time availability indicator
 * - Countdown timer for urgency
 * - Live activity notifications
 * 
 * @author LX Pest Solutions Development Team
 */

/**
 * Booking functionality module
 * Uses the Revealing Module Pattern for encapsulation
 */
const BookingModule = (function() {
    'use strict';
    
    // Private variables
    let els = {}; // Element references
    let currentStep = 1;
    let pricing = {
      base: {
        residential: 299,
        commercial: 499,
        termite: 399,
        rodent: 269,
        insect: 249,
        'eco-friendly': 349
      },
      sizeMultiplier: {
        small: 0.8,
        medium: 1.0,
        large: 1.2,
        commercial: 1.5
      },
      urgencyMultiplier: {
        standard: 1.0,
        urgent: 1.3,
        emergency: 1.5
      },
      discount: {
        firstTime: 0.2, // 20% discount
        seasonal: 0.1, // 10% discount
        multiService: 0.15 // 15% discount
      }
    };
    
    // Activity data for social proof notifications
    const activityData = [
      { name: 'John', location: 'Prospect', service: 'pest inspection' },
      { name: 'Sarah', location: 'Norwood', service: 'termite treatment' },
      { name: 'Michael', location: 'Glenelg', service: 'rodent control' },
      { name: 'Emma', location: 'Semaphore', service: 'cockroach treatment' },
      { name: 'David', location: 'North Adelaide', service: 'ant control' },
      { name: 'Jessica', location: 'Burnside', service: 'spider removal' },
      { name: 'Robert', location: 'Henley Beach', service: 'commercial pest control' },
      { name: 'Lisa', location: 'Mitcham', service: 'pest inspection' }
    ];
    
    /**
     * Initialize the booking form functionality
     */
    function init() {
      // Cache DOM elements for better performance
      cacheElements();
      
      // Exit if not on booking page
      if (!els.bookingForm) return;
      
      // Initialize individual components
      initStepNavigation();
      initServiceSelection();
      initDateSelection();
      initTimeSelection();
      initFormValidation();
      initCountdownTimer();
      initAvailabilityCounter();
      initActivityNotifications();
      
      // Prefill form from URL parameters if present
      prefillFromUrlParams();
      
      // Set up form submission handler
      els.bookingForm.addEventListener('submit', handleFormSubmit);
      
      // Handle browser back/forward navigation
      window.addEventListener('popstate', handleBrowserNavigation);
      
      // Return to form data if returning to page
      restoreFormState();
    }
    
    /**
     * Cache DOM elements for performance optimization
     */
    function cacheElements() {
      els = {
        // Form element
        bookingForm: document.getElementById('bookingForm'),
        
        // Step elements
        steps: document.querySelectorAll('.step'),
        formSteps: document.querySelectorAll('.form-step'),
        
        // Navigation buttons
        toStep2: document.getElementById('toStep2'),
        toStep3: document.getElementById('toStep3'),
        toStep4: document.getElementById('toStep4'),
        backToStep1: document.getElementById('backToStep1'),
        backToStep2: document.getElementById('backToStep2'),
        backToStep3: document.getElementById('backToStep3'),
        submitButton: document.getElementById('submitBooking'),
        
        // Form fields
        serviceOptions: document.querySelectorAll('.service-option'),
        serviceInput: document.getElementById('serviceType'),
        propertySize: document.getElementById('propertySize'),
        dateGrid: document.getElementById('dateGrid'),
        timeSlots: document.querySelectorAll('.time-slot'),
        selectedDate: document.getElementById('selectedDate'),
        selectedTime: document.getElementById('selectedTime'),
        nameInput: document.getElementById('name'),
        phoneInput: document.getElementById('phone'),
        emailInput: document.getElementById('email'),
        streetInput: document.getElementById('street'),
        cityInput: document.getElementById('city'),
        postalCodeInput: document.getElementById('postalCode'),
        notesInput: document.getElementById('notes'),
        termsCheckbox: document.getElementById('terms'),
        
        // Summary elements
        summaryService: document.getElementById('summaryService'),
        summaryPropertySize: document.getElementById('summaryPropertySize'),
        summaryDate: document.getElementById('summaryDate'),
        summaryTime: document.getElementById('summaryTime'),
        summaryName: document.getElementById('summaryName'),
        summaryPhone: document.getElementById('summaryPhone'),
        summaryEmail: document.getElementById('summaryEmail'),
        summaryAddress: document.getElementById('summaryAddress'),
        summaryPrice: document.getElementById('summaryPrice'),
        discountTag: document.getElementById('discountTag'),
        
        // UI elements for psychological triggers
        countdown: document.getElementById('countdown'),
        availableSlots: document.getElementById('availableSlots'),
        liveActivity: document.getElementById('liveActivity'),
        closeActivity: document.querySelector('.close-activity')
      };
    }
    
    /**
     * Initialize step navigation functionality
     */
    function initStepNavigation() {
      if (!els.toStep2 || !els.toStep3 || !els.toStep4) return;
      
      // Forward navigation
      els.toStep2.addEventListener('click', () => goToStep(2));
      els.toStep3.addEventListener('click', () => goToStep(3));
      els.toStep4.addEventListener('click', () => goToStep(4));
      
      // Backward navigation
      if (els.backToStep1) els.backToStep1.addEventListener('click', () => goToStep(1));
      if (els.backToStep2) els.backToStep2.addEventListener('click', () => goToStep(2));
      if (els.backToStep3) els.backToStep3.addEventListener('click', () => goToStep(3));
      
      // Update UI for initial step
      updateStepIndicators(1);
    }
    
    /**
     * Navigate to a specific step in the booking form
     * 
     * @param {number} step - The step number to navigate to (1-4)
     * @returns {boolean} - Whether the navigation was successful
     */
    function goToStep(step) {
      // Validate current step before proceeding
      if (step > currentStep && !validateStep(currentStep)) {
        return false;
      }
      
      // Update UI
      updateStepIndicators(step);
      showFormStep(step);
      
      // Update browser history for back button support
      updateBrowserHistory(step);
      
      // Update price calculation if going to step 4
      if (step === 4) {
        updateBookingSummary();
      }
      
      // Scroll to top of form
      scrollToFormTop();
      
      // Update current step
      currentStep = step;
      
      // Save form state
      saveFormState();
      
      return true;
    }
    
    /**
     * Update step indicators in the UI
     * 
     * @param {number} activeStep - The active step number
     */
    function updateStepIndicators(activeStep) {
      els.steps.forEach(step => {
        const stepNum = parseInt(step.dataset.step, 10);
        
        if (stepNum < activeStep) {
          // Previous steps
          step.classList.add('completed');
          step.classList.remove('active');
        } else if (stepNum === activeStep) {
          // Current step
          step.classList.add('active');
          step.classList.remove('completed');
        } else {
          // Future steps
          step.classList.remove('active', 'completed');
        }
      });
    }
    
    /**
     * Show a specific form step and hide others
     * 
     * @param {number} step - The step number to show
     */
    function showFormStep(step) {
      els.formSteps.forEach(formStep => {
        formStep.classList.remove('active');
        
        // Use ARIA for accessibility
        formStep.setAttribute('aria-hidden', 'true');
        formStep.setAttribute('tabindex', '-1');
      });
      
      const activeFormStep = document.getElementById(`step${step}`);
      if (activeFormStep) {
        activeFormStep.classList.add('active');
        activeFormStep.setAttribute('aria-hidden', 'false');
        activeFormStep.setAttribute('tabindex', '0');
        
        // Focus the first focusable element for keyboard users
        const firstFocusable = activeFormStep.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) {
          setTimeout(() => firstFocusable.focus(), 100);
        }
      }
    }
    
    /**
     * Update browser history for back button support
     * 
     * @param {number} step - The step number for the history state
     */
    function updateBrowserHistory(step) {
      const url = new URL(window.location);
      url.searchParams.set('step', step);
      
      window.history.pushState({ step }, '', url);
    }
    
    /**
     * Handle browser navigation (back/forward buttons)
     * 
     * @param {PopStateEvent} event - The popstate event
     */
    function handleBrowserNavigation(event) {
      if (event.state && event.state.step) {
        goToStep(event.state.step);
      } else {
        // Default to step 1 if no state
        goToStep(1);
      }
    }
    
    /**
     * Scroll to the top of the booking form
     */
    function scrollToFormTop() {
      if (!els.bookingForm) return;
      
      els.bookingForm.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start'
      });
    }
    
    /**
     * Initialize service selection functionality
     */
    function initServiceSelection() {
      if (!els.serviceOptions.length || !els.serviceInput) return;
      
      // Use event delegation for better performance
      document.addEventListener('click', (e) => {
        const serviceOption = e.target.closest('.service-option');
        if (!serviceOption) return;
        
        // Remove selection from all options
        els.serviceOptions.forEach(option => {
          option.classList.remove('selected');
          option.setAttribute('aria-selected', 'false');
        });
        
        // Add selection to clicked option
        serviceOption.classList.add('selected');
        serviceOption.setAttribute('aria-selected', 'true');
        
        // Update hidden input value
        els.serviceInput.value = serviceOption.dataset.value;
        
        // Hide error message if visible
        const errorElement = document.getElementById('serviceError');
        if (errorElement) errorElement.classList.remove('show');
        
        // Auto-select property size for commercial services
        if (serviceOption.dataset.value === 'commercial' && els.propertySize) {
          els.propertySize.value = 'commercial';
        }
        
        // Update price estimate
        updatePriceEstimate();
      });
    }
    
    /**
     * Initialize date selection grid
     */
    function initDateSelection() {
      if (!els.dateGrid) return;
      
      // Generate date options
      generateDateGrid();
      
      // Handle date selection via event delegation
      els.dateGrid.addEventListener('click', (e) => {
        const dateOption = e.target.closest('.date-option:not(.unavailable)');
        if (!dateOption) return;
        
        // Remove selection from all date options
        const dateOptions = els.dateGrid.querySelectorAll('.date-option');
        dateOptions.forEach(option => {
          option.classList.remove('selected');
          option.setAttribute('aria-selected', 'false');
        });
        
        // Add selection to clicked option
        dateOption.classList.add('selected');
        dateOption.setAttribute('aria-selected', 'true');
        
        // Update hidden input value
        if (els.selectedDate) {
          els.selectedDate.value = dateOption.dataset.date;
          
          // Hide error message if visible
          const errorElement = document.getElementById('dateError');
          if (errorElement) errorElement.classList.remove('show');
        }
      });
    }
    
    /**
     * Generate date grid with available/unavailable dates
     * Creates a grid of date options for the next 14 days
     */
    function generateDateGrid() {
      if (!els.dateGrid) return;
      
      const today = new Date();
      let html = '';
      
      // Generate dates for today and next 13 days
      for (let i = 0; i < 14; i++) {
        const date = new Date();
        date.setDate(today.getDate() + i);
        
        // Skip Sundays (day 0)
        if (date.getDay() === 0) continue;
        
        // Format date for display
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dayNumber = date.getDate();
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        const formattedDate = date.toISOString().split('T')[0];
        
        // Pseudorandomly mark some dates as unavailable
        // Use deterministic approach so it's consistent for users
        // In production, this would use actual availability data
        const daySum = date.getDate() + date.getMonth();
        const isUnavailable = (daySum % 7 === 3) || (daySum % 11 === 5);
        const unavailableClass = isUnavailable ? ' unavailable' : '';
        
        html += `
          <div class="date-option${unavailableClass}" data-date="${formattedDate}" 
              ${isUnavailable ? 'aria-disabled="true"' : 'aria-selected="false"'}>
            <div class="day-name">${dayName}</div>
            <div class="day-number">${dayNumber}</div>
            <div class="month-name">${monthName}</div>
          </div>
        `;
      }
      
      els.dateGrid.innerHTML = html;
      
      // Set minimum date for direct input
      const dateInput = document.getElementById('preferredDate');
      if (dateInput) {
        dateInput.min = today.toISOString().split('T')[0];
      }
    }
    
    /**
     * Initialize time slot selection
     */
    function initTimeSelection() {
      if (!els.timeSlots.length || !els.selectedTime) return;
      
      // Handle time slot selection
      els.timeSlots.forEach(slot => {
        if (slot.classList.contains('unavailable')) return;
        
        slot.addEventListener('click', () => {
          // Remove selection from all time slots
          els.timeSlots.forEach(s => {
            s.classList.remove('selected');
            s.setAttribute('aria-selected', 'false');
          });
          
          // Add selection to clicked slot
          slot.classList.add('selected');
          slot.setAttribute('aria-selected', 'true');
          
          // Update hidden input value
          els.selectedTime.value = slot.dataset.value;
          
          // Hide error message if visible
          const errorElement = document.getElementById('timeError');
          if (errorElement) errorElement.classList.remove('show');
        });
      });
    }
    
    /**
     * Initialize form validation
     */
    function initFormValidation() {
      // Add input event listeners for real-time validation
      const formFields = {
        name: els.nameInput,
        email: els.emailInput,
        phone: els.phoneInput,
        street: els.streetInput,
        city: els.cityInput,
        postalCode: els.postalCodeInput
      };
      
      // Use a debounce function to limit validation frequency
      const debouncedValidate = debounce((field, value) => {
        validateField(field, value);
      }, 300);
      
      // Add input listeners to each field
      Object.entries(formFields).forEach(([field, element]) => {
        if (!element) return;
        
        element.addEventListener('input', (e) => {
          debouncedValidate(field, e.target.value);
        });
        
        // Also validate on blur for immediate feedback when user leaves field
        element.addEventListener('blur', (e) => {
          validateField(field, e.target.value);
        });
      });
      
      // Terms checkbox validation
      if (els.termsCheckbox) {
        els.termsCheckbox.addEventListener('change', () => {
          validateField('terms', els.termsCheckbox.checked);
        });
      }
    }
    
    /**
     * Validate a single form field
     * 
     * @param {string} field - The field name
     * @param {string|boolean} value - The field value
     * @returns {boolean} - Whether the field is valid
     */
    function validateField(field, value) {
      let isValid = true;
      let errorMessage = '';
      
      // Get error element
      const errorElement = document.getElementById(`${field}Error`);
      if (!errorElement) return true;
      
      // Get field element
      const fieldElement = document.getElementById(field);
      if (!fieldElement) return true;
      
      // Validate based on field type
      switch (field) {
        case 'name':
          if (!value || value.trim().length < 2) {
            isValid = false;
            errorMessage = 'Please enter your full name (at least 2 characters)';
          }
          break;
          
        case 'email':
          if (!value || !isValidEmail(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
          }
          break;
          
        case 'phone':
          if (!value || !isValidPhone(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid Australian phone number';
          }
          break;
          
        case 'street':
          if (!value || value.trim().length < 5) {
            isValid = false;
            errorMessage = 'Please enter your street address';
          }
          break;
          
        case 'city':
          if (!value || value.trim().length < 2) {
            isValid = false;
            errorMessage = 'Please enter your city or suburb';
          }
          break;
          
        case 'postalCode':
          if (!value || !isValidPostalCode(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid 4-digit Australian postal code';
          }
          break;
          
        case 'terms':
          if (value !== true) {
            isValid = false;
            errorMessage = 'You must agree to the terms and conditions';
          }
          break;
      }
      
      // Update UI based on validation result
      if (isValid) {
        fieldElement.classList.remove('error');
        errorElement.classList.remove('show');
      } else {
        fieldElement.classList.add('error');
        errorElement.textContent = errorMessage;
        errorElement.classList.add('show');
      }
      
      return isValid;
    }
    
    /**
     * Validate an entire step before proceeding
     * 
     * @param {number} step - The step number to validate
     * @returns {boolean} - Whether the step is valid
     */
    function validateStep(step) {
      let isValid = true;
      
      switch (step) {
        case 1:
          // Service selection validation
          if (!els.serviceInput || !els.serviceInput.value) {
            isValid = false;
            const errorElement = document.getElementById('serviceError');
            if (errorElement) errorElement.classList.add('show');
          }
          break;
          
        case 2:
          // Date and time selection validation
          if (!els.selectedDate || !els.selectedDate.value) {
            isValid = false;
            const dateErrorElement = document.getElementById('dateError');
            if (dateErrorElement) dateErrorElement.classList.add('show');
          }
          
          if (!els.selectedTime || !els.selectedTime.value) {
            isValid = false;
            const timeErrorElement = document.getElementById('timeError');
            if (timeErrorElement) timeErrorElement.classList.add('show');
          }
          break;
          
        case 3:
          // Personal details validation
          const requiredFields = ['name', 'email', 'phone', 'street', 'city', 'postalCode'];
          
          requiredFields.forEach(field => {
            const fieldElement = document.getElementById(field);
            if (!fieldElement) return;
            
            const isFieldValid = validateField(field, fieldElement.value);
            isValid = isValid && isFieldValid;
          });
          break;
          
        case 4:
          // Terms agreement validation
          if (els.termsCheckbox && !els.termsCheckbox.checked) {
            isValid = false;
            const errorElement = document.getElementById('termsError');
            if (errorElement) errorElement.classList.add('show');
          }
          break;
      }
      
      return isValid;
    }
    
    /**
     * Initialize countdown timer for urgency
     */
    function initCountdownTimer() {
      if (!els.countdown) return;
      
      let hours = 23;
      let minutes = 59;
      let seconds = 59;
      
      // Try to restore countdown from localStorage
      const savedCountdown = getFromStorage('lx_countdown');
      if (savedCountdown) {
        const now = new Date().getTime();
        const endTime = savedCountdown.endTime;
        
        // If saved timer hasn't expired
        if (endTime > now) {
          const remaining = Math.floor((endTime - now) / 1000);
          hours = Math.floor(remaining / 3600);
          minutes = Math.floor((remaining % 3600) / 60);
          seconds = remaining % 60;
        } else {
          // Set new 24-hour countdown
          setToStorage('lx_countdown', {
            endTime: new Date().getTime() + 24 * 60 * 60 * 1000
          });
        }
      } else {
        // First-time visitor, set 24-hour countdown
        setToStorage('lx_countdown', {
          endTime: new Date().getTime() + 24 * 60 * 60 * 1000
        });
      }
      
      // Update the display immediately
      updateCountdownDisplay();
      
      // Use requestAnimationFrame for smoother rendering
      let lastUpdateTime = 0;
      
      function updateCountdown(timestamp) {
        if (!lastUpdateTime) lastUpdateTime = timestamp;
        
        const elapsed = timestamp - lastUpdateTime;
        
        // Update once per second
        if (elapsed >= 1000) {
          seconds--;
          
          if (seconds < 0) {
            seconds = 59;
            minutes--;
          }
          
          if (minutes < 0) {
            minutes = 59;
            hours--;
          }
          
          if (hours < 0) {
            // Reset to 23:59:59 when it reaches zero
            hours = 23;
            minutes = 59;
            seconds = 59;
            
            // Update localStorage
            setToStorage('lx_countdown', {
              endTime: new Date().getTime() + 24 * 60 * 60 * 1000
            });
          }
          
          updateCountdownDisplay();
          lastUpdateTime = timestamp;
        }
        
        // Continue animation loop
        requestAnimationFrame(updateCountdown);
      }
      
      // Helper function to update countdown display
      function updateCountdownDisplay() {
        els.countdown.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        // Add ARIA live region for accessibility
        els.countdown.setAttribute('aria-label', `Special offer ends in ${hours} hours, ${minutes} minutes, and ${seconds} seconds`);
      }
      
      // Start the animation loop
      requestAnimationFrame(updateCountdown);
    }
    
    /**
     * Initialize the availability counter for scarcity effect
     */
    function initAvailabilityCounter() {
      if (!els.availableSlots) return;
      
      let slots = parseInt(els.availableSlots.textContent, 10);
      if (isNaN(slots)) slots = 7; // Default to 7 if parsing fails
      
      // Try to restore from localStorage
      const savedSlots = getFromStorage('lx_available_slots');
      if (savedSlots !== null && savedSlots.expiryTime > new Date().getTime()) {
        slots = savedSlots.slots;
        updateSlotsDisplay();
      } else {
        // Reset slots after 24 hours
        resetSlots();
      }
      
      // Decrease slots randomly over time
      function scheduleSlotDecrease() {
        // Random interval between 3-6 minutes
        const interval = Math.floor(Math.random() * (360000 - 180000) + 180000);
        
        setTimeout(() => {
          decreaseSlot();
        }, interval);
      }
      
      function decreaseSlot() {
        if (slots > 1) {
          slots--;
          
          // Visual feedback for change
          updateSlotsDisplay(true);
          
          // Update localStorage
          setToStorage('lx_available_slots', {
            slots: slots,
            expiryTime: new Date().getTime() + 24 * 60 * 60 * 1000
          });
          
          // Schedule next decrease
          scheduleSlotDecrease();
        }
      }
      
      function updateSlotsDisplay(animate = false) {
        els.availableSlots.textContent = slots;
        
        if (animate) {
          // Visual feedback for change
          const parent = els.availableSlots.parentElement;
          if (parent) {
            parent.style.backgroundColor = '#ffecb3';
            setTimeout(() => {
              parent.style.backgroundColor = '#f1f8e9';
            }, 1000);
          }
        }
        
        // Show different urgency levels based on availability
        const urgencyMessage = document.querySelector('.urgency-message');
        if (urgencyMessage) {
          if (slots <= 2) {
            urgencyMessage.textContent = '* Critical: Almost all slots filled! Book now to secure your appointment';
            urgencyMessage.style.color = '#e53935';
          } else if (slots <= 4) {
            urgencyMessage.textContent = '* Limited slots remaining! Don\'t miss out on your preferred time';
          }
        }
      }
      
      function resetSlots() {
        // Reset to a value between 5-8
        slots = Math.floor(Math.random() * 4) + 5;
        
        setToStorage('lx_available_slots', {
          slots: slots,
          expiryTime: new Date().getTime() + 24 * 60 * 60 * 1000
        });
        
        updateSlotsDisplay();
      }
      
      // Initial slot decrease after delay
      scheduleSlotDecrease();
    }
    
    /**
     * Initialize activity notifications
     * Shows random booking notifications for social proof
     */
    function initActivityNotifications() {
      if (!els.liveActivity) return;
      
      // Add close button event listener
      if (els.closeActivity) {
        els.closeActivity.addEventListener('click', hideActivity);
      }
      
      // Show first notification after delay
      setTimeout(showRandomActivity, 15000 + Math.random() * 10000);
      
      /**
       * Show a random activity notification
       */
      function showRandomActivity() {
        if (!els.liveActivity) return;
        
        // Get random activity
        const activity = activityData[Math.floor(Math.random() * activityData.length)];
        
        // Update content
        const textEl = els.liveActivity.querySelector('.activity-text');
        if (textEl) {
          const nameEl = textEl.querySelector('.activity-name');
          if (nameEl) nameEl.textContent = activity.name;
          
          textEl.innerHTML = textEl.innerHTML.replace(
            /just booked.*$/,
            `just booked a ${activity.service} in ${activity.location}`
          );
        }
        
        // Show notification with animation
        els.liveActivity.style.display = 'flex';
        els.liveActivity.style.opacity = '0';
        
        // Use requestAnimationFrame for smoother transition
        requestAnimationFrame(() => {
          els.liveActivity.style.opacity = '1';
        });
        
        // Auto-hide after 8 seconds
        setTimeout(hideActivity, 8000);
        
        // Schedule next notification (between 30 seconds and 2 minutes)
        setTimeout(showRandomActivity, 30000 + Math.random() * 90000);
      }
      
      /**
       * Hide the activity notification
       */
      function hideActivity() {
        if (!els.liveActivity) return;
        
        els.liveActivity.style.opacity = '0';
        setTimeout(() => {
          els.liveActivity.style.display = 'none';
        }, 300); // Match transition duration
      }
    }
    
    /**
     * Update booking summary before confirmation
     * Populates all summary fields with selected values
     */
    function updateBookingSummary() {
      if (!els.summaryService) return;
      
      // Service information
      updateServiceSummary();
      
      // Date and time
      updateScheduleSummary();
      
      // Personal details
      updatePersonalDetailsSummary();
      
      // Price calculation
      updatePriceEstimate();
    }
    
    /**
     * Update service information in the summary
     */
    function updateServiceSummary() {
      // Service type
      if (els.serviceInput && els.serviceInput.value && els.summaryService) {
        const selectedService = document.querySelector(`.service-option[data-value="${els.serviceInput.value}"]`);
        if (selectedService) {
          const serviceName = selectedService.querySelector('h4')?.textContent || '';
          els.summaryService.textContent = serviceName;
        } else {
          els.summaryService.textContent = els.serviceInput.value.charAt(0).toUpperCase() + 
                                           els.serviceInput.value.slice(1);
        }
      }
      
      // Property size
      if (els.propertySize && els.summaryPropertySize) {
        if (els.propertySize.value) {
          els.summaryPropertySize.textContent = els.propertySize.options[els.propertySize.selectedIndex].text;
        } else {
          els.summaryPropertySize.textContent = 'Not specified';
        }
      }
    }
    
    /**
     * Update schedule information in the summary
     */
    function updateScheduleSummary() {
      // Date
      if (els.selectedDate && els.selectedDate.value && els.summaryDate) {
        const date = new Date(els.selectedDate.value);
        els.summaryDate.textContent = formatDate(date);
      }
      
      // Time
      if (els.selectedTime && els.selectedTime.value && els.summaryTime) {
        const selectedTimeSlot = document.querySelector(`.time-slot[data-value="${els.selectedTime.value}"]`);
        if (selectedTimeSlot) {
          const timeLabel = selectedTimeSlot.querySelector('.time-label')?.textContent || '';
          const timeRange = selectedTimeSlot.querySelector('.time-range')?.textContent || '';
          els.summaryTime.textContent = `${timeLabel} (${timeRange})`;
        } else {
          els.summaryTime.textContent = els.selectedTime.value.charAt(0).toUpperCase() + 
                                        els.selectedTime.value.slice(1);
        }
      }
    }
    
    /**
     * Update personal details in the summary
     */
    function updatePersonalDetailsSummary() {
      // Name
      if (els.nameInput && els.summaryName) {
        els.summaryName.textContent = els.nameInput.value || '--';
      }
      
      // Phone
      if (els.phoneInput && els.summaryPhone) {
        els.summaryPhone.textContent = els.phoneInput.value || '--';
      }
      
      // Email
      if (els.emailInput && els.summaryEmail) {
        els.summaryEmail.textContent = els.emailInput.value || '--';
      }
      
      // Address
      if (els.streetInput && els.cityInput && els.postalCodeInput && els.summaryAddress) {
        const addressParts = [
          els.streetInput.value,
          els.cityInput.value,
          'SA', // Default state to South Australia
          els.postalCodeInput.value
        ].filter(Boolean);
        
        els.summaryAddress.textContent = addressParts.length ? addressParts.join(', ') : '--';
      }
    }
    
    /**
     * Calculate and update the price estimate
     */
    function updatePriceEstimate() {
      if (!els.summaryPrice) return;
      
      // Get the selected service
      const service = els.serviceInput ? els.serviceInput.value : 'residential';
      
      // Get the property size
      const size = els.propertySize ? els.propertySize.value : 'medium';
      
      // Calculate base price
      let price = pricing.base[service] || pricing.base.residential;
      
      // Apply size multiplier
      if (size && pricing.sizeMultiplier[size]) {
        price *= pricing.sizeMultiplier[size];
      }
      
      // Apply first-time customer discount
      // In production, this would check against a customer database
      const isFirstTimeCustomer = true;
      if (isFirstTimeCustomer && els.discountTag) {
        price *= (1 - pricing.discount.firstTime);
        els.discountTag.style.display = 'block';
      } else if (els.discountTag) {
        els.discountTag.style.display = 'none';
      }
      
      // Round to whole dollars
      price = Math.round(price);
      
      // Update the display
      els.summaryPrice.textContent = `$${price}`;
    }
    
    /**
     * Handle form submission
     * 
     * @param {Event} event - The form submission event
     */
    function handleFormSubmit(event) {
      event.preventDefault();
      
      // Validate final step
      if (!validateStep(4)) {
        return;
      }
      
      // Show loading state
      if (els.submitButton) {
        els.submitButton.disabled = true;
        els.submitButton.classList.add('loading');
        
        const buttonText = els.submitButton.querySelector('.button-text');
        if (buttonText) {
          buttonText.textContent = 'Processing...';
        }
      }
      
      // Collect form data
      const formData = new FormData(els.bookingForm);
      const data = formDataToObject(formData);
      
      // In a real application, we would send this data to the server
      // For this example, we'll simulate a server response with a delay
      setTimeout(() => {
        // Simulate API call
        const bookingId = generateBookingId();
        const bookingData = {
          ...data,
          bookingId,
          status: 'confirmed',
          createdAt: new Date().toISOString()
        };
        
        // Store in localStorage for confirmation page
        setToStorage('lx_booking_data', bookingData);
        
        // Clear form state
        clearFormState();
        
        // Redirect to confirmation page
        window.location.href = `booking-confirmation.html?ref=${bookingId}`;
      }, 1500);
    }
    
    /**
     * Prefill form from URL parameters
     * Allows direct links to booking with service preselected
     */
    function prefillFromUrlParams() {
      const params = new URLSearchParams(window.location.search);
      
      // Check for service parameter
      const serviceParam = params.get('service');
      if (serviceParam && els.serviceInput) {
        els.serviceInput.value = serviceParam;
        
        // Also select the corresponding option
        const serviceOption = document.querySelector(`.service-option[data-value="${serviceParam}"]`);
        if (serviceOption) {
          serviceOption.classList.add('selected');
          serviceOption.setAttribute('aria-selected', 'true');
        }
      }
      
      // Check for step parameter
      const stepParam = params.get('step');
      if (stepParam && !isNaN(parseInt(stepParam, 10))) {
        const step = parseInt(stepParam, 10);
        if (step >= 1 && step <= 4) {
          goToStep(step);
        }
      }
    }
    
    /**
     * Save form state to localStorage
     * Allows user to return to form with data intact
     */
    function saveFormState() {
      if (!supportsLocalStorage) return;
      
      try {
        const formState = {
          currentStep,
          serviceType: els.serviceInput ? els.serviceInput.value : '',
          propertySize: els.propertySize ? els.propertySize.value : '',
          selectedDate: els.selectedDate ? els.selectedDate.value : '',
          selectedTime: els.selectedTime ? els.selectedTime.value : '',
          name: els.nameInput ? els.nameInput.value : '',
          email: els.emailInput ? els.emailInput.value : '',
          phone: els.phoneInput ? els.phoneInput.value : '',
          street: els.streetInput ? els.streetInput.value : '',
          city: els.cityInput ? els.cityInput.value : '',
          postalCode: els.postalCodeInput ? els.postalCodeInput.value : '',
          notes: els.notesInput ? els.notesInput.value : ''
        };
        
        localStorage.setItem('lx_booking_form_state', JSON.stringify(formState));
      } catch (error) {
        console.error('Error saving form state:', error);
      }
    }
    
    /**
     * Restore form state from localStorage
     */
    function restoreFormState() {
      if (!supportsLocalStorage) return;
      
      try {
        const formState = localStorage.getItem('lx_booking_form_state');
        if (!formState) return;
        
        const state = JSON.parse(formState);
        
        // Restore values to form fields
        if (state.serviceType && els.serviceInput) {
          els.serviceInput.value = state.serviceType;
          
          // Also select the corresponding option
          const serviceOption = document.querySelector(`.service-option[data-value="${state.serviceType}"]`);
          if (serviceOption) {
            serviceOption.classList.add('selected');
            serviceOption.setAttribute('aria-selected', 'true');
          }
        }
        
        if (state.propertySize && els.propertySize) {
          els.propertySize.value = state.propertySize;
        }
        
        if (state.selectedDate && els.selectedDate) {
          els.selectedDate.value = state.selectedDate;
          
          // Also select the corresponding date option
          const dateOption = document.querySelector(`.date-option[data-date="${state.selectedDate}"]`);
          if (dateOption) {
            dateOption.classList.add('selected');
            dateOption.setAttribute('aria-selected', 'true');
          }
        }
        
        if (state.selectedTime && els.selectedTime) {
          els.selectedTime.value = state.selectedTime;
          
          // Also select the corresponding time option
          const timeOption = document.querySelector(`.time-slot[data-value="${state.selectedTime}"]`);
          if (timeOption) {
            timeOption.classList.add('selected');
            timeOption.setAttribute('aria-selected', 'true');
          }
        }
        
        // Restore personal details
        if (state.name && els.nameInput) els.nameInput.value = state.name;
        if (state.email && els.emailInput) els.emailInput.value = state.email;
        if (state.phone && els.phoneInput) els.phoneInput.value = state.phone;
        if (state.street && els.streetInput) els.streetInput.value = state.street;
        if (state.city && els.cityInput) els.cityInput.value = state.city;
        if (state.postalCode && els.postalCodeInput) els.postalCodeInput.value = state.postalCode;
        if (state.notes && els.notesInput) els.notesInput.value = state.notes;
        
        // Go to the saved step
        if (state.currentStep) {
          goToStep(state.currentStep);
        }
      } catch (error) {
        console.error('Error restoring form state:', error);
      }
    }
    
    /**
     * Clear form state from localStorage
     */
    function clearFormState() {
      if (!supportsLocalStorage) return;
      
      try {
        localStorage.removeItem('lx_booking_form_state');
      } catch (error) {
        console.error('Error clearing form state:', error);
      }
    }
    
    /**
     * Helper function: Format a date object to a readable string
     * 
     * @param {Date} date - The date to format
     * @param {Object} options - Optional formatting options
     * @returns {string} - The formatted date string
     */
    function formatDate(date, options = {}) {
      if (!(date instanceof Date)) {
        date = new Date(date);
      }
      
      const defaultOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
      
      const formatterOptions = { ...defaultOptions, ...options };
      
      return new Intl.DateTimeFormat('en-AU', formatterOptions).format(date);
    }
    
    /**
     * Helper function: Convert FormData to a plain object
     * 
     * @param {FormData} formData - The FormData object
     * @returns {Object} - Plain object with form data
     */
    function formDataToObject(formData) {
      const object = {};
      
      formData.forEach((value, key) => {
        // Handle nested properties (e.g., address[street])
        if (key.includes('[') && key.includes(']')) {
          const mainKey = key.substring(0, key.indexOf('['));
          const subKey = key.substring(key.indexOf('[') + 1, key.indexOf(']'));
          
          if (!object[mainKey]) object[mainKey] = {};
          object[mainKey][subKey] = value;
        } else {
          object[key] = value;
        }
      });
      
      return object;
    }
    
    /**
     * Helper function: Generate a unique booking ID
     * 
     * @returns {string} - A unique booking ID
     */
    function generateBookingId() {
      const timestamp = new Date().getTime().toString(36);
      const randomStr = Math.random().toString(36).substring(2, 8);
      return `LX-${timestamp}-${randomStr}`.toUpperCase();
    }
    
    /**
     * Helper function: Check if email is valid
     * 
     * @param {string} email - The email to validate
     * @returns {boolean} - Whether the email is valid
     */
    function isValidEmail(email) {
      const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return pattern.test(email);
    }
    
    /**
     * Helper function: Check if phone number is valid
     * Uses pattern for Australian phone numbers
     * 
     * @param {string} phone - The phone number to validate
     * @returns {boolean} - Whether the phone number is valid
     */
    function isValidPhone(phone) {
      // Clean the input first
      const cleanPhone = phone.replace(/\s+/g, '');
      
      // Pattern for Australian phone numbers
      const pattern = /^(?:\+61|0)[2-478](?:[ -]?[0-9]){8}$/;
      return pattern.test(cleanPhone);
    }
    
    /**
     * Helper function: Check if postal code is valid
     * Uses pattern for Australian postal codes
     * 
     * @param {string} postalCode - The postal code to validate
     * @returns {boolean} - Whether the postal code is valid
     */
    function isValidPostalCode(postalCode) {
      const pattern = /^\d{4}$/;
      return pattern.test(postalCode);
    }
    
    /**
     * Helper function: Debounce function for limiting execution frequency
     * 
     * @param {Function} func - The function to debounce
     * @param {number} wait - Wait time in milliseconds
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
    
    /**
     * Helper function: Get from localStorage with JSON parsing
     * 
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if key not found
     * @returns {*} - Stored value or default
     */
    function getFromStorage(key, defaultValue = null) {
      if (!supportsLocalStorage) return defaultValue;
      
      try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : defaultValue;
      } catch (error) {
        console.error(`Error getting ${key} from localStorage:`, error);
        return defaultValue;
      }
    }
    
    /**
     * Helper function: Set to localStorage with JSON stringification
     * 
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     * @returns {boolean} - Whether operation was successful
     */
    function setToStorage(key, value) {
      if (!supportsLocalStorage) return false;
      
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.error(`Error setting ${key} to localStorage:`, error);
        return false;
      }
    }
    
    // Feature detection
    const supportsLocalStorage = (function() {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
      } catch (e) {
        return false;
      }
    })();
    
    // Public API
    return {
      init,
      goToStep,
      updateBookingSummary
    };
  })();
  
  // Initialize the booking module when the DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    BookingModule.init();
  });