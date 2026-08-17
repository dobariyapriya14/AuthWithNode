const express = require('express');
const router = express.Router();
const DocumentController = require('../controllers/documentController');

// PDF Document Routes
router.post('/generate-pdf', DocumentController.generatePdf);
router.post('/export-task-report', DocumentController.exportTaskReport);

// Image Optimization Routes
router.post('/optimize-image', DocumentController.optimizeImage);

// Download Route
router.get('/download/:filename', DocumentController.downloadFile);

module.exports = router;
