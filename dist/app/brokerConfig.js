import dotenv from "dotenv";
import * as process from "process";
class BrokerConfig {
    userName;
    password;
    defaultURL = "mqtt://localhost:1833";
    brokerURL;
    constructor(brokerURL, userName, password) {
        this.brokerURL = brokerURL;
        this.userName = userName;
        this.password = password;
    }
    get url() {
        return this.brokerURL || this.defaultURL;
    }
    get options() {
        if (this.userName && this.password) {
            return {
                username: this.userName,
                password: this.password,
            };
        }
        else {
            return {};
        }
    }
    static fromEnv() {
        dotenv.config();
        const brokerURL = process.env.BROKER_URL;
        const userName = process.env.BROKER_USER_NAME;
        const password = process.env.BROKER_PASSWORD;
        return new BrokerConfig(brokerURL, userName, password);
    }
}
export { BrokerConfig };
//# sourceMappingURL=brokerConfig.js.map