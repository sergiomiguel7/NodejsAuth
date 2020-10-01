//running with nodemon to refresh  -> npm install -D nodemon

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');

require('dotenv').config(); //with this package with can use constants to the project with process.env.NAME

const app = express();

//declare here your routes
const middlewares = require('./auth/middlewearjwt');
const auth = require('./auth/index');

//Middleware
app.use(helmet()); // increase security
app.use(morgan('dev'));  //logs all the http request from the server
app.use(bodyParser.json());  //allow to post on json
app.use(cors()); //later especify the type of headers, and the types of crud operations allowed
app.use(middlewares.checkTokenSetUser);


//routes uses
app.use('/auth', auth);
//here you can use middlewares.isLoggendIn to auth the api routes
//Example  -> app.use('/clients', middlewares.isLoggedIn, clients);


app.get('/', (req, res, next) => {
    res.json({
        message: 'it works',
        user: req.user,
    });
});


function notFound(req, res, next) {
    res.status(404);
    const error = new Error('Not found -' + req.originalUrl);
    next(error);
}

function errorHandler(err, req, res, next) {
    res.status(res.statusCode || 500);
    res.json({
        message: err.message,
        stack: err.stack
    });
}

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server started on port ${port}`));