const express = require("express");
const http = require("http");
const cors = require("cors");
const multer = require("multer");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const path = require("path");
const fs = require("fs");

// Initialize Express app and server
const app = express();
const server = http.createServer(app);


// Setup Socket.io
const io = new Server(server, {
    cors: {
        origin: ["http://127.0.0.1:5500", "http://localhost:5500"],
        methods: ["GET", "POST","PUT"]
    }
});


app.use(cors({
    origin: ["http://127.0.0.1:5500", "http://localhost:5500"], // Allow both variations
    methods: ["GET", "POST","PUT"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));


app.use(bodyParser.json());
app.use('/backend/uploads', express.static(path.join(__dirname, 'uploads')));

// Load environment variables in production
const SECRET_KEY = process.env.JWT_SECRET || "supersecret"; // TODO: Use environment variable in production

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// In-memory data store (TODO: Replace with database in production)
let issues = [];

// Load issues from file if available
const ISSUES_FILE = path.join(__dirname, "issues.json");
try {
    if (fs.existsSync(ISSUES_FILE)) {
        const data = fs.readFileSync(ISSUES_FILE, "utf8");
        issues = JSON.parse(data);
        console.log(`Loaded ${issues.length} issues from file`);
    }
} catch (error) {
    console.error("Error loading issues from file:", error);
}

// Save issues to file
function saveIssues() {
    try {
        fs.writeFileSync(ISSUES_FILE, JSON.stringify(issues, null, 2));
        console.log("Issues saved to file");
    } catch (error) {
        console.error("Error saving issues to file:", error);
    }
}

// API Endpoints
app.get("/", (req, res) => res.send("Welcome to the Environmental Issues Tracker API!"));
// Update issue status
// Update issue status
app.put("/issues/:id/status", (req, res) => {
    try {
        const issueId = req.params.id;
        const { status } = req.body;
        
        console.log(`Received status update request: Issue ${issueId} to ${status}`);
        
        if (!status) {
            return res.status(400).json({ error: "Status is required" });
        }
        
        const issue = issues.find(issue => issue.id === issueId);
        
        if (!issue) {
            return res.status(404).json({ error: "Issue not found" });
        }
        
        // Update the status
        issue.status = status;
        saveIssues();
        
        // Emit to all connected clients
        io.emit("issue_status_updated", { id: issueId, status });
        
        res.json({ success: true, message: "Status updated successfully", issue });
    } catch (error) {
        console.error("Error updating issue status:", error);
        res.status(500).json({ error: "Failed to update issue status" });
    }
});
// Image upload configuration
const storage = multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
        // Generate a unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter to allow only images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({ 
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Setup multer for the AI detection endpoint
const aiDetectUpload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
app.post("/api/ai/detect", aiDetectUpload.single("image"), async (req, res) => { 
    try {
        // Ensure an image was uploaded
        if (!req.file) {
            return res.status(400).json({ error: "No image provided" });
        }

        console.log("🔍 Processing image:", req.file.filename);

        // 🔥 Future Scope: Integrate with AI Model (e.g., YOLO, TensorFlow)
        const aiDetectionResult = await mockAIDetection(req.file.path);

        res.json({
            success: true,
            message: "AI detection completed successfully",
            objects: aiDetectionResult
        });

    } catch (error) {
        console.error("❌ AI detection error:", error.message);
        res.status(500).json({ error: "AI detection failed", details: error.message });
    }
});

// Mock AI detection function (Replace this with actual AI model integration)
async function mockAIDetection(imagePath) {
    return [
        {
            x: 50,
            y: 50,
            width: 200,
            height: 200,
            label: "Environmental hazard",
            confidence: 0.95
        }
    ];
}

app.get("/api", (req, res) => res.json({ 
    message: "API is working!", 
    endpoints: [
        { path: "/issues", method: "GET", description: "Get all issues" },
        { path: "/report", method: "POST", description: "Report a new issue" },
        { path: "/api/issues/:id/upvote", method: "POST", description: "Upvote an issue" }
    ]
}));

// Login endpoint
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }
    
    // TODO: Implement proper authentication in production
    if (username && password) {
        const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });
        return res.json({ token });
    }
    res.status(401).json({ error: "Invalid credentials" });
});

// Report a new issue
app.post("/report", upload.single("image"), (req, res) => {
    try {
        const { title, description, location } = req.body;
        
        // Input validation
        if (!title || !description || !location) {
            return res.status(400).json({ error: "Title, description, and location are required" });
        }
        
        // Create new issue
        const newIssue = {
            id: Date.now().toString(), // Use timestamp as ID for uniqueness
            title,
            description,
            location,
            image: req.file ? `/uploads/${req.file.filename}` : null,
            severity: Math.floor(Math.random() * 10) + 1, // Random severity 1-10
            upvotes: 0,
            createdAt: new Date().toISOString()
        };
        
        issues.push(newIssue);
        saveIssues();
        
        // Emit to all connected clients
        io.emit("new_issue", newIssue);
        
        res.status(201).json({ success: true, issue: newIssue });
    } catch (error) {
        console.error("Error creating issue:", error);
        res.status(500).json({ error: "Failed to create issue" });
    }
});

// Fetch all issues
app.get("/issues", (req, res) => {
    try {
        const { search } = req.query;
        
        if (search) {
            const filteredIssues = issues.filter(issue => 
                issue.title.toLowerCase().includes(search.toLowerCase()) ||
                issue.description.toLowerCase().includes(search.toLowerCase()) ||
                issue.location.toLowerCase().includes(search.toLowerCase())
            );
            return res.json(filteredIssues);
        }
        
        res.json(issues);
    } catch (error) {
        console.error("Error fetching issues:", error);
        res.status(500).json({ error: "Failed to fetch issues" });
    }
});

// Upvote an issue
app.post("/api/issues/:id/upvote", (req, res) => {
    try {
        console.log("Received upvote request for ID:", req.params.id);
        
        const issueId = req.params.id;
        const issue = issues.find(issue => issue.id === issueId);
        
        if (!issue) {
            console.log("Issue not found!");
            return res.status(404).json({ error: "Issue not found" });
        }
        
        issue.upvotes = (issue.upvotes || 0) + 1;
        saveIssues();
        
        // Emit to all connected clients
        io.emit("issue_upvoted", { id: issueId, upvotes: issue.upvotes });
        
        res.json({ success: true, message: "Upvoted successfully!", issue });
    } catch (error) {
        console.error("Error upvoting issue:", error);
        res.status(500).json({ error: "Failed to upvote issue" });
    }
});

// WebSocket handlers
io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);
    
    // Send current issues to the newly connected client
    socket.emit("all_issues", issues);
    
    // Handle new issue event
    socket.on("new_issue", (data) => {
        console.log("New issue event received:", data);
        // The actual processing is done in the /report endpoint
    });
    
    socket.on("issue_upvoted", (data) => {
        console.log("Issue upvoted event received:", data);
        // The actual processing is done in the /api/issues/:id/upvote endpoint
    });
    
    socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));