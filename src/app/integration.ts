import { Broker } from "./broker.js";
import { BrokerConfig } from "./brokerConfig.js";
import { RoonNuimoMapping } from "./mappings/roonNuimoMapping.js";
import { MappingInterface } from "./mappings/interface.js";
import { NullMapping } from "./mappings/null.js";
import { Subscription } from "rxjs";
import { logger } from "./utils.js";

declare type nuimoOptions = { name: "nuimo"; id: string };
declare type roonOptions = { name: "roon"; zone: string; output: string };
declare type IntegrationOptions = {
  app: roonOptions;
  controller: nuimoOptions;
};

class Integration {
  private readonly options: IntegrationOptions;
  private readonly broker: Broker;
  private readonly mapping: MappingInterface;

  constructor(options: IntegrationOptions, broker: Broker) {
    this.options = options;
    this.broker = broker;
    this.mapping = this.routeMapping();
  }

  static all(): Integration[] {
    return [
      {
        app: {
          name: "roon",
          zone: "Bathys",
          output: "Bathys",
        },
        controller: {
          name: "nuimo",
          id: "fd6fcaa92b28",
        },
      },
      {
        app: {
          name: "roon",
          zone: "Qutest",
          output: "Qutest",
        },
        controller: {
          name: "nuimo",
          id: "e39f52d6ecb8",
        },
      },
      {
        app: {
          name: "roon",
          zone: "Qutest (BNC)",
          output: "Qutest (BNC)",
        },
        controller: {
          name: "nuimo",
          id: "c381df4eff6a",
        },
      },
    ].map(
      (c: IntegrationOptions) =>
        new Integration(
          c,
          new Broker(new BrokerConfig("mqtt://mqbroker.home.local:1883")),
        ),
    );
  }

  up(): Promise<Integration> {
    return this.broker
      .connect()
      .then((): Subscription => this.mapping.up())
      .then((_): void => logger.info(`Integration up: ${this.mapping.desc}`))
      .then((): Integration => this);
  }

  down(): Promise<void> {
    return this.mapping.down();
  }

  next(): Integration {
    const controlled = Integration.all()
      .filter((i) => i.options.controller.name === this.options.controller.name)
      .filter((i) => i.options.controller.id === this.options.controller.id);
    const n = controlled.indexOf(this);

    if (controlled.length === n + 1) {
      const i = controlled.at(0);
      return i as Integration;
    } else {
      const i = controlled.at(n + 1);
      return i as Integration;
    }
  }

  switchToNext(): Promise<Integration> {
    this.down();
    const m = this.next();
    return m.up();
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
}

export { Integration };
