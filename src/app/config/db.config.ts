import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  node_env: process.env.NODE_ENV,
  port: process.env.PORT,
  database_url: process.env.DATABASE_URL,
  bcryptJs_salt: process.env.BCRYTPJS_SALT,
  frontEnd_url: process.env.FONTEND_URL,

  superAdmin: {
    superAdmin_name: process.env.SUPERADMIN_NAME,
    superAdmin_email: process.env.SUPERADMIN_EMAIL,
    superAdmin_password: process.env.SUPERADMIN_PASSWORD,
  },
  aws: {
    access_key_id: process.env.AWS_ACCESS_KEY_ID,
    secret_access_key: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    bucket_name: process.env.AWS_S3_BUCKET_NAME,
  },
  Cloudinary: {
    cloude_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  },
  jwt: {
    accessToken_secret: process.env.ACCESSTOKEN_SECRET,
    accessToken_expiresIn: process.env.ACCESSTOKEN_EXPIRESIN,
    refreshToken_secret: process.env.REFRESHTOKEN_SECRET,
    refreshToken_expiresIn: process.env.REFRESHTOKEN_EXPIRESIN,
  },
  openRouter_api_key: process.env.OPENROUTER_API_KEY,
  stripe: {
    stripe_secret_key: process.env.STRIPE_SECRET_KEY,
    stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  REDIS: {
    REDIS_PORT: Number(process.env.REDIS_PORT),
    REDIS_HOST: process.env.REDIS_HOST as string,
    REDIS_PASS: process.env.REDIS_PASS as string,
    REDIS_USERNAME: process.env.REDIS_USERNAME as string,
  },
  smtp: {
    smtp_host: process.env.SMTP_HOST,
    smtp_port: process.env.SMTP_PORT,
    smtp_user: process.env.SMTP_USER,
    smtp_pass: process.env.SMTP_PASS,
    smtp_from: process.env.SMTP_FROM,
  },
};
