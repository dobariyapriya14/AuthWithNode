import * as React from 'react';
import { Alert, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { createMMKV } from 'react-native-mmkv';
import { apiService } from '../services/apiService';

const storage = createMMKV();

const LoginScreen = ({ navigation }: any) => {
    const [isLogin, setIsLogin] = React.useState(true);
    const [isOtpMode, setIsOtpMode] = React.useState(false);
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
        <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
            <Text variant="headlineMedium" style={{ textAlign: 'center', marginBottom: 24, fontWeight: 'bold' }}>
                {isOtpMode ? "OTP Login" : (isLogin ? "Welcome Back" : "Create Account")}
            </Text>

            {!isLogin && !isOtpMode && (
                <TextInput
                    label="Name"
                    value={name}
                    onChangeText={setName}
                    mode="outlined"
                    style={{ marginBottom: 16 }}
                />
            )}

            <TextInput
                label="Email"
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
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    mode="outlined"
                    style={{ marginBottom: 24 }}
                />
            )}

            {isOtpMode && otpSent && (
                <TextInput
                    label="Enter OTP"
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
                {isOtpMode ? (otpSent ? "Verify OTP" : "Send OTP") : (isLogin ? "Login" : "Sign Up")}
            </Button>

            {!isOtpMode && (
                <Button
                    mode="text"
                    onPress={() => setIsLogin(!isLogin)}
                    style={{ marginTop: 16 }}
                >
                    {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
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
                    {isOtpMode ? "Login with Password instead" : "Login with OTP"}
                </Button>
            )}
        </View>
    );
};

export default LoginScreen;