import * as path from "path";
import * as cdk from "@aws-cdk/core";
import * as s3 from "@aws-cdk/aws-s3";
import * as s3Deployment from "@aws-cdk/aws-s3-deployment";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as origins from "@aws-cdk/aws-cloudfront-origins";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as appsync from "@aws-cdk/aws-appsync";

export class CmsNextCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, "next-app-bucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const distribution = new cloudfront.Distribution(
      this,
      "next-app-distribution",
      {
        defaultBehavior: {
          origin: new origins.S3Origin(bucket),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        defaultRootObject: "index.html",
      }
    );

    new s3Deployment.BucketDeployment(this, "next-deployment-bucket", {
      sources: [s3Deployment.Source.asset("./app/out")],
      destinationBucket: bucket,
    });

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

    new cdk.CfnOutput(this, "CloudFront URL", {
      value: distribution.distributionDomainName,
    });

    new cdk.CfnOutput(this, "GraphQLAPIURL", {
      value: api.graphqlUrl,
    });
  }
}
