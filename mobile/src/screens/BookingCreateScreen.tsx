import React, {
  useState,
} from "react";

import DateTimePicker from "@react-native-community/datetimepicker";

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Sparkles,
} from "lucide-react-native";

import {
  endpoints,
  errMsg,
  unwrap,
} from "../api";

import { OMIQORA } from "../theme";

const C = OMIQORA.colors;

type Props = {
  service: any;
  onBack: () => void;
  onCreated: (
    bookingId: string,
  ) => void;
};

export function BookingCreateScreen({
  service,
  onBack,
  onCreated,
}: Props) {
  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [
    eventLocation,
    setEventLocation,
  ] = useState("");

  const [
    eventDetails,
    setEventDetails,
  ] = useState("");

  const [
    busy,
    setBusy,
  ] = useState(false);

  const serviceId = String(
    service?._id ??
      service?.id ??
      "",
  );

  const amount = Number(
    service?.basePrice ??
      service?.price ??
      0,
  );

  const submit = async () => {
    if (!serviceId) {
      Alert.alert(
        "Booking",
        "Service is missing.",
      );

      return;
    }

    if (!eventDate || eventDate.getTime() < new Date().setHours(0,0,0,0)) {
      Alert.alert("Event date", "Choose today or a future date.");
      return;
    }

    if (!eventLocation.trim()) {
      Alert.alert(
        "Location",
        "Enter the event location.",
      );

      return;
    }

    setBusy(true);

    try {
      const response =
        await endpoints.createBooking({
          serviceId,

          eventDate: eventDate.toISOString(),

          eventLocation:
            eventLocation.trim(),

          eventDetails:
            eventDetails.trim(),

        });

      const booking: any =
        unwrap(response);

      const bookingId = String(
        booking?._id ??
          booking?.id ??
          "",
      );

      if (!bookingId) {
        throw new Error(
          "Booking created but booking id was not returned.",
        );
      }

      onCreated(bookingId);
    } catch (error) {
      Alert.alert(
        "Unable to create booking",
        errMsg(error),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          style={styles.icon}
        >
          <ArrowLeft
            size={20}
            color={C.gold}
          />
        </Pressable>

        <Text style={styles.title}>
          Create booking
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={
          styles.content
        }
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Sparkles
            size={20}
            color={C.gold}
          />

          <Text style={styles.service}>
            {service?.name ??
              "Selected service"}
          </Text>

          <Text style={styles.price}>
            {amount
              ? `₹${amount.toLocaleString(
                  "en-IN",
                )}`
              : "Price on request"}
          </Text>
        </View>

        <Text style={styles.label}>
          EVENT DATE
        </Text>

        <View style={styles.field}>
          <CalendarDays
            size={18}
            color={C.muted}
          />

          <Pressable style={{flex:1}} onPress={() => setShowDatePicker(true)}>
            <Text style={[styles.input,{paddingTop:15,color:eventDate?C.white:C.mutedSoft}]}>
              {eventDate ? eventDate.toLocaleDateString("en-IN") : "Choose event date"}
            </Text>
          </Pressable>
        </View>

        {showDatePicker ? (
          <DateTimePicker
            value={eventDate ?? new Date()}
            mode="date"
            minimumDate={new Date()}
            onChange={(_, selected) => {
              setShowDatePicker(false);
              if (selected) setEventDate(selected);
            }}
          />
        ) : null}

        <Text style={styles.label}>
          EVENT LOCATION
        </Text>

        <View style={styles.field}>
          <MapPin
            size={18}
            color={C.muted}
          />

          <TextInput
            value={eventLocation}
            onChangeText={
              setEventLocation
            }
            placeholder="Venue or area"
            placeholderTextColor={
              C.mutedSoft
            }
            style={styles.input}
          />
        </View>

        <Text style={styles.label}>
          DETAILS
        </Text>

        <TextInput
          value={eventDetails}
          onChangeText={
            setEventDetails
          }
          placeholder="Tell the vendor what you need..."
          placeholderTextColor={
            C.mutedSoft
          }
          style={[
            styles.field,
            styles.multi,
          ]}
          multiline
        />

        <Pressable
          onPress={submit}
          disabled={busy}
          style={styles.cta}
        >
          {busy ? (
            <ActivityIndicator
              color={C.midnight}
            />
          ) : (
            <Text
              style={styles.ctaText}
            >
              Request booking
            </Text>
          )}
        </Pressable>

        <Text style={styles.note}>
          Your request is sent to the
          real OMIQORA booking API.
          No demo booking is created.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: C.midnight,
  },

  header: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },

  icon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.royalNavy,
    borderWidth: 1,
    borderColor: C.border,
  },

  title: {
    color: C.white,
    fontSize: 20,
    fontWeight: "900",
    marginLeft: 14,
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  hero: {
    backgroundColor: C.royalNavy,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.borderStrong,
    padding: 20,
  },

  service: {
    color: C.white,
    fontSize: 21,
    fontWeight: "900",
    marginTop: 12,
  },

  price: {
    color: C.goldLight,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 8,
  },

  label: {
    color: C.gold,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.8,
    marginTop: 22,
    marginBottom: 9,
  },

  field: {
    minHeight: 56,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.input,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  input: {
    flex: 1,
    color: C.text,
    fontSize: 13,
    marginLeft: 10,
  },

  multi: {
    height: 120,
    color: C.text,
    paddingTop: 16,
    textAlignVertical: "top",
  },

  cta: {
    height: 56,
    borderRadius: 18,
    backgroundColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 26,
  },

  ctaText: {
    color: C.midnight,
    fontSize: 13,
    fontWeight: "900",
  },

  note: {
    color: C.muted,
    fontSize: 10,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 13,
  },
});
