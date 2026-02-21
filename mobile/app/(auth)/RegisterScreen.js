import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { authAPI } from '../../services/api';
import { COLORS } from '../../constants';

export default function RegisterScreen({ navigation }) {
    const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'buyer' });
    const [loading, setLoading] = useState(false);
    const login = useAuthStore((s) => s.login);

    const handleRegister = async () => {
        if (!form.name || !form.email || !form.password) return Alert.alert('Error', 'Fill in all required fields');
        try {
            setLoading(true);
            const { data } = await authAPI.register(form);
            await login(data);
        } catch (err) {
            Alert.alert('Registration Failed', err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const set = (key) => (val) => setForm((prev) => ({ ...prev, [key]: val }));

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
                <Text style={styles.logo}>🏠</Text>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Join thousands finding their perfect home</Text>

                <TextInput style={styles.input} placeholder="Full Name *" placeholderTextColor={COLORS.textMuted}
                    value={form.name} onChangeText={set('name')} />
                <TextInput style={styles.input} placeholder="Email *" placeholderTextColor={COLORS.textMuted}
                    value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" />
                <TextInput style={styles.input} placeholder="Password * (min 6 chars)" placeholderTextColor={COLORS.textMuted}
                    value={form.password} onChangeText={set('password')} secureTextEntry />
                <TextInput style={styles.input} placeholder="Phone (optional)" placeholderTextColor={COLORS.textMuted}
                    value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />

                <Text style={styles.label}>I am a:</Text>
                <View style={styles.roleRow}>
                    {['buyer', 'agent'].map((role) => (
                        <TouchableOpacity
                            key={role}
                            style={[styles.roleBtn, form.role === role && styles.roleBtnActive]}
                            onPress={() => setForm((p) => ({ ...p, role }))}>
                            <Text style={[styles.roleBtnText, form.role === role && styles.roleBtnTextActive]}>
                                {role === 'buyer' ? '🔍 Buyer' : '🏡 Agent'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account</Text>}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.link}>Already have an account? <Text style={styles.linkBold}>Sign In</Text></Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    inner: { flexGrow: 1, justifyContent: 'center', padding: 28 },
    logo: { fontSize: 52, textAlign: 'center', marginBottom: 12 },
    title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text, textAlign: 'center' },
    subtitle: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginBottom: 30, marginTop: 6 },
    input: {
        backgroundColor: COLORS.surface, borderRadius: 14, padding: 16,
        color: COLORS.text, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border, fontSize: 15,
    },
    label: { color: COLORS.textMuted, marginBottom: 10, fontSize: 14 },
    roleRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    roleBtn: {
        flex: 1, borderRadius: 12, padding: 14, alignItems: 'center',
        backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    },
    roleBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    roleBtnText: { color: COLORS.textMuted, fontWeight: '600', fontSize: 15 },
    roleBtnTextActive: { color: '#fff' },
    btn: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 18, alignItems: 'center' },
    btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    link: { color: COLORS.textMuted, textAlign: 'center', marginTop: 22, fontSize: 14 },
    linkBold: { color: COLORS.primary, fontWeight: '700' },
});
