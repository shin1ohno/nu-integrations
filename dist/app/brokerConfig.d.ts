import { IClientOptions } from "async-mqtt";
declare class BrokerConfig {
    readonly userName: string | undefined;
    readonly password: string | undefined;
    private defaultURL;
    private readonly brokerURL;
    constructor(brokerURL?: string, userName?: string, password?: string);
    get url(): string;
    get options(): IClientOptions;
    static fromEnv(): BrokerConfig;
}
export { BrokerConfig };
