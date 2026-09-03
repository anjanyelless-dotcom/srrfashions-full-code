import React, { useState } from 'react';
import './ContactUs.css';

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
};

const initialTouched = {
  firstName: false,
  lastName: false,
  email: false,
  phone: false,
  subject: false,
  message: false,
};

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const ContactUs = () => {
  const [form, setForm] = useState(initialForm);
  const [touched, setTouched] = useState(initialTouched);
  const [submitted, setSubmitted] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const validate = () => {
    const errors = {};
    if (!form.firstName.trim()) errors.firstName = 'First name is required';
    if (!form.lastName.trim()) errors.lastName = 'Last name is required';
    if (!form.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!isValidEmail(form.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!form.subject.trim()) errors.subject = 'Subject is required';
    if (!form.message.trim()) errors.message = 'Message is required';
    return errors;
  };

  const errors = validate();
  const hasErrors = Object.keys(errors).length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      subject: true,
      message: true,
    });
    if (Object.keys(validate()).length > 0) {
      setSubmitted(true);
      return;
    }
    setSuccess(true);
    setForm(initialForm);
    setTouched(initialTouched);
    setSubmitted(false);
    setTimeout(() => setSuccess(false), 6000);
  };

  const icons = {
    email: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8B9E7A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
    ),
    phone: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8B9E7A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.56 12.56 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.56 12.56 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
    ),
    location: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8B9E7A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
    ),
    hours: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8B9E7A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    ),
  };

  return (
    <div className="veloura-contact-page">
      {/* Hero */}
      <section className="veloura-contact-hero">
        <div className="veloura-contact-hero-overlay" />
        <div className="veloura-contact-hero-content">
          <span className="veloura-contact-label">Contact Us</span>
          <h1 className="veloura-contact-title">Let’s Start a Conversation</h1>
          <p className="veloura-contact-subtitle">
            Whether you have a question about an order, our collections, or simply want to get in touch, we’d love to hear from you.
          </p>
        </div>
      </section>

      {/* Contact Information */}
      <section className="veloura-contact-info">
        <div className="veloura-contact-info-inner">
          <div className="veloura-contact-card">
            <div className="veloura-contact-icon">{icons.email}</div>
            <h3 className="veloura-card-title">Email Us</h3>
            <p className="veloura-card-text"><a href="mailto:hello@veloura.com">hello@veloura.com</a></p>
          </div>
          <div className="veloura-contact-card">
            <div className="veloura-contact-icon">{icons.phone}</div>
            <h3 className="veloura-card-title">Call Us</h3>
            <p className="veloura-card-text"><a href="tel:+919876543210">+91 987 654 3210</a></p>
          </div>
          <div className="veloura-contact-card">
            <div className="veloura-contact-icon">{icons.location}</div>
            <h3 className="veloura-card-title">Visit Us</h3>
            <p className="veloura-card-text">Veloura Studio, Bandra West<br />Mumbai, Maharashtra 400050</p>
          </div>
          <div className="veloura-contact-card">
            <div className="veloura-contact-icon">{icons.hours}</div>
            <h3 className="veloura-card-title">Business Hours</h3>
            <p className="veloura-card-text">Monday – Friday<br />9:00 AM – 6:00 PM</p>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="veloura-contact-form-section">
        <div className="veloura-contact-form-inner">
          <div className="veloura-contact-image" aria-hidden="true" />
          <div className="veloura-contact-form-content">
            <h2 className="veloura-form-heading">
              How can we <span className="veloura-form-highlight">help you?</span>
            </h2>
            <p className="veloura-form-intro">
              Please share your questions or feedback using the form below. Our team will review your message and respond as soon as possible.
            </p>

            {success && (
              <div className="veloura-form-success">
                Thank you for reaching out. We have received your message and will get back to you shortly.
              </div>
            )}

            <form className="veloura-contact-form" noValidate onSubmit={handleSubmit}>
              <div className="veloura-form-row">
                <div className="veloura-form-field">
                  <label htmlFor="firstName">First Name *</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="First name"
                    className={touched.firstName && errors.firstName ? 'veloura-input-error' : ''}
                  />
                  {touched.firstName && errors.firstName && (
                    <span className="veloura-form-error">{errors.firstName}</span>
                  )}
                </div>
                <div className="veloura-form-field">
                  <label htmlFor="lastName">Last Name *</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Last name"
                    className={touched.lastName && errors.lastName ? 'veloura-input-error' : ''}
                  />
                  {touched.lastName && errors.lastName && (
                    <span className="veloura-form-error">{errors.lastName}</span>
                  )}
                </div>
              </div>

              <div className="veloura-form-row">
                <div className="veloura-form-field">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Email address"
                    className={touched.email && errors.email ? 'veloura-input-error' : ''}
                  />
                  {touched.email && errors.email && (
                    <span className="veloura-form-error">{errors.email}</span>
                  )}
                </div>
                <div className="veloura-form-field">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Phone number"
                  />
                </div>
              </div>

              <div className="veloura-form-field">
                <label htmlFor="subject">Subject *</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Subject"
                  className={touched.subject && errors.subject ? 'veloura-input-error' : ''}
                />
                {touched.subject && errors.subject && (
                  <span className="veloura-form-error">{errors.subject}</span>
                )}
              </div>

              <div className="veloura-form-field">
                <label htmlFor="message">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  rows="5"
                  value={form.message}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Your message"
                  className={touched.message && errors.message ? 'veloura-input-error' : ''}
                />
                {touched.message && errors.message && (
                  <span className="veloura-form-error">{errors.message}</span>
                )}
              </div>

              <button type="submit" className="veloura-form-button">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Help / FAQ */}
      <section className="veloura-contact-help">
        <div className="veloura-contact-help-inner">
          <h2 className="veloura-help-heading">Need help with an order?</h2>
          <div className="veloura-help-grid">
            <a href="#shipping" className="veloura-help-card">
              <span className="veloura-help-title">Shipping &amp; Delivery</span>
              <span className="veloura-help-desc">Track, delivery times, and shipping options.</span>
            </a>
            <a href="#returns" className="veloura-help-card">
              <span className="veloura-help-title">Returns &amp; Exchanges</span>
              <span className="veloura-help-desc">Easy returns, refunds, and exchange policies.</span>
            </a>
            <a href="#size-guide" className="veloura-help-card">
              <span className="veloura-help-title">Size Guide</span>
              <span className="veloura-help-desc">Find your perfect fit across all collections.</span>
            </a>
            <a href="#faq" className="veloura-help-card">
              <span className="veloura-help-title">FAQ</span>
              <span className="veloura-help-desc">Answers to our most commonly asked questions.</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactUs;
