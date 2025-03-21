import sys
import json

def detect_objects(image_path):
    # Dummy response for now (Replace with real AI logic)
    detection_results = {
        "objects": [
            {"label": "pothole", "confidence": 0.85, "x": 100, "y": 100, "width": 150, "height": 150}
        ]
    }
    return json.dumps(detection_results)

if __name__ == "__main__":
    image_path = sys.argv[1]
    result = detect_objects(image_path)
    print(result)
