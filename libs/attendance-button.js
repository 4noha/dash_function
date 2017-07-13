// ボタン/スクリプト登録クライアント
var AttendanceButton = (function() {
  var Mysql       = require('mysql');
  var Request     = require( 'request' );
  var Fs          = require( 'fs' );
  var Iconv       = require( 'iconv-lite' );
  var PushBullet  = require( 'pushbullet' );
  var Querystring = require( 'querystring' );

  var API_DOMAIN = '';

  var buttons = {};
  var connection = Mysql.createConnection({
    host     : MYSQL_HOST,
    user     : MYSQL_USER,
    password : SQL_PASSWORD,
    database : DATABASE,
  });

  var pushNewButton = function( params ) {
      buttons[ params.mac_address ] = {
      employee_id: params.employee_id,
      password: params.password,
      pb_mail: params.pb_mail,
      pb_token: params.pb_token
    }
  }
  
  
  var pbPush = function( error, response, body ) {
    var __OVERRIDE__;
    var pusher       = new PushBullet( pb_token );   
    
    if ( !error && response.statusCode == 200 ) {
      var buf    = new Buffer( body, 'binary' );
      var retStr = Iconv.decode( buf, "Shift_JIS" );

      var reMorning      = /今日も一日がんばりましょう！/;
      var reNight        = /お疲れ様でした。/;
      var reTimeSplitter = /<u> | <\/u>/;
      var recTime        = retStr.split( reTimeSplitter )[1];

      if ( reMorning.test( retStr ) ){
        pusher.note( pb_mail, '出勤', recTime, function( error, response ) {} );
        console.log( `ID:${ employee_id }  out:${ recTime }` );
        return;

      } else if ( reNight.test( retStr ) ) {
        pusher.note( pb_mail, '退勤', recTime, function( error, response ) {} );
        console.log( `ID:${ employee_id }  out:${ recTime }` );
        return;
      }
    }

    pusher.note( pb_mail, '勤怠エラー', 'error', function( error, response ) {} );
    console.log( `ID:${ employee_id }  error: response error.` );
  }

  
  var replaceFunc = function( func, replaceMethod ){
    var funcScript = func.toString();
    var funcMatches = funcScript.match(/function *([^\(]*)\((.*)\)( *)/);
    var funcSignature = funcMatches[2];
    var funcBody = RegExp.rightContext;
    var newScript = `var f = function(${ funcSignature }){${ replaceMethod( funcBody ) }};`;

    eval(newScript);
    return f;
  }


  var buttonNew = function( data, res ) {
    var params  = Querystring.parse( data );

    connection.query( `INSERT INTO employees (mac_address, employee_id, password, pb_mail, pb_token) VALUES ( \
                        "${ params.mac_address }", \
                        "${ params.employee_id }", \
                        "${ params.password }", \
                        "${ params.pb_mail }", \
                        "${ params.pb_token }" ) ON DUPLICATE KEY UPDATE mac_address = \
                        "${ params.mac_address }"`, function (error, results, fields) {
      pushNewButton( params );
      res.writeHead( 200, { 'Content-Type': 'text/plain' } );
      res.end( `${ params.mac_address }, ${ params.employee_id }, OK` );
    });
  }


  var attendance = function( mac_address ) {
    var cTime  = new Date();
    var button = buttons[mac_address];
    var options = { encoding: 'binary' };

    if( button ){
      if ( cTime.getHours() < 17 ) {
        options.url = `https://${ API_DOMAIN }/cws30/srwtimerec?dakoku=syussya&user_id=${ button.employee_id }&password=${ button.password }`;
      } else {
        options.url = `https://${ API_DOMAIN }/cws30/srwtimerec?dakoku=taisya&user_id=${ button.employee_id }&password=${ button.password }`;
      }

      Request.get( options,
        replaceFunc(
          pbPush,
          function(src){
            return src.replace(
              /__OVERRIDE__/,
              "employee_id='" + button.employee_id +
                "';var password='" + button.password +
                "';var pb_mail='" + button.pb_mail +
                "';var pb_token='" + button.pb_token + "'"
            );
        })
      );
    }
  }


  var load = function() {
    connection.connect( function( err ) {
      if (err) {
        console.error(`MySQL connection faild: ${ err.stack }`);
        return;
      }
    });
    connection.query('SELECT * FROM employees', function (error, results, fields) {
      for (var i in results) {
        buttons[ results[i].mac_address ] = {
          employee_id: results[i].employee_id,
          password: results[i].password,
          pb_mail: results[i].pb_mail,
          pb_token: results[i].pb_token
        }
      };
    });

    paths['/attendance'] = function( req, res ) {
      if ( req.method === 'GET' ) {
        res.writeHead( 200, { 'Content-Type': 'text/html' } );
        res.write( '\
          <html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"></head>\
            <body><form method="post">\
            出退勤ボタン登録フォーム<br>\
            <label>MAC Addess:</label><input type="text" name="mac_address" /><br>\
            <label>社員番号:</label><input type="text" name="employee_id" /><br>\
            <label>パスワード:</label><input type="text" name="password" /><br>\
            <label>PushBullet Mail:</label><input type="text" name="pb_mail" /><br>\
            <label>PB TOKEN:</label><input type="text" name="pb_token" /><br>\
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
  }

  return {
    buttonNew: buttonNew,
    attendance: attendance,
    load: load,
  };
}());
AttendanceButton.load();



// event
console.log( `attendance-button: ${dash_id}` );
AttendanceButton.attendance( dash_id );


/*
  USE button_listener;
  CREATE TABLE employees ( mac_address char(17) UNIQUE, employee_id char(6), password char(12), pb_mail text, pb_token char(34) );
*/