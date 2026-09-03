(function ($){

    "use strict";

    var taiowcscriptLib = {
        init: function (){
            this.bindEvents();
        },
        bindEvents: function (){
           var $this = this;
            $this.cartopen();
            $this.cartclose();
            $this.AddCartProduct();
            $this.ShippingCartProduct();
            $this.UpdateCart();
            $this.refreshMyFragments();
            $this.disableOverlayScroll();
            $this.CartRedirectLoader();
            $this.handleBodyScroll();
        },

        handleBodyScroll: function () {
            var $wrap = $('.taiowc-model-wrap');

            if ($wrap.hasClass('model-cart-active')) {
                $('body').addClass('no-scroll');
            } else {
                $('body').removeClass('no-scroll');
            }
        },

        CartRedirectLoader: function () {

    $(document).on('click', '.cart-button .buttons a', function (e) {

        var $btn = $(this);

        // Prevent multiple clicks
        if ($btn.hasClass('taiowc-redirecting')) {
            e.preventDefault();
            return false;
        }

        $btn.addClass('taiowc-redirecting');

        // Disable button
        $btn.css({
            'pointer-events': 'none',
            'opacity': '0.7'
        });

        // Add spinner inside button
        if (!$btn.find('.taiowc-btn-loader').length) {
            $btn.append('<span class="taiowc-btn-loader"></span>');
        }

        // Optional: Full page overlay
        // if (!$('.taiowc-page-loader').length) {
        //     $('body').append('<div class="taiowc-page-loader"></div>');
        // }

    });

},
        cartopen: function () {

            $(document).on('click', 'a.taiowc-content', function (e) {

                var $btn = $(this);

                // 1️⃣ Empty cart → Do not open modal
                if ($btn.hasClass('taiowc_cart_empty') && taiowc_param.cart_effect === 'taiowc-click-cart') {
                    e.preventDefault();
                    return false;
                }

                // 2️⃣ If setting = click-cart → Do not open modal (let link redirect)
                if (typeof taiowc_param !== 'undefined' && taiowc_param.cart_effect === 'taiowc-click-cart') {
                    return;
                }

                // 3️⃣ Normal modal handling
                e.preventDefault();

                var $cartWrap = $('.taiowc-model-wrap, .taiowc-wrap.cart_fixed_2');

                if ($cartWrap.hasClass('model-cart-active')) {
                    $cartWrap.removeClass('model-cart-active');
                    taiowcscriptLib.handleBodyScroll();
                } else {
                    $cartWrap.addClass('model-cart-active');
                    taiowcscriptLib.handleBodyScroll();
                }

            });
        },

        cartclose: function () {
            // Close button inside cart
            $(document).on('click', 'a.taiowc-cart-close,.taiowc-continue-shop', function (e) {
                e.preventDefault();
                $('.taiowc-model-wrap,.taiowc-wrap.cart_fixed_2').removeClass('model-cart-active');
                taiowcscriptLib.handleBodyScroll();
            });

            // Click outside the cart closes it
            $(document).on('click', 'body', function (evt) {
                // If clicked outside the cart and not on content or cart model, close the cart
                if ($(evt.target).closest('a.taiowc-content, .taiowc-cart-model').length)
                    return;
                $('.taiowc-model-wrap,.taiowc-wrap.cart_fixed_2').removeClass('model-cart-active');
                taiowcscriptLib.handleBodyScroll();
            });
        },

        refreshMyFragments:function (){
            $.ajax({
                url:taiowc_param.wc_ajax_url.toString().replace( '%%endpoint%%', 'get_refreshed_fragments' ),
                type: 'POST',
                data: {},
                success: function( response ){
                     if(response.fragments){
                        var fragments = response.fragments,
                            cart_hash =  response.cart_hash;

                        //Set fragments
                        $.each( response.fragments, function( key, value ) {
                            $( key ).replaceWith( value );
                            $( key ).stop( true ).css( 'opacity', '1' ).unblock();
                        });

                        if( typeof wc_cart_fragments_params !== 'undefined' && ( 'sessionStorage' in window && window.sessionStorage !== null ) ){

                            sessionStorage.setItem( wc_cart_fragments_params.fragment_name, JSON.stringify( response.fragments ) );
                            localStorage.setItem( wc_cart_fragments_params.cart_hash_key, response.cart_hash );
                            sessionStorage.setItem( wc_cart_fragments_params.cart_hash_key, response.cart_hash );

                            if ( response.cart_hash ) {
                                sessionStorage.setItem( 'wc_cart_created', ( new Date() ).getTime() );
                            }

                        }

                        $(document.body).trigger('wc_fragments_loaded');

                        $(document.body).on('updated_wc_div updated_cart_totals wc_fragments_loaded', function() {
                            var cartCount = $('.taiowc-cart-count .cart-count-item');
                            var cartContent = $('.taiowc-content');
                            if(cartCount.length > 0) {
                                cartContent.removeClass('taiowc_cart_empty').addClass('taiowc_cart_not_empty');
                            } else {
                                cartContent.removeClass('taiowc_cart_not_empty').addClass('taiowc_cart_empty');
                            }
                        });

                        
                      }
                },
                
            })

        },

        AddCartProduct: function (){

               // remove item from cart

               $(document).on('click','a.taiowc-remove-item',function(e){

                 updateItemQty( $( e.currentTarget ).data('key'), 0 );
               
               });

                // quantity add update cart
                // Quantity change and update cart
                $(document).on('click', '.quantity-decrement, .quantity-increment', function(e) {
                    e.preventDefault();
            
                    // Get the quantity input associated with the clicked button
                    var input = $(this).siblings('input.taiowc-quantity');
                    var currentVal = parseInt(input.val());
                    var newVal;
            
                    // Check if the decrement or increment button was clicked
                    if ($(this).hasClass('quantity-decrement')) {
                        newVal = currentVal > parseInt(input.attr('min')) ? currentVal - 1 : currentVal;
                    } else if ($(this).hasClass('quantity-increment')) {
                        newVal = !input.attr('max') || currentVal < parseInt(input.attr('max')) ? currentVal + 1 : currentVal;

                    }
            
                    // Update the input value and trigger the change event
                    input.val(newVal).trigger('change');
                    
                });
            

                $( document ).on('change','input.taiowc-quantity', function(e){
                    
                    var quantity = $(this).val();

                    updateItemQty( $( e.currentTarget ).data('key'), quantity );

                });

                // related product add cart

                $( document ).on('click','.taiowc-related-product-item .th-button', function(e){
                    
                    e.preventDefault();

                    var quantity = $(this).val();

                    AddItem( $( e.currentTarget ).data('product_id'), quantity );

                });


               // undo item

               $(document).on('click','.taiowc-undo-item',function(e){

                  show_loader();

                    var $undo       = $(e.currentTarget),
                        formData    = {
                            cart_key: $undo.data('key'),
                            security: taiowc_param.update_qty_nonce
                        }

                    $.ajax({
                        url:taiowc_param.wc_ajax_url.toString().replace( '%%endpoint%%', 'taiowc_undo_item' ),
                        type: 'POST',
                        data: formData,
                        success: function(response){
                            hide_loader();
                            show_custom_notice();
                            if(response.fragments){
                                $( document.body ).trigger( 'added_to_cart', [ response.fragments, response.cart_hash] );
                            }
                        }

                    })
                });

               // add item 
              function AddItem( product_id, qty ){
                  
                if( !product_id || qty === undefined ) return;

                show_loader();

                $.ajax({
                    url:taiowc_param.wc_ajax_url.toString().replace( '%%endpoint%%', 'taiowc_add_item_cart' ),
                    type: 'POST',
                    data: {
                            product_id: product_id,
                            new_qty: qty,
                            security: taiowc_param.update_qty_nonce
                          },
                    success: function(response){ 

                    hide_loader();
                    show_custom_notice();

                    if(response.fragments){
                        var fragments = response.fragments,
                            cart_hash =  response.cart_hash;

                        //Set fragments
                        $.each( response.fragments, function( key, value ) {
                            $( key ).replaceWith( value );
                            $( key ).stop( true ).css( 'opacity', '1' ).unblock();
                        });

                        if(wc_cart_fragments_params){
                            var cart_hash_key = wc_cart_fragments_params.ajax_url.toString() + '-wc_cart_hash';
                            //Set cart hash
                            sessionStorage.setItem( wc_cart_fragments_params.fragment_name, JSON.stringify( fragments ) );
                            localStorage.setItem( cart_hash_key, cart_hash );
                            sessionStorage.setItem( cart_hash_key, cart_hash );
                        }

                        $(document.body).trigger('wc_fragments_loaded');
                        //Refresh checkout page
                            if( window.wc_checkout_params && wc_checkout_params.is_checkout === "1" ){
                                if( $( 'form.checkout' ).length === 0 ){
                                    location.reload();
                                    return;
                                }
                                $(document.body).trigger("update_checkout");
                            }

                            //Refresh Cart page
                            if( window.wc_add_to_cart_params && window.wc_add_to_cart_params.is_cart && wc_add_to_cart_params.is_cart === "1" ){
                                $(document.body).trigger("wc_update_cart");
                            }
                      }

                  }

                })

             }

               // update item 
              function updateItemQty( cart_key, qty ){

                if( !cart_key || qty === undefined ) return;

                show_loader();

                $.ajax({
                    url:taiowc_param.wc_ajax_url.toString().replace( '%%endpoint%%', 'taiowc_update_item_quantity' ),
                    type: 'POST',
                    data: {
                            cart_key: cart_key,
                            new_qty: qty,
                            security: taiowc_param.update_qty_nonce
                          },
                    success: function(response){ 
                    hide_loader();
                    show_custom_notice();

                    if(response.fragments){
                        var fragments = response.fragments,
                            cart_hash =  response.cart_hash;

                        //Set fragments
                        $.each( response.fragments, function( key, value ) {
                            $( key ).replaceWith( value );
                            $( key ).stop( true ).css( 'opacity', '1' ).unblock();
                        });

                        if(wc_cart_fragments_params){
                            var cart_hash_key = wc_cart_fragments_params.ajax_url.toString() + '-wc_cart_hash';
                            //Set cart hash
                            sessionStorage.setItem( wc_cart_fragments_params.fragment_name, JSON.stringify( fragments ) );
                            localStorage.setItem( cart_hash_key, cart_hash );
                            sessionStorage.setItem( cart_hash_key, cart_hash );
                        }

                        $(document.body).trigger('wc_fragments_loaded');
                        //Refresh checkout page
                            if( window.wc_checkout_params && wc_checkout_params.is_checkout === "1" ){
                                if( $( 'form.checkout' ).length === 0 ){
                                    location.reload();
                                    return;
                                }
                                $(document.body).trigger("update_checkout");
                            }

                            //Refresh Cart page
                            if( window.wc_add_to_cart_params && window.wc_add_to_cart_params.is_cart && wc_add_to_cart_params.is_cart === "1" ){
                                $(document.body).trigger("wc_update_cart");
                            }
                      }

                  }

                })

             }

           
            // add coupon

            $(document).on('click','.taiowc-coupon-submit',function(e){

                var coupon_code = $('#taiowc-coupon-code').val().trim();

                if(!coupon_code.length){

                    return;
                }

                show_loader();

                $(this).addClass('active');

                var data = {

                    security: taiowc_param.apply_coupon_nonce,
                    coupon_code: coupon_code
                }

                $.ajax({
                    url: taiowc_param.wc_ajax_url.toString().replace( '%%endpoint%%', 'apply_coupon' ),
                    type: 'POST',
                    data: data,
                    success: function(response){

                         hide_loader();  

                        $( document.body ).trigger( 'applied_coupon', [ coupon_code ] );

                        $( document.body ).trigger( 'wc_fragment_refresh' );

                        show_notice('error',response);

                    },
                    complete: function(){
                       
                    }
                });
            });

            // add coupon in list
             $(document).on('click','.taiowc-coupon-apply-btn',function(e){

                var coupon_code      = $(this).val().trim();

                if(!coupon_code.length){

                    return;
                }

                show_loader();

                $(this).addClass('added');

                var data = {

                    security: taiowc_param.apply_coupon_nonce,
                    coupon_code: coupon_code
                }

                $.ajax({
                    url: taiowc_param.wc_ajax_url.toString().replace( '%%endpoint%%', 'apply_coupon' ),
                    type: 'POST',
                    data: data,
                    success: function(response){

                        hide_loader();

                       

                        $( document.body ).trigger( 'applied_coupon', [ coupon_code ] );

                        $( document.body ).trigger( 'wc_fragment_refresh' );

                          show_notice('error',response);

                    },
                    complete: function(){
                       
                    }

                });

            });

             //coupon toggle
             
            $(document).ready(function() {

            $('body').on( 'click', '.taiowc-show-coupon', function(){

                $('.taiowc-coupon-list-content').toggleClass('taiowc-cpnactive').slideToggle( 'slow' );

               } );
            } );
            // remove coupon

            $(document).on('click','.taiowc-coupon-remove-coupon',function(e){

                var coupon = $(this).attr('data-coupon');

                if(!coupon.length){
                    e.preventDefault();
                }

             show_loader();

             $(this).css("pointer-events","none");


                var data = {
                    security: taiowc_param.remove_coupon_nonce,
                    coupon: coupon
                }

            $.ajax({
                url: taiowc_param.wc_ajax_url.toString().replace( '%%endpoint%%', 'remove_coupon' ),
                type: 'POST',
                data: data,
                success: function(response){

                   hide_loader();

                    $( document.body ).trigger( 'removed_coupon', [ coupon ] );

                    $( document.body ).trigger( 'wc_fragment_refresh' );

                    show_notice('error',response);
                    
                },
                complete: function(){
                    
                }
            })

        });

             
               //loader show
               function show_loader(){
                   
                   $('.taiowc-cart-model-body').addClass('loading');

               }
               //hide loader
                function hide_loader(){

                   $('.taiowc-cart-model-body').removeClass('loading');
               }

               //Notice Function

                function show_notice(notice_type,notice){

                $('.taiowc-notice').html(notice).attr('class','taiowc-notice').addClass('taiowc-nt-'+notice_type);
                $('.taiowc-notice-box').fadeIn('fast');

                clearTimeout(fadenotice);

                var fadenotice = setTimeout(function(){

                    $('.taiowc-notice-box').fadeOut('slow');

                 },3000);
             };

             //custom Notic add header
            
                function show_custom_notice(){

                     $( document ).ready(function() {

                     $('.taiowc-notice-container').fadeIn('fast');

                       clearTimeout(fadenotice);

                       var fadenotice = setTimeout(function(){

                       $('.taiowc-notice-container').fadeOut('slow');

                       },3000);
                     });
                 };


          },

        ShippingCartProduct: function (){

            $(document).ready(function() {

            /**
             * Object to handle AJAX calls for cart shipping changes.
             */
            var cart_shipping = {

                 /**
                 * Initialize event handlers and UI state.
                 */
                init: function() {
                    this.toggle_shipping            = this.toggle_shipping.bind( this );
                    this.shipping_method_selected   = this.shipping_method_selected.bind( this );
                    this.shipping_calculator_submit = this.shipping_calculator_submit.bind( this );

                    $( document ).on(
                        'click',
                        '.shipping-calculator-button',
                        this.toggle_shipping
                    );
                    $( document ).on(
                        'change',
                        'select.shipping_method, :input[name^=shipping_method]',
                        this.shipping_method_selected
                    );
                    $( document ).on(
                        'submit',
                        'form.woocommerce-shipping-calculator',
                        this.shipping_calculator_submit
                    );

                    $( '.shipping-calculator-form' ).hide();
                },

                /**
                 * Toggle Shipping Calculator panel
                 */
                toggle_shipping: function() {
                    $( '.shipping-calculator-form' ).slideToggle( 'slow' );
                    $( document.body ).trigger( 'country_to_state_changed' ); // Trigger select2 to load.
                    return false;
                },

                /**
                 * Handles when a shipping method is selected.
                 */
                shipping_method_selected: function() {
                    
                    var shipping_methods = {};

                    $( 'select.shipping_method, :input[name^=shipping_method][type=radio]:checked, :input[name^=shipping_method][type=hidden]' ).each( function() {
                        shipping_methods[ $( this ).data( 'index' ) ] = $( this ).val();
                    } );

                    $('.taiowc-cart-model-body').addClass('loading');

                    var data = {
                        security: taiowc_param.update_shipping_method_nonce,
                        shipping_method: shipping_methods
                    };

                    $.ajax( {
                        type:     'post',
                        url:       taiowc_param.wc_ajax_url.toString().replace( '%%endpoint%%', 'update_shipping_method' ),
                        data:      data,
                        dataType: 'html',
                        success:  function( response ) {
                            $( document.body ).trigger( 'wc_fragment_refresh' );    
                        },
                        complete: function() {
                            $( document.body ).trigger( 'updated_shipping_method' );
                            $('.taiowc-cart-model-body').removeClass('loading');
                          }
                      } );
                   },

                    /**
                     * Handles a shipping calculator form submit.
                     *
                     * @param {Object} evt The JQuery event.
                     */
                    shipping_calculator_submit: function( evt ) {

                        evt.preventDefault();

                        var $form = $( evt.currentTarget );

                        $('.taiowc-cart-model-body').addClass('loading');

                        // Provide the submit button value because wc-form-handler expects it.
                        $( '<input />' ).attr( 'type', 'hidden' )
                                        .attr( 'name', 'calc_shipping' )
                                        .attr( 'value', 'x' )
                                        .appendTo( $form );

                        // Make call to actual form post URL.
                        $.ajax( {
                            type:     $form.attr( 'method' ),
                            url:      $form.attr( 'action' ),
                            data:     $form.serialize(),
                            dataType: 'html',
                            success:  function( response ) {

                                // console(response);
                                $( document.body ).trigger( 'wc_fragment_refresh' );
                                $('.taiowc-cart-model-body').removeClass('loading');
                            }
                        } );
                    }


            }



            if( !(window.wc_checkout_params && wc_checkout_params.is_checkout === "1") && !window.wc_cart_params ){
                
                cart_shipping.init();

            }

            $( document.body ).on( 'updated_shipping_method', function(){
                $( document.body ).trigger( 'wc_fragment_refresh' );
            } );
            
            //Shipping toggle

            $('body').on( 'click', '.taiowc-shipping .pencil , .taiowc-shp-tgle', function(){
                $('.taiowc-shptgl-cont').toggleClass('taiowc-shipactive').slideToggle( 'slow' );
            } );

           } );

        },

disableOverlayScroll: function () {

    var overlaySelector = '.taiowc-model-overlay';

    function shouldBlockScroll(e) {
        return (
            document.querySelector('.taiowc-model-wrap.model-cart-active') &&
            e.target.closest(overlaySelector)
        );
    }

    function blockScroll(e) {
        if (shouldBlockScroll(e)) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }

    // Wheel + trackpad
    window.addEventListener('wheel', blockScroll, {
        passive: false,
        capture: true
    });

    // Firefox
    window.addEventListener('DOMMouseScroll', blockScroll, {
        passive: false,
        capture: true
    });

    // Touch devices
    window.addEventListener('touchmove', blockScroll, {
        passive: false,
        capture: true
    });
},



    UpdateCart: function (){

          $(document.body).on('wc-blocks_added_to_cart', function(event){


            var opensidecart = function(){
                       
                $('a.taiowc-content').closest("div.taiowc-slide-right, div.taiowc-slide-left").toggleClass('model-cart-active');
                $( document.body ).trigger( 'wc_fragment_refresh' );
                // ✅ Open the modal cart
                $('.taiowc-model-wrap,.taiowc-wrap.cart_fixed_2').addClass('model-cart-active');
                taiowcscriptLib.handleBodyScroll();
         
            }
            if(taiowc_param.taiowc_cart_open == 'simple-open'){

                opensidecart();

           }

           if(taiowc_param.taiowc_cart_open == 'fly-image-open'){

             fly_to_cart(event,opensidecart); 

           }

           //Copuon nonce fix
           if( !taiowc_param.apply_coupon_nonce ){
            //Send ajax request to set coupon
            create_coupon_nonce();

           }
     
                //Refresh checkout page
                if( window.wc_checkout_params && wc_checkout_params.is_checkout === "1" ){
                    if( $( 'form.checkout' ).length === 0 ){
                        location.reload();
                        return;
                    }
                    $(document.body).trigger("update_checkout");
                }

                //Refresh Cart page
                if( window.wc_add_to_cart_params && window.wc_add_to_cart_params.is_cart && wc_add_to_cart_params.is_cart === "1" ){
                    $(document.body).trigger("wc_update_cart");
                }
        });
                     
        $(document).on('added_to_cart',function(event,fragments,hash,atc_btn){
            
               //Auto open with ajax

                var opensidecart = function(){
                       
                               $('a.taiowc-content').closest("div.taiowc-slide-right, div.taiowc-slide-left").toggleClass('model-cart-active')
                               $( document.body ).trigger( 'wc_fragment_refresh' );
                               $('.taiowc-model-wrap,.taiowc-wrap.cart_fixed_2').addClass('model-cart-active');
                               taiowcscriptLib.handleBodyScroll();
                        
                }

                if(taiowc_param.taiowc_cart_open == 'simple-open'){

                     opensidecart();

                }

                if(taiowc_param.taiowc_cart_open == 'fly-image-open'){

                  fly_to_cart(atc_btn,opensidecart); 

                }

                //Copuon nonce fix
                if( !taiowc_param.apply_coupon_nonce ){
                        //Send ajax request to set coupon
                        create_coupon_nonce();
                }
                 
                //Refresh checkout page
                if( window.wc_checkout_params && wc_checkout_params.is_checkout === "1" ){
                    if( $( 'form.checkout' ).length === 0 ){
                        location.reload();
                        return;
                    }
                    $(document.body).trigger("update_checkout");
                }

                //Refresh Cart page
                if( window.wc_add_to_cart_params && window.wc_add_to_cart_params.is_cart && wc_add_to_cart_params.is_cart === "1" ){
                    $(document.body).trigger("wc_update_cart");
                }

                

                    function fly_to_cart(atc_btn,callback){ 

                    var cart = $('.cart_fixed_1 .taiowc-cart-item, .cart_fixed_2 .taiowc-cart-item');

                    var imgtodrag = false;

                    if( atc_btn.parents('.taiowc-fly-cart').length ){

                        var $product = atc_btn.closest('.taiowc-fly-cart');

                        if($product.find("img").length){

                        var imgtodrag  = $product.find("img");


                        }else if( $product.find('.woocommerce-product-gallery').length  ){
                                imgtodrag = $product.find('.woocommerce-product-gallery');
                                
                        }else{

                            imgtodrag = $product;
                        }

                    }
               

                    if( !imgtodrag || imgtodrag.length === 0 || cart.length === 0){
                        callback();
                        return;
                    } // Exit if image/cart not found

                   
                    var imgclone = imgtodrag.clone()
                        .offset({
                        top: imgtodrag.offset().top,
                        left: imgtodrag.offset().left
                    })
                     
                        .css({
                                'opacity': '0.8',
                                'position': 'absolute',
                                'height': '150px',
                                'width': '150px',
                                'z-index': '1000'
                           })
                        .appendTo($('body'))
                        .animate({
                        'top': cart.offset().top - 10,
                            'left': cart.offset().left - 10,
                            'width': 75,
                            'height': 75
                    }, 1000, 'easeInOutExpo');
                    
                    setTimeout(function () {
                        cart.effect("shake", {
                            times: 1
                        }, 200, setTimeout(function(){
                            callback();
                        },200));
                    }, 1500);

                    imgclone.animate({
                        'width': 0,
                            'height': 0
                    }, function () {
                        $(this).detach();
                    });

                }

        });


         function create_coupon_nonce(){
            $.ajax({
                url: taiowc_param.ajax_url,
                type: 'POST',
                data: {
                    action: 'taiowc_create_nonces'
                },
                success: function(response){

                    if( response['apply-coupon'] ){
                        taiowc_param.apply_coupon_nonce = response['apply-coupon'];
                    }

                    if( response['remove-coupon'] ){
                        taiowc_param.remove_coupon_nonce = response['remove-coupon'];
                    }

                    if( response['update-shipping-method'] ){
                        taiowc_param.update_shipping_method_nonce = response['update-shipping-method'];
                    }
                }
            })
        }

       
        }
   
}

taiowcscriptLib.init();

})(jQuery);