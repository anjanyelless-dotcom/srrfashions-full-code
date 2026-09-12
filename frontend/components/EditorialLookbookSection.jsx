import React from 'react';
import RawHtmlTag from './RawHtmlTag.jsx';

const EditorialLookbookSectionHtml = `
                <div class="e-con-inner">
                    <div class="elementor-element elementor-element-9fa84a7 e-con-full e-flex e-con e-child"
                        data-id="9fa84a7" data-element_type="container" data-e-type="container"
                        data-settings="{&quot;background_background&quot;:&quot;classic&quot;}">
                        <div class="elementor-element elementor-element-c7a94b8 e-con-full e-flex e-con e-child"
                            data-id="c7a94b8" data-element_type="container" data-e-type="container">
                            <div class="lge-glass elementor-element elementor-element-b73c4c9 elementor-widget elementor-widget-heading"
                                data-id="b73c4c9" data-element_type="widget" data-e-type="widget"
                                data-widget_type="heading.default">
                                <h2 class="elementor-heading-title elementor-size-default">Featured This Season
                                </h2>
                            </div>
                            <div class="elementor-element elementor-element-41480c7 elementor-widget__width-initial elemento-heading-fill-color elementor-widget elementor-widget-elemento-advance-heading"
                                data-id="41480c7" data-element_type="widget" data-e-type="widget"
                                data-widget_type="elemento-advance-heading.default">
                                <div class="elementor-widget-container">
                                    <div class="elemento-heading-wrapper">
                                        <h2 class="elemento-addon-heading_ elemento-animation-added"
                                            id="elemento-addon-heading_"><a><span
                                                    class="elemento-heading-text elemento-heading-text-1 ">The Art
                                                    of</span><span
                                                    class="elemento-heading-text-second elemento-hilighted-text    "><span
                                                        class="elemento-heading-text">Staying Warm</span><svg
                                                        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 150"
                                                        preserveAspectRatio="none"
                                                        style="animation-duration: 1.2s;-webkit-animation-duration:1.2s;animation-delay: 1.2s;-webkit-animation-delay:1.2s;">
                                                        <path
                                                            d="M325,18C228.7-8.3,118.5,8.3,78,21C22.4,38.4,4.6,54.6,5.6,77.6c1.4,32.4,52.2,54,142.6,63.7 c66.2,7.1,212.2,7.5,273.5-8.3c64.4-16.6,104.3-57.6,33.8-98.2C386.7-4.9,179.4-1.4,126.3,20.7">
                                                        </path>
                                                    </svg></span><span
                                                    class="elemento-heading-text elemento-heading-text-3">in
                                                    Style</span></a></h2>
                                    </div>
                                </div>
                            </div>
                            <div class="elementor-element elementor-element-637aa7e elementor-widget elementor-widget-heading"
                                data-id="637aa7e" data-element_type="widget" data-e-type="widget"
                                data-widget_type="heading.default">
                                <h2 class="elementor-heading-title elementor-size-default">This season we explored the
                                    quieter palette of winter mornings — sage, blush, stone, and slate — fabrics that
                                    ask to be touched, silhouettes that ask nothing of you.</h2>
                            </div>
                            <div class="elementor-element elementor-element-31b2f0c e-con-full e-flex e-con e-child"
                                data-id="31b2f0c" data-element_type="container" data-e-type="container">
                                <div class="elementor-element elementor-element-7f37be8 elementor-widget elementor-widget-button"
                                    data-id="7f37be8" data-element_type="widget" data-e-type="widget"
                                    data-widget_type="button.default">
                                 
                                </div>
                                <div class="elementor-element elementor-element-7daebab elementor-widget elementor-widget-button"
                                    data-id="7daebab" data-element_type="widget" data-e-type="widget"
                                    data-widget_type="button.default">
                                
                                </div>
                            </div>
                        </div>
                        <div class="elementor-element elementor-element-9650eea e-con-full e-flex e-con e-child"
                            data-id="9650eea" data-element_type="container" data-e-type="container">
                            <div class="elementor-element elementor-element-92fd6f4 e-con-full e-flex e-con e-child"
                                data-id="92fd6f4" data-element_type="container" data-e-type="container"
                                data-settings="{&quot;background_background&quot;:&quot;classic&quot;}">
                                <div class="elementor-element elementor-element-05ede75 elementor-widget elementor-widget-heading"
                                    data-id="05ede75" data-element_type="widget" data-e-type="widget"
                                    data-widget_type="heading.default">
                                    <h2 class="elementor-heading-title elementor-size-default">The Parka
                                        Edit</h2>
                                </div>
                            </div>
                            <div class="elementor-element elementor-element-fc812c7 e-con-full e-flex e-con e-child"
                                data-id="fc812c7" data-element_type="container" data-e-type="container"
                                data-settings="{&quot;background_background&quot;:&quot;classic&quot;}">
                                <div class="elementor-element elementor-element-ee7b6bb elementor-widget elementor-widget-heading"
                                    data-id="ee7b6bb" data-element_type="widget" data-e-type="widget"
                                    data-widget_type="heading.default">
                                    <h2 class="elementor-heading-title elementor-size-default">Soft
                                        Knitwear</h2>
                                </div>
                            </div>
                            <div class="elementor-element elementor-element-b9d2588 e-con-full e-flex e-con e-child"
                                data-id="b9d2588" data-element_type="container" data-e-type="container"
                                data-settings="{&quot;background_background&quot;:&quot;classic&quot;}">
                                <div class="elementor-element elementor-element-eae449c elementor-widget elementor-widget-heading"
                                    data-id="eae449c" data-element_type="widget" data-e-type="widget"
                                    data-widget_type="heading.default">
                                    <h2 class="elementor-heading-title elementor-size-default">Fluid
                                        Trousers</h2>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
const EditorialLookbookSectionAttribs = {
  "className": "elementor-element elementor-element-1abc3a7 e-flex e-con-boxed e-con e-parent",
  "data-id": "1abc3a7",
  "data-element_type": "container",
  "data-e-type": "container"
};

export default function EditorialLookbookSection() {
  return <RawHtmlTag tag="div" attribs={EditorialLookbookSectionAttribs} html={EditorialLookbookSectionHtml} />;
}
