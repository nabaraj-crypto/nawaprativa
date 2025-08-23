// Global variables
let noticesData = [];
let facultyData = [];
let currentPage = window.location.pathname.split('/').pop() || 'index.html';

// DOM Elements
const noticesContainer = document.getElementById('notices-container');
const facultyGrid = document.getElementById('facultyGrid');
const searchInput = document.getElementById('searchInput');
const filterButtons = document.querySelectorAll('.filter-btn');
const teacherModal = document.getElementById('teacherModal');
const closeModal = document.querySelector('.close-modal');

// Format date to readable string
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Fetch notices data
async function fetchNoticesData() {
    try {
        const response = await fetch('data/notices.json');
        if (!response.ok) {
            throw new Error('Failed to fetch notices data');
        }
        const data = await response.json();
        noticesData = data.notices;
        renderLatestNotices();
    } catch (error) {
        console.error('Error loading notices data:', error);
        noticesContainer.innerHTML = '<p class="error-message">Failed to load notices. Please try again later.</p>';
    }
}

// Fetch faculty data
async function fetchFacultyData() {
    try {
        const response = await fetch('data/faculty.json');
        if (!response.ok) {
            throw new Error('Failed to fetch faculty data');
        }
        const data = await response.json();
        facultyData = data.faculty;
        renderFacultyCards(facultyData);
    } catch (error) {
        console.error('Error loading faculty data:', error);
        facultyGrid.innerHTML = '<p class="error-message">Failed to load faculty data. Please try again later.</p>';
    }
}

// Render latest notices (showing only the 3 most recent)
function renderLatestNotices() {
    if (!noticesContainer) return;

    const latestNotices = noticesData
        .filter(notice => notice.isActive)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);

    noticesContainer.innerHTML = '';
    if (latestNotices.length === 0) {
        noticesContainer.innerHTML = '<p class="no-results">No notices available.</p>';
        return;
    }

    latestNotices.forEach(notice => {
        const card = createNoticeCard(notice);
        noticesContainer.appendChild(card);
    });
}

// Create notice card
function createNoticeCard(notice) {
    const card = document.createElement('div');
    card.className = 'notice-card';
    card.innerHTML = `
        <div class="notice-card-header">
            <h3>${notice.title}</h3>
            <div class="notice-meta">
                <span class="date">${formatDate(notice.date)}</span>
                <span class="category">${notice.category}</span>
            </div>
        </div>
        <div class="notice-card-content">
            <p>${notice.content}</p>
        </div>
    `;
    return card;
}

// Render faculty cards
function renderFacultyCards(teachers) {
    if (!facultyGrid) return;

    facultyGrid.innerHTML = '';
    if (teachers.length === 0) {
        facultyGrid.innerHTML = '<p class="no-results">No teachers found matching your criteria.</p>';
        return;
    }
    teachers.forEach(teacher => {
        const card = createTeacherCard(teacher);
        facultyGrid.appendChild(card);
    });
}

// Create teacher card
function createTeacherCard(teacher) {
    const card = document.createElement('div');
    card.className = 'teacher-card';
    card.innerHTML = `
        <img src="${teacher.photo}" alt="${teacher.name}" class="teacher-image">
        <div class="teacher-info">
            <h3>${teacher.name}</h3>
            <p>${teacher.subjects.join(', ')}</p>
        </div>
    `;

    card.addEventListener('click', () => showTeacherDetails(teacher));
    return card;
}

// Show teacher details in modal
function showTeacherDetails(teacher) {
    document.getElementById('modalImage').src = teacher.photo;
    document.getElementById('modalName').textContent = teacher.name;
    document.getElementById('modalAddress').textContent = teacher.address;
    document.getElementById('modalPhone').textContent = teacher.phone;
    document.getElementById('modalMaritalStatus').textContent = teacher.maritalStatus;
    document.getElementById('modalEducation').textContent = teacher.education;
    document.getElementById('modalSubjects').textContent = teacher.subjects.join(', ');
    document.getElementById('modalExperience').textContent = `${teacher.experience} years`;

    teacherModal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Close modal
function closeTeacherModal() {
    teacherModal.classList.remove('show');
    document.body.style.overflow = '';
}

// Filter teachers
function filterTeachers() {
    if (!searchInput || !facultyGrid) return;

    const searchTerm = searchInput.value.toLowerCase();
    const activeCategory = document.querySelector('.filter-btn.active').dataset.category;

    const filteredTeachers = facultyData.filter(teacher => {
        const matchesSearch = teacher.name.toLowerCase().includes(searchTerm) ||
            teacher.subjects.some(subject =>
                subject.toLowerCase().includes(searchTerm));
        const matchesCategory = activeCategory === 'all' || teacher.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    renderFacultyCards(filteredTeachers);
}

// Initialize DOM elements
function initializeElements() {
    // Navigation elements
    const mobileMenuBtn = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.main-nav');
    const navLinks = document.querySelectorAll('nav a, .main-nav a');

    // Set active state for current page
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    if (mobileMenuBtn && nav) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenuBtn.classList.toggle('active');
            nav.classList.toggle('active');
        });
        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (nav.classList.contains('active') &&
                !nav.contains(e.target) &&
                !mobileMenuBtn.contains(e.target)) {
                nav.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
            }
        });

        // Close mobile menu when clicking a link
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (nav.classList.contains('active')) {
                    nav.classList.remove('active');
                    mobileMenuBtn.classList.remove('active');
                }
            });
        });

    }
}

// Initialize page-specific elements
function initializePageElements() {
    switch (currentPage) {
        case 'faculty.html':
            initializeFacultyPage();
            break;
        case 'gallery.html':
            initializeGalleryPage();
            break;
        case 'notices.html':
            initializeNoticesPage();
            break;
        case 'contact.html':
            initializeContactPage();
            break;
        default:
            initializeHomePage();
    }
}

// Initialize faculty page elements
function initializeFacultyPage() {
    const facultyGrid = document.getElementById('facultyGrid');
    const searchInput = document.getElementById('searchInput');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const viewButtons = document.querySelectorAll('.view-btn');
    const teacherModal = document.getElementById('teacherModal');
    const closeModal = document.querySelector('.close-modal');

    if (facultyGrid) {
        fetchFacultyData();
    }

    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterTeachers, 300));
    }

    if (filterButtons) {
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                filterTeachers();
            });
        });
    }

    if (viewButtons) {
        viewButtons.forEach(button => {
            button.addEventListener('click', () => {
                viewButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                toggleView(button.dataset.view);
            });
        });
    }

    if (closeModal && teacherModal) {
        closeModal.addEventListener('click', closeTeacherModal);
        teacherModal.addEventListener('click', (e) => {
            if (e.target === teacherModal) {
                closeTeacherModal();
            }
        });
    }
}

// Initialize gallery page elements
function initializeGalleryPage() {
    const galleryGrid = document.getElementById('galleryGrid');
    const searchInput = document.getElementById('gallerySearch');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const imageModal = document.getElementById('imageModal');
    const closeModal = document.getElementById('modalClose');

    if (galleryGrid) {
        fetchGalleryData();
    }

    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterGallery, 300));
    }

    if (filterButtons) {
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                filterGallery();
            });
        });
    }

    if (closeModal && imageModal) {
        closeModal.addEventListener('click', closeImageModal);
        imageModal.addEventListener('click', (e) => {
            if (e.target === imageModal) {
                closeImageModal();
            }
        });
    }
}

// Initialize notices page elements
function initializeNoticesPage() {
    const noticesContainer = document.getElementById('notices-container');
    if (noticesContainer) {
        fetchNoticesData();
    }
}

// Initialize contact page elements
function initializeContactPage() {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }
}

// Initialize home page elements
function initializeHomePage() {
    const noticesContainer = document.getElementById('notices-container');
    if (noticesContainer) {
        fetchNoticesData();
    }
}

// Utility function for debouncing
function debounce(func, wait) {
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing page:', currentPage);
    initializeElements();
});

// Handle errors
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    // Only show error if it's not related to null elements
    if (!e.error.toString().includes('null')) {
        showError('An error occurred. Please try again later.');
    }
});

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <p>${message}</p>
        <button onclick="this.parentElement.remove()">Dismiss</button>
    `;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
}

// Banner Slider JS (Autoplay + Manual Navigation)
(function () {
    const sliderWrapper = document.querySelector('.slider-wrapper');
    const slides = document.querySelectorAll('.slide');
    const dotsContainer = document.querySelector('.slider-dots');
    const prevButton = document.querySelector('.slider-arrow.prev');
    const nextButton = document.querySelector('.slider-arrow.next');
    if (!sliderWrapper || !slides.length || !dotsContainer || !prevButton || !nextButton) return;
    const slideCount = slides.length;
    let currentSlide = 0;
    let autoplayInterval = null;

    // Create dots dynamically
    for (let i = 0; i < slideCount; i++) {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', () => { goToSlide(i); resetAutoplay(); });
        dotsContainer.appendChild(dot);
    }
    const dots = dotsContainer.querySelectorAll('.dot');

    function updateSlider() {
        sliderWrapper.style.transform = 'translateX(-' + (currentSlide * 25) + '%)';
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentSlide);
        });
    }

    function goToSlide(n) {
        currentSlide = (n + slideCount) % slideCount;
        updateSlider();
    }

    function nextSlide() { goToSlide(currentSlide + 1); }
    function prevSlide() { goToSlide(currentSlide - 1); }

    prevButton.addEventListener('click', () => { prevSlide(); resetAutoplay(); });
    nextButton.addEventListener('click', () => { nextSlide(); resetAutoplay(); });

    function startAutoplay() {
        autoplayInterval = setInterval(nextSlide, 5000);
    }
    function resetAutoplay() {
        clearInterval(autoplayInterval);
        startAutoplay();
    }

    startAutoplay();
})();

// ... existing code for faculty, gallery, and other page-specific functions ...