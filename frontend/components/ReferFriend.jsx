import React, { useState } from 'react';
import './ReferFriend.css';

const DEFAULT_FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'https://www.srrfashions.in';

const defaultReferralOffer = {
  friendReward: '₹50 OFF',
  yourReward: '₹50 OFF',
  referralCode: 'SRR50',
  referralLink: DEFAULT_FRONTEND_URL,
};

const whatsappIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="#fff"
    width="20"
    height="20"
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 5.835h-.004c-1.058-.006-2.088-.27-2.99-.742l-.215-.113-2.225.585.595-2.17-.142-.228C5.74 16.09 4.814 13.38 4.814 10.97c0-4.56 3.707-8.26 8.267-8.26s8.267 3.7 8.267 8.26c0 4.56-3.707 8.26-8.267 8.26h.001z" />
  </svg>
);

const ReferFriend = ({ referralOffer = defaultReferralOffer }) => {
  const friendReward = referralOffer?.friendReward || defaultReferralOffer.friendReward;
  const yourReward = referralOffer?.yourReward || defaultReferralOffer.yourReward;
  const referralCode = referralOffer?.referralCode || defaultReferralOffer.referralCode;
  const referralLink =
    referralOffer?.referralLink ||
    referralOffer?.shareLink ||
    defaultReferralOffer.referralLink;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const textToCopy = referralCode || '';
    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch (err) {
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappMessage = `Hi! 👋 I’m sharing ${friendReward} with you on SRR Selections.\nUse my referral code ${referralCode} when placing your first order.\n🛍️ Shop now: ${referralLink}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="sroffers-refer">
      <div className="sroffers-refer-emoji" aria-hidden="true">
        👥
      </div>

      <h3 className="sroffers-refer-title">Invite a Friend</h3>

      <p className="sroffers-refer-desc">
        Give your friend <strong>{friendReward}</strong> on their first order and get{' '}
        <strong>{yourReward}</strong> when they complete their purchase.
      </p>

      <div className="sroffers-refer-label">Your Referral Code</div>

      <div className="sroffers-refer-code-box">
        <span className="sroffers-refer-code" aria-label={`Referral code ${referralCode}`}>
          {referralCode}
        </span>
        <button
          type="button"
          className={`sroffers-refer-copy${copied ? ' copied' : ''}`}
          onClick={handleCopy}
          aria-live="polite"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <a
        className="sroffers-refer-whatsapp"
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Invite a friend on WhatsApp"
      >
        <span className="sroffers-refer-whatsapp-icon">{whatsappIcon}</span>
        INVITE ON WHATSAPP
      </a>
    </div>
  );
};

export default ReferFriend;
