import React, { useRef, useState, useEffect } from 'react';
import { View, Button, Image, Text, ScrollView, Platform } from 'react-native';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import { createMMKV } from 'react-native-mmkv';
import Geolocation from 'react-native-geolocation-service';

const DigitalSignature = () => {
    const ref = useRef<SignatureViewRef>(null);
    const [signature, setSignature] = useState<string | null>(null);
    const [attendanceType, setAttendanceType] = useState<'login' | 'logout' | null>(null);

    // Attendence report code
    useEffect(() => {
        if (Platform.OS === 'ios') {
            Geolocation.requestAuthorization('whenInUse');
        }
    }, []);

    const storage = createMMKV();

    const getLocation = () => {
        return new Promise((resolve, reject) => {
            Geolocation.getCurrentPosition(
                (position) => resolve(position.coords),
                (error) => reject(error),
                { enableHighAccuracy: true }
            );
        });
    };

    const markAttendance = async (type: 'login' | 'logout') => {
        console.log(`markAttendance called for: ${type}`);
        try {
            const location = await getLocation();
            const now = new Date().toLocaleTimeString('en-GB'); // "HH:mm:ss" format
            const today = new Date().toDateString();

            // 👉 Get existing data
            const attendanceData = storage.getString("attendance");
            const attendance: Record<string, any> = attendanceData ? JSON.parse(attendanceData) : {};

            if (!attendance[today]) {
                attendance[today] = {};
            }

            if (type === "login") {
                if (attendance[today].loginTime) {
                    console.log("Already checked in!");
                    return;
                }

                attendance[today].loginTime = now;
                attendance[today].loginLocation = location;
            }

            if (type === "logout") {
                if (!attendance[today].loginTime) {
                    console.log("Please login first!");
                    return;
                }

                if (attendance[today].logoutTime) {
                    console.log("Already checked out!");
                    return;
                }

                attendance[today].logoutTime = now;
                attendance[today].logoutLocation = location;
            }

            // 👉 Save data (SYNC)
            storage.set("attendance", JSON.stringify(attendance));

            console.log(`${type} success`, attendance[today]);
        } catch (error) {
            console.log("Error:", error);
        }
    };

    // Signature canvas code
    const handleOK = (sig: string) => {
        // Store the full base64 data URL in state — no truncation
        setSignature(sig);
        console.log("Signature Base64:", sig);
    };

    const handleClear = () => {
        ref.current?.clearSignature();
        setSignature(null); // Also clear the preview
    };
    const handleConfirm = () => {
        ref.current?.readSignature();
    };


    const webStyle = `
        .m-signature-pad--footer {
            display: flex;
            justify-content: center;
            align-items: center;
            border-top: none;
            box-shadow: none;
            margin-top: 20px;
        }
        .m-signature-pad--footer .description {
            color: #333;
            font-size: 18px;
            font-weight: 500;
        }
        body, html {
            background-color: transparent;
        }
    `;

    return (
        <ScrollView style={{ flex: 1, padding: 20, backgroundColor: '#f5f5f5' }}>
            {/* Signature Pad */}
            <View style={{
                height: 350,
                backgroundColor: '#fff',
                borderRadius: 10,
                overflow: 'hidden',
                marginBottom: 20,
                elevation: 3,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4
            }}>
                <SignatureScreen
                    ref={ref}
                    onOK={handleOK}
                    descriptionText="Sign here"
                    clearText="Clear"
                    confirmText="Save"
                    webStyle={webStyle}
                    // ✅ Android-specific
                    androidHardwareAccelerationDisabled={true}

                    // // ✅ iOS-specific props
                    // scrollEnabled={false}        // Prevents WebView internal scroll interfering with drawing
                    // bounces={false}              // Disables iOS rubber-band/bounce effect while signing
                    // automaticallyAdjustContentInsets={false}  // Prevents iOS auto-resizing the WebView content                    minWidth={2}
                    bgHeight={350}
                />
            </View>


            {/* Buttons */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 30 }}>
                <View style={{ width: '45%' }}>
                    <Button title="Clear Signature" onPress={handleClear} color="#FF6B6B" />
                </View>
                <View style={{ width: '45%' }}>
                    <Button title="Confirm" onPress={handleConfirm} color="#4ECDC4" />
                </View>
            </View>


            {/* Signature Preview — renders directly from the full base64 string */}
            {signature && (
                <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 15, elevation: 2 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 10, color: '#333' }}>
                        Captured Signature:
                    </Text>
                    <Image
                        source={{ uri: signature }}
                        style={{ width: '100%', height: 200, resizeMode: 'contain', borderWidth: 1, borderColor: '#ddd', borderRadius: 6 }}
                    />
                </View>
            )}

            <View style={{ padding: 20 }}>
                <Button title="Check In" onPress={() => markAttendance("login")} />
                <Button title="Check Out" onPress={() => markAttendance("logout")} />
            </View>
        </ScrollView>
    );
};

export default DigitalSignature;