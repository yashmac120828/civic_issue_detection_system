const socket = io("http://localhost:5000"); // Change to your backend URL

// Emit a new issue when a user reports one
function reportIssue(issue) {
    socket.emit("new_issue", issue);
}

socket.on("update_issues", (issues) => {
    console.log("Live update received:", issues);
    displayIssues(issues);
    updateMapMarkers(issues);
});

socket.on("new_issue_detected", (issue) => {
    console.log("New issue detected:", issue);
    showAlert(issue);
    addIssueToList(issue);
});

// Function to show a live alert
function showAlert(issue) {
    const alertBox = document.createElement("div");
    alertBox.classList.add("live-alert");
    alertBox.innerHTML = `
        🚨 <b>New Issue Detected!</b> <br> ${issue.title} at ${issue.location}
    `;
    document.body.appendChild(alertBox);

    // Remove alert after 5 seconds
    setTimeout(() => alertBox.remove(), 5000);
}
