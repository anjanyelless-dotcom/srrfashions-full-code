import React, { useEffect, useState } from 'react';
import { useWishlist } from './WishlistContext.jsx';
import { useCart } from './CartContext.jsx';
import { getProductDetails } from '../services/productApi.js';
import { addToCartApi } from '../services/cartApi.js';
import { formatPrice } from '../services/price.js';
import './Wishlist.css';

function getProductSlug(link, id) {
  const slugMatch = (link || '').match(/product\/([^\/]+)\/index\.html/);
  return slugMatch ? slugMatch[1] : `product-${id}`;
}

function getColors(details) {
  if (!details) return [];
  if (details.variants?.length) {
    return [...new Set(details.variants.filter((v) => v.available && v.stock_quantity > 0).map((v) => v.color))].filter(Boolean);
  }
  return details.available_colors || [];
}

function getSizes(details, color) {
  if (!details) return [];
  if (details.variants?.length) {
    const source = color
      ? details.variants.filter((v) => v.color === color)
      : details.variants;
    return [...new Set(source.filter((v) => v.available && v.stock_quantity > 0).map((v) => v.size))].filter(Boolean);
  }
  return details.available_sizes || [];
}

function findVariant(details, color, size) {
  if (!details?.variants?.length) return null;
  if ((details.available_colors?.length || 0) === 0 && (details.available_sizes?.length || 0) === 0) {
    return details.variants.find((v) => v.available && v.stock_quantity > 0) || null;
  }
  return (
    details.variants.find(
      (v) => v.color === color && v.size === size && v.available && v.stock_quantity > 0
    ) || null
  );
}

export default function Wishlist() {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { fetchCart } = useCart();

  const [details, setDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});
  const [selectedOptions, setSelectedOptions] = useState({});
  const [adding, setAdding] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!wishlist.length) return;
    const newIds = wishlist.filter((item) => !details[item.id]).map((item) => item.id);
    if (!newIds.length) return;

    setLoadingDetails((prev) => {
      const next = { ...prev };
      newIds.forEach((id) => (next[id] = true));
      return next;
    });

    Promise.all(
      newIds.map(async (id) => {
        try {
          const data = await getProductDetails(id);
          return { id, data };
        } catch {
          return { id, data: null };
        }
      })
    ).then((results) => {
      setDetails((prev) => {
        const next = { ...prev };
        const selections = { ...selectedOptions };
        results.forEach(({ id, data }) => {
          next[id] = data;
          if (data && !selections[id]) {
            const item = wishlist.find((w) => String(w.id) === String(id));
            selections[id] = { color: item?.color || '', size: item?.size || '' };
          }
        });
        setSelectedOptions(selections);
        return next;
      });
      setLoadingDetails((prev) => {
        const next = { ...prev };
        newIds.forEach((id) => (next[id] = false));
        return next;
      });
    });
  }, [wishlist]);

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(t);
  }, [feedback]);

  const goToProduct = (item) => {
    const slug = getProductSlug(item.link, item.id);
    window.location.hash = `#/product/${encodeURIComponent(slug)}/?id=${item.id}`;
  };

  const goToHome = () => {
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelect = (id, field, value) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
        ...(field === 'color' ? { size: '' } : {}),
      },
    }));
  };

  const handleAddToCart = async (item) => {
    setFeedback(null);
    const productDetails = details[item.id];

    if (!productDetails || loadingDetails[item.id]) {
      setFeedback({ type: 'error', message: 'Product details are still loading.' });
      return;
    }

    const token = localStorage.getItem('customer_token');
    if (!token) {
      setFeedback({ type: 'error', message: 'Please log in to add items to your cart.' });
      setTimeout(() => {
        window.location.hash = '#my-account';
      }, 1200);
      return;
    }

    const { color, size } = selectedOptions[item.id] || { color: '', size: '' };
    const colors = getColors(productDetails);
    const sizes = getSizes(productDetails, color);

    if (colors.length > 0 && !color) {
      setFeedback({ type: 'error', message: `Please select a color for ${item.name}.` });
      return;
    }

    if (sizes.length > 0 && !size) {
      setFeedback({ type: 'error', message: `Please select a size for ${item.name}.` });
      return;
    }

    const variant = findVariant(productDetails, color, size);

    if (!variant || !variant.id) {
      setFeedback({ type: 'error', message: `Selected variant for ${item.name} is unavailable.` });
      return;
    }

    if (variant.stock_quantity <= 0) {
      setFeedback({ type: 'error', message: `${item.name} is out of stock.` });
      return;
    }

    setAdding(item.id);

    try {
      const res = await addToCartApi(item.id, variant.id, 1);
      setFeedback({ type: 'success', message: res?.message || `${item.name} added to cart` });
      await fetchCart();
    } catch (err) {
      const message = err.message || 'Failed to add item to cart.';
      if (message.includes('401') || message.toLowerCase().includes('unauthorized')) {
        localStorage.removeItem('customer_token');
        setFeedback({ type: 'error', message: 'Your session has expired. Please log in again.' });
        setTimeout(() => {
          window.location.hash = '#my-account';
        }, 1200);
      } else {
        setFeedback({ type: 'error', message: message });
      }
    } finally {
      setAdding(null);
    }
  };

  if (wishlist.length === 0) {
    return (
      <div className="srfashion-wishlist-page">
        <div className="srfashion-wishlist-empty">
          <h1>Your wishlist is empty</h1>
          <p>Browse our products and save your favourites here.</p>
          <button type="button" className="srfashion-wishlist-continue" onClick={goToHome}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="srfashion-wishlist-page">
      <div className="srfashion-wishlist-header">
        <h1>Your Wishlist</h1>
        <p>{wishlist.length} item{wishlist.length > 1 ? 's' : ''}</p>
      </div>

      {feedback && (
        <div
          className={
            feedback.type === 'success'
              ? 'srfashion-wishlist-feedback srfashion-wishlist-success'
              : 'srfashion-wishlist-feedback srfashion-wishlist-error'
          }
        >
          {feedback.message}
        </div>
      )}

      <div className="srfashion-wishlist-items">
        {wishlist.map((item) => {
          const productDetails = details[item.id];
          const selected = selectedOptions[item.id] || { color: '', size: '' };
          const colors = getColors(productDetails);
          const sizes = getSizes(productDetails, selected.color);
          const isAdding = adding === item.id;

          return (
            <div key={item.id} className="srfashion-wishlist-item">
              <div
                className="srfashion-wishlist-image"
                onClick={() => goToProduct(item)}
                role="button"
                tabIndex={0}
                aria-label={`View ${item.name}`}
              >
                {item.image ? (
                  <img src={item.image} alt={item.name} loading="lazy" />
                ) : (
                  <div className="srfashion-wishlist-no-image" />
                )}
              </div>

              <div className="srfashion-wishlist-info">
                <h2 onClick={() => goToProduct(item)} role="button" tabIndex={0}>
                  {item.name}
                </h2>
                <div className="srfashion-wishlist-price">{formatPrice(item.price)}</div>

                {productDetails && colors.length > 0 && (
                  <div className="srfashion-wishlist-variation">
                    <label>Color</label>
                    <select
                      name="color"
                      value={selected.color}
                      onChange={(e) => handleSelect(item.id, 'color', e.target.value)}
                    >
                      <option value="">Choose a color…</option>
                      {colors.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {productDetails && sizes.length > 0 && (
                  <div className="srfashion-wishlist-variation">
                    <label>Size</label>
                    <select
                      name="size"
                      value={selected.size}
                      onChange={(e) => handleSelect(item.id, 'size', e.target.value)}
                      disabled={colors.length > 0 && !selected.color}
                    >
                      <option value="">Choose a size…</option>
                      {sizes.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="srfashion-wishlist-actions-row">
                <button
                  type="button"
                  className="srfashion-wishlist-add-to-cart"
                  onClick={() => handleAddToCart(item)}
                  disabled={isAdding}
                >
                  {isAdding ? 'Adding…' : 'Add to Cart'}
                </button>
                <button
                  type="button"
                  className="srfashion-wishlist-remove"
                  onClick={() => removeFromWishlist(item.id)}
                  aria-label={`Remove ${item.name} from wishlist`}
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="srfashion-wishlist-actions">
        <button type="button" className="srfashion-wishlist-continue" onClick={goToHome}>
          Continue Shopping
        </button>
        <button type="button" className="srfashion-wishlist-clear" onClick={clearWishlist}>
          Clear Wishlist
        </button>
      </div>
    </div>
  );
}
