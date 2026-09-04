import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

export const isR2Configured = Boolean(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME);

export const s3Client = isR2Configured ? new S3Client({
  region: 'us-east-1',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  forcePathStyle: true,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID as string,
    secretAccessKey: R2_SECRET_ACCESS_KEY as string,
  }
}) : null;

if (isR2Configured) {
  console.log(`✅ R2 Configured with Account ID: Loaded`);
  console.log(`✅ R2 Endpoint: https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`);
} else {
  console.warn("⚠️  Running without R2 Configuration. Files will be local only.");
}

export const uploadFile = async (fileBuffer: Buffer, key: string, contentType: string): Promise<string | null> => {
  if (!s3Client || !R2_BUCKET_NAME) throw new Error("R2 not configured");

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
  });

  try {
    await s3Client.send(command);
    return key;
  } catch (error: any) {
    console.error("❌ Error uploading to R2 (Fallback to Local):", error.message);
    return null;
  }
};

export const getSignedDownloadUrl = async (key: string, expiresIn = 3600): Promise<string> => {
  if (!s3Client || !R2_BUCKET_NAME) throw new Error("R2 not configured");

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
};

export const deleteFile = async (key: string): Promise<void> => {
  if (!s3Client || !R2_BUCKET_NAME) return;

  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  try {
    await s3Client.send(command);
  } catch (error) {
    console.error("Error deleting from R2:", error);
  }
};

export const downloadFileBuffer = async (key: string): Promise<Buffer> => {
  if (!s3Client || !R2_BUCKET_NAME) throw new Error('R2 not configured');

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  const response = await s3Client.send(command);
  const chunks: any[] = [];
  
  if (response.Body) {
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }
  }
  return Buffer.concat(chunks);
};
