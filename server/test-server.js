const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Registration test route
app.post('/api/auth/register', (req, res) => {
  console.log('Registration request received:', req.body);
  res.json({
    success: true,
    message: 'Test registration successful',
    data: { userId: 'test123' }
  });
});

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
