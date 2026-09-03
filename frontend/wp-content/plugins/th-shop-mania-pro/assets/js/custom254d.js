/********************************/
// ThShopManiaLibPro Custom Function
/********************************/
(function ($) {
    var ThShopManiaLibPro = {
        init: function (){
            this.bindEvents();
        },
        bindEvents: function (){
            var $this = this;
  
           $this.th_tooltip();
          },
        th_tooltip: function() {
    // fn start
    let initTooltip = $("[th-tooltip]");
    if (initTooltip.length) {
      // keep tool tip in document
      let tooltipHtml = '<div class="tooltip-show-with-title">';
      tooltipHtml += '<span class="th-ttt"></span>';
      tooltipHtml +=
        '<svg class="pointer_" viewBox="0 0 1280 70" preserveAspectRatio="none">';
      tooltipHtml += '<polygon points="1280,70 0,70 640,0 "></polygon>';
      tooltipHtml += "</svg>";
      tooltipHtml += "</div>";
      setTimeout(() => {
        let keepToolTip = $(".tooltip-show-with-title");
        if (keepToolTip.length == 0) {
          $("body").append(tooltipHtml);
        }
      }, 1000);
      $(document).on(
        {
          mouseenter: function () {
            let element = $(this);
            let element_ = element[0].getBoundingClientRect();
            let tooltip_ = $(".tooltip-show-with-title");
            //text and content
            let title_ = element.attr("th-tooltip");
            tooltip_.find(".th-ttt").text(title_);
            // style and dimensions
            // calculate top
            let getScrollTop = $(window).scrollTop();
            let tooltip = tooltip_[0].getBoundingClientRect();
            let TopMargin = element_.top - (tooltip.height + 12);
            TopMargin = getScrollTop + TopMargin;
            // calculate left
            let getTTwidth = tooltip.width / 2;
            let elementWidth = element_.width / 2;
            let leftMargin = element_.left - (getTTwidth - elementWidth);
            tooltip_.addClass("active");
            tooltip_.css({ top: TopMargin, left: leftMargin });
          },
          mouseleave: function () {
            let element_ = $(this);
            let tooltip = $(".tooltip-show-with-title");
            tooltip.removeClass("active");
          },
        },
        "[th-tooltip]"
      );
    }
    // fn end
  },
      
}
    ThShopManiaLibPro.init();
})(jQuery);


//***********************/
//TH Bought Together Js
//***********************/

(function($){

  'use strict';

  var ThwbtScript;

  ThwbtScript = {

    init: function()
    {
      this._bind();
    },

    /**
     * Binds events 
     *
     * @since 1.0.0
     * @access private
     * @method _bind
     */

    _bind: function()
     {

         $( document ).bind('click init' , '.product-checkbox', ThwbtScript._thwbt_init ).trigger('init');
         $( document ).on('click' , '.thwbt-add-button-form .single_add_to_cart_button', ThwbtScript._add_to_cart_item );
         $( document ).on('found_variation' , ThwbtScript._variation_found );
         $( document ).on('reset_data' , ThwbtScript._reset_data );
      
     },

       /*************/
      // Main Init
      /*************/
      _thwbt_init : function( event ) {

              $('.thwbt-product-wrap').each(function() {  

              ThwbtScript._checkvalue_used($(this));

              ThwbtScript._calculate_total_price($(this));

              });

      },

    /************************/
      // checkbox value save it
      /************************/

    _checkvalue_used : function( $wrap ) {

        $wrap.each(function() {

        var $products = $(this).find('.thwbt-products');

        var $btn = $(this).find('.single_add_to_cart_button.thwbt-add-button');

        var is_selection = false;

        $products.find('.thwbt-product-list-add').each(function() {

        var $this = $(this);

        var _checked = $this.find('.product-checkbox').prop('checked');

        var _id = parseInt($this.find('.product-checkbox').attr('data-product-id'));

        var _prd_type = $this.find('.product-checkbox').attr('data-product-type');

        var _data_id = $this.find('.product-checkbox').attr('data-id');

        var _prd_name = $this.find('.product-checkbox').attr('data-name');
        
        var $match_id = $this.closest($wrap).find('.thwbt-content-one');
            

          if (!_checked) {

            if ($match_id.length) {
              $match_id.find('.post-' + _id).
                  addClass('thwbt-inactive');
            }

          } else {

            if ($match_id.length) {
              $match_id.find('.post-' + _id).
                  removeClass('thwbt-inactive');
            }

          }


          if (_checked && ( _data_id == 0 )) {
              
              is_selection = true;

          }

          if (is_selection) {

            $btn.attr('disabled', 'disabled');

          }else{

            $btn.removeAttr("disabled");

          }


      }); 




     });


    },

       /************************/
      // Calculate Total Price
      /************************/

    _calculate_total_price : function( $wrap ) {

         var $products     = $wrap.find('.thwbt-product-list');

         var $product_this = $products.find('.product-checkbox');


         $products.find('.thwbt-product-list-add').each(function() {

            var $this = $(this);
            var _total = 0;
            var _count = 0;
            var _id = [];


            var table_abc = document.getElementsByClassName("product-checkbox");

            for (var i = 0; table_abc[i]; ++i) {

            if (table_abc[i].checked) {

                _total += parseFloat(table_abc[i].value);

                 _id.push(parseInt(table_abc[i].id));

                _count++;

            }
        }

        if(!isNaN(_total)){

        $('.total-price').html(th_shop_mania_pro.currency_symbol + _total);

        }

        $('.total-price-wrapper').attr('data-total',_total);

        $('.total-order span').html(_count);

        $(".thwbt-ids").attr("value",_id);

        });

       },
        
       /************************/
       // Add to cart Item
       /************************/

       _add_to_cart_item : function( event ) {
          
          event.preventDefault();

          var $btn = $(this);

          var $form = $btn.closest('.thwbt-add-button-form');
          var $wrap = $btn.closest('.thwbt-product-wrap');

         // variable product

         var data = {};
         var attrs = {};

         $btn.addClass('loading');

         $wrap.find('.thwbt-product-list-add select[name^=attribute]').each(function() {
              var attribute = $(this).attr('name');
              var attribute_value = $(this).val();
              attrs[attribute] = attribute_value;
               
         });

         data.action = 'thwbt_add_all_to_cart';

         data.quantity = $form.find('input[name="quantity"]').val();

         data.product_id = $form.find('input[name="product_id"]').val();

         data.thwbt_ids = $form.find('input[name="thwbt_ids"]').val();

         data.variation_id = $form.find('input[name="variation_id"]').val();

         data.variation = attrs;

         data.thwbt_nonce = th_shop_mania_pro.nonce;

         $.post(th_shop_mania_pro.ajax_url, data, function(response) {
          
          
          if (!response) {
            return;
          }

          if (response.error && response.product_url) {
            window.location = response.product_url;
            return;
          }

          if ((typeof wc_add_to_cart_params !== 'undefined') &&
              (wc_add_to_cart_params.cart_redirect_after_add === 'yes')) {
            window.location = wc_add_to_cart_params.cart_url;
            return;
          }

          $btn.removeClass('loading');

          $(document.body).
              trigger('added_to_cart',
                  [response.fragments, response.cart_hash, $btn]);
        });
             
       },

       /************************/
      // add variation product
      /************************/

      _variation_found : function( event, variation ) {

          var $wrap = $(event['target']).closest('.thwbt-product-wrap');
          var $products = $(event['target']).closest('.thwbt-product-list-add');
          var $product =  $products.find('.product-checkbox');
          var $p_id = $(event['target']).closest('.variations_form').attr('data-product_id');
          var $vartn_id = variation.variation_id;
          var $vartn_price = parseFloat(variation.display_price);
          var $vartn_price_html = variation.price_html;

          if(variation.variation_id && variation.is_purchasable && variation.is_in_stock){

          $wrap.find('.thwbt-add-button').removeAttr("disabled");
          $wrap.find('input[name^="variation_id"]').attr('value', $vartn_id);
          
          $product.attr('data-price', $vartn_price);
          $product.attr('value', $vartn_price);
          $product.attr('data-id', $vartn_id);

          var _sbtotal = parseFloat($('.total-price-wrapper').attr('data-total'));
          
          if(_sbtotal){

            var _total   =  $vartn_price + _sbtotal;

          }else{

            var _total   =  $vartn_price;

          }
          
    
          $products.find('.thwbt-product-price').html($vartn_price_html);

          $wrap.find('.total-price').html(th_shop_mania_pro.currency_symbol + _total);

          var attrs = {};

          $products.find('select[name^="attribute_"]').each(function() {

          var attr_name = $(this).attr('name');

          attrs[attr_name] = $(this).val();


          });

          $product.attr('data-attrs', JSON.stringify(attrs));

          // change image

          $wrap.find('.thwbt-product').each(function() {

           if (variation['image']['url']){

            var $find_img = $wrap.find('.post-' + $p_id);

            var $img = $find_img.find('.image img');

              $img.attr('src', variation['image']['url']);

            }

          });


          }else{

            $wrap.find('.thwbt-add-button').attr('disabled', 'disabled');
            $wrap.find('input[name^="variation_id"]').attr('value', '');
            $product.attr('data-id', '0');
            $('.total-price-wrapper').attr('data-total','');

          }



       },



  };

  /**
   * Initialize ThwbtScript
   */

  $(function(){

    ThwbtScript.init();

  });

})(jQuery);