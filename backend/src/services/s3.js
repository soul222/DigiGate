import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "../config.js";

const s3 = new S3Client({
  region: config.awsRegion,
  credentials: {
    accessKeyId: config.awsKeyId,
    secretAccessKey: config.awsSecret,
  },
});

export async function uploadImageToS3({ buffer, contentType, key }) {
  await s3.send(new PutObjectCommand({
    Bucket: config.s3Bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
  return key;
}

export async function signedGetUrl(key, expiresSeconds = 3600) {
  const cmd = new GetObjectCommand({
    Bucket: config.s3Bucket,
    Key: key,
  });
  return await getSignedUrl(s3, cmd, { expiresIn: expiresSeconds });
}
