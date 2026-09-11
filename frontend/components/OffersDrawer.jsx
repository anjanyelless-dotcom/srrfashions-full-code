import React, { useEffect, useState } from 'react';
import { useOffers } from './OffersContext.jsx';
import { useCart } from './CartContext.jsx';
import { formatPrice } from '../services/price.js';
import ReferFriend from './ReferFriend.jsx';
import './OffersDrawer.css';

const giftIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    style={{ width: '24px', height: '24px' }}
  >
    <polyline points="20 12 20 22 4 22 4 12" />
    <rect x="2" y="7" width="20" height="5" rx="1" />
    <path d="M12 22v-7" />
    <path d="M12 7V2" />
    <path d="M8 7a4 4 0 0 1 4-4 4 4 0 0 1 4 4" />
  </svg>
);

const OFFER_EMOJIS = {
  FIRST_ORDER: '🎁',
  REFERRAL: '👥',
  NEXT_ORDER: '🛍',
  SPECIAL: '🎉',
  BIRTHDAY: '🎂',
};

function getToken() {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage.getItem('customer_token');
}

const OffersDrawer = () => {
  const {
    isOpen,
    closeOffers,
    offers,
    eligibility,
    loading,
    error,
    appliedOffer,
    selectOffer,
    clearOffer,
    referral
  } = useOffers();
  const { subtotal } = useCart();
  const [view, setView] = useState('offers');

  const isLoggedIn = Boolean(getToken());

  // Reset to offers list when the drawer is closed
  useEffect(() => {
    if (!isOpen) {
      setView('offers');
    }
  }, [isOpen]);

  // Lock body scroll when offers drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.dispatchEvent(new CustomEvent('offers-opened'));
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  // Handle Escape key to close drawer
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        closeOffers();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOffers]);

  if (!isOpen) return null;

  const handleCardClick = (offer) => {
    if (offer.offerType === 'REFERRAL') {
      setView('refer');
      return;
    }
    if (subtotal <= 0) return;
    const status = eligibility[offer.offerType] || {};
    if (status.eligible) {
      selectOffer(offer.offerType);
    }
  };

  const renderOfferReason = (offer, status) => {
    if (status.eligible) {
      if (appliedOffer?.offerType === offer.offerType) {
        return <span className="sroffers-card-applied">Applied · Save {formatPrice(appliedOffer.discount)}</span>;
      }
      return null;
    }
    const reason = status.reason || (isLoggedIn ? 'Not currently available' : 'Login to use this offer');
    const isBirthdayMissing = status.reason === 'Birthday information is required';
    return (
      <>
        <span className="sroffers-card-reason">{reason}</span>
        {isBirthdayMissing && (
          <a
            className="sroffers-card-action"
            href="#my-account"
            onClick={(e) => {
              e.stopPropagation();
              closeOffers();
            }}
          >
            Add birthday in My Account
          </a>
        )}
      </>
    );
  };

  return (
    <div className="sroffers-wrap sroffers-active" aria-hidden={!isOpen}>
      <div className="sroffers-overlay" onClick={closeOffers} />
      <div
        className="sroffers-model"
        role="dialog"
        aria-modal="true"
        aria-label="Offers & Rewards"
      >
        <div className="sroffers-model-wrap">
          <div className="sroffers-model-header">
            <div className="sroffers-heading">
              {view === 'refer' ? (
                <button
                  type="button"
                  className="sroffers-back"
                  onClick={() => setView('offers')}
                  aria-label="Back to offers"
                >
                  ←
                </button>
              ) : (
                giftIcon
              )}
              <h4>{view === 'refer' ? 'Refer a Friend' : 'Offers & Rewards'}</h4>
            </div>
            <button
              type="button"
              className="sroffers-close"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                closeOffers();
              }}
              aria-label="Close offers"
            >
              ×
            </button>
          </div>

          <div className="sroffers-model-body">
            {view === 'offers' ? (
              <>
                {loading && (
                  <div className="sroffers-loading" style={{ padding: '1rem', textAlign: 'center' }}>
                    Loading offers…
                  </div>
                )}
                {!loading && error && (
                  <div className="sroffers-error" style={{ padding: '1rem', color: '#c0392b' }}>
                    {error}
                  </div>
                )}
                {!loading && !error && offers.length === 0 && (
                  <div className="sroffers-empty" style={{ padding: '1rem', textAlign: 'center' }}>
                    No offers available right now.
                  </div>
                )}
                {!loading && (
                  <ul className="sroffers-list" role="list">
                    {offers.map((offer) => {
                      const status = eligibility[offer.offerType] || {};
                      const isReferral = offer.offerType === 'REFERRAL';
                      const isSelected = appliedOffer?.offerType === offer.offerType;
                      const isClickable = isReferral || (status.eligible && subtotal > 0);
                      return (
                        <li
                          key={offer.id}
                          className={`sroffers-card${isReferral ? ' sroffers-referral' : ''}${
                            isSelected ? ' sroffers-card-selected' : ''
                          }${!status.eligible ? ' sroffers-card-ineligible' : ''}`}
                          role={isReferral ? 'button' : 'listitem'}
                          tabIndex={isReferral ? 0 : undefined}
                          aria-label={isReferral ? 'Open refer a friend' : undefined}
                          onClick={isClickable ? () => handleCardClick(offer) : undefined}
                          onKeyDown={
                            isReferral
                              ? (e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setView('refer');
                                  }
                                }
                              : undefined
                          }
                          style={{
                            ...(isSelected ? { border: '2px solid #3182ce', background: '#f0f7ff' } : {}),
                            ...(!status.eligible ? { opacity: 0.7 } : {}),
                            ...(isClickable ? { cursor: 'pointer' } : { cursor: 'default' })
                          }}
                        >
                          <span className="sroffers-card-emoji" aria-hidden="true">
                            {OFFER_EMOJIS[offer.offerType] || '🎁'}
                          </span>
                          <div className="sroffers-card-text">
                            <strong className="sroffers-card-title">{offer.title}</strong>
                            <span className="sroffers-card-desc">{offer.description}</span>
                            {renderOfferReason(offer, status)}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {appliedOffer && !loading && (
                  <div className="sroffers-applied-summary" style={{ padding: '1rem', borderTop: '1px solid #e0e0e0' }}>
                    <div>
                      <strong>{appliedOffer.offer.title}</strong> applied · save{' '}
                      {formatPrice(appliedOffer.discount)}
                    </div>
                    <button type="button" className="sroffers-clear-btn" onClick={clearOffer}>
                      Remove
                    </button>
                  </div>
                )}
              </>
            ) : (
              <ReferFriend referralOffer={referral} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OffersDrawer;
