// FILE: /backend/helpers/gpa.js
// Pure functions for grade calculations — no DB calls.
function gradeToLetter(numeric) {
    if (numeric >= 90) return 'A+';
    if (numeric >= 85) return 'A';
    if (numeric >= 80) return 'A-';
    if (numeric >= 75) return 'B+';
    if (numeric >= 70) return 'B';
    if (numeric >= 65) return 'B-';
    if (numeric >= 60) return 'C+';
    if (numeric >= 55) return 'C';
    if (numeric >= 50) return 'D';
    return 'F';
}

function gradeToPoints(numeric) {
    if (numeric >= 90) return 4.0;
    if (numeric >= 85) return 4.0;
    if (numeric >= 80) return 3.7;
    if (numeric >= 75) return 3.3;
    if (numeric >= 70) return 3.0;
    if (numeric >= 65) return 2.7;
    if (numeric >= 60) return 2.3;
    if (numeric >= 55) return 2.0;
    if (numeric >= 50) return 1.0;
    return 0.0;
}

function calculateGPA(grades) {
    if (!grades.length) return 0;
    const total = grades.reduce((sum, g) => sum + gradeToPoints(g.grade), 0);
    return (total / grades.length).toFixed(2);
}

module.exports = { gradeToLetter, gradeToPoints, calculateGPA };