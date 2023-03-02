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
  roonNowPlayingAttrs?;
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

export {
  MappingInterface,
  IntegrationOptions,
  newAppAttrs,
  nuimoOptions,
  roonOptions,
};
