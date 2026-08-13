import React from "react";
import { StyleSheet } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

const AnimatedScreen = () => {
    const translateX = useSharedValue(0);

    const gesture = Gesture.Pan()
        .onUpdate((e) => {
            translateX.value = e.translationX;
        })
        .onEnd(() => {
            if (Math.abs(translateX.value) > 120) {
                translateX.value = withSpring(
                    translateX.value > 0 ? 500 : -500
                );
            } else {
                translateX.value = withSpring(0);
            }
        });

    const style = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    return (
        <GestureDetector gesture={gesture}>
            <Animated.View style={[styles.card, style]} />
        </GestureDetector>
    );
}

export default AnimatedScreen;

const styles = StyleSheet.create({
    card: {
        width: 300,
        height: 400,
        backgroundColor: "tomato",
        borderRadius: 20,
    },
});