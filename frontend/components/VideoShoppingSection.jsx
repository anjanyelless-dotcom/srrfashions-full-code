import React, { useEffect, useState } from 'react';
import RawHtmlTag from './RawHtmlTag.jsx';
import { getProducts } from '../services/productApi.js';
import { getProductImageUrl } from '../utils/image.js';
import { formatMoney } from '../services/price.js';

const MAX_SLIDES = 5;

function initVideoSwipers() {
    if (window.__thShopableSliderInited) return;
    if (typeof window.Swiper === 'undefined') {
        setTimeout(initVideoSwipers, 100);
        return;
    }

    const slider = document.querySelector('.th-shopable-slider');
    if (!slider) return;

    const slides = Number(slider.dataset.slides) || 5;
    const gap = Number(slider.dataset.gap) || 15;
    const hasNav = slider.dataset.nav === 'true';
    const shouldAutoplay = slider.dataset.autoplay === 'true';

    new window.Swiper(slider, {
        slidesPerView: slides,
        spaceBetween: gap,
        loop: true,
        speed: 800,
        cssMode: false,
        observer: true,
        observeParents: true,
        observeSlideChildren: true,
        watchOverflow: true,
        updateOnWindowResize: true,
        autoplay: shouldAutoplay
            ? { delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true }
            : false,
        navigation: hasNav
            ? {
                nextEl: slider.querySelector('.swiper-button-next'),
                prevEl: slider.querySelector('.swiper-button-prev'),
            }
            : false,
        breakpoints: {
            0: { slidesPerView: 1.2 },
            640: { slidesPerView: Math.min(slides, 2) },
            1024: { slidesPerView: slides },
        },
        on: {
            init(e) {
                requestAnimationFrame(() => e.update());
            },
        },
    });

    window.__thShopableSliderInited = true;
}

function escapeHtml(text) {
    return String(text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function isValidVideoUrl(url) {
    return typeof url === 'string' && /^https:\/\/.+\..+/.test(url.trim());
}

function productSlug(product) {
    if (product.slug) return product.slug;
    return `product-${product.id}`;
}

function slideHtml(product) {
    const link = `/product/${encodeURIComponent(productSlug(product))}`;
    const image = getProductImageUrl(product?.images?.[0]?.image_url);
    const sku = product?.variants?.[0]?.sku || '';
    const desc = (product.description || '').replace(/\s+/g, ' ').slice(0, 140);
    const item = [{
        video: product.video_url.trim(),
        product_id: product.id,
        title: product.name || '',
        price: `<span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">&#8377;</span>${formatMoney(product.selling_price)}</span>`,
        image,
        link,
        cart_url: link,
        sku,
        desc,
    }];

    return `<div class="swiper-slide">
        <div class="th-shopable-card th-shopable-layout-style2 th-product-info-bottom" data-items="${escapeHtml(JSON.stringify(item))}"
            data-show-popup="true" data-muted="true">
            <div class="th-shopable-video-wrap">
                <video class="th-shopable-video" playsinline muted preload="metadata">
                    <source src="${escapeHtml(product.video_url.trim())}" type="video/mp4">
                </video>
                <div class="th-video-mute-toggle is-muted">
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M14 5L9 9H5V15H9L14 19V5Z" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M3 3L21 21" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
                    </svg>
                    <svg class="icon-unmute" viewBox="0 0 24 24" fill="none">
                        <path d="M11 5L6 9H3V15H6L11 19V5Z" stroke="currentColor" stroke-width="2" />
                        <path d="M15 9C16.2 10.2 16.2 13.8 15 15" stroke="currentColor" stroke-width="2" />
                        <path d="M18 7C20.5 9.5 20.5 14.5 18 17" stroke="currentColor" stroke-width="2" />
                    </svg>
                </div>
                <button class="th-shopable-play" type="button">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5.14v13.72c0 .8.87 1.3 1.56.9l10.28-6.86a1.03 1.03 0 0 0 0-1.8L9.56 4.24A1.03 1.03 0 0 0 8 5.14Z" />
                    </svg>
                </button>
            </div>
            <div class="th-shopable-product-bar swiper th-product-swiper"></div>
        </div>
    </div>`;
}

const VideoShoppingSectionAttribs = {
    "className": "elementor-element elementor-element-4b58cde e-flex e-con-boxed e-con e-parent",
    "data-id": "4b58cde",
    "data-element_type": "container",
    "data-e-type": "container"
};

export default function VideoShoppingSection() {
    const [products, setProducts] = useState(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await getProducts();
                if (cancelled) return;
                const list = (data?.products || (Array.isArray(data) ? data : []))
                    .filter((p) => isValidVideoUrl(p.video_url))
                    .slice(0, MAX_SLIDES);
                setProducts(list);
            } catch {
                if (!cancelled) setProducts([]);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (products && products.length > 0) {
            window.__thShopableSliderInited = false;
            initVideoSwipers();
        }
    }, [products]);

    if (!products || products.length === 0) {
        return null;
    }

    const slides = products.map(slideHtml).join('');
    const html = `<div class="e-con-inner">
        <div class="lge-glass elementor-element elementor-element-3ad7908 elementor-widget elementor-widget-heading"
            data-id="3ad7908" data-element_type="widget" data-e-type="widget"
            data-widget_type="heading.default">
            <h2 class="elementor-heading-title elementor-size-default">VIDEO SHOPING</h2>
        </div>
        <div class="swiper th-shopable-slider" data-slides="${Math.min(MAX_SLIDES, products.length)}" data-autoplay="true"
            data-nav="true" data-gap="15">
            <div class="swiper-wrapper"
                style="--s1-bg-color: #ffffff91; --s1-border-style: solid; --s1-border-color: transparent; --s1-border-top: 0px; --s1-border-right: 0px; --s1-border-bottom: 0px; --s1-border-left: 0px; --s1-radius-top: 10px; --s1-radius-right: 10px; --s1-radius-bottom: 10px; --s1-radius-left: 10px; --s1-title-color: #111; --s1-price-color: #111; --s1-cart-bg: #000000; --s1-cart-color: #fff; --s1-play-bg: #00000073; --s1-play-color: #fff; --s1-progress-color: #fff; border: none; --s1-card-border-radius: 10px;">
                ${slides}
            </div>
            <div class="swiper-button-prev"></div>
            <div class="swiper-button-next"></div>
        </div>
        <div id="th-shopable-popup" class="th-shopable-popup">
            <button class="th-popup-close">&times;</button>
        </div>
    </div>`;

    return <RawHtmlTag tag="div" attribs={VideoShoppingSectionAttribs} html={html} />;
}
