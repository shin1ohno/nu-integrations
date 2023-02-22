/// <reference types="node" resolution-mode="require"/>
import { BrokerConfig } from "./brokerConfig.js";
import { AsyncMqttClient } from "async-mqtt";
import { Observable } from "rxjs";
declare class Broker {
    client?: AsyncMqttClient;
    private readonly config;
    desc: string;
    constructor(config: BrokerConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    connected(): boolean;
    subscribe(topic: string | string[]): Observable<[string, Buffer]>;
    unsubscribe(topic: string | string[]): Promise<void>;
    publish(topic: string, payload: string): Promise<void>;
    private on;
}
export { Broker };
