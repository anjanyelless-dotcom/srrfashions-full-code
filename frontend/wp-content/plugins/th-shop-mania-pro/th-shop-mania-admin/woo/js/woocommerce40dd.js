/********************************/
// ThShopManiaWooLib Custom Function
/********************************/
(function ($) {
    var ThShopManiaWooLib = {
        init: function (){
            this.bindEvents();
        },
        bindEvents: function (){
            var $this = this;
            $this.OffCanvas();
            $this.flexiSidebar();
            $this.sticky_header();
            $this.sticky_footer();
            $this.singleProduct();
            if (th_shop_mania.th_shop_mania_checkout_page_layout == 'stepped') {
            $this.stepped_checkout_page();
        }
            $this.MobilenavBar();
            $this.stickyMobileBar();
            $this.popup_login();
            $this.recent_viewd_products();
            $this.mobileBarActive();
            $this.wideAddtocart();
            
          },

//            wideAddtocart: function () {

//     if (!$('body').hasClass('thsm-wide-add-button')) {
//         return;
//     }

//     var $form = $('.variations_form');
//     if (!$form.length) {
//         return;
//     }

//     var $btn = $('.single_add_to_cart_button');

//     // Fix initial duplicate text
//     $btn.text('Add to cart');

//     $form.on('found_variation', function (event, variation) {

//         var price = $('<div>').html(variation.price_html).text().trim();

//         $btn.text('Add to cart - ' + price);

//     });

//     $form.on('reset_data', function () {

//         $btn.text('Add to cart');

//     });

// },

            wideAddtocart: function () {
                if (!$('body').hasClass('thsm-wide-add-button')) {
                    return;
                }

                var $form = $('.variations_form');
                if (!$form.length) {
                    return;
                }

                var $btn = $('.single_add_to_cart_button');
                if (!$btn.length) {
                    return;
                }

                // 1. Fetch Localization String
                var localizedAddToCartText = (typeof wc_add_to_cart_params !== 'undefined' && wc_add_to_cart_params.i18n_add_to_cart) 
                    ? wc_add_to_cart_params.i18n_add_to_cart 
                    : 'Add to cart';

                // Helper: Safely extract text while stripping screen-reader hidden text
                function getCleanPriceText(htmlString) {
                    if (!htmlString) return '';
                    
                    var $temp = $('<div>').html(htmlString);
                    
                    // Remove accessibility/hidden elements that double the price string
                    $temp.find('.screen-reader-text, script, style, .woocommerce-price-suffix').remove();
                    
                    // Clean extra spaces & newlines
                    return $temp.text().replace(/\s+/g, ' ').trim();
                }

                // Helper: Fetch default product price/range clean text
                function getDefaultPriceRange() {
                    var $priceElem = $('.summary .price, .product .price').first();
                    if ($priceElem.length) {
                        // Clone element to avoid modifying actual DOM
                        var $clonedPrice = $priceElem.clone();
                        $clonedPrice.find('.screen-reader-text, script, style, .woocommerce-price-suffix').remove();
                        return $clonedPrice.text().replace(/\s+/g, ' ').trim();
                    }
                    return '';
                }

                // Helper: Update Button Text
                function updateButtonText(priceText) {
                    if (priceText) {
                        $btn.text(localizedAddToCartText + ' - ' + priceText);
                    } else {
                        $btn.text(localizedAddToCartText);
                    }
                }

                // 2. Set Initial State
                var initialPrice = getDefaultPriceRange();
                updateButtonText(initialPrice);

                // 3. WooCommerce Event: Variation Found
                $form.off('found_variation.thsm').on('found_variation.thsm', function (event, variation) {
                    if (variation && variation.price_html) {
                        var selectedPrice = getCleanPriceText(variation.price_html);
                        updateButtonText(selectedPrice);
                    }
                });

                // 4. WooCommerce Event: Reset
                $form.off('reset_data.thsm').on('reset_data.thsm', function () {
                    var defaultPrice = getDefaultPriceRange();
                    updateButtonText(defaultPrice);
                });
            },
          stickyMobileBar: function () {
            jQuery(document).ready(function($) {
              // Open Popup
              $('#open-cart-popup').on('click', function() {
                $('#thsm-cart-popup').css('display', 'flex').hide().fadeIn(); // Keep flex display
              });
  
              // Close Popup (Clicking the Close Button)
              $('#close-cart-popup').on('click', function() {
                  $('#thsm-cart-popup').fadeOut();
              });
  
              // Close Popup (Clicking Outside the Popup Content)
              $(document).on('click', function(event) {
                  if ($(event.target).closest('.th-cart-popup-content, #open-cart-popup').length === 0) {
                      $('#thsm-cart-popup').fadeOut();
                  }
              });
          });
          },

           recent_viewd_products: function () {
               jQuery(document).ready(function($) {

                //Reload the page on click back browser button

                // window.onpageshow = function(event) {
                //     if (event.persisted) {
                //         window.location.reload();
                //     }
                // }

                      // Check if the body has the .single-product class
                    var isSingleProductPage = $('body').hasClass('single-product');

                    // Log the status of isSingleProductPage
                    // console.log('isSingleProductPage:', isSingleProductPage);

                    // If the user is on a single product page
                    if (isSingleProductPage) {
                        window.onpageshow = function(event) {
                            // Log the event
                            // console.log('onpageshow event triggered:', event);
                            
                            // Reload the page if the user returns from a cached page
                            if (event.persisted) {
                                // console.log('Page is cached. Reloading...');
                                window.location.reload();
                            }
                        }
                    }

                // Click event listener for opening the canvas
                $('.thsm-rv-btn a').on('click', function(e) {
                    e.preventDefault();
                    $('.th-recent-products-canvas').addClass("active");
                    e.stopPropagation();
                });

                // Function to close the recently viewed products
                function closeRecentlyViewed() {
                    $('.th-recent-products-canvas').removeClass("active");
                }

                // Click event listener for th-close icon
                $('.thrv-header .th-close, .th-product-img .opn-quick-view-text').on('click', function(e) {
                    e.preventDefault();
                    closeRecentlyViewed();
                });

                // Click event listener for body
                $('body').on('click', function(e) {
                    // Check if the click is not inside th-recent-products-canvas or its children
                    if (!$(e.target).closest('.th-recent-products-canvas').length || !$('.th-recent-products-canvas')) {
                        closeRecentlyViewed();
                    }
                });


            });

        },


         popup_login: function () {
            let wrapperpopup = jQuery('.thsm-popup-simple');
            if (wrapperpopup.length) {
               jQuery(".thunk-icon-market .account").on("click", function(event){
                  event.preventDefault();
                  jQuery('.thsm-popup-simple,.thsm-popup-header .col-1,#customer_login .u-column1').addClass("active");
                  jQuery('body').addClass("no-scroll");
                });

               jQuery(".thsm-popup-simple .overlay,.thsm-popup-content .close").on("click", function(event){
                  event.preventDefault();
                  jQuery('.thsm-popup-simple, .u-columns > div,.thsm-popup-header .col-2').removeClass("active");
                  jQuery('body.theme-th-shop-mania').removeClass("no-scroll");
                }); 

                } 

               jQuery(".thsm-popup-header .th-popup-tab").on("click", function(event){
                  let $this = this;
                  jQuery('.thsm-popup-header .th-popup-tab').removeClass("active");
                  let getcolTab = jQuery($this).addClass("active").data("col");
                  jQuery('.u-columns > div').removeClass("active");
                  jQuery('.u-columns > div.'+getcolTab).addClass("active");
            
                }); 

    jQuery(document).ready(function () {
        if(jQuery('.thsm-acc-popup2').length){  
        jQuery(".thsm-acc-popup2 .thunk-icon-market > .account ,.thsm-acc-popup2 .thsm-popup-simple").on({
            mouseenter: function () {
            jQuery('.thsm-popup-simple,.thsm-popup-header .col-1,#customer_login .u-column1').addClass("active");
            },
            // mouseleave: function () {         
            // jQuery('.thsm-popup-simple, .u-columns > div,.thsm-popup-header .col-2').removeClass("active");
            // }
        }); 
    }
    //Close when click outside of it thsm-popup-simple Popup-2 active
    if(jQuery('.thsm-acc-popup2').length){  
        jQuery(document).on("click", function(e){
            if (jQuery(e.target).closest(".thsm-popup-simple").length
                        === 0) {
                jQuery('.thsm-popup-simple, .u-columns > div,.thsm-popup-header .col-2').removeClass("active");
            }
        }); 
    }

    });
    // Standard Layout    
    if(jQuery('.woocommerce-account.thsm-acc-standard').length){  
   jQuery('.woocommerce-account.thsm-acc-standard .desktop-main-header .logo-content').prependTo('.woocommerce-account.thsm-acc-standard .entry-content > .woocommerce');
   jQuery('.thsm-popup-header .col-1,#customer_login .u-column1').addClass("active");
    }    
        },

        OffCanvas: function () {
                   var off_canvas_wrapper = $( '.th-shop-mania-off-canvas-sidebar-wrapper');
                   var opn_shop_offcanvas_filter_close = function(){
                  $('html').css({
                       'overflow': '',
                       'margin-right': '' 
                     });
                  $('html').removeClass( 'th-shop-mania-enabled-overlay' );
                 };
                 var trigger_class = 'off-canvas-button';
                 if( 'undefined' != typeof ThShopMania_Off_Canvas && '' != ThShopMania_Off_Canvas.off_canvas_trigger_class ){
                       trigger_class = ThShopMania_Off_Canvas.off_canvas_trigger_class;
                 }
                 $(document).on( 'click', '.' + trigger_class, function(e){
                        e.preventDefault();
                       var innerWidth = $('html').innerWidth();
                       $('html').css( 'overflow', 'hidden' );
                       var hiddenInnerWidth = $('html').innerWidth();
                       $('html').css( 'margin-right', hiddenInnerWidth - innerWidth );
                       $('html').addClass( 'th-shop-mania-enabled-overlay' );
                 });

                off_canvas_wrapper.on('click', function(e){
                   if ( e.target === this ) {
                     opn_shop_offcanvas_filter_close();
                     }
                });

                off_canvas_wrapper.find('.menu-close').on('click', function(e) {
                 opn_shop_offcanvas_filter_close();
               });

             },
               flexiSidebar: function () {
                var flexi_wrapper = $( '.th-shop-mania-flexi-sidebar-wrapper');
                var opn_shop_flexi_filter_close = function(){
                $('html').css({
                    'overflow': '',
                    'margin-right': '' 
                });
               $('html').removeClass( 'th-shop-mania-flexi-enabled-overlay' );
              };
              var trigger_class = 'th-flexiSidebar-icon';
              if( 'undefined' != typeof OpenShop_Flexi && '' != OpenShop_Flexi.flexi_trigger_class ){
                    trigger_class = OpenShop_Flexi.flexi_trigger_class;
              }
              $(document).on( 'click', '.' + trigger_class, function(e){
                    e.preventDefault();
                    var innerWidth = $('html').innerWidth();
                    $('html').css( 'overflow', 'hidden' );
                    var hiddenInnerWidth = $('html').innerWidth();
                    $('html').css( 'margin-right', hiddenInnerWidth - innerWidth );
                    $('html').addClass( 'th-shop-mania-flexi-enabled-overlay' );
              });

              flexi_wrapper.on('click', function(e){
                if ( e.target === this ) {
                    opn_shop_flexi_filter_close();
                  }
             });

             flexi_wrapper.find('.th-shop-mania-filter-close').on('click', function(e) {
              opn_shop_flexi_filter_close();
            });
          },
             sticky_header: function () {
                    if(th_shop_mania.th_shop_mania_sticky_header_effect=='scrldwmn'){
                    var position = jQuery(window).scrollTop(); 
                    var $headerBar = jQuery('header').height();
                    // should start at 0
                    jQuery(window).scroll(function() {
                        var scroll = jQuery(window).scrollTop();
                        if(scroll > position || scroll < $headerBar) {
                        jQuery(".sticky-header").removeClass("stick");
                        }else{
                        jQuery(".sticky-header").addClass("stick");
                        }
                        position = scroll;
                    });
                  }else{
                      jQuery(document).on("scroll", function(){
                      var $headerBar = jQuery('header').height();
                        if(jQuery(document).scrollTop() > $headerBar){
                            jQuery(".sticky-header").addClass("stick");
                          }else{
                            jQuery(".sticky-header").removeClass("stick");
                        } 
                       });
                  }
        },

        sticky_footer : function () {
            /******************/
              // Sticky footer
            /******************/
            if(jQuery('body').hasClass('alm-stick-ftr')){
            var $footerBar = jQuery("footer.thsm-footer").height();
            jQuery("#content,header+div").css('margin-bottom',$footerBar +'px');
            }

          },
          singleProduct: function () {
            $(window).on('load', function() {

            let galleryType  = th_shop_mania.th_shop_mania_single_product_slider_type;
            if (galleryType != 'grid' ) {
            var verticalTypeSlider = false;
            var thumbClass = $('.single-product .flex-control-thumbs');
             if (galleryType == 'verticallightboxslide' || galleryType == 'lightboxslide') {
                    jQuery(thumbClass).children('li').addClass('woocommerce-product-gallery__trigger');
                }
                if (galleryType == 'verticalslide' || galleryType == 'verticallightboxslide') {
                    verticalTypeSlider = true;
                }
                     jQuery('.flex-control-thumbs').slick({
                   infinite: true,
                      slidesToShow: 4,
                      slidesToScroll: 1,
                      speed: 900,
                      vertical: verticalTypeSlider,
                      verticalSwiping: verticalTypeSlider,
                      infinite: false,
                      arrows: true,
                      prevArrow:'<button type="button" class="slick-prev th-icon th-icon-angle-left"></button>',
                      nextArrow: '<button type="button" class="slick-next th-icon th-icon-angle-right"></button>',
                      responsive: [
                        {
                          breakpoint: 767,
                          settings: {
                             vertical: false,
                             verticalSwiping: false,
                          }
                        },
                        // You can unslick at a given breakpoint now by adding:
                        // settings: "unslick"
                        // instead of a settings object
                            ]
                });



            }

            });
        },

        MobilenavBar:function(){
                 //show ,hide
                        jQuery(window).scroll(function (){
                          if(jQuery(window).width() <= 1290 && jQuery(this).scrollTop() > 9){
                            jQuery('#th-shop-mania-mobile-bar').addClass('active').removeClass('hiding');
                             if(jQuery(window).scrollTop() + jQuery(window).height() == jQuery(document).height()) {
                                  jQuery('#th-shop-mania-mobile-bar').removeClass('active');
                                }
                          }else{
                            jQuery('#th-shop-mania-mobile-bar').removeClass('active').addClass('hiding');
                          }

                        });
                   },
     mobileBarActive: function () {

    const currentURL = window.location.pathname.replace(/\/$/, "");
    const items = document.querySelectorAll("#th-shop-mania-mobile-bar li");

    items.forEach(function (item) {

        const link = item.querySelector("a");
        if (!link) return;

        const rawHref = link.getAttribute("href");

        // ❌ Ignore fake links
        if (!rawHref || rawHref === "#" || rawHref.startsWith("javascript")) {
            return;
        }

        let linkPath = new URL(link.href, window.location.origin)
            .pathname
            .replace(/\/$/, "");

        if (currentURL === linkPath) {
            item.classList.add("active");
        }

    });
},

        stepped_checkout_page : function () {
             (function () {
                        if (!document.body.classList.contains("thsm-checkout-layout-stepped")) return !1;
                        const t = document.querySelectorAll(".thsm-checkout-step");
                        for (let e = 0; e < t.length; e++)
                            t[e].addEventListener("click", function (t) {
                                t.preventDefault(), Thsm_Step(this);
                            });
                        const e = document.querySelectorAll(".next-step-button-wrapper .button");
                        for (let n = 0; n < t.length; n++)
                            void 0 !== e[n] &&
                                e[n].addEventListener("click", function (t) {
                                    t.preventDefault(), Thsm_Step(this), document.getElementById("content").scrollIntoView(false);
                                });
                    })();
                    function Thsm_Step(t) {
                const e = document.querySelectorAll(".thsm-checkout-step"),
                    n = t.dataset.step;
                let o = 2;
                const i = document.querySelector("form.woocommerce-checkout");
                i && i.classList.add(n), (o = "billing" === n ? 0 : "review" === n ? 1 : 2);
                for (let t = 0; t < e.length; t++) e[t].classList.remove("active"), t <= o && e[t].classList.add("active");
                const customerDetail = document.getElementById("customer_details"),
                    bilLing = document.querySelector(".next-step-button-wrapper.billing"),
                    shopTable = document.querySelector(".shop_table"),
                    reView = document.querySelector(".next-step-button-wrapper.review"),
                    payment = document.getElementById("payment"),
                    city = document.getElementById("billing_city_field"),
                    country = document.getElementById("billing_country_field"),
                    adress1 = document.getElementById("billing_address_1_field"),
                    address2 = document.getElementById("billing_address_2_field"),
                    state = document.getElementById("billing_state_field"),
                    postcode = document.getElementById("billing_postcode_field"),
                    aclo2 = document.querySelector(".col-2"),
                    fname = document.getElementById("billing_first_name_field"),
                    lname = document.getElementById("billing_last_name_field"),
                    mobi = document.getElementById("billing_phone_field"),
                    email = document.getElementById("billing_email_field"),
                    company = document.getElementById("billing_company_field");

                "billing" === n && ((city.style.display = "none"), (country.style.display = "none"), (adress1.style.display = "none"), (address2.style.display = "none"), (state.style.display = "none"), (postcode.style.display = "none"), (aclo2.style.display = "none"), (payment.style.display = "none"), (bilLing.style.display = "block"), (mobi.style.display = "block"), (fname.style.display = "block"), (lname.style.display = "block"), (email.style.display = "block"), (company.style.display = "block"), (shopTable.style.display = "none"), (reView.style.display = "none")),
                "review"  === n && ((city.style.display = "block"), (country.style.display = "block"), (adress1.style.display = "block"), (address2.style.display = "block"), (state.style.display = "block"), (postcode.style.display = "block"), (aclo2.style.display = "block"), (bilLing.style.display = "none"), (payment.style.display = "none"), (mobi.style.display = "none"), (fname.style.display = "none"), (lname.style.display = "none"), (email.style.display = "none"), (company.style.display = "none"), (shopTable.style.display = "none"), (reView.style.display = "block")),
                "payment" === n && ((city.style.display = "none"), (country.style.display = "none"), (adress1.style.display = "none"), (address2.style.display = "none"), (state.style.display = "none"), (postcode.style.display = "none"), (aclo2.style.display = "none"), (shopTable.style.display = "table"), (reView.style.display = "none"), (bilLing.style.display = "none"), (payment.style.display = "block"), (mobi.style.display = "none"), (fname.style.display = "none"), (lname.style.display = "none"), (email.style.display = "none"), (company.style.display = "none"));
            }
// jQuery('#billing_city_field').attr('style', 'display: none !important');
            if(!(jQuery('.thsm-checkout-step.step-review.active').length && (!jQuery('.thsm-checkout-step.step-payment.active').length))){   
              const myTimeout = setTimeout(billingInitial, 700);      
            }
            
            function billingInitial() {
  jQuery('#billing_address_1_field,#billing_address_2_field,#billing_city_field,#billing_state_field,#billing_postcode_field').attr('style', 'display: none!important');
}
          },
        
       
      }
    ThShopManiaWooLib.init();
})(jQuery);


// jQuery(function ($) {

//     $('#mobile-buy-now').on('click', function (e) {
//         e.preventDefault();

//         var $form = $('form.cart').first();

//         // VARIABLE PRODUCT → submit form
//         if ($form.hasClass('variations_form')) {

//             // Ensure variation is selected
//             var variationId = $form.find('input[name="variation_id"]').val();
//             if (!variationId || variationId === '0') {
//                 alert('Please select product options');
//                 return;
//             }

//             if (!$form.find('input[name="buy_now"]').length) {
//                 $('<input type="hidden" name="buy_now" value="1">').appendTo($form);
//             }

//             $form.trigger('submit');

//         } 
//     });

// });

jQuery(function ($) {

    $(document).on('click', '.buy-now', function (e) {

        var $btn  = $(this);
        var $form = $('form.variations_form');

        // VARIABLE PRODUCT LOGIC
        if ($form.length) {

            if ($btn.hasClass('disabled')) {
                e.preventDefault();
                return false;
            }

            // loader show
            $btn.addClass('loading');
            $btn.find('.btn-text').hide();
            $btn.find('.btn-loader').show();

            // redirect already set via found_variation
            return;
        }

        // SIMPLE PRODUCT LOGIC
        // show loader immediately, allow default redirect
        $btn.addClass('loading');
        $btn.find('.btn-text').hide();
        $btn.find('.btn-loader').show();

        // browser redirect naturally
    });


    /* Enable Buy Now for variation */
    var $form = $('form.variations_form');
    if ($form.length) {

        $form.on('found_variation', function (e, variation) {

            var productId   = $form.find('input[name="product_id"]').val();
            var variationId = variation.variation_id;

            var checkoutUrl =
                th_shop_mania.checkout_url +
                '?add-to-cart=' + productId +
                '&variation_id=' + variationId;

            $('#mobile-buy-now')
                .removeClass('disabled')
                .attr('href', checkoutUrl);
        });
    }

});





