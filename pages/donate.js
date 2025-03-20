import { useState, useEffect } from 'react';
import { auth } from '../firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import PayButton from '../components/PayButton';

const Donate = () => {
  const [userEmail, setUserEmail] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);  // Automatically use logged-in user's email
      } else {
        setUserEmail(''); // Reset email if user logs out
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (!isNaN(value) && Number(value) >= 1) {
      setAmount(value);
    }
  };

  return (
    <div>
      <h1>Support Us</h1>

      <div>
        <label>Email:</label>
        <input
          type="email"
          value={userEmail}
          readOnly
          placeholder="You must be logged in to donate"
        />
      </div>

      <div>
        <label>Amount (GHS):</label>
        <input
          type="text"
          value={amount}
          onChange={handleAmountChange}
          placeholder="Enter amount to donate"
        />
      </div>

      {userEmail ? (
        <PayButton email={userEmail} amount={Number(amount)} />
      ) : (
        <p>Please log in to make a donation.</p>
      )}
    </div>
  );
};

export default Donate;
