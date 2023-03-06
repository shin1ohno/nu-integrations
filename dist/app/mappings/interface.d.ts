import { Subscription } from "rxjs";
import { Integration } from "../integration.js";
interface MappingInterface {
    readonly desc: string;
    integration: Integration;
    up(): Subscription;
    down(): Promise<void>;
}
declare type nuimoOptions = {
    name: "nuimo";
    id: string;
};
declare type roonOptions = {
    name: "roon";
    zone: string;
    output: string;
    nowPlaying?: {
        imageKey: string;
    };
};
declare type IntegrationOptions = {
    uuid: string;
    app: roonOptions;
    controller: nuimoOptions;
    updatedAt?: number;
    ownerUUID?: string;
    status: "up" | "down";
};
declare type newAppAttrs = {
    nowPlaying?: {
        imageKey: string;
    };
};
export { MappingInterface, IntegrationOptions, newAppAttrs, nuimoOptions, roonOptions };
declare type nuimoAction = "select" | "swipeRight" | "swipeLeft";
declare type roonControl = "play" | "pause" | "playpause" | "stop" | "previous" | "next";
export type Routing = Record<nuimoAction, roonControl>;
