const Property = require('../models/Property');

// GET /api/properties  (with search & filters)
const getProperties = async (req, res) => {
    try {
        const { search, type, status, minPrice, maxPrice, bedrooms, city, page = 1, limit = 10 } = req.query;
        const query = {};

        if (search) query.$text = { $search: search };
        if (type) query.type = type;
        if (status) query.status = status;
        if (bedrooms) query.bedrooms = { $gte: Number(bedrooms) };
        if (city) query['location.city'] = { $regex: city, $options: 'i' };
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        const skip = (Number(page) - 1) * Number(limit);
        const total = await Property.countDocuments(query);
        const properties = await Property.find(query)
            .populate('agent', 'name email avatar phone isOnline')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        res.json({ properties, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/properties/:id
const getProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id).populate('agent', 'name email avatar phone isOnline');
        if (!property) return res.status(404).json({ message: 'Property not found' });
        property.views += 1;
        await property.save();
        res.json(property);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/properties  (agent only)
const createProperty = async (req, res) => {
    try {
        const { title, description, price, type, status, bedrooms, bathrooms, area, amenities, location } = req.body;
        const images = req.files ? req.files.map((f) => `/uploads/${f.filename}`) : [];
        const amenitiesArr = typeof amenities === 'string' ? amenities.split(',').map((a) => a.trim()) : amenities || [];

        const property = await Property.create({
            title, description, price, type, status, bedrooms, bathrooms, area,
            amenities: amenitiesArr, images,
            location: typeof location === 'string' ? JSON.parse(location) : location,
            agent: req.user._id,
        });
        res.status(201).json(property);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/properties/:id
const updateProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) return res.status(404).json({ message: 'Property not found' });
        if (property.agent.toString() !== req.user._id.toString())
            return res.status(403).json({ message: 'Not authorized' });

        const updates = { ...req.body };
        if (req.files && req.files.length > 0) {
            updates.images = req.files.map((f) => `/uploads/${f.filename}`);
        }
        if (updates.location && typeof updates.location === 'string') {
            updates.location = JSON.parse(updates.location);
        }
        const updated = await Property.findByIdAndUpdate(req.params.id, updates, { new: true });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE /api/properties/:id
const deleteProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) return res.status(404).json({ message: 'Property not found' });
        if (property.agent.toString() !== req.user._id.toString())
            return res.status(403).json({ message: 'Not authorized' });
        await property.deleteOne();
        res.json({ message: 'Property deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/properties/agent/my  (agent's own listings)
const getMyProperties = async (req, res) => {
    try {
        const properties = await Property.find({ agent: req.user._id }).sort({ createdAt: -1 });
        res.json(properties);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getProperties, getProperty, createProperty, updateProperty, deleteProperty, getMyProperties };
