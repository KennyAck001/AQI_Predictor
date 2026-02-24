import express from 'express';
import * as predictionController from '../controllers/predictionController.js';

const router = express.Router();

router.get('/', predictionController.getPrediction);

export default router;
