Shery.imageEffect("#back", {
    style: 5,  // or whichever style number you're using
    config: {"a":{"value":2,"range":[0,30]},"b":{"value":-0.95,"range":[-1,1]},"zindex":{"value":-9996999,"range":[-9999999,9999999]},"aspect":{"value":2.165336365372294},"ignoreShapeAspect":{"value":true},"shapePosition":{"value":{"x":0,"y":0}},"shapeScale":{"value":{"x":0.5,"y":0.5}},"shapeEdgeSoftness":{"value":0,"range":[0,0.5]},"shapeRadius":{"value":0,"range":[0,2]},"currentScroll":{"value":0},"scrollLerp":{"value":0.07},"gooey":{"value":true},"infiniteGooey":{"value":true},"growSize":{"value":2.18,"range":[1,15]},"durationOut":{"value":1,"range":[0.1,5]},"durationIn":{"value":1.5,"range":[0.1,5]},"displaceAmount":{"value":0.5},"masker":{"value":true},"maskVal":{"value":1,"range":[1,5]},"scrollType":{"value":0},"geoVertex":{"range":[1,64],"value":32},"noEffectGooey":{"value":false},"onMouse":{"value":1},"noise_speed":{"value":0.2,"range":[0,10]},"metaball":{"value":0.2,"range":[0,2],"_gsap":{"id":3}},"discard_threshold":{"value":0.5,"range":[0,1]},"antialias_threshold":{"value":0,"range":[0,0.1]},"noise_height":{"value":0.5,"range":[0,2]},"noise_scale":{"value":10,"range":[0,100]},"uFrequencyX":{"value":12,"range":[0,100]},"uFrequencyY":{"value":12,"range":[0,100]},"uFrequencyZ":{"value":10,"range":[0,100]}},
    gooey: true,
});

var elems = document.querySelectorAll(".elem");

elems.forEach(function(elem){
    var h1s = elem.querySelectorAll("h1");
    var index = 0;
    var animating = false;

    // Move the event listener inside the forEach loop and attach it to elem instead of #main
    elem.addEventListener("click", function(){
        if(!animating){
            animating = true;
            gsap.to(h1s[index], {
                top:'-=100%',
                ease: Expo.easeInOut,
                duration: 1,
                onComplete: function(){
                    gsap.set(this._targets[0], {top: "100%"});
                    animating = false;
                },
            });
        
            index = index === h1s.length - 1 ? 0 : index + 1;
        
            gsap.to(h1s[index], {
                top:'-=100%',
                ease: Expo.easeInOut,
                duration: 1,
            });
        }
    });
});

// Footer brand animation
const footerBrand = document.querySelector('.brand h1');

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Smooth fade in animation with GSAP
            gsap.fromTo(entry.target, 
                {
                    y: 100,
                    opacity: 0
                },
                {
                    duration: 2,
                    y: 0,
                    opacity: 1,
                    ease: "power3.out",
                    delay: 0.2,
                    // Ensure final state remains
                    clearProps: "transform"
                }
            );
        }
    });
}, {
    threshold: 0.2,
    rootMargin: "0px"
});

observer.observe(footerBrand);


// Select all elements with class 'element'
const elements = document.querySelectorAll(".element");

elements.forEach(function(element) {
    // Select the image directly within each element
    const elementImage = element.querySelector('img');
    
    element.addEventListener("mouseenter", function() {
        if (elementImage) {
            elementImage.style.opacity = 1;
        }
    });

    element.addEventListener("mouseleave", function() {
        if (elementImage) {
            elementImage.style.opacity = 0;
        }
    });

    element.addEventListener("mousemove", function(event) {
        if (elementImage) {
            // Get element's bounding rectangle
            const rect = element.getBoundingClientRect();
            
            // Calculate relative mouse position
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            // Update image position with transform for better performance
            elementImage.style.transform = `translate(${x - 75}px, ${y - 75}px)`;
        }
    });
});
let map;
let marker;

function initMap(lat, lng) {
    if (!map) {
        map = L.map('map').setView([lat, lng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
    } else {
        map.setView([lat, lng], 13);
    }

    if (marker) {
        marker.remove();
    }
    marker = L.marker([lat, lng]).addTo(map);
}

function getLocation() {
    const locationDetails = document.getElementById('location-details');
    locationDetails.innerHTML = `
        <div>
            <i class="fas fa-spinner loading-spinner"></i>
            <span>Getting your location...</span>
        </div>
    `;

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        showError({ code: 'NOT_SUPPORTED' });
    }
}

async function showPosition(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    
    initMap(lat, lng);

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        const data = await response.json();
        
        document.getElementById('location-details').innerHTML = `
            <div>
                <p><i class="fas fa-map-marker-alt location-icon"></i>${data.display_name}</p>
                <p><i class="fas fa-compass location-icon"></i>${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
                <p><i class="fas fa-crosshairs location-icon"></i>Accuracy: ${position.coords.accuracy.toFixed(2)}m</p>
            </div>
        `;
    } catch (error) {
        showError({ code: 'FETCH_ERROR' });
    }
}

function showError(error) {
    let message;
    let icon;
    
    switch(error.code) {
        case error.PERMISSION_DENIED:
            message = "Please allow location access to use this feature.";
            icon = "user-slash";
            break;
        case error.POSITION_UNAVAILABLE:
            message = "Location information is unavailable.";
            icon = "map-marked";
            break;
        case error.TIMEOUT:
            message = "Location request timed out.";
            icon = "clock";
            break;
        case 'NOT_SUPPORTED':
            message = "Geolocation is not supported by your browser.";
            icon = "exclamation-triangle";
            break;
        default:
            message = "An unknown error occurred.";
            icon = "question-circle";
    }

    document.getElementById('location-details').innerHTML = `
        <div style="color: #ff4d4d;">
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        </div>
    `;
}

// Initialize with default location (Mumbai)
document.addEventListener('DOMContentLoaded', () => {
    initMap(19.0760, 72.8777);
});

document.addEventListener('DOMContentLoaded', function() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, {
      threshold: 0.1
    });
    
    // Observe section header
    const sectionHeader = document.querySelector('.section-header');
    observer.observe(sectionHeader);
    
    // Observe all feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
      observer.observe(card);
    });
  });