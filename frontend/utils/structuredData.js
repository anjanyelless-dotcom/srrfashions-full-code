const SITE_URL = 'https://www.srrfashions.in';

// Set LocalBusiness structured data
export function setLocalBusinessSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'SRR Fashions',
    url: SITE_URL,
    telephone: '+91 9032666032',
    email: 'anjanyelless@gmail.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Lakshmi Apartment, Venkata Ramana Colony, Hafeezpet',
      addressLocality: 'Hyderabad',
      addressRegion: 'Telangana',
      postalCode: '500085',
      addressCountry: 'IN'
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday'
        ],
        opens: '09:00',
        closes: '21:00'
      }
    ]
  };

  // Remove existing schema if present
  const existingScript = document.getElementById('srr-fashions-local-business-schema');
  if (existingScript) {
    existingScript.remove();
  }

  // Create and insert new schema
  const script = document.createElement('script');
  script.id = 'srr-fashions-local-business-schema';
  script.type = 'application/ld+json';
  script.text = JSON.stringify(schema);
  document.head.appendChild(script);
}

// Remove LocalBusiness schema (for cleanup if needed)
export function removeLocalBusinessSchema() {
  const existingScript = document.getElementById('srr-fashions-local-business-schema');
  if (existingScript) {
    existingScript.remove();
  }
}

// Set Product structured data
export function setProductSchema(product) {
  if (!product) {
    return;
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    url: `${SITE_URL}/product/${product.slug}`
  };

  // Add description if available
  if (product.description) {
    schema.description = product.description;
  }

  // Add image if available
  if (product.images && product.images.length > 0) {
    const imageUrl = product.images[0].image_url;
    if (imageUrl) {
      // Convert relative URLs to absolute
      schema.image = imageUrl.startsWith('http') 
        ? imageUrl 
        : `${SITE_URL}/${imageUrl.replace(/^\//, '')}`;
    }
  }

  // Add offers if price is available
  if (product.selling_price !== undefined && product.selling_price !== null) {
    schema.offers = {
      '@type': 'Offer',
      price: product.selling_price,
      priceCurrency: 'INR',
      url: `${SITE_URL}/product/${product.slug}`
    };

    // Add availability if has_stock is available
    if (product.has_stock !== undefined) {
      schema.offers.availability = product.has_stock 
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock';
    }
  }

  // Remove existing product schema if present
  const existingScript = document.getElementById('srr-fashions-product-schema');
  if (existingScript) {
    existingScript.remove();
  }

  // Create and insert new schema
  const script = document.createElement('script');
  script.id = 'srr-fashions-product-schema';
  script.type = 'application/ld+json';
  script.text = JSON.stringify(schema);
  document.head.appendChild(script);
}

// Remove Product schema (for cleanup when leaving product page)
export function removeProductSchema() {
  const existingScript = document.getElementById('srr-fashions-product-schema');
  if (existingScript) {
    existingScript.remove();
  }
}

// Set BreadcrumbList structured data
export function setBreadcrumbSchema(items) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return;
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };

  // Remove existing breadcrumb schema if present
  const existingScript = document.getElementById('srr-fashions-breadcrumb-schema');
  if (existingScript) {
    existingScript.remove();
  }

  // Create and insert new schema
  const script = document.createElement('script');
  script.id = 'srr-fashions-breadcrumb-schema';
  script.type = 'application/ld+json';
  script.text = JSON.stringify(schema);
  document.head.appendChild(script);
}

// Remove BreadcrumbList schema (for cleanup when leaving public pages)
export function removeBreadcrumbSchema() {
  const existingScript = document.getElementById('srr-fashions-breadcrumb-schema');
  if (existingScript) {
    existingScript.remove();
  }
}
