const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom');

const socketHandler = (io) => {
    // Auth middleware for socket connections
    io.use(async (socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('Authentication error'));
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = await User.findById(decoded.id).select('-password');
            if (!socket.user) return next(new Error('User not found'));
            next();
        } catch {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', async (socket) => {
        const userId = socket.user._id;
        console.log(`🔌 Connected: ${socket.user.name} (${socket.id})`);

        // Mark user as online
        await User.findByIdAndUpdate(userId, { isOnline: true });
        io.emit('user_status', { userId, isOnline: true });

        // Join personal room (for notifications)
        socket.join(userId.toString());

        // Join a chat room
        socket.on('join_room', (roomId) => {
            socket.join(roomId);
            console.log(`📥 ${socket.user.name} joined room ${roomId}`);
        });

        // Leave a chat room
        socket.on('leave_room', (roomId) => {
            socket.leave(roomId);
        });

        // Send a message
        socket.on('send_message', async ({ roomId, content, type = 'text' }) => {
            try {
                const room = await ChatRoom.findById(roomId);
                if (!room || !room.participants.map(String).includes(String(userId))) {
                    socket.emit('error', { message: 'Not a participant of this room' });
                    return;
                }

                const message = await Message.create({ chatRoom: roomId, sender: userId, content, type });
                await ChatRoom.findByIdAndUpdate(roomId, { lastMessage: message._id, updatedAt: new Date() });

                const populated = await Message.findById(message._id).populate('sender', 'name avatar');
                io.to(roomId).emit('new_message', populated);
            } catch (err) {
                socket.emit('error', { message: err.message });
            }
        });

        // Typing indicators
        socket.on('typing', ({ roomId }) => {
            socket.to(roomId).emit('user_typing', { userId, name: socket.user.name });
        });

        socket.on('stop_typing', ({ roomId }) => {
            socket.to(roomId).emit('user_stop_typing', { userId });
        });

        // Mark messages as read
        socket.on('mark_read', async ({ roomId }) => {
            await Message.updateMany({ chatRoom: roomId, sender: { $ne: userId }, read: false }, { read: true });
            socket.to(roomId).emit('messages_read', { roomId, readBy: userId });
        });

        // Disconnect
        socket.on('disconnect', async () => {
            console.log(`🔌 Disconnected: ${socket.user.name}`);
            await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
            io.emit('user_status', { userId, isOnline: false, lastSeen: new Date() });
        });
    });
};

module.exports = socketHandler;
