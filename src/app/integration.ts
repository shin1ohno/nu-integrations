import { Broker } from "./broker.js";
import { BrokerConfig } from "./brokerConfig.js";
import { RoonNuimoMapping } from "./mappings/roonNuimoMapping.js";
import {
  IntegrationOptions,
  MappingInterface,
  newAppAttrs,
} from "./mappings/interface.js";
import { NullMapping } from "./mappings/null.js";
import { filter, map, Observable, Subscription, tap } from "rxjs";
import { logger } from "./utils.js";
import IntegrationStore, {
  OWNER,
  Result,
} from "./dataStores/integrationStore.js";

class Integration {
  readonly uuid: string;
  readonly options: IntegrationOptions;
  status: "up" | "down";
  private readonly broker: Broker;
  private readonly mapping: MappingInterface;
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
      routing: attr.routing,
    };
  }

  static all(ownerUUID: string = OWNER): Promise<Integration[]> {
    return IntegrationStore.findAllForOwner(ownerUUID).then((attrs) => {
      return attrs
        .map((attr) => Integration.mutate(attr))
        .map((c) => new Integration(c, new Broker(BrokerConfig.fromEnv())));
    });
  }

  static find(uuid: string, ownerUUID: string = OWNER): Promise<Integration> {
    return IntegrationStore.find({
      integrationUUID: uuid,
      ownerUUID: ownerUUID,
    }).then((attr) => {
      return new Integration(
        Integration.mutate(attr),
        new Broker(BrokerConfig.fromEnv()),
      );
    });
  }

  up(): Promise<Integration> {
    return this.broker
      .connect()
      .then((_) => this.mapping.up())
      .then((_) =>
        this.observeKillSwitch(this.broker.subscribe(this.killTopic)),
      )
      .then((_): void => logger.info(`Integration up: ${this.mapping.desc}`))
      .then((_) => (this.status = "up"))
      .then((): Integration => this);
  }

  async updateDataSource(newAppAttr?: newAppAttrs): Promise<unknown> {
    return await IntegrationStore.update(this.mutate(newAppAttr));
  }

  async pushKillMessage(): Promise<unknown> {
    const needsConnect = !this.awaken();
    if (needsConnect) {
      await this.broker.connect();
      this.observeKillSwitch(this.broker.subscribe(this.killTopic));
    }

    return new Promise((resolve) => {
      this.broker
        .publish(this.killTopic, JSON.stringify({ all: true }))
        .then(() => resolve(this.broker));
    });
  }

  awaken(): boolean {
    return this.status === "up";
  }

  private async down(): Promise<void> {
    await this.mapping.down();
    await this.broker
      .disconnect()
      .then((_) => (this.status = "down"))
      .then((_): void => logger.info(`Integration down: ${this.mapping.desc}`))
      .catch((e) => logger.error(`Integration down: ${e}`));
  }

  private observeKillSwitch(
    observable: Observable<[string, Buffer]>,
  ): Subscription {
    return observable
      .pipe(
        filter(([topic, _]) => topic === this.killTopic),
        map(([_, payload]) => JSON.parse(payload.toString())),
        filter((payload) => payload.all),
        tap((_) => this.down()),
      )
      .subscribe((_) => {
        logger.info(`Kill switch detected. Executing down procedure.`);
      });
  }

  private routeMapping(): MappingInterface {
    switch (`${this.options.app.name}-${this.options.controller.name}`) {
      case "roon-nuimo":
        return new RoonNuimoMapping({
          nuimo: this.options.controller.id,
          zone: this.options.app.zone,
          output: this.options.app.output,
          routing: this.options.routing,
          broker: this.broker,
        });
      default:
        return new NullMapping();
    }
  }

  private mutate(newAppAttr?: newAppAttrs): Result {
    return {
      ownerUUID: this.ownerUUID,
      updatedAt: Date.now() / 1000, //TODO
      integrationUUID: this.uuid,
      status: this.status,
      routing: this.options.routing,
      app: Object.assign(this.options.app, newAppAttr),
      controller: this.options.controller,
    };
  }
}

export { Integration };
