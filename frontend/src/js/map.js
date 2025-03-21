// Function to load header and footer dynamically
function loadComponent(id, file) {
    fetch(file)
        .then(response => response.text())
        .then(data => document.getElementById(id).innerHTML = data)
        .catch(error => console.error(`Error loading ${file}:`, error));
}

// Function to get URL parameters
function getUrlParams() {
    const params = {};
    const queryString = window.location.search.substring(1);
    const pairs = queryString.split('&');
    
    for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i].split('=');
        params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    
    return params;
}

// Get severity color based on score (copied from dashboard.js for consistency)
function getSeverityColor(score) {
    if (score === undefined) return "gray";
    score = parseFloat(score);
    if (score >= 0 && score < 3) return "green";   // Low
    if (score >= 3 && score < 7) return "yellow";  // Medium
    return "red";                                  // High
}

// Load header and footer
document.addEventListener("DOMContentLoaded", function () {
    loadComponent("header", "../pages/header.html");
    loadComponent("footer", "../pages/footer.html");
    
    // Initialize map after DOM is loaded
    initializeMap();
});

// Initialize map and handle URL parameters
function initializeMap() {
    // Get parameters from URL
    const params = getUrlParams();
    
    // Set default center if no parameters found
    let center = [22.3039, 70.8022]; // Default to Rajkot
    let zoom = 13;
    
    // Check if we have specific issue coordinates
    if (params.lat && params.lng) {
        center = [parseFloat(params.lat), parseFloat(params.lng)];
        zoom = 16; // Zoom in more when viewing specific issue
    }
    
    // Initialize map with appropriate center
    var map = L.map('map').setView(center, zoom);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    
    // If we have specific issue parameters, add a marker for it
    if (params.id && params.lat && params.lng) {
        const issueMarker = L.marker(center).addTo(map);
        
        // Create popup content with issue details
        const title = params.title || 'Unknown Issue';
        const description = params.description || 'No description available';
        const severity = params.severity || 0;
        const severityColor = getSeverityColor(severity);
        
        issueMarker.bindPopup(`
            <div class="issue-popup">
                <h4>${title}</h4>
                <p>${description}</p>
                <p><b>Severity:</b> <span style="color: ${severityColor};">
                    ${severity} (${severityColor.toUpperCase()})
                </span></p>
            </div>
        `).openPopup();
    }
    
    // Load all other issues
    loadAllIssues(map);
}

// Load all issues from API
function loadAllIssues(map) {
    fetch("http://localhost:5000/issues")
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(issues => {
            console.log("Loaded Issues from server:", issues);
            
            // Add markers for all issues
            issues.forEach(issue => {
                // Parse location if available
                let lat, lng;
                const locationText = issue.location || "";
                
                // Try to extract coordinates from the location string
                const coordsMatch = locationText.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
                if (coordsMatch) {
                    lat = parseFloat(coordsMatch[1]);
                    lng = parseFloat(coordsMatch[2]);
                } else {
                    // Skip issues without valid coordinates
                    return;
                }
                
                const severityScore = issue.severityScore || issue.severity || 0;
                
                // Create marker
                const marker = L.marker([lat, lng]).addTo(map);
                
                // Create popup
                marker.bindPopup(`
                    <div class="issue-popup">
                        <h4>${issue.title}</h4>
                        <p>${issue.description}</p>
                        <p><b>Location:</b> ${issue.location}</p>
                        <p><b>Severity:</b> <span style="color: ${getSeverityColor(severityScore)};">
                            ${severityScore} (${getSeverityColor(severityScore).toUpperCase()})
                        </span></p>
                        <p><b>Votes:</b> ${issue.upvotes || issue.votes || 0}</p>
                    </div>
                `);
            });
        })
        .catch(error => {
            console.error("Error loading issues:", error);
        });
}

// Connect to WebSocket Server for real-time updates
try {
    const socket = io("http://localhost:5000");
    
    socket.on("connect", () => {
        console.log("Connected to WebSocket server for map updates");
    });
    
    socket.on("new_issue", (issue) => {
        console.log("New issue received:", issue);
        // Refresh the map or add new marker dynamically
        // This will depend on your specific implementation
    });
} catch (error) {
    console.warn("WebSocket connection failed for map:", error);
}