import AWS from "aws-sdk";
import { defineTable, DynamoTypeFrom, TableClient } from "@hexlabs/dynamo-ts";
import { UpdateResult } from "@hexlabs/dynamo-ts/dist/dynamo-updater.js";

const { DynamoDB } = AWS;

const tableDefinition = defineTable(
  {
    ownerUUID: "string",
    outputID: "string",
    zoneId: "string",
    zoneDisplayName: "string",
    updatedAt: "number",
    displayName: "string",
    status: "string",
    core: "map"
  },
  "ownerUUID",
  "outputID"
);

export type OutputAttributes = DynamoTypeFrom<typeof tableDefinition>;

class roonOutputStore {
  static async findAllForOwner(
    ownerUUID: string
  ): Promise<OutputAttributes[]> {
    const res = await this.dynamoClient().queryAll({
      ownerUUID: ownerUUID
    });
    return res.member;
  }

  static async find(query: {
    outputID: string;
    ownerUUID: string;
  }): Promise<OutputAttributes> {
    const res = await this.dynamoClient().get({
      ownerUUID: query.ownerUUID,
      outputID: query.outputID,
    });
    return res.item;
  }

  static async update(
    attr: OutputAttributes,
  ): Promise<UpdateResult<typeof tableDefinition, null>> {
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

  private static dynamoClient(): TableClient<typeof tableDefinition> {
    const client = new DynamoDB.DocumentClient({
      region: "eu-west-2"
    });

    return TableClient.build(tableDefinition, {
      client: client,
      logStatements: false,
      tableName: "RoonOutputs"
    });
  }
}

export default roonOutputStore;
