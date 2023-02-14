import { Broker } from "../broker.js";
import { MappingInterface } from "./interface.js";
import {
  filter,
  map,
  merge,
  Observable,
  partition,
  Subscription,
  tap,
} from "rxjs";
import { logger } from "../utils.js";

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

  private observe = (brokerEvents: Observable<any>): Observable<any> => {
    const [operationObservable, reactionObservable] = partition(
      brokerEvents,
      ([topic, _]) => topic === this.operationTopic,
    );

    return merge(
      this.observeRoonState(reactionObservable),
      this.observeRoonVolume(reactionObservable),
      this.observeNuimoRotate(operationObservable),
      this.observeNuimoCommand(operationObservable),
    );
  };

  private observeNuimoCommand(operationObservable: Observable<any>) {
    const mapping = {
      select: "playpause",
      swipeRight: "next",
      swipeLeft: "previous",
    };
    return operationObservable.pipe(
      filter(
        ([_, payload]) => JSON.parse(payload.toString()).subject !== "rotate",
      ),
      map(([_, payload]) => JSON.parse(payload.toString()).subject),
      tap((subject) => this.command(mapping[subject])),
    );
  }

  private observeNuimoRotate(operationObservable: Observable<any>) {
    return operationObservable.pipe(
      filter(
        ([_, payload]) => JSON.parse(payload.toString()).subject === "rotate",
      ),
      map(([_, payload]) => JSON.parse(payload.toString())),
      filter(
        (p: { parameter: any }) =>
          p.parameter && typeof p.parameter === "object",
      ),
      map((p: { parameter: object }) => p.parameter[0]),
      tap((volume) => this.setVolume(volume)),
    );
  }

  private observeRoonVolume(reactionObservable: Observable<any>) {
    return reactionObservable.pipe(
      filter(([topic, _]) => topic === this.roonVolumeTopic),
      map(([_, payload]) => payload.toString()),
      map((volume) =>
        JSON.stringify({
          status: "volumeChange",
          percentage: volume,
        }),
      ),
      map((v: string) => this.nuimoReaction(v)),
    );
  }

  private observeRoonState(reactionObservable: Observable<any>) {
    return reactionObservable.pipe(
      filter(([topic, _]) => topic === this.roonStateTopic),
      map(([_, payload]) => payload.toString()),
      map((roonState) =>
        this.nuimoReaction(JSON.stringify({ status: roonState })),
      ),
    );
  }

  down() {
    logger.info(`RoonNuimoIntegration down: ${this.desc}`);
    return this.broker.unsubscribe(this.topicsToSubscribe);
  }

  private command(payload: string) {
    this.broker.publish(this.commandTopic, payload);
  }

  private nuimoReaction(payload: string) {
    this.broker.publish(this.nuimoReactionTopic, payload);
  }

  private setVolume(volume: number) {
    const relativeVolume = volume * 60;
    this.broker.publish(this.volumeSetTopic, relativeVolume.toString());
  }
}
