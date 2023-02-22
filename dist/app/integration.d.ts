import { Broker } from "./broker.js";
declare type nuimoOptions = {
    name: "nuimo";
    id: string;
};
declare type roonOptions = {
    name: "roon";
    zone: string;
    output: string;
};
declare type IntegrationOptions = {
    id: number;
    app: roonOptions;
    controller: nuimoOptions;
};
declare class Integration {
    private readonly options;
    private readonly broker;
    private readonly mapping;
    private status;
    private readonly killTopic;
    constructor(options: IntegrationOptions, broker: Broker);
    static all(): Integration[];
    up(): Promise<Integration>;
    pushKillMessage(): Promise<Broker>;
    private observeKillSwitch;
    down(): Promise<void>;
    awaken(): boolean;
    next(): Integration;
    private routeMapping;
}
export { Integration };
