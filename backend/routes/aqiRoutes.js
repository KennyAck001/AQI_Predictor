import express from 'express';
import * as aqiController from '../controllers/aqiController.js';

const router = express.Router();

router.get('/current', aqiController.getCurrentAQI);
router.get('/forecast', aqiController.getForecast);
router.get('/historical', aqiController.getHistorical);
router.get('/sync', aqiController.syncAQI);
router.post('/store', aqiController.storeAQIRecords);

export default router;
