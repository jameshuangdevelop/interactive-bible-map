import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";

import { tokens } from "../theme/tokens";

const SEARCH_DESKTOP_WIDTH = 400;
const SMALL_SCREEN_BREAKPOINT = 768;
const PANEL_WIDTH = 408;

export function AppShell() {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < SMALL_SCREEN_BREAKPOINT;
  const searchWidth = Math.min(SEARCH_DESKTOP_WIDTH, Math.max(240, width - 32));

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View accessibilityLabel="Map" style={styles.mapArea}>
        <Text style={styles.mapText}>Map placeholder</Text>
      </View>

      <View style={[styles.searchShell, { width: searchWidth }]}>
        <Pressable accessibilityLabel="Open app menu" style={styles.menuButton}>
          <Text style={styles.menuIcon}>☰</Text>
        </Pressable>
        <TextInput
          accessibilityLabel="Search biblical places"
          editable={false}
          placeholder="Search biblical places"
          placeholderTextColor={tokens.color.textSecondary}
          style={styles.searchInput}
        />
      </View>

      <View
        accessibilityLabel="Place details"
        role="region"
        style={[styles.panelShell, isSmallScreen ? styles.panelSmallScreen : styles.panelDesktop]}
      >
        <Text style={styles.panelTitle}>Place panel placeholder</Text>
        <Text style={styles.panelSubtitle}>Details will load here after selecting a place.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.color.surface
  },
  mapArea: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.color.subtleSurface
  },
  mapText: {
    color: tokens.color.textSecondary,
    fontFamily: tokens.typography.uiFont,
    fontSize: tokens.typography.bodySize
  },
  searchShell: {
    position: "absolute",
    top: tokens.spacing.md,
    left: tokens.spacing.md,
    height: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: tokens.color.divider,
    backgroundColor: tokens.color.surface,
    alignItems: "center",
    flexDirection: "row",
    paddingRight: tokens.spacing.md,
    paddingLeft: tokens.spacing.sm,
    gap: tokens.spacing.sm,
    shadowColor: "#3C4043",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  menuButton: {
    width: 32,
    height: 32,
    borderRadius: tokens.radius.button,
    borderWidth: 1,
    borderColor: tokens.color.divider,
    alignItems: "center",
    justifyContent: "center"
  },
  menuIcon: {
    fontFamily: tokens.typography.uiFont,
    fontSize: 18,
    color: tokens.color.textPrimary
  },
  searchInput: {
    flex: 1,
    color: tokens.color.textPrimary,
    fontFamily: tokens.typography.uiFont,
    fontSize: tokens.typography.bodySize
  },
  panelShell: {
    position: "absolute",
    backgroundColor: tokens.color.surface,
    borderWidth: 1,
    borderColor: tokens.color.divider,
    padding: tokens.spacing.lg
  },
  panelDesktop: {
    top: 0,
    bottom: 0,
    left: 0,
    width: PANEL_WIDTH
  },
  panelSmallScreen: {
    left: tokens.spacing.md,
    right: tokens.spacing.md,
    bottom: tokens.spacing.md,
    minHeight: "40%",
    borderRadius: tokens.radius.panel
  },
  panelTitle: {
    color: tokens.color.textPrimary,
    fontFamily: tokens.typography.uiFont,
    fontSize: tokens.typography.titleSize,
    lineHeight: tokens.typography.titleLineHeight,
    fontWeight: "600"
  },
  panelSubtitle: {
    marginTop: tokens.spacing.sm,
    color: tokens.color.textSecondary,
    fontFamily: tokens.typography.uiFont,
    fontSize: tokens.typography.bodySize,
    lineHeight: tokens.typography.bodyLineHeight
  }
});
