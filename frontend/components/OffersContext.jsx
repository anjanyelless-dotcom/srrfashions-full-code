import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
  getPublicOffers,
  getOffersEligibility,
  applyOffer,
  getMyReferrals
} from '../services/offersApi.js';
import { useCart } from './CartContext.jsx';

const OffersContext = createContext(null);

const DISPLAY_ORDER = ['FIRST_ORDER', 'REFERRAL', 'NEXT_ORDER', 'SPECIAL', 'BIRTHDAY'];

function getToken() {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage.getItem('customer_token');
}

function sortOffers(offers = []) {
  const orderMap = Object.fromEntries(DISPLAY_ORDER.map((type, i) => [type, i]));
  return [...offers].sort((a, b) => {
    const aIdx = orderMap[a.offerType] ?? Infinity;
    const bIdx = orderMap[b.offerType] ?? Infinity;
    return aIdx - bIdx;
  });
}

export const OffersProvider = ({ children }) => {
  const { subtotal } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [offers, setOffers] = useState([]);
  const [eligibility, setEligibility] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [appliedOffer, setAppliedOffer] = useState(() => {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      const stored = window.localStorage.getItem('srfashion_applied_offer');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const selectedOfferTypeRef = useRef(appliedOffer?.offerType || null);
  const [referral, setReferral] = useState(null);

  const fetchOffers = useCallback(async () => {
    try {
      const data = await getPublicOffers();
      if (data?.success) setOffers(sortOffers(data.offers));
    } catch (err) {
      console.error('Failed to fetch public offers:', err);
      setError('Unable to load offers. Please try again.');
    }
  }, []);

  const fetchEligibility = useCallback(async () => {
    if (!getToken()) {
      setEligibility({});
      return;
    }
    try {
      const data = await getOffersEligibility();
      if (data?.success) setEligibility(data.eligibility || {});
    } catch (err) {
      console.error('Failed to fetch offer eligibility:', err);
      if (err.message?.toLowerCase().includes('unauthorized')) {
        setEligibility({});
      }
    }
  }, []);

  const fetchReferral = useCallback(async () => {
    if (!getToken()) return;
    try {
      const data = await getMyReferrals();
      if (data?.success) setReferral(data);
    } catch (err) {
      console.error('Failed to fetch referral info:', err);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    await Promise.all([fetchOffers(), fetchEligibility(), fetchReferral()]);
    setLoading(false);
  }, [fetchOffers, fetchEligibility, fetchReferral]);

  useEffect(() => {
    if (isOpen) loadAll();
  }, [isOpen, loadAll]);

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'customer_token' && isOpen) {
        setAppliedOffer(null);
        setEligibility({});
        loadAll();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [isOpen, loadAll]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      if (appliedOffer) {
        window.localStorage.setItem('srfashion_applied_offer', JSON.stringify(appliedOffer));
      } else {
        window.localStorage.removeItem('srfashion_applied_offer');
      }
    } catch {
      // ignore storage errors
    }
  }, [appliedOffer]);

  const clearOffer = useCallback(() => {
    selectedOfferTypeRef.current = null;
    setAppliedOffer(null);
    setError('');
  }, []);

  const applySelectedOffer = useCallback(
    async (offerType) => {
      setError('');
      if (subtotal <= 0) {
        setError('Add products to your cart before applying an offer.');
        clearOffer();
        return;
      }
      try {
        const data = await applyOffer(offerType, subtotal);
        if (data?.success) {
          selectedOfferTypeRef.current = offerType;
          setAppliedOffer({ ...data, offerType });
        } else {
          setError(data?.error || 'Failed to apply offer.');
          clearOffer();
        }
      } catch (err) {
        setError(err.message || 'Failed to apply offer.');
        clearOffer();
      }
    },
    [subtotal]
  );

  const selectOffer = useCallback(
    (offerType) => applySelectedOffer(offerType),
    [applySelectedOffer]
  );

  useEffect(() => {
    if (subtotal <= 0) {
      clearOffer();
      return;
    }
    if (selectedOfferTypeRef.current) {
      applySelectedOffer(selectedOfferTypeRef.current);
    }
  }, [subtotal, applySelectedOffer, clearOffer]);

  const openOffers = useCallback(() => setIsOpen(true), []);
  const closeOffers = useCallback(() => setIsOpen(false), []);
  const toggleOffers = useCallback(() => setIsOpen((prev) => !prev), []);

  const value = {
    isOpen,
    openOffers,
    closeOffers,
    toggleOffers,
    offers,
    eligibility,
    loading,
    error,
    appliedOffer,
    referral,
    selectOffer,
    clearOffer,
    refresh: loadAll
  };

  return <OffersContext.Provider value={value}>{children}</OffersContext.Provider>;
};

export const useOffers = () => {
  const context = useContext(OffersContext);
  if (!context) {
    throw new Error('useOffers must be used within an OffersProvider');
  }
  return context;
};
