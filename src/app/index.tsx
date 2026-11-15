import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import {
  Camera,
  Map,
  UserLocation,
  type StyleSpecification,
} from "@maplibre/maplibre-react-native";

import mapStyle from "@/constants/map-style.json";

export default function HomeScreen() {
  const [coords, setCoords] = useState<Location.LocationObjectCoords | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return setError("Location permission denied.");
      try {
        const { coords } = await Location.getCurrentPositionAsync({});
        setCoords(coords);
      } catch {
        setError("Could not get your location.");
      }
    })();
  }, []);

  if (error) {
    return (
      <View style={styles.center}>
        <Text>{error}</Text>
      </View>
    );
  }

  if (!coords) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Map style={StyleSheet.absoluteFill} mapStyle={mapStyle as StyleSpecification}>
      <Camera initialViewState={{ center: [coords.longitude, coords.latitude], zoom: 15 }} />
      <UserLocation />
    </Map>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
