import dotenv from "dotenv";
import * as process from "process";
import { IClientOptions } from "async-mqtt";

class BrokerConfig {
  readonly userName: string | undefined;
  readonly password: string | undefined;
  private defaultURL = "mqtt://localhost:1833";
  private readonly brokerURL: string | undefined;

  constructor(brokerURL?: string, userName?: string, password?: string) {
    this.brokerURL = brokerURL;
    this.userName = userName;
    this.password = password;
  }

  public get url(): string {
    return this.brokerURL || this.defaultURL;
  }

  public get options(): IClientOptions {
    if (this.userName && this.password) {
      return {
        username: this.userName,
        password: this.password,
      };
    } else {
      return {};
    }
  }

  public static fromEnv(): BrokerConfig {
    dotenv.config();
    const brokerURL = process.env.BROKER_URL;
    const userName = process.env.BROKER_USER_NAME;
    const password = process.env.BROKER_PASSWORD;
    return new BrokerConfig(brokerURL, userName, password);
  }
}

export { BrokerConfig };
