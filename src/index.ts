#!/usr/bin/env node

import { Integration } from "./app/integration.js";
import { Broker } from "./app/broker.js";
import { BrokerConfig } from "./app/brokerConfig.js";
import { filter, map, mergeAll, of, tap, throttleTime } from "rxjs";
import { logger } from "./app/utils.js";
import roonOutputStore from "./app/dataStores/roonOutputStore.js";
import { OWNER } from "./app/dataStores/integrationStore.js";

logger.info("Start nu-integration backend process......");

new Broker(BrokerConfig.fromEnv())
  .connect()
  .then((b) => {
    const observable = b.subscribe([
      "roon/+/now_playing/image_key",
      "roon/+/outputs/+/env",
      "nuIntegrations/+/touch",
    ]);
    of(
      observable.pipe(
        filter(
          ([topic, _]) => !!topic.match(/^roon\/(.+)\/outputs\/(.+)\/env$/gmu),
        ),
        map(([topic, payload]): [string, Record<string, any>] => {
          return [
            topic.split("/")[3] as string,
            JSON.parse(payload.toString()) as Record<string, any>,
          ];
        }),
        tap(([outputDisplayName, envData]) => {
          roonOutputStore.update({
            outputID: envData["output_id"],
            ownerUUID: OWNER,
            displayName: outputDisplayName,
            updatedAt: Date.now() / 1000,
            zoneId: envData["zone_id"],
            zoneDisplayName: envData["zone_display_name"],
            status: envData["status"],
            core: {
              coreID: envData["core_id"],
              displayName: envData["core_display_name"],
              displayVersion: envData["core_display_version"],
              address: envData["core_address"],
              port: parseInt(envData["core_port"], 10),
            },
          });
        }),
      ),
      observable.pipe(
        filter(
          ([topic, _]) =>
            !!topic.match(/^roon\/(.+)\/now_playing\/image_key$/gmu),
        ),
        map(([topic, payload]) => {
          return {
            zone: topic.split("/")[1],
            imageKey: payload.toString(),
          };
        }),
        tap((update) => {
          Integration.all().then((all) => {
            all
              .filter((i) => i.options.app.zone === update.zone)
              .forEach((i) =>
                i.updateDataSource({
                  nowPlaying: {
                    imageKey: update.imageKey,
                  },
                }),
              );
          });
        }),
      ),
      observable.pipe(
        filter(
          ([topic, _]) => !!topic.match(/^nuIntegrations\/(.+)\/touch$/gmu),
        ),
        throttleTime(200),
        map(([topic, _]) => topic.split("/")[1]),
        tap((integrationUUID) => {
          b.publish(
            `nuIntegrations/${integrationUUID}/kill`,
            JSON.stringify({ all: true }),
          ).then(() => {
            Integration.find(integrationUUID).then((i) => {
              if (i.status === "up") i.up();
            });
          });
        }),
      ),
    )
      .pipe(mergeAll())
      .subscribe();
    return b;
  })
  .then((_) => {
    Integration.all().then((all) =>
      all.forEach((i) => {
        if (i.status === "up") i.up();
      }),
    );
  });

export { Integration };
