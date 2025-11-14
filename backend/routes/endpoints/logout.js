import "dotenv/config";

export default function logout(req, res) {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.MODE === "PRODUCTION",
    sameSite: process.env.MODE === "PRODUCTION" ? "None" : "Lax",
    path: "/",
    domain:
      process.env.MODE === "PRODUCTION" ? process.env.SERVER_URL : "localhost",
  });
  res.json({ success: true });
}
