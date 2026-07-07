import React from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  ImageIcon,
  MapPin,
  Star,
} from "lucide-react-native";
import { OMIQORA } from "../theme";
import { Service } from "../types";

const C = OMIQORA.colors;

type Props = {
  service: Service;
  onPress: () => void;
};

const money = (value?: number) =>
  `\u20B9${Number(value ?? 0).toLocaleString("en-IN")}`;

const priceType = (value?: string) => {
  switch (value) {
    case "per_hour":
      return " / hour";
    case "per_day":
      return " / day";
    case "per_event":
      return " / event";
    default:
      return "";
  }
};

export function ServiceCard({
  service,
  onPress,
}: Props) {
  const image = service.images?.[0];

  const category =
    typeof service.categoryId === "object"
      ? service.categoryId?.name
      : undefined;

  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
    >
      <View style={styles.media}>
        {image ? (
          <Image
            source={{ uri: image }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.emptyImage}>
            <View style={styles.emptyOrb}>
              <ImageIcon
                size={24}
                color={C.goldLight}
              />
            </View>

            <Text style={styles.emptyText}>
              OMIQORA
            </Text>
          </View>
        )}

        {category ? (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {category}
            </Text>
          </View>
        ) : null}

        {service.featured ? (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredText}>
              âœ¦ FEATURED
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.content}>
        <Text
          style={styles.name}
          numberOfLines={2}
        >
          {service.name}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.rating}>
            <Star
              size={14}
              color={C.goldLight}
              fill={C.goldLight}
            />

            <Text style={styles.ratingText}>
              {Number(service.rating ?? 0).toFixed(1)}
            </Text>

            <Text style={styles.reviewText}>
              ({service.reviewCount ?? 0})
            </Text>
          </View>

          {service.location?.city ? (
            <View style={styles.location}>
              <MapPin
                size={13}
                color={C.muted}
              />

              <Text
                style={styles.locationText}
                numberOfLines={1}
              >
                {service.location.city}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.priceRow}>
          <View>
            <Text style={styles.from}>
              STARTING FROM
            </Text>

            <Text style={styles.price}>
              {money(service.basePrice)}
              <Text style={styles.priceType}>
                {priceType(service.priceType)}
              </Text>
            </Text>
          </View>

          <View style={styles.viewButton}>
            <Text style={styles.viewButtonText}>
              View
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.royalNavy,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
    marginBottom: 16,
  },

  media: {
    height: 175,
    backgroundColor: C.elevatedNavy,
    position: "relative",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  emptyImage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.elevatedNavy,
  },

  emptyOrb: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.midnightSoft,
  },

  emptyText: {
    color: C.gold,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2.5,
    marginTop: 10,
  },

  categoryBadge: {
    position: "absolute",
    left: 12,
    bottom: 12,
    backgroundColor: "rgba(1,3,15,0.88)",
    borderWidth: 1,
    borderColor: C.borderStrong,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
  },

  categoryText: {
    color: C.goldLight,
    fontSize: 10,
    fontWeight: "800",
  },

  featuredBadge: {
    position: "absolute",
    right: 12,
    top: 12,
    backgroundColor: C.gold,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },

  featuredText: {
    color: C.midnight,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  content: {
    padding: 16,
  },

  name: {
    color: C.white,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "900",
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 11,
  },

  rating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  ratingText: {
    color: C.white,
    fontSize: 12,
    fontWeight: "800",
  },

  reviewText: {
    color: C.muted,
    fontSize: 11,
  },

  location: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "50%",
    gap: 4,
  },

  locationText: {
    color: C.muted,
    fontSize: 11,
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 17,
  },

  from: {
    color: C.mutedSoft,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.2,
  },

  price: {
    color: C.goldLight,
    fontSize: 19,
    fontWeight: "900",
    marginTop: 3,
  },

  priceType: {
    color: C.muted,
    fontSize: 10,
    fontWeight: "600",
  },

  viewButton: {
    minWidth: 72,
    height: 38,
    borderRadius: 13,
    backgroundColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
  },

  viewButtonText: {
    color: C.midnight,
    fontSize: 12,
    fontWeight: "900",
  },
});
