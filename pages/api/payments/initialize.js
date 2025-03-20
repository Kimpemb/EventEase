// /pages/api/payments/initialize.js
import axios from 'axios';
import { db } from '@/firebase/firebaseConfig';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { sendNotification } from '@/firebase/NotificationService';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email, amount, userId, callback_url } = req.body;

    if (!email || !amount || !userId) {
      return res.status(400).json({ error: "Email, userId, and amount are required" });
    }

    try {
      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          email,
          amount: amount * 100, // Convert to kobo
          callback_url,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const transaction = response.data.data;

      // Save donation notification to Firestore
      const notificationRef = doc(db, 'notifications', `${userId}_${transaction.reference}`);
      await setDoc(notificationRef, {
        userId,
        type: 'donation',
        message: `Your donation of GHS ${(amount / 100).toFixed(2)} has been initiated. Thank you for your support!`,
        timestamp: serverTimestamp(),
        read: false,
      });

      // Optionally, send an email notification
      await sendNotification({
        userId,
        type: 'donation',
        message: `Your donation of GHS ${(amount / 100).toFixed(2)} has been initiated. Thank you for your support!`,
        channel: 'email',
      });

      return res.status(200).json(transaction);
    } catch (error) {
      console.error(error.response?.data || error.message);
      return res.status(500).json({ error: 'Payment initialization failed' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}