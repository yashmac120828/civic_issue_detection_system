## Civic Issue Detection System

This project is a Civic Issue Detection System that uses AI and real-time data to identify and report civic issues like potholes and garbage. It consists of an AI Model, a Node.js Backend, and a Frontend (HTML, CSS, JavaScript).

## 📌 Features

AI-powered civic issue detection using YOLO

WebSockets for real-time issue updates

Interactive map for visualizing reported issues

User authentication and issue reporting

Live camera feed integration with AI overlays

Community voting for issue prioritization

## 🛠️ Tech Stack

Frontend: HTML, CSS, JavaScript (Bootstrap)

Backend: Node.js, Express.js

Database: MongoDB (Mongoose)

AI Model: Python, OpenCV, YOLO

Real-time Updates: WebSockets (Socket.IO)

## 📂 Project Structure

```civic-issue-detection-system/
│── ai-model/             # AI model and scripts
│   ├── scripts/          # Python scripts (train, detect, preprocess, etc.)
│   ├── requirements.txt  # AI dependencies
│── backend/              # Backend (Node.js + Express)
│   ├── config/           # Database and environment setup
│   ├── controllers/      # Business logic
│   ├── routes/           # API endpoints
│   ├── server.js         # Main server file
│   ├── socket.js         # WebSocket integration
│── frontend/             # Frontend (HTML, CSS, JS)
│   ├── index.html        # Main dashboard
│   ├── register.html     # User registration page
│   ├── dashboard.html    # Dashboard for viewing reports
│   ├── camera.html       # Live camera feed for AI detection
│   ├── map.html          # Interactive issue map
│   ├── report_issue.html # Issue reporting page
│   ├── websocket_test.html # WebSocket testing page
│   ├── assets/           # Images, CSS, JavaScript
│── .gitignore            # Ignored files
│── README.md             # Project documentation
```

## 🚀 Installation & Setup
```
1. Clone the Repository

git clone https://github.com/yashamc120828/civic_issue_detection_system.git
cd civic-issue-detection-system

```
```
2. Set Up the AI Model

cd ai-model
pip install -r requirements.txt
```
```

3. Set Up the Backend

cd backend
npm install
```
```
4. Set Up Environment Variables

Create a .env file inside backend/ and add:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```
```
5. Run the Backend Server

npm start
```
```
6. Open the Frontend

Simply open frontend/index.html in a browser or start a local server:

cd frontend
npx http-server .

```

## 📡 API Endpoints

| Method | Endpoint             | Description         |
|--------|----------------------|---------------------|
| GET    | `/api/issues`        | Get all issues     |
| POST   | `/api/issues`        | Report a new issue |
| GET    | `/api/users`         | Get all users      |
| POST   | `/api/auth/login`    | User login         |
| POST   | `/api/auth/register` | User registration  |

## 🎯 Future Improvements

Mobile app integration

More AI models for different civic issues

Enhanced admin panel

## 📜 License

This project is licensed under the MIT License.



