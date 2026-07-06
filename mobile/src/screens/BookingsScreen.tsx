import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  CalendarDays,
  ChevronRight,
  MapPin,
  ReceiptText,
} from "lucide-react-native";

import {
  endpoints,
  errMsg,
  listOf,
} from "../api";

import { OMIQORA } from "../theme";

const C = OMIQORA.colors;

type Props = {
  onOpen: (id: string) => void;
};

export function BookingsScreen({
  onOpen,
}: Props) {
  const [
    items,
    setItems,
  ] = useState<any[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const load = useCallback(
    async () => {
      setError("");

      try {
        const response =
          await endpoints.bookings();

        setItems(
          listOf(response),
        );
      } catch (requestError) {
        setError(
          errMsg(requestError),
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          color={C.gold}
        />

        <Text style={styles.muted}>
          Loading your bookings...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={
        styles.content
      }
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={() => {
            setLoading(true);
            load();
          }}
          tintColor={C.gold}
        />
      }
    >
      <Text style={styles.eye}>
        YOUR OMIQORA
      </Text>

      <Text style={styles.title}>
        Bookings
      </Text>

      <Text style={styles.lead}>
        Every service journey, in one
        place.
      </Text>

      {!!error && (
        <Text style={styles.error}>
          {error}
        </Text>
      )}

      {!items.length && !error ? (
        <View style={styles.empty}>
          <ReceiptText
            size={30}
            color={C.gold}
          />

          <Text
            style={styles.emptyTitle}
          >
            No bookings yet
          </Text>

          <Text style={styles.muted}>
            Book a live service from
            Explore and it will appear
            here.
          </Text>
        </View>
      ) : (
        items.map((booking) => {
          const id = String(
            booking._id ??
              booking.id,
          );

          return (
            <Pressable
              key={id}
              style={styles.card}
              onPress={() =>
                onOpen(id)
              }
            >
              <View style={styles.row}>
                <Text
                  style={styles.name}
                >
                  {booking?.serviceId
                    ?.name ??
                    "OMIQORA service"}
                </Text>

                <Text
                  style={styles.status}
                >
                  {String(
                    booking.status ??
                      "pending",
                  )
                    .replaceAll("_", " ")
                    .toUpperCase()}
                </Text>
              </View>

              <Text
                style={styles.number}
              >
                {booking.bookingNumber ??
                  ""}
              </Text>

              <View style={styles.meta}>
                <CalendarDays
                  size={15}
                  color={C.gold}
                />

                <Text
                  style={styles.metaText}
                >
                  {booking.eventDate
                    ? new Date(
                        booking.eventDate,
                      ).toLocaleDateString(
                        "en-IN",
                      )
                    : "Date unavailable"}
                </Text>
              </View>

              <View style={styles.meta}>
                <MapPin
                  size={15}
                  color={C.gold}
                />

                <Text
                  style={styles.metaText}
                >
                  {booking.eventLocation ??
                    "Location unavailable"}
                </Text>

                <ChevronRight
                  size={18}
                  color={C.muted}
                />
              </View>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: C.midnight,
  },

  content: {
    padding: 20,
    paddingBottom: 35,
  },

  center: {
    flex: 1,
    backgroundColor: C.midnight,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  eye: {
    color: C.gold,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 2,
  },

  title: {
    color: C.white,
    fontSize: 28,
    fontWeight: "900",
    marginTop: 7,
  },

  lead: {
    color: C.muted,
    fontSize: 12,
    marginTop: 7,
    marginBottom: 20,
  },

  card: {
    backgroundColor: C.royalNavy,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    padding: 17,
    marginBottom: 13,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },

  name: {
    color: C.white,
    fontSize: 16,
    fontWeight: "900",
    flex: 1,
  },

  status: {
    color: C.goldLight,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  number: {
    color: C.muted,
    fontSize: 10,
    marginTop: 7,
  },

  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginTop: 14,
  },

  metaText: {
    color: C.text,
    fontSize: 11,
    flex: 1,
  },

  empty: {
    alignItems: "center",
    backgroundColor: C.royalNavy,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    padding: 28,
    marginTop: 20,
  },

  emptyTitle: {
    color: C.white,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 14,
    marginBottom: 8,
  },

  muted: {
    color: C.muted,
    fontSize: 11,
    lineHeight: 18,
    textAlign: "center",
  },

  error: {
    color: C.danger,
    fontSize: 11,
    marginBottom: 14,
  },
});
