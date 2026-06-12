import { NextResponse } from 'next/server';

/**
 * GET: Serves the client-side JavaScript loader that injects 
 * the floating chat bubble and handles iframe toggling on any host website.
 */
export async function GET(request) {
  const { origin } = new URL(request.url);

  // The JS loader script content
  const jsContent = `
(function() {
  // Prevent duplicate initialization
  if (window.__HushRagWidgetInitialized) return;
  window.__HushRagWidgetInitialized = true;

  // Retrieve script tags parameters
  const scriptTag = document.currentScript || document.querySelector('script[src*="api/widget"]');
  if (!scriptTag) {
    console.error('HushRag widget script tag not found.');
    return;
  }

  const orgId = scriptTag.getAttribute('data-org');
  const pass = scriptTag.getAttribute('data-pass') || '';
  const channel = scriptTag.getAttribute('data-channel') || 'web-widget';

  if (!orgId) {
    console.error('HushRag widget error: Missing data-org attribute.');
    return;
  }

  // Create stylesheet for the bubble and iframe container
  const style = document.createElement('style');
  style.textContent = \`
    #sp-chat-bubble {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #09090b;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2147483647;
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s ease;
    }
    #sp-chat-bubble:hover {
      transform: scale(1.06) rotate(5deg);
      background: #27272a;
    }
    #sp-chat-bubble.open-state {
      transform: scale(1) rotate(90deg);
    }
    #sp-chat-bubble.open-state:hover {
      transform: scale(1.06) rotate(95deg);
    }
    #sp-chat-bubble svg {
      width: 24px;
      height: 24px;
    }
    #sp-chat-iframe-container {
      position: fixed !important;
      bottom: 90px !important;
      right: 20px !important;
      width: 440px !important;
      height: 680px !important;
      min-height: 500px !important;
      max-height: calc(100vh - 120px) !important;
      max-width: calc(100vw - 40px) !important;
      border-radius: 16px !important;
      box-shadow: 0 12px 30px -5px rgba(0, 0, 0, 0.15), 0 8px 16px -6px rgba(0, 0, 0, 0.15) !important;
      border: 1px solid #e4e4e7 !important;
      z-index: 2147483647 !important;
      overflow: hidden !important;
      opacity: 0;
      transform: translateY(20px) scale(0.95);
      visibility: hidden;
      pointer-events: none;
      transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.25s;
      background-color: #ffffff !important;
    }
    #sp-chat-iframe-container.open {
      opacity: 1 !important;
      transform: translateY(0) scale(1) !important;
      visibility: visible !important;
      pointer-events: auto !important;
    }
    #sp-chat-iframe {
      width: 100% !important;
      height: 100% !important;
      max-height: none !important;
      max-width: none !important;
      border: none !important;
      display: block !important;
      background: transparent !important;
    }
  \`;
  document.head.appendChild(style);

  // SVG Icons
  const chatIconHtml = '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
  const closeIconHtml = '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

  // Create floating bubble button
  const bubble = document.createElement('div');
  bubble.id = 'sp-chat-bubble';
  bubble.innerHTML = chatIconHtml;
  document.body.appendChild(bubble);

  // Create iframe container
  const container = document.createElement('div');
  container.id = 'sp-chat-iframe-container';
  
  // Construct iframe URL with E2EE keys passed client-side
  const iframeUrl = \`${origin}/widget?org=\${orgId}&pass=\${encodeURIComponent(pass)}&channel=\${channel}\`;
  
  container.innerHTML = \`<iframe id="sp-chat-iframe" src="\${iframeUrl}" allow="clipboard-write"></iframe>\`;
  document.body.appendChild(container);

  // Handle toggling open/close states
  let isOpen = false;
  bubble.addEventListener('click', () => {
    isOpen = !isOpen;
    if (isOpen) {
      bubble.classList.add('open-state');
      bubble.innerHTML = closeIconHtml;
      container.classList.add('open');
    } else {
      bubble.classList.remove('open-state');
      bubble.innerHTML = chatIconHtml;
      container.classList.remove('open');
    }
  });

  // Listen to close requests from inside the iframe
  window.addEventListener('message', (event) => {
    if (event.data === 'sp-close-chat') {
      bubble.click();
    }
  });
})();
  `;

  return new NextResponse(jsContent, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}
