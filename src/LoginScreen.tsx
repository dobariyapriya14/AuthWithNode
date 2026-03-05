import * as React from 'react';
import { Alert, Platform, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation }: any) => {
    const [isLogin, setIsLogin] = React.useState(true);
    const [name, setName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);

    const API_URL =
        Platform.OS === "android"
            ? "http://10.0.2.2:3000"
            : "http://myapi.local:3000";

    const login = async () => {
        try {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            console.log("LOGIN RESPONSE:", data);

            if (!res.ok) {
                Alert.alert("Login Failed", data.message || "Something went wrong");
                return;
            }

            console.log("LOGIN SUCCESS:", data);

            // Save token (AsyncStorage / MMKV)
            await AsyncStorage.setItem("token", data.token);
            navigation.navigate('ToDoList');
        } catch (error) {
            console.log("LOGIN ERROR:", error);
            Alert.alert("Error", "Network error");
        }
    };

    const signup = async () => {
        try {
            const res = await fetch(`${API_URL}/api/auth/signup`, {
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
                console.log("SIGNUP SUCCESS:", data);
                if (res.ok) {
                    Alert.alert("Success", "Account created! Please login.");
                    setIsLogin(true); // Switch to login mode
                } else {
                    Alert.alert("Signup Failed", data.message || "Something went wrong");
                }
            } catch (e) {
                console.error("JSON error", text);
                Alert.alert("Error", "Invalid server response");
            }
        } catch (error) {
            console.log("SIGNUP ERROR:", error);
            Alert.alert("Error", "Network error");
        }
    };

    React.useEffect(() => {
        fetch("http://10.0.2.2:3000/hello")
            .then(res => res.json())
            .then(data => console.log("API DATA:", data))
            .catch(err => console.log("API ERROR:", err));
    }, []);

    return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
            <Text variant="headlineMedium" style={{ textAlign: 'center', marginBottom: 24, fontWeight: 'bold' }}>
                {isLogin ? "Welcome Back" : "Create Account"}
            </Text>

            {!isLogin && (
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
            />

            <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry={!showPassword}
                style={{ marginBottom: 24 }}
            />

            <Button
                mode="contained"
                onPress={() => isLogin ? login() : signup()}
                contentStyle={{ height: 48 }}
                style={{ borderRadius: 8 }}
            >
                {isLogin ? "Login" : "Sign Up"}
            </Button>

            <Button
                mode="text"
                onPress={() => setIsLogin(!isLogin)}
                style={{ marginTop: 16 }}
            >
                {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
            </Button>
        </View>
    );
};

export default LoginScreen;