import { filter, map, mergeAll, of, partition, tap, } from "rxjs";
export class RoonNuimoMapping {
    desc;
    integration;
    commandTopic;
    operationTopic;
    broker;
    volumeSetTopic;
    roonStateTopic;
    roonVolumeTopic;
    topicsToSubscribe;
    nuimoReactionTopic;
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
        return of(this.observeRoonState(reactionObservable), this.observeRoonVolume(reactionObservable), this.observeNuimoCommand(operationObservable)).pipe(mergeAll());
    };
    observeNuimoCommand(operationObservable) {
        return operationObservable.pipe(filter((_) => !!this.routing), map(([_, payload]) => {
            const p = JSON.parse(payload.toString());
            return [
                this.routing[p.subject],
                p.parameter,
            ];
        }), filter(([c, _]) => typeof c !== "undefined"), tap(([command, parameters]) => {
            if (command === "relativeVolumeChange") {
                this.setVolume(parameters[0], (this.routing.dampingFactor || 60));
            }
            else {
                this.command(command);
            }
        }), map((_) => ""));
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
    setVolume(volume, dampingFactor) {
        const relativeVolume = volume * dampingFactor;
        this.broker.publish(this.volumeSetTopic, relativeVolume.toString());
        return relativeVolume.toString();
    }
}
