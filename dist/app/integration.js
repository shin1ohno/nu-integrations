import { Broker } from "./broker.js";
import { BrokerConfig } from "./brokerConfig.js";
import { RoonNuimoMapping } from "./mappings/roonNuimoMapping.js";
import { NullMapping } from "./mappings/null.js";
import { filter, map, tap } from "rxjs";
import { logger } from "./utils.js";
class Integration {
    options;
    broker;
    mapping;
    status;
    killTopic;
    constructor(options, broker) {
        this.options = options;
        this.broker = broker;
        this.killTopic = `nuIntegrations/${this.options.id}/kill`;
        this.mapping = this.routeMapping();
        this.mapping.integration = this;
    }
    static all() {
        return [
            {
                id: 1,
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
                id: 2,
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
                id: 3,
                app: {
                    name: "roon",
                    zone: "Qutest",
                    output: "Qutest",
                },
                controller: {
                    name: "nuimo",
                    id: "c24d4dce93b159c147a916d714a32ce9",
                },
            },
            {
                id: 4,
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
        ].map((c) => new Integration(c, new Broker(new BrokerConfig("mqtt://mqbroker.home.local:1883"))));
    }
    up() {
        return this.pushKillMessage()
            .then((b) => b.connect())
            .then((_) => this.mapping.up())
            .then((_) => this.observeKillSwitch(this.broker.subscribe(this.killTopic)))
            .then((_) => logger.info(`Integration up: ${this.mapping.desc}`))
            .then((_) => (this.status = "up"))
            .then(() => this);
    }
    pushKillMessage() {
        return this.broker
            .connect()
            .then((_) => {
            return this.broker.publish(this.killTopic, JSON.stringify({ all: true }));
        })
            .then((_) => this.broker.disconnect())
            .then((_) => this.broker);
    }
    observeKillSwitch(observable) {
        return observable
            .pipe(filter(([topic, _]) => topic === this.killTopic), map(([_, payload]) => JSON.parse(payload.toString())), filter((payload) => payload.all), tap((_) => this.down()))
            .subscribe((_) => logger.info(`Kill switch detected. Executing down procedure.`));
    }
    down() {
        return this.mapping
            .down()
            .then((_) => this.broker.disconnect())
            .then((_) => (this.status = "down"))
            .then((_) => logger.info(`Integration down: ${this.mapping.desc}`));
    }
    awaken() {
        return this.status === "up";
    }
    next() {
        const controlled = Integration.all()
            .filter((i) => i.options.controller.name === this.options.controller.name)
            .filter((i) => i.options.controller.id === this.options.controller.id);
        const n = controlled.indexOf(this);
        if (controlled.length === n + 1) {
            return controlled.at(0);
        }
        else {
            return controlled.at(n + 1);
        }
    }
    routeMapping() {
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
