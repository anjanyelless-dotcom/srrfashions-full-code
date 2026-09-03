(function ($) {
    'use strict';

    function thWrapThemeActions() {

        $('.woocommerce .products .product').each(function () {

            var $product = $(this);

            // Find both actions anywhere inside the product.
            var $wishlist = $product.find('.thw-add-to-wishlist-button-wrap.th-theme-action').first();
            var $compare  = $product.find('.thunk-compare.th-theme-action').first();

            // Wrapper only when both actions exist.
            if (!$wishlist.length || !$compare.length) {
                return;
            }

            // Both actions must have the same parent.
            if ($wishlist.parent()[0] !== $compare.parent()[0]) {
                return;
            }

            var $parent = $wishlist.parent();

            // Already wrapped.
            if ($parent.hasClass('th-theme-actions-wrapper')) {
                return;
            }

            // If wrapper already exists inside parent.
            if ($parent.children('.th-theme-actions-wrapper').length) {
                return;
            }

            // Wishlist should always be first.
            if ($wishlist.nextAll('.thunk-compare.th-theme-action').length === 0) {
                $wishlist.insertBefore($compare);
            }

            // Wrap both elements.
            $wishlist.add($compare).wrapAll(
                '<div class="th-theme-actions-wrapper"></div>'
            );

        });
    }

    $(document).ready(thWrapThemeActions);

    $(document.body).on(
        'updated_wc_div added_to_cart removed_from_cart wc_fragments_loaded',
        thWrapThemeActions
    );

    $(document).ajaxComplete(function () {
        thWrapThemeActions();
    });

})(jQuery);