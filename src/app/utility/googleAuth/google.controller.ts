import { Request, Response } from "express";
import { exchangeGoogleCodeForToken } from "./google.service";

export const googleCallbackController = async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;

    if (!code) {
      return res.status(400).json({ message: "Authorization code missing" });
    }

    const tokenData = await exchangeGoogleCodeForToken(code);

    const { access_token, refresh_token, expires_in } = tokenData;

    console.log("ACCESS TOKEN:", access_token);
    console.log("REFRESH TOKEN:", refresh_token);

    // TODO: Save refresh_token in DB

    res.json({
      success: true,
      access_token,
      refresh_token,
      expires_in,
    });
  } catch (error: any) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ message: "Google token exchange failed" });
  }
};

import axios from "axios";

async function getRefreshToken() {
  const code =
    "4/0ASc3gC135X2TaP6WAPF6IQPzhu1XAfavcRE7zYJyk9wI2-96whEkmIJy2-n0yp4jrhCt7Q";

  const res = await axios.post(
    "https://oauth2.googleapis.com/token",
    new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: "authorization_code",
    }),
  );

  console.log(res.data);
}

getRefreshToken();
