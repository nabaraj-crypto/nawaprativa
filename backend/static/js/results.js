// DOM Elements
const elements = {
    searchInput: document.getElementById('searchInput'),
    searchButton: document.getElementById('searchBtn'),
    clearButton: document.getElementById('clearBtn'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    errorMessage: document.getElementById('errorMessage'),
    successMessage: document.getElementById('successMessage'),
    resultsDisplay: document.getElementById('resultsDisplay'),
    studentName: document.getElementById('studentName'),
    studentRoll: document.getElementById('studentRoll'),
    studentDOB: document.getElementById('studentDOB'),
    studentGrade: document.getElementById('studentGrade'),
    studentSection: document.getElementById('studentSection'),
    studentYear: document.getElementById('studentYear'),
    resultDate: document.getElementById('resultDate'),
    marksTableBody: document.getElementById('marksTableBody'),
    finalGrade: document.getElementById('finalGrade'),
    averageGPA: document.getElementById('averageGPA'),
    promotionStatus: document.getElementById('promotionStatus'),
    // Modal elements
    gradeCalculatorModal: document.getElementById('gradeCalculatorModal'),
    gradingScaleModal: document.getElementById('gradingScaleModal'),
    helpModal: document.getElementById('helpModal'),
    marksInput: document.getElementById('marksInput'),
    gradeResult: document.getElementById('gradeResult'),
    // Action buttons
    printBtn: document.getElementById('printBtn'),
    pdfBtn: document.getElementById('pdfBtn'),
    shareBtn: document.getElementById('shareBtn'),
};

let currentResult = null;

// Dummy results for testing without backend
const DUMMY_RESULTS_BY_SYMBOL = {
    '12345678': {
        full_name: 'Demo Student',
        symbol_number: '12345678',
        student_class: '10',
        dob: '2070-01-15',
        academic_year: '2024-25',
        marks: [
            { subject_name: 'English', credit_hour: 4, theory_marks: 78, practical_marks: 0, academic_year: '2024-25' },
            { subject_name: 'Nepali', credit_hour: 4, theory_marks: 72, practical_marks: 0, academic_year: '2024-25' },
            { subject_name: 'Mathematics', credit_hour: 5, theory_marks: 85, practical_marks: 0, academic_year: '2024-25' },
            { subject_name: 'Science', credit_hour: 5, theory_marks: 68, practical_marks: 20, academic_year: '2024-25' },
            { subject_name: 'Social Studies', credit_hour: 4, theory_marks: 74, practical_marks: 0, academic_year: '2024-25' }
        ]
    }
};

// Utility Functions
function showLoading() {
    if (elements.loadingSpinner) elements.loadingSpinner.style.display = 'block';
}

function hideLoading() {
    if (elements.loadingSpinner) elements.loadingSpinner.style.display = 'none';
}

function showError(msg) {
    hideSuccess();
    if (elements.errorMessage) {
        elements.errorMessage.style.display = 'flex';
        elements.errorMessage.querySelector('p').textContent = msg;
    }
}

function hideError() {
    if (elements.errorMessage) elements.errorMessage.style.display = 'none';
}

function showSuccess(msg) {
    hideError();
    if (elements.successMessage) {
        elements.successMessage.style.display = 'flex';
        elements.successMessage.querySelector('p').textContent = msg;
    }
}

function hideSuccess() {
    if (elements.successMessage) elements.successMessage.style.display = 'none';
}

function hideResults() {
    if (elements.resultsDisplay) elements.resultsDisplay.style.display = 'none';
}

function showResults() {
    if (elements.resultsDisplay) elements.resultsDisplay.style.display = 'block';
}

// Data Fetching Functions
async function fetchStudentResultBySymbol(symbolNumber) {
    try {
        showLoading();
        hideError();
        hideSuccess();
        const response = await fetch(`/api/student-result/${encodeURIComponent(symbolNumber)}/`);
        if (!response.ok) {
            if (response.status === 404) {
                showError('No result found for this symbol number.');
                return null;
            }
            throw new Error('Failed to fetch result');
        }
        const data = await response.json();
        return data;
    } catch (err) {
        showError('Could not load result. Please try again later.');
        console.error('Error fetching student result:', err);
        return null;
    } finally {
        hideLoading();
    }
}

// Grade Calculation Functions
function getGradeFromPercentage(percentage) {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    if (percentage >= 30) return 'D';
    return 'NG';
}

function getGradePoint(grade) {
    switch (grade) {
        case 'A+': return 4.0;
        case 'A': return 3.6;
        case 'B+': return 3.2;
        case 'B': return 2.8;
        case 'C+': return 2.4;
        case 'C': return 2.0;
        case 'D': return 1.6;
        default: return 0.0;
    }
}

function getGradeDescription(grade) {
    switch (grade) {
        case 'A+': return 'Outstanding';
        case 'A': return 'Excellent';
        case 'B+': return 'Very Good';
        case 'B': return 'Good';
        case 'C+': return 'Satisfactory';
        case 'C': return 'Acceptable';
        case 'D': return 'Partially Acceptable';
        default: return 'Not Graded';
    }
}

// Search and Display Functions
async function handleSearch() {
    hideError();
    hideSuccess();
    hideResults();
    
    const searchTerm = elements.searchInput.value.trim();
    if (!searchTerm) {
        showError('Please enter your symbol number.');
        return;
    }
    // Use dummy data if available first
    let data = DUMMY_RESULTS_BY_SYMBOL[searchTerm] || null;
    if (!data) {
        data = await fetchStudentResultBySymbol(searchTerm);
        if (!data) return;
    }
    currentResult = transformStudentResultToViewModel(data);
    fillGradeSheet(currentResult);
    showResults();
    showSuccess(`Results found for ${currentResult.student_name || currentResult.full_name || 'student'}`);
}

function fillGradeSheet(result) {
    // Fill student information
    elements.studentName.textContent = result.student_name || result.full_name || 'N/A';
    elements.studentRoll.textContent = result.roll_number || result.symbol_number || 'N/A';
    elements.studentDOB.textContent = result.dob || 'N/A';
    elements.studentGrade.textContent = result.student_class || result.class_grade || 'N/A';
    elements.studentSection.textContent = result.section || 'N/A';
    elements.studentYear.textContent = result.academic_year || new Date().getFullYear();
    elements.resultDate.textContent = result.result_date || new Date().toLocaleDateString();

    // Fill marks table
    elements.marksTableBody.innerHTML = '';
    let totalGPA = 0;
    let subjectCount = 0;
    let passedSubjects = 0;
    
    (result.subjects || result.marks || []).forEach((subj, idx) => {
        const theoryMarks = subj.theory_marks ?? subj.marks ?? subj.theory ?? subj.theory_obtained ?? '';
        const practicalMarks = subj.practical_marks ?? subj.practical ?? subj.practical_obtained ?? '';
        const theoryTotal = subj.theory_total ?? 100;
        const practicalTotal = subj.practical_total ?? (practicalMarks ? 50 : 0);

        // Per-section grades (based on percentage of section totals)
        const theoryPct = theoryMarks !== '' && theoryTotal ? (parseFloat(theoryMarks) / parseFloat(theoryTotal)) * 100 : null;
        const practicalPct = practicalMarks !== '' && practicalTotal ? (parseFloat(practicalMarks) / parseFloat(practicalTotal)) * 100 : null;
        const theoryGrade = theoryPct !== null ? getGradeFromPercentage(theoryPct) : '';
        const practicalGrade = practicalPct !== null ? getGradeFromPercentage(practicalPct) : '';
        const theoryGP = theoryGrade ? getGradePoint(theoryGrade) : '';
        const practicalGP = practicalGrade ? getGradePoint(practicalGrade) : '';
        
        // Calculate final grade and GPA
        let finalGrade = '';
        let finalGP = 0;
        let remarks = '';
        
        if (theoryMarks !== '' || practicalMarks !== '') {
            const totalObtained = (parseFloat(theoryMarks) || 0) + (parseFloat(practicalMarks) || 0);
            const totalPossible = (parseFloat(theoryTotal) || 0) + (parseFloat(practicalTotal) || 0);
            const pct = totalPossible > 0 ? (totalObtained / totalPossible) * 100 : 0;
            finalGrade = getGradeFromPercentage(pct);
            finalGP = getGradePoint(finalGrade);
        }
        
        // Determine remarks
        if (finalGP >= 2.0) {
            remarks = 'Passed';
            passedSubjects++;
        } else {
            remarks = 'Failed';
        }
        
        totalGPA += finalGP;
        subjectCount++;
        
        // Create table rows
        const theoryRow = `<tr>
            <td rowspan="2">${idx + 1}</td>
            <td rowspan="2">${subj.subject_name || subj.subject || subj.subject_name_readable || ''}</td>
            <td rowspan="2">${subj.credit_hour || subj.credit || ''}</td>
            <td>Theory</td>
            <td>${theoryMarks}</td>
            <td>${theoryGrade}</td>
            <td>${theoryGP}</td>
            <td rowspan="2">${finalGrade}</td>
            <td rowspan="2">${remarks}</td>
        </tr>`;
        
        const practicalRow = `<tr>
            <td>Practical</td>
            <td>${practicalMarks}</td>
            <td>${practicalGrade}</td>
            <td>${practicalGP}</td>
        </tr>`;
        
        elements.marksTableBody.insertAdjacentHTML('beforeend', theoryRow + practicalRow);
    });
    
    // Calculate and display summary
    const avgGPA = subjectCount ? (totalGPA / subjectCount).toFixed(2) : (result.average_gpa ? Number(result.average_gpa).toFixed(2) : '0.00');
    const passPercentage = subjectCount ? ((passedSubjects / subjectCount) * 100).toFixed(1) : '0.0';
    
    // Determine final grade based on average GPA
    let overallGrade = '';
    if (avgGPA >= 3.6) overallGrade = 'A+';
    else if (avgGPA >= 3.2) overallGrade = 'A';
    else if (avgGPA >= 2.8) overallGrade = 'B+';
    else if (avgGPA >= 2.4) overallGrade = 'B';
    else if (avgGPA >= 2.0) overallGrade = 'C+';
    else if (avgGPA >= 1.6) overallGrade = 'C';
    else overallGrade = 'NG';
    
    elements.finalGrade.textContent = overallGrade;
    elements.averageGPA.textContent = avgGPA;
    elements.promotionStatus.textContent = passedSubjects === subjectCount ? 'Promoted' : 'Not Promoted';
}

// Transform StudentResult API response to current view model
function transformStudentResultToViewModel(data) {
    // data: { full_name, symbol_number, student_class, marks: [...] }
    const subjects = (data.marks || []).map(m => ({
        subject_name: m.subject_name,
        credit_hour: m.credit_hour,
        theory_marks: m.theory_marks,
        practical_marks: m.practical_marks
    }));
    return {
        student_name: data.full_name,
        symbol_number: data.symbol_number,
        student_class: data.student_class,
        academic_year: (data.marks && data.marks[0] && data.marks[0].academic_year) || '2024-25',
        subjects
    };
}

// Modal Functions
function showGradeCalculator() {
    if (elements.gradeCalculatorModal) {
        elements.gradeCalculatorModal.style.display = 'block';
        elements.marksInput.focus();
    }
}

function showGradingScale() {
    if (elements.gradingScaleModal) {
        elements.gradingScaleModal.style.display = 'block';
    }
}

function showHelp() {
    if (elements.helpModal) {
        elements.helpModal.style.display = 'block';
    }
}

function closeModal(modal) {
    if (modal) {
        modal.style.display = 'none';
    }
}

function calculateGrade() {
    const marks = parseFloat(elements.marksInput.value);
    
    if (isNaN(marks) || marks < 0 || marks > 100) {
        elements.gradeResult.innerHTML = '<span style="color: #dc3545;">Please enter a valid mark between 0 and 100</span>';
        return;
    }
    
    const grade = getGrade(marks);
    const gradePoint = getGradePoint(grade);
    const description = getGradeDescription(grade);
    
    elements.gradeResult.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 2rem; font-weight: bold; color: #667eea; margin-bottom: 10px;">${grade}</div>
            <div style="font-size: 1.2rem; color: #333; margin-bottom: 5px;">Grade Point: ${gradePoint}</div>
            <div style="font-size: 1rem; color: #666;">${description}</div>
        </div>
    `;
}

// Action Button Functions
function handlePrint() {
    if (currentResult) {
        window.print();
    } else {
        showError('No result to print. Please search for a result first.');
    }
}

function handlePDFDownload() {
    if (!currentResult) {
        showError('No result to download. Please search for a result first.');
        return;
    }
    
    const element = document.querySelector('#resultsDisplay');
    const opt = {
        margin: 0,
        filename: `grade-sheet-${currentResult.student_name || 'student'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    };
    
    html2pdf().set(opt).from(element).save().then(() => {
        showSuccess('PDF downloaded successfully!');
    }).catch(err => {
        showError('Failed to download PDF. Please try again.');
        console.error('PDF generation error:', err);
    });
}

function handleShare() {
    if (!currentResult) {
        showError('No result to share. Please search for a result first.');
        return;
    }
    
    if (navigator.share) {
        navigator.share({
            title: `Grade Sheet - ${currentResult.student_name}`,
            text: `Check out the grade sheet for ${currentResult.student_name}`,
            url: window.location.href
        }).then(() => {
            showSuccess('Shared successfully!');
        }).catch(err => {
            console.error('Share failed:', err);
            showError('Failed to share. Please try again.');
        });
    } else {
        // Fallback: copy to clipboard
        const shareText = `Grade Sheet for ${currentResult.student_name}\n${window.location.href}`;
        navigator.clipboard.writeText(shareText).then(() => {
            showSuccess('Link copied to clipboard!');
        }).catch(() => {
            showError('Failed to copy link. Please try again.');
        });
    }
}

function clearSearch() {
    elements.searchInput.value = '';
    hideResults();
    hideError();
    hideSuccess();
}

// Event Listeners
function initialize() {
    // Search functionality
    if (elements.searchButton) {
        elements.searchButton.addEventListener('click', handleSearch);
    }
    
    if (elements.clearButton) {
        elements.clearButton.addEventListener('click', clearSearch);
    }
    
    if (elements.searchInput) {
        elements.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch();
        });
    }
    
    // Modal close functionality
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target);
        }
        if (e.target.classList.contains('close')) {
            const modal = e.target.closest('.modal');
            closeModal(modal);
        }
    });
    
    // Action buttons
    if (elements.printBtn) {
        elements.printBtn.addEventListener('click', handlePrint);
    }
    if (elements.pdfBtn) {
        elements.pdfBtn.addEventListener('click', handlePDFDownload);
    }
    if (elements.shareBtn) {
        elements.shareBtn.addEventListener('click', handleShare);
    }
    
    // Grade calculator
    if (elements.marksInput) {
        elements.marksInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') calculateGrade();
        });
    }
    
    // Initialize display
    hideResults();
    hideError();
    hideSuccess();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initialize); 