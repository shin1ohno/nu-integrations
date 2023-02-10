import { RoonNuimoIntegration } from "app/integrations/roonNuimoIntegration";
import { Broker } from "app/broker";
import { BrokerConfig } from "app/brokerConfig";
import spyOn = jest.spyOn;

describe("RoonNuimoIntegration", () => {
  it("", async () => {
    const b = new Broker(new BrokerConfig());
    const i = new RoonNuimoIntegration({
      nuimo: "xxx",
      zone: "yyy",
      output: "zzz",
      broker: b,
    });

    b.connect = () => new Promise((x, _y) => x(undefined));
    b.publish = jest.fn();
    b.unsubscribe = jest.fn().mockImplementation(() => new Promise((x, _y) => x(undefined)));
    b["on"] = jest.fn();
    const spySubscription = spyOn(b, "subscribe");

    await i.up().catch((reason) => {
      //Client is disconnected so always rejected
      expect(reason).toBe(
        "Client is not initiated for this broker. Call connect() before subscribe.",
      );
      expect(b.subscribe).toHaveBeenCalled();
      expect(spySubscription.mock.calls[0][0]).toEqual([
        "nuimo/xxx/operation",
        "roon/yyy/state",
        "roon/yyy/outputs/zzz/volume/percent",
      ]);

      const cb = spySubscription.mock.calls[0][1];
      [
        ["select", "playpause"],
        ["swipeRight", "next"],
        ["swipeLeft", "previous"],
      ].forEach((i) => {
        cb("nuimo/xxx/operation", JSON.stringify({ subject: i[0] }));
        expect(b.publish).toHaveBeenLastCalledWith("roon/yyy/command", i[1]);
      });

      cb(
        "nuimo/xxx/operation",
        JSON.stringify({ subject: "rotate", parameter: [10, 0] }),
      );
      expect(b.publish).toHaveBeenLastCalledWith(
        "roon/yyy/outputs/zzz/volume/set/relative",
        "800",
      );

      cb("roon/yyy/state", "stopped");
      expect(b.publish).toHaveBeenLastCalledWith(
        "nuimo/xxx/reaction",
        JSON.stringify({ status: "stopped" }),
      );

      cb("roon/yyy/outputs/zzz/volume/percent", 10);
      expect(b.publish).toHaveBeenLastCalledWith(
        "nuimo/xxx/reaction",
        JSON.stringify({
          status: "volumeChange",
          percentage: "10",
        }),
      );
    });

    await i.down().then(() => {
      expect(b.unsubscribe).toHaveBeenCalledWith(["nuimo/xxx/operation", "roon/yyy/state", "roon/yyy/outputs/zzz/volume/percent"]);
    })
  });
});
