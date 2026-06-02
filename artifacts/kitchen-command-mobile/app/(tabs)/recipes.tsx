import { Feather } from "@expo/vector-icons";
import {
  getGetRecipeQueryKey,
  getListRecipesQueryKey,
  useGetRecipe,
  useListRecipes,
} from "@workspace/api-client-react";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useVenue } from "@/contexts/VenueContext";
import { useColors } from "@/hooks/useColors";

const SCALE_OPTIONS = [1, 2, 5, 10] as const;
type Scale = (typeof SCALE_OPTIONS)[number];

const ALLERGEN_LABELS: Record<string, string> = {
  gluten: "Gluten",
  crustaceans: "Crustaceans",
  eggs: "Eggs",
  fish: "Fish",
  peanuts: "Peanuts",
  soybeans: "Soya",
  milk: "Milk",
  nuts: "Nuts",
  celery: "Celery",
  mustard: "Mustard",
  sesame: "Sesame",
  sulphites: "Sulphites",
  lupin: "Lupin",
  molluscs: "Molluscs",
};

export default function RecipesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { venueId } = useVenue();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data, isLoading } = useListRecipes(venueId ?? 0, undefined, {
    query: {
      enabled: !!venueId,
      queryKey: getListRecipesQueryKey(venueId ?? 0),
    },
  });

  const topPad = Platform.OS === "web" ? 67 : 0;
  const bottomPad = Platform.OS === "web" ? 84 + 34 : 84 + insets.bottom;

  const filtered = (data ?? []).filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Search */}
      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            paddingTop: topPad + 12,
          },
        ]}
      >
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          value={search}
          onChangeText={setSearch}
          placeholder="Search recipes..."
          placeholderTextColor={colors.mutedForeground}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")} hitSlop={8}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          scrollEnabled={!!filtered.length}
          contentContainerStyle={{
            padding: 16,
            gap: 10,
            paddingBottom: bottomPad,
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather
                name="book-open"
                size={40}
                color={colors.mutedForeground}
              />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {search ? "No recipes match" : "No recipes yet"}
              </Text>
              <Text
                style={[styles.emptyText, { color: colors.mutedForeground }]}
              >
                {search
                  ? "Try a different search"
                  : "Add recipes in the web app to see them here"}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => setSelectedId(item.id)}
            >
              <View style={styles.cardTop}>
                <Text
                  style={[styles.recipeName, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <Feather
                  name="chevron-right"
                  size={16}
                  color={colors.mutedForeground}
                />
              </View>

              <View style={styles.cardMeta}>
                {item.portionCost != null && (
                  <View style={styles.metaBadge}>
                    <Text
                      style={[
                        styles.metaText,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      £{Number(item.portionCost).toFixed(2)}/serve
                    </Text>
                  </View>
                )}
                {item.gpPercent != null && (
                  <View
                    style={[
                      styles.metaBadge,
                      {
                        backgroundColor:
                          Number(item.gpPercent) >= 65
                            ? colors.success + "22"
                            : colors.warning + "22",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.metaText,
                        {
                          color:
                            Number(item.gpPercent) >= 65
                              ? colors.success
                              : colors.warning,
                        },
                      ]}
                    >
                      GP {Number(item.gpPercent).toFixed(0)}%
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          )}
        />
      )}

      {selectedId && (
        <RecipeDetailSheet
          recipeId={selectedId}
          venueId={venueId ?? 0}
          colors={colors}
          insets={insets}
          onClose={() => setSelectedId(null)}
        />
      )}
    </View>
  );
}

function RecipeDetailSheet({
  recipeId,
  venueId,
  colors,
  insets,
  onClose,
}: {
  recipeId: number;
  venueId: number;
  colors: ReturnType<typeof useColors>;
  insets: ReturnType<typeof useSafeAreaInsets>;
  onClose: () => void;
}) {
  const { data: recipe, isLoading } = useGetRecipe(venueId, recipeId, {
    query: {
      queryKey: getGetRecipeQueryKey(venueId, recipeId),
    },
  });
  const [scale, setScale] = useState<Scale>(1);

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={[styles.sheetHeader, { paddingTop: insets.top + 16 }]}
        >
          <Pressable onPress={onClose} hitSlop={8}>
            <Feather name="x" size={22} color={colors.foreground} />
          </Pressable>
          <Text
            style={[styles.sheetTitle, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {recipe?.name ?? "Recipe"}
          </Text>
          <View style={{ width: 22 }} />
        </View>

        {isLoading ? (
          <ActivityIndicator
            color={colors.primary}
            style={{ marginTop: 40 }}
          />
        ) : recipe ? (
          <ScrollView
            contentContainerStyle={{
              padding: 20,
              gap: 20,
              paddingBottom: insets.bottom + 32,
            }}
          >
            {/* Metrics row */}
            <View style={styles.metricsRow}>
              {[
                {
                  label: "Cost/serve",
                  value: recipe.portionCost
                    ? `£${(Number(recipe.portionCost) * scale).toFixed(2)}`
                    : "—",
                  color: colors.primary,
                },
                {
                  label: "GP%",
                  value: recipe.gpPercent
                    ? `${Number(recipe.gpPercent).toFixed(0)}%`
                    : "—",
                  color:
                    Number(recipe.gpPercent) >= 65
                      ? colors.success
                      : colors.warning,
                },
                {
                  label: "Portions",
                  value: String(scale),
                  color: colors.foreground,
                },
              ].map((m) => (
                <View
                  key={m.label}
                  style={[
                    styles.metricCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.metricValue, { color: m.color }]}>
                    {m.value}
                  </Text>
                  <Text
                    style={[
                      styles.metricLabel,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {m.label}
                  </Text>
                </View>
              ))}
            </View>

            {/* Scale selector */}
            <View>
              <Text
                style={[
                  styles.sectionLabel,
                  { color: colors.mutedForeground },
                ]}
              >
                SCALE
              </Text>
              <View style={styles.scaleRow}>
                {SCALE_OPTIONS.map((s) => (
                  <Pressable
                    key={s}
                    style={[
                      styles.scaleBtn,
                      {
                        backgroundColor:
                          scale === s ? colors.primary : colors.card,
                        borderColor:
                          scale === s ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setScale(s)}
                  >
                    <Text
                      style={[
                        styles.scaleBtnText,
                        {
                          color:
                            scale === s
                              ? colors.primaryForeground
                              : colors.foreground,
                        },
                      ]}
                    >
                      {s}×
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Ingredients */}
            {recipe.ingredients && recipe.ingredients.length > 0 && (
              <View>
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  INGREDIENTS
                </Text>
                {recipe.ingredients.map((ing, i) => (
                  <View
                    key={i}
                    style={[
                      styles.ingRow,
                      { borderBottomColor: colors.border },
                    ]}
                  >
                    <Text
                      style={[styles.ingName, { color: colors.foreground }]}
                    >
                      {ing.itemName}
                    </Text>
                    <Text
                      style={[
                        styles.ingQty,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {(Number(ing.quantity) * scale).toFixed(2)} {ing.unit}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Allergens */}
            {recipe.allergens && recipe.allergens.length > 0 && (
              <View>
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  ALLERGENS
                </Text>
                <View style={styles.allergenRow}>
                  {recipe.allergens.map((key) => (
                    <View
                      key={key}
                      style={[
                        styles.allergenChip,
                        { backgroundColor: colors.warning + "33" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.allergenText,
                          { color: colors.warning },
                        ]}
                      >
                        {ALLERGEN_LABELS[key] ?? key}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Method */}
            {recipe.method && (
              <View>
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  METHOD
                </Text>
                <Text
                  style={[styles.methodText, { color: colors.foreground }]}
                >
                  {recipe.method}
                </Text>
              </View>
            )}
          </ScrollView>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  card: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 8,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  recipeName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  cardMeta: {
    flexDirection: "row",
    gap: 8,
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "transparent",
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  allergenRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  allergenChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  allergenText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  empty: {
    alignItems: "center",
    gap: 10,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
    textAlign: "center",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
  },
  metricCard: {
    flex: 1,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  metricValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  metricLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  scaleRow: {
    flexDirection: "row",
    gap: 10,
  },
  scaleBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  scaleBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  ingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  ingName: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  ingQty: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  methodText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
});
