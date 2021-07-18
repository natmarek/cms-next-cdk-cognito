import * as path from "path";
import * as cdk from "@aws-cdk/core";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as appsync from "@aws-cdk/aws-appsync";

export class CmsNextCdkBackendStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const api = new appsync.GraphqlApi(this, "appsync-api", {
      name: "cms-next-cdk",
      schema: appsync.Schema.fromAsset(
        path.join(__dirname, "../", "schema.graphql")
      ),
    });

    const table = new dynamodb.Table(this, "dynamo-table", {
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
    });

    const dataSource = api.addDynamoDbDataSource("cms", table);

    dataSource.createResolver({
      typeName: "Query",
      fieldName: "getPage",
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbGetItem(
        "id",
        "docId"
      ),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    });

    dataSource.createResolver({
      typeName: "Mutation",
      fieldName: "setPage",
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbPutItem(
        appsync.PrimaryKey.partition("id").auto(),
        appsync.Values.projecting("input")
      ),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    });

    new cdk.CfnOutput(this, "GraphQLAPIURL", {
      value: api.graphqlUrl,
    });
  }
}
