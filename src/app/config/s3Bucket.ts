import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import dbConfig from "./db.config";

export const s3 = new S3Client({
  region: dbConfig.aws.region,
  credentials: {
    accessKeyId: dbConfig.aws.access_key_id!,
    secretAccessKey: dbConfig.aws.secret_access_key!,
  },
});

export const uploadBufferToS3 = async (buffer: Buffer, fileName: string, folder = "pdf") => {
  const key = `${folder}/${fileName}-${Date.now()}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: dbConfig.aws.bucket_name,
      Key: key,
      Body: buffer,
      ACL: "public-read",
      ContentType: "application/pdf",
    })
  );

  const url = `https://${dbConfig.aws.bucket_name}.s3.${dbConfig.aws.region}.amazonaws.com/${key}`;
  return { key, url };
};

export const deleteFromS3 = async (key: string) => {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: dbConfig.aws.bucket_name,
      Key: key,
    })
  );
};
