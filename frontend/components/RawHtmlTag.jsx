import React from 'react';

export default function RawHtmlTag({ tag, attribs, html }) {
  return React.createElement(tag, { ...attribs, dangerouslySetInnerHTML: { __html: html } });
}
