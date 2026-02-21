import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image,
} from 'react-native';
import { chatAPI } from '../../services/api';
import { getSocket, joinRoom, leaveRoom, sendSocketMessage, emitTyping, emitStopTyping, emitMarkRead } from '../../services/socket';
import { useAuthStore } from '../../store/authStore';
import { COLORS, API_BASE_URL } from '../../constants';

export default function ChatRoomScreen({ route, navigation }) {
    const { roomId, name } = route.params;
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(true);
    const [typingUser, setTypingUser] = useState(null);
    const [otherOnline, setOtherOnline] = useState(false);
    const flatRef = useRef(null);
    const typingTimer = useRef(null);
    const user = useAuthStore((s) => s.user);

    useEffect(() => {
        navigation.setOptions({ title: name });
        loadHistory();
        const socket = getSocket();
        if (socket) {
            joinRoom(roomId);
            emitMarkRead(roomId);

            socket.on('new_message', handleNewMessage);
            socket.on('user_typing', ({ name: n }) => setTypingUser(n));
            socket.on('user_stop_typing', () => setTypingUser(null));
            socket.on('user_status', ({ isOnline }) => setOtherOnline(isOnline));

            return () => {
                leaveRoom(roomId);
                socket.off('new_message', handleNewMessage);
                socket.off('user_typing');
                socket.off('user_stop_typing');
                socket.off('user_status');
            };
        }
    }, [roomId]);

    const loadHistory = async () => {
        try {
            const { data } = await chatAPI.getMessages(roomId);
            setMessages(data);
            emitMarkRead(roomId);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleNewMessage = useCallback((msg) => {
        if (msg.chatRoom === roomId || msg.chatRoom?._id === roomId) {
            setMessages((prev) => [...prev, msg]);
            emitMarkRead(roomId);
            setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
        }
    }, [roomId]);

    const sendMsg = async () => {
        const content = text.trim();
        if (!content) return;
        setText('');
        clearTimeout(typingTimer.current);
        emitStopTyping(roomId);
        sendSocketMessage({ roomId, content });
    };

    const handleTyping = (val) => {
        setText(val);
        emitTyping(roomId);
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => emitStopTyping(roomId), 1500);
    };

    const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isMe = (msg) => (msg.sender?._id || msg.sender) === user?._id;

    const renderMsg = ({ item, index }) => {
        const mine = isMe(item);
        const showDate = index === 0 || new Date(item.createdAt).toDateString() !== new Date(messages[index - 1]?.createdAt).toDateString();
        return (
            <>
                {showDate && (
                    <View style={styles.dateRow}>
                        <Text style={styles.dateLabel}>{new Date(item.createdAt).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
                    </View>
                )}
                <View style={[styles.bubbleWrap, mine && styles.bubbleWrapMe]}>
                    {!mine && (
                        <View style={styles.msgAvatar}><Text>👤</Text></View>
                    )}
                    <View style={[styles.bubble, mine ? styles.bubbleMe : styles.bubbleThem]}>
                        {!mine && <Text style={styles.senderName}>{item.sender?.name}</Text>}
                        <Text style={mine ? styles.bubbleTextMe : styles.bubbleTextThem}>{item.content}</Text>
                        <Text style={styles.timestamp}>{formatTime(item.createdAt)} {mine && (item.read ? '✓✓' : '✓')}</Text>
                    </View>
                </View>
            </>
        );
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90}>
            {/* Header status bar */}
            <View style={styles.statusBar}>
                <Text style={styles.statusText}>{name}</Text>
                <View style={styles.onlineWrap}>
                    <View style={[styles.dot, { backgroundColor: otherOnline ? COLORS.online : COLORS.offline }]} />
                    <Text style={styles.onlineText}>{otherOnline ? 'Online' : 'Offline'}</Text>
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} />
            ) : (
                <FlatList
                    ref={flatRef}
                    data={messages}
                    keyExtractor={(item, i) => item._id || String(i)}
                    renderItem={renderMsg}
                    contentContainerStyle={{ padding: 16 }}
                    onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 60 }}>
                            <Text style={{ fontSize: 40 }}>👋</Text>
                            <Text style={{ color: COLORS.textMuted, marginTop: 12 }}>Start a conversation!</Text>
                        </View>
                    }
                />
            )}

            {typingUser && (
                <View style={styles.typingBar}>
                    <Text style={styles.typingText}>{typingUser} is typing...</Text>
                </View>
            )}

            {/* Input bar */}
            <View style={styles.inputBar}>
                <TextInput
                    style={styles.input}
                    placeholder="Type a message..."
                    placeholderTextColor={COLORS.textMuted}
                    value={text}
                    onChangeText={handleTyping}
                    multiline
                    maxLength={1000}
                />
                <TouchableOpacity style={[styles.sendBtn, !text.trim() && { opacity: 0.4 }]} onPress={sendMsg} disabled={!text.trim()}>
                    <Text style={styles.sendIcon}>➤</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    statusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    statusText: { fontSize: 16, fontWeight: '700', color: COLORS.text },
    onlineWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    onlineText: { fontSize: 13, color: COLORS.textMuted },
    dateRow: { alignItems: 'center', marginVertical: 12 },
    dateLabel: { color: COLORS.textMuted, fontSize: 12, backgroundColor: COLORS.surfaceLight, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    bubbleWrap: { flexDirection: 'row', marginVertical: 4, alignItems: 'flex-end', gap: 8 },
    bubbleWrapMe: { flexDirection: 'row-reverse' },
    msgAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
    bubble: { maxWidth: '75%', borderRadius: 18, padding: 12, paddingBottom: 8 },
    bubbleMe: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
    bubbleThem: { backgroundColor: COLORS.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.border },
    senderName: { fontSize: 11, color: COLORS.textMuted, marginBottom: 4, fontWeight: '600' },
    bubbleTextMe: { color: '#fff', fontSize: 15, lineHeight: 22 },
    bubbleTextThem: { color: COLORS.text, fontSize: 15, lineHeight: 22 },
    timestamp: { fontSize: 10, color: 'rgba(255,255,255,0.5)', textAlign: 'right', marginTop: 4 },
    typingBar: { paddingHorizontal: 20, paddingVertical: 6, backgroundColor: COLORS.background },
    typingText: { color: COLORS.textMuted, fontSize: 13, fontStyle: 'italic' },
    inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, gap: 10, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.surface },
    input: { flex: 1, backgroundColor: COLORS.surfaceLight, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 12, color: COLORS.text, fontSize: 15, maxHeight: 120, borderWidth: 1, borderColor: COLORS.border },
    sendBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
    sendIcon: { color: '#fff', fontSize: 20 },
});
