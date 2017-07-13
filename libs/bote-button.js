// init

// ボタン/スクリプト登録クライアント
var BoteButton = (function() {
  var Mysql       = require('mysql');
  var Querystring = require( 'querystring' );

  var connection = Mysql.createConnection({
    host     : MYSQL_HOST,
    user     : MYSQL_USER,
    password : SQL_PASSWORD,
    database : DATABASE,
  });
  
  var webInterface = function( req, res ) {
    if ( req.method === 'GET' ) {
      connection.query( 'SELECT * FROM bote_items',
                        function (error, results, fields) {

        res.writeHead( 200, { 'Content-Type': 'text/html' } );
        res.write( '\
          <html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"></head>\
            <table>\
              <tr>\
                <th>商品名</th><th>得票数</th><th>MAC Address</th>\
              </tr>\
        ');
        for( var i in results ) {
          res.write( `\
                <tr>\
                  <td>${results[i].name}</td>\
                  <td>${results[i].count}</td>\
                  <td>${results[i].mac_address}</td>\
                </tr>\
          `);
        };
        res.write( '\
            <table>\
            <br><br><br><br><br><br>\
            <body><form method="post">\
            投票ボタン登録フォーム<br>\
            <label>MAC Addess:</label><input type="text" name="mac_address" /><br>\
            <label>商品名:</label><input type="text" name="name" /><br>\
            <input type="submit" value="送信">\
          </form></body></html>\
        ' );
        res.end();
      });
    } else if ( req.method === 'POST' ) {
      var data = '';
      req.on( 'data', function( chunk ) { data += chunk; } );
      req.on( 'end', function() {
        var params = Querystring.parse( data );
        connection.query( `INSERT INTO bote_items (mac_address, name, count) VALUES (\
                          "${params.mac_address}", \
                          "${params.name}", 0) ON DUPLICATE KEY UPDATE mac_address = \
                          "${params.mac_address}"`,
                          function (error, results, fields) {
          res.writeHead( 200, { 'Content-Type': 'text/plain' } );
          res.end( `${params.mac_address} OK` );
        });
      });
    }
  }


  var bote = function( dash_id ) {
    connection.query( `UPDATE bote_items \
                        SET count = count + 1 \
                        WHERE mac_address="${ dash_id }"` );
  }



  return {
    webInterface: webInterface,
    bote: bote
  };
}());
paths['/bote'] = BoteButton.webInterface;

// event
console.log( `bote-button: ${ dash_id }` );
BoteButton.bote( dash_id );

/*
  USE button_listener;
  CREATE TABLE bote_items ( mac_address char(17) PRIMARY KEY, name varchar(255) UNIQUE, count int DEFAULT 0 );
*/
