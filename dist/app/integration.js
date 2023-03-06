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
            routing: attr.routing,
        };
    }
    static all(ownerUUID = OWNER) {
        return IntegrationStore.findAllForOwner(ownerUUID).then((attrs) => {
            return attrs
                .map((attr) => Integration.mutate(attr))
                .map((c) => new Integration(c, new Broker(BrokerConfig.fromEnv())));
        });
    }
    static find(uuid, ownerUUID = OWNER) {
        return IntegrationStore.find({
            integrationUUID: uuid,
            ownerUUID: ownerUUID,
        }).then((attr) => {
            return new Integration(Integration.mutate(attr), new Broker(BrokerConfig.fromEnv()));
        });
    }
    up() {
        return this.broker
            .connect()
            .then((_) => this.mapping.up())
            .then((_) => this.observeKillSwitch(this.broker.subscribe(this.killTopic)))
            .then((_) => logger.info(`Integration up: ${this.mapping.desc}`))
            .then((_) => (this.status = "up"))
            .then(() => this);
    }
    async down() {
        await this.mapping.down();
        await this.broker
            .disconnect()
            .then((_) => (this.status = "down"))
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
    routeMapping() {
        switch (`${this.options.app.name}-${this.options.controller.name}`) {
            case "roon-nuimo":
                return new RoonNuimoMapping({
                    nuimo: this.options.controller.id,
                    zone: this.options.app.zone,
                    output: this.options.app.output,
                    routing: this.options.routing,
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
            routing: this.options.routing,
            app: Object.assign(this.options.app, newAppAttr),
            controller: this.options.controller,
        };
    }
}
export { Integration };
