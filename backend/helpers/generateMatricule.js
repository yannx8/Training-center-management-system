// FILE: /backend/helpers/generateMatricule.js
// Pure function — no DB calls. Takes enough info to produce a unique-looking
// matricule. The sequence number ensures uniqueness; caller is responsible
// for providing the next available sequence from the DB.
function generateMatricule(programCode, year, sequenceNumber) {
    const paddedSeq = String(sequenceNumber).padStart(4, '0');
    return `${programCode.toUpperCase()}${year}${paddedSeq}`;
}

module.exports = { generateMatricule };