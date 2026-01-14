import express from 'express';
import { VehicleController } from '../controllers/vehicleController.js';

const router = express.Router();
const controller = new VehicleController();

router.get('/', controller.getAllVehicles);
router.post('/', controller.addVehicle);
router.get('/check/:plate_number', controller.checkVehicle);
router.delete('/:id', controller.deleteVehicle);

export default router;