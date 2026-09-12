import React, { useEffect } from 'react';
import RawHtmlTag from './RawHtmlTag.jsx';

function initVideoSwipers() {
    if (window.__thShopableSliderInited) return;
    if (typeof window.Swiper === 'undefined') {
        // Swiper library not loaded yet; retry shortly
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

const VideoShoppingSectionHtml = `
                <div class="e-con-inner">
                    <div class="lge-glass elementor-element elementor-element-3ad7908 elementor-widget elementor-widget-heading"
                        data-id="3ad7908" data-element_type="widget" data-e-type="widget"
                        data-widget_type="heading.default">
                        <h2 class="elementor-heading-title elementor-size-default">VIDEO SHOPING</h2>
                    </div>
                    <div class="elementor-element elementor-element-311d15f elemento-heading-fill-color elementor-widget elementor-widget-elemento-advance-heading"
                        data-id="311d15f" data-element_type="widget" data-e-type="widget"
                        data-widget_type="elemento-advance-heading.default">
                        <div class="elementor-widget-container">
                            <div class="elemento-heading-wrapper">
                                <h2 class="elemento-addon-heading_ elemento-animation-added"
                                    id="elemento-addon-heading_"><a><span
                                            class="elemento-heading-text elemento-heading-text-1 ">Best Seller On Our
                                        </span><span
                                            class="elemento-heading-text-second elemento-hilighted-text    "><span
                                                class="elemento-heading-text">Stories</span><svg
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
                    <div class="elementor-element elementor-element-1f1b8ae elementor-widget__width-initial elementor-widget elementor-widget-shortcode"
                        data-id="1f1b8ae" data-element_type="widget" data-e-type="widget"
                        data-widget_type="shortcode.default">
                        <div class="elementor-shortcode">
                            <div class="th-shopable-list-wrap" data-delay="" data-autoplay="true"
                                data-allautoplay="true">



                                <div class="swiper th-shopable-slider" data-slides="5" data-autoplay="true"
                                    data-nav="true" data-gap="15">

                                    <div class="swiper-wrapper"
                                        style="--s1-bg-color: #ffffff91; --s1-border-style: solid; --s1-border-color: transparent; --s1-border-top: 0px; --s1-border-right: 0px; --s1-border-bottom: 0px; --s1-border-left: 0px; --s1-radius-top: 10px; --s1-radius-right: 10px; --s1-radius-bottom: 10px; --s1-radius-left: 10px; --s1-title-color: #111; --s1-price-color: #111; --s1-cart-bg: #000000; --s1-cart-color: #fff; --s1-play-bg: #00000073; --s1-play-color: #fff; --s1-progress-color: #fff; border: none; --s1-card-border-radius: 10px;">


                                        <div class="swiper-slide">


                                            <div class="th-shopable-card th-shopable-layout-style2 
                th-product-info-bottom" data-items="[{&quot;video&quot;:&quot;https:\\/\\/wpthemes.themehunk.com\\/veloura\\/wp-content\\/uploads\\/sites\\/383\\/2026\\/07\\/Woman-with-hair-in-bun-wearing-black-sunglasses-and-white-crop-top.mp4&quot;,&quot;product_id&quot;:90,&quot;title&quot;:&quot;Poly Neck Tee&quot;,&quot;price&quot;:&quot;&lt;span class=\\&quot;woocommerce-Price-amount amount\\&quot;&gt;&lt;span class=\\&quot;woocommerce-Price-currencySymbol\\&quot;&gt;&#8377;&lt;\\/span&gt;119.00&lt;\\/span&gt;&quot;,&quot;image&quot;:&quot;https:\\/\\/wpthemes.themehunk.com\\/veloura\\/wp-content\\/uploads\\/sites\\/383\\/2026\\/06\\/4-1-150x150.jpg&quot;,&quot;link&quot;:&quot;https:\\/\\/wpthemes.themehunk.com\\/veloura\\/product\\/poly-neck-tee\\/&quot;,&quot;cart_url&quot;:&quot;https:\\/\\/wpthemes.themehunk.com\\/veloura\\/product\\/poly-neck-tee\\/&quot;,&quot;sku&quot;:&quot;tee34f&quot;,&quot;desc&quot;:&quot;Suspendisse fermentum curae pellentesque parturient quisque diam egestas quis ligula habitasse at. Purus tempus potenti viverra luctus ridiculus ad porta&hellip;&quot;}]"
                                                data-show-popup="true" data-muted="true">

                                                <div class="th-shopable-video-wrap">

                                                    <video class="th-shopable-video" playsinline muted
                                                        preload="metadata">
                                                        <source
                                                            src="https://res.cloudinary.com/xs2v2pnq/video/upload/v1789143957/Create_live_video_showing_address_20260911214802.mp4"
                                                            type="video/mp4">
                                                    </video>
                                                    <div class="th-video-mute-toggle is-muted">
                                                        <!-- Mute -->
                                                        <svg viewBox="0 0 24 24" fill="none">
                                                            <path d="M14 5L9 9H5V15H9L14 19V5Z" stroke="currentColor"
                                                                stroke-width="2" stroke-linecap="round"
                                                                stroke-linejoin="round" />
                                                            <path d="M3 3L21 21" stroke="currentColor"
                                                                stroke-width="2.5" stroke-linecap="round" />
                                                        </svg>

                                                        <!-- Unmute -->
                                                        <svg class="icon-unmute" viewBox="0 0 24 24" fill="none">
                                                            <path d="M11 5L6 9H3V15H6L11 19V5Z" stroke="currentColor"
                                                                stroke-width="2" />
                                                            <path d="M15 9C16.2 10.2 16.2 13.8 15 15"
                                                                stroke="currentColor" stroke-width="2" />
                                                            <path d="M18 7C20.5 9.5 20.5 14.5 18 17"
                                                                stroke="currentColor" stroke-width="2" />
                                                        </svg>
                                                    </div>

                                                    <button class="th-shopable-play" type="button">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                                                            fill="currentColor">
                                                            <path
                                                                d="M8 5.14v13.72c0 .8.87 1.3 1.56.9l10.28-6.86a1.03 1.03 0 0 0 0-1.8L9.56 4.24A1.03 1.03 0 0 0 8 5.14Z" />
                                                        </svg>
                                                    </button>

                                                </div>
                                                <div class="th-shopable-product-bar swiper th-product-swiper">

                                              




                                                </div>



                                            </div>


                                        </div>


                                        <div class="swiper-slide">


                                            <div class="th-shopable-card th-shopable-layout-style2 
                th-product-info-bottom" data-items="[{&quot;video&quot;:&quot;https:\\/\\/wpthemes.themehunk.com\\/veloura\\/wp-content\\/uploads\\/sites\\/383\\/2026\\/07\\/Woman-with-wavy-brown-hair-wearing-teal-ribbed-crop-top-and-distressed-denim-shorts-with-brown-bag.mp4&quot;,&quot;product_id&quot;:91,&quot;title&quot;:&quot;Sunset Tee&quot;,&quot;price&quot;:&quot;&lt;span class=\\&quot;woocommerce-Price-amount amount\\&quot;&gt;&lt;span class=\\&quot;woocommerce-Price-currencySymbol\\&quot;&gt;&#8377;&lt;\\/span&gt;99.00&lt;\\/span&gt;&quot;,&quot;image&quot;:&quot;https:\\/\\/wpthemes.themehunk.com\\/veloura\\/wp-content\\/uploads\\/sites\\/383\\/2026\\/06\\/21-1-150x150.jpg&quot;,&quot;link&quot;:&quot;https:\\/\\/wpthemes.themehunk.com\\/veloura\\/product\\/sunset-tee\\/&quot;,&quot;cart_url&quot;:&quot;\\/veloura\\/?add-to-cart=91&quot;,&quot;sku&quot;:&quot;te23v&quot;,&quot;desc&quot;:&quot;Class lacus neque faucibus proin torquent dui inceptos fames fringilla. Odio non neque libero a felis vulputate sollicitudin curae nibh&hellip;&quot;}]"
                                                data-show-popup="true" data-muted="true">

                                                <div class="th-shopable-video-wrap">

                                                    <video class="th-shopable-video" playsinline muted
                                                        preload="metadata">
                                                        <source
                                                            src="https://res.cloudinary.com/xs2v2pnq/video/upload/v1789205838/Woman_standing_on_woven_mat_20260912145927.mp4"
                                                            type="video/mp4">
                                                    </video>
                                                    <div class="th-video-mute-toggle is-muted">
                                                        <!-- Mute -->
                                                        <svg viewBox="0 0 24 24" fill="none">
                                                            <path d="M14 5L9 9H5V15H9L14 19V5Z" stroke="currentColor"
                                                                stroke-width="2" stroke-linecap="round"
                                                                stroke-linejoin="round" />
                                                            <path d="M3 3L21 21" stroke="currentColor"
                                                                stroke-width="2.5" stroke-linecap="round" />
                                                        </svg>

                                                        <!-- Unmute -->
                                                        <svg class="icon-unmute" viewBox="0 0 24 24" fill="none">
                                                            <path d="M11 5L6 9H3V15H6L11 19V5Z" stroke="currentColor"
                                                                stroke-width="2" />
                                                            <path d="M15 9C16.2 10.2 16.2 13.8 15 15"
                                                                stroke="currentColor" stroke-width="2" />
                                                            <path d="M18 7C20.5 9.5 20.5 14.5 18 17"
                                                                stroke="currentColor" stroke-width="2" />
                                                        </svg>
                                                    </div>

                                                    <button class="th-shopable-play" type="button">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                                                            fill="currentColor">
                                                            <path
                                                                d="M8 5.14v13.72c0 .8.87 1.3 1.56.9l10.28-6.86a1.03 1.03 0 0 0 0-1.8L9.56 4.24A1.03 1.03 0 0 0 8 5.14Z" />
                                                        </svg>
                                                    </button>

                                                </div>
                                                <div class="th-shopable-product-bar swiper th-product-swiper">

                                                 




                                                </div>



                                            </div>


                                        </div>


                                        <div class="swiper-slide">


                                            <div class="th-shopable-card th-shopable-layout-style2 
                th-product-info-bottom" data-items="[{&quot;video&quot;:&quot;https:\\/\\/wpthemes.themehunk.com\\/veloura\\/wp-content\\/uploads\\/sites\\/383\\/2026\\/07\\/Woman-with-long-dark-hair-wearing-beige-ribbed-crop-top-with-buttons.mp4&quot;,&quot;product_id&quot;:130,&quot;title&quot;:&quot;Lounge Top&quot;,&quot;price&quot;:&quot;&lt;span class=\\&quot;woocommerce-Price-amount amount\\&quot; aria-hidden=\\&quot;true\\&quot;&gt;&lt;span class=\\&quot;woocommerce-Price-currencySymbol\\&quot;&gt;&#8377;&lt;\\/span&gt;49.00&lt;\\/span&gt; &lt;span aria-hidden=\\&quot;true\\&quot;&gt;&ndash;&lt;\\/span&gt; &lt;span class=\\&quot;woocommerce-Price-amount amount\\&quot; aria-hidden=\\&quot;true\\&quot;&gt;&lt;span class=\\&quot;woocommerce-Price-currencySymbol\\&quot;&gt;&#8377;&lt;\\/span&gt;99.00&lt;\\/span&gt;&lt;span class=\\&quot;screen-reader-text\\&quot;&gt;Price range: &#8377;49.00 through &#8377;99.00&lt;\\/span&gt;&quot;,&quot;image&quot;:&quot;https:\\/\\/wpthemes.themehunk.com\\/veloura\\/wp-content\\/uploads\\/sites\\/383\\/2026\\/06\\/7-150x150.jpg&quot;,&quot;link&quot;:&quot;https:\\/\\/wpthemes.themehunk.com\\/veloura\\/product\\/lounge-top\\/&quot;,&quot;cart_url&quot;:&quot;https:\\/\\/wpthemes.themehunk.com\\/veloura\\/product\\/lounge-top\\/&quot;,&quot;sku&quot;:&quot;Lounge444&quot;,&quot;desc&quot;:&quot;Est consectetur venenatis risus nisi vestibulum mus sagittis orci. Amet nunc lorem adipiscing vivamus egestas lacus dignissim nullam lacinia tincidunt&hellip;&quot;}]"
                                                data-show-popup="true" data-muted="true">

                                                <div class="th-shopable-video-wrap">

                                                    <video class="th-shopable-video" playsinline muted
                                                        preload="metadata">
                                                        <source
                                                            src="https://res.cloudinary.com/xs2v2pnq/video/upload/v1789205831/Woman_smiling_in_anarkali_suit_20260912150511.mp4"
                                                            type="video/mp4">
                                                    </video>
                                                    <div class="th-video-mute-toggle is-muted">
                                                        <!-- Mute -->
                                                        <svg viewBox="0 0 24 24" fill="none">
                                                            <path d="M14 5L9 9H5V15H9L14 19V5Z" stroke="currentColor"
                                                                stroke-width="2" stroke-linecap="round"
                                                                stroke-linejoin="round" />
                                                            <path d="M3 3L21 21" stroke="currentColor"
                                                                stroke-width="2.5" stroke-linecap="round" />
                                                        </svg>

                                                        <!-- Unmute -->
                                                        <svg class="icon-unmute" viewBox="0 0 24 24" fill="none">
                                                            <path d="M11 5L6 9H3V15H6L11 19V5Z" stroke="currentColor"
                                                                stroke-width="2" />
                                                            <path d="M15 9C16.2 10.2 16.2 13.8 15 15"
                                                                stroke="currentColor" stroke-width="2" />
                                                            <path d="M18 7C20.5 9.5 20.5 14.5 18 17"
                                                                stroke="currentColor" stroke-width="2" />
                                                        </svg>
                                                    </div>

                                                    <button class="th-shopable-play" type="button">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                                                            fill="currentColor">
                                                            <path
                                                                d="M8 5.14v13.72c0 .8.87 1.3 1.56.9l10.28-6.86a1.03 1.03 0 0 0 0-1.8L9.56 4.24A1.03 1.03 0 0 0 8 5.14Z" />
                                                        </svg>
                                                    </button>

                                                </div>
                                                <div class="th-shopable-product-bar swiper th-product-swiper">

                                          




                                                </div>



                                            </div>


                                        </div>


                                        <div class="swiper-slide">


                                            <div class="th-shopable-card th-shopable-layout-style2 
                th-product-info-bottom" data-items="[{&quot;video&quot;:&quot;https:\\/\\/wpthemes.themehunk.com\\/veloura\\/wp-content\\/uploads\\/sites\\/383\\/2026\\/07\\/Woman-with-blonde-curly-hair-wearing-blue-ribbed-crop-top.mp4&quot;,&quot;product_id&quot;:132,&quot;title&quot;:&quot;Full Sleeve Tee&quot;,&quot;price&quot;:&quot;&lt;del aria-hidden=\\&quot;true\\&quot;&gt;&lt;span class=\\&quot;woocommerce-Price-amount amount\\&quot;&gt;&lt;span class=\\&quot;woocommerce-Price-currencySymbol\\&quot;&gt;&#8377;&lt;\\/span&gt;119.00&lt;\\/span&gt;&lt;\\/del&gt; &lt;span class=\\&quot;screen-reader-text\\&quot;&gt;Original price was: &#8377;119.00.&lt;\\/span&gt;&lt;ins aria-hidden=\\&quot;true\\&quot;&gt;&lt;span class=\\&quot;woocommerce-Price-amount amount\\&quot;&gt;&lt;span class=\\&quot;woocommerce-Price-currencySymbol\\&quot;&gt;&#8377;&lt;\\/span&gt;102.00&lt;\\/span&gt;&lt;\\/ins&gt;&lt;span class=\\&quot;screen-reader-text\\&quot;&gt;Current price is: &#8377;102.00.&lt;\\/span&gt;&quot;,&quot;image&quot;:&quot;https:\\/\\/wpthemes.themehunk.com\\/veloura\\/wp-content\\/uploads\\/sites\\/383\\/2026\\/06\\/5-150x150.jpg&quot;,&quot;link&quot;:&quot;https:\\/\\/wpthemes.themehunk.com\\/veloura\\/product\\/full-sleeve-tee\\/&quot;,&quot;cart_url&quot;:&quot;\\/veloura\\/?add-to-cart=132&quot;,&quot;sku&quot;:&quot;tee474&quot;,&quot;desc&quot;:&quot;Vulputate habitant commodo finibus elementum adipiscing risus suscipit turpis facilisis dolor pretium. Erat porta mattis pulvinar bibendum finibus metus taciti&hellip;&quot;}]"
                                                data-show-popup="true" data-muted="true">

                                                <div class="th-shopable-video-wrap">

                                                    <video class="th-shopable-video" playsinline muted
                                                        preload="metadata">
                                                        <source
                                                            src="https://res.cloudinary.com/xs2v2pnq/video/upload/v1789206869/Woman_posing_in_traditional_outfit_20260912152356.mp4"
                                                            type="video/mp4">
                                                    </video>
                                                    <div class="th-video-mute-toggle is-muted">
                                                        <!-- Mute -->
                                                        <svg viewBox="0 0 24 24" fill="none">
                                                            <path d="M14 5L9 9H5V15H9L14 19V5Z" stroke="currentColor"
                                                                stroke-width="2" stroke-linecap="round"
                                                                stroke-linejoin="round" />
                                                            <path d="M3 3L21 21" stroke="currentColor"
                                                                stroke-width="2.5" stroke-linecap="round" />
                                                        </svg>

                                                        <!-- Unmute -->
                                                        <svg class="icon-unmute" viewBox="0 0 24 24" fill="none">
                                                            <path d="M11 5L6 9H3V15H6L11 19V5Z" stroke="currentColor"
                                                                stroke-width="2" />
                                                            <path d="M15 9C16.2 10.2 16.2 13.8 15 15"
                                                                stroke="currentColor" stroke-width="2" />
                                                            <path d="M18 7C20.5 9.5 20.5 14.5 18 17"
                                                                stroke="currentColor" stroke-width="2" />
                                                        </svg>
                                                    </div>

                                                    <button class="th-shopable-play" type="button">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                                                            fill="currentColor">
                                                            <path
                                                                d="M8 5.14v13.72c0 .8.87 1.3 1.56.9l10.28-6.86a1.03 1.03 0 0 0 0-1.8L9.56 4.24A1.03 1.03 0 0 0 8 5.14Z" />
                                                        </svg>
                                                    </button>

                                                </div>
                                                <div class="th-shopable-product-bar swiper th-product-swiper">

                                                </div>



                                            </div>


                                        </div>


                                        <div class="swiper-slide">


                                            <div class="th-shopable-card th-shopable-layout-style2 
                th-product-info-bottom" data-items="[{&quot;video&quot;:&quot;https:\\/\\/wpthemes.themehunk.com\\/veloura\\/wp-content\\/uploads\\/sites\\/383\\/2026\\/07\\/Woman-with-curly-hair-in-ponytail-wearing-gray-ribbed-halter-crop-top-and-black-bottoms.mp4&quot;,&quot;product_id&quot;:94,&quot;title&quot;:&quot;Sculpt High Top&quot;,&quot;price&quot;:&quot;&lt;span class=\\&quot;woocommerce-Price-amount amount\\&quot; aria-hidden=\\&quot;true\\&quot;&gt;&lt;span class=\\&quot;woocommerce-Price-currencySymbol\\&quot;&gt;&#8377;&lt;\\/span&gt;136.00&lt;\\/span&gt; &lt;span aria-hidden=\\&quot;true\\&quot;&gt;&ndash;&lt;\\/span&gt; &lt;span class=\\&quot;woocommerce-Price-amount amount\\&quot; aria-hidden=\\&quot;true\\&quot;&gt;&lt;span class=\\&quot;woocommerce-Price-currencySymbol\\&quot;&gt;&#8377;&lt;\\/span&gt;188.00&lt;\\/span&gt;&lt;span class=\\&quot;screen-reader-text\\&quot;&gt;Price range: &#8377;136.00 through &#8377;188.00&lt;\\/span&gt;&quot;,&quot;image&quot;:&quot;https:\\/\\/wpthemes.themehunk.com\\/veloura\\/wp-content\\/uploads\\/sites\\/383\\/2026\\/06\\/7-1-150x150.jpg&quot;,&quot;link&quot;:&quot;https:\\/\\/wpthemes.themehunk.com\\/veloura\\/product\\/sculpt-high-top\\/&quot;,&quot;cart_url&quot;:&quot;https:\\/\\/wpthemes.themehunk.com\\/veloura\\/product\\/sculpt-high-top\\/&quot;,&quot;sku&quot;:&quot;highnecktop320&quot;,&quot;desc&quot;:&quot;Libero taciti class conubia aliquam efficitur habitant posuere felis proin. Lacinia egestas phasellus at tortor integer ultricies. Inceptos quis ad&hellip;&quot;}]"
                                                data-show-popup="true" data-muted="true">

                                                <div class="th-shopable-video-wrap">

                                                    <video class="th-shopable-video" playsinline muted
                                                        preload="metadata">
                                                        <source
                                                            src="https://res.cloudinary.com/xs2v2pnq/video/upload/v1789204805/Woman_showcasing_maroon_ethnic_suit_20260912143515.mp4"
                                                            type="video/mp4">
                                                    </video>
                                                    <div class="th-video-mute-toggle is-muted">
                                                        <!-- Mute -->
                                                        <svg viewBox="0 0 24 24" fill="none">
                                                            <path d="M14 5L9 9H5V15H9L14 19V5Z" stroke="currentColor"
                                                                stroke-width="2" stroke-linecap="round"
                                                                stroke-linejoin="round" />
                                                            <path d="M3 3L21 21" stroke="currentColor"
                                                                stroke-width="2.5" stroke-linecap="round" />
                                                        </svg>

                                                        <!-- Unmute -->
                                                        <svg class="icon-unmute" viewBox="0 0 24 24" fill="none">
                                                            <path d="M11 5L6 9H3V15H6L11 19V5Z" stroke="currentColor"
                                                                stroke-width="2" />
                                                            <path d="M15 9C16.2 10.2 16.2 13.8 15 15"
                                                                stroke="currentColor" stroke-width="2" />
                                                            <path d="M18 7C20.5 9.5 20.5 14.5 18 17"
                                                                stroke="currentColor" stroke-width="2" />
                                                        </svg>
                                                    </div>

                                                    <button class="th-shopable-play" type="button">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                                                            fill="currentColor">
                                                            <path
                                                                d="M8 5.14v13.72c0 .8.87 1.3 1.56.9l10.28-6.86a1.03 1.03 0 0 0 0-1.8L9.56 4.24A1.03 1.03 0 0 0 8 5.14Z" />
                                                        </svg>
                                                    </button>

                                                </div>
                                                <div class="th-shopable-product-bar swiper th-product-swiper">





                                                </div>



                                            </div>


                                        </div>


                                    </div>
                                    <div class="swiper-button-prev"></div>
                                    <div class="swiper-button-next"></div>

                                </div>


                            </div>

                            <div id="th-shopable-popup" class="th-shopable-popup">
                                <button class="th-popup-close">&times;</button>

                            
                            </div>

                        </div>
                    </div>
                </div>
            `;
const VideoShoppingSectionAttribs = {
    "className": "elementor-element elementor-element-4b58cde e-flex e-con-boxed e-con e-parent",
    "data-id": "4b58cde",
    "data-element_type": "container",
    "data-e-type": "container"
};

export default function VideoShoppingSection() {
    useEffect(() => {
        initVideoSwipers();
    }, []);

    return <RawHtmlTag tag="div" attribs={VideoShoppingSectionAttribs} html={VideoShoppingSectionHtml} />;
}
