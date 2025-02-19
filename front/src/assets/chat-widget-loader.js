//create a chat widget
(function() {
  var script = document.createElement('script');
  script.type = 'module';
  script.src = 'https://chat-75vz.vercel.app/dist/frontend/browser/main.js?nocache=' + new Date().getTime();
  script.onload = function() {
    document.addEventListener('DOMContentLoaded', function() {
      var chatWidget = document.createElement('app-chat-widget');
      document.body.appendChild(chatWidget);
    });
    script.setAttribute('crossorigin', "*");
  };
  script.onerror = function(event) {
    console.error('Failed to load chat widget:');
    console.error(event);  // Logs the entire error object
    console.error('Error Message:', event.message || 'No message provided');  // Safely logging message
    console.error('File Name:', event.filename || 'No filename provided');  // Safely logging filename
    console.error('Line Number:', event.lineno || 'No line number provided');  // Safely logging line number
    console.error('Error Object:', event.error || 'No error object provided');
  };
  document.head.appendChild(script);
})();

