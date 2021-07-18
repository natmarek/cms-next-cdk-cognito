import * as path from "path";
import * as cdk from "@aws-cdk/core";
import { NextJSLambdaEdge } from "@sls-next/cdk-construct";

export class CmsNextCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const { distribution } = new NextJSLambdaEdge(this, "NextApp", {
      serverlessBuildOutDir: "./app/build",
    });

    new cdk.CfnOutput(this, "Distribution URL", {
      value: distribution.domainName,
    });
  }
}
