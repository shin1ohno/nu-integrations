import { Broker } from "./broker.js";
import { BrokerConfig } from "./brokerConfig.js";
import { RoonNuimoIntegration } from "./integrations/roonNuimoIntegration.js";
import { pino } from "pino";
import { IntegrationInterface } from "./integrations/interface.js";

const logger = pino();
declare type nuimoOptions = { name: "nuimo"; id: string };
declare type roonOptions = { name: "roon"; zone: string; output: string };
declare type IntegrationOptions = {
  app: roonOptions;
  controller: nuimoOptions;
};

class NullIntegration implements IntegrationInterface {
  up() {
    return new Promise((_x, _y) => undefined);
  }

  down() {
    return new Promise((_x, _y) => undefined);
  }
}

class Integration {
  private readonly options: IntegrationOptions;
  private readonly broker: Broker;

  constructor(options: IntegrationOptions, broker: Broker) {
    this.options = options;
    this.broker = broker;
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

  up(): Promise<IntegrationInterface> {
    const i = this.integration();
    return this.broker.connect().then((): IntegrationInterface => {
      i.up().catch((reason) => {
        this.broker.disconnect();
        logger.error(reason);
      });
      return i;
    });
  }

  private integration() {
    switch (`${this.options.app.name}-${this.options.controller.name}`) {
      case "roon-nuimo":
        return new RoonNuimoIntegration({
          nuimo: this.options.controller.id,
          zone: this.options.app.zone,
          output: this.options.app.output,
          broker: this.broker,
        });
      default:
        return new NullIntegration();
    }
  }
}

export { Integration };
