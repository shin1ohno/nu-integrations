import { MappingInterface } from "./interface.js";
import { Subscription } from "rxjs";
import { Integration } from "../integration.js";
declare class NullMapping implements MappingInterface {
    readonly desc = "NULL";
    integration: Integration;
    up(): Subscription;
    down(): Promise<void>;
}
export { NullMapping };
