// Dynamic Notices Page Script
// Fetches notices from /api/notices/ and renders them with search, filter, and modal details

document.addEventListener('DOMContentLoaded', function () {
    const noticesGrid = document.getElementById('noticesGrid');
    const searchInput = document.getElementById('noticeSearchInput');
    const filterSelect = document.getElementById('noticeCategoryFilter');
    const modal = document.getElementById('noticeModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalDate = document.getElementById('modalDate');
    const modalCategory = document.getElementById('modalCategory');
    const modalContent = document.getElementById('modalContent');
    const modalAttachment = document.getElementById('modalAttachment');
    const closeModalBtn = document.getElementById('closeModalBtn');

    let notices = [];
    let filteredNotices = [];

    // Fetch notices from backend API
    async function fetchNotices() {
        try {
            const response = await fetch('/api/notices/');
            if (!response.ok) throw new Error('Failed to fetch notices');
            notices = await response.json();
            filteredNotices = [...notices];
            renderNotices();
        } catch (err) {
            noticesGrid.innerHTML = '<div class="error-message">Failed to load notices.</div>';
        }
    }

    // Render notices
    function renderNotices() {
        noticesGrid.innerHTML = '';
        if (filteredNotices.length === 0) {
            noticesGrid.innerHTML = '<div class="no-results">No notices found.</div>';
            return;
        }
        filteredNotices.forEach(notice => {
            const card = document.createElement('div');
            let catClass = '';
            if (notice.category) {
                const cat = notice.category.toLowerCase();
                if (cat.includes('exam')) catClass = 'exam';
                else if (cat.includes('announce')) catClass = 'announcement';
                else if (cat.includes('holiday')) catClass = 'holiday';
            }
            card.className = 'notice-card' + (catClass ? ' ' + catClass : '');
            // Convert newlines to <br> for content
            const contentHtml = (notice.content || '').replace(/\n/g, '<br>');
            card.innerHTML = `
                <h3>${notice.title}</h3>
                <div class="notice-meta">
                    <span class="date">${formatDate(notice.date)}</span>
                    <span class="category">${notice.category || ''}</span>
                    ${notice.important ? '<span class="priority high">Important</span>' : ''}
                </div>
                <div class="notice-card-content">
                    <p>${contentHtml}</p>
                    ${notice.attachment ? `<a href="${notice.attachment}" target="_blank" class="download-link">Download Attachment</a>` : ''}
                </div>
            `;
            card.addEventListener('click', () => showModal(notice));
            noticesGrid.appendChild(card);
        });
    }

    // Format date
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    // Search/filter logic
    function filterNotices() {
        const search = searchInput.value.toLowerCase();
        const category = filterSelect.value;
        filteredNotices = notices.filter(notice => {
            const matchesSearch = notice.title.toLowerCase().includes(search) || notice.content.toLowerCase().includes(search);
            let matchesCategory = true;
            if (category && category !== 'All') {
                matchesCategory = (notice.category && notice.category.toLowerCase() === category.toLowerCase());
            }
            return matchesSearch && matchesCategory;
        });
        renderNotices();
    }

    // Modal logic
    function showModal(notice) {
        modalTitle.textContent = notice.title;
        modalDate.textContent = formatDate(notice.date);
        modalCategory.textContent = notice.category || '';
        // Convert newlines to <br> for modal content
        modalContent.innerHTML = (notice.content || '').replace(/\n/g, '<br>');
        if (notice.attachment) {
            modalAttachment.innerHTML = `<a href="${notice.attachment}" target="_blank" class="download-link">Download Attachment</a>`;
        } else {
            modalAttachment.innerHTML = '';
        }
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

    // Event listeners
    searchInput.addEventListener('input', filterNotices);
    filterSelect.addEventListener('change', filterNotices);

    // Initial fetch
    fetchNotices();
}); 