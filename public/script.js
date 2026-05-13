// STEP 1: WAIT FOR PAGE TO LOAD
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    // Get backend URL (use Render URL when deployed, localhost for testing)
    const API_URL = window.location.origin; // Uses same server
    
    // STEP 2: LOGIN FORM HANDLER
    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            if (!email || !password) {
                alert('Please fill in both email and password');
                return;
            }
            
            if (!email.includes('@') || !email.includes('.')) {
                alert('Please enter a valid email address');
                return;
            }
            
            try {
                const response = await fetch(`${API_URL}/api/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Save user to localStorage for frontend state
                    localStorage.setItem('currentUser', JSON.stringify(data.user));
                    alert('Login successful!');
                    window.location.href = 'dashboard.html';
                } else {
                    alert(data.error || 'Login failed');
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('Server error. Please try again.');
            }
        });
    }
    
    // STEP 3: SIGNUP FORM HANDLER
    if (signupForm) {
        signupForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const confirm = document.getElementById('signup-confirm').value;
            
            if (!name || !email || !password || !confirm) {
                alert('Please fill in all fields');
                return;
            }
            
            if (!email.includes('@') || !email.includes('.')) {
                alert('Please enter a valid email address');
                return;
            }
            
            if (password.length < 6) {
                alert('Password must be at least 6 characters long');
                return;
            }
            
            if (password !== confirm) {
                alert('Passwords do not match');
                return;
            }
            
            try {
                const response = await fetch(`${API_URL}/api/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    localStorage.setItem('currentUser', JSON.stringify(data.user));
                    alert('Account created successfully!');
                    window.location.href = 'dashboard.html';
                } else {
                    alert(data.error || 'Signup failed');
                }
            } catch (error) {
                console.error('Signup error:', error);
                alert('Server error. Please try again.');
            }
        });
    }
    
    // Password match checker
    const passwordField = document.getElementById('signup-password');
    const confirmField = document.getElementById('signup-confirm');
    
    if (passwordField && confirmField) {
        const matchMessage = document.createElement('small');
        matchMessage.style.display = 'block';
        matchMessage.style.marginTop = '5px';
        confirmField.parentNode.appendChild(matchMessage);
        
        function checkPasswordsMatch() {
            if (confirmField.value === '') {
                matchMessage.textContent = '';
                matchMessage.style.color = '';
            } else if (passwordField.value === confirmField.value) {
                matchMessage.textContent = '✓ Passwords match';
                matchMessage.style.color = 'green';
            } else {
                matchMessage.textContent = '✗ Passwords do not match';
                matchMessage.style.color = 'red';
            }
        }
        
        confirmField.addEventListener('input', checkPasswordsMatch);
        passwordField.addEventListener('input', checkPasswordsMatch);
    }
});