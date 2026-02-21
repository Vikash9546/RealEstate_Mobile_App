import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { chatAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { COLORS, API_BASE_URL } from '../../constants';
import { getSocket } from '../../services/socket';

export default function ChatsScreen({ navigation }) {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const user = useAuthStore((s) => s.user);

    useEffect(() => {
        if (user) {
            loadRooms();
            // Listen for real-time new messages to update last message in list
            const socket = getSocket();
            if (socket) {
                socket.on('new_message', handleNewMessage);
                return () => socket.off('new_message', handleNewMessage);
            }
        } else {
            setLoading(false);
        }
    }, [user]);

    const handleNewMessage = (msg) => {
        setRooms((prev) => prev.map((r) =>
            r._id === msg.chatRoom ? { ...r, lastMessage: msg } : r
        ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
    };

    const loadRooms = async () => {
        try {
            const { data } = await chatAPI.getRooms();
            setRooms(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); setRefreshing(false); }
    };

    const getOtherParticipant = (participants) =>
        participants.find((p) => p._id !== user?._id);

    if (!user) return (
        <View style={styles.center}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>💬</Text>
            <Text style={styles.empty}>Sign in to view your conversations</Text>
        </View>
    );

    if (loading) return <ActivityIndicator size="large" color={COLORS.primary} style={styles.center} />;

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Messages</Text>
            <FlatList
                data={rooms}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadRooms(); }} tintColor={COLORS.primary} />}
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Text style={{ fontSize: 48, marginBottom: 12 }}>💬</Text>
                        <Text style={styles.empty}>No conversations yet{'\n'}Chat with an agent on a property!</Text>
                    </View>
                }
                renderItem={({ item }) => {
                    const other = getOtherParticipant(item.participants);
                    return (
                        <TouchableOpacity
                            style={styles.roomCard}
                            onPress={() => navigation.navigate('ChatRoom', { roomId: item._id, name: other?.name || 'Chat' })}>
                            <View style={styles.avatarWrap}>
                                <View style={styles.avatar}><Text style={{ fontSize: 24 }}>👤</Text></View>
                                {other?.isOnline && <View style={styles.onlineDot} />}
                            </View>
                            <View style={styles.roomInfo}>
                                <View style={styles.roomTop}>
                                    <Text style={styles.roomName}>{other?.name || 'Unknown'}</Text>
                                    <Text style={styles.roomTime}>
                                        {item.lastMessage?.createdAt
                                            ? new Date(item.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                            : ''}
                                    </Text>
                                </View>
                                <Text style={styles.roomProp} numberOfLines={1}>
                                    🏠 {item.property?.title || 'Property'}
                                </Text>
                                <Text style={styles.lastMsg} numberOfLines={1}>
                                    {item.lastMessage?.content || 'No messages yet'}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                }}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, padding: 32 },
    header: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, padding: 20, paddingTop: 56 },
    empty: { color: COLORS.textMuted, textAlign: 'center', fontSize: 15, lineHeight: 24 },
    roomCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14 },
    avatarWrap: { position: 'relative' },
    avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
    onlineDot: { position: 'absolute', bottom: 1, right: 1, width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.online, borderWidth: 2, borderColor: COLORS.background },
    roomInfo: { flex: 1 },
    roomTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
    roomName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
    roomTime: { fontSize: 11, color: COLORS.textMuted },
    roomProp: { fontSize: 12, color: COLORS.primary, marginBottom: 3, fontWeight: '500' },
    lastMsg: { fontSize: 13, color: COLORS.textMuted },
    separator: { height: 1, backgroundColor: COLORS.border },
});
