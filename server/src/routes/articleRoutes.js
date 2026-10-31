import { Router } from 'express';
import {
  getSampleArticles,
  importArticle,
} from '../controllers/articleController.js';
import { exportMagazinePdf } from '../controllers/pdfController.js';

const router = Router();

router.post('/import', importArticle);
router.get('/sample', getSampleArticles);
router.post('/export-pdf', exportMagazinePdf);

export default router;
