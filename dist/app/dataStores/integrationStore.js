import { defineTable, TableClient } from "@hexlabs/dynamo-ts";
import AWS from "aws-sdk";
const { DynamoDB } = AWS;
const tableDefinition = defineTable({
    ownerUUID: "string",
    integrationUUID: "string",
    updatedAt: "number",
    status: "string",
    app: "map",
    controller: "map",
    routing: "map",
}, "ownerUUID", "integrationUUID");
const OWNER = "ae4af2c4-8154-4ed9-a963-7475ea54b9cd";
export default class IntegrationStore {
    static async findAllForOwner(ownerUUID) {
        const res = await this.dynamoClient().queryAll({
            ownerUUID: ownerUUID,
        });
        return res.member;
    }
    static async find(query) {
        const res = await this.dynamoClient().get({
            ownerUUID: query.ownerUUID,
            integrationUUID: query.integrationUUID,
        });
        return res.item;
    }
    static async update(attr) {
        return this.dynamoClient()
            .update({
            key: {
                ownerUUID: attr.ownerUUID,
                integrationUUID: attr.integrationUUID,
            },
            updates: {
                updatedAt: attr.updatedAt,
                status: attr.status,
                app: attr.app,
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
            tableName: "NuIntegrations",
        });
    }
}
export { OWNER };
