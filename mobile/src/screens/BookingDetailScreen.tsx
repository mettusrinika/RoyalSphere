import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  MapPin,
  RefreshCw,
  XCircle,
  Star,
} from "lucide-react-native";

import {
  endpoints,
  errMsg,
  unwrap,
} from "../api";

import { OMIQORA } from "../theme";

const C = OMIQORA.colors;

type Props = {
  bookingId: string;
  onBack: () => void;
  onPayments: () => void;
  onReview: (bookingId: string) => void;
};

export function BookingDetailScreen({
  bookingId,
  onBack,
  onPayments,
  onReview,
}: Props) {
  const [
    booking,
    setBooking,
  ] = useState<any>(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    paying,
    setPaying,
  ] = useState(false);

  const load = useCallback(
    async () => {
      setLoading(true);

      try {
        const response =
          await endpoints.booking(
            bookingId,
          );

        setBooking(
          unwrap(response),
        );
      } catch (error) {
        Alert.alert(
          "Booking",
          errMsg(error),
        );
      } finally {
        setLoading(false);
      }
    },
    [bookingId],
  );

  useEffect(() => {
    load();
  }, [load]);

  const cancelBooking = () => {
    Alert.alert(
      "Cancel booking",
      "Are you sure you want to cancel this booking?",
      [
        {
          text: "Keep booking",
          style: "cancel",
        },
        {
          text: "Cancel booking",
          style: "destructive",
          onPress: async () => {
            try {

              await endpoints.cancelBooking(
                bookingId,
                "Cancelled by customer",
              );

              await load();
            } catch (error) {
              Alert.alert(
                "Unable to cancel",
                errMsg(error),
              );
            } finally {
            }
          },
        },
      ],
    );
  };
  const createPaymentOrder =
    async () => {
      setPaying(true);

      try {
        const response =
          await endpoints.createPaymentOrder(
            bookingId,
          );

        const order: any =
          unwrap(response);

        Alert.alert(
          "Payment order created",
          `Order ${order.orderId} is ready.

The real Razorpay order was created by your backend.

Fake payment success is not used.`,
        );
      } catch (error) {
        Alert.alert(
          "Unable to create payment order",
          errMsg(error),
        );
      } finally {
        setPaying(false);
      }
    };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          color={C.gold}
        />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>
          Booking unavailable.
        </Text>

        <Pressable onPress={onBack}>
          <Text style={styles.link}>
            Go back
          </Text>
        </Pressable>
      </View>
    );
  }

  const status = String(
    booking.status ?? "pending",
  );

  const canCancel =
    ![
      "completed",
      "cancelled",
      "refunded",
    ].includes(status);

  const paid =
    booking.paymentStatus === "paid";

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
          Booking detail
        </Text>

        <Pressable
          onPress={load}
          style={styles.icon}
        >
          <RefreshCw
            size={18}
            color={C.gold}
          />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={
          styles.content
        }
      >
        <View style={styles.hero}>
          <Text style={styles.eye}>
            BOOKING
          </Text>

          <Text style={styles.name}>
            {booking?.serviceId?.name ??
              "OMIQORA service"}
          </Text>

          <Text style={styles.number}>
            {booking.bookingNumber}
          </Text>

          <Text style={styles.status}>
            {status
              .replaceAll("_", " ")
              .toUpperCase()}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.line}>
            <CalendarDays
              size={18}
              color={C.gold}
            />

            <Text style={styles.value}>
              {booking.eventDate
                ? new Date(
                    booking.eventDate,
                  ).toLocaleString(
                    "en-IN",
                  )
                : "-"}
            </Text>
          </View>

          <View style={styles.line}>
            <MapPin
              size={18}
              color={C.gold}
            />

            <Text style={styles.value}>
              {booking.eventLocation ??
                "-"}
            </Text>
          </View>

          <View style={styles.line}>
            <CreditCard
              size={18}
              color={C.gold}
            />

            <Text style={styles.value}>
              ₹
              {Number(
                booking.amount ?? 0,
              ).toLocaleString(
                "en-IN",
              )}
              {" · "}
              {String(
                booking.paymentStatus ??
                  "pending",
              ).toUpperCase()}
            </Text>
          </View>
        </View>

        {!!booking.eventDetails && (
          <View style={styles.card}>
            <Text style={styles.label}>
              REQUEST DETAILS
            </Text>

            <Text style={styles.details}>
              {booking.eventDetails}
            </Text>
          </View>
        )}

        {!paid && (
          <Pressable
            style={styles.pay}
            onPress={
              createPaymentOrder
            }
            disabled={paying}
          >
            {paying ? (
              <ActivityIndicator
                color={C.midnight}
              />
            ) : (
              <Text
                style={styles.payText}
              >
                Create secure payment
                order
              </Text>
            )}
          </Pressable>
        )}

        {status === "completed" && (
          <Pressable style={styles.secondary} onPress={() => onReview(bookingId)}>
            <Star size={17} color={C.gold} />
            <Text style={styles.secondaryText}>Review this service</Text>
          </Pressable>
        )}

        <Pressable
          style={styles.secondary}
          onPress={onPayments}
        >
          <CreditCard
            size={17}
            color={C.gold}
          />

          <Text
            style={styles.secondaryText}
          >
            Payment history
          </Text>
        </Pressable>

        {canCancel && (
          <Pressable
            style={styles.cancel}
            onPress={cancelBooking}
          >
            <XCircle
              size={17}
              color={C.danger}
            />

            <Text
              style={styles.cancelText}
            >
              Cancel booking
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: C.midnight,
  },

  center: {
    flex: 1,
    backgroundColor: C.midnight,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  header: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    fontSize: 19,
    fontWeight: "900",
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

  eye: {
    color: C.gold,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 2,
  },

  name: {
    color: C.white,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 9,
  },

  number: {
    color: C.muted,
    fontSize: 10,
    marginTop: 7,
  },

  status: {
    color: C.goldLight,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginTop: 16,
  },

  card: {
    backgroundColor: C.royalNavy,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 17,
    marginTop: 14,
  },

  line: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 7,
  },

  value: {
    color: C.text,
    fontSize: 12,
    flex: 1,
  },

  label: {
    color: C.gold,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  details: {
    color: C.text,
    fontSize: 12,
    lineHeight: 20,
    marginTop: 10,
  },

  pay: {
    height: 56,
    borderRadius: 18,
    backgroundColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },

  payText: {
    color: C.midnight,
    fontWeight: "900",
    fontSize: 12,
  },

  secondary: {
    height: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.borderStrong,
    backgroundColor: C.royalNavy,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 12,
  },

  secondaryText: {
    color: C.goldLight,
    fontSize: 12,
    fontWeight: "900",
  },

  cancel: {
    height: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.dangerBorder,
    backgroundColor: C.royalNavy,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 12,
  },

  cancelText: {
    color: C.danger,
    fontSize: 12,
    fontWeight: "900",
  },

  muted: {
    color: C.muted,
  },

  link: {
    color: C.gold,
    fontWeight: "900",
  },
});



