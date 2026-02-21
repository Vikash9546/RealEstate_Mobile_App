import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { authAPI } from '../../services/api';
import { COLORS } from '../../constants';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const login = useAuthStore((s) => s.login);

    const handleLogin = async () => {
        if (!email || !password) return Alert.alert('Error', 'Please fill in all fields');
        try {
            setLoading(true);
            const { data } = await authAPI.login({ email, password });
            await login(data);
        } catch (err) {
            Alert.alert('Login Failed', err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
                <Text style={styles.logo}>🏠</Text>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to find your dream property</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor={COLORS.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={COLORS.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign In</Text>}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                    <Text style={styles.link}>Don't have an account? <Text style={styles.linkBold}>Sign Up</Text></Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    inner: { flexGrow: 1, justifyContent: 'center', padding: 28 },
    logo: { fontSize: 64, textAlign: 'center', marginBottom: 16 },
    title: { fontSize: 30, fontWeight: 'bold', color: COLORS.text, textAlign: 'center' },
    subtitle: { fontSize: 15, color: COLORS.textMuted, textAlign: 'center', marginBottom: 36, marginTop: 8 },
    input: {
        backgroundColor: COLORS.surface, borderRadius: 14, padding: 16,
        color: COLORS.text, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border, fontSize: 15,
    },
    btn: {
        backgroundColor: COLORS.primary, borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 8,
    },
    btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    link: { color: COLORS.textMuted, textAlign: 'center', marginTop: 24, fontSize: 14 },
    linkBold: { color: COLORS.primary, fontWeight: '700' },
});
