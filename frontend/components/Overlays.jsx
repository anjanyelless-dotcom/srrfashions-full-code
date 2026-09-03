import React from 'react';
import RawHtmlTag from './RawHtmlTag.jsx';

const overlaysHtml = `<!-- #page --><script type="speculationrules">
{"prefetch":[{"source":"document","where":{"and":[{"href_matches":"/veloura/*"},{"not":{"href_matches":["/veloura/wp-*.php","/veloura/wp-admin/*","/veloura/wp-content/uploads/sites/383/*","/veloura/wp-content/*","/veloura/wp-content/plugins/*","/veloura/wp-content/themes/th-shop-mania/*","/veloura/*\\\\?(.+)"]}},{"not":{"selector_matches":"a[rel~=\\"nofollow\\"]"}},{"not":{"selector_matches":".no-prefetch, .no-prefetch a"}}]},"eagerness":"conservative"}]}
</script><style type="text/css">
        .widget-visible iframe {
            display: none !important;
        }
    </style><script>


        function receiveMessage(event) {

            const childData = document.querySelectorAll('.' + event.data.class);


            if (event.data.call !== undefined && event.data.call !== null) {


                childData.forEach(function (childData) {
                    console.log(childData);
                    childData.src = event.data.src;
                    childData.srcset = event.data.src;
                });



            } else {
                return;
            }

        }

        // Add an event listener to listen for messages from the parent
        window.addEventListener("message", receiveMessage);

        // Remove the event listener when the component unloads
        window.addEventListener("unload", function () {
            window.removeEventListener("message", receiveMessage);
        });



    </script><div class="th-shop-mania-mobile-menu-wrapper"></div><div class="mobile-nav-bar sider main  th-shop-mania-menu-hide left respmobile-layout-2">

        <div id='thaps-search-box' class="thaps-search-box  submit-active  default_style">

            <form class="thaps-search-form" action='https://wpthemes.themehunk.com/veloura/' id='thaps-search-form'
                method='get'>

                <div class="thaps-from-wrap">

                    <input id='thaps-search-autocomplete-2' name='s' placeholder='Search for products...'
                        class="thaps-search-autocomplete thaps-form-control" value='' type='text' title='Search' />



                    <div class="thaps-preloader"></div>




                    <button id='thaps-search-button' value="Submit" type='submit'>

                        Search</button> <input type="hidden" name="post_type" value="product" />

                    <span class="label label-default" id="selected_option"></span>

                </div>

            </form>

        </div>

        <!-- Bar style   -->

        <div class="sider-inner">

            <div class="mobile-tab-wrap">
                <div class="mobile-nav-tabs">
                    <ul>
                        <li class="primary active" data-menu="primary">
                            <a href="#mobile-nav-tab-menu">Menu</a>
                        </li>

                        <li class="categories" data-menu="categories">
                            <a href="#mobile-nav-tab-category">All Categories</a>
                        </li>


                    </ul>
                </div>
                <div id="mobile-nav-tab-menu" class="mobile-nav-tab-menu panel">
                    <ul id="th-shop-mania-menu" role="menu" class="th-shop-mania-menu" data-menu-style=horizontal>
                        <li
                            class="menu-item menu-item-type-post_type menu-item-object-page menu-item-home current-menu-item page_item page-item-13 current_page_item menu-item-416">
                            <a href="index.html" aria-current="page"><span
                                    class="th-shop-mania-menu-link">Home</span></a>
                        </li>
                        <li class="menu-item menu-item-type-post_type menu-item-object-page menu-item-417"><a
                                href="shop/index.html"><span class="th-shop-mania-menu-link">Shop</span></a></li>
                        <li class="menu-item menu-item-type-taxonomy menu-item-object-product_cat menu-item-418"><a
                                href="product-category/dresses/index.html"><span
                                    class="th-shop-mania-menu-link">Dresses</span></a></li>
                        <li class="menu-item menu-item-type-taxonomy menu-item-object-product_cat menu-item-419"><a
                                href="product-category/accesories/index.html"><span
                                    class="th-shop-mania-menu-link">Accesories</span></a></li>
                        <li class="menu-item menu-item-type-post_type menu-item-object-page menu-item-423"><a
                                href="#/about-us"><span class="th-shop-mania-menu-link">About Us</span></a>
                        </li>
                        <li class="menu-item menu-item-type-post_type menu-item-object-page menu-item-422"><a
                                href="#contact-us"><span class="th-shop-mania-menu-link">Contact Us</span></a>
                        </li>
                    </ul>
                </div>
                <div id="mobile-nav-tab-category" class="mobile-nav-tab-category panel">
                    <ul class="mob-product-cat-list thunk-product-cat-list mobile" data-menu-style="accordion">
                        <li class="cat-item cat-item-17"><a href="product-category/accesories/index.html">Accesories</a>
                        </li>
                        <li class="cat-item cat-item-18"><a href="product-category/cardigans/index.html">Cardigans</a>
                        </li>
                        <li class="cat-item cat-item-19"><a href="product-category/dresses/index.html">Dresses</a>
                        </li>
                        <li class="cat-item cat-item-33"><a href="product-category/handbags/index.html">Handbags</a>
                        </li>
                        <li class="cat-item cat-item-57"><a href="product-category/save-more/index.html">Save More</a>
                        </li>
                        <li class="cat-item cat-item-20"><a href="product-category/shoes/index.html">Shoes</a>
                        </li>
                        <li class="cat-item cat-item-21"><a href="product-category/sunglasses/index.html">Sunglasses</a>
                        </li>
                        <li class="cat-item cat-item-22"><a
                                href="product-category/sweatshirts/index.html">Sweatshirts</a>
                        </li>
                        <li class="cat-item cat-item-24"><a href="product-category/tops/index.html">Tops</a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div><div id="th-register-success-modal" style="display:none;">
        <div class="th-modal-inner">
            <span id="th-close-register-modal">&times;</span>
            <h2>🎉Successfully Registered!</h2>
            <p>You have successfully created your account.</p>
            <a href="my-account/index.html" class="button">Login Now</a>
        </div>
    </div><div class="thnew-popup">

        <div class="thnew-popup-overlay"></div>

        <div class="thnew-popup-wrapper">

            <button type="button" class="thnew-popup-close" aria-label="Close Popup">

                ×
            </button>

            <div class="thnew-popup-content"></div>

        </div>

    </div><div class="th-recent-products-wrapper">
        <div class="th-recent-products-canvas">
            <div class="thrv-header"><span class="th-close th-icon th-icon-clear"></span>
                <h2>You have not viewed any product yet!</h2>
            </div> <a href="shop/index.html" class="th-back-to-shop">Back To Shop</a>

        </div>
    </div><script>
        const lazyloadRunObserver = () => {
            const lazyloadBackgrounds = document.querySelectorAll(\`.e-con.e-parent:not(.e-lazyloaded)\`);
            const lazyloadBackgroundObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        let lazyloadBackground = entry.target;
                        if (lazyloadBackground) {
                            lazyloadBackground.classList.add('e-lazyloaded');
                        }
                        lazyloadBackgroundObserver.unobserve(entry.target);
                    }
                });
            }, { rootMargin: '200px 0px 200px 0px' });
            lazyloadBackgrounds.forEach((lazyloadBackground) => {
                lazyloadBackgroundObserver.observe(lazyloadBackground);
            });
        };
        const events = [
            'DOMContentLoaded',
            'elementor/lazyload/observe',
        ];
        events.forEach((event) => {
            document.addEventListener(event, lazyloadRunObserver);
        });
    </script><script type='text/javascript'>
        (function () {
            var c = document.body.className;
            c = c.replace(/woocommerce-no-js/, 'woocommerce-js');
            document.body.className = c;
        })();
    </script><script id="th-store-one-pro-frontend-js"
        src="wp-content/plugins/store-one-pro/build/frontend3dc3.js?ver=a4f84a3770cb8d5e3ca6"></script><script id="th-store-one-frontend-js-extra">
        var thStoreOne = { "modules": { "saleNotification": true, "stickyCart": true, "buynowButton": true, "saleCountdown": true, "buyToList": true, "inactiveTab": true, "productBrand": true, "recentView": true, "productVideo": true, "quickSocial": true, "smartOffers": true, "shopableList": true } };
        var thSmartOffer = { "currency_symbol": "₹", "currency": "INR", "price_format": "%1$s%2$s", "decimals": "2", "decimal_sep": ".", "thousand_sep": ",", "select_variation_text": "Choose variation options to view this offer", "select_options_text": "Select Options" };
        var thShopable = { "ajaxurl": "https://wpthemes.themehunk.com/veloura/wp-admin/admin-ajax.php", "nonce": "ff9d1c3d54" };
        //# sourceURL=th-store-one-frontend-js-extra
    </script><script id="th-store-one-frontend-js"
        src="wp-content/plugins/th-store-one/build/frontende471.js?ver=f5dfc9f43eb6875d4e2d"></script><script data-wp-strategy="defer" defer id="thsm-sale-countdownfront-js-js"
        src="wp-content/plugins/th-shop-mania-pro/th-shop-mania-admin/addon/sale-countdown/js/minified/sale-countdownfront.min60c6.js?ver=1.01"></script><script id="swiper-js-js"
        src="wp-content/plugins/th-store-one/assets/js/swiper/swiper-bundle.min8bb0.js?ver=11"></script><script id="sourcebuster-js-js"
        src="wp-content/plugins/woocommerce/assets/js/sourcebuster/sourcebuster.min5ae7.js?ver=11.0.1"></script><script id="wc-order-attribution-js-extra">
        var wc_order_attribution = { "params": { "lifetime": 1.0e-5, "session": 30, "base64": false, "ajaxurl": "https://wpthemes.themehunk.com/veloura/wp-admin/admin-ajax.php", "prefix": "wc_order_attribution_", "allowTracking": true }, "fields": { "source_type": "current.typ", "referrer": "current_add.rf", "utm_campaign": "current.cmp", "utm_source": "current.src", "utm_medium": "current.mdm", "utm_content": "current.cnt", "utm_id": "current.id", "utm_term": "current.trm", "utm_source_platform": "current.plt", "utm_creative_format": "current.fmt", "utm_marketing_tactic": "current.tct", "session_entry": "current_add.ep", "session_start_time": "current_add.fd", "session_pages": "session.pgs", "session_count": "udata.vst", "user_agent": "udata.uag" } };
        //# sourceURL=wc-order-attribution-js-extra
    </script><script id="elementor-frontend-js"
        src="wp-content/plugins/elementor/assets/js/frontend.mineda1.js?ver=4.1.4"></script><script data-wp-strategy="defer" defer id="th-shop-mania-pro-custom-js-js"
        src="wp-content/plugins/th-shop-mania-pro/assets/js/custom254d.js?ver=2.3.1"></script><script data-wp-strategy="defer" defer id="th-shop-mania-pagination-js"
        src="wp-content/plugins/th-shop-mania-pro/th-shop-mania-admin/woo/js/shop-pagination40dd.js?ver=7.0.4"></script><script id="wp-emoji-settings" type="application/json">
{"baseUrl":"https://s.w.org/images/core/emoji/17.0.2/72x72/","ext":".png","svgUrl":"https://s.w.org/images/core/emoji/17.0.2/svg/","svgExt":".svg","source":{"concatemoji":"https://wpthemes.themehunk.com/veloura/wp-includes/js/wp-emoji-release.min.js?ver=7.0.4"}}
</script>`;

export default function Overlays() {
  return <RawHtmlTag tag="div" html={overlaysHtml} />;
}
