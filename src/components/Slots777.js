import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import OrderReceipt from './OrderReceipt';
import { useToast } from './ToastProvider';

// Added 💣 as a losing symbol
const symbols = ['🍕','🍔','🥗','🍰','🥤','🌮','🍣','🍝','7️⃣','💣'];

const Slots777 = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const { refreshBalance } = useWallet();
  const { show } = useToast();

  const { price, menuItems, restaurant, minPrice, maxPrice, paymentMethod: initialPaymentMethod, discountAmount: initialDiscountAmount } = location.state || {};

  const [isSpinning, setIsSpinning] = useState(false);
  const [reelIndex, setReelIndex] = useState([0, 3, 6]);
  const [finalIcons, setFinalIcons] = useState(['🍕','🍔','🥗']);
  const [resultItem, setResultItem] = useState(null);
  const [isLoss, setIsLoss] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(initialPaymentMethod || 'wallet');
  const [discountAmount] = useState(initialDiscountAmount || 0);
  // Wallet UI summary uses header; refresh on changes

  const timersRef = useRef([]);
  const leverAudioRef = useRef(null);
  const loseAudioRef = useRef(null);

  useEffect(() => {
    if (!price || !menuItems || !restaurant) {
      navigate(`/restaurant/${id}`);
    }
  }, [price, menuItems, restaurant, id, navigate]);

  useEffect(() => {
    // Setup audio refs
    try {
      leverAudioRef.current = new Audio(process.env.PUBLIC_URL + '/sounds/lets-go-gambling_dVjTC3g.mp3');
      loseAudioRef.current = new Audio(process.env.PUBLIC_URL + '/sounds/aw-dangit.mp3');
      // slightly lower volume defaults; can be adjusted later
      leverAudioRef.current.volume = 0.9;
      loseAudioRef.current.volume = 0.9;
    } catch (_) {}
    return () => {
      timersRef.current.forEach(clearInterval);
      timersRef.current = [];
      try {
        if (leverAudioRef.current) {
          leverAudioRef.current.pause();
          leverAudioRef.current.currentTime = 0;
        }
        if (loseAudioRef.current) {
          loseAudioRef.current.pause();
          loseAudioRef.current.currentTime = 0;
        }
      } catch (_) {}
    };
  }, [token]);

  const weightedPick = useMemo(() => {
    if (!menuItems || !Array.isArray(menuItems)) return () => null;
    const weights = menuItems.map(item => 1 / (1 + Math.abs(item.price - price)));
    const total = weights.reduce((a,b)=>a+b,0);
    return () => {
      let r = Math.random() * total;
      for (let i = 0; i < menuItems.length; i++) {
        if ((r -= weights[i]) <= 0) return menuItems[i];
      }
      return menuItems[menuItems.length - 1];
    };
  }, [menuItems, price]);

  const closestToPrice = (items) => {
    return items.reduce((best, item) => Math.abs(item.price - price) < Math.abs(best.price - price) ? item : best, items[0]);
  };

  const mostExpensive = (items) => items.reduce((a,b)=> a.price >= b.price ? a : b, items[0]);

  const determinePrize = (icons) => {
    const [a,b,c] = icons;
    if (icons.includes('💣')) {
      return null; // loss condition
    }
    if (a === '7️⃣' && b === '7️⃣' && c === '7️⃣') {
      return mostExpensive(menuItems);
    }
    if (a === b && b === c) {
      return closestToPrice(menuItems);
    }
    if (a === b || b === c || a === c) {
      // two-of-a-kind, give slightly favorable pick
      const candidate = closestToPrice(menuItems);
      // 70% chance to give closest, else weighted
      return Math.random() < 0.7 ? candidate : weightedPick();
    }
    // otherwise weighted random
    return weightedPick();
  };

  const spin = () => {
    if (isSpinning) return;
    setResultItem(null);
    setIsLoss(false);
    setShowReceipt(false);
    setIsSpinning(true);
    // Play lever audio
    try {
      if (loseAudioRef.current) {
        loseAudioRef.current.pause();
        loseAudioRef.current.currentTime = 0;
      }
      if (leverAudioRef.current) {
        leverAudioRef.current.currentTime = 0;
        void leverAudioRef.current.play();
      }
    } catch (_) {}

    // Decide targets. Small chance of jackpot (777)
    const jackpot = Math.random() < 0.02; // 2%
    const targets = jackpot ? ['7️⃣','7️⃣','7️⃣'] : [
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)]
    ];

    setFinalIcons(targets);

    const durations = [1200, 1600, 2000];
    const newIndices = [...reelIndex];

    durations.forEach((dur, i) => {
      const start = Date.now();
      timersRef.current[i] = setInterval(() => {
        setReelIndex(prev => {
          const next = [...prev];
          next[i] = (next[i] + 1) % symbols.length;
          return next;
        });
        if (Date.now() - start >= dur) {
          clearInterval(timersRef.current[i]);
          timersRef.current[i] = undefined;
          // snap to target
          const targetIndex = symbols.indexOf(targets[i]);
          setReelIndex(prev => {
            const next = [...prev];
            next[i] = targetIndex >= 0 ? targetIndex : next[i];
            return next;
          });
          // when last reel stops, compute prize
          if (i === 2) {
            setTimeout(() => {
              const icons = [targets[0], targets[1], targets[2]];
              const prize = determinePrize(icons);
              if (!prize) {
                setIsLoss(true);
                setIsSpinning(false);
                // Record loss transaction (no prize)
                recordLossTransaction();
                try {
                  if (leverAudioRef.current) {
                    leverAudioRef.current.pause();
                  }
                  if (loseAudioRef.current) {
                    loseAudioRef.current.currentTime = 0;
                    void loseAudioRef.current.play();
                  }
                } catch (_) {}
                show('💥 Dang it! You lost this spin.', { type: 'error', duration: 2500 });
                refreshBalance();
              } else {
                setResultItem(prize);
                setIsSpinning(false);
                const delta = price - prize.price;
                if (delta > 0) {
                  show(`🎉 You won! +$${delta.toFixed(2)} back to wallet`, { type: 'success', duration: 3000 });
                } else if (delta < 0) {
                  show(`🎁 Big win! Item worth $${Math.abs(delta).toFixed(2)} more`, { type: 'info', duration: 3000 });
                } else {
                  show('🎯 Perfect match!', { type: 'success', duration: 2500 });
                }
                // Wallet changes occur after placing order; refresh then as well
              }
            }, 250);
          }
        }
      }, 90);
    });
  };

  const recordLossTransaction = async () => {
    try {
      await axios.post('http://localhost:3001/api/gambling/transaction', {
        restaurant_id: parseInt(id),
        game_type: 'slots',
        bet_amount: price,
        won_item_id: null,
        won_item_name: null,
        won_item_price: null,
        wallet_credit: 0
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e) {
      console.error('Error recording loss transaction:', e);
    }
  };

  const goBack = () => navigate(`/restaurant/${id}`);
  const showReceiptModal = () => setShowReceipt(true);
  const handleOrderPlaced = () => navigate('/history');
  const handleBackToGame = () => setShowReceipt(false);

  if (!price || !menuItems || !restaurant) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Loading game data...</p>
        </div>
      </div>
    );
  }

  const displayIcons = [symbols[reelIndex[0]], symbols[reelIndex[1]], symbols[reelIndex[2]]];

  return (
    <div className="game-container">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ color: '#2c3e50', margin: 0 }}>🎰 777 Slots</h2>
          <button className="btn btn-secondary" onClick={goBack}>← Back to Menu</button>
        </div>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <p><strong>Restaurant:</strong> {restaurant?.name}</p>
          <p><strong>You paid:</strong> ${price}</p>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', alignItems: 'center', padding: '1.5rem 0' }}>
          {displayIcons.map((icon, idx) => (
            <motion.div
              key={idx}
              animate={{ rotateX: isSpinning ? [0, 360, 720, 1080] : 0 }}
              transition={{ duration: isSpinning ? 1.2 + idx * 0.4 : 0.3, ease: 'easeOut' }}
              style={{
                width: 96, height: 96, borderRadius: 16,
                background: 'linear-gradient(180deg, #0f0f1a, #14142a)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2.6rem', boxShadow: '0 16px 30px rgba(0,0,0,0.35), 0 0 24px rgba(139,92,246,0.35)',
                border: '2px solid rgba(246, 198, 111, 0.5)'
              }}
            >{icon}</motion.div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button
            className="btn"
            onClick={spin}
            disabled={isSpinning}
            style={{ fontSize: '1.1rem', padding: '0.9rem 2rem', opacity: isSpinning ? 0.6 : 1 }}
          >{isSpinning ? 'Spinning...' : '🎰 Pull the Lever'}</button>
        </div>
      </div>

      {resultItem && !isLoss && (
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h3 style={{ textAlign: 'center', color: 'var(--casino-gold)', marginBottom: '1rem', textShadow: '0 0 12px rgba(246,198,111,0.4)' }}>🎉 You won:</h3>
          <div style={{ background: 'linear-gradient(180deg, rgba(18,18,36,0.9), rgba(18,18,36,0.85))', padding: '1.5rem', borderRadius: 12, textAlign: 'center', boxShadow: '0 10px 24px rgba(0,0,0,0.25), 0 0 18px rgba(139,92,246,0.25)', border: '1px solid var(--border-200)' }}>
            <h4 style={{ color: '#e5e7eb', marginBottom: 8 }}>{resultItem.name}</h4>
            {resultItem.description && <p style={{ color: '#9ca3af', marginBottom: 8 }}>{resultItem.description}</p>}
            <p style={{ fontSize: '1.4rem', fontWeight: 'bold', color: resultItem.price < price ? '#34d399' : '#fca5a5' }}>${resultItem.price}</p>
            {resultItem.price < price && (
              <p style={{ color: '#34d399', fontWeight: 'bold' }}>💰 {(price - resultItem.price).toFixed(2)} will be added to your wallet!</p>
            )}
            {resultItem.price > price && (
              <p style={{ color: '#fda4af', fontWeight: 'bold' }}>🎁 You got a meal worth {(resultItem.price - price).toFixed(2)} more than you paid!</p>
            )}
            <div style={{ background: 'rgba(14,14,26,0.7)', color: '#93c5fd', padding: '0.75rem', borderRadius: 10, fontSize: '0.9rem', border: '1px solid rgba(96,165,250,0.35)', marginTop: '1rem' }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Payment Method:</div>
              {paymentMethod === 'wallet' && (<div>💰 Full Wallet Payment (${resultItem.price.toFixed(2)})</div>)}
              {paymentMethod === 'credit_card' && (<div>💳 Credit Card Payment (${resultItem.price.toFixed(2)})</div>)}
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button className="btn btn-success" onClick={showReceiptModal} style={{ fontSize: '1.05rem', padding: '0.9rem 2rem' }}>📄 View Receipt & Place Order</button>
          </div>
        </motion.div>
      )}

      {isLoss && (
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>💥💣</div>
            <h3 style={{ color: '#fda4af', marginBottom: '0.5rem', textShadow: '0 0 12px rgba(253,164,175,0.35)' }}>Bomb! You Lost</h3>
            <p style={{ color: '#9ca3af' }}>No prize this time. Better luck on the next spin!</p>
            <div style={{ marginTop: '1rem' }}>
              <button className="btn" onClick={() => setIsLoss(false)} style={{ marginRight: '0.5rem' }}>Try Again</button>
              <button className="btn btn-secondary" onClick={goBack}>Back to Menu</button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="card">
  <h3 style={{ color: '#e5e7eb', marginBottom: '1rem' }}>🎯 Game Rules</h3>
  <ul style={{ color: '#9ca3af', lineHeight: 1.6 }}>
          <li>Match all three for a premium pick close to your price.</li>
          <li>Two-of-a-kind gives you a favorable pick.</li>
          <li>🎰 Rare 7-7-7 jackpot grants the most expensive item!</li>
          <li>If your prize is cheaper than what you paid, the difference goes to your wallet.</li>
        </ul>
      </div>

      {showReceipt && resultItem && !isLoss && (
        <OrderReceipt
          restaurant={restaurant}
          selectedItem={resultItem}
          amountPaid={price}
          gameType="slots"
          paymentMethod={paymentMethod}
          onOrderPlaced={handleOrderPlaced}
          onBackToGame={handleBackToGame}
        />
      )}
    </div>
  );
};

export default Slots777;
