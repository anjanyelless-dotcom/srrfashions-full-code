(function ($) {
  const elemento_module = {
    init: function () {
      elemento_module.eventhandle();
      elemento_module.hover_sliderBottom();
      elemento_module.smallEvents();
    },
    smallEvents: function () {
      $(document).mouseup(function (e) {
        /// ------------ quick view modal
        let wrapper_ = $(".elemento_quick_view_model");
        let wrapperInside = wrapper_.find(".elemento-quickview-wrapper > div");
        // console.log("wrapper length", wrapper_.length);
        if (wrapper_.length) {
          if (
            !wrapperInside.is(e.target) &&
            !wrapperInside.has(e.target).length
          ) {
            wrapper_
              .find(".elemento-quickview-wrapper")
              .fadeOut("slow", function () {
                wrapper_.fadeOut("slow", function () {
                  $(this).remove();
                });
              });
          }
        }
        // mouse up event
      });
      ///////////////////////////////////////
      // navigation top margin
    },
    _ajaxFunction: function (data_, datatyle_ = false) {
      let ajaxObj = {
        method: "POST",
        url: elemento_url.admin_ajax,
        data: data_,
      };
      if (datatyle_ == "json") {
        ajaxObj["dataType"] = "json";
        ajaxObj["async"] = false;
      }
      return jQuery.ajax(ajaxObj);
    },
    quickviewModel: function (e) {
      e.preventDefault();
      if ($(".elemento_quick_view_model").length)
        $(".elemento_quick_view_model").remove();
      let thisBtn = $(this);
      let productId = thisBtn.attr("data-product");
      // add div over lay in body
      let htmlBody = $("body");
      htmlBody.append('<div class="elemento_quick_view_model"></div>');
      // add div over lay in body
      if (productId) {
        $.ajax({
          method: "POST",
          url: elemento_url.admin_ajax,
          data: {
            action: "elemento_quick_view_product",
            product_id: productId,
          },
          // dataType: "html",
          success: function (data) {
            // console.log("data->", data);
            $(".elemento_quick_view_model").html(data);
            $(".elemento-quickview-wrapper").addClass("active");
            let container_ = $(".elemento_quick_view_model");
            let sliderWrapper = container_.find(
              ".elemento-owl-slider-common-secript"
            );
            let getSlider = sliderWrapper;

            // let dataSetting = sliderWrapper.attr("data-setting");
            // console.log("dataSetting->", dataSetting);

            if (getSlider.length) {
              elemento_module.owlsliderFn(sliderWrapper);
            }
          },
        });
        // console.log("productId->", productId);
      }
    },
    quickviewModelClose: function () {
      let thisBtn = $(this);
      let wrapper_ = $(".elemento_quick_view_model");
      wrapper_.find(".elemento-quickview-wrapper").fadeOut("slow", function () {
        wrapper_.fadeOut("slow", function () {
          $(this).remove();
        });
      });
    },
    choose_cate_grid_layout: function (e) {
      e.preventDefault();
      let thisBtn = $(this);
      let container_ = thisBtn.closest(".elemento-addons-post-grid-layout");
      container_
        .find(".elemento-addons-grid-layout-cate,.elemento-post-link")
        .removeClass("active");
      thisBtn.addClass("active");
      let loader_ = container_.find(".elemento-addons-loader_");
      loader_.addClass("active");
      let settings_div = container_.find("[data-setting]");
      let settings_attr = settings_div.attr("data-setting");
      let stringiFy = JSON.parse(settings_attr);
      // console.log("settings_attr->", stringiFy);
      // return;
      let trigger = "";
      let checkSection =
        container_.find(".elemento-owl-slider").length > 0 ? "slide" : "grid";
      if (thisBtn.hasClass("elemento-addons-grid-layout-cate")) {
        trigger = "choose_category";
        if (checkSection == "slide") {
          stringiFy["setting"] = {
            category: thisBtn.attr("data-category"),
            post_per_page: stringiFy.post_per_page,
          };
        } else {
          stringiFy["setting"]["category"] = thisBtn.attr("data-category");
        }
      } else if (thisBtn.hasClass("elemento-post-link")) {
        if (thisBtn.attr("data-link") == "next") {
          trigger = "next";
        } else if (thisBtn.attr("data-link") == "prev") {
          trigger = "previous";
        } else {
          trigger = "pagination";
          stringiFy["setting"]["page"] = thisBtn.attr("data-link");
        }
      }
      // console.log("stringiFy data_", stringiFy);
      // console.log("trigger", trigger);
      // return;
      if (trigger != "") {
        let data_ = {
          action: "elemento_product_layout_cate",
          settings: stringiFy,
          trigger: trigger,
          section: checkSection,
        };
        // console.log("stringiFy data_", stringiFy);
        // console.log("data_", data_);
        // return;
        let returnData = elemento_module._ajaxFunction(data_, "json");
        // let returnData = elemento_module._ajaxFunction(data_);
        returnData.success(function (response) {
          // console.log("response->", response);
          loader_.removeClass("active");

          if (response.html) {
            if (checkSection == "slide") {
              container_
                .find(".elemento-owl-slider")
                .replaceWith(response.html);
              let getSlider = container_.find(".elemento-owl-slider");
              if (getSlider.length) {
                elemento_module.owlsliderFn(
                  container_.find(".elemento-owl-slider-common-secript")
                );
              }
            } else {
              settings_div.html(response.html);
              settings_div.attr("data-setting", response.setting);
              if (response.pagination) {
                if (container_.find(".elemento-addons-pagination").length) {
                  container_
                    .find(".elemento-addons-pagination")
                    .replaceWith(response.pagination);
                } else {
                  settings_div.after(response.pagination);
                }
              }
            }
          }
        });
      }
    },
    // slider list layout
    choose_cate_slider_layout: function () {
      let thisBtn = $(this);
      // console.log("comes in slider ", thisBtn);
      let container_ = thisBtn.closest(
        ".elemento-addons-product-slider-list-wrapper"
      );
      container_
        .find(".elemento-addons-grid-layout-cate")
        .removeClass("active");
      thisBtn.addClass("active");
      container_.find(".elemento-addons-loader_").addClass("active");
      let settings_div = container_.find("[data-setting]");
      let settings_attr = settings_div.attr("data-setting");
      if (settings_attr) {
        let stringiFy = JSON.parse(settings_attr);
        // console.log("settings_attr->", settings_attr);
        let category_ = thisBtn.attr("data-category");
        if (category_ != "") {
          let data_ = {
            action: "elemento_product_layout_slider_cate",
            settings: stringiFy,
            category: category_,
          };
          let returnData = elemento_module._ajaxFunction(data_);
          returnData.success(function (response) {
            // console.log("response->", response);
            container_.find(".elemento-addons-loader_").removeClass("active");
            let sliderWrapper = container_.find(
              ".elemento-owl-slider-common-secript"
            );
            sliderWrapper.html(response);
            let getSlider = sliderWrapper.find(".elemento-owl-slider");
            if (getSlider.length) {
              elemento_module.owlsliderFn(sliderWrapper);
            }
          });
        }
      }
    },
    choose_cate_Big_image: function () {
      let thisBtn = $(this);
      let container_ = thisBtn.closest(".elemento-addons-post-big-image");
      container_
        .find(".elemento-addons-grid-layout-cate")
        .removeClass("active");
      thisBtn.addClass("active");
      container_.find(".elemento-addons-loader_").addClass("active");
      let settings_div = container_.find("[data-setting]");
      let settings_attr = settings_div.attr("data-setting");
      // console.log("settings_attr->", settings_attr);

      if (settings_attr) {
        let stringiFy = JSON.parse(settings_attr);
        // console.log("settings_attr stringiFy->", stringiFy);
        let category_ = thisBtn.attr("data-category");
        if (category_ != "") {
          let data_ = {
            action: "elemento_product_Big_imageLayout_cate",
            settings: stringiFy,
            category: category_,
          };
          let returnData = elemento_module._ajaxFunction(data_);
          returnData.success(function (response) {
            console.log("response->", response);
            container_.find(".elemento-addons-loader_").removeClass("active");
            let sliderWrapper = container_.find(
              ".elemento-addons-product-slider-layout-container"
            );
            let leftRightContainer = container_.find(
              ".elemento-addons-big-image-bigimage-container"
            );
            if (response.success && response.data) {
              if (sliderWrapper.length) {
                sliderWrapper.html(response.data);
                let getSlider = sliderWrapper.find(
                  ".elemento-owl-slider-common-secript"
                );
                // console.log("getSlider->", getSlider);
                if (getSlider.length) {
                  elemento_module.owlsliderFn(getSlider);
                }
              } else if (leftRightContainer.length) {
                leftRightContainer.html(response.data);
              }
              // end if statement
            }
          });
        }
      }
    },
    elemento_plusMinus_quantity: function () {
      let getBtn = $(this);
      let thiswrapper = getBtn.closest(".quickview-add-to-cart");
      // check plus or minus
      let checkPlusMinus = false;
      if (getBtn.hasClass("plus_")) {
        checkPlusMinus = "plus";
      } else if (getBtn.hasClass("minus_")) {
        checkPlusMinus = "minus";
      }
      //checkquantity
      let findBtnAddtoCart = thiswrapper.find(".add_to_cart_button");
      let getCurrentQuantity = findBtnAddtoCart.attr("data-quantity");

      getCurrentQuantity = parseInt(getCurrentQuantity);
      if (checkPlusMinus && getCurrentQuantity) {
        let putQuantity = false;
        if (checkPlusMinus == "minus" && getCurrentQuantity > 1) {
          putQuantity = getCurrentQuantity - 1;
        } else if (checkPlusMinus == "plus") {
          putQuantity = getCurrentQuantity + 1;
        }
        // put quantity inbtn
        if (putQuantity) {
          findBtnAddtoCart.attr("data-quantity", putQuantity);
          thiswrapper.find(".counter_").text(putQuantity);
        }
      }
    },
    next_previous_clone: function () {
      let thisBtn = $(this);
      let thisWrapper = thisBtn.closest(".elemento-owl-slider-common-secript");
      if (thisBtn.closest(".nav_slider_control_parent_class").length) {
        thisWrapper = thisBtn.closest(".nav_slider_control_parent_class");
      }
      // console.log("yes working", thisWrapper);
      if (thisBtn.hasClass("elemento-addons-owl-next")) {
        thisWrapper.find(".owl-nav").find(".owl-next").click();
        // owl-nav
      } else if (thisBtn.hasClass("elemento-addons-owl-prev")) {
        thisWrapper.find(".owl-nav").find(".owl-prev").click();
      }
    },
    hover_sliderBottom: function () {
      $(document).on(
        {
          mouseenter: function () {
            let element = $(this);
            // element.addClass("hovered");
            let container = element.closest(
              ".elemento-owl-slider-common-secript"
            );
            container.find(".owl-stage-outer").addClass("stage-hovered");
          },
          mouseleave: function () {
            let element_ = $(this);
            let container_ = element_.closest(
              ".elemento-owl-slider-common-secript"
            );
            // element_.removeClass("hovered");
            container_.find(".owl-stage-outer").removeClass("stage-hovered");
          },
        },
        ".elemento-product-layout-3 .elemento-owl-slider-common-secript .elemento-product-outer-wrap, .elemento-product-layout-5 .elemento-owl-slider-common-secript .elemento-product-outer-wrap"
      );
      //simple product script

      $(document).on(
        {
          mouseenter: function () {
            let element = $(this);
            element.addClass("hovered");
            let container = element.closest(".ea-simple-product-slider");
            container.find(".owl-stage-outer").addClass("stage-hovered");
          },
          mouseleave: function () {
            let element_ = $(this);
            let container_ = element_.closest(".ea-simple-product-slider");

            element_.removeClass("hovered");
            container_.find(".owl-stage-outer").removeClass("stage-hovered");
          },
        },
        ".ea-simple-product-slider .elemento-product-outer-wrap"
      );
    },
    eventhandle: function () {

      //BELOW CODE REMOVED Because global quick view added
      // $(document).on(
      //   "click",
      //   ".elemento-addons-quickview",
      //   elemento_module.quickviewModel
      // );
      // $(document).on(
      //   "click",
      //   ".elemento-quickview-close",
      //   elemento_module.quickviewModelClose
      // );
      // elemento addons
      //navigation of the grid layout

      $(document).on(
        "click",
        ".elemento-addons-post-grid-layout .elemento-addons-grid-layout-cate",
        elemento_module.choose_cate_grid_layout
      );
      $(document).on(
        "click",
        ".elemento-addons-post-grid-layout .elemento-post-link:not(.disable)",
        elemento_module.choose_cate_grid_layout
      );

      $(document).on(
        "click",
        ".elemento_quick_view_model .quickview-add-to-cart .minus_,.elemento_quick_view_model .quickview-add-to-cart .plus_",
        elemento_module.elemento_plusMinus_quantity
      );
      //navigation of the slider layout
      $(document).on(
        "click",
        ".elemento-addons-product-slider-list-wrapper .elemento-addons-grid-layout-cate",
        elemento_module.choose_cate_slider_layout
      );
      $(document).on(
        "click",
        ".elemento-addons-post-big-image .elemento-addons-grid-layout-cate",
        elemento_module.choose_cate_Big_image
      );
      // elemento slider clone next previous
      $(document).on(
        "click",
        ".elemento-addons-owl-np-cln",
        elemento_module.next_previous_clone
      );
      // elemento post layout pagination
      $(document).on(
        "click",
        ".elemento-addons-layout-post .elemento-post-link:not(.disable)",
        elemento_module.elemento_post_pagination
      );
    },
    elemento_post_pagination: function (e) {
      e.preventDefault();
      let btn = $(this);
      let checkPage = btn.attr("data-link");
      let main_container = btn.closest(".elemento-addons-layout-post");
      let list_container = main_container.find(
        ".elemento-post-layout-listGrid"
      );
      list_container.append(
        '<div class="loading__" style="position: absolute;background: rebeccapurple;height: 100%;width: 100%;z-index: 100;"><h1>loading</h1></div>'
      );
      let pagination_container = main_container.find(
        ".elemento-addons-pagination"
      );
      let pagination_setting = list_container.attr("data-setting");
      if (checkPage) {
        let stringiFy = JSON.parse(pagination_setting);
        let data_ = {
          action: "elemento_post_addons_layout",
          settings: stringiFy,
          trigger: checkPage,
        };
        // console.log("stringiFy data_", stringiFy);
        // console.log("data_", data_);
        let returnData = elemento_module._ajaxFunction(data_, "json");
        // let returnData = elemento_module._ajaxFunction(data_);
        returnData.success(function (response) {
          // console.log("response->", response);
          pagination_container.html(response.pagination);
          list_container.html(response.posthtml);
          let jsonString = JSON.stringify(response.settings);
          list_container.attr("data-setting", jsonString);
        });
      }
    },
    owlsliderFn: function (slider_) {
      let slider = slider_;
     let isRTL = $('html').attr('dir')?.toLowerCase() === 'rtl';



      let dataSetting = slider.attr("data-setting");
      // console.log("dataSetting- >", dataSetting);
      if (dataSetting) {
        dataSetting = JSON.parse(dataSetting);
        // console.log("dataSetting parse - >", dataSetting);
        if (dataSetting) {
          let owlCarouselArg = { slideTransition: "linear", navSpeed: 1000 };

          let responsive_ = {};

          if (dataSetting.items_mobile) {
            responsive_ = {
              ...{ 300: dataSetting.items_mobile },
            };
          }
          if (dataSetting.items_tablet) {
            responsive_ = {
              ...{ 600: dataSetting.items_tablet },
            };
          }

          owlCarouselArg["responsive"] = responsive_;
          // number of column
          if ("items" in dataSetting) {
            owlCarouselArg["items"] = dataSetting.items;
          }
          //autoplay
          if ("autoplay" in dataSetting) {
            owlCarouselArg["autoplay"] = true;
            owlCarouselArg["autoplaySpeed"] =
              parseInt(dataSetting.autoPlaySpeed) * 1000;
          }

          //dots and navigation speed
          if ("slider_controll" in dataSetting) {
            // for dots
            owlCarouselArg["dots"] =
              dataSetting.slider_controll == "ar_do" ||
              dataSetting.slider_controll == "dot"
                ? true
                : false;
            // for arrows
            owlCarouselArg["nav"] =
              dataSetting.slider_controll == "ar_do" ||
              dataSetting.slider_controll == "arr"
                ? true
                : false;
          }
          // slider loop
          owlCarouselArg["loop"] =
            "slider_loop" in dataSetting && dataSetting.slider_loop == "1"
              ? true
              : false;
          // slider direction
          owlCarouselArg["rtl"] = isRTL;
          // console.log("owlCarouselArg", owlCarouselArg);
          let OWlCarouselSlider = slider.find(".elemento-owl-slider");

          // console.log("OWlCarouselSlider->", OWlCarouselSlider);

          var intOWL = OWlCarouselSlider.owlCarousel(owlCarouselArg);
          intOWL.trigger("refresh.owl.carousel");
        }
      }
    },
  };
  elemento_module.init();

/*************************/
//Advance Product Custom JS
/**************************/

      $(".tab-advance-product li a:first").addClass("active");  

      $(document).on(

        "click",
        ".tab-advance-product li a",

        function (e) {

         var wrap= $(this).closest('.elementor-widget-container');

          $(".tab-advance-product li a.active").removeClass("active");

          wrap.find(".elemento-loadContainer").css(
            "display",
            "block"
          );

          $(this).addClass("active");

          var data_term_id            = $(this).attr("data-filter");
          var data_product_max_count  = $(this).attr("product_max_count");
          var data_product_type_      = $(this).attr("product_type");
          var data_product_sort_      = JSON.parse($(this).attr("data-sort"));
          var data_product_pagi_      = $(this).attr("data-pagi");

          var slidercls = wrap.find('.elemento-addons-advance-product-list-wrap');
          var ajaxquant = slidercls.data("ajaxquant");

          e.preventDefault();

          $.ajax({
            
            type: "POST",

            url: elemento_url.admin_ajax,

            data: {
              action: "elementoaddons_advance_product_tab",
              data_cat_slug: data_term_id,
              data_max_count: data_product_max_count,
              data_product_type: data_product_type_,
              data_product_sort_type: data_product_sort_,
              data_product_pagi: data_product_pagi_,
              data_product_ajaxquant:ajaxquant,
            },

            dataType: "html",

          }).done(function (response) {

            if (response) {

              wrap.find('.elemento-addons-advance-product-list-wrap').html(
                response
              );

               wrap.find(".elemento-loadContainer").css(
                "display",
                "none"
              );

              wrap.find(".prev-pagi").addClass("ajax-pagi-disabled");

              wrap.find('.elemento-advance-quantity').on( 'click', 'button.plus, button.minus', quantity_plus_minus);

            }

          });

        });


          // advance product pagination Next

          $('.elemento-addons-advance-product-list-wrap').on('click','.next-pagi',function(event){

            var wrap= $(this).closest('.elementor-widget-container');

            wrap.find(".elemento-loadContainer").css(
            "display",
            "block"
            );

            wrap.find(".prev-pagi").removeClass("ajax-pagi-disabled");

            event.preventDefault();

            var data_cat_slug           = $(this).attr("data-cat-slug");
            var data_product_max_count  = $(this).attr("product_max_count");
            var data_max_paged          = $(this).attr("data-max-paged");
            var data_current_paged      = $(this).attr("data-current-paged");
            var data_product_sort_      = JSON.parse($(this).attr("data-sort"));
            var data_product_type_      = $(this).attr("product_type");
            var currentpaged            = parseInt( data_current_paged )+ 1;

            var slidercls = wrap.find('.elemento-addons-advance-product-list-wrap');
            var ajaxquant = slidercls.data("ajaxquant");

            $.ajax({
            
            type: "POST",

            url: elemento_url.admin_ajax,

            data: {
              action: "elementoaddons_advance_product_pagination",
              data_paged: currentpaged,
              data_cat_slug:data_cat_slug,
              data_maxpaged: data_max_paged,
              data_product_type: data_product_type_,
              data_product_sort_type: data_product_sort_,
              data_max_count:data_product_max_count,
              data_product_ajaxquant:ajaxquant,
              },

            dataType: "html",

          }).done(function (response) {

            if (response) {

              wrap.find('.elemento-addons-advance-product-list-wrap').html(
                response
              );

               wrap.find(".elemento-loadContainer").css(
                "display",
                "none"
              );

              if(currentpaged == data_max_paged){

                wrap.find(".next-pagi").addClass(
                "ajax-pagi-disabled"
                );

               }

               wrap.find('.elemento-advance-quantity').on( 'click', 'button.plus, button.minus', quantity_plus_minus);


            }

          });


    });


          // advance product pagination Previous

          $('.elemento-addons-advance-product-list-wrap').on('click','.prev-pagi',function(event){

            var wrap= $(this).closest('.elementor-widget-container');

            wrap.find(".elemento-loadContainer").css(
            "display",
            "block"
            );

            event.preventDefault();

            var data_cat_slug           = $(this).attr("data-cat-slug");
            var data_product_max_count  = $(this).attr("product_max_count");
            var data_max_paged          = $(this).attr("data-max-paged");
            var data_current_paged      = $(this).attr("data-current-paged");
            var data_product_sort_      = JSON.parse($(this).attr("data-sort"));
            var data_product_type_      = $(this).attr("product_type");
            var currentpaged            = parseInt( data_current_paged )- 1;

             wrap.find(".prev-pagi").removeClass(
                "ajax-pagi-disabled"
                );

            $.ajax({
            
            type: "POST",

            url: elemento_url.admin_ajax,

            data: {
              action: "elementoaddons_advance_product_pagination",
              data_paged: currentpaged,
              data_cat_slug:data_cat_slug,
              data_maxpaged: data_max_paged,
              data_product_type: data_product_type_,
              data_product_sort_type: data_product_sort_,
              data_max_count:data_product_max_count,
              },

            dataType: "html",

          }).done(function (response) {

            if (response) {

              wrap.find('.elemento-addons-advance-product-list-wrap').html(
                response
              );

               wrap.find(".elemento-loadContainer").css(
                "display",
                "none"
              );


              if(currentpaged == 1){

                wrap.find(".prev-pagi").addClass(
                "ajax-pagi-disabled"
                );

               }


            }

          });

        });


      /********************************/
      //Advance Product Slide Custom JS
      /********************************/

      $(".slide-product .tab-list-filter li a:first").addClass("active");  

      $(document).on(

        "click",
        ".tab-slide li a",

        function (e) {

         var wrap= $(this).closest('.slide-product');

         $(".tab-slide li a.active").removeClass("active");

          wrap.find(".elemento-loadContainer").css(
            "display",
            "block"
          );

          $(this).addClass("active");

            var slidercls = wrap.find('.elemento-addons-adv-product-slide-option');
            var rtlv = slidercls.data("rtl");
            let isRTLps = $('html').attr('dir')?.toLowerCase() === 'rtl';
            var loopv = slidercls.data("loop");
            var autoplayv = slidercls.data("autoplay");
            var autoplayspeedv = slidercls.data("autoplayspeed");
            var autoheightv = slidercls.data("autoheight");
            var navcontroldotv = slidercls.data("navcontroldot");
            var navcontrolarrowv = slidercls.data("navcontrolarrow");
            
            var colm = slidercls.data("slidecolm");
            var colmshowtablet = slidercls.data("showtablet");
            var colmshowmobile = slidercls.data("showmobile");

            var rows = slidercls.data("row");

            var ajaxquant = slidercls.data("ajaxquant");

            
          var data_term_id            = $(this).attr("data-filter");
          var data_product_max_count  = $(this).attr("product_max_count");
          var data_product_type_      = $(this).attr("product_type");
          var data_product_sort_      = JSON.parse($(this).attr("data-sort"));

          e.preventDefault();

          $.ajax({
            
            type: "POST",

            url: elemento_url.admin_ajax,

            data: {
              action: "elementoaddons_advance_product_slide_tab",
              data_cat_slug: data_term_id,
              data_max_count: data_product_max_count,
              data_product_type: data_product_type_,
              data_product_sort_type: data_product_sort_,
              data_product_ajaxquant:ajaxquant,
            },

            dataType: "html",

          }).done(function (response) {

            if (response){

               wrap.find('.elemento-addons-advance-product-content-wrap').html('<div class="elemento-addons-advance-product-list-wrap owl-carousel"></div>  <div class="elemento-loadContainer"><div class="elemento-loader"></div></div>');

               wrap.find(".elemento-addons-advance-product-list-wrap.owl-carousel").append(response);

               var owl = wrap.find('.elemento-addons-advance-product-list-wrap.owl-carousel');

               owl.owlCarousel({

                owl2row:rows, 

                rtl:isRTLps,

                owl2rowTarget: 'slide',

                items:colm,

                loop:loopv,

                nav:navcontrolarrowv,

                margin:0,

                autoplay:autoplayv,

                autoplaySpeed:2000,

                autoplayTimeout:autoplayspeedv,

                dots:navcontroldotv,

                autoHeight:autoheightv,

                
                navText: ["<i class='th-icon th-icon-arrow-left'></i>",
                       "<i class='th-icon th-icon-arrow-right'></i>"],

                responsive:{
                                       0:{
                                           items:colmshowmobile,
                                           
                                       },
                                       768:{
                                           items:colmshowtablet,
                                       },
                                      1025:{
                                           items:colm,
                                       },
                             }

            });

            wrap.trigger("refresh.owl.carousel");

            wrap.find('.elemento-advance-quantity').on( 'click', 'button.plus, button.minus', quantity_plus_minus);

          }

        });

      });


      /***********************************/
      // add to cart product for slide quantity
      /***********************************/

       $(document).on(

        "click",
        ".slide .add_to_cart_button.ajax_add_to_cart",

        function (e) {
          var mainwrap  = $(this).closest('.slide-product');

          var slidercls = mainwrap.find('.elemento-addons-adv-product-slide-option');

          var ajaxquant = slidercls.data("ajaxquant");

          if(ajaxquant!=='ajax_quantity'){
            
             return;

          }

          var wrap = $(this).closest('.elemento-addons-advance-product.slide');

          var data_prdid  = $(this).data("product_id");

          $.ajax({
            
            type: "POST",

            url: elemento_url.admin_ajax,

            data: {
              action: "elementoaddons_advance_product_slide_product_cart",
              data_product_id: data_prdid,
            },

            dataType: "html",

          }).done(function (response) {

           wrap.find(".elemento-product-add-to-cart-button").html(response);

           wrap.find('.elemento-advance-quantity').on( 'click', 'button.plus, button.minus', quantity_plus_minus);

          });


        });

       /***********************************/
      // add to cart product quantity
      /***********************************/

       $(document).on(

        "click",
        ".add_to_cart_button.ajax_add_to_cart",

        function (e) {

          var mainwrap  = $(this).closest('.elemento-addons-advance-product-content-wrap');

          var slidercls = mainwrap.find('.elemento-addons-advance-product-list-wrap');

          var ajaxquant = slidercls.data("ajaxquant");

          if(ajaxquant!=='ajax_quantity'){
            
             return;

          }

          var wrap = $(this).closest('.elemento-addons-advance-product');

          var data_prdid  = $(this).data("product_id");

          $.ajax({
            
            type: "POST",

            url: elemento_url.admin_ajax,

            data: {
              action: "elementoaddons_advance_product_product_cart",
              data_product_id: data_prdid,
            },

            dataType: "html",

          }).done(function (response) {

           wrap.find(".elemento-product-add-to-cart-button").html(response);

           wrap.find('.elemento-advance-quantity').on( 'click', 'button.plus, button.minus', quantity_plus_minus);

          });


        });


       // plus minus quantity

      jQuery(document).ready(function($){   
          
      $('.elemento-advance-quantity').on( 'click', 'button.plus, button.minus', quantity_plus_minus);
          
      });

    /***********************************/
    // quantity plus minus function
    /**********************************/   
    function quantity_plus_minus(){

       var qty = $( this ).closest( '.elemento-advance-quantity' ).find( '.qty' );

            var val   = parseFloat(qty.val());

            var max   = parseFloat(qty.attr( 'max' ));

            var min   = parseFloat(qty.attr( 'min' ));

            var step  = parseFloat(qty.attr( 'step' ));
 
            // Change the value if plus or minus

            if ( $( this ).is( '.plus' ) ) {

               if ( max && ( max <= val ) ) {

                  qty.val( max );

               } 

            else {

               qty.val( val + step );

                 }
            } 

            else {

               if ( min && ( min >= val ) ) {

                  qty.val( min );

               } 

               else if ( val > 0 ) {

                  qty.val( val - step );

               }

            }

    }


    /*************************/
    // Quantity add or remove
    /*************************/

    $( document ).on( 'click', 'button.plus, button.minus', function() {

       var th = $( this );
                    
       var qty           = th.closest( '.elemento-advance-quantity' ).find( '.qty' ).val();
       var cart_key      = th.closest( '.elemento-advance-quantity' ).find( '.qty' ).data('key');
       var pid           = th.closest( '.elemento-advance-quantity' ).find( '.qty' ).data('pid');

       if( !cart_key || qty === undefined ) return;

       $.ajax({
                    url:elemento_url.wc_ajax_url.toString().replace( '%%endpoint%%', 'advance_update_item_quantity' ),
                    type: 'POST',
                    data: {
                            cart_key: cart_key,
                            new_qty: qty,
                            p_id: pid
                          },
                    success: function(response){ 
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


                     if(qty == 0){

                      th.closest('.elemento-advance-quantity').hide();

                      th.closest('.elemento-product-add-to-cart-button').html('<p class="product woocommerce add_to_cart_inline elemento-product-add-to-cart" style=""><a href="?add-to-cart='+pid+'" data-quantity="1" class="button product_type_simple add_to_cart_button ajax_add_to_cart" data-product_id="'+pid+'" data-product_sku=""  rel="nofollow">Add to cart</a></p>');

                     }


                  }

              });

    });

     /***********************************/
      // add to cart product for Woocommerce Shop Page Layout 6 quantity
      /***********************************/
if ($('.th-shop-mania-shop-page-layout-6').length) {
       $(document).on(

        "click",
        ".th-shop-mania-shop-page-layout-6 .add_to_cart_button.ajax_add_to_cart",

        function (e) {
          

          var wrap = $(this).closest('.th-shop-mania-shop-page-layout-6');

          var data_prdid  = $(this).data("product_id");

          $.ajax({
            
            type: "POST",

            url: elemento_url.admin_ajax,

            data: {
              action: "elementoaddons_advance_product_slide_product_cart",
              data_product_id: data_prdid,
            },

            dataType: "html",

          }).done(function (response) {

           wrap.find(".elemento-product-add-to-cart-button").html(response);

           wrap.find('.elemento-advance-quantity').on( 'click', 'button.plus, button.minus', quantity_plus_minus);

          });


        });
     }

/************************/
// woo coupon code copied
/************************/

$( document ).on( 'click', '.copy-text', function(e) {

var th = $( this );

var $tempElement = $("<input>");

        $("body").append($tempElement);

        $tempElement.val(th.attr('data-couponcode')).select();

        document.execCommand("Copy");

        $tempElement.remove();

        th.text("copied");

});

})(jQuery);