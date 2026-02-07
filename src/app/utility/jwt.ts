import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import dbConfig from "../config/db.config";

interface JwtPayloadWithUser extends JwtPayload {
  user: {
    id: string;
    email: string;
    role: string;
  };
}
console.log("Access token secret:", dbConfig.jwt.accessToken_secret);

export const generateToken = (
  payload: JwtPayloadWithUser | JwtPayload,
  secret: string,
  expiresIn: string
) => {
  const token = jwt.sign(payload, secret, {
    expiresIn,
  } as SignOptions);

  return token;
};

export const verifyToken = (token: string, secret: string) => {
  const verifiedToken = jwt.verify(token, secret) as
    | JwtPayloadWithUser
    | JwtPayload;

  return verifiedToken;
};
