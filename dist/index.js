#!/usr/bin/env node
import { Integration } from "./app/integration.js";
import { Broker } from "./app/broker.js";
import { BrokerConfig } from "./app/brokerConfig.js";
import { filter, map, mergeAll, of, tap, throttleTime } from "rxjs";
import { logger } from "./app/utils.js";
logger.info("Start nu-integration backend process......");
new Broker(BrokerConfig.fromEnv())
    .connect()
    .then((b) => {
    const observable = b.subscribe([
        "roon/+/now_playing/image_key",
        "nuIntegrations/+/touch",
    ]);
    of(observable.pipe(filter(([topic, _]) => !!topic.match(/^roon\/(.+)\/now_playing\/image_key$/gmu)), map(([topic, payload]) => {
        return {
            zone: topic.split("/")[1],
            imageKey: payload.toString(),
        };
    }), tap((update) => {
        Integration.all().then((all) => {
            all
                .filter((i) => i.options.app.zone === update.zone)
                .forEach((i) => i.updateDataSource({
                nowPlaying: {
                    imageKey: update.imageKey,
                },
            }));
        });
    })), observable.pipe(filter(([topic, _]) => !!topic.match(/^nuIntegrations\/(.+)\/touch$/gmu)), throttleTime(200), map(([topic, _]) => topic.split("/")[1]), tap((integrationUUID) => {
        b.publish(`nuIntegrations/${integrationUUID}/kill`, JSON.stringify({ all: true })).then(() => {
            Integration.find(integrationUUID).then((i) => {
                if (i.status === "up")
                    i.up();
            });
        });
    })))
        .pipe(mergeAll())
        .subscribe();
    return b;
})
    .then((_) => {
    Integration.all().then((all) => all.forEach((i) => {
        if (i.status === "up")
            i.up();
    }));
});
export { Integration };
