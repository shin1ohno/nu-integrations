import { Broker } from "../broker.js";
import { MappingInterface, Routing } from "./interface.js";
import { Subscription } from "rxjs";
import { Integration } from "../integration.js";
export declare class RoonNuimoMapping implements MappingInterface {
    readonly desc: string;
    integration: Integration;
    private readonly commandTopic;
    private readonly operationTopic;
    private readonly broker;
    private readonly volumeSetTopic;
    private readonly roonStateTopic;
    private readonly roonVolumeTopic;
    private readonly topicsToSubscribe;
    private readonly nuimoReactionTopic;
    private readonly nowPlayingTopic;
    private readonly routing;
    constructor(options: {
        nuimo: string;
        zone: string;
        output: string;
        routing: Routing;
        broker: Broker;
    });
    up(): Subscription;
    down(): Promise<void>;
    private observe;
    private observeNuimoCommand;
    private observeRoonVolume;
    private observeRoonState;
    private command;
    private nuimoReaction;
    private setVolume;
}
