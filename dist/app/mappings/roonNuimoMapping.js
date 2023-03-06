import { filter, map, mergeAll, of, partition, tap, } from "rxjs";
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
    nowPlayingTopic;
    routing;
    constructor(options) {
        this.desc = `Roon(${options.zone}-${options.output}) <-> Nuimo(${options.nuimo}) <=> ${options.broker.desc})`;
        this.operationTopic = `nuimo/${options.nuimo}/operation`;
        this.commandTopic = `roon/${options.zone}/command`;
        this.volumeSetTopic = `roon/${options.zone}/outputs/${options.output}/volume/set/relative`;
        this.roonStateTopic = `roon/${options.zone}/state`;
        this.roonVolumeTopic = `roon/${options.zone}/outputs/${options.output}/volume/percent`;
        this.nowPlayingTopic = `roon/${options.zone}/now_playing/#`;
        this.topicsToSubscribe = [
            this.operationTopic,
            this.roonStateTopic,
            this.roonVolumeTopic,
            this.nowPlayingTopic,
        ];
        this.nuimoReactionTopic = `nuimo/${options.nuimo}/reaction`;
        this.routing = options.routing;
        this.broker = options.broker;
    }
    up() {
        return this.observe(this.broker.subscribe(this.topicsToSubscribe)).subscribe();
    }
    async down() {
        return await this.broker.unsubscribe(this.topicsToSubscribe);
    }
    observe = (brokerEvents) => {
        const [operationObservable, reactionObservable] = partition(brokerEvents, ([topic, _]) => topic === this.operationTopic);
        return of(this.observeRoonState(reactionObservable), this.observeRoonVolume(reactionObservable), this.observeNuimoRotate(operationObservable), this.observeNuimoCommand(operationObservable)).pipe(mergeAll());
    };
    observeNuimoCommand(operationObservable) {
        return operationObservable.pipe(filter((_) => !!this.routing), filter(([_, payload]) => JSON.parse(payload.toString()).subject !== "rotate"), map(([_, payload]) => this.routing[JSON.parse(payload.toString()).subject]), filter((c) => typeof c !== "undefined"), tap((command) => this.command(command)));
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
