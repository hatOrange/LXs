// scripts.js - Main JavaScript functionality
document.addEventListener('DOMContentLoaded', () => {
  // Mobile menu toggle
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const mainNav = document.querySelector('.main-nav ul');

  if (mobileMenuToggle && mainNav) {
    mobileMenuToggle.addEventListener('click', () => {
      mainNav.classList.toggle('active');
      mobileMenuToggle.setAttribute('aria-expanded',
        mobileMenuToggle.getAttribute('aria-expanded') === 'true' ? 'false' : 'true'
      );
    });
  }

  // Smooth scrolling for internal links
  const links = document.querySelectorAll('a[href^="#"]:not([href="#"])');
  for (let link of links) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const target = document.querySelector(targetId);
      if (target) {
        // Close mobile menu if open
        if (mainNav && mainNav.classList.contains('active')) {
          mainNav.classList.remove('active');
          if (mobileMenuToggle) {
            mobileMenuToggle.setAttribute('aria-expanded', 'false');
          }
        }

        // Scroll to target
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });

        // Update URL hash
        history.pushState(null, null, targetId);
      }
    });
  }

  // Form validation and submission
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Basic form validation
      const requiredFields = form.querySelectorAll('[required]');
      let isValid = true;

      requiredFields.forEach(field => {
        // Reset previous error state
        field.classList.remove('error');
        const errorMsg = field.parentNode.querySelector('.error-message');
        if (errorMsg) errorMsg.remove();

        if (!field.value.trim()) {
          isValid = false;
          field.classList.add('error');

          // Add error message
          const message = document.createElement('span');
          message.className = 'error-message';
          message.textContent = `${field.getAttribute('placeholder') || 'This field'} is required`;
          field.parentNode.appendChild(message);
        } else if (field.type === 'email' && !isValidEmail(field.value)) {
          isValid = false;
          field.classList.add('error');

          // Add error message
          const message = document.createElement('span');
          message.className = 'error-message';
          message.textContent = 'Please enter a valid email address';
          field.parentNode.appendChild(message);
        }
      });

      if (!isValid) return;

      // Show loading state
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      try {
        // Get form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Send data to backend
        const endpoint = form.getAttribute('action');
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
          // Success message
          form.reset();
          showNotification('Success!', result.message || 'Your request has been submitted successfully.', 'success');
        } else {
          // Error handling
          showNotification('Error', result.message || 'There was a problem submitting your request.', 'error');
        }
      } catch (error) {
        console.error('Form submission error:', error);
        showNotification('Error', 'Unable to connect to the server. Please try again later.', 'error');
      } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    });
  });

  // Testimonial carousel functionality
  const testimonialCarousel = document.querySelector('.testimonial-carousel');
  if (testimonialCarousel && testimonialCarousel.children.length > 1) {
    let currentIndex = 0;
    const testimonials = Array.from(testimonialCarousel.children);
    const totalTestimonials = testimonials.length;

    // Add navigation buttons
    const navContainer = document.createElement('div');
    navContainer.className = 'carousel-nav';

    const prevButton = document.createElement('button');
    prevButton.innerHTML = '&lsaquo;';
    prevButton.setAttribute('aria-label', 'Previous testimonial');

    const nextButton = document.createElement('button');
    nextButton.innerHTML = '&rsaquo;';
    nextButton.setAttribute('aria-label', 'Next testimonial');

    navContainer.appendChild(prevButton);
    navContainer.appendChild(nextButton);
    testimonialCarousel.parentNode.appendChild(navContainer);

    // Add indicators
    const indicators = document.createElement('div');
    indicators.className = 'carousel-indicators';

    for (let i = 0; i < totalTestimonials; i++) {
      const dot = document.createElement('button');
      dot.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
      dot.setAttribute('data-index', i);
      if (i === 0) dot.classList.add('active');

      dot.addEventListener('click', () => {
        goToSlide(i);
      });

      indicators.appendChild(dot);
    }

    testimonialCarousel.parentNode.appendChild(indicators);

    // Navigation functionality
    prevButton.addEventListener('click', () => {
      goToSlide((currentIndex - 1 + totalTestimonials) % totalTestimonials);
    });

    nextButton.addEventListener('click', () => {
      goToSlide((currentIndex + 1) % totalTestimonials);
    });

    // Auto-advance carousel
    let intervalId = setInterval(() => {
      goToSlide((currentIndex + 1) % totalTestimonials);
    }, 5000);

    // Pause on hover
    testimonialCarousel.addEventListener('mouseenter', () => {
      clearInterval(intervalId);
    });

    testimonialCarousel.addEventListener('mouseleave', () => {
      intervalId = setInterval(() => {
        goToSlide((currentIndex + 1) % totalTestimonials);
      }, 5000);
    });

    function goToSlide(index) {
      // Update active slide
      currentIndex = index;
      testimonialCarousel.scrollTo({
        left: testimonials[index].offsetLeft,
        behavior: 'smooth'
      });

      // Update indicators
      const dots = indicators.querySelectorAll('button');
      dots.forEach((dot, i) => {
        if (i === index) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
    }
  }

  // Initialize Google Maps with lazy loading
  const mapElement = document.getElementById('map');
  if (mapElement) {
    const mapObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadGoogleMaps();
          mapObserver.disconnect();
        }
      });
    }, { threshold: 0.1 });

    mapObserver.observe(mapElement);
  }
  // Modify form submission handler to parse backend validation errors
  // Replace the existing form submission code with:
  forms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Reset errors
      form.querySelectorAll('.error').forEach(field => field.classList.remove('error'));
      form.querySelectorAll('.error-message').forEach(msg => msg.remove());

      try {
        // ... existing code ...

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) throw result;

        // Success handling...
      } catch (error) {
        if (error.errors) { // Handle backend validation errors
          error.errors.forEach(err => {
            const field = form.querySelector(`[name="${err.param}"]`);
            if (field) {
              field.classList.add('error');
              const message = document.createElement('span');
              message.className = 'error-message';
              message.textContent = err.msg;
              field.parentNode.appendChild(message);
            }
          });
        }
        // ... existing error handling ...
      }
    });
  });
  // Mobile Menu Improvement
  function toggleMobileMenu() {
    const expanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
    mobileMenuToggle.setAttribute('aria-expanded', !expanded);
    mainNav.classList.toggle('active');
  }

  // Touch Support for Carousel
  let touchStartX = 0;
  testimonialCarousel.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  }, false);

  testimonialCarousel.addEventListener('touchend', e => {
    const touchEndX = e.changedTouches[0].clientX;
    if (touchStartX - touchEndX > 50) nextTestimonial();
    if (touchStartX - touchEndX < -50) prevTestimonial();
  });

  // Lazy load images
  const lazyImages = document.querySelectorAll('img[data-src]');
  if (lazyImages.length > 0) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    }, { threshold: 0.1 });

    lazyImages.forEach(img => {
      imageObserver.observe(img);
    });
  }

  // Utility functions
  function isValidEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  function showNotification(title, message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <h4>${title}</h4>
      <p>${message}</p>
      <button class="close-notification" aria-label="Close notification">&times;</button>
    `;

    document.body.appendChild(notification);

    // Show notification (with animation)
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    // Auto-hide after 5 seconds
    const hideTimeout = setTimeout(() => {
      hideNotification(notification);
    }, 5000);

    // Close button functionality
    const closeBtn = notification.querySelector('.close-notification');
    closeBtn.addEventListener('click', () => {
      clearTimeout(hideTimeout);
      hideNotification(notification);
    });
  }

  function hideNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300); // Match the CSS transition duration
  }

  function loadGoogleMaps() {
    const mapScript = document.createElement('script');
    mapScript.src = 'https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap';
    mapScript.async = true;
    mapScript.defer = true;
    document.body.appendChild(mapScript);

    // Global function for the callback
    window.initMap = function () {
      const mapElement = document.getElementById('map');
      if (mapElement) {
        // Company location - Adelaide office coordinates
        const officeLocation = { lat: -34.9483, lng: 138.5747 }; // North Plympton, SA
        const map = new google.maps.Map(mapElement, {
          zoom: 15,
          center: officeLocation,
          styles: [
            // Custom map styles can be added here
          ]
        });

        // Add marker for the office
        new google.maps.Marker({
          position: officeLocation,
          map: map,
          title: 'LX Pest Solutions',
          animation: google.maps.Animation.DROP
        });
      }
    };
  }
});