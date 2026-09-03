(function ($) {
  // typing effect js ----------------++++++++++++++++++
  class TypeWriter {
    constructor(txtElement, words, wait = 3000) {
      this.txtElement = txtElement;
      this.words = words;
      this.txt = "";
      this.wordIndex = 0;
      this.wait = parseInt(wait, 10);
      this.type();
      this.isDeleting = false;
    }

    type() {
      // Current index of word
      const current = this.wordIndex % this.words.length;
      // Get full text of current word
      const fullTxt = this.words[current];

      // Check if deleting
      if (this.isDeleting) {
        // Remove char
        this.txt = fullTxt.substring(0, this.txt.length - 1);
      } else {
        // Add char
        this.txt = fullTxt.substring(0, this.txt.length + 1);
      }

      // Insert txt into element
      this.txtElement.innerHTML = `<span class="elemento-rotating-main-text">${this.txt}</span>`;

      // Initial Type Speed
      let typeSpeed = 300;

      if (this.isDeleting) {
        typeSpeed /= 2;
      }

      // If word is complete
      if (!this.isDeleting && this.txt === fullTxt) {
        // Make pause at end
        typeSpeed = this.wait;
        // Set delete to true
        this.isDeleting = true;
      } else if (this.isDeleting && this.txt === "") {
        this.isDeleting = false;
        // Move to next word
        this.wordIndex++;
        // Pause before start typing
        typeSpeed = 500;
      }

      setTimeout(() => this.type(), typeSpeed);
    }
  }

  // Init On DOM Load
  //   document.addEventListener("DOMContentLoaded", init);

  // Init App
  function typingEffect() {
    // typing effect
   $(".elemento-rotating-text").each(function() {
        // Get the current element
        const txtElement = $(this);

        // Get the words and delay from data attributes
        let words = txtElement.attr("data-words");
        words = JSON.parse(words); // Convert words from JSON string to an array
        const wait = txtElement.attr("data-delay");

        // Initialize TypeWriter for the current element
        new TypeWriter(txtElement[0], words, wait);
    });
    //clip effect------------------------------
    let gettext = $(".elemento-clip-effect-static-txt");
    if (gettext.length) {
      $.each(gettext, function () {
        let clipObj = $(this);
        let clipObjText = clipObj.attr("data-words");
        clipObjText = JSON.parse(clipObjText);
        let getChildren = clipObjText.length;
        let shiftActiveCounter = 0;
        let delay = clipObj.attr("data-delay");
        let spanChildren = clipObj.children();
        spanChildren.css("transition", delay + "s max-width linear");
        delay = 1000 * parseInt(delay);
        setInterval(textIntervalfn, delay);
        function textIntervalfn() {
          let indexText = clipObjText[shiftActiveCounter];
          if (spanChildren.hasClass("active")) {
            spanChildren.removeClass("active");
            shiftActiveCounter++;
          } else {
            spanChildren.text(indexText).addClass("active");
          }
          if (shiftActiveCounter >= getChildren) {
            shiftActiveCounter = 0;
          }
        }
      });
    }
    //clip effect------------------------------
  }
  // typing effect js ----------------++++++++++++++++++
  $(window).on("elementor/frontend/init", function () {
    elementorFrontend.hooks.addAction(
      "frontend/element_ready/elemento-advance-heading.default",
      typingEffect
    );
  });
  // advance tabs----------------**********
  var WidgetAdvancedTabs = function () {
    var defaultTabIndex = $(".elaet-advanced-tabs").attr("data-default-tab");
    $(".tab-links li:nth-child(" + defaultTabIndex + ")").addClass("active");
    $(".tabs-content div:nth-child(" + defaultTabIndex + ")").addClass(
      "active"
    );
    $(".tab-links li a").on("click", function (e) {
      let currentAttribute = $(this).attr("href");
      // Show - Hide Tabs
      $(".tabs-content " + currentAttribute)
        .show()
        .siblings()
        .hide();

      // Change - remove current tab to active
      $(this).parent("li").addClass("active").siblings().removeClass("active");
      e.preventDefault();
    });
  };
  $(window).on("elementor/frontend/init", function () {
    elementorFrontend.hooks.addAction(
      "frontend/element_ready/elaet-advanced-tabs.default",
      WidgetAdvancedTabs
    );
  });
  // advance tabs----------------**********
  // image compare ----------------**********
  $.fn.twentytwenty = function (options) {
    var options = $.extend(
      {
        default_offset_pct: 0.5,
        orientation: "horizontal",
        before_label: "Before",
        after_label: "After",
        no_overlay: false,
        move_slider_on_hover: false,
        move_with_handle_only: true,
        click_to_move: false,
      },
      options
    );

    return this.each(function () {
      var sliderPct = options.default_offset_pct;
      var container = $(this);

      var sliderOrientation = options.orientation;
      var beforeDirection = sliderOrientation === "vertical" ? "down" : "left";
      var afterDirection = sliderOrientation === "vertical" ? "up" : "right";

      container.wrap(
        "<div class='twentytwenty-wrapper twentytwenty-" +
          sliderOrientation +
          "'></div>"
      );
      if (!options.no_overlay) {
        container.append("<div class='twentytwenty-overlay'></div>");
        var overlay = container.find(".twentytwenty-overlay");
        overlay.append(
          "<div class='twentytwenty-before-label' data-content='" +
            options.before_label +
            "'></div>"
        );
        overlay.append(
          "<div class='twentytwenty-after-label' data-content='" +
            options.after_label +
            "'></div>"
        );
      }
      let beforeImg = container.find(".image-one-compare");
      let afterImg = container.find(".image-two-compare");
      // console.log("container->", container);
      // console.log("beforeImg->", beforeImg);
      // console.log("beforeImg->", beforeImg.height());
      // console.log("beforeImg->", beforeImg.width());
      // console.log("afterImg->", afterImg);

      container.append("<div class='twentytwenty-handle'></div>");
      var slider = container.find(".twentytwenty-handle");
      slider.append(
        "<span class='twentytwenty-" + beforeDirection + "-arrow'></span>"
      );
      slider.append(
        "<span class='twentytwenty-" + afterDirection + "-arrow'></span>"
      );
      container.addClass("twentytwenty-container");
      beforeImg.addClass("twentytwenty-before");
      afterImg.addClass("twentytwenty-after");

      var calcOffset = function (dimensionPct) {
        var w = beforeImg.width();
        var h = beforeImg.height();
        // console.log("20 20 h ->", h);
        // beforeImg.css({ position: "absolute" });
        return {
          w: w + "px",
          h: h + "px",
          cw: dimensionPct * w + "px",
          ch: dimensionPct * h + "px",
        };
      };

      var adjustContainer = function (offset) {
        if (sliderOrientation === "vertical") {
          beforeImg.css("clip", "rect(0," + offset.w + "," + offset.ch + ",0)");
          afterImg.css(
            "clip",
            "rect(" + offset.ch + "," + offset.w + "," + offset.h + ",0)"
          );
        } else {
          beforeImg.css("clip", "rect(0," + offset.cw + "," + offset.h + ",0)");
          afterImg.css(
            "clip",
            "rect(0," + offset.w + "," + offset.h + "," + offset.cw + ")"
          );
        }
        container.css("height", offset.h);
      };

      var adjustSlider = function (pct) {
        var offset = calcOffset(pct);
        slider.css(
          sliderOrientation === "vertical" ? "top" : "left",
          sliderOrientation === "vertical" ? offset.ch : offset.cw
        );
        adjustContainer(offset);
      };

      // Return the number specified or the min/max number if it outside the range given.
      var minMaxNumber = function (num, min, max) {
        return Math.max(min, Math.min(max, num));
      };

      // Calculate the slider percentage based on the position.
      var getSliderPercentage = function (positionX, positionY) {
        var sliderPercentage =
          sliderOrientation === "vertical"
            ? (positionY - offsetY) / imgHeight
            : (positionX - offsetX) / imgWidth;

        return minMaxNumber(sliderPercentage, 0, 1);
      };

      $(window).on("resize.twentytwenty", function (e) {
        adjustSlider(sliderPct);
      });

      var offsetX = 0;
      var offsetY = 0;
      var imgWidth = 0;
      var imgHeight = 0;
      var onMoveStart = function (e) {
        if (
          ((e.distX > e.distY && e.distX < -e.distY) ||
            (e.distX < e.distY && e.distX > -e.distY)) &&
          sliderOrientation !== "vertical"
        ) {
          e.preventDefault();
        } else if (
          ((e.distX < e.distY && e.distX < -e.distY) ||
            (e.distX > e.distY && e.distX > -e.distY)) &&
          sliderOrientation === "vertical"
        ) {
          e.preventDefault();
        }
        container.addClass("active");
        offsetX = container.offset().left;
        offsetY = container.offset().top;
        // beforeImg.css({ position: "absolute" });
        imgWidth = beforeImg.width();
        imgHeight = beforeImg.height();
        // console.log("20 20 imgHeight ->", imgHeight);
      };
      var onMove = function (e) {
        if (container.hasClass("active")) {
          sliderPct = getSliderPercentage(e.pageX, e.pageY);
          adjustSlider(sliderPct);
        }
      };
      var onMoveEnd = function () {
        container.removeClass("active");
      };

      var moveTarget = options.move_with_handle_only ? slider : container;
      // console.log("moveTarget->", moveTarget);
      moveTarget.on("movestart", onMoveStart);
      moveTarget.on("move", onMove);
      moveTarget.on("moveend", onMoveEnd);

      if (options.move_slider_on_hover) {
        container.on("mouseenter", onMoveStart);
        container.on("mousemove", onMove);
        container.on("mouseleave", onMoveEnd);
      }

      slider.on("touchmove", function (e) {
        e.preventDefault();
      });

      container.find("img").on("mousedown", function (event) {
        event.preventDefault();
      });

      if (options.click_to_move) {
        container.on("click", function (e) {
          offsetX = container.offset().left;
          offsetY = container.offset().top;
          // beforeImg.css({ position: "absolute" });

          imgWidth = beforeImg.width();
          imgHeight = beforeImg.height();

          // console.log("20 20 imgHeight ->", imgHeight);

          sliderPct = getSliderPercentage(e.pageX, e.pageY);
          adjustSlider(sliderPct);
        });
      }

      $(window).trigger("resize.twentytwenty");
    });
  };
  var WidgetElaetCompareImages = function (block_scope) {
    let image_comparison_elem = block_scope.find(".elaet-compare-images"),
      offset = image_comparison_elem.data("offset"),
      orientation = image_comparison_elem.data("orientation"),
      before_label = image_comparison_elem.data("before-label"),
      after_label = image_comparison_elem.data("after-label"),
      hover_slider = image_comparison_elem.data("hover-slider"),
      handle_slider = image_comparison_elem.data("handle-slider"),
      click_slider = image_comparison_elem.data("click-slider"),
      overlay = image_comparison_elem.data("overlay");

    image_comparison_elem.twentytwenty({
      default_offset_pct: offset,
      orientation: orientation,
      before_label: before_label,
      after_label: after_label,
      move_slider_on_hover: hover_slider,
      move_with_handle_only: handle_slider,
      click_to_move: click_slider,
      no_overlay: overlay,
    });
  };

  $(window).on("elementor/frontend/init", function () {
    elementorFrontend.hooks.addAction(
      "frontend/element_ready/elaet-compare-images.default",
      WidgetElaetCompareImages
    );
  });
  // image compare ----------------**********
  // content switcher ----------------**********
  /**
   * Radio Button Switcher JS Function.
   *
   */
  var WidgetelaetContentToggleHandler = function ($scope, $) {
    if ("undefined" == typeof $scope) {
      return;
    }
    var $this = $scope.find(".elaet-th-wrapper");
    var node_id = $scope.data("id");
    var th_section_1 = $scope.find(".elaet-th-section-1");
    var th_section_2 = $scope.find(".elaet-th-section-2");
    var main_btn = $scope.find(".elaet-main-btn");
    var switch_type = $(main_btn).attr("data-switch-type");
    var current_class;

    switch (switch_type) {
      case "round_1":
        current_class = ".elaet-switch-round-1";
        break;
      case "round_2":
        current_class = ".elaet-switch-round-2";
        break;
      case "capsule":
        current_class = ".elaet-switch-capsule";
        break;
      case "rectangle":
        current_class = ".elaet-switch-rectangle";
        break;
      case "oval_label_box":
        current_class = ".elaet-switch-oval-label-box";
        break;
      case "label_box":
        current_class = ".elaet-switch-label-box";
        break;

      default:
        current_class = "No Class Selected";
        break;
    }

    var th_switch = $scope.find(current_class);

    if ($(th_switch).is(":checked")) {
      $(th_section_1).hide();
    } else {
      $(th_section_2).hide();
    }

    $(th_switch).click(function () {
      $(th_section_1).toggle();
      $(th_section_2).toggle();
    });
  };

  $(window).on("elementor/frontend/init", function () {
    elementorFrontend.hooks.addAction(
      "frontend/element_ready/content-switcher.default",
      WidgetelaetContentToggleHandler
    );
  });
  // content switcher ----------------**********
  // countdown js ----------------**********
  var CountDown = function (block_scope) {
    let countDownWrapper = block_scope.find(".elemento-countdown-wrapper");
    let countDown = countDownWrapper.find(".elemento-countdown-date");
    let expire_type = countDown.attr("data-experytype");
    countDown.thcountdown({
      end: function () {
        if (expire_type == "text") {
          let expiry_title = countDown.attr("data-title");
          let expiry_text = countDown.attr("data-text");
          let finishContent = '<div class="elemento-countdown-finish-message">';
          finishContent += '<h4 class="expiry-title">';
          finishContent += expiry_title;
          finishContent += "</h4>";
          finishContent += '<div class="elemento-countdown-finish-text">';
          finishContent += expiry_text;
          finishContent += "</div>";
          finishContent += "</div>";
          countDown.html(finishContent);
        } else if (expire_type === "url") {
          let redirect_url = countDown.attr("data-url");
          if (redirect_url == "admin") {
            countDown.html("Redirect URL will work only in frontend.");
          } else {
            if (redirect_url) {
              window.location.href = redirect_url;
            }
          }
        }
      },
    });
    // end count down----------------------------
  };
  $(window).on("elementor/frontend/init", function () {
    elementorFrontend.hooks.addAction(
      "frontend/element_ready/elemento-countdown-clock.default",
      CountDown
    );
  });
  // countdown js ----------------**********
  // image animation js ----------------**********
  function imageAnimation() {
    var selector = ".elaet-image-module";

    function flip_effect(el, side) {
      side = side || (el.hasClass("image-pro-flip") ? "front" : "back");

      el.toggleClass("image-pro-flip", side === "back");
      window.setTimeout(function () {
        el.toggleClass("image-pro-flipped", side === "back");
      }, 1000);
    }

    $(document)
      .on("mouseenter touchstart", selector, function () {
        var $this = $(this),
          entranceEffect = $this.data("entrance-effect");

        $(selector)
          .not($this)
          .filter(function (index, element) {
            return $(this).data("image-enter");
          })
          .trigger("mouseleave");

        $this.data("image-enter", true);

        if (["flip-horizontal", "flip-vertical"].includes(entranceEffect)) {
          flip_effect($this, "back");
        } else if (entranceEffect === "none") {
          $this
            .find(".image-pro-overlay")
            .css("visibility", "visible")
            .addClass(entranceEffect);
        } else {
          $this
            .find(".image-pro-overlay")
            .css({ visibility: "visible", "animation-name": "" })
            .removeClass($this.data("exit-effect"))
            .addClass("wow animated " + entranceEffect);
        }
      })
      .on("mouseleave", selector, function (ev) {
        var $this = $(this),
          entranceEffect = $this.data("entrance-effect");

        $this.data("image-enter", false);

        if (["flip-horizontal", "flip-vertical"].includes(entranceEffect)) {
          flip_effect($this, "front");
        } else if (entranceEffect === "none") {
          $this
            .find(".image-pro-overlay")
            .css("visibility", "visible")
            .addClass(entranceEffect);
        } else {
          $this
            .find(".image-pro-overlay")
            .css({ "animation-name": "" })
            .removeClass(entranceEffect)
            .addClass("wow animated " + $this.data("exit-effect"));
        }
      });
  }
  $(window).on("elementor/frontend/init", function () {
    elementorFrontend.hooks.addAction(
      "frontend/element_ready/Image_Animation.default",
      imageAnimation
    );
  });
  // image animation js ----------------**********
  // counter js ----------------**********
  var WidgetCounter = function (blockScope) {
    $(window).scroll(function () {
      let blockCounter = blockScope.find(".elaet-counter-number");
      var oTop = blockCounter.offset().top - window.innerHeight;
      if ($(window).scrollTop() > oTop) {
        let startNumber = blockCounter.attr("data-start-number");
        if (startNumber) {
          let endNumber = blockCounter.attr("data-end-number");
          let duration = blockCounter.attr("data-duration");
          blockCounter.animate(
            {
              startNumber: endNumber,
            },
            {
              duration: duration * 1000,
              easing: "linear",
              step: function (now) {
                blockCounter.text(Math.ceil(now));
              },
            }
          );
          blockCounter.removeAttr("data-start-number");
        }
      }
      ////end
    });
  };
  $(window).on("elementor/frontend/init", function () {
    elementorFrontend.hooks.addAction(
      "frontend/element_ready/elaet-counter.default",
      WidgetCounter
    );
  });
  // counter js ----------------**********
})(jQuery);
