import React, { useEffect, useMemo, useState } from 'react';
import { getProductDetails } from '../services/productApi.js';
import { addToCartApi } from '../services/cartApi.js';
import { useCart } from './CartContext.jsx';
import { CURRENCY_SYMBOL, formatMoney } from '../services/price.js';
import './ProductDetails.css';

function resolveUrl(src) {
  if (!src) return '';
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/')) return src;
  return src;
}

function getProductIdFromHash() {
  const hash = window.location.hash || '';
  const queryStart = hash.indexOf('?');
  if (queryStart === -1) return null;
  const params = new URLSearchParams(hash.slice(queryStart + 1));
  return params.get('id');
}

export default function ProductDetails() {
  const productId = getProductIdFromHash();
  const { fetchCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [adding, setAdding] = useState(false);
  const [details, setDetails] = useState(null);
  const [mainImage, setMainImage] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [qty, setQty] = useState(1);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(''), 3000);
    return () => clearTimeout(t);
  }, [success]);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      setError('Product ID is missing.');
      return;
    }

    setLoading(true);
    setError('');
    setDetails(null);
    setSelectedColor('');
    setSelectedSize('');
    setQty(1);

    getProductDetails(productId)
      .then((data) => {
        const productData = data.product || {};
        const images = [...(data.images || [])].sort(
          (a, b) => (a.display_order || 0) - (b.display_order || 0)
        );
        const resolvedImages = images.length
          ? images.map((img) => resolveUrl(img.image_url)).filter(Boolean)
          : [];

        const variants = data.variants || [];
        const hasVariantStock = variants.some((v) => v.available && v.stock_quantity > 0);
        const computedTotalStock = variants
          .filter((v) => v.available)
          .reduce((sum, v) => sum + Number(v.stock_quantity || 0), 0);

        setDetails({
          id: productData.id,
          title: productData.name || 'Product',
          images: resolvedImages,
          description: productData.description || '',
          category: productData.category_name || '',
          regularPrice: Number(productData.regular_price || productData.selling_price || 0),
          sellingPrice: Number(productData.selling_price || productData.regular_price || 0),
          discount: Number(productData.discount || 0),
          hasStock:
            productData.has_stock !== undefined ? productData.has_stock : hasVariantStock,
          totalStock:
            productData.total_stock !== undefined ? productData.total_stock : computedTotalStock,
          colors: data.available_colors || [],
          sizes: data.available_sizes || [],
          variants,
          isVariable:
            (data.available_colors || []).length > 0 || (data.available_sizes || []).length > 0,
        });

        setMainImage(resolvedImages[0] || '');
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load product details.');
        setLoading(false);
      });
  }, [productId]);

  useEffect(() => {
    setSelectedSize('');
  }, [selectedColor]);

  const enabledColors = useMemo(() => {
    if (!details?.variants?.length) return [];
    return [...new Set(
      details.variants
        .filter((v) => v.available && v.stock_quantity > 0)
        .map((v) => v.color)
    )];
  }, [details]);

  const enabledSizes = useMemo(() => {
    if (!details?.variants?.length) return [];
    const source = selectedColor
      ? details.variants.filter((v) => v.color === selectedColor)
      : enabledColors.length === 0
        ? details.variants
        : [];
    return [...new Set(
      source
        .filter((v) => v.available && v.stock_quantity > 0)
        .map((v) => v.size)
    )];
  }, [details, selectedColor, enabledColors]);

  const selectedVariant = useMemo(() => {
    if (!details?.variants?.length) return null;
    if (details.colors.length && !selectedColor) return null;
    if (details.sizes.length && !selectedSize) return null;
    if (details.colors.length === 0 && details.sizes.length === 0) {
      return details.variants.find((v) => v.available && v.stock_quantity > 0) || null;
    }
    const variant = details.variants.find(
      (v) => v.color === selectedColor && v.size === selectedSize
    );
    return variant && variant.available && variant.stock_quantity > 0 ? variant : null;
  }, [details, selectedColor, selectedSize]);

  const isAvailable = useMemo(() => {
    if (!details || !details.hasStock) return false;
    if (!details.isVariable) {
      return details.variants.some((v) => v.available && v.stock_quantity > 0);
    }
    return !!selectedVariant;
  }, [details, selectedVariant]);

  const discountPercent = useMemo(() => {
    if (!details || details.regularPrice <= 0 || details.sellingPrice >= details.regularPrice) return 0;
    return Math.round(((details.regularPrice - details.sellingPrice) / details.regularPrice) * 100);
  }, [details]);

  const handleAddToCart = async () => {
    setError('');
    setSuccess('');

    const token = localStorage.getItem('customer_token');
    if (!token) {
      setError('Please log in to add items to your cart.');
      try {
        sessionStorage.setItem('redirectAfterLogin', window.location.hash);
      } catch {
        // ignore
      }
      setTimeout(() => {
        window.location.hash = '#my-account';
      }, 1500);
      return;
    }

    if (!details || !details.id) {
      setError('Product information is missing.');
      return;
    }

    if (details.colors.length > 0 && !selectedColor) {
      setError('Please select a color.');
      return;
    }

    if (details.sizes.length > 0 && !selectedSize) {
      setError('Please select a size.');
      return;
    }

    if (!selectedVariant || !selectedVariant.id) {
      setError('Selected variant is unavailable.');
      return;
    }

    if (selectedVariant.stock_quantity <= 0) {
      setError('Selected variant is out of stock.');
      return;
    }

    if (qty < 1) {
      setError('Quantity must be at least 1.');
      return;
    }

    setAdding(true);

    try {
      const res = await addToCartApi(details.id, selectedVariant.id, qty);
      setSuccess(res?.message || `${details.title} added to cart`);
      await fetchCart();
    } catch (err) {
      const message = err.message || 'Failed to add item to cart.';
      if (message.includes('401') || message.toLowerCase().includes('unauthorized')) {
        localStorage.removeItem('customer_token');
        try {
          sessionStorage.setItem('redirectAfterLogin', window.location.hash);
        } catch {
          // ignore
        }
        setError('Your session has expired. Please log in again.');
        setTimeout(() => {
          window.location.hash = '#my-account';
        }, 1500);
      } else {
        setError(message);
      }
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '140px 20px', textAlign: 'center' }}>
        <p>Loading product details…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '140px 20px', textAlign: 'center' }}>
        <p style={{ color: '#c0392b' }}>{error}</p>
      </div>
    );
  }

  if (!details) {
    return (
      <div style={{ padding: '140px 20px', textAlign: 'center' }}>
        <p>Product not found.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '120px 20px 60px', background: '#fff' }}>
      <div
        className="srfashion-qv-content"
        style={{
          maxWidth: 980,
          margin: '0 auto',
          maxHeight: 'none',
          overflow: 'visible',
          boxShadow: 'none',
        }}
      >
        <div className="srfashion-qv-inner">
          <div className="srfashion-qv-gallery" style={{ background: '#fafafa' }}>
            <div className="srfashion-qv-main-image">
              {mainImage ? (
                <img src={mainImage} alt={details.title} />
              ) : (
                <div className="srfashion-qv-no-image" />
              )}
            </div>
            {details.images.length > 1 && (
              <div className="srfashion-qv-thumbs">
                {details.images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    className="srfashion-qv-thumb"
                    onClick={() => setMainImage(img)}
                    aria-label={`View image ${i + 1}`}
                  >
                    <img src={img} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="srfashion-qv-summary">
            <h1 className="product_title entry-title">{details.title}</h1>

            {details.category && (
              <p className="srfashion-qv-category">Category: {details.category}</p>
            )}

            <p className="price">
              {details.sellingPrice < details.regularPrice ? (
                <>
                  <del aria-hidden="true">
                    <span className="woocommerce-Price-amount amount">
                      <span className="woocommerce-Price-currencySymbol">{CURRENCY_SYMBOL}</span>
                      {formatMoney(details.regularPrice)}
                    </span>
                  </del>{' '}
                  <ins aria-hidden="true">
                    <span className="woocommerce-Price-amount amount">
                      <span className="woocommerce-Price-currencySymbol">{CURRENCY_SYMBOL}</span>
                      {formatMoney(details.sellingPrice)}
                    </span>
                  </ins>
                </>
              ) : (
                <span className="woocommerce-Price-amount amount">
                  <span className="woocommerce-Price-currencySymbol">{CURRENCY_SYMBOL}</span>
                  {formatMoney(details.sellingPrice)}
                </span>
              )}
            </p>

            {discountPercent > 0 && (
              <p className="srfashion-qv-discount">
                Save {discountPercent}%
              </p>
            )}

            {details.discount > 0 && discountPercent === 0 && (
              <p className="srfashion-qv-discount">
                You save:{' '}
                <span className="woocommerce-Price-amount amount">
                  <span className="woocommerce-Price-currencySymbol">{CURRENCY_SYMBOL}</span>
                  {formatMoney(details.discount)}
                </span>
              </p>
            )}

            <p className={`stock ${isAvailable ? 'in-stock' : 'out-of-stock'}`}>
              {!details.hasStock
                ? 'Out of stock'
                : details.isVariable && (!selectedColor || !selectedSize)
                  ? 'Select color and size'
                  : isAvailable
                    ? `In stock (${selectedVariant ? selectedVariant.stock_quantity : details.totalStock} available)`
                    : 'Out of stock'}
            </p>

            {details.description && (
              <div className="woocommerce-product-details__short-description">
                <p>{details.description}</p>
              </div>
            )}

            {details.isVariable && (
              <>
                {details.colors.length > 0 && (
                  <div className="srfashion-qv-variation">
                    <label htmlFor="srfashion-pd-color">
                      Color <span className="required">*</span>
                    </label>
                    <select
                      id="srfashion-pd-color"
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                    >
                      <option value="">Choose a color…</option>
                      {enabledColors.map((color) => (
                        <option key={color} value={color}>
                          {color}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {details.sizes.length > 0 && (
                  <div className="srfashion-qv-variation">
                    <label htmlFor="srfashion-pd-size">
                      Size <span className="required">*</span>
                    </label>
                    <select
                      id="srfashion-pd-size"
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      disabled={enabledColors.length > 0 && !selectedColor}
                    >
                      <option value="">Choose a size…</option>
                      {enabledSizes.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            <div className="srfashion-qv-qty-row">
              <label htmlFor="srfashion-pd-qty">Quantity</label>
              <input
                id="srfashion-pd-qty"
                type="number"
                min="1"
                max="99"
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="input-text qty text"
              />
            </div>

            {error && <div className="woocommerce-error srfashion-qv-error" style={{ marginBottom: '0.75rem' }}>{error}</div>}
            {success && (
              <div style={{ marginBottom: '0.75rem', padding: '0.75rem 1rem', background: '#f0f7f0', color: '#2d5f2e' }}>
                {success}
              </div>
            )}

            <div className="srfashion-qv-actions">
              <button
                type="button"
                className="single_add_to_cart_button button alt"
                onClick={handleAddToCart}
                disabled={!isAvailable || adding}
              >
                {adding ? 'Adding…' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
