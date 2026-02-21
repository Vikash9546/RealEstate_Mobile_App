const express = require('express');
const router = express.Router();
const { createOrGetRoom, getRooms, getMessages, sendMessage } = require('../controllers/chat.controller');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/rooms', getRooms);
router.post('/rooms', createOrGetRoom);
router.get('/rooms/:roomId/messages', getMessages);
router.post('/rooms/:roomId/messages', sendMessage);

module.exports = router;
