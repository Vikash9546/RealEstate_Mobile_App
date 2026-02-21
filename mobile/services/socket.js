import { io } from 'socket.io-client';
import { SOCKET_URL } from '../constants';

let socket = null;

export const connectSocket = (token) => {
    if (socket?.connected) return socket;

    socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });

    socket.on('connect', () => console.log('🔌 Socket connected:', socket.id));
    socket.on('disconnect', (reason) => console.log('❌ Socket disconnected:', reason));
    socket.on('connect_error', (err) => console.log('⚠️ Socket error:', err.message));

    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export const getSocket = () => socket;

export const joinRoom = (roomId) => socket?.emit('join_room', roomId);
export const leaveRoom = (roomId) => socket?.emit('leave_room', roomId);

export const sendSocketMessage = ({ roomId, content, type = 'text' }) => {
    socket?.emit('send_message', { roomId, content, type });
};

export const emitTyping = (roomId) => socket?.emit('typing', { roomId });
export const emitStopTyping = (roomId) => socket?.emit('stop_typing', { roomId });
export const emitMarkRead = (roomId) => socket?.emit('mark_read', { roomId });
