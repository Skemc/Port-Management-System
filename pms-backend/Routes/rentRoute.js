import express from 'express';
import { 
    createRent, 
    getRents, 
    getRentSummary,
    createInvoiceForRent,
    getInvoices
} from '../Controllers/rentController.js';

const router = express.Router();

router.post('/', createRent);
router.get('/', getRents);
router.get('/summary', getRentSummary);
// Invoice routes for rents
router.post('/invoice', createInvoiceForRent);
router.get('/invoice', getInvoices);

export default router;
