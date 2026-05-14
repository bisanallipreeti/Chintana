import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LoadingState } from "../../src/components/LoadingState";
import { useAppContext } from "../../src/context/AppContext";
import { palette } from "../../src/theme/colors";

export default function AppTabsLayout() {
  const { isBootstrapping, isAuthenticated, biometricLocked, unlockWithBiometric } = useAppContext();

  if (isBootstrapping) {
    return <LoadingState label="Preparing your workspace..." />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/" />;
  }

  if (biometricLocked) {
    return (
      <View style={styles.lockedScreen}>
        <Text style={styles.lockedTitle}>Biometric Unlock Required</Text>
        <Text style={styles.lockedSubtitle}>Authenticate to continue using Chintana.</Text>
        <TouchableOpacity
          style={styles.unlockButton}
          onPress={() => {
            void unlockWithBiometric();
          }}
        >
          <Text style={styles.unlockButtonText}>Unlock Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.blue,
        tabBarInactiveTintColor: palette.slate500,
        tabBarStyle: {
          borderTopColor: palette.slate200,
          backgroundColor: palette.white,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="add-thought"
        options={{
          title: "Add",
          tabBarIcon: ({ color, size }) => <Ionicons name="add-circle-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  lockedScreen: {
    flex: 1,
    backgroundColor: palette.slate50,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 10,
  },
  lockedTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: palette.slate900,
    textAlign: "center",
  },
  lockedSubtitle: {
    color: palette.slate500,
    textAlign: "center",
  },
  unlockButton: {
    marginTop: 8,
    backgroundColor: palette.blue,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  unlockButtonText: {
    color: palette.white,
    fontWeight: "700",
  },
});
