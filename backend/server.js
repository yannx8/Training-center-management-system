require('dotenv').config();
const app = require('./app');
// Start the engine! This launches our express server on the specified port.
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(' Server running on port ' + PORT));