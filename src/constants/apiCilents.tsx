import { Platform } from "react-native";

export const API_URL =
    Platform.OS === "android"
        ? "http://10.0.2.2:3000/api/"
        : "http://myapi.local:3000/api/";

export const endPoints = {
    login: "auth/login",
    signup: "auth/signup",
    logout: "auth/logout",
    todos: "todos",
    sendOtp: "auth/send-otp",
    verifyOtp: "auth/verify-otp"
}