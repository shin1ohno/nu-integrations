import { Broker } from "./broker.js";
import { BrokerConfig } from "./brokerConfig.js";
import { RoonNuimoMapping } from "./mappings/roonNuimoMapping.js";
import { NullMapping } from "./mappings/null.js";
import { filter, map, tap } from "rxjs";
import { logger } from "./utils.js";
import IntegrationStore, { OWNER, } from "./dataStores/integrationStore.js";
class Integration {
    uuid;
    options;
    broker;
    mapping;
    status;
    killTopic;
    ownerUUID;
    constructor(options, broker) {
        this.options = options;
        this.broker = broker;
        this.uuid = options.uuid;
        this.ownerUUID = options.ownerUUID;
        this.killTopic = `nuIntegrations/${this.options.uuid}/kill`;
        this.mapping = this.routeMapping();
        this.mapping.integration = this;
        this.status = options.status;
    }
    static mutate(attr) {
        return {
            uuid: attr.integrationUUID,
            app: attr.app,
            controller: attr.controller,
            updatedAt: attr.updatedAt,
            ownerUUID: attr.ownerUUID,
            status: attr.status,
        };
    }
    static all(ownerUUID = OWNER) {
        return IntegrationStore.findAllForOwner(ownerUUID).then((attrs) => {
            return attrs
                .map((attr) => Integration.mutate(attr))
                .map((c) => new Integration(c, new Broker(this.getBrokerConfig())));
        });
    }
    static getBrokerConfig() {
        if (process.env.NODE_ENV === "test") {
            return new BrokerConfig();
        }
        return new BrokerConfig("mqtt://mqbroker.home.local:1883");
    }
    static find(uuid, ownerUUID = OWNER) {
        return IntegrationStore.find({
            integrationUUID: uuid,
            ownerUUID: ownerUUID,
        }).then((attr) => new Integration(Integration.mutate(attr), new Broker(this.getBrokerConfig())));
    }
    up() {
        return this.broker
            .connect()
            .then((_) => this.mapping.up())
            .then((_) => this.observeKillSwitch(this.broker.subscribe(this.killTopic)))
            .then((_) => logger.info(`Integration up: ${this.mapping.desc}`))
            .then((_) => (this.status = "up"))
            .then((_) => this.updateDataSource())
            .then(() => this);
    }
    async down() {
        await this.mapping.down();
        await this.broker.disconnect().then((_) => (this.status = "down"));
        return this.updateDataSource()
            .then((_) => logger.info(`Integration down: ${this.mapping.desc}`))
            .catch((e) => logger.error(`Integration down: ${e}`));
    }
    async updateDataSource(newAppAttr) {
        return await IntegrationStore.update(this.mutate(newAppAttr));
    }
    async pushKillMessage() {
        const needsConnect = !this.awaken();
        if (needsConnect) {
            await this.broker.connect();
            this.observeKillSwitch(this.broker.subscribe(this.killTopic));
        }
        return new Promise((resolve) => {
            this.broker
                .publish(this.killTopic, JSON.stringify({ all: true }))
                .then(() => resolve(this.broker));
        });
    }
    observeKillSwitch(observable) {
        return observable
            .pipe(filter(([topic, _]) => topic === this.killTopic), map(([_, payload]) => JSON.parse(payload.toString())), filter((payload) => payload.all), tap((_) => this.down()))
            .subscribe((_) => {
            logger.info(`Kill switch detected. Executing down procedure.`);
        });
    }
    awaken() {
        return this.status === "up";
    }
    next() {
        return Integration.all().then((all) => {
            const controlled = all
                .filter((i) => i.options.controller.name === this.options.controller.name)
                .filter((i) => i.options.controller.id === this.options.controller.id);
            const n = controlled.indexOf(this);
            if (controlled.length === n + 1) {
                return controlled.at(0);
            }
            else {
                return controlled.at(n + 1);
            }
        });
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
    mutate(newAppAttr) {
        return {
            ownerUUID: this.ownerUUID,
            updatedAt: Date.now() / 1000,
            integrationUUID: this.uuid,
            status: this.status,
            app: Object.assign(this.options.app, newAppAttr),
            controller: this.options.controller,
        };
    }
}
export { Integration };
