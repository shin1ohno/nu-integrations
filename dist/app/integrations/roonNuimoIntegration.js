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
    constructor(options) {
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
        return this.broker
            .subscribe(this.topicsToSubscribe)
            .subscribe((x) => this.messageCB(x[0], x[1], x[2]));
    }
    down() {
        return this.broker.unsubscribe(this.topicsToSubscribe);
    }
    messageCB = (topic, payloadBuffer, _) => {
        const payloadTxt = payloadBuffer.toString();
        if (topic !== this.operationTopic) {
            if (topic === this.roonStateTopic) {
                this.nuimoReaction(JSON.stringify({ status: payloadTxt }));
            }
            else if (topic === this.roonVolumeTopic) {
                this.nuimoReaction(JSON.stringify({
                    status: "volumeChange",
                    percentage: payloadTxt,
                }));
            }
            else {
                //do nothing
            }
        }
        else {
            const mapping = {
                select: "playpause",
                swipeRight: "next",
                swipeLeft: "previous",
            };
            const payload = JSON.parse(payloadTxt);
            if (payload.subject === "rotate") {
                this.setVolume(parseFloat(payload.parameter[0].toString()));
            }
            else {
                this.command(mapping[payload.subject]);
            }
        }
    };
    command(payload) {
        this.broker.publish(this.commandTopic, payload);
    }
    nuimoReaction(payload) {
        this.broker.publish(this.nuimoReactionTopic, payload);
    }
    setVolume(volume) {
        const relativeVolume = volume * 60;
        logger.info(relativeVolume);
        this.broker.publish(this.volumeSetTopic, relativeVolume.toString());
    }
}
//# sourceMappingURL=roonNuimoIntegration.js.map