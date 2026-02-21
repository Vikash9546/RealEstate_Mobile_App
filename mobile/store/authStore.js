import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { connectSocket, disconnectSocket } from '../services/socket';

export const useAuthStore = create((set, get) => ({
    user: null,
    token: null,
    isLoading: true,

    // Called on app start to restore session
    initialize: async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const userStr = await AsyncStorage.getItem('user');
            if (token && userStr) {
                const user = JSON.parse(userStr);
                set({ user, token, isLoading: false });
                connectSocket(token);
            } else {
                set({ isLoading: false });
            }
        } catch {
            set({ isLoading: false });
        }
    },

    login: async ({ user, token }) => {
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        set({ user, token });
        connectSocket(token);
    },

    logout: async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        disconnectSocket();
        set({ user: null, token: null });
    },

    updateUser: (user) => {
        AsyncStorage.setItem('user', JSON.stringify(user));
        set({ user });
    },
}));
