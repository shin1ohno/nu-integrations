import { DynamoTypeFrom } from "@hexlabs/dynamo-ts";
import { UpdateResult } from "@hexlabs/dynamo-ts/dist/dynamo-updater.js";
declare const tableDefinition: {
    definition: {
        ownerUUID: "string";
        outputID: "string";
        zoneId: "string";
        zoneDisplayName: "string";
        updatedAt: "number";
        displayName: "string";
        status: "string";
        core: "map";
    };
    partitionKey: "ownerUUID";
    sortKey: "outputID";
    indexes: {};
};
export type OutputAttributes = DynamoTypeFrom<typeof tableDefinition>;
declare class roonOutputStore {
    static findAllForOwner(ownerUUID: string): Promise<OutputAttributes[]>;
    static find(query: {
        outputID: string;
        ownerUUID: string;
    }): Promise<OutputAttributes>;
    static update(attr: OutputAttributes): Promise<UpdateResult<typeof tableDefinition, null>>;
    private static dynamoClient;
}
export default roonOutputStore;
