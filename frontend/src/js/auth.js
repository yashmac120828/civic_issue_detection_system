// Register User
function register() {
    const username = document.getElementById("newUsername").value;
    const password = document.getElementById("newPassword").value;

    if (!username || !password) {
        alert("Please enter all fields!");
        return;
    }

    // Retrieve existing users from localStorage
    let users = JSON.parse(localStorage.getItem("users")) || [];

    // Check if user already exists
    if (users.some(user => user.username === username)) {
        alert("Username already exists. Please choose another.");
        return;
    }

    // Add new user to array
    users.push({ username, password });

    // Save updated user list to localStorage
    localStorage.setItem("users", JSON.stringify(users));

    alert("Registration successful! Please login.");
    window.location.href = "index.html";
}

// Login User
function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    // Retrieve users array
    let users = JSON.parse(localStorage.getItem("users")) || [];

    // Find user
    let user = users.find(user => user.username === username && user.password === password);

    if (user) {
        alert("Login successful!");
        localStorage.setItem("loggedInUser", JSON.stringify(user));
        window.location.href = "dashboard.html";
    } else {
        alert("Invalid credentials!");
    }
}

// Toggle Password Visibility
function togglePassword(inputId, iconId) {
    let passwordField = document.getElementById(inputId);
    let icon = document.getElementById(iconId);
    if (passwordField.type === "password") {
        passwordField.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
    } else {
        passwordField.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
    }
}
