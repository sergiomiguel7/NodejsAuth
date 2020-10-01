const mysql = require('mysql');

//to acess require this module and after connection.con.query ...

// when app entry to tests		
 module.exports = {
	con: mysql.createPool({
		host     : process.env.HOST,
		user     : process.env.USER,
		password : process.env.PASSWORD,
		database : process.env.DATABASE
	})
}; 
