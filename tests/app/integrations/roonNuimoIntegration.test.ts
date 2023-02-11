import { RoonNuimoIntegration } from "app/integrations/roonNuimoIntegration";
import { Broker } from "app/broker";
import { BrokerConfig } from "app/brokerConfig";
import { of } from "rxjs";

describe("RoonNuimoIntegration", () => {
  it("", async () => {
    const b = new Broker(new BrokerConfig());
    const i = new RoonNuimoIntegration({
      nuimo: "xxx",
      zone: "yyy",
      output: "zzz",
      broker: b,
    });

    b.publish = jest.fn();
    b.unsubscribe = jest
      .fn()
      .mockImplementation(() => new Promise((x, _y) => x(undefined)));

    const observation = i["observe"];

    [
      [
        ["roon/yyy/outputs/zzz/volume/percent", Buffer.from("80")],
        "nuimo/xxx/reaction",
        JSON.stringify({ status: "volumeChange", percentage: "80" }),
      ],
      [
        ["roon/yyy/state", Buffer.from("playing")],
        "nuimo/xxx/reaction",
        JSON.stringify({ status: "playing" }),
      ],
      [
        [
          "nuimo/xxx/operation",
          Buffer.from(JSON.stringify({ subject: "select" })),
        ],
        "roon/yyy/command",
        "playpause",
      ],
      [
        [
          "nuimo/xxx/operation",
          Buffer.from(JSON.stringify({ subject: "rotate", parameter: [2, 3] })),
        ],
        "roon/yyy/outputs/zzz/volume/set/relative",
        "120",
      ],
    ].forEach(([input, out, outParam]) => {
      observation(of(input));
      expect(b.publish).toHaveBeenLastCalledWith(out, outParam);
    });

    await i.down().then(() => {
      expect(b.unsubscribe).toHaveBeenCalledWith([
        "nuimo/xxx/operation",
        "roon/yyy/state",
        "roon/yyy/outputs/zzz/volume/percent",
      ]);
    });
  });
});
