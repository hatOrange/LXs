/**
 * LX Pest Solutions - Main JavaScript
 * Version: 1.0.0
 * 
 * This file contains core functionality used across the entire website.
 * It's optimized for performance with efficient event delegation
 * and leverages modern JavaScript patterns like module pattern,
 * async/await, and lazy loading.
 * 
 * @author LX Pest Solutions Development Team
 */

/**
 * Initialize everything when DOM is fully loaded
 * Use a self-invoking function for encapsulation and prevent global namespace pollution
 */
(function() {
  'use strict';

  // Feature detection for browser support
  const supportsIntersectionObserver = 'IntersectionObserver' in window;
  const supportsLocalStorage = (() => {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return true;
    } catch (e) {
      return false;
    }
  })();

  /**
   * Core utilities module - Contains reusable helper functions
   */
  const Utils = {
    /**
     * Debounce function to limit how often a function can execute
     * Useful for scroll and resize events
     * 
     * @param {Function} func - The function to debounce
     * @param {number} wait - The wait time in milliseconds
     * @param {boolean} immediate - Whether to trigger the function immediately
     * @return {Function} - The debounced function
     */
    debounce(func, wait = 100, immediate = false) {
      let timeout;
      return function() {
        const context = this;
        const args = arguments;
        
        const later = function() {
          timeout = null;
          if (!immediate) func.apply(context, args);
        };
        
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        
        if (callNow) func.apply(context, args);
      };
    },
    
    /**
     * Throttle function to ensure function is called at most once per specified period
     * Better for animations and continuous events
     * 
     * @param {Function} func - The function to throttle
     * @param {number} limit - The time limit in milliseconds
     * @return {Function} - The throttled function
     */
    throttle(func, limit = 100) {
      let inThrottle;
      return function() {
        const args = arguments;
        const context = this;
        
        if (!inThrottle) {
          func.apply(context, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    },
    
    /**
     * Creates an accessible focus trap inside an element
     * Useful for modals and dropdown menus
     * 
     * @param {HTMLElement} element - The element to trap focus within
     * @return {Object} - Methods to activate and deactivate the trap
     */
    createFocusTrap(element) {
      if (!element) return;

      // Find all focusable elements
      const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];
      let currentFocus = null;
      
      const handleKeyDown = (e) => {
        if (e.key !== 'Tab') return;
        
        // Handle tabbing
        if (e.shiftKey) { // Shift + Tab
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else { // Tab
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      };
      
      return {
        activate() {
          currentFocus = document.activeElement;
          element.addEventListener('keydown', handleKeyDown);
          firstFocusable.focus();
        },
        deactivate() {
          element.removeEventListener('keydown', handleKeyDown);
          if (currentFocus) currentFocus.focus();
        }
      };
    },
    
    /**
     * Checks if an element is in the viewport
     * 
     * @param {HTMLElement} element - The element to check
     * @param {number} offset - Optional offset from the viewport edge
     * @return {boolean} - Whether the element is in the viewport
     */
    isInViewport(element, offset = 0) {
      if (!element) return false;
      
      const rect = element.getBoundingClientRect();
      return (
        rect.top <= (window.innerHeight - offset) &&
        rect.bottom >= offset &&
        rect.left <= (window.innerWidth - offset) &&
        rect.right >= offset
      );
    },
    
    /**
     * Sanitizes user input to prevent XSS attacks
     * 
     * @param {string} input - The input to sanitize
     * @return {string} - The sanitized input
     */
    sanitizeInput(input) {
      const element = document.createElement('div');
      element.textContent = input;
      return element.innerHTML;
    },

    /**
     * Formats a date object to a readable string
     * 
     * @param {Date} date - The date to format
     * @param {Object} options - Formatting options for Intl.DateTimeFormat
     * @return {string} - The formatted date string
     */
    formatDate(date, options = {}) {
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
    },
    
    /**
     * Validates an email address using a regex pattern
     * 
     * @param {string} email - The email to validate
     * @return {boolean} - Whether the email is valid
     */
    isValidEmail(email) {
      const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return pattern.test(email);
    },
    
    /**
     * Validates a phone number using a regex pattern
     * Pattern supports Australian phone numbers
     * 
     * @param {string} phone - The phone number to validate
     * @return {boolean} - Whether the phone number is valid
     */
    isValidPhone(phone) {
      const pattern = /^(?:\+61|0)[2-478](?:[ -]?[0-9]){8}$/;
      return pattern.test(phone.replace(/\s+/g, ''));
    },
    
    /**
     * Validates a postal code using a regex pattern
     * Pattern supports Australian postal codes
     * 
     * @param {string} postalCode - The postal code to validate
     * @return {boolean} - Whether the postal code is valid
     */
    isValidPostalCode(postalCode) {
      const pattern = /^\d{4}$/;
      return pattern.test(postalCode);
    },

    /**
     * Gets a value from localStorage with JSON parsing
     * 
     * @param {string} key - The key to get
     * @param {*} defaultValue - The default value if the key doesn't exist
     * @return {*} - The value from localStorage, or the default value
     */
    getFromStorage(key, defaultValue = null) {
      if (!supportsLocalStorage) return defaultValue;
      
      try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : defaultValue;
      } catch (error) {
        console.error('Error getting from localStorage:', error);
        return defaultValue;
      }
    },
    
    /**
     * Sets a value in localStorage with JSON stringification
     * 
     * @param {string} key - The key to set
     * @param {*} value - The value to set
     * @return {boolean} - Whether the operation was successful
     */
    setToStorage(key, value) {
      if (!supportsLocalStorage) return false;
      
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.error('Error setting to localStorage:', error);
        return false;
      }
    },
    
    /**
     * Adds a class with transition for smoother animations
     * 
     * @param {HTMLElement} element - The element to add the class to
     * @param {string} className - The class to add
     */
    addClassWithTransition(element, className) {
      if (!element) return;
      
      // Use requestAnimationFrame to ensure the browser has painted first
      requestAnimationFrame(() => {
        element.classList.add(className);
      });
    },
    
    /**
     * Removes a class with transition for smoother animations
     * 
     * @param {HTMLElement} element - The element to remove the class from
     * @param {string} className - The class to remove
     */
    removeClassWithTransition(element, className) {
      if (!element) return;
      
      element.classList.remove(className);
    }
  };

  /**
   * Navigation module - Handles the main navigation functionality
   */
  const Navigation = {
    /**
     * Initialize the navigation component
     */
    init() {
      this.mobileMenuToggle = document.getElementById('mobileMenuToggle');
      this.mainNavigation = document.getElementById('main-navigation');
      
      if (!this.mobileMenuToggle || !this.mainNavigation) return;
      
      // Add event listeners
      this.mobileMenuToggle.addEventListener('click', this.toggleMobileMenu.bind(this));
      
      // Close mobile menu when clicking outside
      document.addEventListener('click', (event) => {
        const isClickInside = this.mobileMenuToggle.contains(event.target) || 
                              this.mainNavigation.contains(event.target);
        
        if (!isClickInside && this.mainNavigation.classList.contains('active')) {
          this.closeMobileMenu();
        }
      });
      
      // Close mobile menu on window resize
      window.addEventListener('resize', Utils.debounce(() => {
        if (window.innerWidth > 768 && this.mainNavigation.classList.contains('active')) {
          this.closeMobileMenu();
        }
      }, 100));
      
      // Create focus trap for mobile menu
      this.focusTrap = Utils.createFocusTrap(this.mainNavigation);
    },
    
    /**
     * Toggle the mobile menu open/closed state
     */
    toggleMobileMenu() {
      const isExpanded = this.mobileMenuToggle.getAttribute('aria-expanded') === 'true';
      
      if (isExpanded) {
        this.closeMobileMenu();
      } else {
        this.openMobileMenu();
      }
    },
    
    /**
     * Open the mobile menu
     */
    openMobileMenu() {
      this.mobileMenuToggle.setAttribute('aria-expanded', 'true');
      this.mainNavigation.classList.add('active');
      
      // Activate focus trap
      if (this.focusTrap) {
        this.focusTrap.activate();
      }
      
      // Prevent body scrolling
      document.body.style.overflow = 'hidden';
    },
    
    /**
     * Close the mobile menu
     */
    closeMobileMenu() {
      this.mobileMenuToggle.setAttribute('aria-expanded', 'false');
      this.mainNavigation.classList.remove('active');
      
      // Deactivate focus trap
      if (this.focusTrap) {
        this.focusTrap.deactivate();
      }
      
      // Re-enable body scrolling
      document.body.style.overflow = '';
    }
  };

  /**
   * Smooth Scroll module - Handles smooth scrolling to anchors
   */
  const SmoothScroll = {
    /**
     * Initialize the smooth scroll functionality
     */
    init() {
      // Only initialize if not using native smooth scrolling
      if ('scrollBehavior' in document.documentElement.style) return;
      
      // Handle all internal links
      document.addEventListener('click', (event) => {
        const link = event.target.closest('a[href^="#"]:not([href="#"])');
        if (!link) return;
        
        const targetId = link.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
          event.preventDefault();
          this.scrollToElement(targetElement);
        }
      });
    },
    
    /**
     * Scroll to an element smoothly
     * 
     * @param {HTMLElement} element - The element to scroll to
     * @param {number} offset - Optional offset from the top of the element
     * @param {number} duration - Optional duration of the scroll animation
     */
    scrollToElement(element, offset = 80, duration = 500) {
      const startPosition = window.pageYOffset;
      const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;
      const distance = targetPosition - startPosition;
      let startTime = null;
      
      function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);
        const ease = easeInOutCubic(progress);
        
        window.scrollTo(0, startPosition + distance * ease);
        
        if (timeElapsed < duration) {
          requestAnimationFrame(animation);
        }
      }
      
      // Easing function
      function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      }
      
      requestAnimationFrame(animation);
    }
  };

  /**
   * LazyLoad module - Handles lazy loading of images and other content
   * Uses intersection observer for performance instead of scroll events
   */
  const LazyLoad = {
    /**
     * Initialize the lazy loading functionality
     */
    init() {
      if (!supportsIntersectionObserver) {
        this.loadAllLazy();
        return;
      }
      
      this.lazyImages = document.querySelectorAll('img[loading="lazy"], img[data-src]');
      this.lazyIframes = document.querySelectorAll('iframe[loading="lazy"], iframe[data-src]');
      this.lazyBackgrounds = document.querySelectorAll('[data-background]');
      
      // Create observer for images and iframes
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.loadItem(entry.target);
            this.observer.unobserve(entry.target);
          }
        });
      }, {
        rootMargin: '200px 0px', // Load 200px before it comes into view
        threshold: 0.01
      });
      
      // Observe all lazy items
      this.lazyImages.forEach(img => this.observer.observe(img));
      this.lazyIframes.forEach(iframe => this.observer.observe(iframe));
      this.lazyBackgrounds.forEach(element => this.observer.observe(element));
    },
    
    /**
     * Load a specific item (image, iframe, or background)
     * 
     * @param {HTMLElement} item - The item to load
     */
    loadItem(item) {
      // Handle images
      if (item.tagName === 'IMG' && item.dataset.src) {
        // Set all attributes
        item.src = item.dataset.src;
        
        if (item.dataset.srcset) {
          item.srcset = item.dataset.srcset;
        }
        
        item.removeAttribute('data-src');
        item.removeAttribute('data-srcset');
        
        // Add a loaded class for potential animations
        item.classList.add('loaded');
        
        // Dispatch a custom event when image is loaded
        item.addEventListener('load', () => {
          item.dispatchEvent(new CustomEvent('lazyloaded', { bubbles: true }));
        });
      }
      
      // Handle iframes
      else if (item.tagName === 'IFRAME' && item.dataset.src) {
        item.src = item.dataset.src;
        item.removeAttribute('data-src');
        item.classList.add('loaded');
      }
      
      // Handle background images
      else if (item.dataset.background) {
        item.style.backgroundImage = `url('${item.dataset.background}')`;
        item.removeAttribute('data-background');
        item.classList.add('loaded');
      }
    },
    
    /**
     * Load all lazy items at once (fallback for browsers without IntersectionObserver)
     */
    loadAllLazy() {
      // Load all lazy images
      document.querySelectorAll('img[data-src]').forEach(img => {
        img.src = img.dataset.src;
        if (img.dataset.srcset) {
          img.srcset = img.dataset.srcset;
        }
        img.removeAttribute('data-src');
        img.removeAttribute('data-srcset');
        img.classList.add('loaded');
      });
      
      // Load all lazy iframes
      document.querySelectorAll('iframe[data-src]').forEach(iframe => {
        iframe.src = iframe.dataset.src;
        iframe.removeAttribute('data-src');
        iframe.classList.add('loaded');
      });
      
      // Load all lazy backgrounds
      document.querySelectorAll('[data-background]').forEach(element => {
        element.style.backgroundImage = `url('${element.dataset.background}')`;
        element.removeAttribute('data-background');
        element.classList.add('loaded');
      });
    }
  };

  /**
   * Testimonials module - Handles the testimonial carousel functionality
   */
  const Testimonials = {
    /**
     * Initialize the testimonial carousel
     */
    init() {
      this.carousel = document.querySelector('.testimonial-carousel');
      if (!this.carousel) return;
      
      this.testimonials = Array.from(this.carousel.querySelectorAll('.testimonial'));
      if (this.testimonials.length <= 1) return;
      
      // Create carousel UI elements if they don't exist
      this.createCarouselControls();
      
      // Initialize state
      this.currentIndex = 0;
      this.isAnimating = false;
      this.autoplayInterval = null;
      this.touchStartX = 0;
      
      // Add event listeners
      this.prevButton.addEventListener('click', this.prevSlide.bind(this));
      this.nextButton.addEventListener('click', this.nextSlide.bind(this));
      
      // Touch events for mobile
      this.carousel.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
      this.carousel.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
      
      // Pause autoplay on hover
      this.carousel.addEventListener('mouseenter', this.pauseAutoplay.bind(this));
      this.carousel.addEventListener('mouseleave', this.startAutoplay.bind(this));
      
      // Focus events for accessibility
      this.carousel.addEventListener('focusin', this.pauseAutoplay.bind(this));
      this.carousel.addEventListener('focusout', this.startAutoplay.bind(this));
      
      // Start autoplay
      this.startAutoplay();
      
      // Initialize first slide
      this.goToSlide(0);
      
      // Watch for intersection to pause when not visible
      if (supportsIntersectionObserver) {
        const observer = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting) {
            this.startAutoplay();
          } else {
            this.pauseAutoplay();
          }
        }, { threshold: 0.5 });
        
        observer.observe(this.carousel);
      }
    },
    
    /**
     * Create carousel control elements if they don't exist already
     */
    createCarouselControls() {
      // Check if controls already exist
      if (document.querySelector('.carousel-controls')) {
        this.prevButton = document.querySelector('.carousel-arrow.prev-arrow');
        this.nextButton = document.querySelector('.carousel-arrow.next-arrow');
        this.dots = Array.from(document.querySelectorAll('.carousel-dot'));
        return;
      }
      
      // Create container for controls
      const controlsContainer = document.createElement('div');
      controlsContainer.className = 'carousel-controls';
      
      // Create navigation buttons
      this.prevButton = document.createElement('button');
      this.prevButton.className = 'carousel-arrow prev-arrow';
      this.prevButton.setAttribute('aria-label', 'Previous testimonial');
      this.prevButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
        </svg>
      `;
      
      this.nextButton = document.createElement('button');
      this.nextButton.className = 'carousel-arrow next-arrow';
      this.nextButton.setAttribute('aria-label', 'Next testimonial');
      this.nextButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
        </svg>
      `;
      
      // Create dots container
      const dotsContainer = document.createElement('div');
      dotsContainer.className = 'carousel-dots';
      
      // Create dot for each slide
      this.dots = this.testimonials.map((_, index) => {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot';
        dot.setAttribute('aria-label', `Go to testimonial ${index + 1}`);
        dot.addEventListener('click', () => this.goToSlide(index));
        dotsContainer.appendChild(dot);
        return dot;
      });
      
      // Add everything to the controls container
      controlsContainer.appendChild(this.prevButton);
      controlsContainer.appendChild(dotsContainer);
      controlsContainer.appendChild(this.nextButton);
      
      // Add controls after the carousel
      this.carousel.parentNode.insertBefore(controlsContainer, this.carousel.nextSibling);
    },
    
    /**
     * Go to the previous slide
     */
    prevSlide() {
      if (this.isAnimating) return;
      
      const newIndex = (this.currentIndex - 1 + this.testimonials.length) % this.testimonials.length;
      this.goToSlide(newIndex);
    },
    
    /**
     * Go to the next slide
     */
    nextSlide() {
      if (this.isAnimating) return;
      
      const newIndex = (this.currentIndex + 1) % this.testimonials.length;
      this.goToSlide(newIndex);
    },
    
    /**
     * Go to a specific slide by index
     * 
     * @param {number} index - The index of the slide to go to
     */
    goToSlide(index) {
      if (this.isAnimating || index === this.currentIndex) return;
      
      this.isAnimating = true;
      
      // Update dots
      this.dots.forEach((dot, i) => {
        if (i === index) {
          dot.classList.add('active');
          dot.setAttribute('aria-current', 'true');
        } else {
          dot.classList.remove('active');
          dot.removeAttribute('aria-current');
        }
      });
      
      // Get the positions
      const currentSlide = this.testimonials[this.currentIndex];
      const targetSlide = this.testimonials[index];
      
      // Set aria attributes for accessibility
      currentSlide.setAttribute('aria-hidden', 'true');
      targetSlide.setAttribute('aria-hidden', 'false');
      
      // Update the current index
      this.currentIndex = index;
      
      // Scroll to the new slide
      targetSlide.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
      
      // Reset animation lock after transition completes
      setTimeout(() => {
        this.isAnimating = false;
      }, 500);
    },
    
    /**
     * Handle touch start event for swipe gestures
     * 
     * @param {TouchEvent} event - The touch event
     */
    handleTouchStart(event) {
      this.touchStartX = event.touches[0].clientX;
      this.pauseAutoplay(); // Pause autoplay when user interacts
    },
    
    /**
     * Handle touch end event for swipe gestures
     * 
     * @param {TouchEvent} event - The touch event
     */
    handleTouchEnd(event) {
      const touchEndX = event.changedTouches[0].clientX;
      const diffX = this.touchStartX - touchEndX;
      
      // Swipe detection with threshold
      if (Math.abs(diffX) > 50) {
        if (diffX > 0) {
          this.nextSlide(); // Swipe left
        } else {
          this.prevSlide(); // Swipe right
        }
      }
      
      // Resume autoplay after a short delay
      setTimeout(() => {
        this.startAutoplay();
      }, 5000);
    },
    
    /**
     * Start autoplay functionality
     */
    startAutoplay() {
      // Clear any existing interval
      this.pauseAutoplay();
      
      // Set new interval
      this.autoplayInterval = setInterval(() => {
        this.nextSlide();
      }, 5000);
    },
    
    /**
     * Pause autoplay functionality
     */
    pauseAutoplay() {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = null;
    }
  };

  /**
   * Accordion module - Handles the accordion functionality
   * Uses a singleton pattern for efficient event delegation
   */
  const Accordion = {
    /**
     * Initialize the accordion functionality
     */
    init() {
      this.accordions = document.querySelectorAll('.accordion');
      if (!this.accordions.length) return;
      
      // Use event delegation for better performance
      this.accordions.forEach(accordion => {
        accordion.addEventListener('click', this.handleClick.bind(this));
      });
      
      // Check for any accordions that should be open by default
      this.accordions.forEach(accordion => {
        const defaultOpenItem = accordion.querySelector('.accordion-trigger[data-default-open="true"]');
        if (defaultOpenItem) {
          this.toggleAccordion(defaultOpenItem);
        }
      });
    },
    
    /**
     * Handle click events on accordion items
     * 
     * @param {Event} event - The click event
     */
    handleClick(event) {
      const trigger = event.target.closest('.accordion-trigger');
      if (!trigger) return;
      
      this.toggleAccordion(trigger);
    },
    
    /**
     * Toggle the accordion open/closed state
     * 
     * @param {HTMLElement} trigger - The accordion trigger element
     */
    toggleAccordion(trigger) {
      const content = document.getElementById(trigger.getAttribute('aria-controls'));
      if (!content) return;
      
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
      
      // If the accordion group should only have one open item at a time
      const accordionGroup = trigger.closest('.accordion');
      if (accordionGroup && accordionGroup.getAttribute('data-allow-multiple') !== 'true') {
        // Close other open items in the same group
        const openTriggers = accordionGroup.querySelectorAll('.accordion-trigger[aria-expanded="true"]');
        openTriggers.forEach(openTrigger => {
          if (openTrigger !== trigger) {
            openTrigger.setAttribute('aria-expanded', 'false');
            const openContent = document.getElementById(openTrigger.getAttribute('aria-controls'));
            if (openContent) {
              openContent.setAttribute('hidden', '');
            }
          }
        });
      }
      
      // Toggle current item
      trigger.setAttribute('aria-expanded', !isExpanded);
      
      if (isExpanded) {
        content.setAttribute('hidden', '');
      } else {
        content.removeAttribute('hidden');
        
        // Scroll content into view if not fully visible
        setTimeout(() => {
          if (!Utils.isInViewport(content)) {
            content.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 100);
      }
    }
  };

  /**
   * Tabs module - Handles tab interface functionality
   */
  const Tabs = {
    /**
     * Initialize the tabs functionality
     */
    init() {
      this.tabContainers = document.querySelectorAll('.tabs');
      if (!this.tabContainers.length) return;
      
      this.tabContainers.forEach(container => {
        const tabList = container.querySelector('.tab-list');
        const tabButtons = container.querySelectorAll('.tab-button');
        const tabPanels = container.querySelectorAll('.tab-panel');
        
        if (!tabList || !tabButtons.length || !tabPanels.length) return;
        
        // Setup tab buttons
        tabButtons.forEach((button, index) => {
          // Set attributes for accessibility
          button.setAttribute('role', 'tab');
          button.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
          button.setAttribute('id', button.id || `tab-${Math.random().toString(36).substring(2, 9)}`);
          button.setAttribute('tabindex', index === 0 ? '0' : '-1');
          
          // Find the corresponding panel
          const panel = tabPanels[index];
          if (panel) {
            const panelId = panel.id || `panel-${Math.random().toString(36).substring(2, 9)}`;
            panel.setAttribute('id', panelId);
            panel.setAttribute('role', 'tabpanel');
            panel.setAttribute('aria-labelledby', button.id);
            panel.setAttribute('tabindex', '0');
            
            if (index !== 0) {
              panel.setAttribute('hidden', '');
            }
            
            // Link button to panel
            button.setAttribute('aria-controls', panelId);
          }
          
          // Add click event
          button.addEventListener('click', (event) => {
            this.switchTab(container, event.target);
          });
          
          // Add keyboard navigation
          button.addEventListener('keydown', (event) => {
            this.handleTabKeyboard(container, event);
          });
        });
        
        // Set ARIA attributes on the tablist
        tabList.setAttribute('role', 'tablist');
        tabList.querySelectorAll('div, span').forEach(item => {
          item.setAttribute('role', 'presentation');
        });
      });
    },
    
    /**
     * Switch to a specific tab
     * 
     * @param {HTMLElement} container - The tabs container
     * @param {HTMLElement} selectedTab - The tab to switch to
     */
    switchTab(container, selectedTab) {
      const tabs = Array.from(container.querySelectorAll('.tab-button'));
      const panels = Array.from(container.querySelectorAll('.tab-panel'));
      
      // Update selected state for all tabs
      tabs.forEach(tab => {
        const isSelected = tab === selectedTab;
        tab.setAttribute('aria-selected', isSelected);
        tab.setAttribute('tabindex', isSelected ? '0' : '-1');
        
        // For styling
        if (isSelected) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });
      
      // Show the selected panel, hide others
      panels.forEach(panel => {
        if (panel.getAttribute('aria-labelledby') === selectedTab.id) {
          panel.removeAttribute('hidden');
          panel.classList.add('active');
        } else {
          panel.setAttribute('hidden', '');
          panel.classList.remove('active');
        }
      });
      
      // Focus the selected tab (for keyboard users)
      selectedTab.focus();
    },
    
    /**
     * Handle keyboard navigation for tabs
     * 
     * @param {HTMLElement} container - The tabs container
     * @param {KeyboardEvent} event - The keyboard event
     */
    handleTabKeyboard(container, event) {
      const tabs = Array.from(container.querySelectorAll('.tab-button'));
      const currentIndex = tabs.findIndex(tab => tab === event.target);
      
      let newIndex;
      
      switch (event.key) {
        case 'ArrowRight':
          newIndex = (currentIndex + 1) % tabs.length;
          break;
        case 'ArrowLeft':
          newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
          break;
        case 'Home':
          newIndex = 0;
          break;
        case 'End':
          newIndex = tabs.length - 1;
          break;
        default:
          return;
      }
      
      // Prevent default for arrow keys to avoid scrolling
      event.preventDefault();
      
      // Switch to the new tab
      this.switchTab(container, tabs[newIndex]);
    }
  };

  /**
   * Notification module - Handles notification/alert messages
   */
  const Notifications = {
    /**
     * Initialize notification functionality
     */
    init() {
      this.container = document.createElement('div');
      this.container.className = 'notification-container';
      document.body.appendChild(this.container);
      
      // Close notification when clicking on close button (event delegation)
      this.container.addEventListener('click', (event) => {
        if (event.target.closest('.notification-close')) {
          const notification = event.target.closest('.notification');
          if (notification) {
            this.closeNotification(notification);
          }
        }
      });
    },
    
    /**
     * Show a notification
     * 
     * @param {string} message - The notification message
     * @param {string} type - The notification type (success, error, info, warning)
     * @param {number} duration - Duration in milliseconds to show the notification
     * @return {HTMLElement} - The notification element
     */
    show(message, type = 'info', duration = 5000) {
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      notification.setAttribute('role', 'alert');
      
      notification.innerHTML = `
        <div class="notification-content">
          <div class="notification-message">${message}</div>
          <button class="notification-close" aria-label="Close notification">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      `;
      
      // Add to the DOM
      this.container.appendChild(notification);
      
      // Trigger animation
      requestAnimationFrame(() => {
        notification.classList.add('show');
      });
      
      // Auto-close after duration
      if (duration > 0) {
        notification.timeout = setTimeout(() => {
          this.closeNotification(notification);
        }, duration);
      }
      
      return notification;
    },
    
    /**
     * Show a success notification
     * 
     * @param {string} message - The notification message
     * @param {number} duration - Duration in milliseconds to show the notification
     * @return {HTMLElement} - The notification element
     */
    success(message, duration = 5000) {
      return this.show(message, 'success', duration);
    },
    
    /**
     * Show an error notification
     * 
     * @param {string} message - The notification message
     * @param {number} duration - Duration in milliseconds to show the notification
     * @return {HTMLElement} - The notification element
     */
    error(message, duration = 5000) {
      return this.show(message, 'error', duration);
    },
    
    /**
     * Show a warning notification
     * 
     * @param {string} message - The notification message
     * @param {number} duration - Duration in milliseconds to show the notification
     * @return {HTMLElement} - The notification element
     */
    warning(message, duration = 5000) {
      return this.show(message, 'warning', duration);
    },
    
    /**
     * Show an info notification
     * 
     * @param {string} message - The notification message
     * @param {number} duration - Duration in milliseconds to show the notification
     * @return {HTMLElement} - The notification element
     */
    info(message, duration = 5000) {
      return this.show(message, 'info', duration);
    },
    
    /**
     * Close a notification
     * 
     * @param {HTMLElement} notification - The notification element
     */
    closeNotification(notification) {
      // Clear timeout if exists
      if (notification.timeout) {
        clearTimeout(notification.timeout);
      }
      
      // Trigger closing animation
      notification.classList.remove('show');
      notification.classList.add('hide');
      
      // Remove from DOM after animation
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300); // Match transition duration in CSS
    },
    
    /**
     * Close all notifications
     */
    closeAll() {
      const notifications = document.querySelectorAll('.notification');
      notifications.forEach(notification => {
        this.closeNotification(notification);
      });
    }
  };

  /**
   * Initialize all modules when the DOM is ready
   */
  document.addEventListener('DOMContentLoaded', () => {
    // Initialize all modules
    Navigation.init();
    SmoothScroll.init();
    LazyLoad.init();
    Testimonials.init();
    Accordion.init();
    Tabs.init();
    Notifications.init();
    
    // Check if there's a hash in the URL and scroll to that element
    if (window.location.hash) {
      const targetElement = document.querySelector(window.location.hash);
      if (targetElement) {
        setTimeout(() => {
          SmoothScroll.scrollToElement(targetElement);
        }, 500);
      }
    }
    
    // Export utilities to window for use in other scripts if needed
    window.LXUtils = Utils;
    window.LXNotifications = Notifications;
  });

  /**
   * Handle errors globally
   */
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    // Only show error notifications in development mode
    if (process.env.NODE_ENV === 'development') {
      Notifications.error(`An error occurred: ${event.error.message}`);
    }
  });

  /**
   * Mark page as loaded for potential CSS transitions
   */
  window.addEventListener('load', () => {
    document.documentElement.classList.add('page-loaded');
    
    // Initialize performance metrics logging
    if (window.performance && process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.info(`Page loaded in ${pageLoadTime}ms`);
      }, 0);
    }
  });

})();