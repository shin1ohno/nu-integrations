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
    it("should initialise itegration and fire it up", async () => {
      const spy = jest.spyOn(RoonNuimoMapping.prototype, "up");
      const broker = new Broker(new BrokerConfig());
      const brokerSpy = jest.spyOn(broker, "connect");
      brokerSpy.mockImplementation(() => new Promise((x, _y) => x(undefined)));

      const i = new Integration(
        {
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

      await i.up().then(async (_t) => {
        expect(RoonNuimoMapping).toHaveBeenCalledTimes(1);
        expect(RoonNuimoMapping).toHaveBeenCalledWith({
          nuimo: "c381df4eff6a",
          zone: "Qutest (BNC)",
          output: "Qutest (BNC)",
          broker: broker,
        });
        expect(brokerSpy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("next", () => {
    it("returns next integration", async () => {
      const broker = new Broker(new BrokerConfig());
      const i = new Integration(
        {
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

      Integration.all = jest.fn().mockImplementation(() => [i, n, x]);

      broker.connect = jest
        .fn()
        .mockImplementation(() => new Promise((x, _) => x("")));

      await [i, n].map((x) => x.up());

      expect(await i.next()).toEqual(n);
      expect(await n.next()).toEqual(i);
    });
  });
});
