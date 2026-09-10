import React, { useEffect } from 'react';
import RawHtmlTag from './RawHtmlTag.jsx';
import { getProducts } from '../services/productApi.js';
import { formatMoney } from '../services/price.js';

const JustLandedSectionHtml = `
                <div class="e-con-inner">
                    <div class="lge-glass elementor-element elementor-element-150bd27 elementor-widget elementor-widget-heading"
                        data-id="150bd27" data-element_type="widget" data-e-type="widget"
                        data-widget_type="heading.default">
                        <h2 class="elementor-heading-title elementor-size-default">Just Landed</h2>
                    </div>
                    <div class="elementor-element elementor-element-5ffa18f elemento-heading-fill-color elementor-widget elementor-widget-elemento-advance-heading"
                        data-id="5ffa18f" data-element_type="widget" data-e-type="widget"
                        data-widget_type="elemento-advance-heading.default">
                        <div class="elementor-widget-container">
                            <div class="elemento-heading-wrapper">
                                <h2 class="elemento-addon-heading_ elemento-animation-added"
                                    id="elemento-addon-heading_"><a><span
                                            class="elemento-heading-text elemento-heading-text-1 ">New</span><span
                                            class="elemento-heading-text-second elemento-hilighted-text    "><span
                                                class="elemento-heading-text"> Arrivals</span><svg
                                                xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 150"
                                                preserveAspectRatio="none"
                                                style="animation-duration: 1.2s;-webkit-animation-duration:1.2s;animation-delay: 1.2s;-webkit-animation-delay:1.2s;">
                                                <path
                                                    d="M325,18C228.7-8.3,118.5,8.3,78,21C22.4,38.4,4.6,54.6,5.6,77.6c1.4,32.4,52.2,54,142.6,63.7 c66.2,7.1,212.2,7.5,273.5-8.3c64.4-16.6,104.3-57.6,33.8-98.2C386.7-4.9,179.4-1.4,126.3,20.7">
                                                </path>
                                            </svg></span></a></h2>
                            </div>
                        </div>
                    </div>
                    <div class="elementor-element elementor-element-a3af386 elementor-widget elementor-widget-elemento_advance_product"
                        data-id="a3af386" data-element_type="widget" data-e-type="widget"
                        data-settings="{&quot;adv_product_number_of_column&quot;:4,&quot;adv_product_number_of_column_tablet&quot;:3,&quot;adv_product_number_of_column_mobile&quot;:2}"
                        data-widget_type="elemento_advance_product.default">
                        <div class="elementor-widget-container">

                            <div class="elemento-addons-advance-product-wrapper">

                                <div class="elemento-addons-advance-product-content-wrapper">


                                    <div class="elementoaddons-advance-product-tab-wrap">

                                        <ul class="tab-list-filter tab-advance-product tab-center">

                                        </ul>

                                    </div>



                                    <div class="elemento-addons-advance-product-content-wrap">

                                        <div class="elemento-addons-advance-product-list-wrap sale-left  icon-right  "
                                            data-ajaxquant="">

                                            <p style="text-align:center;padding:40px 0;" class="just-landed-loading">Loading products…</p>

                                        </div>

                                        <div class="elemento-loadContainer">
                                            <div class="elemento-loader"></div>
                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>
                    </div>
                    <div class="elementor-element elementor-element-134a993 elementor-widget elementor-widget-button"
                        data-id="134a993" data-element_type="widget" data-e-type="widget"
                        data-widget_type="button.default">
                        <a class="elementor-button elementor-button-link elementor-size-sm elementor-animation-shrink"
                            href="shop/index.html">
                            <span class="elementor-button-content-wrapper">
                                <span class="elementor-button-text">VIEW ALL PRODUCTS</span>
                            </span>
                        </a>
                    </div>
                </div>
            `;
const JustLandedSectionAttribs = {
    "className": "elementor-element elementor-element-6a644e6 e-flex e-con-boxed e-con e-parent",
    "data-id": "6a644e6",
    "data-element_type": "container",
    "data-e-type": "container"
};

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
  const slug = slugify(product.name);
  const regular = formatMoney(product.regular_price);
  const selling = formatMoney(product.selling_price);
  const hasSale = Number(product.regular_price || 0) > Number(product.selling_price || 0);
  const discountAmount = hasSale ? formatMoney(Number(product.regular_price) - Number(product.selling_price)) : '0.00';
  const discount = formatMoney(product.discount || (hasSale ? Number(product.regular_price) - Number(product.selling_price) : 0));
  const sku = product.variants && product.variants[0] ? product.variants[0].sku : '';
  const image = resolveImageUrl(product) || 'wp-content/uploads/sites/383/2026/06/placeholder.jpg';
  const categoryClass = product.category_name ? 'product_cat-' + slugify(product.category_name) : '';
  const saleClass = hasSale ? 'sale' : '';
  const inStock = hasAvailableVariants(product);
  const stockClass = inStock ? 'instock' : 'outofstock';

  const priceHtml = hasSale
    ? `<del aria-hidden="true"><span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">&#8377;</span>${regular}</span></del><span class="screen-reader-text">Original price was: &#8377;${regular}.</span><ins aria-hidden="true"><span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">&#8377;</span>${selling}</span></ins><span class="screen-reader-text">Current price is: &#8377;${selling}.</span>`
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
    actionsHtml = `<a href="product/${slug}/index.html" aria-describedby="${describedById}" data-quantity="1" class="button product_type_variable add_to_cart_button" data-product_id="${id}" data-product_sku="${sku}" aria-label="Select options for &ldquo;${name}&rdquo;" rel="nofollow" role="button">Select options</a> ${variableScreenReader}`;
  } else if (inStock) {
    actionsHtml = `
      <a href="product/${slug}/index.html" data-quantity="1" class="button product_type_simple add_to_cart_button" data-product_id="${id}" data-product_sku="${sku}" data-variant_id="${firstVariantId}" aria-label="Add to cart: &ldquo;${name}&rdquo;" rel="nofollow" role="button" style="margin-right:8px;">Add to cart</a>
      <a href="product/${slug}/index.html" data-quantity="1" class="button product_type_simple add_to_cart_button buy_now_button" data-product_id="${id}" data-product_sku="${sku}" data-variant_id="${firstVariantId}" aria-label="Buy now: &ldquo;${name}&rdquo;" rel="nofollow" role="button">Buy now</a>`;
  } else {
    actionsHtml = `<a href="product/${slug}/index.html" aria-describedby="${describedById}" class="button product_type_simple add_to_cart_button" data-product_id="${id}" data-product_sku="${sku}" aria-label="Out of stock: &ldquo;${name}&rdquo;" rel="nofollow" role="button" aria-disabled="true" style="pointer-events:none;opacity:0.6;">Out of stock</a>`;
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
          <a href="product/${slug}/index.html">
            <img decoding="async" width="600" height="800" src="${image}" class="attachment-woocommerce_thumbnail size-woocommerce_thumbnail wp-post-image" alt="${name}" loading="lazy" />
          </a>
        </div>
        <div class="elemento-product-title">
          <a href="product/${slug}/index.html">${name}</a>
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

function JustLandedSection() {
  useEffect(() => {
    const setLoading = () => {
      const container = document.querySelector('.elemento-addons-advance-product-list-wrap');
      if (container) container.innerHTML = '<p style="text-align:center;padding:40px 0;">Loading products…</p>';
      const tabList = document.querySelector('.tab-list-filter.tab-advance-product.tab-center');
      if (tabList) tabList.innerHTML = '';
    };

    setLoading();

    getProducts({ sort: 'newest' })
      .then((data) => {
        const products = data.products || [];

        const container = document.querySelector('.elemento-addons-advance-product-list-wrap');
        const tabList = document.querySelector('.tab-list-filter.tab-advance-product.tab-center');

        if (products.length === 0) {
          if (container) container.innerHTML = '<p style="text-align:center;padding:40px 0;">No products found.</p>';
          if (tabList) tabList.innerHTML = '';
          return;
        }

        const categories = [];
        const categoryIds = new Set();
        products.forEach((product) => {
          if (
            product.category_id &&
            product.category_name &&
            !categoryIds.has(product.category_id) &&
            categories.length < 5
          ) {
            categoryIds.add(product.category_id);
            categories.push({ id: product.category_id, name: product.category_name });
          }
        });

        const renderProducts = (selectedId) => {
          const currentContainer = document.querySelector('.elemento-addons-advance-product-list-wrap');
          if (!currentContainer) return;
          const filtered =
            selectedId === 'all'
              ? products
              : products.filter((product) => String(product.category_id) === selectedId);
          const cards = filtered.map((product, index) => {
            try {
              return productCardHtml(product);
            } catch (e) {
              console.error(`[JustLanded] Error rendering product at index ${index}:`, product, e);
              return '';
            }
          });
          currentContainer.innerHTML = cards.join('');
          if (typeof window !== 'undefined' && window.__srfashionUpdateWishlistIcons) {
            window.__srfashionUpdateWishlistIcons();
          }
        };

        if (tabList) {
          const sharedAttrs =
            'product_max_count="8" product_type="recent" data-sort="[&quot;Image&quot;,&quot;Title&quot;,&quot;Price&quot;,&quot;Button&quot;]" data-pagi=""';
          let tabsHtml = `<li><a class="active" href="#" data-filter="all" data-category-id="all" product_count="${products.length}" ${sharedAttrs}>All</a></li>`;
          categories.forEach((category) => {
            const count = products.filter((p) => p.category_id === category.id).length;
            tabsHtml += `<li><a href="#" data-filter="${slugify(category.name)}" data-category-id="${category.id}" product_count="${count}" ${sharedAttrs}>${escapeHtml(category.name)}</a></li>`;
          });
          tabList.innerHTML = tabsHtml;

          tabList.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', (e) => {
              e.preventDefault();
              const selectedId = link.dataset.categoryId;
              tabList.querySelectorAll('a').forEach((l) => l.classList.remove('active'));
              link.classList.add('active');
              renderProducts(selectedId);
            });
          });
        }

        renderProducts('all');

        if (!window.__homePluginsInited) {
          window.__homePluginsInited = true;
          document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: false }));
        }
      })
      .catch((err) => {
        console.error(err);
        const container = document.querySelector('.elemento-addons-advance-product-list-wrap');
        if (container) container.innerHTML = `<p style="text-align:center;padding:40px 0;color:#c00;">${escapeHtml(err.message)}</p>`;
      });
  }, []);

  return <RawHtmlTag tag="div" attribs={JustLandedSectionAttribs} html={JustLandedSectionHtml} />;
}

export default React.memo(JustLandedSection);
