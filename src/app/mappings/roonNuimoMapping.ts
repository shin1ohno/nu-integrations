import { Broker } from "../broker.js";
import { MappingInterface } from "./interface.js";
import {
  filter,
  map,
  mergeAll,
  Observable,
  of,
  partition,
  Subscription,
  tap,
} from "rxjs";
import { logger } from "../utils.js";
import { Integration } from "../integration.js";

export class RoonNuimoMapping implements MappingInterface {
  private readonly commandTopic: string;
  private readonly operationTopic: string;
  private readonly broker: Broker;
  private readonly volumeSetTopic: string;
  private readonly roonStateTopic: string;
  private readonly roonVolumeTopic: string;
  private readonly topicsToSubscribe: string[];
  private readonly nuimoReactionTopic: string;
  public readonly desc: string;
  public integration: Integration;

  constructor(options: {
    nuimo: string;
    zone: string;
    output: string;
    broker: Broker;
  }) {
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

  up(): Subscription {
    return this.observe(
      this.broker.subscribe(this.topicsToSubscribe),
    ).subscribe((x) => logger.info(x));
  }

  down(): Promise<void> {
    return this.broker.unsubscribe(this.topicsToSubscribe);
  }

  private observe = (
    brokerEvents: Observable<[string, Buffer]>,
  ): Observable<string> => {
    const [operationObservable, reactionObservable] = partition(
      brokerEvents,
      ([topic, _]) => topic === this.operationTopic,
    );

    return of(
      this.observeRoonState(reactionObservable),
      this.observeRoonVolume(reactionObservable),
      this.observeNuimoRotate(operationObservable),
      this.observeNuimoCommand(operationObservable),
    ).pipe(mergeAll());
  };

  private observeNuimoCommand(
    operationObservable: Observable<[string, Buffer]>,
  ): Observable<string> {
    const mapping = {
      select: "playpause",
      swipeRight: "next",
      swipeLeft: "previous",
      longTouchBottom: "switchApp",
    };
    return operationObservable.pipe(
      filter(
        ([_, payload]) => JSON.parse(payload.toString()).subject !== "rotate",
      ),
      map(
        ([_, payload]): string =>
          mapping[JSON.parse(payload.toString()).subject],
      ),
      filter((c) => typeof c !== "undefined"),
      tap((command) => {
        if (command === "switchApp") {
          logger.info(`Switching from :${this.desc}`);
        } else {
          this.command(command);
        }
      }),
    );
  }

  private observeNuimoRotate(
    operationObservable: Observable<[string, Buffer]>,
  ): Observable<string> {
    return operationObservable.pipe(
      filter(
        ([_, payload]) => JSON.parse(payload.toString()).subject === "rotate",
      ),
      map(([_, payload]) => JSON.parse(payload.toString())),
      filter(
        (p: { parameter: Record<string, string> }) =>
          p.parameter && typeof p.parameter === "object",
      ),
      map((p: { parameter: object }): number => p.parameter[0]),
      tap((volume: number) => this.setVolume(volume)),
      map((volume) => volume.toString()),
    );
  }

  private observeRoonVolume(
    reactionObservable: Observable<[string, Buffer]>,
  ): Observable<string> {
    return reactionObservable.pipe(
      filter(([topic, _]) => topic === this.roonVolumeTopic),
      map(([_, payload]) => payload.toString()),
      map((volume) =>
        JSON.stringify({
          status: "volumeChange",
          percentage: volume,
        }),
      ),
      map((v: string): string => this.nuimoReaction(v)),
    );
  }

  private observeRoonState(
    reactionObservable: Observable<[string, Buffer]>,
  ): Observable<string> {
    return reactionObservable.pipe(
      filter(([topic, _]) => topic === this.roonStateTopic),
      map(([_, payload]) => payload.toString()),
      map((roonState): string =>
        this.nuimoReaction(JSON.stringify({ status: roonState })),
      ),
    );
  }

  private command(payload: string): string {
    this.broker.publish(this.commandTopic, payload);
    return payload;
  }

  private nuimoReaction(payload: string): string {
    this.broker.publish(this.nuimoReactionTopic, payload);
    return payload;
  }

  private setVolume(volume: number): string {
    const relativeVolume = volume * 60;
    this.broker.publish(this.volumeSetTopic, relativeVolume.toString());
    return relativeVolume.toString();
  }
}
