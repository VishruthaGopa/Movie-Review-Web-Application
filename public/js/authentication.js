// variable to track user authentication status
let isAuthenticated = false;
let userRole;

// Function to enable main content section when authenticated
function enableMainContent() {
  if (isAuthenticated) {
    // Redirect to /movieclub after successful authentication
    console.log("enableMain Content function")
    window.location.href = '/movieclub';
    updateFavorite()
  }
}

// Example functions for registration and login (replace with actual logic)
function registerUser() {
  const regUsername = document.getElementById('regUsername').value;
  const regPassword = document.getElementById('regPassword').value;

  document.getElementById('registration-message').innerText = 'Register clicked.';
  fetch('/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      regUsername,
      regPassword,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      document.getElementById('registration-message').innerText = data.message;
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}

function loginUser() {
  const loginUsername = document.getElementById('loginUsername').value;
  const loginPassword = document.getElementById('loginPassword').value;

  // Make a request to the server to check authentication
  fetch('/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      loginUsername,
      loginPassword,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      if (data.isAuthenticated) {
        // Authentication successful
        isAuthenticated = true;
        userRole = data.role;
        //console.log(userRole);
        enableMainContent();
        console.log('Authentication successful!');
      } else {
        // Display an error message for failed login
        document.getElementById('login-error').innerText = 'Invalid username or password';
        console.log('Invalid username or password');
      }
    })
    .catch((error) => {
      console.error('Error:', error);
    });

}

document.addEventListener('DOMContentLoaded', function () {
    // Event listener for register button
    document.getElementById('registerButton').addEventListener('click', function () {
        console.log('Register button clicked.');
        registerUser();
    });

    // Event listener for login button
    document.getElementById('loginButton').addEventListener('click', function () {
        console.log('Login button clicked.');
        loginUser();
    });
});
