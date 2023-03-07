import { RoonNuimoMapping } from "app/mappings/roonNuimoMapping";
import { Broker } from "app/broker";
import { BrokerConfig } from "app/brokerConfig";
import { of } from "rxjs";

describe("RoonNuimoIntegration", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("has the right routing", async () => {
    const b = new Broker(BrokerConfig.fromEnv());
    const i = new RoonNuimoMapping({
      nuimo: "xxx",
      zone: "yyy",
      output: "zzz",
      broker: b,
      routing: {
        select: "playpause",
        swipeRight: "next",
        swipeLeft: "previous",
        rotate: "relativeVolumeChange",
        dampingFactor: 80,
      },
    });

    jest.spyOn(b, "publish");

    const observation = i["observe"];

    for (const [input, out, outParam] of [
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
          Buffer.from(JSON.stringify({ subject: "swipeRight" })),
        ],
        "roon/yyy/command",
        "next",
      ],
      [
        [
          "nuimo/xxx/operation",
          Buffer.from(JSON.stringify({ subject: "swipeLeft" })),
        ],
        "roon/yyy/command",
        "previous",
      ],
      [
        [
          "nuimo/xxx/operation",
          Buffer.from(JSON.stringify({ subject: "rotate", parameter: [2, 3] })),
        ],
        "roon/yyy/outputs/zzz/volume/set/relative",
        "160",
      ],
    ]) {
      await observation(of(input as [string, Buffer])).subscribe();
      expect(b.publish).toHaveBeenLastCalledWith(out, outParam);
    }
  });

  it("doesn't route when insufficient ifno given", async () => {
    const b = new Broker(BrokerConfig.fromEnv());
    const i = new RoonNuimoMapping({
      nuimo: "xxx",
      zone: "yyy",
      output: "zzz",
      broker: b,
      routing: {},
    });

    jest.spyOn(b, "publish");

    const observation = i["observe"];

    const input: [string, Buffer] = [
      "nuimo/xxx/operation",
      Buffer.from(JSON.stringify({ subject: "rotate" })),
    ];

    observation(of(input)).subscribe();
    expect(b.publish).not.toBeCalled();
  });

  it("unsubscribes when down", async () => {
    const b = new Broker(new BrokerConfig());
    const i = new RoonNuimoMapping({
      nuimo: "xxx",
      zone: "yyy",
      output: "zzz",
      broker: b,
      routing: {},
    });

    jest.spyOn(b, "unsubscribe");

    await i.down().then(() => {
      expect(b.unsubscribe).toHaveBeenCalledWith([
        "nuimo/xxx/operation",
        "roon/yyy/state",
        "roon/yyy/outputs/zzz/volume/percent",
        "roon/yyy/now_playing/#",
      ]);
    });
  });
});
