function loadChatWidget() {
  const widgetIframe = document.createElement('iframe');
  widgetIframe.src = 'https://chat-75vz.vercel.app'; // URL of your Angular widget
  widgetIframe.style.position = 'fixed';
  widgetIframe.style.bottom = '20px';
  widgetIframe.style.right = '20px';
  widgetIframe.style.width = '350px';
  widgetIframe.style.height = '500px';
  widgetIframe.style.border = 'none';
  widgetIframe.style.zIndex = '10000';

  widgetIframe.onload = () => {
    console.log('Chat widget loaded successfully');
  };

  widgetIframe.onerror = () => {
    console.error('Failed to load chat widget.');
  };

  document.body.appendChild(widgetIframe);
}
