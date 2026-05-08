// STEP 1: WAIT FOR PAGE TO LOAD
// DOMContentLoaded = event that fires when HTML is fully loaded
// This ensures JavaScript doesn't try to find elements that don't exist yet
document.addEventListener('DOMContentLoaded', function() {
    // Find the login form on the page
    const loginForm = document.getElementById('loginForm');
    // Find the signup form on the page
    const signupForm = document.getElementById('signupForm');
    
    // STEP 2: LOGIN FORM HANDLER
    if (loginForm) {
        // 'submit' event = when user clicks submit button or presses Enter
        loginForm.addEventListener('submit', function(event) {
            // preventDefault = stop browser from refreshing page
            // Without this, page would reload and we'd lose our JavaScript
            event.preventDefault();
            
            // Get the values user typed
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            // Validation: check if fields are empty
            if (!email || !password) {
                alert('Please fill in both email and password');
                return;  // Stop execution here
            }
            
            // Simple email validation (contains @ and .)
            if (!email.includes('@') || !email.includes('.')) {
                alert('Please enter a valid email address');
                return;
            }
            
            // Get existing users from localStorage
            const users = JSON.parse(localStorage.getItem('users')) || [];
            
            // Find user with matching email and password
            const user = users.find(u => u.email === email && u.password === password);
            
            if (user) {
                // ✅ SAVE CURRENT USER TO LOCALSTORAGE
                localStorage.setItem('currentUser', JSON.stringify({
                    name: user.name,
                    email: user.email
                }));
                
                console.log('Login successful:', { email });
                alert('Login successful!');
                
                // Redirect to dashboard
                window.location.href = 'dashboard.html';
            } else {
                alert('Invalid email or password. Please try again or sign up.');
            }
        });
    }
    
    // STEP 3: SIGNUP FORM HANDLER
    if (signupForm) {
        signupForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            // Get all form values
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const confirm = document.getElementById('signup-confirm').value;
            
            // Validation checks (run in order)
            
            // Check 1: All fields filled
            if (!name || !email || !password || !confirm) {
                alert('Please fill in all fields');
                return;
            }
            
            // Check 2: Valid email format
            if (!email.includes('@') || !email.includes('.')) {
                alert('Please enter a valid email address');
                return;
            }
            
            // Check 3: Password length (at least 6 characters)
            if (password.length < 6) {
                alert('Password must be at least 6 characters long');
                return;
            }
            
            // Check 4: Passwords match
            if (password !== confirm) {
                alert('Passwords do not match');
                return;
            }
            
            // Get existing users from localStorage
            const users = JSON.parse(localStorage.getItem('users')) || [];
            
            // Check if email already exists
            const emailExists = users.some(u => u.email === email);
            
            if (emailExists) {
                alert('An account with this email already exists. Please login.');
                return;
            }
            
            // Create new user object
            const newUser = {
                name: name,
                email: email,
                password: password
            };
            
            // Add to users array
            users.push(newUser);
            
            // Save back to localStorage
            localStorage.setItem('users', JSON.stringify(users));
            
            // ✅ SAVE CURRENT USER TO LOCALSTORAGE (auto-login after signup)
            localStorage.setItem('currentUser', JSON.stringify({
                name: name,
                email: email
            }));
            
            // All checks passed!
            console.log('Signup successful:', { name, email });
            alert('Account created successfully!');
            
            // Redirect to dashboard after successful signup
            window.location.href = 'dashboard.html';
        });
    }
    
    // STEP 4: ADD REAL-TIME FEEDBACK (Optional)
    // This adds a green checkmark when passwords match (signup page)
    const passwordField = document.getElementById('signup-password');
    const confirmField = document.getElementById('signup-confirm');
    
    if (passwordField && confirmField) {
        // Create a small message element
        const matchMessage = document.createElement('small');
        matchMessage.style.display = 'block';
        matchMessage.style.marginTop = '5px';
        confirmField.parentNode.appendChild(matchMessage);
        
        // Listen for typing in confirm field
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