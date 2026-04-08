const prisma = require("./prisma");

/**
 * Generates a unique email in the format firstname.lastname@pylvia.com
 * If the email exists, it appends a number.
 * @param {string} firstName 
 * @param {string} lastName 
 * @returns {Promise<string>}
 */
async function generateUniqueEmail(firstName, lastName) {
  const base = `${firstName.toLowerCase().trim()}.${lastName.toLowerCase().trim()}`.replace(/\s+/g, "");
  let email = `${base}@pylvia.com`;
  let counter = 1;

  while (true) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) break;
    counter++;
    email = `${base}${counter}@pylvia.com`;
  }

  return email;
}

module.exports = {
  generateUniqueEmail
};
