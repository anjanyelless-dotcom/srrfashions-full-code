import React from 'react';
import RawHtmlTag from './RawHtmlTag.jsx';
import aboutData from '../wp-json/wp/v2/pages/415.json';
import './AboutUs.css';

export default function AboutUs() {
  const html = aboutData?.content?.rendered || '';

  return (
    <div className="srfashion-about-us-page">
      <RawHtmlTag tag="div" attribs={{ className: 'srfashion-about-content' }} html={html} />
    </div>
  );
}
