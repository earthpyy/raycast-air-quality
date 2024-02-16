import { Action, ActionPanel, Detail, getPreferenceValues, Icon, List, openExtensionPreferences } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import axios from "axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

type Attribution = {
  url: string;
  name: string;
};

type City = {
  geo: [number, number];
  name: string;
  url: string;
  location: string;
};

type Iaqi = {
  co?: {
    v: number;
  };
  h?: {
    v: number;
  };
  no2?: {
    v: number;
  };
  o3?: {
    v: number;
  };
  p?: {
    v: number;
  };
  pm10?: {
    v: number;
  };
  pm25?: {
    v: number;
  };
  so2?: {
    v: number;
  };
  t?: {
    v: number;
  };
  w?: {
    v: number;
  };
};

type Time = {
  s: string;
  tz: string;
  v: number;
  iso: string;
};

type Forecast = {
  daily: {
    o3: {
      avg: number;
      day: string;
      max: number;
      min: number;
    }[];
    pm10: {
      avg: number;
      day: string;
      max: number;
      min: number;
    }[];
    pm25: {
      avg: number;
      day: string;
      max: number;
      min: number;
    }[];
    uvi: {
      avg: number;
      day: string;
      max: number;
      min: number;
    }[];
  };
};

type AirQualityData = {
  aqi: number;
  idx: number;
  attributions: Attribution[];
  city: City;
  dominentpol: string;
  iaqi: Iaqi;
  time: Time;
  forecast: Forecast;
  debug: {
    sync: string;
  };
};

type Preferences = {
  apiToken: string;
};

type PollutionLevelAndImplication = {
  level: number;
  levelName: string;
  implication: string;
};

const preferences: Preferences = getPreferenceValues();

async function fetchAirQuality() {
  const response = await axios.get(`https://api.waqi.info/feed/here/?token=${preferences.apiToken}`);
  if (response.status !== 200 || response.data.status !== "ok") {
    throw new Error(response.data?.data || "Failed to fetch air quality data");
  }
  return response.data.data as unknown as AirQualityData;
}

function getPollutionLevelAndImplication(aqi: number): PollutionLevelAndImplication {
  if (aqi <= 50) {
    return {
      level: 0,
      levelName: "Good",
      implication: "Air quality is considered satisfactory, and air pollution poses little or no risk.",
    };
  } else if (aqi >= 51 && aqi <= 100) {
    return {
      level: 1,
      levelName: "Moderate",
      implication:
        "Air quality is acceptable; however, for some pollutants there may be a moderate health concern for a very small number of people who are unusually sensitive to air pollution.",
    };
  } else if (aqi >= 101 && aqi <= 150) {
    return {
      level: 2,
      levelName: "Unhealthy for Sensitive Groups",
      implication:
        "Members of sensitive groups may experience health effects. The general public is not likely to be affected.",
    };
  } else if (aqi >= 151 && aqi <= 200) {
    return {
      level: 3,
      levelName: "Unhealthy",
      implication:
        "Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.",
    };
  } else if (aqi >= 201 && aqi <= 300) {
    return {
      level: 4,
      levelName: "Very Unhealthy",
      implication: "Health warnings of emergency conditions. The entire population is more likely to be affected.",
    };
  } else {
    return {
      level: 5,
      levelName: "Hazardous",
      implication: "Health alert: everyone may experience more serious health effects.",
    };
  }
}

export default function Command() {
  const { data, error, isLoading } = useCachedPromise(fetchAirQuality);

  if (error) {
    return (
      <Detail
        actions={
          <ActionPanel>
            <Action title="Open Extension Preferences" onAction={openExtensionPreferences} />
          </ActionPanel>
        }
      />
    );
  }

  const pollution = getPollutionLevelAndImplication(data?.aqi!);
  const updatedTime = dayjs(data?.time?.iso).fromNow();

  const defaultAction = (
    <ActionPanel>
      <ActionPanel.Section>
        <Action.OpenInBrowser title="Open in Browser" url={data?.city?.url!} />
      </ActionPanel.Section>
    </ActionPanel>
  );

  return (
    <List isLoading={isLoading}>
      <List.Item
        key="test"
        icon={Icon.StarCircle}
        title="AQI"
        subtitle={data?.aqi?.toString()}
        accessories={[
          {
            icon: `levels/${pollution.level}.png`,
            text: pollution.levelName,
            tooltip: pollution.implication,
          },
        ]}
        actions={defaultAction}
      />
      <List.Item
        key="updatedTime"
        icon={Icon.Clock}
        title="Last Updated"
        subtitle={updatedTime}
        actions={defaultAction}
      />
      <List.Item
        key="station"
        icon={Icon.Building}
        title="Station"
        subtitle={data?.city?.name}
        actions={defaultAction}
      />
    </List>
  );
}
