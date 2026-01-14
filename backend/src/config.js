import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin: process.env.CORS_ORIGIN || "*",

  ocrUrl: process.env.OCR_SERVICE_URL,

  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,

  jwtSecret: process.env.JWT_SECRET,

  awsRegion: process.env.AWS_REGION,
  awsKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecret: process.env.AWS_SECRET_ACCESS_KEY,
  s3Bucket: process.env.S3_BUCKET,
  s3Prefix: process.env.S3_PREFIX || "events/",

  edgeTokenHeader: process.env.EDGE_TOKEN_HEADER || "x-device-token",
};
