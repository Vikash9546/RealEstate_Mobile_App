const Favorite = require('../models/Favorite');
const Property = require('../models/Property');

// GET /api/favorites
const getFavorites = async (req, res) => {
    try {
        const favorites = await Favorite.find({ user: req.user._id })
            .populate({ path: 'property', populate: { path: 'agent', select: 'name avatar' } })
            .sort({ createdAt: -1 });
        res.json(favorites);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/favorites/:propertyId
const addFavorite = async (req, res) => {
    try {
        const property = await Property.findById(req.params.propertyId);
        if (!property) return res.status(404).json({ message: 'Property not found' });

        const existing = await Favorite.findOne({ user: req.user._id, property: req.params.propertyId });
        if (existing) return res.status(400).json({ message: 'Already in favorites' });

        const favorite = await Favorite.create({ user: req.user._id, property: req.params.propertyId });
        res.status(201).json(favorite);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE /api/favorites/:propertyId
const removeFavorite = async (req, res) => {
    try {
        const result = await Favorite.findOneAndDelete({ user: req.user._id, property: req.params.propertyId });
        if (!result) return res.status(404).json({ message: 'Favorite not found' });
        res.json({ message: 'Removed from favorites' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/favorites/check/:propertyId — check if property is in favorites
const checkFavorite = async (req, res) => {
    try {
        const exists = await Favorite.findOne({ user: req.user._id, property: req.params.propertyId });
        res.json({ isFavorite: !!exists });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getFavorites, addFavorite, removeFavorite, checkFavorite };
