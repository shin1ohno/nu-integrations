import {BrokerConfig} from "./brokerConfig.js";
import MQTT, {AsyncMqttClient} from "async-mqtt";
import {pino} from 'pino';

const logger = pino();

class Broker {
    private readonly config: BrokerConfig;
    public client?: AsyncMqttClient;

    constructor(config: BrokerConfig) {
        this.config = config;
    }

    connect(): Promise<void> {
        return MQTT.connectAsync(this.config.url, this.config.options).then(
            (client) => {
                client.on("end", () => {
                    this.client = undefined;
                    logger.info(`Disconnected from MQTT Broker(${this.config.url}) at ${new Date().toISOString()}`);
                })

                logger.info(`Connected to MQTT Broker(${this.config.url}) at ${new Date().toISOString()}`);
                this.client = client;
            }).catch(reason => logger.error(reason));
    }

    disconnect(): Promise<void> {
        return this.client.end();
    }

    subscribe(topic) {
        return this.client.subscribe(topic)
    }

    unsubscribe(topic) {
        return this.client.unsubscribe(topic)
    }

    publish(topic, payload) {
        return this.client.publish(topic, payload)
    }

    on(event, cb): any {
        return this.client.on(event, cb)
    }
}

export {Broker}
