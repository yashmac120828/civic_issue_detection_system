const express = require("express");
const multer = require("multer");
const { runAIModel } = require("../controllers/aiController");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/detect", upload.single("image"), async (req, res) => {
    try {
        const result = await runAIModel(req.file.path);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: "AI detection failed" });
    }
});

module.exports = router;
