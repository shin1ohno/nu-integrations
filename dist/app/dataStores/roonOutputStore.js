import AWS from "aws-sdk";
import { defineTable, TableClient } from "@hexlabs/dynamo-ts";
const { DynamoDB } = AWS;
const tableDefinition = defineTable({
    ownerUUID: "string",
    outputID: "string",
    zoneId: "string",
    zoneDisplayName: "string",
    updatedAt: "number",
    displayName: "string",
    status: "string",
    core: "map",
}, "ownerUUID", "outputID");
class roonOutputStore {
    static async findAllForOwner(ownerUUID) {
        const res = await this.dynamoClient().queryAll({
            ownerUUID: ownerUUID,
        });
        return res.member;
    }
    static async find(query) {
        const res = await this.dynamoClient().get({
            ownerUUID: query.ownerUUID,
            outputID: query.outputID,
        });
        return res.item;
    }
    static async update(attr) {
        return this.dynamoClient()
            .update({
            key: {
                ownerUUID: attr.ownerUUID,
                outputID: attr.outputID,
            },
            updates: {
                updatedAt: attr.updatedAt,
                status: attr.status,
                displayName: attr.displayName,
                core: attr.core,
            },
        })
            .then((res) => res.item);
    }
    static dynamoClient() {
        const client = new DynamoDB.DocumentClient({
            region: "eu-west-2",
        });
        return TableClient.build(tableDefinition, {
            client: client,
            logStatements: false,
            tableName: "RoonOutputs",
        });
    }
}
export default roonOutputStore;
