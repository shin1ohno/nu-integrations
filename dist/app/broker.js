import MQTT from "async-mqtt";
import { pino } from "pino";
import Rx from "rxjs";
const logger = pino();
class Broker {
    client;
    config;
    constructor(config) {
        this.config = config;
    }
    connect() {
        return MQTT.connectAsync(this.config.url, this.config.options)
            .then((client) => {
            client.on("end", () => {
                this.client = undefined;
                logger.info(`Disconnected from MQTT Broker(${this.config.url}) at ${new Date().toISOString()}`);
            });
            logger.info(`Connected to MQTT Broker(${this.config.url}) at ${new Date().toISOString()}`);
            this.client = client;
        })
            .catch((reason) => logger.error(reason));
    }
    disconnect() {
        return this.client.end();
    }
    subscribe(topic) {
        new Promise((resolve, reject) => {
            if (this.client) {
                this.client.subscribe(topic).then((_) => resolve(_));
            }
            else {
                reject("Client is not initiated for this broker. Call connect() before subscribe.");
            }
        });
        return this.on("message");
    }
    unsubscribe(topic) {
        return this.client.unsubscribe(topic);
    }
    publish(topic, payload) {
        return this.client.publish(topic, payload);
    }
    on(event) {
        return Rx.fromEvent(this.client, event);
    }
}
export { Broker };
//# sourceMappingURL=broker.js.map