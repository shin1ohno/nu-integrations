import { AsyncClient } from "async-mqtt";
import { pino } from "pino";
import { fromEvent } from "rxjs";
import MQTT from "mqtt";
const logger = pino();
class Broker {
    client;
    config;
    desc;
    constructor(config) {
        this.config = config;
        this.desc = this.config.url;
    }
    connect() {
        return new Promise((resolve, _) => {
            const c = MQTT.connect(this.config.url, this.config.options);
            this.client = new AsyncClient(c);
            this.client.on("end", () => {
                logger.info(`Disconnecting from MQTT Broker(${this.config.url}) at ${new Date().toISOString()}`);
            });
            this.client.on("connect", () => {
                logger.info(`Connected to MQTT Broker(${this.config.url}) at ${new Date().toISOString()}`);
                resolve(this);
            });
        });
    }
    async disconnect() {
        if (this.connected()) {
            return await this.client.end(true);
        }
        else {
            return await new Promise((x, _) => x(undefined));
        }
    }
    connected() {
        if (this.client) {
            return this.client.connected;
        }
        else {
            return false;
        }
    }
    subscribe(topic) {
        if (this.client) {
            this.client.subscribe(topic);
        }
        else {
            logger.error("Client is not initiated for this broker. Call connect() before subscribe.");
        }
        return this.on("message");
    }
    unsubscribe(topic) {
        if (this.client) {
            return this.client.unsubscribe(topic);
        }
        else {
            return new Promise((x, _) => x(undefined));
        }
    }
    publish(topic, payload) {
        if (this.client) {
            return this.client.publish(topic, payload);
        }
        else {
            return new Promise((x, _) => x(undefined));
        }
    }
    on(event) {
        return fromEvent(this.client, event);
    }
}
export { Broker };
