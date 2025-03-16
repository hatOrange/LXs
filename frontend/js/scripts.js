/**
 * LX Pest Solutions - Main JavaScript
 * Handles all interactive elements across the website
 */

// Initialize all modules when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Core site functionality
  Navigation.init();
  SmoothScroll.init();
  LazyLoad.init();
  
  // Interactive components
  Accordion.init();
  Tabs.init();
  Testimonials.init();
  
  // Forms and validation
  ContactForm.init();
  BookingForm.init();
  
  // Visual effects and notifications
  ActivityNotifications.init();
  CountdownTimer.init();
});

// Navigation module
const Navigation = {
  init: function() {
      const mobileToggle = document.getElementById('mobileMenuToggle');
      const mainNav = document.getElementById('main-navigation');
      
      if (!mobileToggle || !mainNav) return;
      
      mobileToggle.addEventListener('click', function() {
          const expanded = this.getAttribute('aria-expanded') === 'true';
          this.setAttribute('aria-expanded', !expanded);
          mainNav.classList.toggle('active');
          document.body.classList.toggle('menu-open');
      });
      
      // Close menu when clicking outside
      document.addEventListener('click', function(e) {
          if (mainNav.classList.contains('active') && 
              !e.target.closest('#main-navigation') && 
              !e.target.closest('#mobileMenuToggle')) {
              mobileToggle.setAttribute('aria-expanded', 'false');
              mainNav.classList.remove('active');
              document.body.classList.remove('menu-open');
          }
      });
      
      // Handle window resize
      window.addEventListener('resize', function() {
          if (window.innerWidth > 768 && mainNav.classList.contains('active')) {
              mobileToggle.setAttribute('aria-expanded', 'false');
              mainNav.classList.remove('active');
              document.body.classList.remove('menu-open');
          }
      });
  }
};

// Smooth scrolling for anchor links
const SmoothScroll = {
  init: function() {
      document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(anchor => {
          anchor.addEventListener('click', function(e) {
              e.preventDefault();
              
              const targetId = this.getAttribute('href');
              const targetElement = document.querySelector(targetId);
              
              if (targetElement) {
                  const headerOffset = 80;
                  const elementPosition = targetElement.getBoundingClientRect().top;
                  const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                  
                  window.scrollTo({
                      top: offsetPosition,
                      behavior: 'smooth'
                  });
                  
                  // Update URL without page jump
                  history.pushState(null, null, targetId);
              }
          });
      });
  }
};

// Lazy loading for images
const LazyLoad = {
  init: function() {
      if ('loading' in HTMLImageElement.prototype) {
          // Browser supports native lazy loading
          document.querySelectorAll('img[data-src]').forEach(img => {
              img.src = img.dataset.src;
              if (img.dataset.srcset) {
                  img.srcset = img.dataset.srcset;
              }
          });
      } else {
          // Fallback for browsers that don't support native lazy loading
          this.lazyLoadImages();
          
          // Set up intersection observer for images that come into view
          this.setupIntersectionObserver();
      }
  },
  
  lazyLoadImages: function() {
      const lazyImages = document.querySelectorAll('img[data-src]');
      
      if ('IntersectionObserver' in window) {
          const imageObserver = new IntersectionObserver((entries, observer) => {
              entries.forEach(entry => {
                  if (entry.isIntersecting) {
                      const image = entry.target;
                      image.src = image.dataset.src;
                      if (image.dataset.srcset) {
                          image.srcset = image.dataset.srcset;
                      }
                      image.classList.add('loaded');
                      imageObserver.unobserve(image);
                  }
              });
          });
          
          lazyImages.forEach(image => {
              imageObserver.observe(image);
          });
      } else {
          // Fallback for older browsers without IntersectionObserver
          lazyImages.forEach(image => {
              image.src = image.dataset.src;
              if (image.dataset.srcset) {
                  image.srcset = image.dataset.srcset;
              }
              image.classList.add('loaded');
          });
      }
  },
  
  setupIntersectionObserver: function() {
      if ('IntersectionObserver' in window) {
          const loadBackgrounds = new IntersectionObserver((entries, observer) => {
              entries.forEach(entry => {
                  if (entry.isIntersecting) {
                      const element = entry.target;
                      const bg = element.dataset.background;
                      if (bg) {
                          element.style.backgroundImage = `url(${bg})`;
                          element.classList.add('bg-loaded');
                          observer.unobserve(element);
                      }
                  }
              });
          });
          
          // Observe elements with data-background
          document.querySelectorAll('[data-background]').forEach(element => {
              loadBackgrounds.observe(element);
          });
      }
  }
};

// Accordion functionality
const Accordion = {
  init: function() {
      document.querySelectorAll('.accordion').forEach(accordion => {
          accordion.addEventListener('click', e => {
              const trigger = e.target.closest('.accordion-trigger');
              if (!trigger) return;
              
              const content = document.getElementById(trigger.getAttribute('aria-controls'));
              const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
              
              // If accordion doesn't allow multiple open panels, close others
              if (!accordion.hasAttribute('data-allow-multiple')) {
                  accordion.querySelectorAll('.accordion-trigger[aria-expanded="true"]').forEach(item => {
                      if (item !== trigger) {
                          item.setAttribute('aria-expanded', 'false');
                          document.getElementById(item.getAttribute('aria-controls')).hidden = true;
                      }
                  });
              }
              
              // Toggle the clicked panel
              trigger.setAttribute('aria-expanded', !isExpanded);
              content.hidden = isExpanded;
          });
      });
  }
};

// Tab interface functionality
const Tabs = {
  init: function() {
      document.querySelectorAll('.tab-list').forEach(tabList => {
          const tabs = Array.from(tabList.querySelectorAll('[role="tab"]'));
          const panels = tabs.map(tab => {
              return document.getElementById(tab.getAttribute('aria-controls'));
          });
          
          // Add click handler to tabs
          tabList.addEventListener('click', e => {
              const tab = e.target.closest('[role="tab"]');
              if (!tab) return;
              
              // Deactivate all tabs
              tabs.forEach(t => {
                  t.setAttribute('aria-selected', 'false');
                  t.setAttribute('tabindex', '-1');
              });
              
              // Hide all panels
              panels.forEach(p => {
                  p.hidden = true;
              });
              
              // Activate clicked tab
              tab.setAttribute('aria-selected', 'true');
              tab.setAttribute('tabindex', '0');
              
              // Show corresponding panel
              const panel = document.getElementById(tab.getAttribute('aria-controls'));
              panel.hidden = false;
          });
          
          // Enable keyboard navigation for tabs
          tabList.addEventListener('keydown', e => {
              const tab = e.target.closest('[role="tab"]');
              if (!tab) return;
              
              const index = tabs.indexOf(tab);
              
              // Move right/left based on arrow key
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                  e.preventDefault();
                  
                  let newIndex;
                  if (e.key === 'ArrowRight') {
                      newIndex = index + 1 >= tabs.length ? 0 : index + 1;
                  } else {
                      newIndex = index - 1 < 0 ? tabs.length - 1 : index - 1;
                  }
                  
                  tabs[newIndex].click();
                  tabs[newIndex].focus();
              }
          });
      });
  }
};

// Testimonial carousel
const Testimonials = {
  init: function() {
      const carousel = document.querySelector('.testimonial-carousel');
      if (!carousel) return;
      
      const testimonials = Array.from(carousel.querySelectorAll('.testimonial'));
      if (testimonials.length <= 1) return;
      
      let currentIndex = 0;
      
      // Create carousel controls if they don't exist
      if (!document.querySelector('.carousel-controls')) {
          const controls = document.createElement('div');
          controls.className = 'carousel-controls';
          
          // Previous button
          const prevBtn = document.createElement('button');
          prevBtn.className = 'carousel-arrow prev-arrow';
          prevBtn.setAttribute('aria-label', 'Previous testimonial');
          prevBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>';
          
          // Next button
          const nextBtn = document.createElement('button');
          nextBtn.className = 'carousel-arrow next-arrow';
          nextBtn.setAttribute('aria-label', 'Next testimonial');
          nextBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>';
          
          // Dots container
          const dotsContainer = document.createElement('div');
          dotsContainer.className = 'carousel-dots';
          
          // Create dots for each testimonial
          testimonials.forEach((_, index) => {
              const dot = document.createElement('button');
              dot.className = 'carousel-dot';
              dot.setAttribute('aria-label', `Go to testimonial ${index + 1}`);
              dot.addEventListener('click', () => goToSlide(index));
              dotsContainer.appendChild(dot);
          });
          
          // Add everything to controls
          controls.appendChild(prevBtn);
          controls.appendChild(dotsContainer);
          controls.appendChild(nextBtn);
          
          // Add controls after carousel
          carousel.parentNode.insertBefore(controls, carousel.nextSibling);
          
          // Add button functionality
          prevBtn.addEventListener('click', () => {
              goToSlide(currentIndex - 1 < 0 ? testimonials.length - 1 : currentIndex - 1);
          });
          
          nextBtn.addEventListener('click', () => {
              goToSlide(currentIndex + 1 >= testimonials.length ? 0 : currentIndex + 1);
          });
      }
      
      // Navigate to a specific slide
      function goToSlide(index) {
          // Update current index
          currentIndex = index;
          
          // Update dots
          document.querySelectorAll('.carousel-dot').forEach((dot, i) => {
              dot.classList.toggle('active', i === index);
          });
          
          // Scroll to selected testimonial
          testimonials[index].scrollIntoView({
              behavior: 'smooth',
              block: 'nearest',
              inline: 'center'
          });
      }
      
      // Set up auto-scrolling
      let autoScrollInterval;
      
      function startAutoScroll() {
          if (autoScrollInterval) clearInterval(autoScrollInterval);
          autoScrollInterval = setInterval(() => {
              goToSlide(currentIndex + 1 >= testimonials.length ? 0 : currentIndex + 1);
          }, 5000);
      }
      
      function stopAutoScroll() {
          if (autoScrollInterval) clearInterval(autoScrollInterval);
      }
      
      // Start auto-scroll
      startAutoScroll();
      
      // Pause on hover/touch
      carousel.addEventListener('mouseenter', stopAutoScroll);
      carousel.addEventListener('touchstart', stopAutoScroll, {passive: true});
      
      // Resume auto-scroll
      carousel.addEventListener('mouseleave', startAutoScroll);
      carousel.addEventListener('touchend', startAutoScroll, {passive: true});
      
      // Set initial slide
      goToSlide(0);
  }
};

// Contact form validation and submission
const ContactForm = {
  init: function() {
      const form = document.getElementById('contactForm');
      if (!form) return;
      
      // Form validation
      form.addEventListener('submit', async function(e) {
          e.preventDefault();
          
          // Reset previous error messages
          this.querySelectorAll('.error-message').forEach(el => el.classList.remove('show'));
          
          // Validate form
          if (!this.checkValidity() || !validateForm()) {
              // Show browser validation messages
              return;
          }
          
          // Show loading state on button
          const submitBtn = this.querySelector('button[type="submit"]');
          if (submitBtn) {
              submitBtn.disabled = true;
              submitBtn.classList.add('loading');
          }
          
          try {
              // Get form data
              const formData = new FormData(this);
              const data = Object.fromEntries(formData.entries());
              
              // Send data to server (simulated)
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Show success message
              const successMsg = document.getElementById('formSuccess');
              if (successMsg) {
                  successMsg.classList.add('show');
                  
                  // Focus for screen readers
                  successMsg.setAttribute('tabindex', '-1');
                  successMsg.focus();
                  
                  // Scroll to message
                  successMsg.scrollIntoView({
                      behavior: 'smooth',
                      block: 'center'
                  });
              }
              
              // Reset form
              form.reset();
              
              // Remove success message after delay
              setTimeout(() => {
                  if (successMsg) successMsg.classList.remove('show');
              }, 8000);
              
          } catch (error) {
              console.error('Form submission error:', error);
              
              // Show error message
              const errorContainer = document.createElement('div');
              errorContainer.className = 'form-error';
              errorContainer.textContent = 'There was a problem submitting your form. Please try again later.';
              
              // Insert error message
              form.insertBefore(errorContainer, submitBtn.parentNode);
              
              // Remove error after delay
              setTimeout(() => {
                  errorContainer.remove();
              }, 5000);
              
          } finally {
              // Reset button state
              if (submitBtn) {
                  submitBtn.disabled = false;
                  submitBtn.classList.remove('loading');
              }
          }
      });
      
      // Validate fields on input
      form.querySelectorAll('input, textarea, select').forEach(field => {
          field.addEventListener('input', function() {
              validateField(field);
          });
      });
      
      function validateForm() {
          let isValid = true;
          
          // Check required fields
          form.querySelectorAll('[required]').forEach(field => {
              if (!validateField(field)) {
                  isValid = false;
              }
          });
          
          return isValid;
      }
      
      function validateField(field) {
          // Skip fields without validation
          if (!field.hasAttribute('required') && field.value === '') {
              return true;
          }
          
          const fieldName = field.name;
          const errorElement = document.getElementById(`${fieldName}Error`);
          if (!errorElement) return true;
          
          let isValid = true;
          let errorMessage = '';
          
          // Type-specific validation
          if (field.type === 'email' && field.value && !isValidEmail(field.value)) {
              isValid = false;
              errorMessage = 'Please enter a valid email address';
          } else if (field.type === 'tel' && field.value && !isValidPhone(field.value)) {
              isValid = false;
              errorMessage = 'Please enter a valid phone number';
          } else if (field.hasAttribute('required') && !field.value.trim()) {
              isValid = false;
              errorMessage = `${field.placeholder || fieldName} is required`;
          }
          
          // Validate checkbox
          if (field.type === 'checkbox' && field.hasAttribute('required') && !field.checked) {
              isValid = false;
              errorMessage = 'This field is required';
          }
          
          // Update UI
          if (!isValid) {
              field.classList.add('error');
              errorElement.textContent = errorMessage;
              errorElement.classList.add('show');
          } else {
              field.classList.remove('error');
              errorElement.classList.remove('show');
          }
          
          return isValid;
      }
      
      function isValidEmail(email) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      }
      
      function isValidPhone(phone) {
          // Australian phone format
          return /^(?:\+61|0)[2-478](?:[ -]?[0-9]){8}$/.test(phone.replace(/\s+/g, ''));
      }
  }
};

// Booking form functionality
const BookingForm = {
  init: function() {
      const form = document.getElementById('bookingForm');
      if (!form) return;
      
      // Step navigation elements
      const stepButtons = {
          next: Array.from(document.querySelectorAll('[id^="toStep"]')),
          prev: Array.from(document.querySelectorAll('[id^="backToStep"]')),
          submit: document.getElementById('submitBooking')
      };
      
      // Current step tracker
      let currentStep = 1;
      
      // Initialize date grid
      this.initializeDateGrid();
      
      // Initialize service selection
      this.initializeServiceSelection();
      
      // Initialize step navigation
      this.initializeStepNavigation(stepButtons, form);
      
      // Initialize validation
      this.initializeValidation(form);
      
      // Handle form submission
      form.addEventListener('submit', async function(e) {
          e.preventDefault();
          
          // Final validation
          if (!validateStep(4)) return;
          
          // Show loading state
          if (stepButtons.submit) {
              stepButtons.submit.disabled = true;
              stepButtons.submit.classList.add('loading');
          }
          
          try {
              // Collect form data
              const formData = new FormData(form);
              const data = Object.fromEntries(formData.entries());
              
              // Process form data (format address object, etc.)
              
              // Simulate API call with delay
              await new Promise(resolve => setTimeout(resolve, 1500));
              
              // Redirect to confirmation page (simulated)
              window.location.href = 'booking-confirmation.html?ref=' + Math.random().toString(36).substring(2, 10);
          } catch (error) {
              console.error('Booking submission error:', error);
              
              // Show error message
              const errorEl = document.createElement('div');
              errorEl.className = 'form-error-message';
              errorEl.textContent = 'There was an error processing your booking. Please try again or contact us directly.';
              
              form.insertBefore(errorEl, stepButtons.submit.parentNode);
              
              // Remove error after delay
              setTimeout(() => {
                  errorEl.remove();
              }, 5000);
          } finally {
              // Reset button state
              if (stepButtons.submit) {
                  stepButtons.submit.disabled = false;
                  stepButtons.submit.classList.remove('loading');
              }
          }
      });
      
      // Helper function: Validate a single step
      function validateStep(step) {
          let isValid = true;
          
          switch(step) {
              case 1:
                  // Service selection validation
                  const serviceInput = document.getElementById('serviceType');
                  if (!serviceInput || !serviceInput.value) {
                      const errorElement = document.getElementById('serviceError');
                      if (errorElement) errorElement.classList.add('show');
                      isValid = false;
                  }
                  break;
                  
              case 2:
                  // Date and time validation
                  const dateInput = document.getElementById('selectedDate');
                  const timeInput = document.getElementById('selectedTime');
                  
                  if (!dateInput || !dateInput.value) {
                      const errorElement = document.getElementById('dateError');
                      if (errorElement) errorElement.classList.add('show');
                      isValid = false;
                  }
                  
                  if (!timeInput || !timeInput.value) {
                      const errorElement = document.getElementById('timeError');
                      if (errorElement) errorElement.classList.add('show');
                      isValid = false;
                  }
                  break;
                  
              case 3:
                  // Customer details validation
                  const requiredFields = ['name', 'email', 'phone', 'street', 'city', 'postalCode'];
                  
                  requiredFields.forEach(field => {
                      const fieldElement = document.getElementById(field);
                      if (!fieldElement) return;
                      
                      const errorElement = document.getElementById(`${field}Error`);
                      
                      if (!fieldElement.value.trim()) {
                          if (errorElement) errorElement.classList.add('show');
                          isValid = false;
                      } else if (field === 'email' && !isValidEmail(fieldElement.value)) {
                          if (errorElement) {
                              errorElement.textContent = 'Please enter a valid email address';
                              errorElement.classList.add('show');
                          }
                          isValid = false;
                      } else if (field === 'phone' && !isValidPhone(fieldElement.value)) {
                          if (errorElement) {
                              errorElement.textContent = 'Please enter a valid phone number';
                              errorElement.classList.add('show');
                          }
                          isValid = false;
                      }
                  });
                  break;
                  
              case 4:
                  // Terms agreement validation
                  const termsCheckbox = document.getElementById('terms');
                  if (!termsCheckbox || !termsCheckbox.checked) {
                      const errorElement = document.getElementById('termsError');
                      if (errorElement) errorElement.classList.add('show');
                      isValid = false;
                  }
                  break;
          }
          
          return isValid;
      }
      
      function isValidEmail(email) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      }
      
      function isValidPhone(phone) {
          // Australian phone format
          return /^(?:\+61|0)[2-478](?:[ -]?[0-9]){8}$/.test(phone.replace(/\s+/g, ''));
      }
  },
  
  initializeDateGrid: function() {
      const dateGrid = document.getElementById('dateGrid');
      if (!dateGrid) return;
      
      // Generate date options for the next 14 days
      const today = new Date();
      let html = '';
      
      for (let i = 0; i < 14; i++) {
          const date = new Date();
          date.setDate(today.getDate() + i);
          
          // Skip Sundays (optional)
          if (date.getDay() === 0) continue;
          
          // Format date
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          const dayNumber = date.getDate();
          const monthName = date.toLocaleDateString('en-US', { month: 'short' });
          const formattedDate = date.toISOString().split('T')[0];
          
          // For demo, mark some dates as unavailable randomly
          const isUnavailable = Math.random() < 0.2;
          const unavailableClass = isUnavailable ? ' unavailable' : '';
          
          html += `
              <div class="date-option${unavailableClass}" data-date="${formattedDate}" ${isUnavailable ? 'aria-disabled="true"' : ''}>
                  <div class="day-name">${dayName}</div>
                  <div class="day-number">${dayNumber}</div>
                  <div class="month-name">${monthName}</div>
              </div>
          `;
      }
      
      dateGrid.innerHTML = html;
      
      // Add click event listeners to date options
      dateGrid.addEventListener('click', e => {
          const dateOption = e.target.closest('.date-option:not(.unavailable)');
          if (!dateOption) return;
          
          // Clear previous selection
          dateGrid.querySelectorAll('.date-option').forEach(option => {
              option.classList.remove('selected');
              option.setAttribute('aria-selected', 'false');
          });
          
          // Select clicked date
          dateOption.classList.add('selected');
          dateOption.setAttribute('aria-selected', 'true');
          
          // Update hidden input
          const selectedDateInput = document.getElementById('selectedDate');
          if (selectedDateInput) {
              selectedDateInput.value = dateOption.dataset.date;
              
              // Clear error if present
              const dateError = document.getElementById('dateError');
              if (dateError) dateError.classList.remove('show');
          }
      });
  },
  
  initializeServiceSelection: function() {
      const serviceOptions = document.querySelectorAll('.service-option');
      const serviceInput = document.getElementById('serviceType');
      
      if (!serviceOptions.length || !serviceInput) return;
      
      // Service selection handler
      document.addEventListener('click', e => {
          const serviceOption = e.target.closest('.service-option');
          if (!serviceOption) return;
          
          // Remove selection from all options
          serviceOptions.forEach(option => {
              option.classList.remove('selected');
              option.setAttribute('aria-selected', 'false');
          });
          
          // Add selection to clicked option
          serviceOption.classList.add('selected');
          serviceOption.setAttribute('aria-selected', 'true');
          
          // Update hidden input
          serviceInput.value = serviceOption.dataset.value;
          
          // Hide error message if shown
          const errorElement = document.getElementById('serviceError');
          if (errorElement) errorElement.classList.remove('show');
      });
  },
  
  initializeStepNavigation: function(stepButtons, form) {
      // Step indicators
      const stepIndicators = Array.from(document.querySelectorAll('.step'));
      
      // Step content areas
      const formSteps = Array.from(document.querySelectorAll('.form-step'));
      
      // Navigate to next step
      stepButtons.next.forEach(button => {
          button.addEventListener('click', () => {
              const stepNumber = parseInt(button.id.replace('toStep', ''));
              
              // Validate current step before proceeding
              if (!this.validateCurrentStep(stepNumber - 1)) return;
              
              // Go to next step
              this.goToStep(stepNumber, stepIndicators, formSteps);
              
              // Update summary on final step
              if (stepNumber === 4) {
                  this.updateSummary();
              }
          });
      });
      
      // Navigate to previous step
      stepButtons.prev.forEach(button => {
          button.addEventListener('click', () => {
              const currentStep = parseInt(button.id.replace('backToStep', ''));
              this.goToStep(currentStep, stepIndicators, formSteps);
          });
      });
  },
  
  validateCurrentStep: function(step) {
      const requiredValidators = {
          1: () => {
              // Service selection validation
              const serviceInput = document.getElementById('serviceType');
              if (!serviceInput || !serviceInput.value) {
                  const errorElement = document.getElementById('serviceError');
                  if (errorElement) errorElement.classList.add('show');
                  return false;
              }
              return true;
          },
          2: () => {
              // Date and time validation
              const dateInput = document.getElementById('selectedDate');
              const timeInput = document.getElementById('selectedTime');
              let isValid = true;
              
              if (!dateInput || !dateInput.value) {
                  const errorElement = document.getElementById('dateError');
                  if (errorElement) errorElement.classList.add('show');
                  isValid = false;
              }
              
              if (!timeInput || !timeInput.value) {
                  const errorElement = document.getElementById('timeError');
                  if (errorElement) errorElement.classList.add('show');
                  isValid = false;
              }
              
              return isValid;
          },
          3: () => {
              // Personal details validation
              const requiredFields = ['name', 'email', 'phone', 'street', 'city', 'postalCode'];
              let isValid = true;
              
              requiredFields.forEach(field => {
                  const fieldElement = document.getElementById(field);
                  if (!fieldElement) return;
                  
                  const errorElement = document.getElementById(`${field}Error`);
                  
                  if (!fieldElement.value.trim()) {
                      if (errorElement) errorElement.classList.add('show');
                      isValid = false;
                  } else if (field === 'email' && !this.isValidEmail(fieldElement.value)) {
                      if (errorElement) {
                          errorElement.textContent = 'Please enter a valid email address';
                          errorElement.classList.add('show');
                      }
                      isValid = false;
                  } else if (field === 'phone' && !this.isValidPhone(fieldElement.value)) {
                      if (errorElement) {
                          errorElement.textContent = 'Please enter a valid phone number';
                          errorElement.classList.add('show');
                      }
                      isValid = false;
                  }
              });
              
              return isValid;
          }
      };
      
      return !requiredValidators[step] || requiredValidators[step]();
  },
  
  goToStep: function(stepNumber, stepIndicators, formSteps) {
      // Update step indicators
      stepIndicators.forEach((step, index) => {
          const stepNum = index + 1;
          
          if (stepNum < stepNumber) {
              step.classList.add('completed');
              step.classList.remove('active');
          } else if (stepNum === stepNumber) {
              step.classList.add('active');
              step.classList.remove('completed');
          } else {
              step.classList.remove('active', 'completed');
          }
      });
      
      // Show only the active form step
      formSteps.forEach((formStep, index) => {
          formStep.classList.toggle('active', index + 1 === stepNumber);
      });
      
      // Scroll to top of form
      const form = document.getElementById('bookingForm');
      if (form) {
          form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
  },
  
  initializeValidation: function(form) {
      // Add input validation
      form.querySelectorAll('input, select, textarea').forEach(field => {
          field.addEventListener('input', () => {
              this.validateField(field);
          });
          
          field.addEventListener('blur', () => {
              this.validateField(field);
          });
      });
  },
  
  validateField: function(field) {
      // Skip fields without validation
      if (!field.hasAttribute('required') && field.value === '') {
          return true;
      }
      
      const fieldName = field.id || field.name;
      const errorElement = document.getElementById(`${fieldName}Error`);
      if (!errorElement) return true;
      
      let isValid = true;
      let errorMessage = '';
      
      // Type-specific validation
      if (field.type === 'email' && field.value && !this.isValidEmail(field.value)) {
          isValid = false;
          errorMessage = 'Please enter a valid email address';
      } else if (field.type === 'tel' && field.value && !this.isValidPhone(field.value)) {
          isValid = false;
          errorMessage = 'Please enter a valid phone number';
      } else if (field.hasAttribute('required') && !field.value.trim()) {
          isValid = false;
          errorMessage = `This field is required`;
      }
      
      // Validate checkbox
      if (field.type === 'checkbox' && field.hasAttribute('required') && !field.checked) {
          isValid = false;
          errorMessage = 'This field is required';
      }
      
      // Update UI
      if (!isValid) {
          field.classList.add('error');
          errorElement.textContent = errorMessage;
          errorElement.classList.add('show');
      } else {
          field.classList.remove('error');
          errorElement.classList.remove('show');
      }
      
      return isValid;
  },
  
  isValidEmail: function(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },
  
  isValidPhone: function(phone) {
      // Australian phone format
      return /^(?:\+61|0)[2-478](?:[ -]?[0-9]){8}$/.test(phone.replace(/\s+/g, ''));
  },
  
  updateSummary: function() {
      // Get summary elements
      const summaryElements = {
          service: document.getElementById('summaryService'),
          propertySize: document.getElementById('summaryPropertySize'),
          date: document.getElementById('summaryDate'),
          time: document.getElementById('summaryTime'),
          name: document.getElementById('summaryName'),
          phone: document.getElementById('summaryPhone'),
          email: document.getElementById('summaryEmail'),
          address: document.getElementById('summaryAddress'),
          price: document.getElementById('summaryPrice')
      };
      
      // Get form data
      const formData = {
          service: document.getElementById('serviceType')?.value,
          propertySize: document.getElementById('propertySize')?.value,
          date: document.getElementById('selectedDate')?.value,
          time: document.getElementById('selectedTime')?.value,
          name: document.getElementById('name')?.value,
          phone: document.getElementById('phone')?.value,
          email: document.getElementById('email')?.value,
          street: document.getElementById('street')?.value,
          city: document.getElementById('city')?.value,
          postalCode: document.getElementById('postalCode')?.value
      };
      
      // Update summary elements
      if (summaryElements.service && formData.service) {
          const serviceOption = document.querySelector(`.service-option[data-value="${formData.service}"]`);
          summaryElements.service.textContent = serviceOption ? 
              serviceOption.querySelector('h4')?.textContent || formData.service : 
              formData.service;
      }
      
      if (summaryElements.propertySize && formData.propertySize) {
          const propertySelect = document.getElementById('propertySize');
          summaryElements.propertySize.textContent = propertySelect ? 
              propertySelect.options[propertySelect.selectedIndex].text : 
              formData.propertySize;
      }
      
      if (summaryElements.date && formData.date) {
          const date = new Date(formData.date);
          summaryElements.date.textContent = date.toLocaleDateString('en-US', {
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric'
          });
      }
      
      if (summaryElements.time && formData.time) {
          const timeOption = document.querySelector(`.time-slot[data-value="${formData.time}"]`);
          summaryElements.time.textContent = timeOption ? 
              `${timeOption.querySelector('.time-label')?.textContent} (${timeOption.querySelector('.time-range')?.textContent})` : 
              formData.time;
      }
      
      if (summaryElements.name) {
          summaryElements.name.textContent = formData.name || '--';
      }
      
      if (summaryElements.phone) {
          summaryElements.phone.textContent = formData.phone || '--';
      }
      
      if (summaryElements.email) {
          summaryElements.email.textContent = formData.email || '--';
      }
      
      if (summaryElements.address) {
          const addressParts = [
              formData.street,
              formData.city,
              'SA', // Default state (South Australia)
              formData.postalCode
          ].filter(Boolean);
          
          summaryElements.address.textContent = addressParts.length ? 
              addressParts.join(', ') : 
              '--';
      }
      
      if (summaryElements.price) {
          // Calculate price based on service and property size
          let price = 299; // Default price
          
          // Adjust based on service type
          if (formData.service === 'termite') {
              price = 399;
          } else if (formData.service === 'commercial') {
              price = 499;
          }
          
          // Adjust based on property size
          if (formData.propertySize === 'large') {
              price *= 1.2;
          } else if (formData.propertySize === 'commercial') {
              price *= 1.5;
          }
          
          // Apply first-time customer discount
          const discountTag = document.getElementById('discountTag');
          const isFirstTimeCustomer = true; // In production, check against customer database
          
          if (isFirstTimeCustomer && discountTag) {
              price *= 0.8; // 20% discount
              discountTag.style.display = 'block';
          } else if (discountTag) {
              discountTag.style.display = 'none';
          }
          
          // Update price display
          summaryElements.price.textContent = `$${Math.round(price)}`;
      }
  }
};

// Activity notifications for social proof
const ActivityNotifications = {
  init: function() {
      const activityContainer = document.getElementById('liveActivity');
      if (!activityContainer) return;
      
      const closeButton = activityContainer.querySelector('.close-notification');
      if (closeButton) {
          closeButton.addEventListener('click', () => {
              this.hideNotification(activityContainer);
          });
      }
      
      // Sample activity data
      this.activityData = [
          {name: 'John', location: 'Prospect', service: 'pest inspection'},
          {name: 'Sarah', location: 'Norwood', service: 'termite treatment'},
          {name: 'Michael', location: 'Glenelg', service: 'rodent control'},
          {name: 'Emma', location: 'Semaphore', service: 'cockroach treatment'},
          {name: 'David', location: 'North Adelaide', service: 'ant control'},
          {name: 'Jessica', location: 'Burnside', service: 'spider removal'},
          {name: 'Robert', location: 'Henley Beach', service: 'commercial pest control'},
          {name: 'Lisa', location: 'Mitcham', service: 'pest inspection'}
      ];
      
      // Start notification cycle after delay
      setTimeout(() => {
          this.showNotification(activityContainer);
      }, 15000);
  },
  
  showNotification: function(container) {
      if (!container) return;
      
      // Get random activity
      const activity = this.activityData[Math.floor(Math.random() * this.activityData.length)];
      
      // Update notification text
      const textElement = container.querySelector('.live-activity-text');
      if (textElement) {
          textElement.innerHTML = `<span>${activity.name} from ${activity.location}</span> just booked a ${activity.service}`;
      }
      
      // Show notification with animation
      container.style.display = 'flex';
      container.style.opacity = '0';
      
      requestAnimationFrame(() => {
          container.style.opacity = '1';
      });
      
      // Auto-hide after delay
      this.notificationTimer = setTimeout(() => {
          this.hideNotification(container);
          
          // Schedule next notification
          setTimeout(() => {
              this.showNotification(container);
          }, 45000 + Math.random() * 30000); // Random interval between 45-75 seconds
      }, 8000);
  },
  
  hideNotification: function(container) {
      if (!container) return;
      
      // Clear any existing timer
      if (this.notificationTimer) {
          clearTimeout(this.notificationTimer);
      }
      
      // Hide with fade out animation
      container.style.opacity = '0';
      
      setTimeout(() => {
          container.style.display = 'none';
      }, 300); // Match transition duration in CSS
  }
};

// Countdown timer for urgency
const CountdownTimer = {
  init: function() {
      const countdownElement = document.getElementById('countdown');
      if (!countdownElement) return;
      
      // Set initial countdown time (24 hours)
      let hours = 23;
      let minutes = 59;
      let seconds = 59;
      
      // Try to get saved countdown from local storage
      try {
          const savedCountdown = localStorage.getItem('lx_countdown');
          if (savedCountdown) {
              const countdown = JSON.parse(savedCountdown);
              const now = new Date().getTime();
              
              if (countdown.endTime > now) {
                  // Calculate remaining time
                  const timeLeft = Math.floor((countdown.endTime - now) / 1000);
                  hours = Math.floor(timeLeft / 3600);
                  minutes = Math.floor((timeLeft % 3600) / 60);
                  seconds = timeLeft % 60;
              } else {
                  // Reset countdown
                  this.saveCountdown(hours, minutes, seconds);
              }
          } else {
              // Set new countdown
              this.saveCountdown(hours, minutes, seconds);
          }
      } catch (error) {
          console.error('Error with countdown timer:', error);
      }
      
      // Update the display
      this.updateDisplay(countdownElement, hours, minutes, seconds);
      
      // Start countdown
      this.startCountdown(countdownElement, hours, minutes, seconds);
  },
  
  updateDisplay: function(element, hours, minutes, seconds) {
      element.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      
      // Update ARIA attributes for screen readers
      element.setAttribute('aria-label', `Special offer ends in ${hours} hours, ${minutes} minutes, and ${seconds} seconds`);
  },
  
  startCountdown: function(element, h, m, s) {
      let hours = h;
      let minutes = m;
      let seconds = s;
      
      const timerInterval = setInterval(() => {
          // Decrement time
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
              // Reset countdown when it reaches zero
              hours = 23;
              minutes = 59;
              seconds = 59;
              this.saveCountdown(hours, minutes, seconds);
          }
          
          // Update display
          this.updateDisplay(element, hours, minutes, seconds);
          
          // Save current time periodically
          if (seconds % 10 === 0) {
              this.saveCountdown(hours, minutes, seconds);
          }
      }, 1000);
  },
  
  saveCountdown: function(hours, minutes, seconds) {
      try {
          const now = new Date().getTime();
          const totalSeconds = hours * 3600 + minutes * 60 + seconds;
          const endTime = now + (totalSeconds * 1000);
          
          localStorage.setItem('lx_countdown', JSON.stringify({
              endTime: endTime
          }));
      } catch (error) {
          console.error('Error saving countdown:', error);
      }
  }
};