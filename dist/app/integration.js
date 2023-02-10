import { Broker } from "./broker.js";
import { BrokerConfig } from "./brokerConfig.js";
import { RoonNuimoIntegration } from "./integrations/roonNuimoIntegration.js";
import Rx from "rxjs";
class NullIntegration {
    up() {
        return Rx.Subscription.EMPTY;
    }
    down() {
        return new Promise((_x, _y) => undefined);
    }
}
class Integration {
    options;
    broker;
    constructor(options, broker) {
        this.options = options;
        this.broker = broker;
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
        const i = this.integration();
        return this.broker.connect().then(() => {
            i.up();
            return i;
        });
    }
    integration() {
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
//# sourceMappingURL=integration.js.map