const DashButton  = require('node-dash-button');
const Mysql       = require('mysql');
const Http        = require('http');
const Querystring = require('querystring');

const BIND_IP      = '0.0.0.0';
const PORT         = 8888;

const MYSQL_HOST   = '127.0.0.1';
const MYSQL_USER   = 'root';
const SQL_PASSWORD = '';
const DATABASE     = 'button_listener';

var scripts = {};
var paths = {};
var button_listeners = [];


const buttonListen = function( params ) {
  let tmpFunc;
  eval( `tmpFunc = function( dash_id ){ ${params.script.replace(/\r?\n/g,'') }}` );
  eval( params.init_script.replace(/\r?\n/g,'') );

  if( scripts[params.mac_address] ) {
    scripts[params.mac_address].push( tmpFunc );
  } else {
    button_listener = DashButton( [params.mac_address], null, null, 'all' );
    
    button_listener.on( "detected", tmpFunc );
    button_listeners.push( button_listener );
  }
}


const buttonNew = function( data, res ) {
  var params = Querystring.parse( data );
  var connection = Mysql.createConnection({
    host     : MYSQL_HOST,
    user     : MYSQL_USER,
    password : SQL_PASSWORD,
    database : DATABASE,
  });

  connection.query( `INSERT INTO buttons (mac_address, owner) VALUES ( \
                    "${params.mac_address}", \
                    "${params.owner_name}") ON DUPLICATE KEY UPDATE mac_address = \
                    "${params.mac_address}"`,
                    function (error, results, fields) {
    buttonListen( params );
    connection.query( `INSERT INTO scripts (name, mac_address, init, body) VALUES ( \
                      "${params.script_name}", \
                      "${params.mac_address}", \
                      "${ new Buffer( params.init_script ).toString('base64') }", \
                      "${ new Buffer( params.script ).toString('base64') }" ) ON DUPLICATE KEY UPDATE name = \
                      "${params.script_name}"`,
                      function (error, results, fields) {
      res.writeHead( 200, { 'Content-Type': 'text/plain' } );
      res.end( params.mac_address + 'OK' );
    });
  });
}

// ボタン/スクリプト登録クライアント
paths['/'] = function( req, res ) {
  if ( req.method === 'GET' ) {
    res.writeHead( 200, { 'Content-Type': 'text/html' } );
    res.write( '\
      <html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"></head>\
        <body><form method="post">\
        ボタン/スクリプト登録フォーム<br>\
        <label>MAC Addess:</label><input type="text" name="mac_address" /><br>\
        <label>所有者名:</label><input type="text" name="owner_name" /><br>\
        <label>スクリプト名:</label><input type="text" name="script_name" /><br>\
        <label>初期化スクリプト:</label><textarea name="init_script"></textarea><br>\
        <label>スクリプト:</label><textarea name="script"></textarea><br>\
        <input type="submit" value="送信">\
      </form></body></html>\
    ' );
    res.end();
  } else if ( req.method === 'POST' ) {
    var data = '';
    req.on( 'data', function( chunk ) { data += chunk; } );
    req.on( 'end', function() {
      buttonNew( data, res );
    });
  }
}


var connection   = Mysql.createConnection({
  host     : MYSQL_HOST,
  user     : MYSQL_USER,
  password : SQL_PASSWORD,
  database : DATABASE,
});
connection.connect( function( err ) {
  if (err) {
    console.error('MySQL connection faild: ' + err.stack);
    return;
  }
});
connection.query('SELECT * FROM buttons INNER JOIN scripts ON scripts.mac_address=buttons.mac_address;', function (error, buttons, fields) {
  var macAddresses = [];
  for( var i in buttons ) {
    macAddresses.push( buttons[i]['mac_address'] );

    let tmpFunc;
    eval( `tmpFunc = function( dash_id ){ ${ new Buffer( buttons[i]['body'], 'base64' ).toString().replace(/\r?\n/g,'') }}` );
    eval( new Buffer( buttons[i]['init'], 'base64' ).toString().replace(/\r?\n/g,'') );
    tmpFunc.toString();

    if( scripts[buttons[i]['mac_address']] ) {
      scripts[buttons[i]['mac_address']].push( tmpFunc );
    } else {
      scripts[buttons[i]['mac_address']] = [ tmpFunc ];
    }
  };

  button_listener = DashButton( macAddresses, null, null, 'all' );
  button_listener.on( "detected", function ( dash_id ){
    for( var i in scripts[dash_id] ) {
      scripts[dash_id][i]( dash_id );
    }
  });

  button_listeners.push( button_listener );
  console.log('server start.');
});

// Web server
Http.createServer(function ( req, res ) {
  if( paths[req.url] ){
    paths[req.url]( req, res );
  }
}).listen( PORT, BIND_IP );


/*
  CREATE DATABASE button_listener;
  USE button_listener;
  CREATE TABLE buttons ( mac_address char(17) UNIQUE, owner text );
  CREATE TABLE scripts ( name varchar(255) UNIQUE, mac_address char(17), init text, body text );

  CREATE DATABASE attendance_button;
  USE attendance_button;
  CREATE TABLE buttons ( mac_address char(17) UNIQUE, employee_id char(6), password char(12), pb_mail text, pb_token char(34) );
*/