import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Action, ActionPanel, Detail, Icon, List, openExtensionPreferences } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { fetchAirQuality } from "./shared/api";
import { getPollutionLevelAndImplication } from "./shared/utils";

dayjs.extend(relativeTime);

export default function Command() {
  const { data, error, isLoading } = useCachedPromise(fetchAirQuality);

  if (error || !data) {
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

  const pollution = getPollutionLevelAndImplication(data.aqi);
  const updatedTime = dayjs(data.time.iso).fromNow();

  const defaultAction = (
    <ActionPanel>
      <ActionPanel.Section>
        <Action.OpenInBrowser title="Open in Browser" url={data.city.url} />
      </ActionPanel.Section>
    </ActionPanel>
  );

  return (
    <List isLoading={isLoading}>
      <List.Item
        key="test"
        icon={Icon.StarCircle}
        title="AQI"
        subtitle={data.aqi.toString()}
        accessories={[
          {
            icon: `levels/${pollution.level}.png`,
            text: pollution.levelName,
            tooltip: pollution.implication,
          },
        ]}
        actions={defaultAction}
      />
      <List.Item key="station" icon={Icon.Building} title="Station" subtitle={data.city.name} actions={defaultAction} />
      <List.Item
        key="updatedTime"
        icon={Icon.Clock}
        title="Last Updated"
        subtitle={updatedTime}
        actions={defaultAction}
      />
      <List.Section title="Forecast">
        {data.forecast.daily.pm25
          .map((record) => ({
            ...record,
            date: dayjs(record.day),
          }))
          .filter((record) => dayjs().isBefore(record.date, "day"))
          .map((record) => {
            const date = record.date.format("dddd, MMMM D, YYYY");
            const pollution = getPollutionLevelAndImplication(record.avg);

            return (
              <List.Item
                key={date}
                icon={Icon.Sun}
                title={date}
                subtitle={`AQI: ${record.avg}`}
                accessories={[
                  {
                    icon: `levels/${pollution.level}.png`,
                    text: pollution.levelName,
                    tooltip: pollution.implication,
                  },
                ]}
              />
            );
          })}
      </List.Section>
      <List.Section title="Attribution">
        {data.attributions.map((attribution) => (
          <List.Item
            key={attribution.name}
            icon={Icon.Info}
            title={attribution.name}
            subtitle={attribution.url}
            actions={
              <ActionPanel>
                <Action.OpenInBrowser title="Open in Browser" url={attribution.url} />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}
