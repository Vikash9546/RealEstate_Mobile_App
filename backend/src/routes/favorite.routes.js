const express = require('express');
const router = express.Router();
const { getFavorites, addFavorite, removeFavorite, checkFavorite } = require('../controllers/favorite.controller');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getFavorites);
router.get('/check/:propertyId', checkFavorite);
router.post('/:propertyId', addFavorite);
router.delete('/:propertyId', removeFavorite);

module.exports = router;
