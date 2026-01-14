import express from 'express';
import multer from 'multer';
import { AccessController } from '../controllers/accessController.js';

const router = express.Router();
const controller = new AccessController();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/process', upload.single('image'), controller.processAccess);
router.get('/logs', controller.getAccessLogs);
router.get('/statistics', controller.getStatistics);

export default router;