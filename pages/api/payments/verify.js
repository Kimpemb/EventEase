import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { reference } = req.query;

  if (!reference) {
    return res.status(400).json({ error: "Reference is required" });
  }

  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    return res.status(200).json(response.data);
  } catch (error) {
    console.error("Paystack Verification Error:", error.response?.data || error.message);
    return res.status(500).json({ error: "Payment verification failed" });
  }
}
