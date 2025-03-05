/**
 * LX Pest Solutions - Maps Integration
 * Version: 1.0.0
 * 
 * Performance-optimized Google Maps implementation with:
 * - Lazy loading (loads only when map is visible in viewport)
 * - Deferred initialization
 * - Memory leak prevention
 * - Custom styled map with reduced network payload
 * - Graceful degradation when Maps API is unavailable
 * - Optimized marker rendering
 * 
 * @module MapIntegration
 * @requires IntersectionObserver
 */

/**
 * Map Integration module
 * Implements lazy-loaded maps with IntersectionObserver API
 */
const MapIntegration = (function() {
    'use strict';
    
    // Configuration parameters
    const CONFIG = {
      apiKey: 'YOUR_API_KEY', // Replace with actual key in production
      mapCenter: { lat: -34.9483, lng: 138.5747 }, // North Plympton, Adelaide
      zoom: 15,
      markerIcon: '/images/map-marker.svg',
      companyName: 'LX Pest Solutions',
      address: '56 Deeds Road, North Plympton, SA 5037',
      phone: '08 8371 1277',
      email: 'info@lxpestsolutions.com.au'
    };
    
    // Private variables
    let mapInstance = null;
    let observer = null;
    let mapContainer = null;
    let loadingIndicator = null;
    let mapInitialized = false;
    let apiLoadPromise = null;
    
    /**
     * Initialize the map integration
     * @param {string} containerId - The ID of the map container element
     * @returns {Promise} - Resolves when initialization is complete
     */
    async function init(containerId = 'map') {
      // Locate map container
      mapContainer = document.getElementById(containerId);
      if (!mapContainer) {
        console.warn('Map container not found:', containerId);
        return Promise.resolve(false);
      }
      
      // Create loading indicator if it doesn't exist
      loadingIndicator = document.getElementById('mapLoading');
      if (!loadingIndicator) {
        loadingIndicator = createLoadingIndicator();
        mapContainer.parentNode.insertBefore(loadingIndicator, mapContainer);
      }
      
      // Use intersection observer for lazy loading
      if ('IntersectionObserver' in window) {
        observer = createObserver();
        observer.observe(mapContainer);
        return Promise.resolve(true);
      } else {
        // Fallback for browsers without IntersectionObserver
        console.info('IntersectionObserver not supported, loading map immediately');
        return loadMap();
      }
    }
    
    /**
     * Create an intersection observer for lazy loading
     * @returns {IntersectionObserver} - Configured observer instance
     */
    function createObserver() {
      return new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !mapInitialized) {
            loadMap();
            observer.disconnect();
          }
        });
      }, {
        rootMargin: '200px 0px', // Start loading when map is 200px from viewport
        threshold: 0.1
      });
    }
    
    /**
     * Load the Google Maps API and initialize the map
     * Uses a promise to prevent multiple API loads
     * @returns {Promise} - Resolves when map is loaded and initialized
     */
    function loadMap() {
      // Return existing promise if already loading
      if (apiLoadPromise) return apiLoadPromise;
      
      // Create a new promise for API loading
      apiLoadPromise = new Promise((resolve, reject) => {
        // Show loading indicator
        if (loadingIndicator) {
          loadingIndicator.style.display = 'flex';
        }
        
        // Create fail-safe timeout to handle API loading failures
        const timeoutId = setTimeout(() => {
          if (!window.google || !window.google.maps) {
            handleMapError(new Error('Google Maps API load timeout'));
            reject(new Error('Google Maps API load timeout'));
          }
        }, 10000); // 10-second timeout
        
        // Create global callback for Google Maps API
        window.initMap = function() {
          clearTimeout(timeoutId);
          try {
            initializeMap();
            resolve(true);
          } catch (error) {
            handleMapError(error);
            reject(error);
          }
        };
        
        // Load the API script
        loadMapsApi()
          .catch(error => {
            clearTimeout(timeoutId);
            handleMapError(error);
            reject(error);
          });
      });
      
      return apiLoadPromise;
    }
    
    /**
     * Load the Google Maps API script
     * @returns {Promise} - Resolves when script is loaded
     */
    function loadMapsApi() {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${CONFIG.apiKey}&callback=initMap`;
        script.async = true;
        script.defer = true;
        
        script.addEventListener('load', resolve);
        script.addEventListener('error', () => {
          reject(new Error('Failed to load Google Maps API'));
        });
        
        document.body.appendChild(script);
      });
    }
    
    /**
     * Initialize the map instance once API is loaded
     */
    function initializeMap() {
      if (!mapContainer || mapInitialized) return;
      
      // Create map with custom styling
      mapInstance = new google.maps.Map(mapContainer, {
        center: CONFIG.mapCenter,
        zoom: CONFIG.zoom,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        gestureHandling: 'cooperative',
        styles: getMapStyles()
      });
      
      // Add company marker
      addCompanyMarker();
      
      // Hide loading indicator after slight delay to ensure smooth transition
      setTimeout(() => {
        if (loadingIndicator) {
          loadingIndicator.style.display = 'none';
        }
      }, 300);
      
      // Add resize handler to fix map rendering issues
      let resizeTimer;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          if (mapInstance) {
            google.maps.event.trigger(mapInstance, 'resize');
            mapInstance.setCenter(CONFIG.mapCenter);
          }
        }, 250);
      });
      
      mapInitialized = true;
    }
    
    /**
     * Add company marker to the map with optimized rendering
     */
    function addCompanyMarker() {
      // Simple error handling
      if (!mapInstance || !google.maps) return;
      
      // Custom marker icon with size optimization
      const markerIcon = {
        url: CONFIG.markerIcon,
        scaledSize: new google.maps.Size(40, 40),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(20, 40)
      };
      
      // Create marker
      const marker = new google.maps.Marker({
        position: CONFIG.mapCenter,
        map: mapInstance,
        title: CONFIG.companyName,
        animation: google.maps.Animation.DROP,
        optimized: true, // Helps with rendering performance
        clickable: true,
        icon: markerIcon
      });
      
      // Create info window with company information
      const infoContent = `
        <div class="map-info-window">
          <h3>${CONFIG.companyName}</h3>
          <p>${CONFIG.address}</p>
          <p>
            <a href="tel:${CONFIG.phone.replace(/\s+/g, '')}">${CONFIG.phone}</a><br>
            <a href="mailto:${CONFIG.email}">${CONFIG.email}</a>
          </p>
          <a href="https://maps.google.com/maps?daddr=${CONFIG.mapCenter.lat},${CONFIG.mapCenter.lng}" 
             target="_blank" rel="noopener" class="directions-link">Get Directions</a>
        </div>
      `;
      
      const infoWindow = new google.maps.InfoWindow({
        content: infoContent,
        maxWidth: 300,
        pixelOffset: new google.maps.Size(0, -20)
      });
      
      // Add click listener to open info window
      marker.addListener('click', () => {
        infoWindow.open(mapInstance, marker);
      });
      
      // Open info window by default after a short delay
      setTimeout(() => {
        infoWindow.open(mapInstance, marker);
      }, 1000);
    }
    
    /**
     * Handle map loading errors gracefully
     * @param {Error} error - The error that occurred
     */
    function handleMapError(error) {
      console.error('Google Maps error:', error);
      
      // Hide loading indicator
      if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
      }
      
      // Show fallback content
      if (mapContainer) {
        const fallback = createFallbackContent();
        mapContainer.innerHTML = '';
        mapContainer.appendChild(fallback);
        mapContainer.style.height = 'auto';
        mapContainer.style.minHeight = '200px';
      }
      
      // Reset initialization flag to allow retry
      mapInitialized = false;
    }
    
    /**
     * Create a loading indicator element
     * @returns {HTMLElement} - The loading indicator element
     */
    function createLoadingIndicator() {
      const indicator = document.createElement('div');
      indicator.id = 'mapLoading';
      indicator.className = 'map-loading';
      indicator.innerHTML = `
        <div class="loading-spinner"></div>
        <p>Loading map...</p>
      `;
      
      // Style the loading indicator
      indicator.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #f5f5f5;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 1;
      `;
      
      return indicator;
    }
    
    /**
     * Create fallback content in case map fails to load
     * @returns {HTMLElement} - Fallback content element
     */
    function createFallbackContent() {
      const fallback = document.createElement('div');
      fallback.className = 'map-fallback';
      
      fallback.innerHTML = `
        <div class="map-fallback-content">
          <h3>${CONFIG.companyName}</h3>
          <p>${CONFIG.address}</p>
          <p>
            <a href="tel:${CONFIG.phone.replace(/\s+/g, '')}">${CONFIG.phone}</a><br>
            <a href="mailto:${CONFIG.email}">${CONFIG.email}</a>
          </p>
          <a href="https://maps.google.com/maps?q=${CONFIG.mapCenter.lat},${CONFIG.mapCenter.lng}" 
             target="_blank" rel="noopener" class="directions-link">
             View on Google Maps
          </a>
        </div>
      `;
      
      return fallback;
    }
    
    /**
     * Get custom map styles to reduce network payload and improve visuals
     * These styles remove unnecessary features and improve contrast
     * @returns {Array} - Array of map style objects
     */
    function getMapStyles() {
      return [
        {
          "featureType": "administrative",
          "elementType": "geometry",
          "stylers": [{"visibility": "simplified"}]
        },
        {
          "featureType": "poi",
          "stylers": [{"visibility": "off"}]
        },
        {
          "featureType": "poi.business",
          "stylers": [{"visibility": "off"}]
        },
        {
          "featureType": "poi.park",
          "elementType": "labels.text",
          "stylers": [{"visibility": "off"}]
        },
        {
          "featureType": "road",
          "elementType": "labels.icon",
          "stylers": [{"visibility": "off"}]
        },
        {
          "featureType": "transit",
          "stylers": [{"visibility": "off"}]
        },
        {
          "featureType": "water",
          "elementType": "geometry",
          "stylers": [{"color": "#e9e9e9"}]
        },
        {
          "featureType": "landscape",
          "elementType": "geometry",
          "stylers": [{"color": "#f5f5f5"}]
        },
        {
          "featureType": "road",
          "elementType": "geometry.fill",
          "stylers": [{"color": "#ffffff"}]
        },
        {
          "featureType": "road",
          "elementType": "geometry.stroke",
          "stylers": [{"color": "#dfdfdf"}]
        }
      ];
    }
    
    /**
     * Update map configuration with new values
     * Useful for dynamically changing map properties
     * @param {Object} newConfig - New configuration values
     */
    function updateConfig(newConfig) {
      Object.assign(CONFIG, newConfig);
      
      if (mapInstance && mapInitialized) {
        // Update center if it was changed
        if (newConfig.mapCenter) {
          mapInstance.setCenter(newConfig.mapCenter);
        }
        
        // Update zoom if it was changed
        if (newConfig.zoom) {
          mapInstance.setZoom(newConfig.zoom);
        }
      }
    }
    
    /**
     * Clean up resources to prevent memory leaks
     * Important for single-page applications
     */
    function destroy() {
      // Clean up observer
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      
      // Remove event listeners
      if (mapInstance && google && google.maps) {
        google.maps.event.clearInstanceListeners(mapInstance);
      }
      
      // Reset map instance
      mapInstance = null;
      mapInitialized = false;
    }
    
    // Public API
    return {
      init,
      loadMap,
      updateConfig,
      destroy
    };
  })();
  
  // Execute when DOM is fully loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if map container exists
    if (document.getElementById('map')) {
      MapIntegration.init();
    }
  });
  
  // Clean up on page unload to prevent memory leaks
  window.addEventListener('beforeunload', function() {
    MapIntegration.destroy();
  });
  
  // Export for use in other modules
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapIntegration;
  }