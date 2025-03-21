const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const captureButton = document.getElementById('capture');
const toggleCameraButton = document.getElementById('toggle-camera');
const switchCameraButton = document.getElementById('switch-camera');
const downloadButton = document.getElementById('download');

let stream = null;
let isCameraOn = true;
let currentFacingMode = "environment"; // 'user' for front, 'environment' for back

// Start Camera
async function startCamera(facingMode = "environment") {
    if (stream) {
        stopCamera();
    }
    
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
        video.srcObject = stream;
    } catch (error) {
        console.error("Error accessing the camera:", error);
    }
}

// Stop Camera
function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
}

// Toggle Camera On/Off
toggleCameraButton.addEventListener("click", () => {
    if (isCameraOn) {
        stopCamera();
        toggleCameraButton.textContent = "Turn On Camera";
    } else {
        startCamera(currentFacingMode);
        toggleCameraButton.textContent = "Turn Off Camera";
    }
    isCameraOn = !isCameraOn;
});

// Switch Camera (Front/Back)
switchCameraButton.addEventListener("click", () => {
    currentFacingMode = currentFacingMode === "user" ? "environment" : "user";
    startCamera(currentFacingMode);
});

// Capture image and send to AI detection API
// Capture image and send to AI detection API
captureButton.addEventListener("click", () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas image to Blob for FormData approach
    canvas.toBlob(async (blob) => {
        const formData = new FormData();
        formData.append("image", blob, "frame.png");

        try {
            const response = await fetch("http://localhost:5000/api/ai/detect", {
                method: "POST",
                // Don't set Content-Type header - browser will set it automatically with boundary
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }
            
            const data = await response.json();
            console.log("AI Detection Result:", data);

            // Draw AI detected object if available
            if (data.objects && data.objects.length > 0) {
                ctx.strokeStyle = "red";
                ctx.lineWidth = 3;
                const obj = data.objects[0];
                ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
            }
        } catch (error) {
            console.error("AI detection failed:", error);
        }
    }, "image/png");
});

// Start Camera on Page Load
startCamera();