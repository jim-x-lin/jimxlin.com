const inquirer = require("inquirer");
const { fromIni } = require("@aws-sdk/credential-providers");
const {
  S3Client,
  ListObjectsCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const {
  CloudFrontClient,
  CreateInvalidationCommand,
} = require("@aws-sdk/client-cloudfront");
const path = require("path");
const fs = require("fs");
const mime = require("mime-types");
const buildPath = path.resolve(__dirname, "../dist");
require("dotenv").config();

/******************
 * AWS Operations *
 ******************/

const emptyBucket = async (s3Client, bucketParams) => {
  console.log("Deleting bucket contents...");
  try {
    const data = await s3Client.send(new ListObjectsCommand(bucketParams));
    const objects = data.Contents;
    if (!objects) {
      console.log("Bucket is already empty.");
      return;
    }
    for (let i = 0; i < objects.length; i += 1) {
      const data = await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucketParams.Bucket,
          Key: objects[i].Key,
        })
      );
      console.log("Deleted file", objects[i].Key);
    }
  } catch (err) {
    console.log("Error deleting files", err);
  }
};

const uploadBuildFiles = async (s3Client, bucketParams) => {
  console.log("Uploading build files...");
  try {
    const fileNames = fs.readdirSync(buildPath);
    for (let i = 0; i < fileNames.length; i += 1) {
      const filePath = path.resolve(buildPath, fileNames[i]);
      const data = await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketParams.Bucket,
          Key: path.basename(fileNames[i]),
          // https://github.com/aws/aws-sdk-js/issues/3085#issuecomment-581742108
          ContentType: mime.lookup(filePath),
          Body: fs.createReadStream(filePath),
        })
      );
      console.log("Uploaded file", fileNames[i]);
    }
  } catch (err) {
    console.log("Error uploading file", err);
  }
};

const invalidateCache = async (cloudFrontClient, distributionId) => {
  console.log("Creating invalidation...");
  try {
    const data = await cloudFrontClient.send(
      new CreateInvalidationCommand({
        DistributionId: distributionId,
        InvalidationBatch: {
          CallerReference: Date.now(),
          Paths: { Items: ["/*"], Quantity: 1 },
        },
      })
    );
    console.log("Created invalidation");
  } catch (err) {
    console.log("Error creating invalidation", err);
  }
};

const s3operations = async (profile, bucketName, distributionId) => {
  // https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/loading-node-credentials-shared.html
  const s3Client = new S3Client({
    credentials: fromIni({ profile: profile }),
  });
  const cloudFrontClient = new CloudFrontClient({
    credentials: fromIni({ profile: profile }),
  });
  const bucketParams = { Bucket: bucketName };
  await emptyBucket(s3Client, bucketParams);
  await uploadBuildFiles(s3Client, bucketParams);
  if (distributionId !== "s") {
    await invalidateCache(cloudFrontClient, distributionId);
  }
};

/************************
 * Command Line Prompts *
 ************************/

const questions = [
  {
    type: "input",
    name: "profile",
    message: "IAM profile name:",
    default: process.env.IAM_PROFILE || "default",
  },
  {
    type: "input",
    name: "bucketName",
    message: "S3 bucket name:",
    default: process.env.S3_BUCKET || "",
    validate(val) {
      if (val.length > 0) return true;
      return "Bucket name cannot be blank";
    },
  },
  {
    type: "input",
    name: "cloudFrontDistId",
    message: "CloudFront distribution ID ('s' to skip):",
    default: process.env.CLOUDFRONT_DISTRIBUTION || "s",
  },
];

const init = () =>
  inquirer.prompt(questions).then(async (answers) => {
    await s3operations(
      answers.profile,
      answers.bucketName,
      answers.cloudFrontDistId
    );
    console.log(
      "Deployment complete. CloudFront will take some time to propagate changes."
    );
  });

inquirer
  .prompt([
    {
      type: "confirm",
      name: "continue",
      message:
        "Prerequisites:\n" +
        "  - IAM credentials in ~/.aws/credentials\n" +
        "  - build files in /dist in project root\n" +
        "  The following operations will be performed:\n" +
        "  - Replace the entire contents of an S3 bucket\n" +
        "  - Create a CloudFront invalidation for all files (optional)\n" +
        "  Continue?",
      default: false,
    },
  ])
  .then((answers) => {
    if (answers.continue) return init();
  });
