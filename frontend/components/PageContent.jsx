import HeroSection from './HeroSection.jsx';
import FeaturedSeasonSection from './FeaturedSeasonSection.jsx';
import VideoShoppingSection from './VideoShoppingSection.jsx';
import EditorialLookbookSection from './EditorialLookbookSection.jsx';
import JustLandedSection from './JustLandedSection.jsx';
import BrandStorySection from './BrandStorySection.jsx';
import React from 'react';

const wpPageAttribs = {
  "data-elementor-type": "wp-page",
  "data-elementor-id": "13",
  "className": "elementor elementor-13"
};

export default function PageContent() {
  return (
    <div {...wpPageAttribs}>
      <HeroSection />
      <FeaturedSeasonSection />
      <VideoShoppingSection />
      <EditorialLookbookSection />
      <JustLandedSection />
      <BrandStorySection />
    </div>
  );
}
