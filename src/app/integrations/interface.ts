import { Subscription } from "rxjs";

interface IntegrationInterface {
  up(): Subscription;

  down(): Promise<any>;
}

export { IntegrationInterface };
