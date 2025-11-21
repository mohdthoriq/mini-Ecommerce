// screens/auth/Login.tsx - PERBAIKI DENGAN useAuth HOOK
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { HomeStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext'; // ✅ GUNAKAN useAuth HOOK
// import { validateUsername, validatePassword } from '../../utils/validation'; // HAPUS JIKA TIDAK DIPAKAI

type LoginScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList>;

const LoginScreen = () => {
    const navigation = useNavigation<LoginScreenNavigationProp>();
    
    // ✅ GUNAKAN useAuth HOOK YANG BARU
    const { 
        login, 
        isAuthenticated, 
        isLoading, 
        postLoginRedirect, 
        clearPostLoginRedirect 
    } = useAuth();

    const [form, setForm] = useState({
        username: '',
        password: '',
    });
    const [errors, setErrors] = useState({
        username: '',
        password: '',
    });
    const [isLoggingIn, setIsLoggingIn] = useState(false); // ✅ RENAME AGAR TIDAK BENTROK DENGAN isLoading DARI CONTEXT
    const [showPassword, setShowPassword] = useState(false);

    // Redirect jika pengguna sudah terotentikasi
    React.useEffect(() => {
        if (isAuthenticated) {
            console.log('✅ [LOGIN] User is authenticated. Checking for post-login redirect.');
            // Jika ada rute yang disimpan, arahkan ke sana
            const target = postLoginRedirect || { route: 'Home', params: undefined };
            
            console.log(`✅ Redirecting to: ${target.route}`);
            
            navigation.reset({
                index: 0,
                routes: [{ name: target.route as any, params: target.params }],
            });
            clearPostLoginRedirect(); // Hapus redirect setelah digunakan
        }
    }, [isAuthenticated, navigation, postLoginRedirect, clearPostLoginRedirect]);

    const handleInputChange = (field: keyof typeof form, value: string) => {
        setForm(prev => ({
            ...prev,
            [field]: value,
        }));

        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: '',
            }));
        }
    };

    const validateForm = (): boolean => {
        // Simple validation saja dulu
        const usernameError = form.username ? '' : 'Username is required';
        const passwordError = form.password ? '' : 'Password is required';

        setErrors({
            username: usernameError,
            password: passwordError,
        });

        const isValid = !usernameError && !passwordError;
        console.log('✅ [VALIDATION] Result:', { 
            isValid, 
            username: form.username,
            passwordLength: form.password.length 
        });
        
        return isValid;
    };

    const handleLogin = async () => {
        if (!validateForm()) {
            console.log('❌ [LOGIN] Form validation failed');
            console.log('❌ [LOGIN] Current form state:', form);
            return;
        }

        setIsLoggingIn(true); // ✅ GUNAKAN isLoggingIn, BUKAN isLoading
        console.log('🔐 [LOGIN] Starting login process...', {
            username: form.username,
            passwordLength: form.password.length
        });

        try {
            console.log('📞 [LOGIN] Calling AuthContext login...');
            await login({
                username: form.username,
                password: form.password
            });

            console.log('✅ [LOGIN] AuthContext login completed successfully');
            Alert.alert('Success', 'Welcome back to Eco Store!');
            
        } catch (error: any) {
            console.error('❌ [LOGIN] Login error details:', error);
            Alert.alert(
                'Login Failed', 
                error.message || 'Invalid username or password. Please try again.'
            );
        } finally { 
            setIsLoggingIn(false);
        }
    };

    const handleDemoLogin = async () => {
        console.log('🎯 [DEMO] Starting demo login...');
        
        // 1. Set form state dulu
        const demoCredentials = {
            username: 'emilys',
            password: 'emilyspass'
        };
        
        setForm(demoCredentials);
        console.log('🎯 [DEMO] Form set to:', demoCredentials);

        // 2. Tunggu sebentar biar state ter-update, baru panggil handleLogin
        setTimeout(() => {
            console.log('🎯 [DEMO] Now calling handleLogin...');
            handleLogin();
        }, 200);
    };

    // Test langsung dengan DummyJSON API
    const testDirectAPI = async () => {
        console.log('🧪 [TEST] Testing direct DummyJSON API call...');
        
        // Test multiple possible credentials
        const testCredentialsList = [
            { username: 'emilys', password: 'emilyspass' },
            { username: 'kminchelle', password: '0lelplR' }, // Original
            { username: 'atuny0', password: '9uQFF1Lh' },
            { username: 'hbingley1', password: 'CQutx25i8r' }
        ];

        for (const testCredentials of testCredentialsList) {
            try {
                console.log('📡 [TEST] Testing with:', testCredentials);
                
                const response = await fetch('https://dummyjson.com/auth/login', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(testCredentials),
                });

                console.log('📡 [TEST] Response status:', response.status);
                
                const responseText = await response.text();
                console.log('📡 [TEST] Response body:', responseText);

                if (response.ok) {
                    const data = JSON.parse(responseText);
                    console.log('✅ [TEST] SUCCESS with credentials:', testCredentials.username);
                    console.log('✅ [TEST] Token received:', data.token ? 'YES' : 'NO');
                    console.log('✅ [TEST] User data:', {
                        id: data.id,
                        username: data.username,
                        email: data.email
                    });

                    Alert.alert(
                        'API Test SUCCESS', 
                        `Working credentials found!\nUsername: ${testCredentials.username}`
                    );
                    return; // Stop testing after first success
                } else {
                    console.log('❌ [TEST] Failed with:', testCredentials.username);
                }
                
            } catch (error: any) {
                console.error('❌ [TEST] Error with', testCredentials.username, ':', error.message);
            }
        }

        // If all failed
        console.error('❌ [TEST] All test credentials failed');
        Alert.alert('API Test', 'All test credentials failed. The API might be down.');
    };

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <FontAwesome6 name="leaf" size={40} color="#ffffff" iconStyle='solid' />
                    <Text style={styles.headerTitle}>Welcome Back!</Text>
                    <Text style={styles.headerSubtitle}>
                        Sign in to your Eco Store account
                    </Text>
                </View>

                {/* Login Form */}
                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            <FontAwesome6 name="user" size={14} color="#2e7d32" iconStyle='solid' /> Username
                        </Text>
                        <TextInput
                            style={[
                                styles.input,
                                errors.username && styles.inputError
                            ]}
                            value={form.username}
                            onChangeText={(value) => handleInputChange('username', value)}
                            placeholder="Enter your username"
                            placeholderTextColor="#999"
                            autoCapitalize="none"
                            autoComplete="username"
                        />
                        {errors.username ? (
                            <Text style={styles.errorText}>
                                <FontAwesome6 name="circle-exclamation" size={12} color="#ff5722" iconStyle='solid' /> {errors.username}
                            </Text>
                        ) : (
                            <Text style={styles.hintText}>
                                <FontAwesome6 name="circle-info" size={12} color="#999" iconStyle='solid' /> Required for DummyJSON API
                            </Text>
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            <FontAwesome6 name="lock" size={14} color="#2e7d32" iconStyle='solid' /> Password
                        </Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={[
                                    styles.passwordInput,
                                    errors.password && styles.inputError
                                ]}
                                value={form.password}
                                onChangeText={(value) => handleInputChange('password', value)}
                                placeholder="Enter your password"
                                placeholderTextColor="#999"
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                autoComplete="password"
                            />
                            <TouchableOpacity
                                style={styles.eyeButton}
                                onPress={toggleShowPassword}
                            >
                                <FontAwesome6
                                    name={showPassword ? "eye-slash" : "eye"}
                                    size={16}
                                    color="#666"
                                    iconStyle='solid'
                                />
                            </TouchableOpacity>
                        </View>
                        {errors.password && (
                            <Text style={styles.errorText}>
                                <FontAwesome6 name="circle-exclamation" size={12} color="#ff5722" iconStyle='solid' /> {errors.password}
                            </Text>
                        )}
                    </View>

                    <TouchableOpacity style={styles.forgotPassword}>
                        <Text style={styles.forgotPasswordText}>
                            <FontAwesome6 name="key" size={12} color="#2e7d32" iconStyle='solid' /> Forgot Password?
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.loginButton,
                            (isLoggingIn || !form.username || !form.password) && styles.loginButtonDisabled // ✅ GUNAKAN isLoggingIn
                        ]}
                        onPress={handleLogin}
                        disabled={isLoggingIn || !form.username || !form.password} // ✅ GUNAKAN isLoggingIn
                    >
                        {isLoggingIn ? ( // ✅ GUNAKAN isLoggingIn
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <>
                                <FontAwesome6 name="right-to-bracket" size={16} color="#ffffff" iconStyle='solid' />
                                <Text style={styles.loginButtonText}> Sign In</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Demo Login Button */}
                    <TouchableOpacity
                        style={styles.demoButton}
                        onPress={handleDemoLogin}
                        disabled={isLoggingIn} // ✅ GUNAKAN isLoggingIn
                    >
                        <FontAwesome6 name="user-secret" size={14} color="#4caf50" iconStyle='solid' />
                        <Text style={styles.demoButtonText}> Use Test Credentials</Text>
                    </TouchableOpacity>

                    {/* API Test Button (Debug) */}
                    <TouchableOpacity
                        style={styles.testButton}
                        onPress={testDirectAPI}
                    >
                        <FontAwesome6 name="vial" size={14} color="#ff9800" iconStyle='solid' />
                        <Text style={styles.testButtonText}> Test Direct API</Text>
                    </TouchableOpacity>

                    {/* Test Credentials Info */}
                    <View style={styles.credentialsInfo}>
                        <Text style={styles.credentialsTitle}>Test Credentials:</Text>
                        <Text style={styles.credentialsText}>Username: kminchelle</Text>
                        <Text style={styles.credentialsText}>Password: 0lelplR</Text>
                    </View>
                </View>

                {/* Rest of the component remains the same */}
                <View style={styles.signupSection}>
                    <Text style={styles.signupText}>Don't have an account?</Text>
                    <TouchableOpacity>
                        <Text style={styles.signupLink}>Create one now</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.benefitsSection}>
                    <Text style={styles.benefitsTitle}>Why create an account?</Text>
                    <View style={styles.benefitsList}>
                        <View style={styles.benefitItem}>
                            <FontAwesome6 name="cart-shopping" size={20} color="#2e7d32" iconStyle='solid' />
                            <Text style={styles.benefitText}>Access full product catalog</Text>
                        </View>
                        <View style={styles.benefitItem}>
                            <FontAwesome6 name="credit-card" size={20} color="#2e7d32" iconStyle='solid' />
                            <Text style={styles.benefitText}>Make purchases securely</Text>
                        </View>
                        <View style={styles.benefitItem}>
                            <FontAwesome6 name="truck-fast" size={20} color="#2e7d32" iconStyle='solid' />
                            <Text style={styles.benefitText}>Track your orders</Text>
                        </View>
                        <View style={styles.benefitItem}>
                            <FontAwesome6 name="star" size={20} color="#2e7d32" iconStyle='solid' />
                            <Text style={styles.benefitText}>Earn rewards points</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

// Styles tetap sama
const styles = StyleSheet.create({
    // ... semua styles tetap sama seperti sebelumnya
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    header: {
        backgroundColor: '#2e7d32',
        padding: 30,
        paddingTop: 50,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 8,
        textAlign: 'center',
        marginTop: 12,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#e8f5e9',
        textAlign: 'center',
        opacity: 0.9,
    },
    form: {
        padding: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2e7d32',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 16,
        fontSize: 16,
        color: '#333',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    passwordInput: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 16,
        fontSize: 16,
        color: '#333',
    },
    eyeButton: {
        position: 'absolute',
        right: 16,
        padding: 4,
    },
    inputError: {
        borderColor: '#ff5722',
    },
    errorText: {
        fontSize: 14,
        color: '#ff5722',
        marginTop: 4,
    },
    hintText: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        fontSize: 14,
        color: '#2e7d32',
        fontWeight: '500',
    },
    loginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2e7d32',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
    },
    loginButtonDisabled: {
        backgroundColor: '#a5d6a7',
        opacity: 0.7,
    },
    loginButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    demoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#4caf50',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
    },
    demoButtonText: {
        color: '#4caf50',
        fontSize: 14,
        fontWeight: '500',
    },
    testButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#ff9800',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    testButtonText: {
        color: '#ff9800',
        fontSize: 12,
        fontWeight: '500',
    },
    credentialsInfo: {
        backgroundColor: '#e8f5e9',
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#2e7d32',
    },
    credentialsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2e7d32',
        marginBottom: 4,
    },
    credentialsText: {
        fontSize: 12,
        color: '#388e3c',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    signupSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        gap: 8,
    },
    signupText: {
        fontSize: 14,
        color: '#666',
    },
    signupLink: {
        fontSize: 14,
        color: '#2e7d32',
        fontWeight: '600',
    },
    benefitsSection: {
        padding: 24,
        paddingTop: 0,
    },
    benefitsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2e7d32',
        marginBottom: 16,
        textAlign: 'center',
    },
    benefitsList: {
        gap: 12,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 8,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2.22,
        gap: 12,
    },
    benefitText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
});

export default LoginScreen;