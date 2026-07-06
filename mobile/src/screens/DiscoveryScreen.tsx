import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  ChevronDown,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react-native";
import { OMIQORA } from "../theme";
import {
  endpoints,
  errMsg,
  listOf,
  unwrap,
} from "../api";
import {
  Category,
  Service,
  ServiceSearchResponse,
} from "../types";
import { ServiceCard } from "../components/ServiceCard";

const C = OMIQORA.colors;

type Props = {
  initialQuery?: string;
  onOpenService: (serviceId: string) => void;
};

type Sort =
  | "relevance"
  | "rating"
  | "popular"
  | "newest"
  | "price_asc"
  | "price_desc";

const sortOptions: {
  value: Sort;
  label: string;
}[] = [
  {
    value: "relevance",
    label: "Recommended",
  },
  {
    value: "rating",
    label: "Top rated",
  },
  {
    value: "popular",
    label: "Popular",
  },
  {
    value: "newest",
    label: "Newest",
  },
  {
    value: "price_asc",
    label: "Price: Low to high",
  },
  {
    value: "price_desc",
    label: "Price: High to low",
  },
];

export function DiscoveryScreen({
  initialQuery = "",
  onOpenService,
}: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] =
    useState(initialQuery);

  const [categories, setCategories] = useState<
    Category[]
  >([]);

  const [services, setServices] = useState<Service[]>(
    [],
  );

  const [selectedCategory, setSelectedCategory] =
    useState<Category | null>(null);

  const [sort, setSort] =
    useState<Sort>("relevance");

  const [sortOpen, setSortOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);

  const activeSort = useMemo(
    () =>
      sortOptions.find(
        (option) => option.value === sort,
      )?.label ?? "Recommended",
    [sort],
  );

  const loadCategories = useCallback(async () => {
    const response = await endpoints.categories();

    setCategories(
      listOf(response).filter(
        (category: Category) =>
          category?.isActive !== false,
      ),
    );
  }, []);

  const loadServices = useCallback(async () => {
    const response = await endpoints.services({
      ...(submittedQuery.trim()
        ? {
            q: submittedQuery.trim(),
          }
        : {}),
      ...(selectedCategory?._id
        ? {
            category: selectedCategory._id,
          }
        : {}),
      sort,
      page: 1,
      limit: 30,
    });

    const data = unwrap(
      response,
    ) as ServiceSearchResponse;

    setServices(listOf(response));
    setTotal(
      Number(
        data?.total ??
          listOf(response).length,
      ),
    );
  }, [
    selectedCategory,
    sort,
    submittedQuery,
  ]);

  const load = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        await Promise.all([
          loadCategories(),
          loadServices(),
        ]);
      } catch (error) {
        setError(errMsg(error));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [loadCategories, loadServices],
  );

  useEffect(() => {
    load();
  }, [load]);

  const submitSearch = () => {
    setSubmittedQuery(query.trim());
  };

  const clearSearch = () => {
    setQuery("");
    setSubmittedQuery("");
  };

  return (
    <View style={styles.page}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={C.gold}
          />
        }
        contentContainerStyle={styles.content}
      >
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>
            DISCOVER OMIQORA
          </Text>

          <Text style={styles.title}>
            Find what makes it possible.
          </Text>

          <Text style={styles.subtitle}>
            Real services from the OMIQORA ecosystem.
            Search, explore and choose what fits you.
          </Text>
        </View>

        <View style={styles.searchBox}>
          <Search
            size={19}
            color={C.muted}
          />

          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={submitSearch}
            returnKeyType="search"
            placeholder="Search services, experts, experiences..."
            placeholderTextColor={C.muted}
            style={styles.searchInput}
          />

          {query ? (
            <Pressable onPress={clearSearch}>
              <X
                size={18}
                color={C.muted}
              />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          style={styles.searchButton}
          onPress={submitSearch}
        >
          <Sparkles
            size={16}
            color={C.midnight}
          />

          <Text style={styles.searchButtonText}>
            Search OMIQORA
          </Text>
        </Pressable>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionEyebrow}>
              ECOSYSTEM
            </Text>

            <Text style={styles.sectionTitle}>
              Explore categories
            </Text>
          </View>

          {selectedCategory ? (
            <Pressable
              onPress={() =>
                setSelectedCategory(null)
              }
            >
              <Text style={styles.clearText}>
                Clear
              </Text>
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={
            styles.categoryRow
          }
        >
          <Pressable
            style={[
              styles.category,
              !selectedCategory &&
                styles.categoryActive,
            ]}
            onPress={() =>
              setSelectedCategory(null)
            }
          >
            <Text
              style={[
                styles.categoryText,
                !selectedCategory &&
                  styles.categoryTextActive,
              ]}
            >
              All
            </Text>
          </Pressable>

          {categories.map((category) => {
            const active =
              selectedCategory?._id ===
              category._id;

            return (
              <Pressable
                key={category._id}
                style={[
                  styles.category,
                  active &&
                    styles.categoryActive,
                ]}
                onPress={() =>
                  setSelectedCategory(category)
                }
              >
                <Text
                  style={[
                    styles.categoryText,
                    active &&
                      styles.categoryTextActive,
                  ]}
                >
                  {category.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.resultHeader}>
          <View>
            <Text style={styles.resultCount}>
              {total}{" "}
              {total === 1
                ? "service"
                : "services"}
            </Text>

            <Text style={styles.resultContext}>
              {selectedCategory?.name ??
                (submittedQuery
                  ? `Results for "${submittedQuery}"`
                  : "Across OMIQORA")}
            </Text>
          </View>

          <Pressable
            style={styles.sortButton}
            onPress={() =>
              setSortOpen((value) => !value)
            }
          >
            <SlidersHorizontal
              size={15}
              color={C.goldLight}
            />

            <Text style={styles.sortButtonText}>
              {activeSort}
            </Text>

            <ChevronDown
              size={14}
              color={C.goldLight}
            />
          </Pressable>
        </View>

        {sortOpen ? (
          <View style={styles.sortMenu}>
            {sortOptions.map((option) => {
              const active =
                option.value === sort;

              return (
                <Pressable
                  key={option.value}
                  style={[
                    styles.sortOption,
                    active &&
                      styles.sortOptionActive,
                  ]}
                  onPress={() => {
                    setSort(option.value);
                    setSortOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      active &&
                        styles.sortOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {loading ? (
          <View style={styles.state}>
            <ActivityIndicator
              size="large"
              color={C.gold}
            />

            <Text style={styles.stateTitle}>
              Discovering possibilities
            </Text>

            <Text style={styles.stateText}>
              Connecting to the live OMIQORA
              ecosystem...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.state}>
            <View style={styles.stateMark}>
              <Text style={styles.stateMarkText}>
                !
              </Text>
            </View>

            <Text style={styles.stateTitle}>
              Discovery is unavailable
            </Text>

            <Text style={styles.stateText}>
              {error}
            </Text>

            <Pressable
              style={styles.retryButton}
              onPress={() => load()}
            >
              <Text style={styles.retryText}>
                Try again
              </Text>
            </Pressable>
          </View>
        ) : services.length === 0 ? (
          <View style={styles.state}>
            <View style={styles.stateMark}>
              <Sparkles
                size={24}
                color={C.goldLight}
              />
            </View>

            <Text style={styles.stateTitle}>
              No services found yet
            </Text>

            <Text style={styles.stateText}>
              There are no live OMIQORA services
              matching this search right now.
            </Text>

            <Pressable
              style={styles.retryButton}
              onPress={() => {
                setQuery("");
                setSubmittedQuery("");
                setSelectedCategory(null);
                setSort("relevance");
              }}
            >
              <Text style={styles.retryText}>
                Explore all
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.services}>
            {services.map((service) => (
              <ServiceCard
                key={service._id}
                service={service}
                onPress={() =>
                  onOpenService(service._id)
                }
              />
            ))}
          </View>
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

  content: {
    paddingHorizontal: 18,
    paddingTop: 17,
    paddingBottom: 35,
  },

  heading: {
    marginBottom: 20,
  },

  eyebrow: {
    color: C.gold,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 2,
  },

  title: {
    color: C.white,
    fontSize: 27,
    lineHeight: 34,
    fontWeight: "900",
    marginTop: 7,
  },

  subtitle: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },

  searchBox: {
    minHeight: 55,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.elevatedNavy,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },

  searchInput: {
    flex: 1,
    color: C.white,
    fontSize: 13,
    paddingHorizontal: 11,
    paddingVertical: 14,
  },

  searchButton: {
    height: 49,
    borderRadius: 16,
    backgroundColor: C.gold,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  searchButtonText: {
    color: C.midnight,
    fontSize: 13,
    fontWeight: "900",
  },

  sectionHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 28,
    marginBottom: 13,
  },

  sectionEyebrow: {
    color: C.gold,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  sectionTitle: {
    color: C.white,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4,
  },

  clearText: {
    color: C.goldLight,
    fontSize: 11,
    fontWeight: "800",
  },

  categoryRow: {
    paddingRight: 15,
    gap: 9,
  },

  category: {
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.royalNavy,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  categoryActive: {
    backgroundColor: C.gold,
    borderColor: C.gold,
  },

  categoryText: {
    color: C.muted,
    fontSize: 11,
    fontWeight: "800",
  },

  categoryTextActive: {
    color: C.midnight,
  },

  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 28,
    marginBottom: 15,
  },

  resultCount: {
    color: C.white,
    fontSize: 16,
    fontWeight: "900",
  },

  resultContext: {
    color: C.muted,
    fontSize: 10,
    marginTop: 4,
    maxWidth: 180,
  },

  sortButton: {
    minHeight: 40,
    maxWidth: 170,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.borderStrong,
    backgroundColor: C.royalNavy,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    gap: 6,
  },

  sortButtonText: {
    color: C.goldLight,
    fontSize: 10,
    fontWeight: "800",
    flexShrink: 1,
  },

  sortMenu: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.royalNavy,
    padding: 8,
    marginBottom: 16,
  },

  sortOption: {
    minHeight: 43,
    borderRadius: 12,
    justifyContent: "center",
    paddingHorizontal: 13,
  },

  sortOptionActive: {
    backgroundColor: C.elevatedNavy,
  },

  sortOptionText: {
    color: C.muted,
    fontSize: 12,
    fontWeight: "700",
  },

  sortOptionTextActive: {
    color: C.goldLight,
  },

  services: {
    paddingTop: 2,
  },

  state: {
    minHeight: 290,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  stateMark: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: C.borderStrong,
    backgroundColor: C.royalNavy,
    alignItems: "center",
    justifyContent: "center",
  },

  stateMarkText: {
    color: C.goldLight,
    fontSize: 25,
    fontWeight: "900",
  },

  stateTitle: {
    color: C.white,
    fontSize: 18,
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

  retryButton: {
    minWidth: 130,
    height: 45,
    borderRadius: 15,
    backgroundColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },

  retryText: {
    color: C.midnight,
    fontSize: 12,
    fontWeight: "900",
  },
});

