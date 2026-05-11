import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkshops } from '../contexts/WorkshopContext';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import {
  CreditCard, Lock, ArrowLeft, Calendar, Clock, Shield,
  ChevronRight, Wifi
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export const Payment = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getWorkshopById, addBooking, updateSeatAvailability, loading: workshopsLoading } = useWorkshops();
  const { user } = useAuth();
  const workshop = getWorkshopById(id!);

  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [cardFlipped, setCardFlipped] = useState(false);
  const [activeField, setActiveField] = useState('');

  if (workshopsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl mb-4">Workshop not found</h2>
          <Button onClick={() => navigate('/')}>Back to Workshops</Button>
        </div>
      </div>
    );
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!cardNumber || !cardName || !expiryDate || !cvv) {
      setError('Please fill in all payment details');
      return;
    }
    if (cardNumber.replace(/\s/g, '').length !== 16) {
      setError('Please enter a valid 16-digit card number');
      return;
    }
    if (cvv.length !== 3) {
      setError('CVV must be 3 digits');
      return;
    }
    setProcessing(true);
    setTimeout(async () => {
      const paymentId = `PAY-${Date.now()}`;
      const booking = {
        id: `BKG-${Date.now()}`,
        userId: user!.id,
        userName: user!.name,
        userEmail: user!.email,
        workshopId: workshop.id,
        workshopTitle: workshop.title,
        date: workshop.date,
        price: workshop.price,
        bookingDate: new Date().toISOString(),
        paymentId,
        paymentMethod: 'Credit Card',
        status: 'confirmed' as const,
        amount: workshop.price,
      };
      
      try {
        await addBooking(booking);
        await updateSeatAvailability(workshop.id, 1);
        navigate(`/payment-success/${booking.id}`);
      } catch (e) {
        console.error("Failed booking process", e);
        toast.error("Failed to process booking. Please try again.");
        setProcessing(false);
      }
    }, 2500);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const parts = [];
    for (let i = 0, len = v.length; i < len; i += 4) {
      parts.push(v.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const maskedNumber = cardNumber
    ? cardNumber.padEnd(19, ' ').split(' ').join(' ')
    : '•••• •••• •••• ••••';

  const getCardBrand = () => {
    const n = cardNumber.replace(/\s/g, '');
    if (n.startsWith('4')) return 'VISA';
    if (n.startsWith('5')) return 'MC';
    if (n.startsWith('3')) return 'CAT';
    return null;
  };

  const cardBrand = getCardBrand();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <button
            onClick={() => navigate(`/workshop/${id}`)}
            className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors text-sm"
          >
            <ArrowLeft className="size-4" />
            Back to Workshop
          </button>
          <ChevronRight className="size-4 text-gray-300" />
          <span className="text-sm text-gray-700 font-medium">Secure Payment</span>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Card Visual + Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Credit Card Visual */}
            <div className="mb-8" style={{ perspective: '1000px' }}>
              <motion.div
                animate={{ rotateY: cardFlipped ? 180 : 0 }}
                transition={{ duration: 0.5 }}
                style={{ transformStyle: 'preserve-3d', position: 'relative', height: '200px' }}
              >
                {/* Front */}
                <div
                  className="absolute inset-0 rounded-2xl overflow-hidden"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600" />
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px), radial-gradient(circle at 20% 80%, white 1px, transparent 1px)',
                      backgroundSize: '30px 30px',
                    }}
                  />
                  <div className="absolute inset-0 p-6 flex flex-col justify-between text-white">
                    <div className="flex items-center justify-between">
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-1.5">
                        <Wifi className="size-5 text-white rotate-90" />
                      </div>
                      {cardBrand ? (
                        <span className="text-white font-bold text-lg tracking-widest">{cardBrand}</span>
                      ) : (
                        <CreditCard className="size-8 text-white/60" />
                      )}
                    </div>
                    <div>
                      <div className="text-lg tracking-widest font-mono mb-3 text-white/90">
                        {activeField === 'cardNumber' || cardNumber
                          ? cardNumber || '•••• •••• •••• ••••'
                          : '•••• •••• •••• ••••'}
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-white/50 text-xs uppercase tracking-wider mb-0.5">Card Holder</p>
                          <p className="text-sm font-medium tracking-wide uppercase">
                            {cardName || 'YOUR NAME'}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/50 text-xs uppercase tracking-wider mb-0.5">Expires</p>
                          <p className="text-sm font-medium">
                            {expiryDate || 'MM/YY'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Back */}
                <div
                  className="absolute inset-0 rounded-2xl overflow-hidden"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-700 via-indigo-700 to-blue-700" />
                  <div className="absolute top-8 left-0 right-0 h-12 bg-black/40" />
                  <div className="absolute top-28 left-6 right-6">
                    <div className="bg-white/10 rounded-lg p-3 flex items-center justify-end">
                      <div className="bg-white rounded px-3 py-1">
                        <p className="text-gray-700 text-sm font-mono tracking-wider">
                          {cvv || '•••'}
                        </p>
                      </div>
                    </div>
                    <p className="text-white/60 text-xs text-right mt-1">CVV</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="bg-indigo-50 rounded-xl p-2">
                  <CreditCard className="size-4.5 text-indigo-600" />
                </div>
                <h2 className="text-base font-semibold text-gray-800">Card Details</h2>
                <div className="ml-auto flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1">
                  <Shield className="size-3 text-green-600" />
                  <span className="text-xs text-green-700 font-medium">Secure</span>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm"
                  >
                    <span className="size-1.5 rounded-full bg-red-500 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handlePayment} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cardName" className="text-gray-600 text-xs uppercase tracking-wide">Cardholder Name</Label>
                  <Input
                    id="cardName"
                    placeholder="John Doe"
                    value={cardName}
                    onChange={e => setCardName(e.target.value)}
                    onFocus={() => { setActiveField('cardName'); setCardFlipped(false); }}
                    disabled={processing}
                    className="h-11 rounded-xl bg-gray-50 border-gray-200 focus:bg-white uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cardNumber" className="text-gray-600 text-xs uppercase tracking-wide">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                    onFocus={() => { setActiveField('cardNumber'); setCardFlipped(false); }}
                    maxLength={19}
                    disabled={processing}
                    className="h-11 rounded-xl bg-gray-50 border-gray-200 focus:bg-white font-mono tracking-wider"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="expiry" className="text-gray-600 text-xs uppercase tracking-wide">Expiry Date</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      value={expiryDate}
                      onChange={e => {
                        let value = e.target.value.replace(/\D/g, '');
                        if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2, 4);
                        setExpiryDate(value);
                      }}
                      onFocus={() => { setActiveField('expiry'); setCardFlipped(false); }}
                      maxLength={5}
                      disabled={processing}
                      className="h-11 rounded-xl bg-gray-50 border-gray-200 focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cvv" className="text-gray-600 text-xs uppercase tracking-wide">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="•••"
                      value={cvv}
                      onChange={e => setCvv(e.target.value.replace(/\D/g, ''))}
                      onFocus={() => { setActiveField('cvv'); setCardFlipped(true); }}
                      onBlur={() => setCardFlipped(false)}
                      maxLength={3}
                      type="password"
                      disabled={processing}
                      className="h-11 rounded-xl bg-gray-50 border-gray-200 focus:bg-white"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl border-0 shadow-lg shadow-indigo-200/50 text-base mt-2 transition-all"
                  disabled={processing}
                >
                  {processing ? (
                    <span className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="size-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Processing Payment...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Lock className="size-4" />
                      Pay ${workshop.price} Securely
                    </span>
                  )}
                </Button>

                <p className="text-center text-xs text-gray-400">
                  🔒 Simulated payment — no real transaction occurs
                </p>
              </form>
            </div>
          </motion.div>

          {/* Right: Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5">
                <p className="text-white/70 text-xs uppercase tracking-wide mb-1">Order Summary</p>
                <h2 className="text-xl text-white">{workshop.title}</h2>
                <p className="text-indigo-200 text-sm mt-1">by {workshop.instructor}</p>
              </div>

              <div className="p-5 space-y-4">
                <div className="space-y-3">
                  {[
                    { icon: Calendar, label: 'Date', value: new Date(workshop.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) },
                    { icon: Clock, label: 'Time', value: workshop.time },
                    { icon: Clock, label: 'Duration', value: workshop.duration },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <Icon className="size-4" />
                        {label}
                      </div>
                      <span className="text-sm font-medium text-gray-800">{value}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Workshop Price</span>
                    <span className="font-medium">${workshop.price}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Processing Fee</span>
                    <span className="text-green-600 font-medium">Free</span>
                  </div>
                </div>

                <div className="bg-indigo-50 rounded-xl p-4 flex justify-between items-center">
                  <span className="text-indigo-900 font-semibold">Total</span>
                  <span className="text-2xl text-indigo-700 font-bold">${workshop.price}</span>
                </div>

                {/* Trust badges */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {[
                    { icon: Shield, label: 'Secure' },
                    { icon: Lock, label: 'Encrypted' },
                    { icon: CreditCard, label: 'Safe Pay' },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex flex-col items-center gap-1 bg-gray-50 rounded-xl py-2.5">
                      <Icon className="size-4 text-indigo-400" />
                      <span className="text-xs text-gray-500">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};