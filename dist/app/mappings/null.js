import Rx from "rxjs";
class NullMapping {
    desc = "NULL";
    up() {
        return Rx.Subscription.EMPTY;
    }
    down() {
        return new Promise((_x, _y) => undefined);
    }
}
export { NullMapping };
