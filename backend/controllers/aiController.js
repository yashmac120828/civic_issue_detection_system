const { spawn } = require("child_process");
const path = require("path");

async function runAIModel(imagePath) {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn("python", [path.join(__dirname, "../../ai-model/scripts/detect.py"), imagePath]);

        let result = "";
        pythonProcess.stdout.on("data", (data) => {
            result += data.toString();
        });

        pythonProcess.stderr.on("data", (data) => {
            console.error(`Error: ${data}`);
            reject(data.toString());
        });

        pythonProcess.on("close", () => {
            resolve(JSON.parse(result));
        });
    });
}

module.exports = { runAIModel };
