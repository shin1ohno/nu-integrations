import { Subscription } from "rxjs";
import { Integration } from "../integration.js";

interface MappingInterface {
  readonly desc: string;
  integration: Integration;

  up(): Subscription;

  down(): Promise<void>;
}

declare type nuimoOptions = { name: "nuimo"; id: string };
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
  routing: Routing;
};
declare type newAppAttrs = {
  nowPlaying?: {
    imageKey: string;
  };
};

export {
  MappingInterface,
  IntegrationOptions,
  newAppAttrs,
  nuimoOptions,
  roonOptions,
};

declare type nuimoAction =
  | "hover"
  | "rotate"
  | "rotateLeft"
  | "rotateRight"
  | "select"
  | "selectUp"
  | "selectDown"
  | "swipeUp"
  | "swipeDown"
  | "swipeLeft"
  | "swipeRight"
  | "touchTop"
  | "touchLeft"
  | "touchRight"
  | "touchBottom"
  | "longTouchLeft"
  | "longTouchRight"
  | "longTouchBottom"
  | "dampingFactor";

declare type roonControl =
  | "play"
  | "pause"
  | "playpause"
  | "stop"
  | "previous"
  | "next"
  | "relativeVolumeChange"
  | number;

export type Routing = Partial<Record<nuimoAction, roonControl>>;
