import { Broker } from "./broker.js";
import { BrokerConfig } from "./brokerConfig.js";
import { RoonNuimoMapping } from "./mappings/roonNuimoMapping.js";
import { NullMapping } from "./mappings/null.js";
import { logger } from "./utils.js";
class Integration {
    options;
    broker;
    mapping;
    constructor(options, broker) {
        this.options = options;
        this.broker = broker;
        this.mapping = this.routeMapping();
        this.mapping.integration = this;
    }
    static all() {
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
        ].map((c) => new Integration(c, new Broker(new BrokerConfig("mqtt://mqbroker.home.local:1883"))));
    }
    up() {
        return this.broker
            .connect()
            .then(() => this.mapping.up())
            .then((_) => logger.info(`Integration up: ${this.mapping.desc}`))
            .then(() => this);
    }
    down() {
        return this.mapping
            .down()
            .then((_) => this.broker.disconnect())
            .then((_) => logger.info(`Integration down: ${this.mapping.desc}`));
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
