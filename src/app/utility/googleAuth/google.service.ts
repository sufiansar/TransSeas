// import axios from "axios";

// export const exchangeGoogleCodeForToken = async (code: string) => {
//   const response = await axios.post(
//     "https://oauth2.googleapis.com/token",
//     new URLSearchParams({
//       code,
//       client_id: process.env.GOOGLE_CLIENT_ID!,
//       client_secret: process.env.GOOGLE_CLIENT_SECRET!,
//       redirect_uri: "http://localhost:3000/auth/google/callback",
//       grant_type: "authorization_code",
//     }),
//   );

//   return response.data;
// };

// async function getRefreshToken() {
//   const code =
//     "4/0ASc3gC135X2TaP6WAPF6IQPzhu1XAfavcRE7zYJyk9wI2-96whEkmIJy2-n0yp4jrhCt7Q";

//   const res = await axios.post(
//     "https://oauth2.googleapis.com/token",
//     new URLSearchParams({
//       code,
//       client_id: process.env.GOOGLE_CLIENT_ID!,
//       client_secret: process.env.GOOGLE_CLIENT_SECRET!,
//       redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
//       grant_type: "authorization_code",
//     }),
//   );

//   console.log(res.data);
// }

// getRefreshToken();
