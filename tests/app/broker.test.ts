import { BrokerConfig } from "app/brokerConfig";
import { Broker } from "../../src/app/broker";

describe("BrokerConfig", () => {
  it("is initialised by default attributes", () => {
    const c = new BrokerConfig();
    expect(c.url).toBe("mqtt://localhost:1883");
    expect(c.options).toMatchObject({});
  });

  it("is initialised by given url", () => {
    const c = new BrokerConfig("mqtt://example.com:1883");
    expect(c.url).toBe("mqtt://example.com:1883");
    expect(c.options).toMatchObject({});
  });

  it("is initialised by given url", () => {
    const c = new BrokerConfig("mqtt://example.com:1883", "foo", "bar");
    expect(c.url).toBe("mqtt://example.com:1883");
    expect(c.options).toMatchObject({ username: "foo", password: "bar" });
  });
});

describe("Broker", () => {
  it("it doesn't have client by default", () => {
    const b = new Broker(BrokerConfig.fromEnv());
    expect(b.client).toBeFalsy();
  });
});
