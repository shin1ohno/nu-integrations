import { MappingInterface } from "./interface.js";
import Rx, { Subscription } from "rxjs";

class NullMapping implements MappingInterface {
  public readonly desc = "NULL";

  up(): Subscription {
    return Rx.Subscription.EMPTY;
  }

  down(): Promise<void> {
    return new Promise((x, _y) => x(undefined));
  }
}

export { NullMapping };
