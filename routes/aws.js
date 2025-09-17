/* Libraries */
const router = require('express').Router();
/* Middleware */
const isAuth = require('../middleware/isAuth');
/* Helpers */
const {
    upload,
    deleteFile
} = require("../helpers/helper");

router.post("/upload/:folder?", isAuth, (req, res, next) => {
    let folder = req.params.folder;
    if (!folder || folder === ":folder") {
        folder = "";
    }
    const uploadMiddleware = upload(folder).single("file"); // Panggil fungsi upload dengan folder
    uploadMiddleware(req, res, (err) => {
        if (err) {
            return res.status(500).json({
                message: "Upload failed",
                error: err.message
            });
        }

        if (!req.file) {
            return res.status(400).json({
                message: "No file uploaded"
            });
        }

        res.json({
            key: req.file.key,
            mimetype: req.file.mimetype,
            url: req.file.location
        });
    });
});

router.delete("/", isAuth, async (req, res) => {
    const {
        fileUrl
    } = req.body;

    if (!fileUrl) {
        return res.status(400).json({
            message: "File URL is required"
        });
    }

    const result = await deleteFile(fileUrl);
    res.status(result.success ? 200 : 500).json(result);
});

module.exports = router;