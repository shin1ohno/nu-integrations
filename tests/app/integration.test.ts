import { Integration } from "app/integration";
import { BrokerConfig } from "app/brokerConfig";
import { Broker } from "app/broker";
import IntegrationStore from "app/dataStores/integrationStore";

describe("Integration", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("up", () => {
    it("should initialise integration and fire it up", async () => {
      const broker = new Broker(new BrokerConfig());
      const brokerSpy = jest.spyOn(broker, "subscribe");

      IntegrationStore.update = jest.fn();

      const i1 = new Integration(
        {
          uuid: "1",
          status: "down",
          app: {
            name: "roon",
            zone: "Qutest (BNC)1",
            output: "Qutest (BNC)1",
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
            zone: "Qutest (BNC)2",
            output: "Qutest (BNC)2",
          },
          controller: {
            name: "nuimo",
            id: "c381df4eff6a",
          },
        },
        new Broker(new BrokerConfig("mqtt://127.0.0.1:1883")),
      );

      const i3 = new Integration(
        {
          uuid: "1",
          status: "down",
          app: {
            name: "roon",
            zone: "Qutest (BNC)3",
            output: "Qutest (BNC)3",
          },
          controller: {
            name: "nuimo",
            id: "c381df4eff6a",
          },
        },
        new Broker(new BrokerConfig("mqtt://127.0.0.1:1883")),
      );

      await i1.up().then((_t) => {
        expect(i1.awaken()).toBeTruthy();
        expect(brokerSpy).toHaveBeenNthCalledWith(1, [
          "nuimo/c381df4eff6a/operation",
          "roon/Qutest (BNC)1/state",
          "roon/Qutest (BNC)1/outputs/Qutest (BNC)1/volume/percent",
          "roon/Qutest (BNC)1/now_playing/#",
        ]);
        expect(brokerSpy).toHaveBeenNthCalledWith(2, "nuIntegrations/1/kill");
      });

      await i2.up().then((_) => expect(i2.awaken()).toBeTruthy());

      await i3.pushKillMessage(); //FIX: i1.pushKillMessage() doesn't work here

      let t;
      await new Promise((r) => {
        t = setTimeout(() => {
          expect(i1.awaken()).toBeFalsy();
          expect(i2.awaken()).toBeFalsy();
          expect(i3.awaken()).toBeFalsy();
          r("");
        }, 1000);
      });
      t.unref();
    });
  });
});
