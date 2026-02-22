import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import dbConfig from "./db.config";
import path from "path";

// Initialize S3 client
export const s3 = new S3Client({
  region: dbConfig.aws.region,
  credentials: {
    accessKeyId: dbConfig.aws.access_key_id!,
    secretAccessKey: dbConfig.aws.secret_access_key!,
  },
});

// Helper to get MIME type from file extension
const getContentType = (fileName: string): string => {
  const ext = path.extname(fileName).toLowerCase();
  switch (ext) {
    case ".pdf":
      return "application/pdf";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".gif":
      return "image/gif";
    case ".xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case ".xls":
      return "application/vnd.ms-excel";
    case ".csv":
      return "text/csv";
    default:
      return "application/octet-stream"; // fallback generic type
  }
};

/**
 * Uploads a buffer to S3
 */
export const uploadBufferToS3 = async (
  buffer: Buffer,
  fileName: string,
  folder = "uploads",
) => {
  const contentType = getContentType(fileName);
  const key = `${folder}/${fileName}-${Date.now()}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: dbConfig.aws.bucket_name,
      Key: key,
      Body: buffer,
      ACL: "public-read",
      ContentType: contentType,
    }),
  );

  const url = `https://${dbConfig.aws.bucket_name}.s3.${dbConfig.aws.region}.amazonaws.com/${key}`;
  return { key, url };
};

// Delete a file from S3 by key
export const deleteFromS3 = async (key: string) => {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: dbConfig.aws.bucket_name,
      Key: key,
    }),
  );
};
