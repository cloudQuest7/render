// public/js/imageLoader.js

document.addEventListener('DOMContentLoaded', function() {
    // Handle image loading errors for all meditation images
    function setupImageErrorHandling() {
        // Find all meditation images
        const meditationImages = document.querySelectorAll('.recently-played-image img');
        
        meditationImages.forEach(img => {
            // Store original src
            const originalSrc = img.getAttribute('src');
            
            // Set up error handler
            img.addEventListener('error', function() {
                // Check if this is already the fallback attempt
                if (this.getAttribute('data-fallback-attempted') === 'true') {
                    // If we've already tried the fallback, show the gradient background
                    this.style.display = 'none';
                    const fallbackGradient = this.closest('.recently-played-image').querySelector('.fallback-gradient');
                    if (fallbackGradient) {
                        fallbackGradient.style.zIndex = '15';
                    }
                } else {
                    // Try with default image
                    this.setAttribute('data-fallback-attempted', 'true');
                    this.src = '/images/meditation/default.jpg';
                    
                    // Log the error for debugging
                    console.warn(`Image failed to load: ${originalSrc}, using fallback`);
                }
            });
            
            // Set up load success handler
            img.addEventListener('load', function() {
                // Successfully loaded, ensure image is visible
                this.style.opacity = '1';
                
                // Remove the placeholder animation
                const placeholder = this.closest('.image-placeholder');
                if (placeholder) {
                    placeholder.classList.remove('image-placeholder');
                }
                
                // Hide the fallback gradient if it was shown
                const fallbackGradient = this.closest('.recently-played-image').querySelector('.fallback-gradient');
                if (fallbackGradient) {
                    fallbackGradient.style.zIndex = '5';
                }
            });
            
            // Force reload to trigger error handler if needed
            if (img.complete) {
                if (img.naturalHeight === 0) {
                    // Image failed to load
                    img.dispatchEvent(new Event('error'));
                } else {
                    // Image loaded successfully
                    img.dispatchEvent(new Event('load'));
                }
            }
        });
    }
    
    // Run setup
    setupImageErrorHandling();
    
    // Export for external use
    window.imageLoader = {
        reloadImages: setupImageErrorHandling
    };
});