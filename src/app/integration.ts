import { Broker } from "./broker.js";
import { BrokerConfig } from "./brokerConfig.js";
import { RoonNuimoMapping } from "./mappings/roonNuimoMapping.js";
import { MappingInterface } from "./mappings/interface.js";
import { NullMapping } from "./mappings/null.js";
import {
  catchError,
  filter,
  map,
  Observable,
  pipe,
  Subscription,
  take,
} from "rxjs";
import { logger } from "./utils.js";
import IntegrationStore, {
  OWNER,
  Result,
} from "./dataStores/integrationStore.js";

declare type nuimoOptions = { name: "nuimo"; id: string };
declare type roonOptions = { name: "roon"; zone: string; output: string };
declare type IntegrationOptions = {
  uuid: string;
  app: roonOptions;
  controller: nuimoOptions;
  updatedAt?: number;
  ownerUUID?: string;
  status: "up" | "down";
};

class Integration {
  readonly uuid: string;
  private readonly options: IntegrationOptions;
  private readonly broker: Broker;
  private readonly mapping: MappingInterface;
  private status: "up" | "down";
  private readonly killTopic: string;
  private readonly ownerUUID: string;

  constructor(options: IntegrationOptions, broker: Broker) {
    this.options = options;
    this.broker = broker;
    this.uuid = options.uuid;
    this.ownerUUID = options.ownerUUID;
    this.killTopic = `nuIntegrations/${this.options.uuid}/kill`;
    this.mapping = this.routeMapping();
    this.mapping.integration = this;
    this.status = options.status;
  }

  static mutate(attr): IntegrationOptions {
    return {
      uuid: attr.integrationUUID,
      app: attr.app,
      controller: attr.controller,
      updatedAt: attr.updatedAt,
      ownerUUID: attr.ownerUUID,
      status: attr.status,
    };
  }

  static all(ownerUUID: string = OWNER): Promise<Integration[]> {
    return IntegrationStore.findAllForOwner(ownerUUID).then((attrs) => {
      return attrs
        .map((attr) => Integration.mutate(attr))
        .map((c) => new Integration(c, new Broker(this.getBrokerConfig())));
    });
  }

  private static getBrokerConfig(): BrokerConfig {
    if (process.env.NODE_ENV === "test") {
      return new BrokerConfig();
    }

    return new BrokerConfig("mqtt://mqbroker.home.local:1883");
  }

  static find(uuid: string, ownerUUID: string = OWNER): Promise<Integration> {
    return IntegrationStore.find({
      integrationUUID: uuid,
      ownerUUID: ownerUUID,
    }).then(
      (attr) =>
        new Integration(
          Integration.mutate(attr),
          new Broker(this.getBrokerConfig()),
        ),
    );
  }

  up(): Promise<Integration> {
    // return this.pushKillMessage()
    //   .then((b) => b.connect())
    return this.broker
      .connect()
      .then((_) => this.mapping.up())
      .then((_) =>
        this.observeKillSwitch(this.broker.subscribe(this.killTopic)),
      )
      .then((_): void => logger.info(`Integration up: ${this.mapping.desc}`))
      .then((_) => (this.status = "up"))
      .then((_) => this.updateDataSource())
      .then((): Integration => this);
  }

  async down(): Promise<void> {
    return this.mapping
      .down()
      .then((_) => this.broker.disconnect())
      .then((_) => (this.status = "down"))
      .then((_) => this.updateDataSource())
      .then((_): void => logger.info(`Integration down: ${this.mapping.desc}`))
      .catch((e) => logger.error(`Integration down: ${e}`));
  }

  private updateDataSource(): void {
    IntegrationStore.update(this.mutate());
  }

  async pushKillMessage(): Promise<unknown> {
    return new Promise((resolve, reject) => {
      this.broker
        .connect()
        // .then(_ => this.observeKillSwitch(this.broker.subscribe(this.killTopic)))
        .then((_) => {
          return this.broker.publish(
            this.killTopic,
            JSON.stringify({ all: true }),
          );
        })
        .then((_) => resolve(this.broker))
        .catch((e) => reject(e));
    });
  }

  private observeKillSwitch(
    observable: Observable<[string, Buffer]>,
  ): Subscription {
    return observable
      .pipe(
        take(1),
        filter(([topic, _]) => topic === this.killTopic),
        map(([_, payload]) => JSON.parse(payload.toString())),
        filter((payload) => payload.all),
        // tap((_) => this.down()),
        pipe(
          catchError((e, x) => {
            logger.error(`observeKill: ${e}`);
            return x;
          }),
          take(5),
        ),
      )
      .subscribe((_) => {
        this.down();
        logger.info(`Kill switch detected. Executing down procedure.`);
      });
  }

  awaken(): boolean {
    return this.status === "up";
  }

  next(): Promise<Integration> {
    return Integration.all().then((all) => {
      const controlled = all
        .filter(
          (i) => i.options.controller.name === this.options.controller.name,
        )
        .filter((i) => i.options.controller.id === this.options.controller.id);
      const n = controlled.indexOf(this);

      if (controlled.length === n + 1) {
        return controlled.at(0) as Integration;
      } else {
        return controlled.at(n + 1) as Integration;
      }
    });
  }

  private routeMapping(): MappingInterface {
    switch (`${this.options.app.name}-${this.options.controller.name}`) {
      case "roon-nuimo":
        return new RoonNuimoMapping({
          nuimo: this.options.controller.id,
          zone: this.options.app.zone,
          output: this.options.app.output,
          broker: this.broker,
        });
      default:
        return new NullMapping();
    }
  }

  private mutate(): Result {
    return {
      ownerUUID: this.ownerUUID,
      updatedAt: Date.now() / 1000, //TODO
      integrationUUID: this.uuid,
      status: this.status,
      app: this.options.app,
      controller: this.options.controller,
    };
  }
}

export { Integration, roonOptions, nuimoOptions };
