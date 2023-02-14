import { MappingInterface } from "./interface.js";
import Rx from "rxjs";

class NullMapping implements MappingInterface {
  public readonly desc = "NULL";

  up() {
    return Rx.Subscription.EMPTY;
  }

  down() {
    return new Promise((_x, _y) => undefined);
  }
}

export { NullMapping };
