import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

import { CartProvider } from './components/CartContext.jsx';
import { WishlistProvider } from './components/WishlistContext.jsx';
import { OffersProvider } from './components/OffersContext.jsx';

const root = createRoot(document.getElementById('root'));
root.render(
  <StrictMode>
    <CartProvider>
      <WishlistProvider>
        <OffersProvider>
          <App />
        </OffersProvider>
      </WishlistProvider>
    </CartProvider>
  </StrictMode>
);
