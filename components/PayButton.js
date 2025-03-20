import { useState } from 'react';

const PayButton = ({ email, amount }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, amount }),
      });

      const data = await response.json();

      if (response.ok && data.data?.authorization_url) {
        window.location.href = data.data.authorization_url;
      } else {
        setError(data.error || 'Payment initialization failed.');
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handlePayment} disabled={loading}>
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default PayButton;
