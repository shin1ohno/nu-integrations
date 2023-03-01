import { Broker } from "./broker.js";
declare type nuimoOptions = {
    name: "nuimo";
    id: string;
};
declare type roonOptions = {
    name: "roon";
    zone: string;
    output: string;
    nowPlaying?: {
        imageKey?: string;
    };
};
declare type IntegrationOptions = {
    uuid: string;
    app: roonOptions;
    controller: nuimoOptions;
    updatedAt?: number;
    ownerUUID?: string;
    status: "up" | "down";
};
declare class Integration {
    readonly uuid: string;
    private readonly options;
    private readonly broker;
    private readonly mapping;
    private status;
    private readonly killTopic;
    private readonly ownerUUID;
    constructor(options: IntegrationOptions, broker: Broker);
    static mutate(attr: any): IntegrationOptions;
    static all(ownerUUID?: string): Promise<Integration[]>;
    private static getBrokerConfig;
    static find(uuid: string, ownerUUID?: string): Promise<Integration>;
    up(): Promise<Integration>;
    down(): Promise<void>;
    updateDataSource(newAppAttr?: Record<string, any>): Promise<unknown>;
    pushKillMessage(): Promise<unknown>;
    private observeKillSwitch;
    awaken(): boolean;
    next(): Promise<Integration>;
    private routeMapping;
    private mutate;
}
export { Integration, roonOptions, nuimoOptions };
