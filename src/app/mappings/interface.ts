import { Subscription } from "rxjs";

interface MappingInterface {
  readonly desc: string;
  up(): Subscription;

  down(): Promise<void>;
}

export { MappingInterface };
