const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema(
    {
        participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
        property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
        lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
