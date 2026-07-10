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
  ArrowLeft,
  CreditCard,
  ReceiptText,
} from "lucide-react-native";

import {
  endpoints,
  errMsg,
  listOf,
} from "../api";

import { OMIQORA } from "../theme";

const C = OMIQORA.colors;

export function PaymentsScreen({
  onBack,onOpen,
}: {
  onBack: () => void; onOpen:(id:string)=>void;
}) {
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
          await endpoints.payments();

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
          Payments
        </Text>

        <View style={styles.icon} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator
            color={C.gold}
          />
        </View>
      ) : (
        <ScrollView
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
            TRANSACTIONS
          </Text>

          <Text style={styles.head}>
            Payments & transactions
          </Text>

          <Text style={styles.lead}>
            Open any transaction for its booking, date, time, references and payout breakdown.
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
                style={
                  styles.emptyTitle
                }
              >
                No payments yet
              </Text>

              <Text
                style={styles.muted}
              >
                Successful and pending
                payment records will
                appear here.
              </Text>
            </View>
          ) : (
            items.map((payment) => (
              <Pressable
                style={styles.card}
                onPress={()=>onOpen(String(payment._id??payment.id))}
                key={String(
                  payment._id ??
                    payment.id,
                )}
              >
                <View style={styles.row}>
                  <View
                    style={styles.payIcon}
                  >
                    <CreditCard
                      size={18}
                      color={C.gold}
                    />
                  </View>

                  <View
                    style={styles.copy}
                  >
                    <Text
                      style={styles.amount}
                    >
                      ₹
                      {Number(
                        payment.amount ??
                          0,
                      ).toLocaleString(
                        "en-IN",
                      )}
                    </Text>

                    <Text
                      style={
                        styles.booking
                      }
                    >
                      {payment?.bookingId
                        ?.bookingNumber ??
                        "OMIQORA payment"}
                    </Text>
                  </View>

                  <Text
                    style={styles.status}
                  >
                    {String(
                      payment.status ??
                        "pending",
                    ).toUpperCase()}
                  </Text>
                </View>

                <Text
                  style={styles.date}
                >
                  {payment.createdAt
                    ? new Date(
                        payment.createdAt,
                      ).toLocaleString(
                        "en-IN",
                      )
                    : ""}
                </Text>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
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

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  eye: {
    color: C.gold,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 2,
  },

  head: {
    color: C.white,
    fontSize: 27,
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
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 17,
    marginBottom: 12,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  payIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: C.elevatedNavy,
    alignItems: "center",
    justifyContent: "center",
  },

  copy: {
    flex: 1,
    marginLeft: 12,
  },

  amount: {
    color: C.white,
    fontSize: 16,
    fontWeight: "900",
  },

  booking: {
    color: C.muted,
    fontSize: 10,
    marginTop: 4,
  },

  status: {
    color: C.goldLight,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  date: {
    color: C.mutedSoft,
    fontSize: 9,
    marginTop: 12,
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
