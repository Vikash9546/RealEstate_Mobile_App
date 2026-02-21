import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { authAPI } from '../../services/api';
import { COLORS } from '../../constants';

export default function ProfileScreen({ navigation }) {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);

    const handleLogout = async () => {
        Alert.alert('Logout', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout', style: 'destructive', onPress: async () => {
                    try { await authAPI.logout(); } catch { }
                    await logout();
                },
            },
        ]);
    };

    if (!user) return (
        <View style={styles.center}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>👤</Text>
            <Text style={styles.empty}>Sign in to view your profile</Text>
            <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('AuthStack')}>
                <Text style={styles.loginBtnText}>Sign In / Register</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.heroCard}>
                <View style={styles.avatarCircle}>
                    <Text style={{ fontSize: 48 }}>👤</Text>
                </View>
                <Text style={styles.name}>{user.name}</Text>
                <Text style={styles.email}>{user.email}</Text>
                <View style={[styles.roleBadge, { backgroundColor: user.role === 'agent' ? COLORS.primary : COLORS.success }]}>
                    <Text style={styles.roleText}>{user.role === 'agent' ? '🏡 Agent' : '🔍 Buyer'}</Text>
                </View>
            </View>

            <View style={styles.section}>
                {user.phone ? (
                    <View style={styles.infoRow}>
                        <Text style={styles.infoIcon}>📱</Text>
                        <Text style={styles.infoText}>{user.phone}</Text>
                    </View>
                ) : null}
                <View style={styles.infoRow}>
                    <Text style={styles.infoIcon}>📅</Text>
                    <Text style={styles.infoText}>Joined {new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</Text>
                </View>
            </View>

            {user.role === 'agent' && (
                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('MyListings')}>
                    <Text style={styles.menuIcon}>🏠</Text>
                    <Text style={styles.menuText}>My Listings</Text>
                    <Text style={styles.menuArrow}>›</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
                <Text style={styles.menuIcon}>🚪</Text>
                <Text style={[styles.menuText, { color: COLORS.error }]}>Logout</Text>
                <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, padding: 32 },
    empty: { color: COLORS.textMuted, fontSize: 16, textAlign: 'center', marginBottom: 24 },
    loginBtn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14 },
    loginBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    heroCard: { alignItems: 'center', padding: 32, paddingTop: 64 },
    avatarCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 2, borderColor: COLORS.primary },
    name: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
    email: { color: COLORS.textMuted, fontSize: 14, marginBottom: 14 },
    roleBadge: { borderRadius: 20, paddingHorizontal: 18, paddingVertical: 6 },
    roleText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    section: { backgroundColor: COLORS.surface, marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
    infoIcon: { fontSize: 18 },
    infoText: { color: COLORS.textLight, fontSize: 15 },
    menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, marginHorizontal: 16, marginBottom: 10, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: COLORS.border },
    logoutItem: { borderColor: 'rgba(239,68,68,0.2)' },
    menuIcon: { fontSize: 20, marginRight: 14 },
    menuText: { flex: 1, fontSize: 16, fontWeight: '600', color: COLORS.text },
    menuArrow: { color: COLORS.textMuted, fontSize: 22 },
});
