try {
  console.log('Attempting to import surfConditionsService...');
  const service = require('../src/services/surfConditionsService');
  console.log('Import successful!');
} catch (err) {
  console.error('Import failed:', err);
}
