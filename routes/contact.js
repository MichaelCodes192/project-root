// routes/contact.js
const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

router.get('/', contactController.getContactForm);
router.post('/', contactController.submitContactForm);

module.exports = router;
