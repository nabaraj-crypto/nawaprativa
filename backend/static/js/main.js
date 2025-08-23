// Initialize AOS
AOS.init({
    duration: 800,
    once: true
});

// Menu Toggle Functionality
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');

    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', (e) => {
            menuToggle.classList.toggle('active');
            mainNav.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!menuToggle.contains(e.target) && !mainNav.contains(e.target)) {
                menuToggle.classList.remove('active');
                mainNav.classList.remove('active');
            }
        });

        // Close menu when clicking on a link
        const navLinks = document.querySelectorAll('.nav-list a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                mainNav.classList.remove('active');
            });
        });
    }

    // Side Menu Functionality
    const sideMenuToggle = document.getElementById('sideMenuToggle');
    const sideMenu = document.getElementById('sideMenu');
    const sideMenuOverlay = document.getElementById('sideMenuOverlay');
    const closeSideMenu = document.getElementById('closeSideMenu');

    if (sideMenuToggle && sideMenu && sideMenuOverlay && closeSideMenu) {
        sideMenuToggle.addEventListener('click', () => {
            sideMenu.classList.add('active');
            sideMenuOverlay.classList.add('active');
        });

        const closeMenu = () => {
            sideMenu.classList.remove('active');
            sideMenuOverlay.classList.remove('active');
        };

        closeSideMenu.addEventListener('click', closeMenu);
        sideMenuOverlay.addEventListener('click', closeMenu);
    }

    // Stats Counter Animation
    const stats = document.querySelectorAll('.stat-number');
    if (stats.length > 0) {
        const observerOptions = {
            threshold: 0.5
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target;
                    const count = parseInt(target.getAttribute('data-count'));
                    let current = 0;
                    const duration = 2000;
                    const increment = count / (duration / 16);
                    
                    const updateCount = () => {
                        current += increment;
                        if (current < count) {
                            target.textContent = Math.floor(current);
                            requestAnimationFrame(updateCount);
                        } else {
                            target.textContent = count;
                        }
                    };
                    
                    updateCount();
                    observer.unobserve(target);
                }
            });
        }, observerOptions);

        stats.forEach(stat => observer.observe(stat));
    }
});

// Welcome Message Carousel
document.addEventListener('DOMContentLoaded', function() {
    const carousel = {
        track: document.querySelector('.carousel-track'),
        slides: document.querySelectorAll('.carousel-slide'),
        indicators: document.querySelectorAll('.indicator'),
        currentSlide: 0,
        slideInterval: 4000, // 4 seconds
        intervalId: null,

        init() {
            // Add click handlers to indicators
            this.indicators.forEach((indicator, index) => {
                indicator.addEventListener('click', () => {
                    this.goToSlide(index);
                });
            });

            // Start auto-sliding
            this.startAutoSlide();

            // Pause on hover
            this.track.addEventListener('mouseenter', () => this.stopAutoSlide());
            this.track.addEventListener('mouseleave', () => this.startAutoSlide());
        },

        goToSlide(index) {
            // Remove active class from current slide and indicator
            this.slides[this.currentSlide].classList.remove('active');
            this.indicators[this.currentSlide].classList.remove('active');

            // Update current slide index
            this.currentSlide = index;

            // Add active class to new slide and indicator
            this.slides[this.currentSlide].classList.add('active');
            this.indicators[this.currentSlide].classList.add('active');
        },

        nextSlide() {
            const next = (this.currentSlide + 1) % this.slides.length;
            this.goToSlide(next);
        },

        startAutoSlide() {
            this.intervalId = setInterval(() => this.nextSlide(), this.slideInterval);
        },

        stopAutoSlide() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
        }
    };

    // Initialize carousel if elements exist
    if (carousel.track && carousel.slides.length > 0) {
        carousel.init();
    }
});

// Banner Slider Functionality
document.addEventListener('DOMContentLoaded', function() {
    const sliderWrapper = document.querySelector('.slider-wrapper');
    const slides = document.querySelectorAll('.slide');
    const dotsContainer = document.querySelector('.slider-dots');
    const prevBtn = document.querySelector('.slider-arrow.prev');
    const nextBtn = document.querySelector('.slider-arrow.next');
    let currentSlide = 0;
    let slideInterval;
    const slideDuration = 5000; // 5 seconds per slide

    // Create dots
    slides.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.classList.add('slider-dot');
        dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
    });

    const dots = document.querySelectorAll('.slider-dot');

    // Initialize first slide
    // slides[0].classList.add('active');

    function goToSlide(index) {
        // Remove active class from current slide and dot
        slides[currentSlide].classList.remove('active');
        dots[currentSlide].classList.remove('active');

        // Update current slide index
        currentSlide = index;
        if (currentSlide >= slides.length) currentSlide = 0;
        if (currentSlide < 0) currentSlide = slides.length - 1;

        // Add active class to new slide and dot
        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
    }

    function nextSlide() {
        goToSlide(currentSlide + 1);
    }

    function prevSlide() {
        goToSlide(currentSlide - 1);
    }

    // Event listeners for navigation
    prevBtn.addEventListener('click', () => {
        prevSlide();
        resetInterval();
    });

    nextBtn.addEventListener('click', () => {
        nextSlide();
        resetInterval();
    });

    // Auto slide functionality
    function startSlideInterval() {
        slideInterval = setInterval(nextSlide, slideDuration);
    }

    function resetInterval() {
        clearInterval(slideInterval);
        startSlideInterval();
    }

    // Start auto sliding
    startSlideInterval();

    // Pause auto sliding when hovering over slider
    sliderWrapper.addEventListener('mouseenter', () => {
        clearInterval(slideInterval);
    });

    sliderWrapper.addEventListener('mouseleave', () => {
        startSlideInterval();
    });

    // Touch swipe functionality
    let touchStartX = 0;
    let touchEndX = 0;

    sliderWrapper.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });

    sliderWrapper.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });

    function handleSwipe() {
        const swipeThreshold = 50;
        if (touchEndX < touchStartX - swipeThreshold) {
            nextSlide();
            resetInterval();
        }
        if (touchEndX > touchStartX + swipeThreshold) {
            prevSlide();
            resetInterval();
        }
    }

    // Parallax effect on scroll
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        slides.forEach(slide => {
            const speed = 0.5;
            slide.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });
}); 

// Account Dropdown Toggle (improved for mobile)
const accountDropdown = document.querySelector('.account-dropdown');
if (accountDropdown) {
  const toggle = accountDropdown.querySelector('.dropdown-toggle');
  function openDropdown(e) {
    e.preventDefault();
    e.stopPropagation();
    accountDropdown.classList.toggle('open');
  }
  toggle.addEventListener('click', openDropdown);
  toggle.addEventListener('touchend', openDropdown);
  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (!accountDropdown.contains(e.target)) {
      accountDropdown.classList.remove('open');
    }
  });
  document.addEventListener('touchend', function(e) {
    if (!accountDropdown.contains(e.target)) {
      accountDropdown.classList.remove('open');
    }
  });
} 

// === Activity Logging ===
(function() {
    // Helper to get CSRF token from cookie
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    const csrftoken = getCookie('csrftoken');

    // Log an activity
    function logActivity(action, details) {
        const payload = {
            action: action,
            page: window.location.pathname,
            details: details || '',
            session_key: window.sessionStorage.getItem('session_key') || ''
        };
        fetch('/api/activity-log/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify(payload)
        }).catch(() => {}); // Fail silently
    }

    // Generate a session key for guests if not present
    if (!window.sessionStorage.getItem('session_key')) {
        window.sessionStorage.setItem('session_key', 'sess-' + Math.random().toString(36).substr(2, 16));
    }

    // Log page load
    document.addEventListener('DOMContentLoaded', function() {
        logActivity('page_load');
    });

    // Log all clicks
    document.addEventListener('click', function(e) {
        let target = e.target;
        let desc = '';
        if (target.tagName) {
            desc += target.tagName;
        }
        if (target.id) {
            desc += '#' + target.id;
        }
        if (target.className) {
            desc += '.' + (typeof target.className === 'string' ? target.className.replace(/\s+/g, '.') : '');
        }
        if (target.name) {
            desc += '[name="' + target.name + '"]';
        }
        if (target.href) {
            desc += ' (href: ' + target.href + ')';
        }
        logActivity('click', desc);
    }, true);

    // Log navigation (history changes)
    window.addEventListener('popstate', function() {
        logActivity('popstate');
    });
    window.addEventListener('hashchange', function() {
        logActivity('hashchange');
    });
})(); 