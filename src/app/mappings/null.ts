import { MappingInterface } from "./interface.js";
import Rx, { Subscription } from "rxjs";
import { Integration } from "../integration.js";

class NullMapping implements MappingInterface {
  public readonly desc = "NULL";
  public integration: Integration;

  up(): Subscription {
    return Rx.Subscription.EMPTY;
  }

  down(): Promise<void> {
    return new Promise((x, _y) => x(undefined));
  }
}

export { NullMapping };
