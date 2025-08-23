// Enhanced Marks Entry System JavaScript

class EnhancedMarksEntry {
	constructor() {
		this.currentClass = '';
		this.currentExamType = '';
		this.currentAcademicYear = '';
		this.currentSubject = '';
		this.subjects = [];
		this.students = [];
		this.marksData = {};
		this.currentSubjectIndex = 0;
		this.autoSaveTimeout = null;
		this.isLoading = false;
		
		this.initializeElements();
		this.bindEvents();
		this.initializeSubjects();
	}
	
	initializeElements() {
		this.elements = {
			classSelect: document.getElementById('classSelect'),
			examTypeSelect: document.getElementById('examTypeSelect'),
			academicYearSelect: document.getElementById('academicYearSelect'),
			loadClassBtn: document.getElementById('loadClassBtn'),
			progressSection: document.querySelector('.progress-section'),
			progressFill: document.getElementById('progressFill'),
			progressText: document.getElementById('progressText'),
			subjectStatus: document.getElementById('subjectStatus'),
			marksEntrySection: document.getElementById('marksEntrySection'),
			subjectSelect: document.getElementById('subjectSelect'),
			currentSubjectInfo: document.getElementById('currentSubjectInfo'),
			studentSearchInput: document.getElementById('studentSearchInput'),
			clearSearchBtn: document.getElementById('clearSearchBtn'),
			loadingSpinner: document.getElementById('loadingSpinner'),
			marksTable: document.getElementById('marksTable'),
			marksTableBody: document.getElementById('marksTableBody'),
			prevSubjectBtn: document.getElementById('prevSubjectBtn'),
			nextSubjectBtn: document.getElementById('nextSubjectBtn'),
			finishEntryBtn: document.getElementById('finishEntryBtn'),
			viewResultsSection: document.getElementById('viewResultsSection'),
			resultClassSelect: document.getElementById('resultClassSelect'),
			resultsTableContainer: document.getElementById('resultsTableContainer'),
			autoSaveIndicator: document.getElementById('autoSaveIndicator'),
			errorMessage: document.getElementById('errorMessage'),
			successMessage: document.getElementById('successMessage')
		};
	}
	
	bindEvents() {
		if (this.elements.loadClassBtn) {
			this.elements.loadClassBtn.addEventListener('click', () => this.loadClass());
		}
		if (this.elements.subjectSelect) {
			this.elements.subjectSelect.addEventListener('change', () => this.onSubjectChange());
		}
		if (this.elements.studentSearchInput) {
			this.elements.studentSearchInput.addEventListener('input', () => this.filterStudents());
		}
		if (this.elements.clearSearchBtn) {
			this.elements.clearSearchBtn.addEventListener('click', () => this.clearSearch());
		}
		if (this.elements.prevSubjectBtn) {
			this.elements.prevSubjectBtn.addEventListener('click', () => this.previousSubject());
		}
		if (this.elements.nextSubjectBtn) {
			this.elements.nextSubjectBtn.addEventListener('click', () => this.nextSubject());
		}
		if (this.elements.finishEntryBtn) {
			this.elements.finishEntryBtn.addEventListener('click', () => this.finishEntry());
		}
		if (this.elements.resultClassSelect) {
			this.elements.resultClassSelect.addEventListener('change', () => this.loadResults());
		}
		
		// Keyboard shortcuts
		document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
	}
	
	handleKeyboardShortcuts(e) {
		// Ctrl/Cmd + S to save
		if ((e.ctrlKey || e.metaKey) && e.key === 's') {
			e.preventDefault();
			this.autoSaveMarks();
		}
		
		// Tab navigation in marks table
		if (e.key === 'Tab' && this.elements.marksTableBody) {
			this.handleTabNavigation(e);
		}
	}
	
	handleTabNavigation(e) {
		const inputs = this.elements.marksTableBody.querySelectorAll('input');
		const currentIndex = Array.from(inputs).indexOf(document.activeElement);
		
		if (e.shiftKey && currentIndex > 0) {
			// Shift + Tab: go to previous input
			inputs[currentIndex - 1].focus();
			e.preventDefault();
		} else if (!e.shiftKey && currentIndex < inputs.length - 1) {
			// Tab: go to next input
			inputs[currentIndex + 1].focus();
			e.preventDefault();
		}
	}
	
	initializeSubjects() {
		this.subjects = [
			{ name: 'English', code: 'ENG', credit_hour: 4 },
			{ name: 'Nepali', code: 'NEP', credit_hour: 5 },
			{ name: 'Mathematics', code: 'MATH', credit_hour: 5 },
			{ name: 'Science', code: 'SCI', credit_hour: 5 },
			{ name: 'Social Studies', code: 'SOC', credit_hour: 4 },
			{ name: 'Computer', code: 'COMP', credit_hour: 3 },
			{ name: 'Health', code: 'HEALTH', credit_hour: 2 },
			{ name: 'Optional Math', code: 'OPT_MATH', credit_hour: 4 },
			{ name: 'Accountancy', code: 'ACC', credit_hour: 4 },
			{ name: 'Economics', code: 'ECO', credit_hour: 4 }
		];
	}
	
	async loadClass() {
		this.currentClass = this.elements.classSelect.value;
		this.currentExamType = this.elements.examTypeSelect.value;
		this.currentAcademicYear = this.elements.academicYearSelect.value;
		
		if (!this.currentClass) {
			this.showError('Please select a class first.');
			return;
		}
		
		try {
			this.showLoading();
			this.hideError();
			
			// Load students for the selected class
			const response = await fetch(`/api/students/?class=${this.currentClass}`);
			if (!response.ok) throw new Error('Failed to load students');
			
			const data = await response.json();
			this.students = data.filter(student => student.student_class === this.currentClass);
			
			// Load configured subjects for this class
			try {
				const subjRes = await fetch(`/api/subjects/for-class/?class=${this.currentClass}`);
				if (subjRes.ok) {
					const subjJson = await subjRes.json();
					if (subjJson.success && Array.isArray(subjJson.subjects) && subjJson.subjects.length) {
						this.subjects = subjJson.subjects.map(s => ({ name: s.name, code: (s.code || s.name.slice(0,3).toUpperCase()), credit_hour: s.credit_hour || 4 }));
					}
				}
			} catch (e) { /* keep defaults */ }
			
			if (this.students.length === 0) {
				this.showError('No students found for the selected class.');
				return;
			}
			
			// Initialize marks data
			this.initializeMarksData();
			
			// Populate subject dropdown and checklist
			this.populateSubjectDropdown();
			
			// Show sections
			this.elements.progressSection.style.display = 'block';
			this.elements.marksEntrySection.style.display = 'block';
			this.elements.viewResultsSection.style.display = 'block';
			
			// Load first subject
			this.currentSubjectIndex = 0;
			this.loadSubject(0);
			
			this.showSuccess(`Loaded ${this.students.length} students for Class ${this.currentClass}`);
			
		} catch (error) {
			this.showError('Failed to load class data: ' + error.message);
			console.error('Error loading class:', error);
		} finally {
			this.hideLoading();
		}
	}
	
	initializeMarksData() {
		this.marksData = {};
		const chosenNames = Array.from(document.querySelectorAll('.subject-choose'))
			.filter(cb => cb.checked)
			.map(cb => cb.getAttribute('data-name'));
		const effectiveSubjects = chosenNames.length ? this.subjects.filter(s => chosenNames.includes(s.name)) : this.subjects;
		effectiveSubjects.forEach(subject => {
			this.marksData[subject.name] = {};
			this.students.forEach(student => {
				this.marksData[subject.name][student.symbol_number] = {
					theory_marks: '',
					theory_total: 100,
					practical_marks: '',
					practical_total: 0,
					total_marks: '',
					percentage: '',
					grade: '',
					grade_point: '',
					status: 'Not Started'
				};
			});
		});
	}
	
	populateSubjectDropdown() {
		if (!this.elements.subjectSelect) return;
		
		this.elements.subjectSelect.innerHTML = '<option value="">Select subject...</option>';
		this.subjects.forEach((subject, index) => {
			const option = document.createElement('option');
			option.value = subject.name;
			option.textContent = `${subject.name} (${subject.code})`;
			option.dataset.index = index;
			this.elements.subjectSelect.appendChild(option);
		});
		
		// Render a checklist for selecting active subjects for this class
		const checklistId = 'subjectChecklist';
		let checklist = document.getElementById(checklistId);
		if (!checklist) {
			checklist = document.createElement('div');
			checklist.id = checklistId;
			checklist.style.marginTop = '10px';
			this.elements.subjectSelect.parentElement.appendChild(checklist);
		}
		checklist.innerHTML = '';
		this.subjects.forEach((subject) => {
			const wrapper = document.createElement('label');
			wrapper.style.marginRight = '12px';
			wrapper.innerHTML = `<input type="checkbox" class="subject-choose" data-name="${subject.name}" checked> ${subject.name}`;
			checklist.appendChild(wrapper);
		});
		checklist.addEventListener('change', () => this.persistChosenSubjects());
	}
	
	async persistChosenSubjects() {
		const chosen = Array.from(document.querySelectorAll('.subject-choose'))
			.filter(cb => cb.checked)
			.map(cb => ({ name: cb.getAttribute('data-name') }));
		if (!chosen.length) return;
		try {
			await fetch('/api/subjects/set-for-class/', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'X-CSRFToken': this.getCSRFToken() },
				body: JSON.stringify({ class_name: this.currentClass, exam_type: this.currentExamType, academic_year: this.currentAcademicYear, subjects: chosen })
			});
		} catch (e) {}
		this.initializeMarksData();
		this.loadSubject(0);
	}
	
	populateMarksTable() {
		if (!this.elements.marksTableBody) return;
		
		this.elements.marksTableBody.innerHTML = '';
		
		this.students.forEach(student => {
			const row = document.createElement('tr');
			row.className = 'student-row';
			row.dataset.symbolNumber = student.symbol_number;
			
			const currentMarks = this.marksData[this.currentSubject][student.symbol_number];
			
			row.innerHTML = `
				<td><span class="student-info">${student.symbol_number}</span></td>
				<td>${student.full_name}</td>
				<td><input type="number" class="theory-marks" data-symbol="${student.symbol_number}" 
					   value="${currentMarks.theory_marks}" min="0" max="100" step="0.01"
					   placeholder="Student's score" title="Enter the marks student got in theory (added to total)"></td>
				<td><input type="number" class="theory-total" data-symbol="${student.symbol_number}" 
					   value="${currentMarks.theory_total}" min="0" max="200" step="0.01"
					   placeholder="Full marks" title="Total marks available for theory (used for grade calculation)"></td>
				<td><input type="number" class="practical-marks" data-symbol="${student.symbol_number}" 
					   value="${currentMarks.practical_marks}" min="0" max="50" step="0.01"
					   placeholder="Student's score" title="Enter the marks student got in practical (added to total)"></td>
				<td><input type="number" class="practical-total" data-symbol="${student.symbol_number}" 
					   value="${currentMarks.practical_total}" min="0" max="50" step="0.01"
					   placeholder="Full marks" title="Total marks available for practical (used for grade calculation)"></td>
				<td class="total-marks">${currentMarks.total_marks || ''}</td>
				<td class="percentage">${currentMarks.percentage || ''}</td>
				<td class="grade">${currentMarks.grade || ''}</td>
				<td class="grade-point">${currentMarks.grade_point || ''}</td>
				<td class="status">${currentMarks.status}</td>
			`;
			
			this.elements.marksTableBody.appendChild(row);
		});
		
		// Add event listeners for input changes
		this.addInputEventListeners();
	}
	
	addInputEventListeners() {
		const inputs = this.elements.marksTableBody.querySelectorAll('input');
		inputs.forEach(input => {
			input.addEventListener('input', (e) => {
				const symbolNumber = e.target.dataset.symbol;
				const fieldType = e.target.className.split('-')[0];
				
				// Update marks data
				this.marksData[this.currentSubject][symbolNumber][fieldType + '_marks'] = e.target.value;
				
				// Calculate totals
				this.calculateStudentMarks(symbolNumber);
				
				// Auto-save
				this.scheduleAutoSave();
				
				// Add visual feedback
				e.target.classList.add('auto-saved');
				setTimeout(() => {
					e.target.classList.remove('auto-saved');
				}, 1000);
			});
		});
	}
	
	calculateStudentMarks(symbolNumber) {
		const marks = this.marksData[this.currentSubject][symbolNumber];
		
		const theoryMarks = parseFloat(marks.theory_marks) || 0;
		const theoryTotal = parseFloat(marks.theory_total) || 100;
		const practicalMarks = parseFloat(marks.practical_marks) || 0;
		const practicalTotal = parseFloat(marks.practical_total) || 0;
		
		// Calculate total marks (actual scores only - for pass/fail analysis)
		const totalMarks = theoryMarks + practicalMarks;
		const totalPossible = theoryTotal + practicalTotal;
		
		// Calculate percentage based on full marks (for grade calculation)
		const percentage = totalPossible > 0 ? (totalMarks / totalPossible) * 100 : 0;
		
		// Check if total marks are below pass mark (35% of total possible)
		const passMark = totalPossible * 0.35; // 35% pass mark
		const totalFailed = totalMarks < passMark;
		
		let grade, gradePoint, status;
		
		// If total marks are below pass mark, mark as NG
		if (totalFailed) {
			grade = 'NG';
			gradePoint = 0.0;
			status = 'Failed (Below 35% Pass Mark)';
		} else {
			// Get grade and grade point based on percentage of full marks
			const gradeData = this.getGradeAndPoint(percentage);
			grade = gradeData.grade;
			gradePoint = gradeData.gradePoint;
			status = percentage >= 35 ? 'Passed' : 'Failed';
		}
		
		// Update marks data
		marks.total_marks = totalMarks.toFixed(2);
		marks.percentage = percentage.toFixed(2);
		marks.grade = grade;
		marks.grade_point = gradePoint.toFixed(2);
		marks.status = status;
		
		// Update table display
		this.updateTableRow(symbolNumber, marks);
	}
	
	updateTableRow(symbolNumber, marks) {
		const row = this.elements.marksTableBody.querySelector(`[data-symbol-number="${symbolNumber}"]`);
		if (!row) return;
		
		row.querySelector('.total-marks').textContent = marks.total_marks;
		row.querySelector('.percentage').textContent = marks.percentage;
		row.querySelector('.grade').textContent = marks.grade;
		row.querySelector('.grade-point').textContent = marks.grade_point;
		row.querySelector('.status').textContent = marks.status;
		
		// Add grade styling
		const gradeCell = row.querySelector('.grade');
		gradeCell.className = 'grade grade-' + marks.grade.toLowerCase().replace('+', '-plus');
	}
	
	getGradeAndPoint(percentage) {
		if (percentage >= 90) return { grade: 'A+', gradePoint: 4.0 };
		if (percentage >= 80) return { grade: 'A', gradePoint: 3.6 };
		if (percentage >= 70) return { grade: 'B+', gradePoint: 3.2 };
		if (percentage >= 60) return { grade: 'B', gradePoint: 2.8 };
		if (percentage >= 50) return { grade: 'C+', gradePoint: 2.4 };
		if (percentage >= 40) return { grade: 'C', gradePoint: 2.0 };
		if (percentage >= 30) return { grade: 'D', gradePoint: 1.6 };
		return { grade: 'NG', gradePoint: 0.0 };
	}
	
	scheduleAutoSave() {
		if (this.autoSaveTimeout) {
			clearTimeout(this.autoSaveTimeout);
		}
		
		this.autoSaveTimeout = setTimeout(() => {
			this.autoSaveMarks();
		}, 2000); // Auto-save after 2 seconds of inactivity
	}
	
	async autoSaveMarks() {
		try {
			const response = await fetch('/api/marks/enhanced-bulk-save/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRFToken': this.getCSRFToken()
				},
				body: JSON.stringify({
					class_name: this.currentClass,
					exam_type: this.currentExamType,
					academic_year: this.currentAcademicYear,
					subject: this.currentSubject,
					marks_data: this.marksData[this.currentSubject]
				})
			});
			
			if (response.ok) {
				this.showAutoSaveIndicator();
				this.updateSubjectStatus(this.currentSubject, 'Completed');
			}
		} catch (error) {
			console.error('Auto-save failed:', error);
		}
	}
	
	showAutoSaveIndicator() {
		if (this.elements.autoSaveIndicator) {
			this.elements.autoSaveIndicator.style.display = 'block';
			setTimeout(() => {
				this.elements.autoSaveIndicator.style.display = 'none';
			}, 3000);
		}
	}
	
	updateProgress() {
		const completedSubjects = this.subjects.filter(subject => 
			this.marksData[subject.name] && 
			Object.values(this.marksData[subject.name]).some(marks => marks.status !== 'Not Started')
		).length;
		
		const progress = (completedSubjects / this.subjects.length) * 100;
		
		if (this.elements.progressFill) {
			this.elements.progressFill.style.width = progress + '%';
		}
		if (this.elements.progressText) {
			this.elements.progressText.textContent = `${Math.round(progress)}% Complete`;
		}
		
		// Update subject status
		this.updateSubjectStatusDisplay();
	}
	
	updateSubjectStatusDisplay() {
		if (!this.elements.subjectStatus) return;
		
		let statusHTML = '';
		this.subjects.forEach((subject, index) => {
			const isCurrent = index === this.currentSubjectIndex;
			const hasData = this.marksData[subject.name] && 
							Object.values(this.marksData[subject.name]).some(marks => marks.status !== 'Not Started');
			
			let statusClass = 'status-not-started';
			let statusText = 'Not Started';
			
			if (isCurrent) {
				statusClass = 'status-pending';
				statusText = 'In Progress';
			} else if (hasData) {
				statusClass = 'status-completed';
				statusText = 'Completed';
			}
			
			statusHTML += `
				<span class="status-indicator ${statusClass}"></span>
				${subject.name} - ${statusText}
				${isCurrent ? ' (Current)' : ''}
				<br>
			`;
		});
		
		this.elements.subjectStatus.innerHTML = statusHTML;
	}
	
	updateSubjectStatus(subjectName, status) {
		if (this.marksData[subjectName]) {
			Object.values(this.marksData[subjectName]).forEach(marks => {
				if (marks.status === 'Not Started') {
					marks.status = status;
				}
			});
		}
		this.updateProgress();
	}
	
	filterStudents() {
		const searchTerm = this.elements.studentSearchInput.value.toLowerCase();
		const rows = this.elements.marksTableBody.querySelectorAll('tr');
		
		rows.forEach(row => {
			const studentName = row.cells[1].textContent.toLowerCase();
			const symbolNumber = row.cells[0].textContent.toLowerCase();
			
			if (studentName.includes(searchTerm) || symbolNumber.includes(searchTerm)) {
				row.style.display = '';
			} else {
				row.style.display = 'none';
			}
		});
	}
	
	clearSearch() {
		if (this.elements.studentSearchInput) {
			this.elements.studentSearchInput.value = '';
		}
		this.filterStudents();
	}
	
	previousSubject() {
		if (this.currentSubjectIndex > 0) {
			this.loadSubject(this.currentSubjectIndex - 1);
		}
	}
	
	nextSubject() {
		if (this.currentSubjectIndex < this.subjects.length - 1) {
			this.loadSubject(this.currentSubjectIndex + 1);
		}
	}
	
	finishEntry() {
		this.showSuccess('Marks entry completed successfully!');
		this.loadResults();
	}
	
	async loadResults() {
		const selectedClass = this.elements.resultClassSelect.value || this.currentClass;
		
		if (!selectedClass) {
			this.showError('Please select a class to view results.');
			return;
		}
		
		try {
			const response = await fetch(`/api/results/enhanced/?class=${selectedClass}&exam_type=${this.currentExamType}&academic_year=${this.currentAcademicYear}`);
			if (!response.ok) throw new Error('Failed to load results');
			
			const results = await response.json();
			this.displayResults(results);
			
		} catch (error) {
			this.showError('Failed to load results: ' + error.message);
		}
	}
	
	displayResults(results) {
		if (!this.elements.resultsTableContainer) return;
		
		if (results.length === 0) {
			this.elements.resultsTableContainer.innerHTML = '<p>No results found for the selected criteria.</p>';
			return;
		}
		
		let tableHTML = `
			<table class="results-table">
				<thead>
					<tr>
						<th>Roll No.</th>
						<th>Student Name</th>
						<th>Class</th>
						<th>Total Marks</th>
						<th>GPA</th>
						<th>Percentage</th>
						<th>Grade</th>
						<th>Status</th>
					</tr>
				</thead>
				<tbody>
		`;
		
		results.forEach(result => {
			const gradeClass = 'grade-' + (result.grade || 'ng').toLowerCase().replace('+', '-plus');
			tableHTML += `
				<tr>
					<td>${result.roll_number}</td>
					<td>${result.student_name}</td>
					<td>${result.student_class}</td>
					<td>${result.total || 0}</td>
					<td>${result.gpa || 0}</td>
					<td>${result.percentage || 0}%</td>
					<td class="grade-cell ${gradeClass}">${result.grade || 'NG'}</td>
					<td>${result.gpa >= 2.0 ? 'Passed' : 'Failed'}</td>
				</tr>
			`;
		});
		
		tableHTML += '</tbody></table>';
		this.elements.resultsTableContainer.innerHTML = tableHTML;
	}
	
	showLoading() {
		this.isLoading = true;
		if (this.elements.loadingSpinner) {
			this.elements.loadingSpinner.style.display = 'block';
		}
	}
	
	hideLoading() {
		this.isLoading = false;
		if (this.elements.loadingSpinner) {
			this.elements.loadingSpinner.style.display = 'none';
		}
	}
	
	showError(message) {
		this.hideSuccess();
		if (this.elements.errorMessage) {
			this.elements.errorMessage.textContent = message;
			this.elements.errorMessage.style.display = 'block';
		}
	}
	
	hideError() {
		if (this.elements.errorMessage) {
			this.elements.errorMessage.style.display = 'none';
		}
	}
	
	showSuccess(message) {
		this.hideError();
		if (this.elements.successMessage) {
			this.elements.successMessage.textContent = message;
			this.elements.successMessage.style.display = 'block';
		}
	}
	
	hideSuccess() {
		if (this.elements.successMessage) {
			this.elements.successMessage.style.display = 'none';
		}
	}
	
	getCSRFToken() {
		const name = 'csrftoken';
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
}

// Initialize the enhanced marks entry system when DOM is loaded

document.addEventListener('DOMContentLoaded', function() {
	new EnhancedMarksEntry();
}); 