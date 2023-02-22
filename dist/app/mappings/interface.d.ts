import { Subscription } from "rxjs";
import { Integration } from "../integration.js";
interface MappingInterface {
    readonly desc: string;
    integration: Integration;
    up(): Subscription;
    down(): Promise<void>;
}
export { MappingInterface };
