import React from 'react';
import RawHtmlTag from './RawHtmlTag.jsx';

const headerHtml = `
            <a class="skip-link screen-reader-text" href="#content">Skip to content</a>
            <div class="main-header center-menu none cnv-none left-menu linkeffect-2 mhdrseven">
                <div class="container">
                    <div class="desktop-main-header">
                        <div class="main-header-bar thnk-col-3">







                            <div class="main-header-col1">
                                <span class="logo-content">
                                    <div class="thunk-logo">
                                        <a href="#" class="custom-logo-link" rel="home"
                                            aria-current="page"><img fetchpriority="high" width="2000" height="601"
                                                src="wp-content/uploads/sites/383/2026/07/2-5.png" class="custom-logo"
                                                alt="Veloura" decoding="async" /></a>
                                    </div>
                                </span>


                            </div>
                            <div class="main-header-col2">
                                <nav>
                                    <!-- Menu Toggle btn-->
                                    <div class="menu-toggle">
                                        <button type="button" class="menu-btn" aria-label="Menu" id="menu-btn">
                                            <div class="btn">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                    viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                                                    class="lucide lucide-text-align-justify w-5 h-5 text-gray-500 group-hover:text-gray-700"
                                                    aria-hidden="true">
                                                    <path d="M3 5h18"></path>
                                                    <path d="M3 12h18"></path>
                                                    <path d="M3 19h18"></path>
                                                </svg>
                                            </div>
                                        </button>
                                    </div>
                                    <div class="sider main  th-shop-mania-menu-hide left">
                                        <div class="sider-inner">
                                            <ul id="th-shop-mania-menu" role="menu" class="th-shop-mania-menu"
                                                data-menu-style=horizontal>
                                                <li id="menu-item-416"
                                                    class="menu-item menu-item-type-post_type menu-item-object-page menu-item-home current-menu-item page_item page-item-13 current_page_item menu-item-416">
                                                    <a href="#" aria-current="page"><span
                                                            class="th-shop-mania-menu-link">Home</span></a>
                                                </li>
                                                <!-- <li id="menu-item-417"
                                                    class="menu-item menu-item-type-post_type menu-item-object-page menu-item-417">
                                                    <a href="shop/index.html"><span
                                                            class="th-shop-mania-menu-link">Shop</span></a>
                                                </li>
                                                <li id="menu-item-418"
                                                    class="menu-item menu-item-type-taxonomy menu-item-object-product_cat menu-item-418">
                                                    <a href="product-category/dresses/index.html"><span
                                                            class="th-shop-mania-menu-link">Dresses</span></a>
                                                </li>
                                                <li id="menu-item-419"
                                                    class="menu-item menu-item-type-taxonomy menu-item-object-product_cat menu-item-419">
                                                    <a href="product-category/accesories/index.html"><span
                                                            class="th-shop-mania-menu-link">Accesories</span></a>
                                                </li> -->
                                                <li id="menu-item-423"
                                                    class="menu-item menu-item-type-post_type menu-item-object-page menu-item-423">
                                                    <a href="#/about-us"><span
                                                            class="th-shop-mania-menu-link">About Us</span></a>
                                                </li>
                                                <li id="menu-item-422"
                                                    class="menu-item menu-item-type-post_type menu-item-object-page menu-item-422">
                                                    <a href="#contact-us"><span
                                                            class="th-shop-mania-menu-link">Contact Us</span></a>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </nav>
                            </div>
                            <div class="main-header-col3">
                                <div class="menu-toggle">
                                    <button type="button" class="menu-btn" aria-label="Menu" id="menu-btn">
                                        <div class="btn">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                                stroke-linecap="round" stroke-linejoin="round"
                                                class="lucide lucide-text-align-justify w-5 h-5 text-gray-500 group-hover:text-gray-700"
                                                aria-hidden="true">
                                                <path d="M3 5h18"></path>
                                                <path d="M3 12h18"></path>
                                                <path d="M3 19h18"></path>
                                            </svg>
                                        </div>
                                    </button>
                                </div>
                                <div class="thunk-icon-market">
                                    <div class="th-icon-searchview">

                                        <div id='thaps-search-box' class="thaps-search-box icon_style">




                                            <form class="thaps-search-form"
                                                action='https://wpthemes.themehunk.com/veloura/' id='thaps-search-form'
                                                method='get'>
                                                <div class="thaps-from-wrap">


                                                    <input id='thaps-search-autocomplete-1' name='s'
                                                        placeholder='Search for products...'
                                                        class="thaps-search-autocomplete thaps-form-control" value=''
                                                        type='text' title='Search' />



                                                    <div class="thaps-preloader"></div>



                                                    <input type="hidden" name="post_type" value="product" />

                                                    <span class="label label-default" id="selected_option"></span>

                                                </div>

                                            </form>

                                        </div>

                                        <!-- mobile flexible -->

                                    </div>

                                    <a class="whishlist" aria-label="Wishlist" href="#/wishlist">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                            stroke-linecap="round" stroke-linejoin="round"
                                            class="lucide lucide-heart w-6 h-6 stroke-[1.5px]" aria-hidden="true">
                                            <path
                                                d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5">
                                            </path>
                                        </svg>
                                        <span class="thw-wishlist-count"></span>
                                    </a>
                                    <a class="account" href="#my-account" aria-label="account">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                            stroke-linecap="round" stroke-linejoin="round"
                                            class="lucide lucide-user w-6 h-6 stroke-[1.5px]" aria-hidden="true">
                                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                    </a>

                                    <div class="cart-contents">
                                        <div id="1" class="taiowc-wrap  taiowc-slide-right  fxd-right ">



                                            <a class="taiowc-content taiowc_cart_empty" href="#" aria-label="Cart">


                                                <h4>Your Cart</h4>

                                                <div class="taiowc-cart-count">
                                                </div>

                                                <div class="taiowc-cart-item">

                                                    <div class="taiowc-icon">


                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                                                            fill="none" stroke="currentColor" stroke-width="2"
                                                            stroke-linecap="round" stroke-linejoin="round"
                                                            class="lucide lucide-shopping-bag w-6 h-6 stroke-[1.5px]"
                                                            aria-hidden="true">
                                                            <path d="M16 10a4 4 0 0 1-8 0"></path>
                                                            <path d="M3.103 6.034h17.794"></path>
                                                            <path
                                                                d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z">
                                                            </path>
                                                        </svg>


                                                    </div>

                                                    <div class="taiowc-cart-total-wrap">


                                                    </div>

                                                </div>
                                            </a>

                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                    <!-- end main-header-bar -->
                    <!-- responsive mobile main header-->
                    <div class="responsive-main-header respmobile-layout-2">
                        <div class="resp-mobileh-bar">
                            <div class="resp-mobileh-col1">
                                <div class="menu-toggle">
                                    <button type="button" class="menu-btn" aria-label="Menu" id="menu-btn">
                                        <div class="btn">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                                stroke-linecap="round" stroke-linejoin="round"
                                                class="lucide lucide-text-align-justify w-5 h-5 text-gray-500 group-hover:text-gray-700"
                                                aria-hidden="true">
                                                <path d="M3 5h18"></path>
                                                <path d="M3 12h18"></path>
                                                <path d="M3 19h18"></path>
                                            </svg>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <div class="resp-mobileh-col2">
                                <span class="logo-content">
                                    <div class="thunk-logo">
                                        <a href="#" rel="home"><img
                                                src="wp-content/uploads/sites/383/2026/07/2-5.png"
                                                alt="No ALT text found"></a>
                                    </div>

                                </span>
                            </div>

                            <div class="resp-mobileh-col3">
                                <div class="thunk-icon-market">
                                    <div class="cart-contents">
                                        <div id="2" class="taiowc-wrap  taiowc-slide-right  fxd-right ">



                                            <a class="taiowc-content taiowc_cart_empty" href="#" aria-label="Cart">


                                                <h4>Your Cart</h4>

                                                <div class="taiowc-cart-count">
                                                </div>

                                                <div class="taiowc-cart-item">

                                                    <div class="taiowc-icon">


                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                                                            fill="none" stroke="currentColor" stroke-width="2"
                                                            stroke-linecap="round" stroke-linejoin="round"
                                                            class="lucide lucide-shopping-bag w-6 h-6 stroke-[1.5px]"
                                                            aria-hidden="true">
                                                            <path d="M16 10a4 4 0 0 1-8 0"></path>
                                                            <path d="M3.103 6.034h17.794"></path>
                                                            <path
                                                                d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z">
                                                            </path>
                                                        </svg>


                                                    </div>

                                                    <div class="taiowc-cart-total-wrap">


                                                    </div>

                                                </div>
                                            </a>

                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                    </div> <!-- responsive-main-header END -->





                </div>
            </div>

            <div class="below-header left-menu linkeffect-2 mhdrseven ">
                <div class="container">
                    <div class="below-header-bar thnk-col-3">


                    </div>
                </div>
            </div>

            <!-- end below-header -->
        `;
const headerAttribs = {
  "className": "thsm-header zta-transparent-header"
};

export default function Header() {
  return <RawHtmlTag tag="header" attribs={headerAttribs} html={headerHtml} />;
}
