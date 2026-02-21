import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, RefreshControl, Modal, ScrollView,
} from 'react-native';
import { Image } from 'react-native';
import { propertyAPI } from '../../services/api';
import { COLORS, PROPERTY_TYPES, API_BASE_URL } from '../../constants';

const ICON = { apartment: '🏢', house: '🏠', villa: '🏰', studio: '🛋️', commercial: '🏪', land: '🌿' };

export default function HomeScreen({ navigation }) {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filterVisible, setFilterVisible] = useState(false);
    const [filters, setFilters] = useState({ type: '', status: '', minPrice: '', maxPrice: '', bedrooms: '' });

    const fetchProperties = useCallback(async (reset = false) => {
        try {
            const params = { page: reset ? 1 : page, limit: 10, search };
            if (filters.type) params.type = filters.type;
            if (filters.status) params.status = filters.status;
            if (filters.minPrice) params.minPrice = filters.minPrice;
            if (filters.maxPrice) params.maxPrice = filters.maxPrice;
            if (filters.bedrooms) params.bedrooms = filters.bedrooms;

            const { data } = await propertyAPI.getAll(params);
            setProperties(reset ? data.properties : (prev) => [...prev, ...data.properties]);
            setTotalPages(data.pages);
            if (reset) setPage(1);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [page, search, filters]);

    useEffect(() => { fetchProperties(true); }, [search, filters]);

    const onRefresh = () => { setRefreshing(true); fetchProperties(true); };
    const loadMore = () => { if (page < totalPages) { setPage((p) => p + 1); fetchProperties(); } };

    const applyFilter = (key, val) => setFilters((p) => ({ ...p, [key]: p[key] === val ? '' : val }));

    const formatPrice = (price) =>
        price >= 10000000 ? `₹${(price / 10000000).toFixed(1)}Cr` :
            price >= 100000 ? `₹${(price / 100000).toFixed(0)}L` : `₹${price.toLocaleString()}`;

    const renderCard = ({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('PropertyDetail', { id: item._id })}>
            {item.images?.[0] ? (
                <Image source={{ uri: `${API_BASE_URL}${item.images[0]}` }} style={styles.cardImage} />
            ) : (
                <View style={[styles.cardImage, styles.cardImageFallback]}>
                    <Text style={{ fontSize: 40 }}>{ICON[item.type] || '🏠'}</Text>
                </View>
            )}
            <View style={styles.cardBadge}>
                <Text style={styles.cardBadgeText}>{item.status === 'for_sale' ? 'For Sale' : 'For Rent'}</Text>
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.cardLocation} numberOfLines={1}>📍 {item.location.city}</Text>
                <View style={styles.cardStats}>
                    {item.bedrooms > 0 && <Text style={styles.stat}>🛏 {item.bedrooms}</Text>}
                    {item.bathrooms > 0 && <Text style={styles.stat}>🚿 {item.bathrooms}</Text>}
                    <Text style={styles.stat}>📐 {item.area} sqft</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Explore Properties</Text>
                <TouchableOpacity onPress={() => setFilterVisible(true)} style={styles.filterBtn}>
                    <Text style={styles.filterBtnText}>⚙️ Filter</Text>
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchRow}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search city, title..."
                    placeholderTextColor={COLORS.textMuted}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {/* Active filters chips */}
            {Object.values(filters).some(Boolean) && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
                    {Object.entries(filters).filter(([, v]) => v).map(([k, v]) => (
                        <TouchableOpacity key={k} style={styles.chip} onPress={() => setFilters((p) => ({ ...p, [k]: '' }))}>
                            <Text style={styles.chipText}>{k}: {v} ✕</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={properties}
                    keyExtractor={(item) => item._id}
                    renderItem={renderCard}
                    contentContainerStyle={{ padding: 16, gap: 16 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.3}
                    ListEmptyComponent={<Text style={styles.empty}>No properties found 😕</Text>}
                />
            )}

            {/* Filter Modal */}
            <Modal visible={filterVisible} animationType="slide" transparent>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setFilterVisible(false)} />
                <View style={styles.modal}>
                    <Text style={styles.modalTitle}>Filter Properties</Text>

                    <Text style={styles.modalLabel}>Type</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                        {PROPERTY_TYPES.map((t) => (
                            <TouchableOpacity key={t} style={[styles.chip, filters.type === t && styles.chipActive]}
                                onPress={() => applyFilter('type', t)}>
                                <Text style={[styles.chipText, filters.type === t && { color: '#fff' }]}>
                                    {ICON[t]} {t}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Text style={styles.modalLabel}>Status</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                        {['for_sale', 'for_rent'].map((s) => (
                            <TouchableOpacity key={s} style={[styles.chip, filters.status === s && styles.chipActive]}
                                onPress={() => applyFilter('status', s)}>
                                <Text style={[styles.chipText, filters.status === s && { color: '#fff' }]}>
                                    {s === 'for_sale' ? '💰 For Sale' : '🔑 For Rent'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.modalLabel}>Min Bedrooms</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                        {['1', '2', '3', '4', '5'].map((n) => (
                            <TouchableOpacity key={n} style={[styles.chip, filters.bedrooms === n && styles.chipActive]}
                                onPress={() => applyFilter('bedrooms', n)}>
                                <Text style={[styles.chipText, filters.bedrooms === n && { color: '#fff' }]}>{n}+</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity style={styles.applyBtn} onPress={() => setFilterVisible(false)}>
                        <Text style={styles.applyBtnText}>Apply Filters</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setFilters({ type: '', status: '', minPrice: '', maxPrice: '', bedrooms: '' }); setFilterVisible(false); }}>
                        <Text style={{ color: COLORS.error, textAlign: 'center', marginTop: 12 }}>Clear All</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
    filterBtn: { backgroundColor: COLORS.surface, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.border },
    filterBtnText: { color: COLORS.text, fontWeight: '600' },
    searchRow: { paddingHorizontal: 16, marginBottom: 8 },
    searchInput: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, fontSize: 15 },
    chipsRow: { paddingHorizontal: 16, marginBottom: 4 },
    chip: { backgroundColor: COLORS.surfaceLight, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8, borderWidth: 1, borderColor: COLORS.border },
    chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    chipText: { color: COLORS.textLight, fontSize: 13, fontWeight: '500' },
    card: { backgroundColor: COLORS.surface, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
    cardImage: { width: '100%', height: 200 },
    cardImageFallback: { backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center' },
    cardBadge: { position: 'absolute', top: 14, left: 14, backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    cardBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    cardBody: { padding: 16 },
    cardPrice: { fontSize: 22, fontWeight: '800', color: COLORS.primary, marginBottom: 4 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
    cardLocation: { fontSize: 13, color: COLORS.textMuted, marginBottom: 10 },
    cardStats: { flexDirection: 'row', gap: 16 },
    stat: { color: COLORS.textLight, fontSize: 13 },
    empty: { color: COLORS.textMuted, textAlign: 'center', marginTop: 60, fontSize: 16 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
    modal: { backgroundColor: COLORS.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 48 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 20 },
    modalLabel: { color: COLORS.textMuted, fontSize: 13, marginBottom: 8, fontWeight: '600' },
    applyBtn: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
    applyBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
