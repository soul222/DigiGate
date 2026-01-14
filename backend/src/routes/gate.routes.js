import express from 'express';
import { GateController } from '../controllers/gateController.js';

const router = express.Router();
const controller = new GateController();

router.post('/open', controller.openGate);
router.post('/close', controller.closeGate);
router.get('/status', controller.getGateStatus);

export default router;