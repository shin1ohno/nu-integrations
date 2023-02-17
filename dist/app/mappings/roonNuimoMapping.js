import { filter, map, mergeAll, of, partition, tap, } from "rxjs";
import { logger } from "../utils.js";
export class RoonNuimoMapping {
    commandTopic;
    operationTopic;
    broker;
    volumeSetTopic;
    roonStateTopic;
    roonVolumeTopic;
    topicsToSubscribe;
    nuimoReactionTopic;
    desc;
    integration;
    constructor(options) {
        this.desc = `Nuimo(${options.nuimo}) <-> Roon(${options.zone}-${options.output}) <=> ${options.broker.desc})`;
        this.operationTopic = `nuimo/${options.nuimo}/operation`;
        this.commandTopic = `roon/${options.zone}/command`;
        this.volumeSetTopic = `roon/${options.zone}/outputs/${options.output}/volume/set/relative`;
        this.roonStateTopic = `roon/${options.zone}/state`;
        this.roonVolumeTopic = `roon/${options.zone}/outputs/${options.output}/volume/percent`;
        this.topicsToSubscribe = [
            this.operationTopic,
            this.roonStateTopic,
            this.roonVolumeTopic,
        ];
        this.nuimoReactionTopic = `nuimo/${options.nuimo}/reaction`;
        this.broker = options.broker;
    }
    up() {
        return this.observe(this.broker.subscribe(this.topicsToSubscribe)).subscribe((x) => logger.info(x));
    }
    down() {
        return this.broker.unsubscribe(this.topicsToSubscribe);
    }
    observe = (brokerEvents) => {
        const [operationObservable, reactionObservable] = partition(brokerEvents, ([topic, _]) => topic === this.operationTopic);
        return of(this.observeRoonState(reactionObservable), this.observeRoonVolume(reactionObservable), this.observeNuimoRotate(operationObservable), this.observeNuimoCommand(operationObservable)).pipe(mergeAll());
    };
    observeNuimoCommand(operationObservable) {
        const mapping = {
            select: "playpause",
            swipeRight: "next",
            swipeLeft: "previous",
            longTouchBottom: "switchApp",
        };
        return operationObservable.pipe(filter(([_, payload]) => JSON.parse(payload.toString()).subject !== "rotate"), map(([_, payload]) => mapping[JSON.parse(payload.toString()).subject]), filter((c) => typeof c !== "undefined"), tap((command) => {
            if (command === "switchApp") {
                logger.info(`Switching from :${this.desc}`);
            }
            else {
                this.command(command);
            }
        }));
    }
    observeNuimoRotate(operationObservable) {
        return operationObservable.pipe(filter(([_, payload]) => JSON.parse(payload.toString()).subject === "rotate"), map(([_, payload]) => JSON.parse(payload.toString())), filter((p) => p.parameter && typeof p.parameter === "object"), map((p) => p.parameter[0]), tap((volume) => this.setVolume(volume)), map((volume) => volume.toString()));
    }
    observeRoonVolume(reactionObservable) {
        return reactionObservable.pipe(filter(([topic, _]) => topic === this.roonVolumeTopic), map(([_, payload]) => payload.toString()), map((volume) => JSON.stringify({
            status: "volumeChange",
            percentage: volume,
        })), map((v) => this.nuimoReaction(v)));
    }
    observeRoonState(reactionObservable) {
        return reactionObservable.pipe(filter(([topic, _]) => topic === this.roonStateTopic), map(([_, payload]) => payload.toString()), map((roonState) => this.nuimoReaction(JSON.stringify({ status: roonState }))));
    }
    command(payload) {
        this.broker.publish(this.commandTopic, payload);
        return payload;
    }
    nuimoReaction(payload) {
        this.broker.publish(this.nuimoReactionTopic, payload);
        return payload;
    }
    setVolume(volume) {
        const relativeVolume = volume * 60;
        this.broker.publish(this.volumeSetTopic, relativeVolume.toString());
        return relativeVolume.toString();
    }
}
