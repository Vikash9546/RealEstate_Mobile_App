import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    ActivityIndicator, Alert, Dimensions, Image,
} from 'react-native';
import { propertyAPI, favoritesAPI, chatAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { COLORS, API_BASE_URL } from '../../constants';

const { width } = Dimensions.get('window');

export default function PropertyDetailScreen({ route, navigation }) {
    const { id } = route.params;
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);
    const [imgIndex, setImgIndex] = useState(0);
    const user = useAuthStore((s) => s.user);

    useEffect(() => {
        loadProperty();
    }, [id]);

    const loadProperty = async () => {
        try {
            const [{ data }, fav] = await Promise.allSettled([
                propertyAPI.getById(id),
                favoritesAPI.check(id),
            ]);
            setProperty(data?.value || data);
            if (fav.status === 'fulfilled') setIsFavorite(fav.value?.data?.isFavorite);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const toggleFavorite = async () => {
        try {
            if (isFavorite) {
                await favoritesAPI.remove(id);
                setIsFavorite(false);
            } else {
                await favoritesAPI.add(id);
                setIsFavorite(true);
            }
        } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Please log in to save favorites');
        }
    };

    const startChat = async () => {
        if (!user) return Alert.alert('Login Required', 'Please sign in to chat');
        if (user._id === property.agent._id) return Alert.alert('Info', "You can't chat with yourself");
        try {
            const { data: room } = await chatAPI.createOrGetRoom({ agentId: property.agent._id, propertyId: id });
            navigation.navigate('ChatRoom', { roomId: room._id, name: property.agent.name });
        } catch (e) {
            Alert.alert('Error', 'Could not open chat');
        }
    };

    const formatPrice = (price) =>
        price >= 10000000 ? `₹${(price / 10000000).toFixed(1)} Cr` :
            price >= 100000 ? `₹${(price / 100000).toFixed(0)} L` : `₹${price?.toLocaleString()}`;

    if (loading) return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
    );
    if (!property) return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: COLORS.text }}>Property not found</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Image Gallery */}
                <View style={styles.galleryContainer}>
                    <ScrollView
                        horizontal pagingEnabled showsHorizontalScrollIndicator={false}
                        onScroll={(e) => setImgIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
                        scrollEventThrottle={16}>
                        {property.images?.length > 0 ? property.images.map((img, i) => (
                            <Image key={i} source={{ uri: `${API_BASE_URL}${img}` }} style={styles.galleryImage} />
                        )) : (
                            <View style={[styles.galleryImage, styles.galleryFallback]}>
                                <Text style={{ fontSize: 64 }}>🏠</Text>
                            </View>
                        )}
                    </ScrollView>
                    {/* Dots */}
                    {property.images?.length > 1 && (
                        <View style={styles.dots}>
                            {property.images.map((_, i) => (
                                <View key={i} style={[styles.dot, i === imgIndex && styles.dotActive]} />
                            ))}
                        </View>
                    )}
                    {/* Back button */}
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.backBtnText}>←</Text>
                    </TouchableOpacity>
                    {/* Favorite */}
                    <TouchableOpacity style={styles.favBtn} onPress={toggleFavorite}>
                        <Text style={{ fontSize: 24 }}>{isFavorite ? '❤️' : '🤍'}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.body}>
                    {/* Price + Badge */}
                    <View style={styles.priceRow}>
                        <Text style={styles.price}>{formatPrice(property.price)}</Text>
                        <View style={[styles.badge, { backgroundColor: property.status === 'for_sale' ? COLORS.primary : COLORS.success }]}>
                            <Text style={styles.badgeText}>{property.status === 'for_sale' ? 'For Sale' : 'For Rent'}</Text>
                        </View>
                    </View>

                    <Text style={styles.title}>{property.title}</Text>
                    <Text style={styles.location}>📍 {property.location.address}, {property.location.city}</Text>

                    {/* Stats */}
                    <View style={styles.statsRow}>
                        {property.bedrooms > 0 && (
                            <View style={styles.statBox}>
                                <Text style={styles.statIcon}>🛏</Text>
                                <Text style={styles.statLabel}>{property.bedrooms} Beds</Text>
                            </View>
                        )}
                        {property.bathrooms > 0 && (
                            <View style={styles.statBox}>
                                <Text style={styles.statIcon}>🚿</Text>
                                <Text style={styles.statLabel}>{property.bathrooms} Baths</Text>
                            </View>
                        )}
                        <View style={styles.statBox}>
                            <Text style={styles.statIcon}>📐</Text>
                            <Text style={styles.statLabel}>{property.area} sqft</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statIcon}>👁</Text>
                            <Text style={styles.statLabel}>{property.views} Views</Text>
                        </View>
                    </View>

                    {/* Description */}
                    <Text style={styles.sectionTitle}>About</Text>
                    <Text style={styles.desc}>{property.description}</Text>

                    {/* Amenities */}
                    {property.amenities?.length > 0 && (
                        <>
                            <Text style={styles.sectionTitle}>Amenities</Text>
                            <View style={styles.amenitiesGrid}>
                                {property.amenities.map((a, i) => (
                                    <View key={i} style={styles.amenityTag}>
                                        <Text style={styles.amenityText}>✓ {a}</Text>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}

                    {/* Map placeholder */}
                    <Text style={styles.sectionTitle}>Location</Text>
                    <View style={styles.mapPlaceholder}>
                        <Text style={{ fontSize: 32 }}>🗺️</Text>
                        <Text style={{ color: COLORS.textMuted, marginTop: 8 }}>{property.location.address}</Text>
                        <Text style={{ color: COLORS.textMuted, fontSize: 12 }}>{property.location.city}, {property.location.country}</Text>
                    </View>

                    {/* Agent Info */}
                    <Text style={styles.sectionTitle}>Listed by</Text>
                    <View style={styles.agentCard}>
                        <View style={styles.agentAvatar}>
                            <Text style={{ fontSize: 28 }}>👤</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.agentName}>{property.agent?.name}</Text>
                            <Text style={styles.agentEmail}>{property.agent?.email}</Text>
                            {property.agent?.isOnline && (
                                <View style={styles.onlineRow}>
                                    <View style={styles.onlineDot} />
                                    <Text style={styles.onlineText}>Online now</Text>
                                </View>
                            )}
                        </View>
                    </View>
                    <View style={{ height: 120 }} />
                </View>
            </ScrollView>

            {/* Bottom CTA */}
            <View style={styles.bottomBar}>
                {user?._id !== property.agent?._id && (
                    <TouchableOpacity style={styles.chatBtn} onPress={startChat}>
                        <Text style={styles.chatBtnText}>💬 Chat with Agent</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    galleryContainer: { position: 'relative' },
    galleryImage: { width, height: 320 },
    galleryFallback: { backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
    dots: { position: 'absolute', bottom: 12, alignSelf: 'center', flexDirection: 'row', gap: 6 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
    dotActive: { backgroundColor: '#fff', width: 20 },
    backBtn: {
        position: 'absolute', top: 52, left: 16,
        backgroundColor: 'rgba(0,0,0,0.5)', width: 40, height: 40, borderRadius: 20,
        alignItems: 'center', justifyContent: 'center',
    },
    backBtnText: { color: '#fff', fontSize: 20, lineHeight: 24 },
    favBtn: {
        position: 'absolute', top: 52, right: 16,
        backgroundColor: 'rgba(0,0,0,0.5)', width: 44, height: 44, borderRadius: 22,
        alignItems: 'center', justifyContent: 'center',
    },
    body: { padding: 20 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    price: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
    badge: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
    badgeText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    title: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 6 },
    location: { color: COLORS.textMuted, fontSize: 14, marginBottom: 20 },
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    statBox: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
    statIcon: { fontSize: 20, marginBottom: 4 },
    statLabel: { color: COLORS.textLight, fontSize: 12, fontWeight: '500' },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12, marginTop: 4 },
    desc: { color: COLORS.textLight, lineHeight: 24, marginBottom: 20 },
    amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
    amenityTag: { backgroundColor: COLORS.surfaceLight, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.border },
    amenityText: { color: COLORS.textLight, fontSize: 13 },
    mapPlaceholder: { backgroundColor: COLORS.surface, borderRadius: 16, height: 140, alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1, borderColor: COLORS.border },
    agentCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: COLORS.border },
    agentAvatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center' },
    agentName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
    agentEmail: { color: COLORS.textMuted, fontSize: 13, marginTop: 2 },
    onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.online },
    onlineText: { color: COLORS.online, fontSize: 12, fontWeight: '600' },
    bottomBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: COLORS.background, padding: 20, paddingBottom: 36,
        borderTopWidth: 1, borderTopColor: COLORS.border,
    },
    chatBtn: { backgroundColor: COLORS.primary, borderRadius: 16, padding: 18, alignItems: 'center' },
    chatBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
