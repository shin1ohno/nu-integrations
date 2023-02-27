import { BrokerConfig } from "./brokerConfig.js";
import MQTT, { AsyncMqttClient } from "async-mqtt";
import { pino } from "pino";
import { fromEvent, Observable } from "rxjs";

const logger = pino();

class Broker {
  public client?: AsyncMqttClient;
  private readonly config: BrokerConfig;
  desc: string;

  constructor(config: BrokerConfig) {
    this.config = config;
    this.desc = this.config.url;
  }

  connect(): Promise<Broker> {
    return new Promise((resolve, reject) => {
      MQTT.connectAsync(this.config.url, this.config.options)
        .then((client) => {
          client.on("end", () => {
            this.client = undefined;
            logger.info(
              `Disconnected from MQTT Broker(${
                this.config.url
              }) at ${new Date().toISOString()}`,
            );
          });

          logger.info(
            `Connected to MQTT Broker(${
              this.config.url
            }) at ${new Date().toISOString()}`,
          );
          this.client = client;
          resolve(this);
        })
        .catch((reason) => reject(reason));
    });
  }

  disconnect(): Promise<void> {
    if (this.client && !this.client.disconnecting) {
      return this.client.end();
    } else {
      return new Promise((x, _) => x(undefined));
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

  private on(event): Observable<[string, Buffer]> {
    return fromEvent(this.client, event) as Observable<[string, Buffer]>;
  }
}

export { Broker };
