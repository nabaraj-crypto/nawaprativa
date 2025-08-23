// Spreadsheet-style Results Admin JavaScript

// Global functions for button onclick handlers
window.clearAllData = function() {
    console.log('clearAllData called');
    if (confirm('Are you sure you want to clear all data? This will remove all unsaved changes.')) {
        const tbody = document.querySelector('.spreadsheet-table tbody');
        if (tbody) {
            tbody.innerHTML = '';
            showNotification('All data cleared', 'info');
        }
    }
};

window.printResults = function() {
    console.log('printResults called');
    window.print();
};

window.saveAllResults = function() {
    console.log('saveAllResults called');
    
    // Collect all result data from the spreadsheet
    const rows = document.querySelectorAll('.result-row');
    if (rows.length === 0) {
        showNotification('No results to save!', 'error');
        return;
    }
    
    const results = [];
    const classFilter = document.getElementById('class-filter')?.value || '10';
    const examFilter = document.getElementById('exam-filter')?.value || 'Final Term';
    const yearFilter = document.getElementById('year-filter')?.value || '2024-25';
    
    rows.forEach((row, index) => {
        const studentNameInput = row.querySelector('.student-name-input');
        const subjectInputs = row.querySelectorAll('.subject-mark');
        
        if (!studentNameInput || !studentNameInput.value.trim()) {
            return; // Skip rows without student name
        }
        
        const studentName = studentNameInput.value.trim();
        const nepali = parseFloat(subjectInputs[0]?.value) || 0;
        const math = parseFloat(subjectInputs[1]?.value) || 0;
        const science = parseFloat(subjectInputs[2]?.value) || 0;
        const computer = parseFloat(subjectInputs[3]?.value) || 0;
        const social = parseFloat(subjectInputs[4]?.value) || 0;
        
        const total = parseFloat(row.querySelector('.total-mark')?.textContent) || 0;
        const percentage = parseFloat(row.querySelector('.percentage-mark')?.textContent) || 0;
        const gpa = parseFloat(row.querySelector('.gpa-mark')?.textContent) || 0;
        
        // Calculate passed subjects
        const marks = [nepali, math, science, computer, social];
        const passedSubjects = marks.filter(mark => mark >= 40).length;
        const failedSubjects = 5 - passedSubjects;
        
        // Generate roll number if not exists
        const existingRoll = row.getAttribute('data-result-id') ? 
            row.querySelector('.roll-number-input')?.value : null;
        const rollNumber = existingRoll || `R${(index + 1).toString().padStart(3, '0')}`;
        
        results.push({
            student_name: studentName,
            roll_number: rollNumber,
            student_class: classFilter,
            exam_type: examFilter,
            academic_year: yearFilter,
            total: total,
            percentage: percentage,
            gpa: gpa,
            passed_subjects: passedSubjects,
            failed_subjects: failedSubjects,
            marks: {
                nepali: nepali,
                math: math,
                science: science,
                computer: computer,
                social: social
            }
        });
    });
    
    if (results.length === 0) {
        showNotification('No valid results to save!', 'error');
        return;
    }
    
    // Show loading state
    const saveButton = document.getElementById('save-all-results');
    const originalText = saveButton.textContent;
    saveButton.textContent = '💾 Saving...';
    saveButton.disabled = true;
    
    // Send data to backend
    fetch('/api/results/bulk-save/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken(),
            'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ results: results })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(data.message, 'success');
            
            // Update row IDs for newly saved results
            rows.forEach((row, index) => {
                if (!row.getAttribute('data-result-id') && results[index]) {
                    // This was a new row that got saved
                    // We would need the backend to return the new IDs
                    // For now, just mark it as saved
                    row.classList.add('saved');
                }
            });
            
            updateStatusBar();
        } else {
            showNotification('Error saving results: ' + data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error saving results. Please try again.', 'error');
    })
    .finally(() => {
        // Restore button state
        saveButton.textContent = originalText;
        saveButton.disabled = false;
    });
};

window.testFunction = function() {
    console.log('testFunction called');
    alert('Global function is working!');
};

function getCSRFToken() {
    const token = document.querySelector('[name=csrfmiddlewaretoken]');
    return token ? token.value : '';
}

function updateStatusBar() {
    const rows = document.querySelectorAll('.result-row');
    const totalRows = rows.length;
    const savedRows = Array.from(rows).filter(row => row.getAttribute('data-result-id')).length;
    const newRows = totalRows - savedRows;
    
    const statusBar = document.querySelector('.status-bar');
    if (statusBar) {
        statusBar.innerHTML = `
            <span>📊 Total Rows: ${totalRows}</span>
            <span>💾 Saved: ${savedRows}</span>
            <span>🆕 New: ${newRows}</span>
        `;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initializeSpreadsheet();
    updateStatusBar();
});

function initializeSpreadsheet() {
    // Add event listeners for dynamic calculations
    const resultRows = document.querySelectorAll('.result-row');
    resultRows.forEach(row => {
        initializeRow(row);
    });
    
    // Add event listeners for new rows
    const addRowBtn = document.getElementById('add-result-row');
    if (addRowBtn) {
        addRowBtn.addEventListener('click', addNewRow);
    }
    
    // Initialize grading scale
    initializeGradingScale();
}

function initializeRow(row) {
    const inputs = row.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('input', () => calculateRowTotals(row));
        input.addEventListener('blur', () => updateGrades(row));
    });
}

function calculateRowTotals(row) {
    const subjectInputs = row.querySelectorAll('.subject-mark');
    let total = 0;
    let totalPossible = 0;
    
    // Group inputs by subject (theory + practical pairs)
    for (let i = 0; i < subjectInputs.length; i += 2) {
        const theoryInput = subjectInputs[i];
        const practicalInput = subjectInputs[i + 1];
        
        if (theoryInput && practicalInput) {
            const theoryValue = parseFloat(theoryInput.value) || 0;
            const practicalValue = parseFloat(practicalInput.value) || 0;
            const theoryMax = parseInt(theoryInput.max) || 100;
            const practicalMax = parseInt(practicalInput.max) || 0;
            
            const subjectTotal = theoryValue + practicalValue;
            const subjectMax = theoryMax + practicalMax;
            
            total += subjectTotal;
            totalPossible += subjectMax;
            
            // Update subject total cell (next sibling of practical input)
            const subjectTotalCell = practicalInput.parentElement.nextElementSibling;
            if (subjectTotalCell && subjectTotalCell.classList.contains('total-subject-mark')) {
                subjectTotalCell.textContent = subjectTotal.toFixed(0);
            }
        }
    }
    
    const percentage = totalPossible > 0 ? (total / totalPossible * 100) : 0;
    const gpa = calculateGPA(percentage);
    const grade = getGradeFromPercentage(percentage);
    const remarks = getRemarksFromGrade(grade);
    
    // Update totals
    const totalCell = row.querySelector('.total-mark');
    if (totalCell) {
        totalCell.textContent = total.toFixed(0);
        totalCell.classList.add('auto-calculated');
    }
    
    const percentageCell = row.querySelector('.percentage-mark');
    if (percentageCell) {
        percentageCell.textContent = percentage.toFixed(2) + '%';
        percentageCell.classList.add('auto-calculated');
    }
    
    const gpaCell = row.querySelector('.gpa-mark');
    if (gpaCell) {
        gpaCell.textContent = gpa.toFixed(2);
        gpaCell.classList.add('auto-calculated');
    }
    
    const gradeCell = row.querySelector('.grade-mark');
    if (gradeCell) {
        gradeCell.textContent = grade;
        gradeCell.className = 'grade-mark grade-' + grade.toLowerCase().replace('+', '-plus');
        gradeCell.classList.add('auto-calculated');
    }
    
    const statusCell = row.querySelector('.status-mark');
    if (statusCell) {
        statusCell.textContent = remarks;
        statusCell.classList.add('auto-calculated');
    }
}

function calculateGPA(percentage) {
    if (percentage >= 90) return 4.0;
    if (percentage >= 80) return 3.6;
    if (percentage >= 70) return 3.2;
    if (percentage >= 60) return 2.8;
    if (percentage >= 50) return 2.4;
    if (percentage >= 40) return 2.0;
    if (percentage >= 20) return 1.6;
    return 0.8;
}

function getGradeFromPercentage(percentage) {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    if (percentage >= 20) return 'D';
    return 'E';
}

function getRemarksFromGrade(grade) {
    const remarks = {
        'A+': 'Outstanding',
        'A': 'Excellent',
        'B+': 'Very Good',
        'B': 'Good',
        'C+': 'Above Average',
        'C': 'Average',
        'D': 'Below Average',
        'E': 'Insufficient'
    };
    return remarks[grade] || 'N/A';
}

function updateGrades(row) {
    // This function can be used to update grades based on individual subject marks
    const subjectInputs = row.querySelectorAll('.subject-mark');
    subjectInputs.forEach(input => {
        const value = parseFloat(input.value) || 0;
        const maxMarks = parseInt(input.getAttribute('data-max-marks')) || 100;
        const percentage = (value / maxMarks) * 100;
        
        // Update individual subject grades if needed
        const gradeCell = input.closest('td').nextElementSibling;
        if (gradeCell && gradeCell.classList.contains('subject-grade')) {
            const grade = getGradeFromPercentage(percentage);
            gradeCell.textContent = grade;
            gradeCell.className = 'subject-grade grade-' + grade.toLowerCase().replace('+', '-plus');
        }
    });
}

function addNewRow() {
    const tbody = document.querySelector('.spreadsheet-table tbody');
    const newRow = document.createElement('tr');
    newRow.className = 'result-row';
    
    // Create row HTML based on the existing structure
    newRow.innerHTML = `
        <td class="student-name">
            <input type="text" class="spreadsheet-input student-name-input" placeholder="Student Name">
        </td>
        <td class="subject-column">
            <input type="number" class="spreadsheet-input subject-mark" data-max-marks="100" placeholder="0" min="0" max="100">
        </td>
        <td class="subject-column">
            <input type="number" class="spreadsheet-input subject-mark" data-max-marks="100" placeholder="0" min="0" max="100">
        </td>
        <td class="subject-column">
            <input type="number" class="spreadsheet-input subject-mark" data-max-marks="100" placeholder="0" min="0" max="100">
        </td>
        <td class="subject-column">
            <input type="number" class="spreadsheet-input subject-mark" data-max-marks="100" placeholder="0" min="0" max="100">
        </td>
        <td class="subject-column">
            <input type="number" class="spreadsheet-input subject-mark" data-max-marks="100" placeholder="0" min="0" max="100">
        </td>
        <td class="total-column total-mark">0</td>
        <td class="percentage-column percentage-mark">0.00%</td>
        <td class="grade-column grade-mark">-</td>
        <td class="gpa-column gpa-mark">0.00</td>
        <td class="remarks-column remarks-mark">-</td>
        <td class="actions-column">
            <button class="btn-spreadsheet btn-danger" onclick="deleteRow(this)">Delete</button>
        </td>
    `;
    
    tbody.appendChild(newRow);
    initializeRow(newRow);
}

function deleteRow(button) {
    const row = button.closest('tr');
    const resultId = row.getAttribute('data-result-id');
    
    if (confirm('Are you sure you want to delete this result? This action cannot be undone.')) {
        if (resultId) {
            // Delete from database
            const formData = new FormData();
            formData.append('result_id', resultId);
            formData.append('csrfmiddlewaretoken', getCSRFToken());
            
            fetch('/api/results/delete/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    row.remove();
                    showNotification('Result deleted successfully', 'success');
                    updateStatusBar();
                } else {
                    showNotification('Error deleting result: ' + data.error, 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification('Error deleting result. Please try again.', 'error');
            });
        } else {
            // For new rows that haven't been saved yet, just remove from DOM
            row.remove();
            showNotification('Row removed from view', 'info');
            updateStatusBar();
        }
    }
}

function initializeGradingScale() {
    // Add grading scale reference if not already present
    const existingScale = document.querySelector('.grading-scale');
    if (!existingScale) {
        const scaleHTML = `
            <div class="grading-scale">
                <h3>📊 Grading Scale Reference</h3>
                <table class="grading-scale-table">
                    <thead>
                        <tr>
                            <th>S.N.</th>
                            <th>Percentage</th>
                            <th>Grade</th>
                            <th>Remarks</th>
                            <th>GPA</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>1</td>
                            <td>90-100%</td>
                            <td class="grade-a-plus">A+</td>
                            <td>Outstanding</td>
                            <td>4.0</td>
                        </tr>
                        <tr>
                            <td>2</td>
                            <td>80-90%</td>
                            <td class="grade-a">A</td>
                            <td>Excellent</td>
                            <td>3.6</td>
                        </tr>
                        <tr>
                            <td>3</td>
                            <td>70-80%</td>
                            <td class="grade-b-plus">B+</td>
                            <td>Very Good</td>
                            <td>3.2</td>
                        </tr>
                        <tr>
                            <td>4</td>
                            <td>60-70%</td>
                            <td class="grade-b">B</td>
                            <td>Good</td>
                            <td>2.8</td>
                        </tr>
                        <tr>
                            <td>5</td>
                            <td>50-60%</td>
                            <td class="grade-c-plus">C+</td>
                            <td>Above Average</td>
                            <td>2.4</td>
                        </tr>
                        <tr>
                            <td>6</td>
                            <td>40-50%</td>
                            <td class="grade-c">C</td>
                            <td>Average</td>
                            <td>2.0</td>
                        </tr>
                        <tr>
                            <td>7</td>
                            <td>20-40%</td>
                            <td class="grade-d">D</td>
                            <td>Below Average</td>
                            <td>1.6</td>
                        </tr>
                        <tr>
                            <td>8</td>
                            <td>1-20%</td>
                            <td class="grade-e">E</td>
                            <td>Insufficient</td>
                            <td>0.8</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
        
        const container = document.querySelector('.results-spreadsheet');
        if (container) {
            container.insertAdjacentHTML('afterend', scaleHTML);
        }
    }
}

// Enhanced Export Functionality
function exportToExcel() {
    const rows = document.querySelectorAll('.result-row');
    if (rows.length === 0) {
        alert('No data to export!');
        return;
    }
    
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add headers
    csvContent += "Student Name,Roll Number,Class,Nepali,Math,Science,Computer,Social,Total,Percentage,Grade,GPA,Remarks,Exam Type,Academic Year\n";
    
    // Add data rows
    rows.forEach((row, index) => {
        const studentName = row.querySelector('input[type="text"]')?.value || '';
        const rollNumber = `R${(index + 1).toString().padStart(3, '0')}`;
        const studentClass = document.getElementById('class-filter')?.value || '10';
        const examType = document.getElementById('exam-filter')?.value || 'Final Term';
        const academicYear = document.getElementById('year-filter')?.value || '2024-25';
        
        const subjectInputs = row.querySelectorAll('input[type="number"]');
        const nepali = subjectInputs[0]?.value || '0';
        const math = subjectInputs[1]?.value || '0';
        const science = subjectInputs[2]?.value || '0';
        const computer = subjectInputs[3]?.value || '0';
        const social = subjectInputs[4]?.value || '0';
        
        const total = row.querySelector('.total-mark')?.textContent || '0';
        const percentage = row.querySelector('.percentage-mark')?.textContent || '0.00%';
        const grade = row.querySelector('.grade-mark')?.textContent || '-';
        const gpa = row.querySelector('.gpa-mark')?.textContent || '0.00';
        const remarks = row.querySelector('.remarks-mark')?.textContent || '-';
        
        // Escape commas and quotes in data
        const escapedName = `"${studentName.replace(/"/g, '""')}"`;
        const escapedRemarks = `"${remarks.replace(/"/g, '""')}"`;
        
        csvContent += `${escapedName},${rollNumber},${studentClass},${nepali},${math},${science},${computer},${social},${total},${percentage},${grade},${gpa},${escapedRemarks},${examType},${academicYear}\n`;
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `results_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show success message
    showNotification(`Successfully exported ${rows.length} results to CSV!`, 'success');
}

// Enhanced Import Functionality
function importFromExcel() {
    // Create file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv,.xlsx,.xls';
    fileInput.style.display = 'none';
    
    fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const content = e.target.result;
                processImportedData(content, file.name);
            } catch (error) {
                showNotification('Error reading file: ' + error.message, 'error');
            }
        };
        
        if (file.name.endsWith('.csv')) {
            reader.readAsText(file);
        } else {
            // For Excel files, we'll need to handle differently
            reader.readAsArrayBuffer(file);
        }
    });
    
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
}

function processImportedData(content, filename) {
    try {
        const lines = content.split('\n');
        if (lines.length < 2) {
            throw new Error('File appears to be empty or invalid');
        }
        
        // Parse CSV
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const dataRows = lines.slice(1).filter(line => line.trim());
        
        if (dataRows.length === 0) {
            throw new Error('No data rows found');
        }
        
        // Clear existing rows
        const tbody = document.querySelector('.spreadsheet-table tbody');
        const existingRows = tbody.querySelectorAll('.result-row');
        existingRows.forEach(row => row.remove());
        
        // Add imported rows
        dataRows.forEach((line, index) => {
            const values = parseCSVLine(line);
            if (values.length >= 5) { // At least student name and 4 subjects
                addImportedRow(values, headers);
            }
        });
        
        showNotification(`Successfully imported ${dataRows.length} results from ${filename}!`, 'success');
        
        // Update status bar
        updateStatusBar();
        
    } catch (error) {
        showNotification('Error processing imported data: ' + error.message, 'error');
    }
}

function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    values.push(current.trim());
    return values;
}

function addImportedRow(values, headers) {
    const tbody = document.querySelector('.spreadsheet-table tbody');
    const newRow = document.createElement('tr');
    newRow.className = 'result-row';
    
    // Find column indices
    const nameIndex = headers.findIndex(h => h.toLowerCase().includes('name'));
    const nepaliIndex = headers.findIndex(h => h.toLowerCase().includes('nepali'));
    const mathIndex = headers.findIndex(h => h.toLowerCase().includes('math'));
    const scienceIndex = headers.findIndex(h => h.toLowerCase().includes('science'));
    const computerIndex = headers.findIndex(h => h.toLowerCase().includes('computer'));
    const socialIndex = headers.findIndex(h => h.toLowerCase().includes('social'));
    
    const studentName = values[nameIndex] || '';
    const nepali = values[nepaliIndex] || '0';
    const math = values[mathIndex] || '0';
    const science = values[scienceIndex] || '0';
    const computer = values[computerIndex] || '0';
    const social = values[socialIndex] || '0';
    
    newRow.innerHTML = `
        <td class="student-name">
            <input type="text" class="spreadsheet-input student-name-input" value="${studentName}" placeholder="Student Name">
        </td>
        <td class="subject-column">
            <input type="number" class="spreadsheet-input subject-mark" data-max-marks="100" value="${nepali}" min="0" max="100">
        </td>
        <td class="subject-column">
            <input type="number" class="spreadsheet-input subject-mark" data-max-marks="100" value="${math}" min="0" max="100">
        </td>
        <td class="subject-column">
            <input type="number" class="spreadsheet-input subject-mark" data-max-marks="100" value="${science}" min="0" max="100">
        </td>
        <td class="subject-column">
            <input type="number" class="spreadsheet-input subject-mark" data-max-marks="100" value="${computer}" min="0" max="100">
        </td>
        <td class="subject-column">
            <input type="number" class="spreadsheet-input subject-mark" data-max-marks="100" value="${social}" min="0" max="100">
        </td>
        <td class="total-column total-mark">0</td>
        <td class="percentage-column percentage-mark">0.00%</td>
        <td class="grade-column grade-mark">-</td>
        <td class="gpa-column gpa-mark">0.00</td>
        <td class="remarks-column remarks-mark">-</td>
        <td class="actions-column">
            <button class="btn-spreadsheet btn-danger" onclick="deleteRow(this)">Delete</button>
        </td>
    `;
    
    tbody.appendChild(newRow);
    initializeRow(newRow);
    calculateRowTotals(newRow);
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        max-width: 400px;
        animation: slideIn 0.3s ease;
    `;
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        .notification-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .notification-close {
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            margin-left: 10px;
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Add Subject functionality
async function addSubject() {
    const subjectName = document.getElementById('subjectName').value.trim();
    const creditHour = parseFloat(document.getElementById('creditHour').value) || 1.0;
    const theoryTotal = parseInt(document.getElementById('theoryTotal').value) || 100;
    const practicalTotal = parseInt(document.getElementById('practicalTotal').value) || 0;
    
    if (!subjectName) {
        showNotification('Please enter a subject name', 'error');
        document.getElementById('subjectName').focus();
        return;
    }
    
    // Check if subject already exists in current session
    const existingSubjects = subjects.filter(s => s.name.toLowerCase() === subjectName.toLowerCase());
    if (existingSubjects.length > 0) {
        showNotification(`Subject "${existingSubjects[0].name}" is already added to this session`, 'warning');
        return;
    }
    
    // Show loading state
    const addButton = document.querySelector('button[onclick="addSubject()"]');
    const originalText = addButton.textContent;
    addButton.textContent = '⏳ Adding...';
    addButton.disabled = true;
    
    try {
        const response = await fetch('/api/add-subject/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken(),
            },
            body: JSON.stringify({
                name: subjectName,
                credit_hour: creditHour,
                description: `${subjectName} - Theory: ${theoryTotal}, Practical: ${practicalTotal}`
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Add subject to current session
            const newSubject = {
                id: data.subject.id,
                name: data.subject.name,
                code: data.subject.code,
                credit_hour: data.subject.credit_hour,
                theory_total: theoryTotal,
                practical_total: practicalTotal
            };
            
            subjects.push(newSubject);
            updateSpreadsheet();
            
            // Clear form
            document.getElementById('subjectName').value = '';
            document.getElementById('creditHour').value = '1.0';
            document.getElementById('theoryTotal').value = '100';
            document.getElementById('practicalTotal').value = '0';
            
            showNotification(`Subject "${subjectName}" added successfully!`, 'success');
        } else {
            if (data.existing_subject) {
                // Show option to use existing subject
                const notification = document.createElement('div');
                notification.className = 'notification warning';
                notification.innerHTML = `
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <div>${data.error}</div>
                        <button onclick="useExistingSubject(${data.existing_subject.id}, '${data.existing_subject.name}', ${data.existing_subject.credit_hour})" 
                                style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                            ✅ Use Existing Subject
                        </button>
                        <button onclick="this.parentElement.parentElement.remove()" 
                                style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                            ❌ Cancel
                        </button>
                    </div>
                `;
                notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #ffc107 0%, #ff8c00 100%);
                    color: #212529;
                    padding: 15px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    z-index: 10000;
                    max-width: 400px;
                    animation: slideIn 0.3s ease;
                `;
                document.body.appendChild(notification);
                
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 10000);
            } else {
                showNotification(data.error, 'error');
            }
        }
    } catch (error) {
        showNotification('Error adding subject', 'error');
        console.error('Error:', error);
    } finally {
        // Reset button state
        addButton.textContent = originalText;
        addButton.disabled = false;
    }
}

// Use existing subject function
function useExistingSubject(subjectId, subjectName, creditHour) {
    const theoryTotal = parseInt(document.getElementById('theoryTotal').value) || 100;
    const practicalTotal = parseInt(document.getElementById('practicalTotal').value) || 0;
    
    const existingSubject = {
        id: subjectId,
        name: subjectName,
        code: subjectName.substring(0, 3).toUpperCase(),
        credit_hour: creditHour,
        theory_total: theoryTotal,
        practical_total: practicalTotal
    };
    
    subjects.push(existingSubject);
    updateSpreadsheet();
    
    // Clear form
    document.getElementById('subjectName').value = '';
    document.getElementById('creditHour').value = '1.0';
    document.getElementById('theoryTotal').value = '100';
    document.getElementById('practicalTotal').value = '0';
    
    showNotification(`Existing subject "${subjectName}" added to session!`, 'success');
    
    // Remove the notification
    const notifications = document.querySelectorAll('.notification');
    notifications.forEach(n => n.remove());
}

// Add new student functionality
function addNewStudent() {
    // Reset form
    document.getElementById('studentForm').reset();
    document.getElementById('studentDOB').value = '2000-01-01';
    
    // Show modal
    document.getElementById('studentModal').style.display = 'block';
    document.getElementById('studentFullName').focus();
}

function closeStudentModal() {
    document.getElementById('studentModal').style.display = 'none';
}

async function submitStudentForm() {
    const fullName = document.getElementById('studentFullName').value.trim();
    const studentClass = document.getElementById('studentClass').value;
    const dateOfBirth = document.getElementById('studentDOB').value;
    const gender = document.getElementById('studentGender').value;
    const email = document.getElementById('studentEmail').value.trim();
    const phoneNumber = document.getElementById('studentPhone').value.trim();
    const address = document.getElementById('studentAddress').value.trim();
    const parentName = document.getElementById('parentName').value.trim();
    const parentContact = document.getElementById('parentContact').value.trim();
    
    if (!fullName) {
        showNotification('Please enter student name', 'error');
        document.getElementById('studentFullName').focus();
        return;
    }
    
    // Show loading state
    const submitBtn = document.getElementById('submitStudentBtn');
    const submitBtnText = document.getElementById('submitBtnText');
    submitBtn.disabled = true;
    submitBtnText.innerHTML = '<span class="loading-spinner"></span>Adding Student...';
    
    try {
        const response = await fetch('/api/add-student/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken(),
            },
            body: JSON.stringify({
                full_name: fullName,
                student_class: studentClass,
                date_of_birth: dateOfBirth,
                gender: gender,
                email: email,
                phone_number: phoneNumber,
                address: address,
                parent_name: parentName,
                parent_contact: parentContact
            })
        });
        const data = await response.json();
        
        if (data.success) {
            const student = {
                id: data.student.id,
                full_name: fullName,
                symbol_number: data.student.symbol_number,
                username: data.student.username
            };
            students.push(student);
            updateSpreadsheet();
            showNotification(`Student "${fullName}" added successfully with symbol number ${data.student.symbol_number}`, 'success');
            closeStudentModal();
        } else {
            showNotification(data.error, 'error');
        }
    } catch (error) {
        showNotification('Error adding student', 'error');
        console.error('Error:', error);
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtnText.textContent = 'Add Student';
    }
}

// View all subjects functionality
async function viewAllSubjects() {
    try {
        const response = await fetch('/api/subjects/');
        const data = await response.json();
        
        if (data.length > 0) {
            const subjectList = data.map(subject => 
                `📚 ${subject.name} (Code: ${subject.code}, Credits: ${subject.credit_hour})`
            ).join('\n');
            
            alert(`Available Subjects:\n\n${subjectList}`);
        } else {
            alert('No subjects found in the database.');
        }
    } catch (error) {
        showNotification('Error fetching subjects', 'error');
        console.error('Error:', error);
    }
}

// Global variables
let subjects = [];
let students = [];

// Update spreadsheet function
function updateSpreadsheet() {
    const tableHeader = document.getElementById('tableHeader');
    const tableBody = document.getElementById('tableBody');
    const subjectsContainer = document.getElementById('subjectsContainer');
    const spreadsheetInfo = document.getElementById('spreadsheetInfo');
    
    // Update subjects list
    if (subjects.length > 0) {
        subjectsContainer.innerHTML = subjects.map(subject => `
            <div class="subject-card">
                <div class="subject-info">
                    <strong>${subject.name}</strong>
                    <span class="subject-code">${subject.code}</span>
                    <span class="subject-credits">${subject.credit_hour} credits</span>
                </div>
                <button class="btn-remove" onclick="removeSubject('${subject.name}')">Remove</button>
            </div>
        `).join('');
        
        spreadsheetInfo.textContent = `${subjects.length} subject(s) added. Ready to manage results.`;
    } else {
        subjectsContainer.innerHTML = '<p style="color: #6c757d; text-align: center;">No subjects added yet</p>';
        spreadsheetInfo.textContent = 'No subjects added yet. Add subjects to start managing results.';
    }
    
    // Update table header
    if (subjects.length > 0) {
        const subjectHeaders = subjects.map(subject => `
            <th colspan="3" class="subject-header">
                <div>${subject.name}</div>
                <div class="subject-subheader">
                    <span>Theory (${subject.theory_total})</span>
                    <span>Practical (${subject.practical_total})</span>
                    <span>Total</span>
                </div>
            </th>
        `).join('');
        
        tableHeader.innerHTML = `
            <tr>
                <th>Symbol No.</th>
                <th>Student Name</th>
                ${subjectHeaders}
                <th>Total</th>
                <th>Percentage</th>
                <th>Grade</th>
                <th>GPA</th>
                <th>Status</th>
                <th>Actions</th>
            </tr>
        `;
    } else {
        tableHeader.innerHTML = `
            <tr>
                <th>Symbol No.</th>
                <th>Student Name</th>
                <th colspan="3">No subjects added</th>
                <th>Total</th>
                <th>Percentage</th>
                <th>Grade</th>
                <th>GPA</th>
                <th>Status</th>
                <th>Actions</th>
            </tr>
        `;
    }
    
    // Update table body
    if (students.length > 0) {
        tableBody.innerHTML = students.map((student, index) => {
            const subjectCells = subjects.map(subject => `
                <td class="subject-column">
                    <input type="number" class="spreadsheet-input subject-mark theory-mark" 
                           data-subject="${subject.name}" data-type="theory" 
                           value="0" min="0" max="${subject.theory_total}">
                </td>
                <td class="subject-column">
                    <input type="number" class="spreadsheet-input subject-mark practical-mark" 
                           data-subject="${subject.name}" data-type="practical" 
                           value="0" min="0" max="${subject.practical_total}">
                </td>
                <td class="subject-column total-subject-mark">0</td>
            `).join('');
            
            return `
                <tr class="result-row" data-student-id="${student.id}">
                    <td class="symbol-column">${student.symbol_number}</td>
                    <td class="student-column">${student.full_name}</td>
                    ${subjectCells}
                    <td class="total-column total-mark">0</td>
                    <td class="percentage-column percentage-mark">0.00%</td>
                    <td class="grade-column grade-mark">-</td>
                    <td class="gpa-column gpa-mark">0.00</td>
                    <td class="status-column status-mark">-</td>
                    <td class="actions-column">
                        <button class="btn-spreadsheet btn-danger" onclick="deleteRow(this)">Delete</button>
                    </td>
                </tr>
            `;
        }).join('');
        
        // Initialize event listeners for new rows
        const rows = tableBody.querySelectorAll('.result-row');
        rows.forEach(row => {
            const inputs = row.querySelectorAll('.subject-mark');
            inputs.forEach(input => {
                input.addEventListener('input', () => calculateRowTotals(row));
            });
        });
    } else {
        tableBody.innerHTML = `
            <tr>
                <td colspan="${3 + subjects.length * 3 + 6}" style="text-align: center; padding: 40px; color: #6c757d;">
                    <p>No students added yet. Click "Add New Student" to start.</p>
                </td>
            </tr>
        `;
    }
}

// Remove subject function
function removeSubject(subjectName) {
    const index = subjects.findIndex(s => s.name === subjectName);
    if (index > -1) {
        subjects.splice(index, 1);
        updateSpreadsheet();
        showNotification(`Subject "${subjectName}" removed from session`, 'info');
    }
}

// Event listeners for student modal and subject name checking
document.addEventListener('DOMContentLoaded', function() {
    console.log('Enhanced Results Admin JavaScript loaded successfully!');
    
    // Test if subject name input exists
    const subjectNameInput = document.getElementById('subjectName');
    if (subjectNameInput) {
        console.log('Subject name input found:', subjectNameInput);
    } else {
        console.log('Subject name input not found');
    }
    // Student modal event listeners
    const studentModal = document.getElementById('studentModal');
    if (studentModal) {
        // Close modal when clicking outside
        window.onclick = function(event) {
            if (event.target === studentModal) {
                closeStudentModal();
            }
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && studentModal.style.display === 'block') {
                closeStudentModal();
            }
            if (event.key === 'Enter' && studentModal.style.display === 'block') {
                event.preventDefault();
                submitStudentForm();
            }
        });
    }
    
    // Real-time subject name checking
    if (subjectNameInput) {
        console.log('Setting up real-time checking for subject input');
        let checkTimeout;
        
        // Add multiple event listeners to ensure it works
        subjectNameInput.addEventListener('input', function() {
            console.log('Input event triggered, value:', this.value);
            clearTimeout(checkTimeout);
            const subjectName = this.value.trim();
            
            if (subjectName.length >= 2) {
                console.log('Setting timeout for checking:', subjectName);
                checkTimeout = setTimeout(() => {
                    console.log('Timeout triggered, checking:', subjectName);
                    checkSubjectExists(subjectName);
                }, 500); // Wait 500ms after user stops typing
            } else {
                console.log('Clearing status - subject name too short');
                clearSubjectStatus();
            }
        });
        
        // Also add keyup event as backup
        subjectNameInput.addEventListener('keyup', function() {
            console.log('Keyup event triggered, value:', this.value);
            clearTimeout(checkTimeout);
            const subjectName = this.value.trim();
            
            if (subjectName.length >= 2) {
                checkTimeout = setTimeout(() => {
                    checkSubjectExists(subjectName);
                }, 500);
            } else {
                clearSubjectStatus();
            }
        });
    } else {
        console.log('Subject name input not found for real-time checking setup');
    }
    
    // Initialize the spreadsheet
    updateSpreadsheet();
});

// Check if subject exists in database
async function checkSubjectExists(subjectName) {
    console.log('Checking if subject exists:', subjectName);
    
    // Add a simple alert for testing
    alert(`Checking subject: ${subjectName}`);
    
    try {
        const response = await fetch('/api/subjects/');
        const subjects = await response.json();
        console.log('Available subjects:', subjects);
        
        const existingSubject = subjects.find(s => 
            s.name.toLowerCase() === subjectName.toLowerCase()
        );
        
        if (existingSubject) {
            console.log('Found existing subject:', existingSubject);
            showSubjectExistsStatus(existingSubject);
        } else {
            console.log('Subject is new');
            showSubjectNewStatus();
        }
    } catch (error) {
        console.error('Error checking subject:', error);
    }
}

// Show status when subject exists
function showSubjectExistsStatus(existingSubject) {
    clearSubjectStatus();
    
    const subjectNameInput = document.getElementById('subjectName');
    if (!subjectNameInput) {
        console.log('Subject name input not found for status display');
        return;
    }
    
    // Create status container - simpler approach
    const statusDiv = document.createElement('div');
    statusDiv.id = 'subject-status';
    statusDiv.className = 'subject-status-container';
    
    statusDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; padding: 8px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; color: #856404; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <span>⚠️</span>
            <span><strong>"${existingSubject.name}"</strong> already exists in database</span>
            <button onclick="useExistingSubjectFromCheck(${existingSubject.id}, '${existingSubject.name}', ${existingSubject.credit_hour})" 
                    style="background: #28a745; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 12px;">
                Use Existing
            </button>
        </div>
    `;
    
    // Find the form-group and append status
    const formGroup = subjectNameInput.closest('.form-group');
    if (formGroup) {
        formGroup.appendChild(statusDiv);
        console.log('Status added to form group');
    } else {
        // Fallback: insert after the input field
        subjectNameInput.parentNode.insertBefore(statusDiv, subjectNameInput.nextSibling);
        console.log('Status inserted after input field');
    }
}

// Show status when subject is new
function showSubjectNewStatus() {
    clearSubjectStatus();
    
    const subjectNameInput = document.getElementById('subjectName');
    if (!subjectNameInput) {
        console.log('Subject name input not found for status display');
        return;
    }
    
    // Create status container - simpler approach
    const statusDiv = document.createElement('div');
    statusDiv.id = 'subject-status';
    statusDiv.className = 'subject-status-container';
    
    statusDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; padding: 8px; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px; color: #155724; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <span>✅</span>
            <span>This will be a new subject</span>
        </div>
    `;
    
    // Find the form-group and append status
    const formGroup = subjectNameInput.closest('.form-group');
    if (formGroup) {
        formGroup.appendChild(statusDiv);
        console.log('Status added to form group');
    } else {
        // Fallback: insert after the input field
        subjectNameInput.parentNode.insertBefore(statusDiv, subjectNameInput.nextSibling);
        console.log('Status inserted after input field');
    }
}

// Clear subject status
function clearSubjectStatus() {
    const existingStatus = document.getElementById('subject-status');
    if (existingStatus) {
        existingStatus.remove();
    }
}

// Use existing subject from real-time check
function useExistingSubjectFromCheck(subjectId, subjectName, creditHour) {
    const theoryTotal = parseInt(document.getElementById('theoryTotal').value) || 100;
    const practicalTotal = parseInt(document.getElementById('practicalTotal').value) || 0;
    
    const existingSubject = {
        id: subjectId,
        name: subjectName,
        code: subjectName.substring(0, 3).toUpperCase(),
        credit_hour: creditHour,
        theory_total: theoryTotal,
        practical_total: practicalTotal
    };
    
    subjects.push(existingSubject);
    updateSpreadsheet();
    
    // Clear form
    document.getElementById('subjectName').value = '';
    document.getElementById('creditHour').value = '1.0';
    document.getElementById('theoryTotal').value = '100';
    document.getElementById('practicalTotal').value = '0';
    
    // Clear status
    clearSubjectStatus();
    
    showNotification(`Existing subject "${subjectName}" added to session!`, 'success');
}

// Test function for debugging real-time checking
function testRealTimeCheck() {
    console.log('Testing real-time check...');
    const subjectNameInput = document.getElementById('subjectName');
    if (subjectNameInput) {
        console.log('Subject input found, current value:', subjectNameInput.value);
        if (subjectNameInput.value.trim().length >= 2) {
            checkSubjectExists(subjectNameInput.value.trim());
        } else {
            console.log('Subject name too short for checking');
        }
    } else {
        console.log('Subject input not found');
    }
}

// Export functions for use in Django admin
window.ResultsAdmin = {
    calculateRowTotals,
    addNewRow,
    deleteRow,
    initializeSpreadsheet,
    exportToExcel,
    importFromExcel
}; 