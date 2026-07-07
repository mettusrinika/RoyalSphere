import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Bookmark,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ImageIcon,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react-native";
import { OMIQORA } from "../theme";
import {
  endpoints,
  errMsg,
  unwrap,
  listOf,
} from "../api";
import { Service } from "../types";

const C = OMIQORA.colors;

type Props = {
  serviceId: string;
  onBack: () => void;
  onBook: (service: any) => void;
};

const money = (value?: number) =>
  `\u20B9${Number(value ?? 0).toLocaleString("en-IN")}`;

const priceType = (value?: string) => {
  switch (value) {
    case "per_hour":
      return "per hour";
    case "per_day":
      return "per day";
    case "per_event":
      return "per event";
    default:
      return "fixed price";
  }
};

export function ServiceDetailScreen({
serviceId,
  onBack,
  onBook,
}: Props) {
  const [service, setService] =
    useState<Service | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [response, savedResponse] = await Promise.all([
        endpoints.service(serviceId),
        endpoints.saved().catch(() => null),
      ]);

      setService(unwrap(response) as Service);
      setSaved(listOf(savedResponse).some((item:any) => String(item?._id ?? item?.id ?? "") === serviceId));
    } catch (error) {
      setError(errMsg(error));
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.fullState}>
        <ActivityIndicator
          size="large"
          color={C.gold}
        />

        <Text style={styles.stateTitle}>
          Opening service
        </Text>
      </View>
    );
  }

  if (error || !service) {
    return (
      <View style={styles.fullState}>
        <Text style={styles.stateTitle}>
          Service unavailable
        </Text>

        <Text style={styles.stateText}>
          {error || "Service not found"}
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={load}
        >
          <Text style={styles.primaryButtonText}>
            Try again
          </Text>
        </Pressable>

        <Pressable
          style={styles.backTextButton}
          onPress={onBack}
        >
          <Text style={styles.backText}>
            Back to discovery
          </Text>
        </Pressable>
      </View>
    );
  }

  const vendor =
    typeof service.vendorId === "object"
      ? service.vendorId
      : undefined;

  const category =
    typeof service.categoryId === "object"
      ? service.categoryId
      : undefined;

  const businessName =
    vendor?.vendorProfile?.businessName ??
    [vendor?.firstName, vendor?.lastName]
      .filter(Boolean)
      .join(" ") ??
    "OMIQORA Partner";

  const toggleSaved = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const response:any = unwrap(await endpoints.toggleSaved(serviceId));
      setSaved(Boolean(response?.saved));
    } catch (requestError) {
      setError(errMsg(requestError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.page}>
      <ScrollView
        contentContainerStyle={styles.content}
      >
        <View style={styles.media}>
          {service.images?.[0] ? (
            <Image
              source={{
                uri: service.images[0],
              }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.emptyMedia}>
              <View style={styles.emptyOrb}>
                <ImageIcon
                  size={30}
                  color={C.goldLight}
                />
              </View>

              <Text style={styles.emptyBrand}>
                OMIQORA
              </Text>

              <Text style={styles.emptyCopy}>
                Service image coming from the live
                provider listing
              </Text>
            </View>
          )}

          <Pressable
            style={styles.backButton}
            onPress={onBack}
          >
            <ArrowLeft
              size={21}
              color={C.white}
            />
          </Pressable>

          {service.featured ? (
            <View style={styles.featured}>
              <Sparkles
                size={13}
                color={C.midnight}
              />

              <Text style={styles.featuredText}>
                FEATURED
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <Pressable style={styles.saveButton} onPress={toggleSaved} disabled={saving}>
            <Bookmark size={17} color={saved ? C.midnight : C.goldLight} fill={saved ? C.midnight : "transparent"} />
            <Text style={[styles.saveButtonText,saved&&{color:C.midnight}]}>{saving ? "Saving..." : saved ? "Saved" : "Save service"}</Text>
          </Pressable>
          {category?.name ? (
            <Text style={styles.eyebrow}>
              {category.name.toUpperCase()}
            </Text>
          ) : null}

          <Text style={styles.title}>
            {service.name}
          </Text>

          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <Star
                size={16}
                color={C.goldLight}
                fill={C.goldLight}
              />

              <Text style={styles.metaStrong}>
                {Number(
                  service.rating ?? 0,
                ).toFixed(1)}
              </Text>

              <Text style={styles.metaSoft}>
                ({service.reviewCount ?? 0} reviews)
              </Text>
            </View>

            {service.location?.city ? (
              <View style={styles.metaItem}>
                <MapPin
                  size={15}
                  color={C.goldLight}
                />

                <Text style={styles.metaSoft}>
                  {service.location.city}
                  {service.location?.state
                    ? `, ${service.location.state}`
                    : ""}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.priceCard}>
            <View>
              <Text style={styles.priceLabel}>
                STARTING FROM
              </Text>

              <Text style={styles.price}>
                {money(service.basePrice)}
              </Text>

              <Text style={styles.priceType}>
                {priceType(service.priceType)}
              </Text>
            </View>

            <View style={styles.goldMark}>
              <Sparkles
                size={24}
                color={C.midnight}
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>
            About this service
          </Text>

          <Text style={styles.description}>
            {service.description ||
              "The provider has not added a service description yet."}
          </Text>

          <View style={styles.providerCard}>
            <View style={styles.providerIcon}>
              <BriefcaseBusiness
                size={22}
                color={C.goldLight}
              />
            </View>

            <View style={styles.providerInfo}>
              <Text style={styles.providerLabel}>
                OMIQORA PROVIDER
              </Text>

              <Text style={styles.providerName}>
                {businessName}
              </Text>

              {vendor?.vendorProfile
                ?.isVerified ? (
                <View style={styles.verified}>
                  <ShieldCheck
                    size={13}
                    color={C.goldLight}
                  />

                  <Text
                    style={styles.verifiedText}
                  >
                    Verified provider
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {service.tags?.length ? (
            <>
              <Text style={styles.sectionTitle}>
                Service highlights
              </Text>

              <View style={styles.tags}>
                {service.tags.map((tag) => (
                  <View
                    key={tag}
                    style={styles.tag}
                  >
                    <CheckCircle2
                      size={13}
                      color={C.goldLight}
                    />

                    <Text style={styles.tagText}>
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {service.availability ? (
            <>
              <Text style={styles.sectionTitle}>
                Availability
              </Text>

              <View style={styles.infoCard}>
                {service.availability
                  ?.workingDays?.length ? (
                  <View style={styles.infoRow}>
                    <CalendarDays
                      size={18}
                      color={C.goldLight}
                    />

                    <View style={styles.infoCopy}>
                      <Text
                        style={styles.infoLabel}
                      >
                        Working days
                      </Text>

                      <Text
                        style={styles.infoValue}
                      >
                        {service.availability.workingDays.join(
                          ", ",
                        )}
                      </Text>
                    </View>
                  </View>
                ) : null}

                {service.availability
                  ?.startTime ? (
                  <View style={styles.infoRow}>
                    <Clock3
                      size={18}
                      color={C.goldLight}
                    />

                    <View style={styles.infoCopy}>
                      <Text
                        style={styles.infoLabel}
                      >
                        Service hours
                      </Text>

                      <Text
                        style={styles.infoValue}
                      >
                        {
                          service.availability
                            .startTime
                        }
                        {service.availability
                          ?.endTime
                          ? ` Ã¢â‚¬â€œ ${service.availability.endTime}`
                          : ""}
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>
            </>
          ) : null}

          {service.packages?.length ? (
            <>
              <Text style={styles.sectionTitle}>
                Packages
              </Text>

              {service.packages.map(
                (item, index) => (
                  <View
                    key={`${item.name}-${index}`}
                    style={styles.packageCard}
                  >
                    <View
                      style={styles.packageTop}
                    >
                      <Text
                        style={styles.packageName}
                      >
                        {item.name ||
                          `Package ${index + 1}`}
                      </Text>

                      <Text
                        style={styles.packagePrice}
                      >
                        {money(item.price)}
                      </Text>
                    </View>

                    {item.description ? (
                      <Text
                        style={
                          styles.packageDescription
                        }
                      >
                        {item.description}
                      </Text>
                    ) : null}

                    {item.features?.map(
                      (feature) => (
                        <View
                          key={feature}
                          style={
                            styles.featureRow
                          }
                        >
                          <CheckCircle2
                            size={14}
                            color={C.goldLight}
                          />

                          <Text
                            style={
                              styles.featureText
                            }
                          >
                            {feature}
                          </Text>
                        </View>
                      ),
                    )}
                  </View>
                ),
              )}
            </>
          ) : null}

          <View style={styles.bookingNotice}>
            <Sparkles
              size={20}
              color={C.goldLight}
            />

            <View style={styles.bookingNoticeCopy}>
              <Text
                style={styles.bookingNoticeTitle}
              >
                Ready to continue?
              </Text>

              <Text
                style={styles.bookingNoticeText}
              >
                Complete booking and payment
                integration arrives in OMIQORA
                . This service is already
                connected to the live backend.
              </Text>
            </View>
          </View>
        </View>
      
        <Pressable
          style={styles.phase4BookButton}
          onPress={() => {
            if (service) {
              onBook(service);
            }
          }}
        >
          <Text style={styles.phase4BookButtonText}>
            Book this service
          </Text>
        </Pressable>
</ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  phase4BookButton: {
    height: 56,
    borderRadius: 18,
    backgroundColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 10,
  },

  phase4BookButtonText: {
    color: C.midnight,
    fontSize: 12,
    fontWeight: "900",
  },
  page: {
    flex: 1,
    backgroundColor: C.midnight,
  },

  content: {
    paddingBottom: 35,
  },

  media: {
    height: 285,
    backgroundColor: C.elevatedNavy,
    position: "relative",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  emptyMedia: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },

  emptyOrb: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: C.gold,
    backgroundColor: C.royalNavy,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyBrand: {
    color: C.gold,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 3,
    marginTop: 15,
  },

  emptyCopy: {
    color: C.muted,
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 8,
  },

  backButton: {
    position: "absolute",
    left: 17,
    top: 17,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(1,3,15,0.82)",
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },

  featured: {
    position: "absolute",
    right: 17,
    top: 17,
    height: 38,
    borderRadius: 999,
    backgroundColor: C.gold,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  featuredText: {
    color: C.midnight,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  body: {
    paddingHorizontal: 19,
    paddingTop: 23,
  },

  eyebrow: {
    color: C.gold,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.8,
  },

  title: {
    color: C.white,
    fontSize: 28,
    lineHeight: 35,
    fontWeight: "900",
    marginTop: 7,
  },

  meta: {
    gap: 10,
    marginTop: 15,
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  metaStrong: {
    color: C.white,
    fontSize: 12,
    fontWeight: "900",
  },

  metaSoft: {
    color: C.muted,
    fontSize: 11,
  },

  priceCard: {
    minHeight: 112,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: C.borderStrong,
    backgroundColor: C.royalNavy,
    padding: 19,
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  priceLabel: {
    color: C.mutedSoft,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.4,
  },

  price: {
    color: C.goldLight,
    fontSize: 27,
    fontWeight: "900",
    marginTop: 4,
  },

  priceType: {
    color: C.muted,
    fontSize: 10,
    marginTop: 3,
  },

  goldMark: {
    width: 53,
    height: 53,
    borderRadius: 27,
    backgroundColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
  },

  sectionTitle: {
    color: C.white,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 27,
    marginBottom: 11,
  },

  description: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 21,
  },

  providerCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.royalNavy,
    padding: 17,
    marginTop: 23,
    flexDirection: "row",
    alignItems: "center",
  },

  providerIcon: {
    width: 49,
    height: 49,
    borderRadius: 17,
    backgroundColor: C.elevatedNavy,
    borderWidth: 1,
    borderColor: C.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },

  providerInfo: {
    flex: 1,
    marginLeft: 13,
  },

  providerLabel: {
    color: C.mutedSoft,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.3,
  },

  providerName: {
    color: C.white,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 4,
  },

  verified: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
  },

  verifiedText: {
    color: C.goldLight,
    fontSize: 10,
    fontWeight: "700",
  },

  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  tag: {
    minHeight: 38,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.royalNavy,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  tagText: {
    color: C.muted,
    fontSize: 10,
    fontWeight: "700",
  },

  infoCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.royalNavy,
    padding: 17,
    gap: 17,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  infoCopy: {
    flex: 1,
    marginLeft: 12,
  },

  infoLabel: {
    color: C.mutedSoft,
    fontSize: 9,
    fontWeight: "800",
  },

  infoValue: {
    color: C.white,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    marginTop: 4,
  },

  packageCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.borderStrong,
    backgroundColor: C.royalNavy,
    padding: 17,
    marginBottom: 12,
  },

  packageTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
  },

  packageName: {
    color: C.white,
    fontSize: 15,
    fontWeight: "900",
    flex: 1,
  },

  packagePrice: {
    color: C.goldLight,
    fontSize: 15,
    fontWeight: "900",
  },

  packageDescription: {
    color: C.muted,
    fontSize: 11,
    lineHeight: 18,
    marginTop: 8,
  },

  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 11,
  },

  featureText: {
    color: C.muted,
    fontSize: 11,
    lineHeight: 17,
    flex: 1,
  },

  bookingNotice: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.borderStrong,
    backgroundColor: C.royalNavy,
    padding: 17,
    marginTop: 28,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  bookingNoticeCopy: {
    flex: 1,
    marginLeft: 12,
  },

  bookingNoticeTitle: {
    color: C.white,
    fontSize: 14,
    fontWeight: "900",
  },

  bookingNoticeText: {
    color: C.muted,
    fontSize: 10,
    lineHeight: 17,
    marginTop: 5,
  },

  fullState: {
    flex: 1,
    backgroundColor: C.midnight,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  stateTitle: {
    color: C.white,
    fontSize: 19,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 17,
  },

  stateText: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 8,
  },

  primaryButton: {
    minWidth: 140,
    height: 48,
    borderRadius: 16,
    backgroundColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },

  primaryButtonText: {
    color: C.midnight,
    fontSize: 12,
    fontWeight: "900",
  },

  backTextButton: {
    padding: 15,
  },

  backText: {
    color: C.goldLight,
    fontSize: 11,
    fontWeight: "800",
  },
  saveButton:{alignSelf:"flex-end",height:42,borderRadius:14,borderWidth:1,borderColor:C.borderStrong,backgroundColor:C.royalNavy,paddingHorizontal:14,flexDirection:"row",alignItems:"center",gap:7,marginBottom:12},
  saveButtonText:{color:C.goldLight,fontSize:10,fontWeight:"900"},
});
