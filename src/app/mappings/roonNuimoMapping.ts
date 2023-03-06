import { Broker } from "../broker.js";
import { MappingInterface, Routing } from "./interface.js";
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
  private readonly nowPlayingTopic: string;
  private readonly routing: Routing;

  constructor(options: {
    nuimo: string;
    zone: string;
    output: string;
    routing: Routing;
    broker: Broker;
  }) {
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

  up(): Subscription {
    return this.observe(
      this.broker.subscribe(this.topicsToSubscribe),
    ).subscribe();
  }

  async down(): Promise<void> {
    return await this.broker.unsubscribe(this.topicsToSubscribe);
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
    return operationObservable.pipe(
      filter((_) => !!this.routing),
      filter(
        ([_, payload]) => JSON.parse(payload.toString()).subject !== "rotate",
      ),
      map(
        ([_, payload]): string =>
          this.routing[JSON.parse(payload.toString()).subject],
      ),
      filter((c) => typeof c !== "undefined"),
      tap((command) => this.command(command)),
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
