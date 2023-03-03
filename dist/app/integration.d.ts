import { Broker } from "./broker.js";
import { IntegrationOptions, newAppAttrs } from "./mappings/interface.js";
declare class Integration {
    readonly uuid: string;
    readonly options: IntegrationOptions;
    private readonly broker;
    private readonly mapping;
    status: "up" | "down";
    private readonly killTopic;
    private readonly ownerUUID;
    constructor(options: IntegrationOptions, broker: Broker);
    static mutate(attr: any): IntegrationOptions;
    static all(ownerUUID?: string): Promise<Integration[]>;
    private static getBrokerConfig;
    static find(uuid: string, ownerUUID?: string): Promise<Integration>;
    up(): Promise<Integration>;
    private down;
    updateDataSource(newAppAttr?: newAppAttrs): Promise<unknown>;
    pushKillMessage(): Promise<unknown>;
    private observeKillSwitch;
    awaken(): boolean;
    next(): Promise<Integration>;
    private routeMapping;
    private mutate;
}
export { Integration };
