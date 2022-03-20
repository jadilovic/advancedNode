'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const mongoDB = require('mongodb').ObjectID;
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');
const routes = require('./routes');
const auth = require('./auth');

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const MongoStore = require('connect-mongo')(session);
const URI = process.env.MONGO_URI;
const store = new MongoStore({ url: URI });
const passportSocketIo = require('passport.socketio');
const cookieParser = require('cookie-parser');
app.set('view engine', 'pug');

app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: true,
		saveUninitialized: true,
		cookie: { secure: false },
	})
);

app.use(passport.initialize());
app.use(passport.session());

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

io.use(
	passportSocketIo.authorize({
		cookieParser: cookieParser,
		key: 'express.sid',
		secret: process.env.SESSION_SECRET,
		store: store,
		success: onAuthorizeSuccess,
		fail: onAuthorizeFail,
	})
);

myDB(async (client) => {
	const myDataBase = await client.db('database').collection('users');

	routes(app, myDataBase);
	auth(app, myDataBase);
	let currentUsers = 0;
	io.on('connection', (socket) => {
		++currentUsers;
		io.emit('user count', currentUsers);
		console.log('A user has connected');
		socket.on('disconnect', () => {
			/*anything you want to do on disconnect*/
			--currentUsers;
			io.emit('user count', currentUsers);
		});
		console.log('user ' + socket.request.user.name + ' connected');
	});
}).catch((e) => {
	app.route('/').get((req, res) => {
		res.render('pug', { title: e, message: 'Unable to login' });
	});
});

function onAuthorizeSuccess(data, accept) {
	console.log('successful connection to socket.io');

	accept(null, true);
}

function onAuthorizeFail(data, message, error, accept) {
	if (error) throw new Error(message);
	console.log('failed connection to socket.io:', message);
	accept(null, false);
}

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
	console.log('Listening on port ' + process.env.PORT);
});
