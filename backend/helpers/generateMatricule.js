function generateMatricule(programCode, year, sequenceNumber) {
    const paddedSeq = String(sequenceNumber).padStart(4, '0');
    return `${programCode.toUpperCase()}${year}${paddedSeq}`;
}

module.exports = { generateMatricule };