import React from 'react';
import RawHtmlTag from './RawHtmlTag.jsx';

const HeroSectionHtml = `
                <div class="e-con-inner">
                    <div class="elementor-element elementor-element-3499923 e-con-full e-flex e-con e-child"
                        data-id="3499923" data-element_type="container" data-e-type="container"
                        data-settings="{&quot;background_background&quot;:&quot;classic&quot;}">
                        <div class="elementor-element elementor-element-89a1ebc elementor-widget__width-initial elementor-widget elementor-widget-elemento_marquee_slider"
                            data-id="89a1ebc" data-element_type="widget" data-e-type="widget"
                            data-widget_type="elemento_marquee_slider.default">
                            <div class="elementor-widget-container">
                                <style>
                                    /* Carousel Container */
                                    .hero-carousel {
                                        width: 100%;
                                        overflow: hidden;
                                        position: relative;
                                        padding: 20px 0;
                                        display: flex;
                                        justify-content: center;
                                    }

                                    /* Wrapper for slides */
                                    .carousel-wrapper {
                                        display: flex;
                                        flex-wrap: nowrap;
                                        width: max-content;
                                        white-space: nowrap;
                                    }

                                    /* Carousel Item */
                                    .marquee-slide {
                                        flex: 0 0 auto;
                                        display: flex;
                                        justify-content: center;
                                        align-items: center;
                                        width: 18rem;
                                        position: relative;
                                        margin-right: 10px;
                                        margin-left: 10px;
                                    }

                                    /* Single Image */
                                    .hero-slide.single img {
                                        width: 100%;
                                        height: auto;
                                        max-width: 100%;
                                        object-fit: cover;
                                        border-radius: 10px;
                                    }

                                    /* Double Image (Stacked) */
                                    .marquee-slide.double {
                                        display: grid;
                                        grid-template-rows: auto auto;
                                        row-gap: 20px;
                                    }

                                    .hero-slide.double img {
                                        width: 100%;
                                        max-width: 100%;
                                        height: auto;
                                        object-fit: cover;
                                        border-radius: 10px;
                                    }

                                    .hero-slide .hero-overlay {
                                        position: relative;
                                        overflow: hidden;
                                        border-radius: 10px;
                                        display: flex;

                                    }

                                    .hero-slide .hero-overlay::before {
                                        content: "";
                                        position: absolute;
                                        top: 0;
                                        left: 0;
                                        width: 100%;
                                        height: 100%;
                                        transition: opacity 0.3s ease-in-out;
                                    }

                                    /* caption css */
                                    .hero-slide .slide-caption {
                                        display: flex;
                                        background-repeat: no-repeat;
                                        background-position: 50%;
                                        position: absolute;
                                        top: 0;
                                        left: 0;
                                        bottom: 0;
                                        right: 0;
                                        padding: 10px;
                                        margin: auto;
                                        justify-content: center;
                                        align-items: center;
                                        text-align: center;
                                        flex-wrap: wrap;
                                    }

                                    .hero-slide .slide-caption-inner {
                                        width: 100%;
                                        padding: 0px 0px 0px 0px;
                                    }

                                    .hero-slide .slide-title {
                                        margin: 0.5rem;
                                    }

                                    .hero-slide .slide-title a {
                                        font-size: 18px;
                                        color: #fff;
                                        line-height: 26px;

                                        text-decoration: none;
                                    }

                                    .hero-slide a.slide-button {
                                        border: 1px solid;
                                        color: #fff;
                                        background: transparent;
                                        display: inline-block;
                                        text-decoration: none !important;
                                        padding: 0.5rem 1rem;
                                        font-size: 0.89rem;
                                    }

                                    .slide-overall {
                                        position: absolute;
                                        top: 0;
                                        left: 0;
                                        width: 100%;
                                        height: 100%;
                                        z-index: 1;
                                    }

                                    .carousel-wrapper {
                                        width: 100%;
                                        transition: transform 0s linear;
                                    }

                                    /* .vertical .carousel-wrapper{
        width:auto;
    } */
                                    .marquee-slide {
                                        flex-shrink: 0;
                                        display: flex;
                                    }

                                    .marquee-slide .hero-slide {
                                        transition: opacity 0.3s ease-in-out;
                                    }

                                    .marquee-slide .hero-slide:hover {
                                        opacity: 0.6;
                                        transition: opacity 0.3s ease-in-out;
                                        cursor: pointer;
                                    }
                                </style>
                                <div class="hero-carousel slider-89a1ebc  layout_2  horizontal">
                                    <div class="carousel-wrapper" data-layout="layout_2" data-direction="left-to-right"
                                        data-speed="0.5" data-stophover="true">

                                        <div class="marquee-slide single">
                                            <div class="hero-slide single elementor-repeater-item-13ea5f3">
                                                <div class="hero-overlay hero-slide-0">
                                                    <a class="slide-overall"
                                                        href="product/puffer-jacket/index.html"></a>
                                                    <img decoding="async"
                                                        src="wp-content/uploads/sites/383/2026/07/16-1.png" alt="">
                                                    <div class="slide-caption slider-content">
                                                        <div class="slide-caption-inner">
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="marquee-slide single">
                                            <div class="hero-slide single elementor-repeater-item-c5b7480">
                                                <div class="hero-overlay hero-slide-1">
                                                    <a class="slide-overall"
                                                        href="product/puffer-jacket/index.html"></a>
                                                    <img decoding="async"
                                                        src="wp-content/uploads/sites/383/2026/07/9-1.png" alt="">
                                                    <div class="slide-caption slider-content">
                                                        <div class="slide-caption-inner">
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="marquee-slide single">
                                            <div class="hero-slide single elementor-repeater-item-45f5961">
                                                <div class="hero-overlay hero-slide-2">
                                                    <a class="slide-overall"
                                                        href="product/puffer-jacket/index.html"></a>
                                                    <img decoding="async"
                                                        src="wp-content/uploads/sites/383/2026/07/10-1.png" alt="">
                                                    <div class="slide-caption slider-content">
                                                        <div class="slide-caption-inner">
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="marquee-slide single">
                                            <div class="hero-slide single elementor-repeater-item-f50689f">
                                                <div class="hero-overlay hero-slide-3">
                                                    <a class="slide-overall"
                                                        href="product/puffer-jacket/index.html"></a>
                                                    <img decoding="async"
                                                        src="wp-content/uploads/sites/383/2026/07/11-1.png" alt="">
                                                    <div class="slide-caption slider-content">
                                                        <div class="slide-caption-inner">
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="marquee-slide single">
                                            <div class="hero-slide single elementor-repeater-item-ba2e741">
                                                <div class="hero-overlay hero-slide-4">
                                                    <a class="slide-overall"
                                                        href="product/puffer-jacket/index.html"></a>
                                                    <img decoding="async"
                                                        src="wp-content/uploads/sites/383/2026/07/15-1.png" alt="">
                                                    <div class="slide-caption slider-content">
                                                        <div class="slide-caption-inner">
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="marquee-slide single">
                                            <div class="hero-slide single elementor-repeater-item-e296f70">
                                                <div class="hero-overlay hero-slide-5">
                                                    <a class="slide-overall"
                                                        href="product/puffer-jacket/index.html"></a>
                                                    <img decoding="async"
                                                        src="wp-content/uploads/sites/383/2026/07/12-1.png" alt="">
                                                    <div class="slide-caption slider-content">
                                                        <div class="slide-caption-inner">
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="marquee-slide single">
                                            <div class="hero-slide single elementor-repeater-item-ba3bf8a">
                                                <div class="hero-overlay hero-slide-6">
                                                    <a class="slide-overall"
                                                        href="product/puffer-jacket/index.html"></a>
                                                    <img decoding="async"
                                                        src="wp-content/uploads/sites/383/2026/07/14-1.png" alt="">
                                                    <div class="slide-caption slider-content">
                                                        <div class="slide-caption-inner">
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="marquee-slide single">
                                            <div class="hero-slide single elementor-repeater-item-b639496">
                                                <div class="hero-overlay hero-slide-7">
                                                    <a class="slide-overall"
                                                        href="product/puffer-jacket/index.html"></a>
                                                    <img decoding="async"
                                                        src="wp-content/uploads/sites/383/2026/07/13-1.png" alt="">
                                                    <div class="slide-caption slider-content">
                                                        <div class="slide-caption-inner">
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <!-- end layout2 -->
                                    </div>
                                </div>
                        
                            </div>
                        </div>
                    </div>
                </div>
            `;
const HeroSectionAttribs = {
  "className": "elementor-element elementor-element-0e62d3d e-flex e-con-boxed e-con e-parent",
  "data-id": "0e62d3d",
  "data-element_type": "container",
  "data-e-type": "container"
};

export default function HeroSection() {
  return <RawHtmlTag tag="div" attribs={HeroSectionAttribs} html={HeroSectionHtml} />;
}
