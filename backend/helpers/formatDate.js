// FILE: /backend/helpers/formatDate.js
function formatDate(date) {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-GB'); // dd/mm/yyyy
}

function toISODate(date) {
    if (!date) return null;
    return new Date(date).toISOString().split('T')[0];
}

module.exports = { formatDate, toISODate };