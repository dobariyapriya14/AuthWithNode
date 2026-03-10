import * as React from 'react';
import { Alert, Platform, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { createMMKV } from 'react-native-mmkv';
import { API_URL, endPoints } from '../constants/apiCilents';

const storage = createMMKV();

const LoginScreen = ({ navigation }: any) => {
    const [isLogin, setIsLogin] = React.useState(true);
    const [isOtpMode, setIsOtpMode] = React.useState(false);
    const [otpSent, setOtpSent] = React.useState(false);
    const [otp, setOtp] = React.useState('');
    const [name, setName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);

    const handleLogin = async () => {
        try {
            const res = await fetch(`${API_URL}${endPoints.login}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                Alert.alert("Login Failed", data.message || "Something went wrong");
                return;
            }

            // Save accessToken if it exists in the response
            if (data && data.accessToken) {
                storage.set("accessToken", data.accessToken);
                navigation.navigate('ToDoList');
            } else {
                // Try logging the accessToken if it's nested somewhere else, e.g. data.data.accessToken
                if (data?.data?.accessToken) {
                    storage.set("accessToken", data.data.accessToken);
                    navigation.navigate('ToDoList');
                } else {
                    Alert.alert("Login Error", "accessToken was not received from server");
                }
            }
        } catch (error) {
            Alert.alert("Error", "Network error");
        }
    };

    const handleSignup = async () => {
        try {
            const res = await fetch(`${API_URL}${endPoints.signup}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                }),
            });

            const text = await res.text();

            try {
                const data = JSON.parse(text);
                if (res.ok) {
                    Alert.alert("Success", "Account created! Please login.");
                    setIsLogin(true); // Switch to login mode
                } else {
                    Alert.alert("Signup Failed", data.message || "Something went wrong");
                }
            } catch (e) {
                Alert.alert("Error", "Invalid server response");
            }
        } catch (error) {
            Alert.alert("Error", "Network error");
        }
    };

    React.useEffect(() => {
        fetch("http://10.0.2.2:3000/hello")
            .then(res => res.json())
            .then(data => console.log("API DATA:", data))
            .catch(err => console.log("API ERROR:", err));
    }, []);

    const handleSendOtp = async () => {
        try {
            const res = await fetch(`${API_URL}${endPoints.sendOtp}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();

            if (res.ok) {
                // Auto-fill OTP if it's returned by the API
                if (data?.otp) {
                    setOtp(String(data.otp));
                }
                Alert.alert("Success", `OTP Sent: ${data?.otp || 'Check your email'}`);
                setOtpSent(true);
            } else {
                Alert.alert("Error", data.message || "Failed to send OTP");
            }
        } catch (error) {
            console.log("SEND OTP ERROR:", error);
            Alert.alert("Error", "Network error");
        }
    };

    const handleVerifyOtp = async () => {
        try {
            const res = await fetch(`${API_URL}${endPoints.verifyOtp}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp }),
            });
            const data = await res.json();

            if (res.ok) {
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
            } else {
                Alert.alert("Error", data.message || "Invalid OTP");
            }
        } catch (error) {
            console.log("VERIFY OTP ERROR:", error);
            Alert.alert("Error", "Network error");
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
                    secureTextEntry={!showPassword}
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