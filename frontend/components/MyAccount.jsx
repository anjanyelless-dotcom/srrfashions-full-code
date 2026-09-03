import React, { useEffect, useState } from 'react';
import { loginCustomer, registerCustomer } from '../services/authApi.js';
import { useCart } from './CartContext.jsx';
import Addresses from './Addresses.jsx';
import CustomerOrders from './CustomerOrders.jsx';
import './MyAccount.css';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const mobileRegex = /^\d{10}$/;

function getCustomerUser() {
  try {
    return JSON.parse(localStorage.getItem('customer_user') || 'null');
  } catch {
    return null;
  }
}

function saveCustomerAuth(user, token) {
  localStorage.setItem('customer_user', JSON.stringify(user));
  localStorage.setItem('customer_token', token);
}

function removeCustomerAuth() {
  localStorage.removeItem('customer_user');
  localStorage.removeItem('customer_token');
}

const MyAccount = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const { fetchCart, clearCart } = useCart();

  const [login, setLogin] = useState({ identifier: '', password: '', remember: false });
  const [loginErrors, setLoginErrors] = useState([]);
  const [loginSuccess, setLoginSuccess] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [register, setRegister] = useState({
    full_name: '',
    email: '',
    mobile_number: '',
    password: '',
  });
  const [registerErrors, setRegisterErrors] = useState([]);
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    setCurrentUser(getCustomerUser());
  }, []);

  useEffect(() => {
    const page = document.getElementById('page');
    if (page) {
      page.classList.add('srfashion-my-account-page');
      return () => page.classList.remove('srfashion-my-account-page');
    }
  }, []);

  const handleLogout = (e) => {
    e.preventDefault();
    removeCustomerAuth();
    clearCart();
    setCurrentUser(null);
  };

  const validateLogin = () => {
    const errors = [];
    const value = login.identifier.trim();
    if (!value) {
      errors.push('Email or mobile number is required.');
    } else if (!emailRegex.test(value) && !mobileRegex.test(value)) {
      errors.push('Please enter a valid email address or 10-digit mobile number.');
    }
    if (!login.password) {
      errors.push('Password is required.');
    }
    return errors;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginSuccess('');
    const errors = validateLogin();
    setLoginErrors(errors);
    if (errors.length) return;

    setIsLoggingIn(true);
    try {
      const data = await loginCustomer(login.identifier.trim(), login.password);
      saveCustomerAuth(data.user, data.token);
      setCurrentUser(data.user);
      await fetchCart();
      setLoginSuccess(data.message || 'Login successful');
      setLogin({ identifier: '', password: '', remember: false });

      const redirect = sessionStorage.getItem('redirectAfterLogin');
      if (redirect) {
        sessionStorage.removeItem('redirectAfterLogin');
        window.location.hash = redirect;
      }
    } catch (err) {
      setLoginErrors([err.message]);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const validateRegister = () => {
    const errors = [];
    if (!register.full_name.trim()) {
      errors.push('Full name is required.');
    }
    if (!register.email.trim()) {
      errors.push('Email address is required.');
    } else if (!emailRegex.test(register.email.trim())) {
      errors.push('Please enter a valid email address.');
    }
    if (!register.mobile_number.trim()) {
      errors.push('Mobile number is required.');
    } else if (!mobileRegex.test(register.mobile_number.trim())) {
      errors.push('Please enter a valid 10-digit mobile number.');
    }
    if (!register.password) {
      errors.push('Password is required.');
    } else if (register.password.length < 6) {
      errors.push('Password must be at least 6 characters.');
    }
    return errors;
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterSuccess('');
    const errors = validateRegister();
    setRegisterErrors(errors);
    if (errors.length) return;

    setIsRegistering(true);
    try {
      const data = await registerCustomer({
        full_name: register.full_name.trim(),
        email: register.email.trim(),
        mobile_number: register.mobile_number.trim(),
        password: register.password,
      });
      saveCustomerAuth(data.user, data.token);
      setCurrentUser(data.user);
      await fetchCart();
      setRegisterSuccess(data.message || 'Registration successful');
      setRegister({ full_name: '', email: '', mobile_number: '', password: '' });

      const redirect = sessionStorage.getItem('redirectAfterLogin');
      if (redirect) {
        sessionStorage.removeItem('redirectAfterLogin');
        window.location.hash = redirect;
      } else {
        setActiveTab('login');
      }
    } catch (err) {
      setRegisterErrors([err.message]);
    } finally {
      setIsRegistering(false);
    }
  };

  const renderLogin = () => (
    <>
      <h2 className="srfashion-form-title">Login</h2>
      <form
        className="woocommerce-form woocommerce-form-login login"
        onSubmit={handleLoginSubmit}
        noValidate
      >
        <p className="woocommerce-form-row woocommerce-form-row--wide form-row form-row-wide">
          <label htmlFor="identifier">
            Email or mobile number&nbsp;
            <span className="required" aria-hidden="true">*</span>
            <span className="screen-reader-text">Required</span>
          </label>
          <input
            type="text"
            className="woocommerce-Input woocommerce-Input--text input-text"
            id="identifier"
            name="identifier"
            autoComplete="username"
            value={login.identifier}
            onChange={(e) => setLogin({ ...login, identifier: e.target.value })}
            disabled={isLoggingIn}
            required
          />
        </p>

        <p className="woocommerce-form-row woocommerce-form-row--wide form-row form-row-wide">
          <label htmlFor="password">
            Password&nbsp;
            <span className="required" aria-hidden="true">*</span>
            <span className="screen-reader-text">Required</span>
          </label>
          <input
            className="woocommerce-Input woocommerce-Input--text input-text"
            type="password"
            id="password"
            name="password"
            autoComplete="current-password"
            value={login.password}
            onChange={(e) => setLogin({ ...login, password: e.target.value })}
            disabled={isLoggingIn}
            required
          />
        </p>

        <p className="form-row">
          <label className="woocommerce-form__label woocommerce-form__label-for-checkbox woocommerce-form-login__rememberme">
            <input
              className="woocommerce-form__input woocommerce-form__input-checkbox"
              name="rememberme"
              type="checkbox"
              id="rememberme"
              value="forever"
              checked={login.remember}
              onChange={(e) => setLogin({ ...login, remember: e.target.checked })}
              disabled={isLoggingIn}
            />
            <span>Remember me</span>
          </label>
          <button
            type="submit"
            className="woocommerce-button button woocommerce-form-login__submit"
            name="login"
            value="Log in"
            disabled={isLoggingIn}
          >
            {isLoggingIn ? 'Logging in…' : 'Log in'}
          </button>
        </p>

        <p className="woocommerce-LostPassword lost_password">
          <a href="#" onClick={(e) => { e.preventDefault(); setLoginErrors([]); setLoginSuccess(''); }}>
            Lost your password?
          </a>
        </p>
      </form>
    </>
  );

  const renderRegister = () => (
    <>
      <h2 className="srfashion-form-title">Sign Up</h2>
      <form
        className="woocommerce-form woocommerce-form-register register"
        onSubmit={handleRegisterSubmit}
        noValidate
      >
        <p className="woocommerce-form-row woocommerce-form-row--wide form-row form-row-wide">
          <label htmlFor="reg_full_name">
            Full name&nbsp;
            <span className="required" aria-hidden="true">*</span>
            <span className="screen-reader-text">Required</span>
          </label>
          <input
            type="text"
            className="woocommerce-Input woocommerce-Input--text input-text"
            id="reg_full_name"
            name="full_name"
            autoComplete="name"
            value={register.full_name}
            onChange={(e) => setRegister({ ...register, full_name: e.target.value })}
            disabled={isRegistering}
            required
          />
        </p>

        <p className="woocommerce-form-row woocommerce-form-row--wide form-row form-row-wide">
          <label htmlFor="reg_email">
            Email address&nbsp;
            <span className="required" aria-hidden="true">*</span>
            <span className="screen-reader-text">Required</span>
          </label>
          <input
            type="email"
            className="woocommerce-Input woocommerce-Input--text input-text"
            id="reg_email"
            name="email"
            autoComplete="email"
            value={register.email}
            onChange={(e) => setRegister({ ...register, email: e.target.value })}
            disabled={isRegistering}
            required
          />
        </p>

        <p className="woocommerce-form-row woocommerce-form-row--wide form-row form-row-wide">
          <label htmlFor="reg_mobile_number">
            Mobile number&nbsp;
            <span className="required" aria-hidden="true">*</span>
            <span className="screen-reader-text">Required</span>
          </label>
          <input
            type="tel"
            className="woocommerce-Input woocommerce-Input--text input-text"
            id="reg_mobile_number"
            name="mobile_number"
            autoComplete="tel"
            value={register.mobile_number}
            onChange={(e) => setRegister({ ...register, mobile_number: e.target.value })}
            disabled={isRegistering}
            required
          />
        </p>

        <p className="woocommerce-form-row woocommerce-form-row--wide form-row form-row-wide">
          <label htmlFor="reg_password">
            Password&nbsp;
            <span className="required" aria-hidden="true">*</span>
            <span className="screen-reader-text">Required</span>
          </label>
          <input
            type="password"
            className="woocommerce-Input woocommerce-Input--text input-text"
            id="reg_password"
            name="password"
            autoComplete="new-password"
            value={register.password}
            onChange={(e) => setRegister({ ...register, password: e.target.value })}
            disabled={isRegistering}
            required
          />
        </p>

        <p className="form-row">
          <button
            type="submit"
            className="woocommerce-button button woocommerce-form-register__submit"
            name="register"
            value="Register"
            disabled={isRegistering}
          >
            {isRegistering ? 'Creating account…' : 'Register'}
          </button>
        </p>
      </form>
    </>
  );

  return (
    <div className="srfashion-my-account">
      <div id="content" className="page-content thunk-page no-sidebar">
        <div className="container">
          <div className="content-wrap">
            <div className="main-area">
              <div id="primary" className="primary-content-area">
                <div className="primary-content-wrap">
                  <div className="page-head">
                    <h1 className="entry-title">My account</h1>
                    <nav aria-label="Breadcrumbs" className="breadcrumb-trail breadcrumbs">
                      <h2 className="trail-browse"></h2>
                      <ul className="thunk-breadcrumb trail-items">
                        <li className="trail-item trail-begin">
                          <a href="#" rel="home"><span>Home</span></a>
                        </li>
                        <li className="trail-item trail-end"><span>My account</span></li>
                      </ul>
                    </nav>
                  </div>

                  <div className="thunk-content-wrap">
                    <article id="post-9">
                      <div className="entry-content">
                        {currentUser && (
                          <div className="srfashion-user-bar">
                            <span>
                              Logged in as <strong>{currentUser.full_name || currentUser.email}</strong>
                              {currentUser.email ? ` (${currentUser.email})` : ''}
                            </span>
                            <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('orders'); }} className="srfashion-my-orders">
                              My Orders
                            </a>
                            <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('addresses'); }} className="srfashion-manage-addresses">
                              Manage Addresses
                            </a>
                            <a href="#" onClick={handleLogout} className="srfashion-logout">
                              Log out
                            </a>
                          </div>
                        )}

                        <div className="woocommerce">
                          <div className="woocommerce-notices-wrapper">
                            {loginErrors.length > 0 && (
                              <ul className="woocommerce-error" role="alert">
                                {loginErrors.map((err, i) => (
                                  <li key={`lerr-${i}`}>{err}</li>
                                ))}
                              </ul>
                            )}
                            {loginSuccess && (
                              <div className="woocommerce-message" role="status">
                                {loginSuccess}
                              </div>
                            )}
                            {registerErrors.length > 0 && (
                              <ul className="woocommerce-error" role="alert">
                                {registerErrors.map((err, i) => (
                                  <li key={`rerr-${i}`}>{err}</li>
                                ))}
                              </ul>
                            )}
                            {registerSuccess && (
                              <div className="woocommerce-message" role="status">
                                {registerSuccess}
                              </div>
                            )}
                          </div>

                          <div className="thsm-popup-header">
                            <button
                              type="button"
                              className={`col-1 th-popup-tab ${activeTab === 'login' ? 'active' : ''}`}
                              onClick={() => { setActiveTab('login'); setLoginErrors([]); setLoginSuccess(''); }}
                            >
                              Login
                            </button>
                            <button
                              type="button"
                              className={`col-2 th-popup-tab ${activeTab === 'register' ? 'active' : ''}`}
                              onClick={() => { setActiveTab('register'); setRegisterErrors([]); setRegisterSuccess(''); }}
                            >
                              Sign Up
                            </button>
                          </div>

                          <div className="thsm-popup-content">
                            {activeTab === 'addresses' ? (
                              <Addresses />
                            ) : activeTab === 'orders' ? (
                              <CustomerOrders />
                            ) : activeTab === 'login' ? (
                              renderLogin()
                            ) : (
                              renderRegister()
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyAccount;
