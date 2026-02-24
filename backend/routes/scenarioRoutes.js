import express from 'express';
import * as scenarioController from '../controllers/scenarioController.js';

const router = express.Router();

router.post('/what-if', scenarioController.runWhatIf);

export default router;
