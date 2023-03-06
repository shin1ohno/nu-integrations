import { BrokerConfig } from "./brokerConfig.js";
import MQTT, { AsyncClient } from "async-mqtt";
import { pino } from "pino";
import { fromEvent, Observable } from "rxjs";

const logger = pino();

class Broker {
  public client?: AsyncClient;
  public readonly desc: string;
  private readonly config: BrokerConfig;

  constructor(config: BrokerConfig) {
    this.config = config;
    this.desc = this.config.url;
  }

  connect(): Promise<Broker> {
    return new Promise((resolve, _) => {
      MQTT.connectAsync(this.config.url, this.config.options).then((c) => {
        this.client = c;

        this.client.on("end", () => {
          logger.info(
            `Disconnecting from MQTT Broker(${
              this.config.url
            }) at ${new Date().toISOString()}`,
          );
        });

        this.client.on("error", (e) => {
          logger.error(`Error from MQTT Client(${this.config.url}):`);
          logger.error(e);
        });

        logger.info(
          `Connected to MQTT Broker(${
            this.config.url
          }) at ${new Date().toISOString()}`,
        );

        resolve(this);
      });
    });
  }

  async disconnect(): Promise<void> {
    if (this.connected()) {
      return await this.client?.end();
    } else {
      return await new Promise((x, _) => x(undefined));
    }
  }

  connected(): boolean {
    if (this.client) {
      return this.client.connected;
    } else {
      return false;
    }
  }

  subscribe(topic: string | string[]): Observable<[string, Buffer]> {
    if (this.client) {
      this.client.subscribe(topic);
    } else {
      logger.error(
        "Client is not initiated for this broker. Call connect() before subscribe.",
      );
    }
    return this.on("message");
  }

  unsubscribe(topic: string | string[]): Promise<void> {
    if (this.client) {
      return this.client.unsubscribe(topic);
    } else {
      return new Promise((x, _) => x(undefined));
    }
  }

  publish(topic: string, payload: string): Promise<void> {
    if (this.client) {
      return this.client.publish(topic, payload);
    } else {
      return new Promise((x, _) => x(undefined));
    }
  }

  private on(event: string): Observable<[string, Buffer]> {
    if (this.client) {
      return fromEvent(this.client, event) as Observable<[string, Buffer]>;
    } else {
      throw "No client to subscribe";
    }
  }
}

export { Broker };
