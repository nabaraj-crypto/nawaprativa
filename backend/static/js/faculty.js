// Dynamic Faculty Page Script
// Fetches faculty data from /api/teachers/ and renders them with a full-vertical image card and screenshot-matching modal

document.addEventListener('DOMContentLoaded', function () {
    const facultyGrid = document.getElementById('facultyGrid');
    const modal = document.getElementById('facultyModal');
    const modalPhoto = document.getElementById('modalPhoto');
    const modalName = document.getElementById('modalName');
    const modalMeta = document.getElementById('modalMeta');
    const closeModalBtn = document.getElementById('closeFacultyModalBtn');
    const searchInput = document.getElementById('facultySearchInput');

    let faculty = [];

    // Fetch faculty from backend API
    async function fetchFaculty() {
        try {
        const response = await fetch('/api/teachers/');
            if (!response.ok) throw new Error('Failed to fetch faculty');
            faculty = await response.json();
            renderFaculty();
        } catch (err) {
            facultyGrid.innerHTML = '<div class="error-message">Failed to load faculty data.</div>';
    }
}

// Render faculty cards
    function renderFaculty(list = faculty) {
    facultyGrid.innerHTML = '';
        if (list.length === 0) {
            facultyGrid.innerHTML = '<div class="no-results">No faculty found.</div>';
        return;
    }
        list.forEach(f => {
    const card = document.createElement('div');
            card.className = 'faculty-card';
            // Subjects as pill badges
            const subjects = (f.subject || '').split(',').map(s => s.trim()).filter(Boolean);
            const subjectBadges = subjects.map(sub => `<span class="subject-badge">${sub}</span>`).join(' ');
    card.innerHTML = `
                <img class="faculty-photo" src="${f.photo || '/static/images/faculty/default.jpg'}" alt="${f.full_name}">
                <div class="faculty-card-body">
                    <div class="faculty-name">${f.full_name}</div>
                    <div class="faculty-education"><i class='fas fa-graduation-cap' style='margin-right:7px;'></i>${f.education || ''}${f.school_name ? ', ' + f.school_name : ''}</div>
                    <div class="faculty-subjects">${subjectBadges}</div>
                    <div class="faculty-experience"><i class='fas fa-briefcase' style='margin-right:7px;'></i>${f.experience ? f.experience + ' years experience' : ''}</div>
                    <button class="profile-btn">View Profile</button>
        </div>
    `;
            card.querySelector('.profile-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                showModal(f);
            });
            facultyGrid.appendChild(card);
        });
    }

    // Search/filter logic
    function filterFaculty() {
        const search = searchInput.value.toLowerCase();
        const filtered = faculty.filter(f =>
            f.full_name.toLowerCase().includes(search) ||
            (f.subject && f.subject.toLowerCase().includes(search))
        );
        renderFaculty(filtered);
    }
    searchInput.addEventListener('input', filterFaculty);

    // Modal logic
    function showModal(f) {
        modalPhoto.src = f.photo || '/static/images/faculty/default.jpg';
        modalPhoto.alt = f.full_name;
        modalName.textContent = f.full_name;
        // Render details with icons
        modalMeta.innerHTML = `
            ${f.address ? `<div class='faculty-modal-meta-item'><i class='fas fa-map-marker-alt'></i> ${f.address}</div>` : ''}
            ${f.contact_number ? `<div class='faculty-modal-meta-item'><i class='fas fa-phone'></i> ${f.contact_number}</div>` : ''}
            ${f.marital_status ? `<div class='faculty-modal-meta-item'><i class='fas fa-user'></i> ${f.marital_status}</div>` : ''}
            ${f.education ? `<div class='faculty-modal-meta-item'><i class='fas fa-graduation-cap'></i> ${f.education}</div>` : ''}
            ${f.subject ? `<div class='faculty-modal-meta-item'><i class='fas fa-book'></i> ${f.subject}</div>` : ''}
            ${f.experience ? `<div class='faculty-modal-meta-item'><i class='fas fa-briefcase'></i> ${f.experience} years</div>` : ''}
        `;
        modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    }
    function closeModal() {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

    // Initial fetch
    fetchFaculty();
}); 