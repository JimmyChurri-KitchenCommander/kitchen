import { Feather } from "@expo/vector-icons";
import { useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export default function SignInScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async () => {
    if (!isLoaded || !email || !password) return;
    setLoading(true);
    setError("");
    try {
      const result = await signIn.create({
        identifier: email.trim().toLowerCase(),
        password,
      });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)");
      } else {
        setError("Sign in could not be completed. Try again.");
      }
    } catch (err: any) {
      const msg =
        err?.errors?.[0]?.message ??
        "Invalid email or password. Try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: topPad + 40, paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo area */}
        <View style={styles.logoArea}>
          <View
            style={[styles.logoIcon, { backgroundColor: colors.primary }]}
          >
            <Feather name="activity" size={36} color="#fff" />
          </View>
          <Text style={[styles.appName, { color: colors.foreground }]}>
            Kitchen Command
          </Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
            Don't just run a kitchen. Command it.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              EMAIL
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.foreground,
                  backgroundColor: colors.card,
                  borderColor: error ? colors.destructive : colors.border,
                },
              ]}
              value={email}
              onChangeText={setEmail}
              placeholder="chef@kitchen.com"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              PASSWORD
            </Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={[
                  styles.input,
                  {
                    flex: 1,
                    color: colors.foreground,
                    backgroundColor: colors.card,
                    borderColor: error ? colors.destructive : colors.border,
                  },
                ]}
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry={!showPassword}
                returnKeyType="go"
                onSubmitEditing={handleSignIn}
              />
              <Pressable
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={8}
              >
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={18}
                  color={colors.mutedForeground}
                />
              </Pressable>
            </View>
          </View>

          {error ? (
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {error}
            </Text>
          ) : null}

          <Pressable
            style={[
              styles.signInBtn,
              {
                backgroundColor: loading
                  ? colors.primary + "80"
                  : colors.primary,
              },
            ]}
            onPress={handleSignIn}
            disabled={loading}
          >
            <Text
              style={[styles.signInBtnText, { color: colors.primaryForeground }]}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Text>
          </Pressable>
        </View>

        <Text style={[styles.footer, { color: colors.mutedForeground }]}>
          Sign in with your Kitchen Command account.{"\n"}
          Contact your manager for access.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 28,
    gap: 32,
  },
  logoArea: {
    alignItems: "center",
    gap: 12,
  },
  logoIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  passwordWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
  },
  eyeBtn: {
    position: "absolute",
    right: 14,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  signInBtn: {
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
  },
  signInBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  footer: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});
