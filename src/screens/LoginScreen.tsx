import * as React from 'react';
import { Alert, View } from 'react-native';
import { Button, Text, TextInput, Menu, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../i18n';
import { createMMKV } from 'react-native-mmkv';
import { apiService } from '../services/apiService';

const storage = createMMKV();

const LoginScreen = ({ navigation }: any) => {
    const [isLogin, setIsLogin] = React.useState(true);
    const [isOtpMode, setIsOtpMode] = React.useState(false);
    const [isMenuVisible, setIsMenuVisible] = React.useState(false);
    const { t, i18n } = useTranslation();
    const [otpSent, setOtpSent] = React.useState(false);
    const [otp, setOtp] = React.useState('');
    const [name, setName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');

    const handleLogin = async () => {
        try {
            const res = await apiService.login({ email, password });
            const data = res.data;

            // Save accessToken if it exists in the response
            if (data && data.accessToken) {
                storage.set("accessToken", data.accessToken);
                navigation.navigate('ToDoList');
            } else if (data?.data?.accessToken) {
                storage.set("accessToken", data.data.accessToken);
                navigation.navigate('ToDoList');
            } else {
                Alert.alert("Login Error", "accessToken was not received from server");
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || "Something went wrong";
            Alert.alert("Login Failed", errorMsg);
        }
    };

    const handleSignup = async () => {
        try {
            const res = await apiService.signup({ name, email, password });
            Alert.alert("Success", "Account created! Please login.");
            setIsLogin(true); // Switch to login mode
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || "Something went wrong";
            Alert.alert("Signup Failed", errorMsg);
        }
    };

    const handleSendOtp = async () => {
        try {
            const res = await apiService.sendOtp({ email });
            const data = res.data;

            // Auto-fill OTP if it's returned by the API
            if (data?.otp) {
                setOtp(String(data.otp));
            }
            Alert.alert("Success", `OTP Sent: ${data?.otp || 'Check your email'}`);
            setOtpSent(true);
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || "Failed to send OTP";
            Alert.alert("Error", errorMsg);
        }
    };

    const handleVerifyOtp = async () => {
        try {
            const res = await apiService.verifyOtp({ email, otp });
            const data = res.data;

            // Same logic as login to set token and navigate
            if (data && data.accessToken) {
                storage.set("accessToken", data.accessToken);
                navigation.navigate('ToDoList');
            } else if (data?.data?.accessToken) {
                storage.set("accessToken", data.data.accessToken);
                navigation.navigate('ToDoList');
            } else {
                Alert.alert("Success", "Verified successfully!");
                navigation.navigate('ToDoList'); // Assuming success means logged in
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || "Invalid OTP";
            Alert.alert("Error", errorMsg);
        }
    };

    return (
        <View style={{ flex: 1, padding: 20 }}>
            <View style={{ alignSelf: 'flex-end', marginTop: 10 }}>
                <Menu
                    visible={isMenuVisible}
                    onDismiss={() => setIsMenuVisible(false)}
                    anchor={
                        <Button 
                            mode="outlined" 
                            onPress={() => setIsMenuVisible(true)}
                            icon={({ size, color }) => <Text style={{ fontSize: 16 }}>🌐</Text>}
                            style={{ borderRadius: 8 }}
                        >
                            {i18n.language.toUpperCase()}
                        </Button>
                    }
                >
                    <Menu.Item 
                        onPress={() => { changeLanguage('en'); setIsMenuVisible(false); }} 
                        title={t('English')} 
                        leadingIcon={i18n.language === 'en' ? 'check' : undefined}
                    />
                    <Divider />
                    <Menu.Item 
                        onPress={() => { changeLanguage('fr'); setIsMenuVisible(false); }} 
                        title={t('French')} 
                        leadingIcon={i18n.language === 'fr' ? 'check' : undefined}
                    />
                </Menu>
            </View>

            <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text variant="headlineMedium" style={{ textAlign: 'center', marginBottom: 24, fontWeight: 'bold' }}>
                    {isOtpMode ? t('otp_login') : (isLogin ? t('welcome_back') : t('create_account'))}
                </Text>

                {!isLogin && !isOtpMode && (
                    <TextInput
                        label={t('name')}
                        value={name}
                        onChangeText={setName}
                        mode="outlined"
                        style={{ marginBottom: 16 }}
                    />
                )}

                <TextInput
                    label={t('email')}
                    value={email}
                    onChangeText={setEmail}
                    mode="outlined"
                    style={{ marginBottom: 16 }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    disabled={isOtpMode && otpSent}
                />

                {!isOtpMode && (
                    <TextInput
                        label={t('password')}
                        value={password}
                        onChangeText={setPassword}
                        mode="outlined"
                        style={{ marginBottom: 24 }}
                        secureTextEntry
                    />
                )}

                {isOtpMode && otpSent && (
                    <TextInput
                        label={t('enter_otp')}
                        value={otp}
                        onChangeText={setOtp}
                        mode="outlined"
                        style={{ marginBottom: 24 }}
                        keyboardType="numeric"
                    />
                )}

                <Button
                    mode="contained"
                    onPress={() => isOtpMode ? (otpSent ? handleVerifyOtp() : handleSendOtp()) : (isLogin ? handleLogin() : handleSignup())}
                    contentStyle={{ height: 48 }}
                    style={{ borderRadius: 8 }}
                >
                    {isOtpMode ? (otpSent ? t('otp_verify') : t('otp_send')) : (isLogin ? t('login') : t('signup'))}
                </Button>

                {!isOtpMode && (
                    <Button
                        mode="text"
                        onPress={() => setIsLogin(!isLogin)}
                        style={{ marginTop: 16 }}
                    >
                        {isLogin ? t('no_account') : t('already_account')}
                    </Button>
                )}

                {isLogin && (
                    <Button
                        mode="text"
                        onPress={() => {
                            setIsOtpMode(!isOtpMode);
                            setOtpSent(false);
                        }}
                        style={{ marginTop: isOtpMode ? 16 : 8 }}
                    >
                        {isOtpMode ? t('login_password') : t('login_otp')}
                    </Button>
                )}
            </View>
        </View>
    );
};

export default LoginScreen;