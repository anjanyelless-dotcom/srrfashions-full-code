import React from "react";
import "./WhatsAppButton.css"

const WhatsAppButton = ({ productName }) => {
  const whatsappNumber = "9032666032"; // Replace with your WhatsApp business number

  const message = productName
    ? `Hi, I'm interested in the ${productName}. Can you please provide more details?`
    : "Hi, I’d like to join your WhatsApp group to stay updated about your latest products, new arrivals, offers, and updates. Could you please share the group link with me?";

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    message
  )}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-button"
      aria-label="Chat with us on WhatsApp"
      title="Chat with us on WhatsApp"
    >
      <svg
        viewBox="0 0 24 24"
        width="28"
        height="28"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M20.52 3.48A11.86 11.86 0 0 0 12.04 0C5.5 0 .17 5.33.17 11.87c0 2.09.55 4.13 1.59 5.93L.07 24l6.35-1.67a11.84 11.84 0 0 0 5.62 1.43h.01c6.54 0 11.86-5.33 11.86-11.87 0-3.17-1.23-6.15-3.39-8.41ZM12.05 21.77h-.01a9.86 9.86 0 0 1-5.03-1.38l-.36-.21-3.77.99 1.01-3.68-.23-.38a9.88 9.88 0 0 1-1.52-5.24c0-5.44 4.43-9.87 9.88-9.87 2.63 0 5.1 1.03 6.96 2.9a9.84 9.84 0 0 1 2.89 6.97c0 5.45-4.43 9.9-9.82 9.9Zm5.42-7.41c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.09 4.49.71.31 1.27.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
      </svg>
    </a>
  );
};

export default WhatsAppButton;