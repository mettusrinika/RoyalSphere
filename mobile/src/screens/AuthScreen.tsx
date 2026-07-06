import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  Sparkles,
  UserRound,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiError } from "../services/api";
import { useSession } from "../stores/session";
import { OMIQORA } from "../theme";

const C = OMIQORA.colors;

type FieldProps = {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address" | "phone-pad";
};

export function AuthScreen() {
  const [registerMode, setRegisterMode] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { login, register, loading } = useSession();

  const submit = async () => {
    if (!email.trim() || !password) {
      return Alert.alert(
        "Missing details",
        "Enter your email and password."
      );
    }

    if (
      registerMode &&
      (firstName.trim().length < 2 || lastName.trim().length < 2)
    ) {
      return Alert.alert(
        "Check your name",
        "First and last name need at least 2 characters."
      );
    }

    if (
      registerMode &&
      (
        password.length < 8 ||
        !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)
      )
    ) {
      return Alert.alert(
        "Password requirements",
        "Use 8+ characters with uppercase, lowercase and a number."
      );
    }

    try {
      if (registerMode) {
        const result = await register({
          firstName,
          lastName,
          email,
          password,
          phone,
        });

        Alert.alert(
          "Verify your email",
          result.message,
          [
            {
              text: "Go to sign in",
              onPress: () => {
                setRegisterMode(false);
                setPassword("");
              },
            },
          ]
        );
      } else {
        await login(email, password);
      }
    } catch (error) {
      Alert.alert(
        registerMode ? "Registration failed" : "Sign in failed",
        apiError(error)
      );
    }
  };

  const Field = ({
    icon,
    ...props
  }: FieldProps) => (
    <View style={styles.field}>
      {icon}
      <TextInput
        style={styles.input}
        placeholderTextColor={C.mutedSoft}
        {...props}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={[
          C.midnight,
          C.midnightSoft,
          C.deepNavy,
          C.midnight,
        ]}
        locations={[0, 0.32, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.orbitGlow} />
      <View style={styles.goldGlow} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sparkleOne}>
            <Sparkles size={17} color={C.goldLight} />
          </View>

          <View style={styles.sparkleTwo}>
            <Text style={styles.sparkleDot}>✦</Text>
          </View>

          <View style={styles.hero}>
            <View style={styles.logoHalo}>
              <Image
                source={require("../../assets/omiqora-icon.png")}
                style={styles.logo}
                contentFit="contain"
                transition={250}
              />
            </View>

            <Text style={styles.brand}>OMIQORA</Text>

            <View style={styles.tagRow}>
              <View style={styles.tagLine} />
              <Text style={styles.tag}>
                ONE PLATFORM · INFINITE POSSIBILITIES
              </Text>
              <View style={styles.tagLine} />
            </View>
          </View>

          <View style={styles.cardBorder}>
            <LinearGradient
              colors={[
                "rgba(11,33,75,0.96)",
                "rgba(6,18,46,0.97)",
                "rgba(3,8,27,0.98)",
              ]}
              style={styles.card}
            >
              <View style={styles.cardAccent} />

              <Text style={styles.eyebrow}>
                {registerMode ? "BEGIN YOUR JOURNEY" : "WELCOME TO OMIQORA"}
              </Text>

              <Text style={styles.title}>
                {registerMode
                  ? "Create your account"
                  : "Welcome back"}
              </Text>

              <Text style={styles.sub}>
                {registerMode
                  ? "Enter a connected ecosystem of trusted services and intelligent experiences."
                  : "Your world of trusted services, thoughtfully connected in one place."}
              </Text>

              {registerMode && (
                <>
                  <Field
                    icon={
                      <UserRound size={18} color={C.goldLight} />
                    }
                    placeholder="First name"
                    value={firstName}
                    onChangeText={setFirstName}
                  />

                  <Field
                    icon={
                      <UserRound size={18} color={C.goldLight} />
                    }
                    placeholder="Last name"
                    value={lastName}
                    onChangeText={setLastName}
                  />
                </>
              )}

              <Field
                icon={<Mail size={18} color={C.goldLight} />}
                placeholder="Email address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              {registerMode && (
                <Field
                  icon={<Phone size={18} color={C.goldLight} />}
                  placeholder="Phone (optional)"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              )}

              <View style={styles.field}>
                <LockKeyhole size={18} color={C.goldLight} />

                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={C.mutedSoft}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />

                <Pressable
                  hitSlop={12}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={19} color={C.muted} />
                  ) : (
                    <Eye size={19} color={C.muted} />
                  )}
                </Pressable>
              </View>

              {registerMode && (
                <Text style={styles.hint}>
                  8+ characters · uppercase · lowercase · number
                </Text>
              )}

              <Pressable
                onPress={submit}
                disabled={loading}
                style={({ pressed }) => [
                  styles.buttonWrap,
                  pressed && styles.buttonPressed,
                ]}
              >
                <LinearGradient
                  colors={[
                    C.goldDark,
                    C.gold,
                    C.goldLight,
                    C.royalGold,
                  ]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.button}
                >
                  {loading ? (
                    <ActivityIndicator color={C.midnight} />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>
                        {registerMode
                          ? "Create account"
                          : "Sign in"}
                      </Text>
                      <Text style={styles.buttonSpark}>✦</Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>

              <Pressable
                style={styles.switch}
                onPress={() => {
                  setRegisterMode(!registerMode);
                  setPassword("");
                }}
              >
                <Text style={styles.switchText}>
                  {registerMode
                    ? "Already part of OMIQORA? "
                    : "New to OMIQORA? "}
                  <Text style={styles.switchGold}>
                    {registerMode
                      ? "Sign in"
                      : "Create account"}
                  </Text>
                </Text>
              </Pressable>
            </LinearGradient>
          </View>

          <Text style={styles.footerText}>
            TRUSTED SERVICES · INTELLIGENTLY CONNECTED
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  safe: {
    flex: 1,
    backgroundColor: C.midnight,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 30,
    justifyContent: "center",
  },

  orbitGlow: {
    position: "absolute",
    width: 310,
    height: 310,
    borderRadius: 155,
    borderWidth: 1,
    borderColor: "rgba(228,187,59,0.08)",
    top: -145,
    right: -120,
  },

  goldGlow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(212,169,30,0.045)",
    top: 90,
    left: -95,
  },

  sparkleOne: {
    position: "absolute",
    top: 72,
    right: 31,
    opacity: 0.9,
  },

  sparkleTwo: {
    position: "absolute",
    top: 175,
    left: 35,
  },

  sparkleDot: {
    color: C.gold,
    fontSize: 10,
  },

  hero: {
    alignItems: "center",
    marginBottom: 22,
  },

  logoHalo: {
    width: 126,
    height: 126,
    borderRadius: 63,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    backgroundColor: "rgba(228,187,59,0.025)",
    shadowColor: C.gold,
    shadowOpacity: 0.32,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    elevation: 10,
  },

  logo: {
    width: 118,
    height: 118,
  },

  brand: {
    color: C.goldLight,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 5.5,
    marginTop: 1,
  },

  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  tagLine: {
    width: 18,
    height: 1,
    backgroundColor: C.goldDark,
    opacity: 0.7,
  },

  tag: {
    color: C.muted,
    marginHorizontal: 8,
    fontSize: 8.5,
    fontWeight: "600",
    letterSpacing: 0.7,
  },

  cardBorder: {
    borderRadius: 29,
    padding: 1,
    backgroundColor: C.borderStrong,
    shadowColor: C.gold,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 8,
  },

  card: {
    borderRadius: 28,
    padding: 22,
    overflow: "hidden",
  },

  cardAccent: {
    position: "absolute",
    top: 0,
    left: 42,
    right: 42,
    height: 1,
    backgroundColor: C.goldLight,
    opacity: 0.65,
  },

  eyebrow: {
    color: C.gold,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.8,
    marginBottom: 9,
  },

  title: {
    color: C.white,
    fontSize: 25,
    fontWeight: "800",
    letterSpacing: -0.5,
  },

  sub: {
    color: C.muted,
    fontSize: 13.5,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 21,
  },

  field: {
    minHeight: 56,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.input,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 12,
  },

  input: {
    flex: 1,
    color: C.text,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },

  hint: {
    color: C.mutedSoft,
    fontSize: 11.5,
    marginTop: -3,
    marginBottom: 13,
  },

  buttonWrap: {
    borderRadius: 17,
    marginTop: 6,
    shadowColor: C.gold,
    shadowOpacity: 0.34,
    shadowRadius: 13,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 8,
  },

  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.992 }],
  },

  button: {
    height: 56,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  buttonText: {
    color: C.midnight,
    fontSize: 15.5,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  buttonSpark: {
    color: C.midnight,
    fontSize: 11,
    marginLeft: 8,
  },

  switch: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 1,
  },

  switchText: {
    color: C.muted,
    fontSize: 13,
  },

  switchGold: {
    color: C.goldLight,
    fontWeight: "800",
  },

  footerText: {
    color: C.mutedSoft,
    textAlign: "center",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.3,
    marginTop: 20,
  },
});
