import Rx from "rxjs";
class NullMapping {
    desc = "NULL";
    up() {
        return Rx.Subscription.EMPTY;
    }
    down() {
        return new Promise((x, _y) => x(undefined));
    }
}
export { NullMapping };
