import axios from "axios";
import { getPreferenceValues } from "@raycast/api";
import { AirQualityData, Preferences } from "./types";

const preferences: Preferences = getPreferenceValues();
const cityName = preferences.city
  ? preferences.city
      .replace(/\s/g, "")
      .replace("https://aqicn.org/city/", "")
      .replace(/^\//, "")
      .replace(/\/$/, "")
      .toLowerCase()
  : "here";

export async function fetchAirQuality() {
  const response = await axios.get(`https://api.waqi.info/feed/${cityName}/?token=${preferences.apiToken}`);
  if (response.status !== 200 || response.data.status !== "ok" || response.data.data?.status === 'error') {
    throw new Error(response.data?.msg || response.data?.data?.msg || "Unknown error");
  }
  return response.data.data as unknown as AirQualityData;
}
