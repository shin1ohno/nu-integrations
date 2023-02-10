import {RoonNuimoIntegration} from "app/integrations/roonNuimoIntegration";
import {Broker} from "app/broker";
import {BrokerConfig} from "app/brokerConfig";
import spyOn = jest.spyOn;

jest.mock("app/broker")

describe("RoonNuimoIntegration", () => {
    it("", async () => {
        const b = new Broker(new BrokerConfig())
        const i = new RoonNuimoIntegration({
            nuimo: "xxx",
            zone: "yyy",
            output: "zzz",
            broker: b
        })

        spyOn(b, "subscribe").mockImplementation(() => new Promise((x, _y) => x(undefined)))
        const spy = spyOn(b, "on")

        await i.up().then(() => {
            expect(b.subscribe).toHaveBeenCalledWith([
                "nuimo/xxx/operation",
                "roon/yyy/state",
                "roon/yyy/outputs/zzz/volume/percent",
            ]);

            expect(spy.mock.calls[0][0]).toBe("message");

            const cb = spy.mock.calls[0][1];

            [
                ["select", "playpause"],
                ["swipeRight", "next"],
                ["swipeLeft", "previous"],
            ].forEach(i => {
                cb("nuimo/xxx/operation", JSON.stringify({subject: i[0]}));
                expect(b.publish).toHaveBeenLastCalledWith("roon/yyy/command", i[1]);
            })

            cb("nuimo/xxx/operation", JSON.stringify({subject: "rotate", parameter: [10, 0]}));
            expect(b.publish).toHaveBeenLastCalledWith("roon/yyy/outputs/zzz/volume/set/relative", "800");

            cb("roon/yyy/state", "stopped")
            expect(b.publish).toHaveBeenLastCalledWith("nuimo/xxx/reaction", JSON.stringify({status: "stopped"}));

            cb("roon/yyy/outputs/zzz/volume/percent", 10)
            expect(b.publish).toHaveBeenLastCalledWith("nuimo/xxx/reaction", JSON.stringify({
                status: "volumeChange",
                percentage: "10"
            }));
        })
    })
})
