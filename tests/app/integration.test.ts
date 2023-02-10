import { Integration } from "app/integration";
import { BrokerConfig } from "app/brokerConfig";
import { Broker } from "app/broker";
import { RoonNuimoIntegration } from "app/integrations/roonNuimoIntegration";

jest.mock("app/integrations/roonNuimoIntegration");

describe("Integration", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should initialise itegration and fire it up", async () => {
    const spy = jest.spyOn(RoonNuimoIntegration.prototype, "up");
    spy.mockImplementation(() => new Promise((x, _y) => x("")));
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
      expect(RoonNuimoIntegration).toHaveBeenCalledTimes(1);
      expect(RoonNuimoIntegration).toHaveBeenCalledWith({
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
