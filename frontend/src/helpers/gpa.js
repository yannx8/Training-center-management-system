export function gradeToLetter(n) {
    if (n >= 90) return 'A+';
    if (n >= 85) return 'A';
    if (n >= 80) return 'A-';
    if (n >= 75) return 'B+';
    if (n >= 70) return 'B';
    if (n >= 65) return 'B-';
    if (n >= 60) return 'C+';
    if (n >= 55) return 'C';
    if (n >= 50) return 'D';
    return 'F';
}