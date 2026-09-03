(function ($) {
	 // Don't run infinite scroll when shop displays only categories.
    if (
        typeof thlocalizeshoppagi !== 'undefined' &&
        thlocalizeshoppagi.shop_display === 'subcategories'
    ) {
        return;
    }
	var total 			    = parseInt( thlocalizeshoppagi.shop_infinite_total ) || '',
		count               = parseInt( thlocalizeshoppagi.shop_infinite_count ) || '',
		ajax_url            = thlocalizeshoppagi.ajax_url || '',
		shop_infinite_nonce = thlocalizeshoppagi.shop_infinite_nonce || '',
		pagination          = thlocalizeshoppagi.th_shop_mania_pagination || '',
		masonryEnabled      = false,
		loadStatus          = true,
		infinite_event      = thlocalizeshoppagi.shop_infinite_scroll_event || '',
		loader              = jQuery('.opn-shop-pagination-infinite .inifiniteLoader');
	//	Is 'infinite' pagination?
	if( typeof pagination != '' || pagination == 'scroll' ) {

		if(	typeof infinite_event!= '' ){
			switch( infinite_event ){
				case 'click':
					$('.opn-shop-load-more').click(function(event) {
						event.preventDefault();
						//	For Click
						if( count != 'undefined' && count != ''&& total != 'undefined' && total != '' ) {
							if ( count > total )
								return false;
							
							NextloadArticles(count);
							count++;
						}

					});
				
					break;
				
				case 'scroll':
					$('.opn-shop-load-more').hide();

					if( $('#shop-product-wrap').find('li.product:last').length > 0 ) {

						var windowHeight50 = jQuery(window).outerHeight() / 1.25;
						$(window).scroll(function () {
                             
							if( ( $(window).scrollTop() + windowHeight50 ) >= ( $('#shop-product-wrap').find('li.product:last').offset().top ) ) {
								if (count > total) {
									return false;
								} else {

									//	Pause for the moment ( execute if post loaded )
									if( loadStatus == true ) {
										NextloadArticles(count);
										count++;
										loadStatus = false;
									}
								}
							}
						});
					}
					
					break;
			}
		}

		/**
		 * Append Posts via AJAX
		 *
		 * Perform masonry operations.
		 */
		function NextloadArticles(pageNumber){
			$('.opn-shop-load-more').removeClass('.active').hide();
			loader.show();
			var data = {
				action :'th_shop_mania_pagination_infinite',
				page_no	: pageNumber,
				nonce: shop_infinite_nonce,
				query_vars: thlocalizeshoppagi.query_vars,
				opnaira_infinite:'th_shop_mania_pagination_ajax',
			}
          
			$.post( ajax_url, data, function( data ){
     

				var boxes = $(data);

				//	Disable loader
				loader.hide();
				$('.opn-shop-load-more').addClass('active').show();

				//	Append articles
				$('#shop-product-wrap > .products').append( boxes );


				//	Add grid classes
				var msg = thlocalizeshoppagi.shop_no_more_post_message || '';
				
				//	Show no more post message
				if( count > total ) {
					$('.opn-shop-pagination-infinite').html( '<span class="opn-shop-load-more no-more active" style="display: inline-block;">' + msg + "</span>" );
				}

				//	Complete the process 'loadStatus'
				loadStatus = true;
			});
		}
	}

})(jQuery);