import { StyleSheet, Text, View } from "react-native";

import type { MapViewProps } from "./map-view.types";

export function MapView(_props: MapViewProps) {
  return (
    <View accessibilityLabel="Map" style={styles.placeholder}>
      <Text style={styles.text}>Map view is available on web.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F3F4"
  },
  text: {
    color: "#5F6368",
    fontFamily: 'system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14
  }
});
