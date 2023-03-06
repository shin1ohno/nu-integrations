/// <reference types="node" resolution-mode="require"/>
import { BrokerConfig } from "./brokerConfig.js";
import { AsyncClient } from "async-mqtt";
import { Observable } from "rxjs";
declare class Broker {
    client?: AsyncClient;
    readonly desc: string;
    private readonly config;
    constructor(config: BrokerConfig);
    connect(): Promise<Broker>;
    disconnect(): Promise<void>;
    connected(): boolean;
    subscribe(topic: string | string[]): Observable<[string, Buffer]>;
    unsubscribe(topic: string | string[]): Promise<void>;
    publish(topic: string, payload: string): Promise<void>;
    private on;
}
export { Broker };
