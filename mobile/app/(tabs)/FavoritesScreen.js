import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Alert, RefreshControl } from 'react-native';
import { favoritesAPI } from '../../services/api';
import { COLORS, API_BASE_URL } from '../../constants';
import { useAuthStore } from '../../store/authStore';

export default function FavoritesScreen({ navigation }) {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const user = useAuthStore((s) => s.user);

    useEffect(() => { if (user) loadFavorites(); else setLoading(false); }, [user]);

    const loadFavorites = async () => {
        try {
            const { data } = await favoritesAPI.getAll();
            setFavorites(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); setRefreshing(false); }
    };

    const removeFavorite = async (propertyId) => {
        try {
            await favoritesAPI.remove(propertyId);
            setFavorites((prev) => prev.filter((f) => f.property._id !== propertyId));
        } catch { Alert.alert('Error', 'Could not remove favorite'); }
    };

    const formatPrice = (p) =>
        p >= 10000000 ? `₹${(p / 10000000).toFixed(1)}Cr` :
            p >= 100000 ? `₹${(p / 100000).toFixed(0)}L` : `₹${p?.toLocaleString()}`;

    if (!user) return (
        <View style={styles.center}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>❤️</Text>
            <Text style={styles.empty}>Sign in to view your saved properties</Text>
        </View>
    );

    if (loading) return <ActivityIndicator size="large" color={COLORS.primary} style={styles.center} />;

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Saved Properties</Text>
            <FlatList
                data={favorites}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{ padding: 16, gap: 14 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadFavorites(); }} tintColor={COLORS.primary} />}
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Text style={{ fontSize: 48, marginBottom: 12 }}>🤍</Text>
                        <Text style={styles.empty}>No saved properties yet</Text>
                    </View>
                }
                renderItem={({ item }) => {
                    const p = item.property;
                    return (
                        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('PropertyDetail', { id: p._id })}>
                            {p.images?.[0] ? (
                                <Image source={{ uri: `${API_BASE_URL}${p.images[0]}` }} style={styles.image} />
                            ) : (
                                <View style={[styles.image, styles.imgFallback]}><Text style={{ fontSize: 36 }}>🏠</Text></View>
                            )}
                            <View style={styles.info}>
                                <Text style={styles.price}>{formatPrice(p.price)}</Text>
                                <Text style={styles.title} numberOfLines={1}>{p.title}</Text>
                                <Text style={styles.city}>📍 {p.location?.city}</Text>
                                <View style={styles.stats}>
                                    {p.bedrooms > 0 && <Text style={styles.stat}>🛏 {p.bedrooms}</Text>}
                                    {p.bathrooms > 0 && <Text style={styles.stat}>🚿 {p.bathrooms}</Text>}
                                    <Text style={styles.stat}>📐 {p.area} sqft</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => removeFavorite(p._id)} style={styles.removeBtn}>
                                <Text style={{ fontSize: 22 }}>❤️</Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    );
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, padding: 32 },
    header: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, padding: 20, paddingTop: 56 },
    empty: { color: COLORS.textMuted, fontSize: 16, textAlign: 'center' },
    card: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
    image: { width: 110, height: 110 },
    imgFallback: { backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center' },
    info: { flex: 1, padding: 12 },
    price: { fontSize: 17, fontWeight: '800', color: COLORS.primary, marginBottom: 3 },
    title: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 3 },
    city: { fontSize: 12, color: COLORS.textMuted, marginBottom: 7 },
    stats: { flexDirection: 'row', gap: 10 },
    stat: { color: COLORS.textLight, fontSize: 12 },
    removeBtn: { padding: 14, justifyContent: 'center' },
});
