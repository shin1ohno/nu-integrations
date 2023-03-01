import { defineTable, DynamoTypeFrom, TableClient } from "@hexlabs/dynamo-ts";
import AWS from "aws-sdk";
import { UpdateResult } from "@hexlabs/dynamo-ts/dist/dynamo-updater.js";
import { nuimoOptions, roonOptions } from "../integration.js";
const { DynamoDB } = AWS;

const tableDefinition = defineTable(
  {
    ownerUUID: "string",
    integrationUUID: "string",
    updatedAt: "number",
    status: "string",
    app: "map",
    controller: "map",
  },
  "ownerUUID",
  "integrationUUID",
);

type IntegrationAttributes = DynamoTypeFrom<typeof tableDefinition>;

export type Result = {
  app: roonOptions;
  integrationUUID: string;
  controller: nuimoOptions;
  ownerUUID: string;
  updatedAt: number;
  status: "up" | "down";
};

const OWNER = "ae4af2c4-8154-4ed9-a963-7475ea54b9cd"; //one owner now

export default class IntegrationStore {
  static async findAllForOwner(
    ownerUUID: string,
  ): Promise<IntegrationAttributes[]> {
    const res = await this.dynamoClient().queryAll({
      ownerUUID: ownerUUID,
    });
    return res.member as IntegrationAttributes[];
  }

  static async find(query: {
    integrationUUID: string;
    ownerUUID: string;
  }): Promise<IntegrationAttributes> {
    const res = await this.dynamoClient().get({
      ownerUUID: query.ownerUUID,
      integrationUUID: query.integrationUUID,
    });
    return res.item;
  }

  static async update(
    attr: IntegrationAttributes,
  ): Promise<UpdateResult<typeof tableDefinition, null>> {
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

  private static dynamoClient(): TableClient<typeof tableDefinition> {
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
