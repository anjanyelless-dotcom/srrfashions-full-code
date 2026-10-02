import React, { useEffect, useState } from 'react';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import Overlays from './Overlays.jsx';
import CartDrawer from './CartDrawer.jsx';
import OffersDrawer from './OffersDrawer.jsx';
import WhatsAppButton from './WhatsAppButton.jsx';
import { getCategoryBySlug, getCategoryProductsBySlug } from '../services/categoryApi.js';
import { formatMoney } from '../services/price.js';
import { setCategorySEO, setNotFoundSEO } from '../utils/seo.js';
import { setBreadcrumbSchema, removeBreadcrumbSchema } from '../utils/structuredData.js';
import './CategoryPage.css';

const SITE_URL = 'https://www.srrfashions.in';

function slugify(text) {
  return String(text || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function escapeHtml(text) {
  return String(text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function resolveImageUrl(product) {
  const url = product?.images?.[0]?.image_url;
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) return url;
  if (url.startsWith('wp-content/')) return url;
  if (url.startsWith('uploads/')) return url.replace(/^uploads\//, 'wp-content/uploads/sites/383/');
  return 'wp-content/uploads/sites/383/' + url;
}

function hasAvailableVariants(product) {
  return (product.variants || []).some((v) => v.available && v.stock_quantity > 0);
}

function productCardHtml(product) {
  const id = product.id;
  const name = escapeHtml(product.name || '');
  const slug = product.slug || slugify(product.name);
  const regular = formatMoney(product.regular_price);
  const selling = formatMoney(product.selling_price);
  const hasSale = Number(product.regular_price || 0) > Number(product.selling_price || 0);
  const discount = formatMoney(product.discount || (hasSale ? Number(product.regular_price) - Number(product.selling_price) : 0));
  const sku = product.variants && product.variants[0] ? product.variants[0].sku : '';
  const image = resolveImageUrl(product) || 'wp-content/uploads/sites/383/2026/06/placeholder.jpg';
  const categoryClass = product.category_name ? 'product_cat-' + slugify(product.category_name) : '';
  const saleClass = hasSale ? 'sale' : '';
  const inStock = hasAvailableVariants(product);
  const stockClass = inStock ? 'instock' : 'outofstock';

  const priceHtml = hasSale
    ? `<del aria-hidden="true"><span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">&#8377;</span>${regular}</span></del><ins aria-hidden="true"><span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">&#8377;</span>${selling}</span></ins>`
    : `<span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">&#8377;</span>${selling}</span>`;

  const saleHtml = hasSale
    ? `<div class="elemento-product-sale"><span class="elemento-product-onsale"><span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">&#8377;</span>${discount}</span></span></div>`
    : '';

  const isVariable = (product.variants || []).length > 1 || product.available_colors?.length > 1 || product.available_sizes?.length > 1;
  const firstVariant = (product.variants || [])[0];
  const firstVariantId = firstVariant?.id || '';
  const describedById = `woocommerce_loop_add_to_cart_link_describedby_${id}`;

  const variableScreenReader = `<span id="${describedById}" class="screen-reader-text">This product has multiple variants. The options may be chosen on the product page</span>`;

  let actionsHtml = '';

  if (isVariable) {
    actionsHtml = `<a href="/product/${slug}" aria-describedby="${describedById}" data-quantity="1" class="button product_type_variable add_to_cart_button" data-product_id="${id}" data-product_sku="${sku}" aria-label="Select options for &ldquo;${name}&rdquo;" rel="nofollow" role="button">Select options</a> ${variableScreenReader}`;
  } else if (inStock) {
    actionsHtml = `
      <a href="/product/${slug}" data-quantity="1" class="button product_type_simple add_to_cart_button" data-product_id="${id}" data-product_sku="${sku}" data-variant_id="${firstVariantId}" aria-label="Add to cart: &ldquo;${name}&rdquo;" rel="nofollow" role="button" style="margin-right:8px;">Add to cart</a>
      <a href="/product/${slug}" data-quantity="1" class="button product_type_simple add_to_cart_button buy_now_button" data-product_id="${id}" data-product_sku="${sku}" data-variant_id="${firstVariantId}" aria-label="Buy now: &ldquo;${name}&rdquo;" rel="nofollow" role="button">Buy now</a>`;
  } else {
    actionsHtml = `<a href="/product/${slug}" aria-describedby="${describedById}" class="button product_type_simple add_to_cart_button" data-product_id="${id}" data-product_sku="${sku}" aria-label="Out of stock: &ldquo;${name}&rdquo;" rel="nofollow" role="button" aria-disabled="true" style="pointer-events:none;opacity:0.6;">Out of stock</a>`;
  }

  return `<div class="elemento-addons-advance-product thunk-woo-product-list opn-qv-enable th-shop-mania-woo-hover-zoom open-single-product-tab-horizontal open-shadow- open-shadow-hover- th-shop-mania-single-product-content-left product type-product post-${id} status-publish ${stockClass} ${categoryClass} has-post-thumbnail ${saleClass} shipping-taxable ${inStock ? 'purchasable' : ''} product-type-${isVariable ? 'variable has-default-attributes' : 'simple'}">
    <div class="elemento-addons-advance-product-info">
      <div class="elemento-product-summary-wrap">
        <div class="elemento-product-thumbnail-wrap">
          <div class="elemento-advance-product-icon">
            <div class="elemento-ad-wishlist elemento-ad-icon">
              <span class="elemento-ad-wishlist-inner">
                <div class="thw-add-to-wishlist-button-wrap th-theme-action thw-add-to-wishlist-shorcode thw-btn-theme-style">
                  <a class="thw-add-to-wishlist-button is-shortcode th-wishlist-integrated th-icon-text"
                    data-tooltip="Wishlist" aria-label="Wishlist" data-browse-text="" data-product-id="${id}"
                    data-variation-id="0" data-add-icon="th-icon th-icon-heart1"
                    data-browse-icon="th-icon th-icon-favorite"><span class="thw-icon add"><svg
                        class="th-wishlist-icon-svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round"
                          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                      </svg></span><span class="thw-to-add-text"></span></a>
                </div>
              </span>
            </div>
          </div>
          ${saleHtml}
          <a href="/product/${slug}">
            <img decoding="async" width="600" height="800" src="${image}" class="attachment-woocommerce_thumbnail size-woocommerce_thumbnail wp-post-image" alt="${name}" loading="lazy" />
          </a>
        </div>
        <div class="elemento-product-title">
          <a href="/product/${slug}">${name}</a>
        </div>
        <div class="elemento-product-price">${priceHtml}</div>
        <div class="elemento-product-add-to-cart-button">
          <p class="product woocommerce add_to_cart_inline elemento-product-add-to-cart" style="display:flex; gap:8px; flex-wrap:wrap; justify-content:center;">
            ${actionsHtml}
          </p>
        </div>
      </div>
    </div>
  </div>`;
}

export default function CategoryPage({ slug }) {
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    async function loadCategory() {
      setLoading(true);
      setError(null);
      setCategory(null);
      setProducts([]);

      try {
        // Fetch category info
        const categoryData = await getCategoryBySlug(slug);
        setCategory(categoryData.category);

        // Update SEO metadata with category data
        setCategorySEO(categoryData.category);

        // Update breadcrumb schema
        setBreadcrumbSchema([
          { name: 'Home', url: `${SITE_URL}/` },
          { name: categoryData.category.name, url: `${SITE_URL}/category/${categoryData.category.slug}` }
        ]);

        // Fetch category products
        const productsData = await getCategoryProductsBySlug(slug, { page: 1, limit: 20 });
        setProducts(productsData.products || []);
        setPagination(productsData.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
      } catch (err) {
        console.error('Failed to load category:', err);
        if (err.message.includes('404') || err.message.includes('not found')) {
          setError('Category not found');
          setNotFoundSEO('category');
          removeBreadcrumbSchema();
        } else {
          setError('Failed to load category. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadCategory();
    }
  }, [slug]);

  // Remove breadcrumb schema when component unmounts
  useEffect(() => {
    return () => {
      removeBreadcrumbSchema();
    };
  }, []);

  const handlePageChange = (newPage) => {
    async function loadPage() {
      setLoading(true);
      try {
        const productsData = await getCategoryProductsBySlug(slug, { page: newPage, limit: 20 });
        setProducts(productsData.products || []);
        setPagination(productsData.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
        window.scrollTo(0, 0);
      } catch (err) {
        console.error('Failed to load page:', err);
        setError('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    loadPage();
  };

  if (loading) {
    return (
      <>
        <div id="page" className="th-shop-mania-site">
          <Header />
          <div style={{ padding: '140px 20px', textAlign: 'center' }}>
            <p>Loading category…</p>
          </div>
          <Footer />
        </div>
        <Overlays />
        <CartDrawer />
        <OffersDrawer />
        <WhatsAppButton />
      </>
    );
  }

  if (error === 'Category not found') {
    setNotFoundSEO('category');
    return (
      <>
        <div id="page" className="th-shop-mania-site">
          <Header />
          <div style={{ padding: '140px 20px', textAlign: 'center' }}>
            <h2>Category Not Found</h2>
            <p>The category you're looking for doesn't exist.</p>
            <button 
              onClick={() => window.history.pushState({}, '', '/')}
              style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}
            >
              Back to Home
            </button>
          </div>
          <Footer />
        </div>
        <Overlays />
        <CartDrawer />
        <OffersDrawer />
        <WhatsAppButton />
      </>
    );
  }

  if (error) {
    return (
      <>
        <div id="page" className="th-shop-mania-site">
          <Header />
          <div style={{ padding: '140px 20px', textAlign: 'center' }}>
            <h2>Error</h2>
            <p>{error}</p>
            <button 
              onClick={() => window.history.pushState({}, '', '/')}
              style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}
            >
              Back to Home
            </button>
          </div>
          <Footer />
        </div>
        <Overlays />
        <CartDrawer />
        <OffersDrawer />
        <WhatsAppButton />
      </>
    );
  }

  return (
    <>
      <div id="page" className="th-shop-mania-site">
        <Header />
        <div className="category-page-container" style={{ padding: '140px 20px 60px' }}>
          <div className="category-header" style={{ marginBottom: '40px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>
              {category?.name || 'Category'}
            </h1>
            {category?.description && (
              <p style={{ fontSize: '1.1rem', color: '#666', maxWidth: '800px', margin: '0 auto' }}>
                {category.description}
              </p>
            )}
          </div>

          {products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <p style={{ fontSize: '1.2rem', color: '#666' }}>
                No products found in this category.
              </p>
            </div>
          ) : (
            <>
              <div 
                className="elemento-addons-advance-product-list-wrap sale-left icon-right"
                dangerouslySetInnerHTML={{ __html: products.map(productCardHtml).join('') }}
              />

              {pagination.totalPages > 1 && (
                <div className="category-pagination" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '40px' }}>
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    style={{
                      padding: '10px 20px',
                      cursor: pagination.page === 1 ? 'not-allowed' : 'pointer',
                      opacity: pagination.page === 1 ? 0.5 : 1,
                      border: '1px solid #ddd',
                      background: '#fff'
                    }}
                  >
                    Previous
                  </button>
                  <span style={{ padding: '10px 20px', display: 'flex', alignItems: 'center' }}>
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    style={{
                      padding: '10px 20px',
                      cursor: pagination.page === pagination.totalPages ? 'not-allowed' : 'pointer',
                      opacity: pagination.page === pagination.totalPages ? 0.5 : 1,
                      border: '1px solid #ddd',
                      background: '#fff'
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        <Footer />
      </div>
      <Overlays />
      <CartDrawer />
      <OffersDrawer />
      <WhatsAppButton />
    </>
  );
}
