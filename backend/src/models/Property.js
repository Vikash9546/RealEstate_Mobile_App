const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true },
        price: { type: Number, required: true },
        type: {
            type: String,
            enum: ['apartment', 'house', 'villa', 'studio', 'commercial', 'land'],
            required: true,
        },
        status: { type: String, enum: ['for_sale', 'for_rent'], default: 'for_sale' },
        bedrooms: { type: Number, default: 0 },
        bathrooms: { type: Number, default: 0 },
        area: { type: Number, required: true }, // in sq ft
        amenities: [{ type: String }],
        images: [{ type: String }],
        location: {
            address: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String },
            country: { type: String, default: 'India' },
            lat: { type: Number },
            lng: { type: Number },
        },
        agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        isFeatured: { type: Boolean, default: false },
        views: { type: Number, default: 0 },
    },
    { timestamps: true }
);

// Text index for search
propertySchema.index({
    title: 'text',
    description: 'text',
    'location.address': 'text',
    'location.city': 'text',
});

module.exports = mongoose.model('Property', propertySchema);
