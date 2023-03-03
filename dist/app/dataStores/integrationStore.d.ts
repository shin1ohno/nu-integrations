import { DynamoTypeFrom } from "@hexlabs/dynamo-ts";
import { UpdateResult } from "@hexlabs/dynamo-ts/dist/dynamo-updater.js";
import { nuimoOptions, roonOptions } from "../mappings/interface.js";
declare const tableDefinition: {
    definition: {
        ownerUUID: "string";
        integrationUUID: "string";
        updatedAt: "number";
        status: "string";
        app: "map";
        controller: "map";
    };
    partitionKey: "ownerUUID";
    sortKey: "integrationUUID";
    indexes: {};
};
type IntegrationAttributes = DynamoTypeFrom<typeof tableDefinition>;
export type Result = {
    app: roonOptions;
    integrationUUID: string;
    controller: nuimoOptions;
    ownerUUID: string;
    updatedAt: number;
    status: "up" | "down";
};
declare const OWNER = "ae4af2c4-8154-4ed9-a963-7475ea54b9cd";
export default class IntegrationStore {
    static findAllForOwner(ownerUUID: string): Promise<IntegrationAttributes[]>;
    static find(query: {
        integrationUUID: string;
        ownerUUID: string;
    }): Promise<IntegrationAttributes>;
    static update(attr: IntegrationAttributes): Promise<UpdateResult<typeof tableDefinition, null>>;
    private static dynamoClient;
}
export { OWNER };
