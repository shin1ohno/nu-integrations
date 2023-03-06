import { Broker } from "./broker.js";
import { IntegrationOptions, newAppAttrs } from "./mappings/interface.js";
declare class Integration {
    readonly uuid: string;
    readonly options: IntegrationOptions;
    status: "up" | "down";
    private readonly broker;
    private readonly mapping;
    private readonly killTopic;
    private readonly ownerUUID;
    constructor(options: IntegrationOptions, broker: Broker);
    static mutate(attr: any): IntegrationOptions;
    static all(ownerUUID?: string): Promise<Integration[]>;
    static find(uuid: string, ownerUUID?: string): Promise<Integration>;
    up(): Promise<Integration>;
    updateDataSource(newAppAttr?: newAppAttrs): Promise<unknown>;
    pushKillMessage(): Promise<unknown>;
    awaken(): boolean;
    private down;
    private observeKillSwitch;
    private routeMapping;
    private mutate;
}
export { Integration };
