import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAppContext } from "../src/context/AppContext";
import { palette } from "../src/theme/colors";

const slides = [
  {
    title: "Welcome to Chintana",
    description:
      "Capture thoughts quickly and convert them into measurable mental clarity.",
  },
  {
    title: "AI Analysis You Can Trust",
    description:
      "Each thought is classified with score, energy impact, and a practical next suggestion.",
  },
  {
    title: "Stay Consistent",
    description:
      "Set revisit reminders and track your weekly stability trend across devices.",
  },
];

export default function OnboardingScreen() {
  const { completeOnboarding } = useAppContext();
  const [index, setIndex] = useState(0);

  const next = async () => {
    if (index < slides.length - 1) {
      setIndex((current) => current + 1);
      return;
    }

    await completeOnboarding();
    router.replace("/(app)/dashboard");
  };

  const current = slides[index];

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.badge}>Onboarding</Text>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.description}>{current.description}</Text>

        <View style={styles.dots}>
          {slides.map((_, dotIndex) => (
            <View
              key={dotIndex}
              style={[styles.dot, dotIndex === index && styles.dotActive]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={next}>
          <Text style={styles.buttonLabel}>
            {index === slides.length - 1 ? "Get Started" : "Continue"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: palette.slate50,
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.slate200,
    borderRadius: 24,
    padding: 24,
    gap: 14,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#DBEAFE",
    color: palette.blue,
    fontWeight: "700",
    fontSize: 12,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    color: palette.slate900,
    fontWeight: "800",
  },
  description: {
    color: palette.slate500,
    fontSize: 15,
    lineHeight: 22,
  },
  dots: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: palette.slate200,
  },
  dotActive: {
    backgroundColor: palette.blue,
    width: 20,
  },
  button: {
    marginTop: 8,
    backgroundColor: palette.blue,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonLabel: {
    color: palette.white,
    fontWeight: "700",
    fontSize: 15,
  },
});
