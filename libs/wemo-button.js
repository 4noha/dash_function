var WEMOButton = (function() {
  var Request = require('request');

  var WEMO_IP  = 'your wemo device ip';
  var WEMO_URL = `http://${ WEMO_IP }:49153/upnp/control/basicevent1`;

  var options = {
    uri: WEMO_URL,
    headers: {
      'Content-Type': 'text/xml',
      'SOAPACTION':   '"urn:Belkin:service:basicevent:1#GetBinaryState"'
    },
    method: 'POST',
    body: '<?xml version="1.0" encoding="utf-8"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><s:Body><u:GetBinaryState xmlns:u="urn:Belkin:service:basicevent:1"><BinaryState>1</BinaryState></u:GetBinaryState></s:Body></s:Envelope>'
  };
  var switchOptions = {
    uri: WEMO_URL,
    headers: {
      'Content-Type': 'text/xml',
      'SOAPACTION':   '"urn:Belkin:service:basicevent:1#SetBinaryState"'
    },
    method: 'POST',
    body: '<?xml version="1.0" encoding="utf-8"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><s:Body><u:GetBinaryState xmlns:u="urn:Belkin:service:basicevent:1"><BinaryState>1</BinaryState></u:GetBinaryState></s:Body></s:Envelope>'
  };

  return {
    switch: () => {
      Request(options, function (error, response, body) {
        if( error == null ){
          if( body.match( /.*<BinaryState>(\d)<\/BinaryState>.*/ )[1] == 8 ){
            var onFlag = '0';
          } else {
            var onFlag = '1';
          }

          switchOptions.body = `\
            <?xml version="1.0" encoding="utf-8"?> \
            <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
              <s:Body> \
                <u:SetBinaryState xmlns:u="urn:Belkin:service:basicevent:1"> \
                  <BinaryState>${ onFlag }</BinaryState> \
                </u:SetBinaryState> \
              </s:Body> \
            </s:Envelope>`;

          switchOptions.body = `<?xml version="1.0" encoding="utf-8"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><s:Body><u:SetBinaryState xmlns:u="urn:Belkin:service:basicevent:1"><BinaryState>${ onFlag }</BinaryState></u:SetBinaryState></s:Body></s:Envelope>`;

          Request(switchOptions, function ( error, response, body ) {
            if( error ){
              console.log( 'WEMO-button: Request error.' );
            } else {
              console.log( `WEMO-button: ${ onFlag == '1' ? 'ON' : 'OFF' }` );
            }
          });

        } else {
          console.log( 'WEMO-button: Request error.' );
        }
      });
    }
  };
}());



// event
console.log( `WEMO-button: ${ dash_id }` );
WEMOButton.switch();