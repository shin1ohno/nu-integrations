import { map, partition } from "rxjs";
import { logger } from "../utils.js";
export class RoonNuimoIntegration {
    commandTopic;
    operationTopic;
    broker;
    volumeSetTopic;
    roonStateTopic;
    roonVolumeTopic;
    topicsToSubscribe;
    nuimoReactionTopic;
    desc;
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
        logger.info(`RoonNuimoIntegration up: ${this.desc}`);
        this.observe(this.broker.subscribe(this.topicsToSubscribe));
    }
    observe = (brokerEvents) => {
        const mapping = {
            select: "playpause",
            swipeRight: "next",
            swipeLeft: "previous",
        };
        const [operationObservable, reactionObservable] = partition(brokerEvents, ([topic, _]) => topic === this.operationTopic);
        const [roonStateObservable, roonVolumeObservable] = partition(reactionObservable, ([topic, _]) => topic === this.roonStateTopic);
        const [nuimoRotationObservable, nuimoCommandObservable] = partition(operationObservable, ([_, payload]) => JSON.parse(payload.toString()).subject === "rotate");
        roonStateObservable
            .pipe(map(([_, payload]) => payload.toString()))
            .subscribe((roonState) => this.nuimoReaction(JSON.stringify({ status: roonState })));
        roonVolumeObservable
            .pipe(map(([_, payload]) => payload.toString()), map((volume) => JSON.stringify({
            status: "volumeChange",
            percentage: volume,
        })))
            .subscribe((v) => this.nuimoReaction(v));
        nuimoRotationObservable
            .pipe(map(([_, payload]) => JSON.parse(payload.toString()).parameter[0]))
            .subscribe((volume) => this.setVolume(volume));
        nuimoCommandObservable
            .pipe(map(([_, payload]) => JSON.parse(payload.toString()).subject))
            .subscribe((subject) => this.command(mapping[subject]));
        return brokerEvents;
    };
    down() {
        logger.info(`RoonNuimoIntegration down: ${this.desc}`);
        return this.broker.unsubscribe(this.topicsToSubscribe);
    }
    command(payload) {
        this.broker.publish(this.commandTopic, payload);
    }
    nuimoReaction(payload) {
        this.broker.publish(this.nuimoReactionTopic, payload);
    }
    setVolume(volume) {
        const relativeVolume = volume * 60;
        this.broker.publish(this.volumeSetTopic, relativeVolume.toString());
    }
}
//# sourceMappingURL=roonNuimoIntegration.js.map