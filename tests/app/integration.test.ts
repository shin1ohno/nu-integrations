import { Integration } from "app/integration";
import { BrokerConfig } from "app/brokerConfig";
import { Broker } from "app/broker";
// import { RoonNuimoMapping } from "app/mappings/roonNuimoMapping";
import IntegrationStore from "../../src/app/dataStores/integrationStore";

describe("Integration", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("up", () => {
    it("should initialise integration and fire it up", async () => {
      const broker = new Broker(new BrokerConfig());
      const brokerSpy = jest.spyOn(broker, "subscribe");
      const disconnectSpy = jest.spyOn(broker, "disconnect");

      IntegrationStore.update = jest.fn();

      const i1 = new Integration(
        {
          uuid: "1",
          status: "down",
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

      const i2 = new Integration(
        {
          uuid: "1",
          status: "down",
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

      await i1.up().then((_t) => {
        expect(i1.awaken()).toBeTruthy();
        expect(brokerSpy).toHaveBeenNthCalledWith(1, [
          "nuimo/c381df4eff6a/operation",
          "roon/Qutest (BNC)/state",
          "roon/Qutest (BNC)/outputs/Qutest (BNC)/volume/percent",
        ]);
        expect(brokerSpy).toHaveBeenNthCalledWith(2, "nuIntegrations/1/kill");
      });

      await i2.up().then((_) => expect(i1.awaken()).toBeTruthy());

      await i1.pushKillMessage();

      await new Promise((r) => {
        setTimeout(() => {
          expect(disconnectSpy).toHaveBeenCalledTimes(2);
          expect(i1.awaken()).toBeFalsy();
          expect(i2.awaken()).toBeFalsy();
          r("");
        }, 200);
      });
    });
  });

  xdescribe("next", () => {
    it("returns next integration", async () => {
      const broker = new Broker(new BrokerConfig());
      const i = new Integration(
        {
          uuid: "1",
          status: "down",
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
          uuid: "1",
          status: "down",
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
          uuid: "2",
          status: "down",
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

      Integration.all = () => new Promise((_) => [i, n, x]);

      expect(await i.next()).toEqual(n);
      expect(await n.next()).toEqual(i);
      expect(await x.next()).toEqual(x);
    });
  });
});
