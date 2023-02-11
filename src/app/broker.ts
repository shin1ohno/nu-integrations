import { BrokerConfig } from "./brokerConfig.js";
import MQTT, { AsyncMqttClient } from "async-mqtt";
import { pino } from "pino";
import Rx, { Observable } from "rxjs";

const logger = pino();

class Broker {
  public client?: AsyncMqttClient;
  private readonly config: BrokerConfig;
  desc: string;

  constructor(config: BrokerConfig) {
    this.config = config;
    this.desc = this.config.url;
  }

  connect(): Promise<void> {
    return MQTT.connectAsync(this.config.url, this.config.options)
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
      })
      .catch((reason) => logger.error(reason));
  }

  disconnect(): Promise<void> {
    return this.client.end();
  }

  subscribe(topic): Observable<[string, Buffer]> {
    if (this.client) {
      this.client.subscribe(topic);
    } else {
      logger.error(
        "Client is not initiated for this broker. Call connect() before subscribe.",
      );
    }
    return this.on("message");
  }

  unsubscribe(topic) {
    return this.client.unsubscribe(topic);
  }

  publish(topic, payload) {
    return this.client.publish(topic, payload);
  }

  private on(event): Observable<any> {
    return Rx.fromEvent(this.client, event);
  }
}

export { Broker };
