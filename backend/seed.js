require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./src/models/User');
const Property = require('./src/models/Property');

const citiesInfo = [
    { city: 'Mumbai', state: 'Maharashtra', latBase: 19.0760, lngBase: 72.8777, locations: ['Bandra', 'Andheri', 'Juhu', 'Worli', 'Powai', 'Malad', 'Goregaon'] },
    { city: 'Bengaluru', state: 'Karnataka', latBase: 12.9716, lngBase: 77.5946, locations: ['Whitefield', 'Koramangala', 'Indiranagar', 'HSR Layout', 'Electronic City', 'Malleswaram'] },
    { city: 'New Delhi', state: 'Delhi', latBase: 28.6139, lngBase: 77.2090, locations: ['South Extension', 'Hauz Khas', 'Vasant Vihar', 'Dwarka', 'Karol Bagh', 'Rohini', 'Connaught Place'] },
    { city: 'Pune', state: 'Maharashtra', latBase: 18.5204, lngBase: 73.8567, locations: ['Koregaon Park', 'Hinjewadi', 'Viman Nagar', 'Kalyani Nagar', 'Baner', 'Wakad'] },
    { city: 'Hyderabad', state: 'Telangana', latBase: 17.3850, lngBase: 78.4867, locations: ['Hitech City', 'Banjara Hills', 'Jubilee Hills', 'Gachibowli', 'Madhapur', 'Kondapur'] },
    { city: 'Chennai', state: 'Tamil Nadu', latBase: 13.0827, lngBase: 80.2707, locations: ['Adyar', 'Anna Nagar', 'Velachery', 'OMR', 'T Nagar', 'Besant Nagar'] },
    { city: 'Gurugram', state: 'Haryana', latBase: 28.4595, lngBase: 77.0266, locations: ['Cyber City', 'DLF Phase 1', 'Golf Course Road', 'Sector 56', 'Sohna Road'] },
    { city: 'Noida', state: 'Uttar Pradesh', latBase: 28.5355, lngBase: 77.3910, locations: ['Sector 15', 'Sector 62', 'Sector 137', 'Greater Noida West', 'Sector 50'] }
];

const types = ['apartment', 'house', 'villa', 'studio', 'commercial', 'land'];
const statuses = ['for_sale', 'for_rent'];
const adjectives = ['Luxury', 'Modern', 'Spacious', 'Cozy', 'Elegant', 'Premium', 'Affordable', 'Newly Built', 'Furnished', 'Semi-Furnished'];
const allAmenities = ['Swimming Pool', 'Gym', 'Parking', 'Security', 'Balcony', 'Lift', 'Club House', 'Power Backup', 'Private Garden', 'WiFi', 'AC', 'Children Play Area', 'Conference Room', 'Reception', '24/7 Access'];

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomAmenities(count) {
    const shuffled = [...allAmenities].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function generateProperties(count, agentId) {
    const properties = [];
    for (let i = 0; i < count; i++) {
        const cityInfo = getRandomItem(citiesInfo);
        const locationStr = getRandomItem(cityInfo.locations);
        const type = getRandomItem(types);
        const status = getRandomItem(statuses);
        const bedrooms = type === 'commercial' || type === 'land' ? 0 : (type === 'studio' ? 1 : getRandomNumber(1, 5));
        const bathrooms = type === 'land' ? 0 : (bedrooms === 0 ? getRandomNumber(1, 4) : Math.max(1, bedrooms - getRandomNumber(0, 1)));
        const area = type === 'studio' ? getRandomNumber(300, 600) : type === 'apartment' ? getRandomNumber(600, 2500) : type === 'commercial' ? getRandomNumber(1000, 10000) : getRandomNumber(1500, 5000);

        let priceBase = area * (status === 'for_sale' ? getRandomNumber(5000, 25000) : getRandomNumber(20, 100));
        // Add premium for villas/houses
        if (type === 'villa' || type === 'house') priceBase *= 1.5;
        // Make numbers rounder
        const price = Math.round(priceBase / 1000) * 1000;

        const adjective = getRandomItem(adjectives);

        let title = '';
        if (bedrooms > 0) {
            title = `${bedrooms}BHK ${adjective} ${type.charAt(0).toUpperCase() + type.slice(1)} in ${locationStr}`;
        } else {
            title = `${adjective} ${type.charAt(0).toUpperCase() + type.slice(1)} space in ${locationStr}`;
        }

        // Slight jitter to lat/lng so they don't fall exactly on the city center
        const lat = cityInfo.latBase + (Math.random() * 0.1 - 0.05);
        const lng = cityInfo.lngBase + (Math.random() * 0.1 - 0.05);

        properties.push({
            title,
            description: `A beautiful and ${adjective.toLowerCase()} ${type} located in the prime area of ${locationStr}, ${cityInfo.city}. It features ${area} sqft of space${bedrooms > 0 ? `, ${bedrooms} bedrooms,` : ''} and comes with top-notch amenities. Perfect choice for someone looking for a property ${status.replace('_', ' ')}.`,
            price,
            type,
            status,
            bedrooms,
            bathrooms,
            area,
            amenities: getRandomAmenities(getRandomNumber(3, 8)),
            images: [],
            location: {
                address: `${getRandomNumber(1, 100)}, ${locationStr} Main Road`,
                city: cityInfo.city,
                state: cityInfo.state,
                country: 'India',
                lat,
                lng
            },
            agent: agentId,
            isFeatured: Math.random() > 0.8, // 20% chance to be featured
            views: getRandomNumber(10, 500),
            createdAt: new Date(Date.now() - getRandomNumber(0, 30) * 24 * 60 * 60 * 1000) // Random date in last 30 days
        });
    }
    return properties;
}


const seed = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clean DB
    await User.deleteMany({});
    await Property.deleteMany({});

    console.log('Cleared existing data.');

    // Create an agent
    const agent = await User.create({
        name: 'Raj Malhotra',
        email: 'agent@demo.com',
        password: 'password123',
        role: 'agent',
        phone: '+91 98765 43210',
        isOnline: false,
    });

    // Create a buyer
    const buyer = await User.create({
        name: 'Priya Singh',
        email: 'buyer@demo.com',
        password: 'password123',
        role: 'buyer',
        phone: '+91 91234 56789',
    });

    console.log('Generated Agent and Buyer accounts.');

    // Generate 50 properties
    const properties = generateProperties(50, agent._id);

    // Insert to DB
    await Property.insertMany(properties);
    console.log(`✅ Seed complete! Successfully inserted 50 properties.`);
    console.log('\n🔑 Demo credentials:');
    console.log('   Agent → Email: agent@demo.com | Password: password123');
    console.log('   Buyer → Email: buyer@demo.com | Password: password123');

    // Quick stats
    const forSale = properties.filter(p => p.status === 'for_sale').length;
    const forRent = properties.filter(p => p.status === 'for_rent').length;
    console.log(`\n📊 Data Stats:`);
    console.log(`   For Sale: ${forSale}`);
    console.log(`   For Rent: ${forRent}`);
    console.log(`   Cities covered: ${citiesInfo.length}`);

    process.exit(0);
};

seed().catch((err) => { console.error(err); process.exit(1); });
