var SlackButton = (function() {
  var Request = require('request');

  var WEBHOOK_URL = '';
  var MESSAGE     = '';

  var options = {
    uri: WEBHOOK_URL,
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
    json: { text: MESSAGE }
  };

  return {
    post: () => {
      Request(options, function (error, response, body) {});
    }
  };
}());



// event
console.log( `slack-button: ${ dash_id }` );
SlackButton.post();