// Centralized Google Maps API loader to prevent conflicts
class GoogleMapsLoader {
  constructor() {
    this.isLoading = false;
    this.isLoaded = false;
    this.loadPromise = null;
    this.callbacks = [];
  }

  async loadGoogleMaps() {
    // If already loaded, return immediately
    if (this.isLoaded && window.google && window.google.maps) {
      return Promise.resolve(window.google.maps);
    }

    // If currently loading, return the existing promise
    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    // Check if Google Maps is already available
    if (window.google && window.google.maps) {
      this.isLoaded = true;
      return Promise.resolve(window.google.maps);
    }

    // Check API key
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('Google Maps API key not found. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file.');
    }

    // Check if script is already in DOM
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // Wait for existing script to load
      this.loadPromise = new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (window.google && window.google.maps) {
            clearInterval(checkInterval);
            this.isLoaded = true;
            this.isLoading = false;
            resolve(window.google.maps);
          }
        }, 100);

        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          this.isLoading = false;
          reject(new Error('Google Maps loading timeout'));
        }, 10000);
      });
      return this.loadPromise;
    }

    // Load Google Maps script
    this.isLoading = true;
    this.loadPromise = new Promise((resolve, reject) => {
      try {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          console.log('Google Maps API loaded successfully');
          this.isLoaded = true;
          this.isLoading = false;
          
          // Wait a bit for Google Maps to fully initialize
          setTimeout(() => {
            if (window.google && window.google.maps) {
              resolve(window.google.maps);
            } else {
              reject(new Error('Google Maps failed to initialize'));
            }
          }, 100);
        };

        script.onerror = (error) => {
          console.error('Error loading Google Maps:', error);
          this.isLoading = false;
          reject(new Error('Failed to load Google Maps script'));
        };

        document.head.appendChild(script);
      } catch (error) {
        this.isLoading = false;
        reject(error);
      }
    });

    return this.loadPromise;
  }

  // Check if Google Maps is ready
  isReady() {
    return this.isLoaded && window.google && window.google.maps;
  }

  // Get current loading status
  getStatus() {
    return {
      isLoading: this.isLoading,
      isLoaded: this.isLoaded,
      isReady: this.isReady()
    };
  }
}

// Create singleton instance
const googleMapsLoader = new GoogleMapsLoader();

export default googleMapsLoader;
