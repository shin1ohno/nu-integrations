import { Integration } from "app/integration";
import { BrokerConfig } from "app/brokerConfig";
import { Broker } from "app/broker";
import { RoonNuimoMapping } from "app/mappings/roonNuimoMapping";

jest.mock("app/mappings/roonNuimoMapping");

describe("Integration", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("up", () => {
    it("should initialise integration and fire it up", async () => {
      const spy = jest.spyOn(RoonNuimoMapping.prototype, "up");

      const broker = new Broker(new BrokerConfig());
      const brokerSpy = jest.spyOn(broker, "connect");
      brokerSpy.mockImplementation(() => new Promise((x, _y) => x(undefined)));
      broker["on"] = jest.fn();

      const i = new Integration(
        {
          id: 1,
          app: {
            name: "roon",
            zone: "Qutest (BNC)",
            output: "Qutest (BNC)",
          },
          controller: {
            name: "nuimo",
            id: "c381df4eff6a",
          },
        },
        broker,
      );
      i.down = jest.fn();
      i["observeKillSwitch"] = jest.fn();

      await i.up().then(async (_t) => {
        expect(RoonNuimoMapping).toHaveBeenCalledTimes(1);
        expect(RoonNuimoMapping).toHaveBeenCalledWith({
          nuimo: "c381df4eff6a",
          zone: "Qutest (BNC)",
          output: "Qutest (BNC)",
          broker: broker,
        });
        expect(brokerSpy).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("next", () => {
    it("returns next integration", async () => {
      const broker = new Broker(new BrokerConfig());
      const i = new Integration(
        {
          id: 1,
          app: {
            name: "roon",
            zone: "roonI",
            output: "roonI",
          },
          controller: {
            name: "nuimo",
            id: "nnnn",
          },
        },
        broker,
      );

      const n = new Integration(
        {
          id: 1,
          app: {
            name: "roon",
            zone: "roonN",
            output: "roonN",
          },
          controller: {
            name: "nuimo",
            id: "nnnn",
          },
        },
        broker,
      );

      const x = new Integration(
        {
          id: 2,
          app: {
            name: "roon",
            zone: "roonN",
            output: "roonN",
          },
          controller: {
            name: "nuimo",
            id: "xxx",
          },
        },
        broker,
      );

      Integration.all = () => [i, n, x];

      expect(await i.next()).toEqual(n);
      expect(await n.next()).toEqual(i);
      expect(await x.next()).toEqual(x);
    });
  });
});
