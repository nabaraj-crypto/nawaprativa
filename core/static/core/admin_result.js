// Live GPA, grade, and promotion calculator for Result admin
(function() {
    function getGrade(marks) {
        if (marks >= 90) return 'A+';
        if (marks >= 80) return 'A';
        if (marks >= 70) return 'B+';
        if (marks >= 60) return 'B';
        if (marks >= 50) return 'C+';
        if (marks >= 40) return 'C';
        if (marks >= 30) return 'D';
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
    function updateGPA() {
        var fields = ['english', 'nepali', 'math', 'science', 'social', 'computer'];
        var marks = [];
        fields.forEach(function(f) {
            var el = document.getElementById('id_' + f);
            var val = el ? parseInt(el.value, 10) : 0;
            if (!isNaN(val)) marks.push(val); else marks.push(0);
        });
        var total = marks.reduce(function(a, b) { return a + b; }, 0);
        var grades = marks.map(getGrade);
        var points = grades.map(getGradePoint);
        var avgGPA = points.length ? (points.reduce(function(a, b) { return a + b; }, 0) / points.length).toFixed(2) : '';
        var finalGrade = getGrade(total / marks.length);
        var promoted = marks.every(function(m) { return m >= 40; }) ? 'Promoted' : 'Not Promoted';
        // Update display
        var display = document.getElementById('live-gpa-display');
        if (!display) {
            display = document.createElement('div');
            display.id = 'live-gpa-display';
            display.style.margin = '12px 0 0 0';
            display.style.padding = '8px 12px';
            display.style.background = '#f8f8f8';
            display.style.border = '1px solid #ccc';
            display.style.fontSize = '1.05em';
            var marksField = document.getElementById('id_computer');
            if (marksField && marksField.parentNode) {
                marksField.parentNode.parentNode.appendChild(display);
            }
        }
        display.innerHTML =
            '<strong>Live GPA:</strong> ' + avgGPA +
            ' &nbsp; <strong>Final Grade:</strong> ' + finalGrade +
            ' &nbsp; <strong>Result:</strong> ' + promoted;
        // Optionally update the GPA/total fields if present
        var gpaField = document.getElementById('id_gpa');
        if (gpaField) gpaField.value = avgGPA;
        var totalField = document.getElementById('id_total');
        if (totalField) totalField.value = total;
    }
    window.addEventListener('load', function() {
        var fields = ['english', 'nepali', 'math', 'science', 'social', 'computer'];
        fields.forEach(function(f) {
            var el = document.getElementById('id_' + f);
            if (el) el.addEventListener('input', updateGPA);
        });
        updateGPA();
    });
})(); 