#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { CmsNextCdkStack } from "../lib/cms-next-cdk-stack";
import { CmsNextCdkBackendStack } from "../lib/cms-next-cdk-backend-stack";
import { Builder } from "@sls-next/lambda-at-edge";

const builder = new Builder("./app", "./app/build", {
  cwd: "./app",
  args: ["build"],
});

builder.build().then(() => {
  const app = new cdk.App();
  new CmsNextCdkStack(app, "CmsNextCdkStack", {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: "us-east-1" },
  });
  new CmsNextCdkBackendStack(app, "CmsNextCdkBackendStack", {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: "eu-west-1" },
  });
});
