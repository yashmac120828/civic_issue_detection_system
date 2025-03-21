// Global variables
let issues = [];
let debounceTimeout;

// Severity color mapping
const severityColor = {
    low: "green",
    medium: "orange",
    high: "red"
};

// Initialize socket if available
try {
    if (typeof socket !== 'undefined') {
        socket.on("connect", () => {
            console.log("Connected to WebSocket server");
        });
        socket.on("issue_upvoted", (data) => {
            console.log("Issue upvoted:", data);
            loadIssues(); // Refresh issues after upvote
        });
    }
} catch (error) {
    console.warn("WebSocket connection failed:", error);
}

// Initialize the application
function initializeApp() {
    console.log("Initializing application...");
    
    // Load header and footer
    loadComponent("header", "../pages/header.html");
    loadComponent("footer", "../pages/footer.html");
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial data
    loadIssues();
    
    // Initialize components
    initializeFormComponents();
}

// Function to load header and footer dynamically
function loadComponent(id, file) {
    fetch(file)
        .then(response => response.text())
        .then(data => document.getElementById(id).innerHTML = data)
        .catch(error => console.error(`Error loading ${file}:`, error));
}

// Set up all event listeners
function setupEventListeners() {
    // Search input with debounce
    const searchInput = document.getElementById("search");
    if (searchInput) {
        searchInput.addEventListener("input", handleSearchInput);
    }
    
    // Category filter
    const categoryFilter = document.getElementById("categoryFilter");
    if (categoryFilter) {
        categoryFilter.addEventListener("change", filterIssues);
    }
    
    // Current location button
    const getCurrentLocationBtn = document.getElementById("getCurrentLocation");
    if (getCurrentLocationBtn) {
        getCurrentLocationBtn.addEventListener("click", getCurrentLocation);
    }
    
    // Tab activation event for map
    const mapTab = document.getElementById('map-tab');
    if (mapTab) {
        mapTab.addEventListener('shown.bs.tab', function() {
            initializeMap();
        });
    }
}

// Handle search input with debounce
function handleSearchInput() {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        const searchValue = document.getElementById("search").value;
        console.log("Searching for:", searchValue);
        fetchIssues(searchValue);
    }, 500);
}

// Get current location
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                document.getElementById("issueLocation").value = `${lat}, ${lng}`;
            },
            function(error) {
                console.error("Error getting location:", error);
                alert("Unable to retrieve your location. Please enter it manually.");
            }
        );
    } else {
        alert("Geolocation is not supported by this browser. Please enter location manually.");
    }
}

// Initialize form components (sliders, image preview, etc.)
function initializeFormComponents() {
    // Image preview
    const issueImage = document.getElementById("issueImage");
    const previewImg = document.getElementById("previewImg");
    const imagePreview = document.getElementById("imagePreview");
    
    if (issueImage && previewImg && imagePreview) {
        issueImage.addEventListener("change", function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewImg.src = e.target.result;
                    imagePreview.style.display = "block";
                }
                reader.readAsDataURL(this.files[0]);
            }
        });
    }
    
    // Severity slider
    const severitySlider = document.getElementById("issueSeverity");
    const severityValue = document.getElementById("severityValue");
    
    if (severitySlider && severityValue) {
        severitySlider.addEventListener("input", function() {
            severityValue.textContent = this.value;
        });
    }
}

// Fetch issues with search query
function fetchIssues(query) {
    fetch(`http://localhost:5000/issues?search=${query}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Fetched Issues:", data);
            issues = Array.isArray(data) ? data : [];
            displayIssues(issues);
        })
        .catch(error => {
            console.error("Error fetching issues:", error);
            // Use existing issues but filter them client-side
            if (issues.length > 0) {
                const filteredIssues = issues.filter(issue => 
                    issue.title.toLowerCase().includes(query.toLowerCase()) ||
                    issue.description.toLowerCase().includes(query.toLowerCase())
                );
                displayIssues(filteredIssues);
            }
        });
}

// Load all issues with fallback to mock data
function loadIssues() {
    console.log("Attempting to load issues...");
    
    fetch("http://localhost:5000/issues")
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Loaded Issues from server:", data);
            
            // Ensure data is an array
            let serverIssues = Array.isArray(data) ? data : [];
            
            // Get solved issues from local storage
            let solvedIssueIds = JSON.parse(localStorage.getItem("solvedIssues")) || [];
            
            // Filter out solved issues
            issues = serverIssues.filter(issue => !solvedIssueIds.includes(issue.id));
            
            console.log("Issues after filtering solved ones:", issues);
            displayIssues(issues);
        })
        .catch(error => {
            console.error("Error loading issues:", error);
            // Using mock data in case the server is unavailable
            console.log("Server unavailable, using mock data");
            
            // Try to use data from localStorage first
            const storedIssues = JSON.parse(localStorage.getItem("issues")) || [];
            
            if (storedIssues.length > 0) {
                console.log("Using stored issues:", storedIssues);
                issues = storedIssues;
            } else {
                // Create some mock issues if nothing in localStorage
                const mockIssues = [
                    {
                        id: "mock1",
                        title: "Pothole on Main Street",
                        description: "Large pothole causing traffic problems",
                        location: "22.3039, 70.8022",
                        category: "infrastructure",
                        severityScore: 7,
                        votes: 12,
                        status: "New",
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: "mock2",
                        title: "Broken Street Light",
                        description: "Street light not working at night",
                        location: "22.3100, 70.7900",
                        category: "safety",
                        severityScore: 5,
                        votes: 8,
                        status: "In Progress",
                        createdAt: new Date().toISOString()
                    }
                ];
                
                // Use mock data
                issues = mockIssues;
                // Store mock data in localStorage for future use
                localStorage.setItem("issues", JSON.stringify(mockIssues));
            }
            
            displayIssues(issues);
        });
}

// Submit a new issue
function submitIssue() {
    const title = document.getElementById("issueTitle").value;
    const description = document.getElementById("issueDescription").value;
    const location = document.getElementById("issueLocation").value;
    const category = document.getElementById("issueCategory").value;
    const severity = document.getElementById("issueSeverity").value;
    const issueImage = document.getElementById("issueImage");

    if (!title || !description || !location) {
        alert("Please fill all required fields!");
        return;
    }

    console.log("Submitting issue:", { title, description, location, category, severity });

    // Create form data for submission
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("location", location);
    formData.append("category", category);
    formData.append("severity", severity);
    
    if (issueImage.files.length > 0) {
        formData.append("image", issueImage.files[0]);
    }

    // Try to submit to backend
    fetch("http://localhost:5000/report", {
        method: "POST",
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log("Issue submitted successfully:", data);
        handleSuccessfulSubmission(data.issue);
    })
    .catch(error => {
        console.error("Error submitting issue:", error);
        // Create a fallback for demo purposes when server is unavailable
        const mockIssue = {
            id: `local-${Date.now()}`,
            title: title,
            description: description,
            location: location,
            category: category,
            severityScore: parseInt(severity),
            status: "New",
            votes: 0,
            createdAt: new Date().toISOString()
        };
        
        // Store in localStorage
        const storedIssues = JSON.parse(localStorage.getItem("issues")) || [];
        storedIssues.push(mockIssue);
        localStorage.setItem("issues", JSON.stringify(storedIssues));
        
        // Continue with the successful flow
        handleSuccessfulSubmission(mockIssue);
    });
}

// Handle successful issue submission
function handleSuccessfulSubmission(newIssue) {
    // Switch to the issues tab
    const issuesTab = document.getElementById('issues-tab');
    if (issuesTab) {
        const tabInstance = new bootstrap.Tab(issuesTab);
        tabInstance.show();
    }
    
    // Clear form
    document.getElementById("issueTitle").value = "";
    document.getElementById("issueDescription").value = "";
    document.getElementById("issueLocation").value = "";
    document.getElementById("issueImage").value = "";
    
    const imagePreview = document.getElementById("imagePreview");
    if (imagePreview) {
        imagePreview.style.display = "none";
    }
    
    // Add to local issues array and refresh display
    if (newIssue) {
        issues.push(newIssue);
        displayIssues(issues);
    } else {
        loadIssues(); // Fallback to reload all issues
    }
    
    // Show success message
    showToast("Success", "Your issue was reported successfully!");
}

// Filter issues by category
function filterIssues() {
    const category = document.getElementById("categoryFilter").value;
    console.log("Filtering by category:", category);
    
    if (category === "all") {
        displayIssues(issues);
    } else {
        const filteredIssues = issues.filter(issue => 
            (issue.category || "").toLowerCase() === category.toLowerCase()
        );
        displayIssues(filteredIssues);
    }
}

// Get severity color based on score
function getSeverityColor(score) {
    if (score === undefined) return "secondary";
    if (score >= 0 && score < 3) return "success";   // Low
    if (score >= 3 && score < 7) return "warning";  // Medium
    return "danger";                                  // High
}

// Get status color based on status name
function getStatusColor(status) {
    switch(status.toLowerCase()) {
        case 'new': return 'info';
        case 'in progress': return 'warning';
        case 'under review': return 'primary';
        case 'resolved': return 'success';
        default: return 'secondary';
    }
}

// Upvote an issue
async function upvoteIssue(issueId) {
    try {
        const response = await fetch(`http://localhost:5000/api/issues/${issueId}/upvote`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Upvote successful:", data);
        
        // Refresh issues to reflect the change
        loadIssues();
    } catch (error) {
        console.error("Error upvoting issue:", error);
        
        // Handle upvote locally if server is unavailable
        const issue = issues.find(i => i.id === issueId);
        if (issue) {
            // Increment votes
            issue.votes = (issue.votes || 0) + 1;
            issue.upvotes = (issue.upvotes || 0) + 1; // Handle both property names
            
            // Update in localStorage
            const storedIssues = JSON.parse(localStorage.getItem("issues")) || [];
            const storedIndex = storedIssues.findIndex(i => i.id === issueId);
            if (storedIndex !== -1) {
                storedIssues[storedIndex] = issue;
                localStorage.setItem("issues", JSON.stringify(storedIssues));
            }
            
            // Update UI
            displayIssues(issues);
        }
    }
}

// Mark issue as solved
function markIssueSolved(issueId) {
    console.log("Marking issue as solved:", issueId);
    
    // Get list of solved issues
    let solvedIssueIds = JSON.parse(localStorage.getItem("solvedIssues")) || [];
    
    // Add current issue to solved list if not already there
    if (!solvedIssueIds.includes(issueId)) {
        solvedIssueIds.push(issueId);
        localStorage.setItem("solvedIssues", JSON.stringify(solvedIssueIds));
    }
    
    // Remove issue from UI
    const issueElement = document.getElementById(`issue-${issueId}`);
    if (issueElement) {
        issueElement.remove();
    } else {
        console.warn(`Issue element with ID issue-${issueId} not found.`);
    }
    
    // Remove from current issues array
    issues = issues.filter(issue => issue.id !== issueId);
    
    // Update dashboard stats
    updateDashboardStats(issues);
    
    // Show toast
    showToast("Success", "Issue marked as solved!");
}

// Update issue status
function updateStatus(issueId, newStatus) {
    console.log(`Updating issue ${issueId} to status: ${newStatus}`);
    
    // Try to update on the server
    fetch(`http://localhost:5000/issues/${issueId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log("Status updated:", data);
        updateIssueStatusUI(issueId, newStatus);
    })
    .catch(error => {
        console.error("Error updating status:", error);
        // Update locally if server fails
        updateIssueStatusUI(issueId, newStatus);
    });
}

// Update issue status in UI and localStorage
function updateIssueStatusUI(issueId, newStatus) {
    // Update in the issues array
    const issue = issues.find(i => i.id === issueId);
    if (issue) {
        issue.status = newStatus;
    }
    
    // Update in localStorage
    const storedIssues = JSON.parse(localStorage.getItem("issues")) || [];
    const storedIndex = storedIssues.findIndex(i => i.id === issueId);
    if (storedIndex !== -1) {
        storedIssues[storedIndex].status = newStatus;
        localStorage.setItem("issues", JSON.stringify(storedIssues));
    }
    
    // Update status badge in UI
    const statusBadge = document.querySelector(`#issue-${issueId} .status-badge`);
    if (statusBadge) {
        statusBadge.textContent = newStatus;
        statusBadge.className = `badge bg-${getStatusColor(newStatus)} status-badge`;
    }
    
    // Show toast
    showToast("Success", `Issue status updated to: ${newStatus}`);
}

// Update dashboard statistics
function updateDashboardStats(issuesList) {
    const totalIssues = issuesList.length;
    const pendingIssues = issuesList.filter(issue => 
        (issue.status || "").toLowerCase() !== "resolved"
    ).length;
    const resolvedIssues = totalIssues - pendingIssues;
    const highSeverityIssues = issuesList.filter(issue => 
        (issue.severityScore || issue.severity || 0) >= 7
    ).length;
    
    // Update the stats display
    const totalElement = document.getElementById("totalIssues");
    const pendingElement = document.getElementById("pendingIssues");
    const resolvedElement = document.getElementById("resolvedIssues");
    const highSeverityElement = document.getElementById("highSeverityIssues");
    
    if (totalElement) totalElement.textContent = totalIssues;
    if (pendingElement) pendingElement.textContent = pendingIssues;
    if (resolvedElement) resolvedElement.textContent = resolvedIssues;
    if (highSeverityElement) highSeverityElement.textContent = highSeverityIssues;
}

// Display issues in the UI
function displayIssues(issues) {
    const container = document.getElementById("issuesContainer");
    if (!container) {
        console.error("Issues container not found!");
        return;
    }
    
    container.innerHTML = "";

    // Update stats
    updateDashboardStats(issues);

    if (!issues || !Array.isArray(issues) || issues.length === 0) {
        container.innerHTML = `<div class="col-12 text-center">
            <p class="text-muted">No issues found. Be the first to report one!</p>
        </div>`;
        return;
    }

    // Sort issues by votes (descending)
    issues.sort((a, b) => {
        const aVotes = a.upvotes || a.votes || 0;
        const bVotes = b.upvotes || b.votes || 0;
        return bVotes - aVotes;
    });

    issues.forEach((issue) => {
        if (!issue || !issue.id) {
            console.warn("Invalid issue object:", issue);
            return;
        }
        
        const severityScore = issue.severityScore || issue.severity || 0;
        const votes = issue.upvotes || issue.votes || 0;
        const imageSrc = issue.image ? `http://localhost:5000/backend${issue.image}` : "https://via.placeholder.com/400x300?text=No+Image";
        const category = issue.category || "Other";
        const status = issue.status || "New";
        const reportDate = new Date(issue.createdAt || Date.now()).toLocaleDateString();
        
        // Parse location
        let lat, lng;
        const locationText = issue.location || "";
        const coordsMatch = locationText.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
        if (coordsMatch) {
            lat = parseFloat(coordsMatch[1]);
            lng = parseFloat(coordsMatch[2]);
        } else {
            lat = 22.3039;
            lng = 70.8022;
        }

        const issueElement = document.createElement("div");
        issueElement.classList.add("col-md-4", "mb-4");
        issueElement.id = `issue-${issue.id}`;

        // Get status and severity colors
        const statusColor = getStatusColor(status);
        const severityColor = getSeverityColor(severityScore);

        issueElement.innerHTML = `
            <div class="card issue-card">
                <span class="badge bg-${statusColor} status-badge">${status}</span>
                <span class="badge bg-${severityColor} severity-badge">
                    Severity: ${severityScore}/10
                </span>
                <img src="${imageSrc}" class="card-img-top" alt="Issue Image">
                <div class="card-body">
                    <h5 class="card-title">${issue.title}</h5>
                    <div class="issue-meta">
                        <span><i class="fas fa-calendar-alt"></i> ${reportDate}</span>
                        <span><i class="fas fa-tag"></i> ${category}</span>
                    </div>
                    <p class="card-text">${issue.description}</p>
                    <p><i class="fas fa-map-marker-alt"></i> <a href="javascript:void(0)" class="location-link" 
                       onclick="viewOnMap('${issue.id}', ${lat}, ${lng}, '${encodeURIComponent(issue.title)}', '${encodeURIComponent(issue.description)}', ${severityScore})">
                       ${issue.location} 📍</a></p>
                    <div class="d-flex justify-content-between align-items-center">
                        <button class="btn btn-sm btn-outline-primary" onclick="upvoteIssue('${issue.id}')">
                            <i class="fas fa-thumbs-up"></i> Upvote (${votes})
                        </button>
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                Actions
                            </button>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="javascript:void(0)" onclick="showComments('${issue.id}')">
                                    <i class="fas fa-comments"></i> Comments
                                </a></li>
                                <li><a class="dropdown-item" href="javascript:void(0)" onclick="updateStatus('${issue.id}', 'In Progress')">
                                    <i class="fas fa-tasks"></i> Mark In Progress
                                </a></li>
                                <li><a class="dropdown-item" href="javascript:void(0)" onclick="markIssueSolved('${issue.id}')">
                                    <i class="fas fa-check"></i> Mark as Solved
                                </a></li>
                            </ul>
                        </div>
                    </div>
                    <div id="comments-section-${issue.id}" class="comment-section mt-3" style="display: none;">
                        <!-- Comments will be loaded here -->
                    </div>
                </div>
            </div>
        `;

        container.appendChild(issueElement);
        
    });
   
}

    

// Fetch comments for an issue
function fetchComments(issueId) {
    const commentsSection = document.getElementById(`comments-section-${issueId}`);
    commentsSection.innerHTML = '<div class="text-center"><div class="spinner-border spinner-border-sm" role="status"></div> Loading comments...</div>';
    
    fetch(`http://localhost:5000/issues/${issueId}/comments`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Fetched comments:", data);
            displayComments(issueId, data);
        })
        .catch(error => {
            console.error("Error fetching comments:", error);
            
            // Check if there are stored comments
            const storedComments = JSON.parse(localStorage.getItem(`comments-${issueId}`)) || [];
            
            if (storedComments.length > 0) {
                displayComments(issueId, storedComments);
            } else {
                // Show empty state with add comment form
                commentsSection.innerHTML = `
                    <p class="text-muted">No comments yet. Be the first to comment!</p>
                    ${getCommentFormHTML(issueId)}
                `;
            }
        });
}

// Display comments for an issue
function displayComments(issueId, comments) {
    const commentsSection = document.getElementById(`comments-section-${issueId}`);
    
    if (!comments || !Array.isArray(comments) || comments.length === 0) {
        commentsSection.innerHTML = `
            <p class="text-muted">No comments yet. Be the first to comment!</p>
            ${getCommentFormHTML(issueId)}
        `;
        return;
    }
    
    let commentsHTML = '';
    
    comments.forEach(comment => {
        const commentDate = new Date(comment.createdAt || Date.now()).toLocaleDateString();
        commentsHTML += `
            <div class="comment-item border-bottom pb-2 mb-2">
                <div class="d-flex justify-content-between">
                    <strong>${comment.author || 'Anonymous'}</strong>
                    <small class="text-muted">${commentDate}</small>
                </div>
                <p class="mb-1">${comment.text}</p>
            </div>
        `;
    });
    
    commentsSection.innerHTML = `
        <div class="comments-list mb-3">
            ${commentsHTML}
        </div>
        ${getCommentFormHTML(issueId)}
    `;
}

// Get HTML for comment form
function getCommentFormHTML(issueId) {
    return `
        <div class="add-comment-form">
            <div class="form-group mb-2">
                <input type="text" class="form-control form-control-sm" id="comment-author-${issueId}" placeholder="Your Name">
            </div>
            <div class="input-group mb-2">
                <input type="text" class="form-control form-control-sm" id="comment-text-${issueId}" placeholder="Add a comment...">
                <button class="btn btn-sm btn-primary" type="button" onclick="addComment('${issueId}')">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>
    `;
}

// Add a new comment
function addComment(issueId) {
    const author = document.getElementById(`comment-author-${issueId}`).value || 'Anonymous';
    const text = document.getElementById(`comment-text-${issueId}`).value;
    
    if (!text) {
        alert("Please enter a comment!");
        return;
    }
    
    const newComment = {
        id: `local-${Date.now()}`,
        issueId: issueId,
        author: author,
        text: text,
        createdAt: new Date().toISOString()
    };
    
    // Try to submit to server
    fetch(`http://localhost:5000/issues/${issueId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newComment)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log("Comment added successfully:", data);
        // Refresh comments
        fetchComments(issueId);
    })
    .catch(error => {
        console.error("Error adding comment:", error);
        
        // Store comment locally if server fails
        const storedComments = JSON.parse(localStorage.getItem(`comments-${issueId}`)) || [];
        storedComments.push(newComment);
        localStorage.setItem(`comments-${issueId}`, JSON.stringify(storedComments));
        
        // Update UI
        fetchComments(issueId);
    });
    
    // Clear input field
    document.getElementById(`comment-text-${issueId}`).value = '';
}

// Initialize map
let map;
let markers = [];

function initializeMap() {
    console.log("Initializing map...");
    
    // Create map if not already initialized
    if (!map) {
        map = L.map('map').setView([22.3039, 70.8022], 12);
        
        // Add tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(map);
    }
    
    // Clear existing markers
    clearMapMarkers();
    
    // Add markers for each issue
    issues.forEach(issue => {
        addIssueMarker(issue);
    });
}

// Clear all markers from map
function clearMapMarkers() {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
}

// Add a marker for an issue
function addIssueMarker(issue) {
    if (!issue || !issue.location) return;
    
    // Parse location
    const locationText = issue.location;
    const coordsMatch = locationText.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
    
    if (!coordsMatch) return;
    
    const lat = parseFloat(coordsMatch[1]);
    const lng = parseFloat(coordsMatch[2]);
    const severityScore = issue.severityScore || issue.severity || 0;
    
    // Create custom icon based on severity
    const icon = L.divIcon({
        className: 'custom-marker-icon',
        html: `<div class="marker-icon severity-${getSeverityClass(severityScore)}"></div>`,
        iconSize: [25, 25],
        iconAnchor: [12, 12]
    });
    
    // Create marker
    const marker = L.marker([lat, lng], {
        icon: icon,
        title: issue.title
    }).addTo(map);
    
    // Create popup content
    const popupContent = `
        <div class="map-info-window">
            <h5>${issue.title}</h5>
            <p>${issue.description}</p>
            <p><strong>Category:</strong> ${issue.category || 'Other'}</p>
            <p><strong>Severity:</strong> ${severityScore}/10</p>
            <p><strong>Status:</strong> ${issue.status || 'New'}</p>
            <button class="btn btn-sm btn-primary map-btn" onclick="showIssueDetail('${issue.id}')">View Details</button>
        </div>
    `;
    
    // Add popup
    marker.bindPopup(popupContent);
    
    // Store marker
    markers.push(marker);
}

// Get severity class for marker styling
function getSeverityClass(score) {
    if (score >= 7) {
        return 'high'; // High
    } else if (score >= 3) {
        return 'medium'; // Medium
    }
    return 'low'; // Low
}

// View issue on map
function viewOnMap(issueId, lat, lng, encodedTitle, encodedDescription, severityScore) {
    // Ensure lat and lng are numbers
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    // Check if valid coordinates
    if (isNaN(latitude) || isNaN(longitude)) {
        console.error("Invalid coordinates:", lat, lng);
        return;
    }
    
    // Switch to map tab
    const mapTab = document.getElementById('map-tab');
    if (mapTab) {
        const tabInstance = new bootstrap.Tab(mapTab);
        tabInstance.show();
    }
    
    // Initialize map if not done already
    if (!map) {
        initializeMap();
    }
    
    // Center map on issue location with delay to allow tab transition
    setTimeout(() => {
        if (map) {
            console.log("Setting view to:", latitude, longitude);
            map.setView([latitude, longitude], 15);
            
            // Try to find existing marker
            let existingMarker = null;
            for (let i = 0; i < markers.length; i++) {
                const position = markers[i].getLatLng();
                if (Math.abs(position.lat - latitude) < 0.0001 && Math.abs(position.lng - longitude) < 0.0001) {
                    existingMarker = markers[i];
                    break;
                }
            }
            
            if (!existingMarker) {
                // Create custom icon based on severity
                const icon = L.divIcon({
                    className: 'custom-marker-icon',
                    html: `<div class="marker-icon severity-${getSeverityClass(severityScore)}"></div>`,
                    iconSize: [25, 25],
                    iconAnchor: [12, 12]
                });
                
                // Create marker
                const marker = L.marker([latitude, longitude], {
                    icon: icon,
                    title: decodeURIComponent(encodedTitle)
                }).addTo(map);
                
                // Create popup content
                const popupContent = `
                    <div class="map-info-window">
                        <h5>${decodeURIComponent(encodedTitle)}</h5>
                        <p>${decodeURIComponent(encodedDescription)}</p>
                        <button class="btn btn-sm btn-primary map-btn" onclick="showIssueDetail('${issueId}')">View Details</button>
                    </div>
                `;
                
                // Add popup and open it
                marker.bindPopup(popupContent).openPopup();
                
                // Store marker
                markers.push(marker);
            } else {
                // Open popup of existing marker
                existingMarker.openPopup();
            }
        }
    }, 300);
}

// Function to handle current location for new issue reporting
document.addEventListener('DOMContentLoaded', function() {
    // Add event listener for "Get Current" location button
    const getCurrentLocationBtn = document.getElementById('getCurrentLocation');
    if (getCurrentLocationBtn) {
        getCurrentLocationBtn.addEventListener('click', function() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        const latitude = position.coords.latitude;
                        const longitude = position.coords.longitude;
                        document.getElementById('issueLocation').value = `${latitude}, ${longitude}`;
                        
                        // If map is initialized, show the position on map
                        if (map) {
                            // Switch to map tab
                            const mapTab = document.getElementById('map-tab');
                            if (mapTab) {
                                const tabInstance = new bootstrap.Tab(mapTab);
                                tabInstance.show();
                            }
                            
                            // Center map on current position
                            setTimeout(() => {
                                map.setView([latitude, longitude], 15);
                                
                                // Add temporary marker
                                const tempMarker = L.marker([latitude, longitude]).addTo(map);
                                tempMarker.bindPopup("Your current location").openPopup();
                                
                                // Remove marker after 5 seconds
                                setTimeout(() => {
                                    map.removeLayer(tempMarker);
                                }, 5000);
                            }, 300);
                        }
                    },
                    function(error) {
                        console.error("Error getting location:", error);
                        alert("Unable to get your current location. Please enter manually.");
                    }
                );
            } else {
                alert("Geolocation is not supported by your browser. Please enter location manually.");
            }
        });
    }
    
    // Initialize map when tab is shown
    const mapTab = document.getElementById('map-tab');
    if (mapTab) {
        mapTab.addEventListener('shown.bs.tab', function(e) {
            if (!map) {
                initializeMap();
            } else {
                // Refresh map size as it might not render properly when tab was hidden
                map.invalidateSize();
            }
        });
    }
});
// Show issue details
function showIssueDetail(issueId) {
    // Find the issue
    const issue = issues.find(i => i.id === issueId);
    if (!issue) {
        console.error("Issue not found:", issueId);
        return;
    }
    
    // Switch to issues tab
    const issuesTab = document.getElementById('issues-tab');
    if (issuesTab) {
        const tabInstance = new bootstrap.Tab(issuesTab);
        tabInstance.show();
    }
    
    // Scroll to the issue
    setTimeout(() => {
        const issueElement = document.getElementById(`issue-${issueId}`);
        if (issueElement) {
            issueElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            issueElement.classList.add('highlight-issue');
            
            // Remove highlight after animation
            setTimeout(() => {
                issueElement.classList.remove('highlight-issue');
            }, 2000);
        }
    }, 300);
}

// Show a toast notification
function showToast(title, message) {
    const toastContainer = document.getElementById("toastContainer");
    if (!toastContainer) return;
    
    const toastId = `toast-${Date.now()}`;
    const toastHTML = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
                <strong class="me-auto">${title}</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 3000 });
    toast.show();
    
    // Remove toast from DOM after it's hidden
    toastElement.addEventListener('hidden.bs.toast', function() {
        toastElement.remove();
    });
}

// Initialize when document is ready
document.addEventListener("DOMContentLoaded", function() {
    console.log("Document ready, initializing app...");
    initializeApp();
});