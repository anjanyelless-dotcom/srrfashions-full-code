const SITE_URL = 'https://www.srrfashions.in';

// Strip HTML tags from text
function stripHtml(html) {
  if (!html) return '';
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

// Escape HTML entities for meta tags
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Update or create meta tag
function setMetaTag(name, content, property = null) {
  if (property) {
    let meta = document.querySelector(`meta[property="${property}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('property', property);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
  } else {
    let meta = document.querySelector(`meta[name="${name}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', name);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
  }
}

// Update or create canonical link
function setCanonical(url) {
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', url);
}

// Update Open Graph image
function setOgImage(url) {
  if (url) {
    setMetaTag('og:image', url, 'og:image');
    setMetaTag('twitter:image', url, 'twitter:image');
  }
}

// Main SEO update function
export function updateSEO(config) {
  const {
    title,
    description,
    canonical,
    ogType = 'website',
    ogImage = null
  } = config;

  // Update title
  if (title) {
    document.title = title;
  }

  // Update meta description
  if (description) {
    const cleanDescription = escapeHtml(stripHtml(description).substring(0, 160));
    setMetaTag('description', cleanDescription);
  }

  // Update canonical
  if (canonical) {
    setCanonical(canonical);
  }

  // Update Open Graph
  if (title) {
    setMetaTag('og:title', title, 'og:title');
  }
  if (description) {
    const cleanDescription = escapeHtml(stripHtml(description).substring(0, 160));
    setMetaTag('og:description', cleanDescription, 'og:description');
  }
  if (canonical) {
    setMetaTag('og:url', canonical, 'og:url');
  }
  setMetaTag('og:type', ogType, 'og:type');

  // Update Twitter
  if (title) {
    setMetaTag('twitter:title', title, 'twitter:title');
  }
  if (description) {
    const cleanDescription = escapeHtml(stripHtml(description).substring(0, 160));
    setMetaTag('twitter:description', cleanDescription, 'twitter:description');
  }

  // Update images if provided
  if (ogImage) {
    setOgImage(ogImage);
  }
}

// Route-specific SEO functions
export function setHomepageSEO() {
  updateSEO({
    title: "SRR Fashions | Women's Fashion & Clothing in Hyderabad",
    description: "Shop women's fashion and clothing from SRR Fashions in Hyderabad, Telangana. Explore stylish tops, dresses, accessories, cardigans, handbags, shoes, sunglasses, sweatshirts and more online.",
    canonical: SITE_URL + '/',
    ogType: 'website'
  });
}

export function setAboutSEO() {
  updateSEO({
    title: "SRR Fashions | About Us",
    description: "Learn about SRR Fashions, your destination for women's fashion in Hyderabad, Telangana.",
    canonical: SITE_URL + '/about-us',
    ogType: 'website'
  });
}

export function setContactSEO() {
  updateSEO({
    title: "SRR Fashions | Contact Us",
    description: "Contact SRR Fashions in Hyderabad, Telangana. Get in touch for inquiries about our women's fashion and clothing collection.",
    canonical: SITE_URL + '/contact-us',
    ogType: 'website'
  });
}

export function setCategorySEO(category) {
  const name = category?.name || 'Category';
  const description = category?.description 
    ? category.description
    : `Shop ${name.toLowerCase()} from SRR Fashions in Hyderabad. Explore available styles and products online.`;
  
  updateSEO({
    title: `${name} | SRR Fashions Hyderabad`,
    description,
    canonical: SITE_URL + `/category/${category?.slug || ''}`,
    ogType: 'website',
    ogImage: category?.image_url || null
  });
}

export function setProductSEO(product) {
  const name = product?.name || 'Product';
  const description = product?.description 
    ? product.description
    : `Discover ${name} at SRR Fashions. Browse our collection of women's fashion and clothing in Hyderabad.`;
  
  // Get primary image
  const images = product?.images || [];
  const primaryImage = images.length > 0 ? images[0]?.image_url : null;
  const fullImageUrl = primaryImage 
    ? (primaryImage.startsWith('http') ? primaryImage : SITE_URL + '/' + primaryImage.replace(/^\//, ''))
    : null;

  updateSEO({
    title: `${name} | SRR Fashions`,
    description,
    canonical: SITE_URL + `/product/${product?.slug || ''}`,
    ogType: 'product',
    ogImage: fullImageUrl
  });
}

export function setNotFoundSEO(type = 'page') {
  if (type === 'product') {
    updateSEO({
      title: "Product Not Found | SRR Fashions",
      description: "The product you're looking for could not be found. Browse our collection of women's fashion and clothing.",
      canonical: SITE_URL + '/',
      ogType: 'website'
    });
  } else if (type === 'category') {
    updateSEO({
      title: "Category Not Found | SRR Fashions",
      description: "The category you're looking for could not be found. Browse our collection of women's fashion and clothing.",
      canonical: SITE_URL + '/',
      ogType: 'website'
    });
  } else {
    updateSEO({
      title: "Page Not Found | SRR Fashions",
      description: "The page you're looking for could not be found. Browse our collection of women's fashion and clothing.",
      canonical: SITE_URL + '/',
      ogType: 'website'
    });
  }
}
