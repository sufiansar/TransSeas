import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utility/jwt";
import dbConfig from "../config/db.config";

const auth = (...roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token =
        req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res
          .status(401)
          .json({ success: false, message: "Token missing." });
      }

      const decoded = verifyToken(token, dbConfig.jwt.accessToken_secret!);

      const user = decoded.user ? decoded.user : decoded;

      if (!user?.email) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid token payload." });
      }

      req.user = user;

      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to access this route.",
        });
      }

      console.log("req.user:", req.user);
      next();
    } catch (err: any) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
        error: err.message,
      });
    }
  };
};


export default auth;

