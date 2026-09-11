require('dotenv-flow/config');

const SMS_PROVIDER_MODE = process.env.SMS_PROVIDER_MODE || 'mock';
const SMSLOCAL_API_KEY = process.env.SMSLOCAL_API_KEY;
const SMSLOCAL_SENDER_ID = process.env.SMSLOCAL_SENDER_ID;
const SMSLOCAL_DLT_TEMPLATE_ID = process.env.SMSLOCAL_DLT_TEMPLATE_ID;

const MOBILE_REGEX = /^[6-9]\d{9}$/;

function maskMobile(mobile) {
  if (!mobile || typeof mobile !== 'string') return '******';
  return `******${mobile.slice(-4)}`;
}

function normalizeMobile(mobile) {
  if (!mobile) return null;
  const cleaned = String(mobile).replace(/\D/g, '');
  if (cleaned.length === 10 && MOBILE_REGEX.test(cleaned)) {
    return cleaned;
  }
  if (cleaned.length === 11 && cleaned.startsWith('91')) {
    const withoutCode = cleaned.slice(1);
    if (MOBILE_REGEX.test(withoutCode)) {
      return withoutCode;
    }
  }
  return null;
}

async function sendPromotionalSms({ mobile, message, templateId }) {
  const normalized = normalizeMobile(mobile);
  if (!normalized) {
    return { success: false, error: 'Invalid mobile number' };
  }

  if (SMS_PROVIDER_MODE === 'mock') {
    console.log(`[SMS MOCK] To: ${maskMobile(normalized)}, Template: ${templateId || 'N/A'}, Message: ${message.substring(0, 50)}...`);
    return {
      success: true,
      providerMessageId: `MOCK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      mobile: normalized,
      mode: 'mock'
    };
  }

  if (SMS_PROVIDER_MODE === 'smslocal') {
    if (!SMSLOCAL_API_KEY || !SMSLOCAL_SENDER_ID) {
      return { success: false, error: 'SMS provider not configured' };
    }

    const params = new URLSearchParams({
      key: SMSLOCAL_API_KEY,
      route: '2',
      sender: SMSLOCAL_SENDER_ID,
      number: normalized,
      sms: message,
      templateid: templateId || ''
    });

    try {
      const response = await fetch('https://www.smslocal.in/api/sendhttp.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      });

      const text = await response.text();
      const result = text.split('|');
      const messageId = result[1] || null;
      const status = result[0];

      if (status === 'OK' || status === 'success') {
        console.log(`[SMS SENT] To: ${maskMobile(normalized)}, Provider Message ID: ${messageId}`);
        return {
          success: true,
          providerMessageId: messageId,
          mobile: normalized,
          mode: 'smslocal'
        };
      } else {
        console.error(`[SMS FAILED] To: ${maskMobile(normalized)}, Status: ${status}`);
        return {
          success: false,
          error: `Provider error: ${status}`,
          mobile: normalized
        };
      }
    } catch (error) {
      console.error(`[SMS ERROR] To: ${maskMobile(normalized)}, Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
        mobile: normalized
      };
    }
  }

  return { success: false, error: 'Invalid SMS provider mode' };
}

module.exports = {
  sendPromotionalSms,
  normalizeMobile,
  maskMobile,
  MOBILE_REGEX
};
