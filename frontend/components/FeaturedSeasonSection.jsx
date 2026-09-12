import React from 'react';
import RawHtmlTag from './RawHtmlTag.jsx';

const FeaturedSeasonSectionHtml = `
                <div class="e-con-inner">
                    <div class="elementor-element elementor-element-576e0ba e-con-full e-flex e-con e-child"
                        data-id="576e0ba" data-element_type="container" data-e-type="container">
                        <div class="elementor-element elementor-element-771fb1e e-con-full e-flex e-con e-child"
                            data-id="771fb1e" data-element_type="container" data-e-type="container">
                            <div class="elementor-element elementor-element-d863712 elementor-widget elementor-widget-heading"
                                data-id="d863712" data-element_type="widget" data-e-type="widget"
                                data-widget_type="heading.default">
                                <h2 class="elementor-heading-title elementor-size-default">Featured This Season
                                </h2>
                            </div>
                            <div class="elementor-element elementor-element-6d85387 elementor-widget__width-initial elemento-heading-fill-color elementor-widget elementor-widget-elemento-advance-heading"
                                data-id="6d85387" data-element_type="widget" data-e-type="widget"
                                data-widget_type="elemento-advance-heading.default">
                                <div class="elementor-widget-container">
                                    <div class="elemento-heading-wrapper">
                                        <h2 class="elemento-addon-heading_ elemento-animation-added"
                                            id="elemento-addon-heading_"><a><span
                                                    class="elemento-heading-text elemento-heading-text-1 ">Pieces worth
                                                </span><span
                                                    class="elemento-heading-text-second elemento-hilighted-text    "><span
                                                        class="elemento-heading-text">living in</span><svg
                                                        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 150"
                                                        preserveAspectRatio="none"
                                                        style="animation-duration: 1.2s;-webkit-animation-duration:1.2s;animation-delay: 1.2s;-webkit-animation-delay:1.2s;">
                                                        <path
                                                            d="M325,18C228.7-8.3,118.5,8.3,78,21C22.4,38.4,4.6,54.6,5.6,77.6c1.4,32.4,52.2,54,142.6,63.7 c66.2,7.1,212.2,7.5,273.5-8.3c64.4-16.6,104.3-57.6,33.8-98.2C386.7-4.9,179.4-1.4,126.3,20.7">
                                                        </path>
                                                    </svg></span></a></h2>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="elementor-element elementor-element-2c33836 elementor-widget__width-initial elementor-widget elementor-widget-heading"
                            data-id="2c33836" data-element_type="widget" data-e-type="widget"
                            data-widget_type="heading.default">
                            <h2 class="elementor-heading-title elementor-size-default">Carefully considered silhouettes
                                for the woman who moves through the world with quiet confidence.</h2>
                        </div>
                    </div>
                    <div class="elementor-element elementor-element-5f6e83a e-con-full e-flex e-con e-child"
                        data-id="5f6e83a" data-element_type="container" data-e-type="container">
                        <div class="elementor-element elementor-element-e726f50 e-con-full e-flex e-con e-child"
                            data-id="e726f50" data-element_type="container" data-e-type="container"
                            data-settings="{&quot;background_background&quot;:&quot;classic&quot;}">
                            <div class="elementor-element elementor-element-2b1874f elementor-widget elementor-widget-heading"
                                data-id="2b1874f" data-element_type="widget" data-e-type="widget"
                                data-widget_type="heading.default">
                                <h2 class="elementor-heading-title elementor-size-default">Outerwear</h2>
                            </div>
                            <div class="elementor-element elementor-element-4775fc9 elementor-widget elementor-widget-heading"
                                data-id="4775fc9" data-element_type="widget" data-e-type="widget"
                                data-widget_type="heading.default">
                                <h2 class="elementor-heading-title elementor-size-default">Sage Quilted Parka</h2>
                            </div>
                            <div class="elementor-element elementor-element-0afab70 elementor-widget elementor-widget-heading"
                                data-id="0afab70" data-element_type="widget" data-e-type="widget"
                                data-widget_type="heading.default">
                                <h2 class="elementor-heading-title elementor-size-default">Start From ₹589</h2>
                            </div>
                        </div>
                        <div class="elementor-element elementor-element-b9e2592 e-con-full e-flex e-con e-child"
                            data-id="b9e2592" data-element_type="container" data-e-type="container">
                            <div class="elementor-element elementor-element-feda037 e-con-full e-flex e-con e-child"
                                data-id="feda037" data-element_type="container" data-e-type="container">
                                <div class="elementor-element elementor-element-1acdae8 e-con-full e-flex e-con e-child"
                                    data-id="1acdae8" data-element_type="container" data-e-type="container"
                                    data-settings="{&quot;background_background&quot;:&quot;classic&quot;}">
                                    <div class="elementor-element elementor-element-9e5e86a elementor-widget elementor-widget-heading"
                                        data-id="9e5e86a" data-element_type="widget" data-e-type="widget"
                                        data-widget_type="heading.default">
                                        <h2 class="elementor-heading-title elementor-size-default">Knitwear
                                        </h2>
                                    </div>
                                    <div class="elementor-element elementor-element-d2553d9 elementor-widget elementor-widget-heading"
                                        data-id="d2553d9" data-element_type="widget" data-e-type="widget"
                                        data-widget_type="heading.default">
                                        <h2 class="elementor-heading-title elementor-size-default">Blush Ribbed
                                            Turtleneck
                                        </h2>
                                    </div>
                                    <div class="elementor-element elementor-element-3bb71a6 elementor-widget elementor-widget-heading"
                                        data-id="3bb71a6" data-element_type="widget" data-e-type="widget"
                                        data-widget_type="heading.default">
                                        <h2 class="elementor-heading-title elementor-size-default">Start From ₹549</h2>
                                    </div>
                                </div>
                                <div class="elementor-element elementor-element-7e4bfe0 e-con-full e-flex e-con e-child"
                                    data-id="7e4bfe0" data-element_type="container" data-e-type="container"
                                    data-settings="{&quot;background_background&quot;:&quot;classic&quot;}">
                                    <div class="elementor-element elementor-element-906215e elementor-widget elementor-widget-heading"
                                        data-id="906215e" data-element_type="widget" data-e-type="widget"
                                        data-widget_type="heading.default">
                                        <h2 class="elementor-heading-title elementor-size-default">Trousers
                                        </h2>
                                    </div>
                                    <div class="elementor-element elementor-element-0ca0fa4 elementor-widget elementor-widget-heading"
                                        data-id="0ca0fa4" data-element_type="widget" data-e-type="widget"
                                        data-widget_type="heading.default">
                                        <h2 class="elementor-heading-title elementor-size-default">Lavender Wide-Leg
                                            Trouser
                                        </h2>
                                    </div>
                                    <div class="elementor-element elementor-element-6d54fa5 elementor-widget elementor-widget-heading"
                                        data-id="6d54fa5" data-element_type="widget" data-e-type="widget"
                                        data-widget_type="heading.default">
                                        <h2 class="elementor-heading-title elementor-size-default">Start From ₹679</h2>
                                    </div>
                                </div>
                            </div>
                            <div class="elementor-element elementor-element-600b0b2 e-con-full e-flex e-con e-child"
                                data-id="600b0b2" data-element_type="container" data-e-type="container">
                                <div class="elementor-element elementor-element-f627a54 e-con-full e-flex e-con e-child"
                                    data-id="f627a54" data-element_type="container" data-e-type="container"
                                    data-settings="{&quot;background_background&quot;:&quot;classic&quot;}">
                                    <div class="elementor-element elementor-element-fd4c115 elementor-widget elementor-widget-heading"
                                        data-id="fd4c115" data-element_type="widget" data-e-type="widget"
                                        data-widget_type="heading.default">
                                        <h2 class="elementor-heading-title elementor-size-default">Layering
                                        </h2>
                                    </div>
                                    <div class="elementor-element elementor-element-c30b8e8 elementor-widget elementor-widget-heading"
                                        data-id="c30b8e8" data-element_type="widget" data-e-type="widget"
                                        data-widget_type="heading.default">
                                        <h2 class="elementor-heading-title elementor-size-default">Mint Oversized Shirt
                                        </h2>
                                    </div>
                                    <div class="elementor-element elementor-element-2b7b403 elementor-widget elementor-widget-heading"
                                        data-id="2b7b403" data-element_type="widget" data-e-type="widget"
                                        data-widget_type="heading.default">
                                        <h2 class="elementor-heading-title elementor-size-default">Start From ₹475</h2>
                                    </div>
                                </div>
                                <div class="elementor-element elementor-element-e2ca40f e-con-full e-flex e-con e-child"
                                    data-id="e2ca40f" data-element_type="container" data-e-type="container"
                                    data-settings="{&quot;background_background&quot;:&quot;classic&quot;}">
                                    <div class="elementor-element elementor-element-4d36d8e elementor-widget elementor-widget-heading"
                                        data-id="4d36d8e" data-element_type="widget" data-e-type="widget"
                                        data-widget_type="heading.default">
                                        <h2 class="elementor-heading-title elementor-size-default">Accessories
                                        </h2>
                                    </div>
                                    <div class="elementor-element elementor-element-407e353 elementor-widget elementor-widget-heading"
                                        data-id="407e353" data-element_type="widget" data-e-type="widget"
                                        data-widget_type="heading.default">
                                        <h2 class="elementor-heading-title elementor-size-default">Tonal Scarf Set</h2>
                                    </div>
                                    <div class="elementor-element elementor-element-8d3a96c elementor-widget elementor-widget-heading"
                                        data-id="8d3a96c" data-element_type="widget" data-e-type="widget"
                                        data-widget_type="heading.default">
                                        <h2 class="elementor-heading-title elementor-size-default">Start From ₹459</h2>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
const FeaturedSeasonSectionAttribs = {
  "className": "elementor-element elementor-element-98fc4bf e-flex e-con-boxed e-con e-parent",
  "data-id": "98fc4bf",
  "data-element_type": "container",
  "data-e-type": "container"
};

export default function FeaturedSeasonSection() {
  return <RawHtmlTag tag="div" attribs={FeaturedSeasonSectionAttribs} html={FeaturedSeasonSectionHtml} />;
}
