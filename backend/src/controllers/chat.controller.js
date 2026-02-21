const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const User = require('../models/User');

// POST /api/chats/rooms  — create or get existing room for a property+participants
const createOrGetRoom = async (req, res) => {
    try {
        const { agentId, propertyId } = req.body;
        const userId = req.user._id;

        // Find existing room with same participants and property
        let room = await ChatRoom.findOne({
            participants: { $all: [userId, agentId] },
            property: propertyId,
        }).populate('participants', 'name avatar isOnline lastSeen').populate('property', 'title images');

        if (!room) {
            room = await ChatRoom.create({
                participants: [userId, agentId],
                property: propertyId,
            });
            room = await ChatRoom.findById(room._id)
                .populate('participants', 'name avatar isOnline lastSeen')
                .populate('property', 'title images');
        }
        res.json(room);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/chats/rooms  — all rooms for current user
const getRooms = async (req, res) => {
    try {
        const rooms = await ChatRoom.find({ participants: req.user._id })
            .populate('participants', 'name avatar isOnline lastSeen')
            .populate('property', 'title images')
            .populate('lastMessage')
            .sort({ updatedAt: -1 });
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/chats/rooms/:roomId/messages  — paginated message history
const getMessages = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { page = 1, limit = 30 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const room = await ChatRoom.findById(roomId);
        if (!room) return res.status(404).json({ message: 'Chat room not found' });
        if (!room.participants.map(String).includes(String(req.user._id))) {
            return res.status(403).json({ message: 'Not a participant' });
        }

        const messages = await Message.find({ chatRoom: roomId })
            .populate('sender', 'name avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        // Mark as read
        await Message.updateMany({ chatRoom: roomId, sender: { $ne: req.user._id }, read: false }, { read: true });

        res.json(messages.reverse());
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/chats/rooms/:roomId/messages  — send REST message (fallback)
const sendMessage = async (req, res) => {
    try {
        const { content, type = 'text' } = req.body;
        const message = await Message.create({
            chatRoom: req.params.roomId,
            sender: req.user._id,
            content,
            type,
        });
        await ChatRoom.findByIdAndUpdate(req.params.roomId, { lastMessage: message._id, updatedAt: new Date() });
        const populated = await Message.findById(message._id).populate('sender', 'name avatar');
        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createOrGetRoom, getRooms, getMessages, sendMessage };
