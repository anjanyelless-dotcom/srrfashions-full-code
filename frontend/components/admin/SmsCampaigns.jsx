import React, { useEffect, useState } from 'react';
import {
  getSmsCampaigns,
  getSmsCampaign,
  createSmsCampaign,
  getSmsRecipients,
  sendSmsCampaign,
  sendTestSms
} from '../../services/smsApi.js';

const tableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: 12 };
const thStyle = { textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid #ccc' };
const tdStyle = { padding: '8px 4px', borderBottom: '1px solid #eee' };
const btnStyle = { padding: '6px 12px', marginRight: 8, cursor: 'pointer' };
const inputStyle = { padding: '6px', marginRight: 8, minWidth: 200 };
const textareaStyle = { padding: '6px', width: '100%', minHeight: 80, resize: 'vertical' };

function isUnauthorized(err) {
  const message = (err.message || '').toLowerCase();
  return message.includes('unauthorized') || message.includes('401');
}

function SmsCampaigns({ onAuthError }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [viewCampaign, setViewCampaign] = useState(null);
  const [campaignDetails, setCampaignDetails] = useState(null);

  const [newCampaign, setNewCampaign] = useState({
    name: '',
    offer_id: '',
    message: '',
    template_id: '',
    sender_id: ''
  });

  const [recipientSelection, setRecipientSelection] = useState('all');
  const [recipients, setRecipients] = useState([]);
  const [recipientCount, setRecipientCount] = useState(0);
  const [recipientsLoading, setRecipientsLoading] = useState(false);

  const [testMobile, setTestMobile] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [testResult, setTestResult] = useState('');

  const fetchCampaigns = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getSmsCampaigns();
      setCampaigns(res.campaigns || []);
    } catch (err) {
      if (isUnauthorized(err)) {
        onAuthError?.();
      } else {
        setError(err.message || 'Failed to load campaigns.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    if (!newCampaign.name || !newCampaign.message) {
      setError('Campaign name and message are required.');
      return;
    }
    try {
      await createSmsCampaign(newCampaign);
      setNewCampaign({ name: '', offer_id: '', message: '', template_id: '', sender_id: '' });
      setShowCreate(false);
      await fetchCampaigns();
    } catch (err) {
      if (isUnauthorized(err)) {
        onAuthError?.();
      } else {
        setError(err.message || 'Failed to create campaign.');
      }
    }
  };

  const handleViewCampaign = async (id) => {
    setError('');
    setLoading(true);
    try {
      const res = await getSmsCampaign(id);
      setCampaignDetails(res);
      setViewCampaign(id);
    } catch (err) {
      if (isUnauthorized(err)) {
        onAuthError?.();
      } else {
        setError(err.message || 'Failed to load campaign details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFetchRecipients = async () => {
    setRecipientsLoading(true);
    setError('');
    try {
      const res = await getSmsRecipients({
        selection_type: recipientSelection,
        offer_id: newCampaign.offer_id || undefined
      });
      setRecipients(res.recipients || []);
      setRecipientCount(res.count || 0);
    } catch (err) {
      setError(err.message || 'Failed to fetch recipients.');
    } finally {
      setRecipientsLoading(false);
    }
  };

  const handleSendCampaign = async (campaignId) => {
    setError('');
    if (!window.confirm(`Send this promotional SMS to ${recipientCount} customers?`)) {
      return;
    }
    try {
      await sendSmsCampaign(campaignId, { recipients, custom_message: newCampaign.message });
      await fetchCampaigns();
      setViewCampaign(null);
      setCampaignDetails(null);
      setRecipients([]);
      setRecipientCount(0);
    } catch (err) {
      if (isUnauthorized(err)) {
        onAuthError?.();
      } else {
        setError(err.message || 'Failed to send campaign.');
      }
    }
  };

  const handleSendTest = async () => {
    setError('');
    setTestResult('');
    if (!testMobile || !testMessage) {
      setError('Mobile number and message are required.');
      return;
    }
    try {
      const res = await sendTestSms({ mobile: testMobile, message: testMessage, template_id: newCampaign.template_id });
      setTestResult(`Test SMS sent successfully. Provider Message ID: ${res.providerMessageId}`);
    } catch (err) {
      setError(err.message || 'Failed to send test SMS.');
    }
  };

  const formatDate = (value) => {
    if (!value) return '-';
    const d = new Date(value);
    return isNaN(d.getTime()) ? value : d.toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'green';
      case 'SENDING': return 'blue';
      case 'PARTIALLY_FAILED': return 'orange';
      case 'FAILED': return 'red';
      default: return 'gray';
    }
  };

  if (viewCampaign && campaignDetails) {
    return (
      <div>
        <button onClick={() => setViewCampaign(null)} style={btnStyle}>← Back to Campaigns</button>
        <h2 style={{ marginTop: 16 }}>Campaign: {campaignDetails.campaign.name}</h2>
        <div style={{ marginBottom: 16 }}>
          <strong>Status:</strong> <span style={{ color: getStatusColor(campaignDetails.campaign.status) }}>{campaignDetails.campaign.status}</span>
          <br />
          <strong>Total Recipients:</strong> {campaignDetails.campaign.total_recipients}
          <br />
          <strong>Sent:</strong> {campaignDetails.campaign.sent_count}
          <br />
          <strong>Failed:</strong> {campaignDetails.campaign.failed_count}
          <br />
          <strong>Created:</strong> {formatDate(campaignDetails.campaign.created_at)}
        </div>
        {campaignDetails.campaign.offer_id && (
          <div style={{ marginBottom: 16 }}>
            <strong>Offer:</strong> {campaignDetails.campaign.offer_title} ({campaignDetails.campaign.offer_type})
            <br />
            <strong>Discount:</strong> {campaignDetails.campaign.discount_value} {campaignDetails.campaign.discount_type}
          </div>
        )}
        <div style={{ marginBottom: 16 }}>
          <strong>Message:</strong>
          <pre style={{ background: '#f5f5f5', padding: 8, whiteSpace: 'pre-wrap' }}>{campaignDetails.campaign.message}</pre>
        </div>
        <h3>Recipients (Latest 100)</h3>
        {campaignDetails.recipients.length > 0 ? (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Mobile</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Sent At</th>
                <th style={thStyle}>Error</th>
              </tr>
            </thead>
            <tbody>
              {campaignDetails.recipients.map((r) => (
                <tr key={r.id}>
                  <td style={tdStyle}>{r.mobile}</td>
                  <td style={tdStyle}>{r.status}</td>
                  <td style={tdStyle}>{formatDate(r.sent_at)}</td>
                  <td style={tdStyle}>{r.error_message || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No recipients yet.</p>
        )}
      </div>
    );
  }

  if (showCreate) {
    return (
      <div>
        <button onClick={() => setShowCreate(false)} style={btnStyle}>← Back to Campaigns</button>
        <h2 style={{ marginTop: 16 }}>Create SMS Campaign</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <form onSubmit={handleCreate}>
          <div style={{ marginBottom: 12 }}>
            <label>Campaign Name:</label>
            <br />
            <input
              type="text"
              value={newCampaign.name}
              onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
              style={inputStyle}
              required
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Offer (Optional):</label>
            <br />
            <input
              type="text"
              value={newCampaign.offer_id}
              onChange={(e) => setNewCampaign({ ...newCampaign, offer_id: e.target.value })}
              style={inputStyle}
              placeholder="Offer ID"
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Message:</label>
            <br />
            <textarea
              value={newCampaign.message}
              onChange={(e) => setNewCampaign({ ...newCampaign, message: e.target.value })}
              style={textareaStyle}
              placeholder="Hi {{customer_name}}, get {{discount}} OFF at SRR Selections. Use code {{coupon_code}}. Shop now: https://www.srrfashions.in/"
              required
            />
            <small>Placeholders: {'{{customer_name}}'}, {'{{offer_title}}'}, {'{{discount}}'}, {'{{coupon_code}}'}, {'{{shop_url}}'}</small>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>DLT Template ID:</label>
            <br />
            <input
              type="text"
              value={newCampaign.template_id}
              onChange={(e) => setNewCampaign({ ...newCampaign, template_id: e.target.value })}
              style={inputStyle}
              placeholder="e.g., 1207161234567890123"
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Sender ID:</label>
            <br />
            <input
              type="text"
              value={newCampaign.sender_id}
              onChange={(e) => setNewCampaign({ ...newCampaign, sender_id: e.target.value })}
              style={inputStyle}
              placeholder="e.g., SRRSEL"
            />
          </div>
          <button type="submit" style={btnStyle}>Create Campaign</button>
        </form>

        <h3 style={{ marginTop: 24 }}>Recipients</h3>
        <div style={{ marginBottom: 12 }}>
          <label>
            <input
              type="radio"
              value="all"
              checked={recipientSelection === 'all'}
              onChange={(e) => setRecipientSelection(e.target.value)}
            /> All customers
          </label>
          <br />
          <label>
            <input
              type="radio"
              value="offer_eligible"
              checked={recipientSelection === 'offer_eligible'}
              onChange={(e) => setRecipientSelection(e.target.value)}
            /> Offer eligible customers
          </label>
        </div>
        <button onClick={handleFetchRecipients} style={btnStyle} disabled={recipientsLoading}>
          {recipientsLoading ? 'Loading…' : 'Fetch Recipients'}
        </button>
        {recipientCount > 0 && (
          <p style={{ marginTop: 8 }}>
            <strong>{recipientCount}</strong> recipients found.
          </p>
        )}

        {recipientCount > 0 && (
          <div style={{ marginTop: 16 }}>
            <button onClick={() => handleSendCampaign(campaigns[campaigns.length - 1]?.id)} style={{ ...btnStyle, backgroundColor: 'green', color: 'white' }}>
              SEND SMS
            </button>
          </div>
        )}

        <h3 style={{ marginTop: 24 }}>Test SMS</h3>
        <div style={{ marginBottom: 12 }}>
          <label>Mobile:</label>
          <br />
          <input
            type="text"
            value={testMobile}
            onChange={(e) => setTestMobile(e.target.value)}
            style={inputStyle}
            placeholder="9876543210"
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Message:</label>
          <br />
          <textarea
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            style={textareaStyle}
            placeholder="Test message"
          />
        </div>
        <button onClick={handleSendTest} style={btnStyle}>Send Test SMS</button>
        {testResult && <p style={{ marginTop: 8, color: 'green' }}>{testResult}</p>}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>SMS Campaigns</h2>
        <button onClick={() => setShowCreate(true)} style={{ ...btnStyle, backgroundColor: 'green', color: 'white' }}>
          + Create SMS Campaign
        </button>
      </div>

      {loading && <p>Loading campaigns…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && campaigns.length === 0 && <p>No campaigns found.</p>}

      {!loading && campaigns.length > 0 && (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Offer</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Recipients</th>
              <th style={thStyle}>Sent/Failed</th>
              <th style={thStyle}>Created</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id}>
                <td style={tdStyle}>{c.id}</td>
                <td style={tdStyle}>{c.name}</td>
                <td style={tdStyle}>{c.offer_title || '-'}</td>
                <td style={tdStyle}>
                  <span style={{ color: getStatusColor(c.status) }}>{c.status}</span>
                </td>
                <td style={tdStyle}>{c.total_recipients}</td>
                <td style={tdStyle}>{c.sent_count}/{c.failed_count}</td>
                <td style={tdStyle}>{formatDate(c.created_at)}</td>
                <td style={tdStyle}>
                  <button onClick={() => handleViewCampaign(c.id)} style={btnStyle}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default SmsCampaigns;
