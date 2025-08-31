console.log('Starting SafeTourAI Server...');

try {
  require('./server.js');
} catch (error) {
  console.error('Server startup error:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
