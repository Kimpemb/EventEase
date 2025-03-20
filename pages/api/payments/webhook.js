import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = process.env.PAYSTACK_SECRET_KEY;
  const hash = crypto.createHmac("sha512", secret).update(JSON.stringify(req.body)).digest("hex");

  if (hash !== req.headers["x-paystack-signature"]) {
    return res.status(401).json({ error: "Unauthorized request" });
  }

  const event = req.body;

  try {
    console.log("Webhook Event:", event);
    res.status(200).json({ message: "Webhook received successfully" });
  } catch (error) {
    console.error("Webhook Error:", error.message);
    res.status(500).json({ error: "Failed to process webhook" });
  }
}
