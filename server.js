const express = require('express');
const app = express();
const port = 3000;

// Serve all files from 'public' folder
app.use(express.static('public'));
app.use(express.json());

// When someone visits the root URL (/)
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Login page (optional explicit route)
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

// Signup page (optional explicit route)
app.get('/signup', (req, res) => {
    res.sendFile(__dirname + '/public/signup.html');
});

// Start the server
app.listen(port, () => {
    console.log(`🚀 Stride running at http://localhost:${port}`);
});