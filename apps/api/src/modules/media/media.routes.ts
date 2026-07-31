import { Router } from "express";
import multer from "multer";
import { storageService } from "../../services/storage.service.js";
import { authenticate } from "../../middleware/authenticate.js";

const router = Router();
const upload = multer({ dest: "uploads/temp/" });

router.post("/upload", authenticate, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier fourni" });
    }

    const folder = req.body.folder || "vendeur-ia";
    const result = await storageService.uploadFile(req.file, folder);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
