const express = require('express');
const router = express.Router();
const {
    getProperties, getProperty, createProperty, updateProperty, deleteProperty, getMyProperties,
} = require('../controllers/property.controller');
const { protect, agentOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getProperties);
router.get('/agent/my', protect, agentOnly, getMyProperties);
router.get('/:id', getProperty);
router.post('/', protect, agentOnly, upload.array('images', 10), createProperty);
router.put('/:id', protect, agentOnly, upload.array('images', 10), updateProperty);
router.delete('/:id', protect, agentOnly, deleteProperty);

module.exports = router;
