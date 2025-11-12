import React, { useState, useContext } from 'react';
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
import { AuthContext } from '../../context/AuthContext';
import { validateEmail, validatePassword } from '../../utils/validation';

type LoginScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList>;

const LoginScreen = () => {
    const navigation = useNavigation<LoginScreenNavigationProp>();
    const { login, isAuthenticated } = useContext(AuthContext);

    const [form, setForm] = useState({
        username: '',
        email: '',
        password: '',
    });
    const [errors, setErrors] = useState({
        username: '',
        email: '',
        password: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Jika sudah login, redirect ke Home
    React.useEffect(() => {
        if (isAuthenticated) {
            navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
            });
        }
    }, [isAuthenticated, navigation]);

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
        const emailError = validateEmail(form.email);
        const passwordError = validatePassword(form.password);

        setErrors({
            username: '',
            email: emailError,
            password: passwordError,
        });

        return !emailError && !passwordError;
    };

    const handleLogin = async () => {
        if (!validateForm()) return;

        setIsLoading(true);

        try {
            const success = await login(form.username, form.email, form.password);

            if (success) {
                // Navigation akan dihandle oleh useEffect di atas
                Alert.alert('Success', 'Welcome back!');
            } else {
                Alert.alert('Error', 'Invalid email or password. Please try again.');
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDemoLogin = () => {
        setForm({
            username: 'Demo User',
            email: 'user@example.com',
            password: 'password',
        });
    };

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const handleBack = () => {
        navigation.goBack();
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
                {/* Header dengan back button */}
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
                                <FontAwesome6 name="circle-info" size={12} color="#999" iconStyle='solid' /> Username must be unique bro
                            </Text>
                        )}
                    </View>


                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            <FontAwesome6 name="envelope" size={14} color="#2e7d32" iconStyle='solid' /> Email Address
                        </Text>
                        <TextInput
                            style={[
                                styles.input,
                                errors.email && styles.inputError
                            ]}
                            value={form.email}
                            onChangeText={(value) => handleInputChange('email', value)}
                            placeholder="Enter your email"
                            placeholderTextColor="#999"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                        />
                        {errors.email ? (
                            <Text style={styles.errorText}>
                                <FontAwesome6 name="circle-exclamation" size={12} color="#ff5722" iconStyle='solid' /> {errors.email}
                            </Text>
                        ) : (
                            <Text style={styles.hintText}>
                                <FontAwesome6 name="circle-info" size={12} color="#999" iconStyle='solid' /> We'll never share your email
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
                            isLoading && styles.loginButtonDisabled
                        ]}
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
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
                        disabled={isLoading}
                    >
                        <FontAwesome6 name="user-secret" size={14} color="#4caf50" iconStyle='solid' />
                        <Text style={styles.demoButtonText}> Use Demo Credentials</Text>
                    </TouchableOpacity>
                </View>

                {/* Sign Up Section */}
                <View style={styles.signupSection}>
                    <Text style={styles.signupText}>Don't have an account?</Text>
                    <TouchableOpacity>
                        <Text style={styles.signupLink}>Create one now</Text>
                    </TouchableOpacity>
                </View>

                {/* Benefits */}
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

const styles = StyleSheet.create({
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
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
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
    },
    demoButtonText: {
        color: '#4caf50',
        fontSize: 14,
        fontWeight: '500',
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