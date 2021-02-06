var express = require('express');
var logger = require('morgan'); // debug
var app = express();
app.use(logger('dev')); // debug

// setup and establish database 
var db = require('./db/database');
var settings = require('./utils/settings')

//setup routes
var apiRouter = require('./routes/api');
var adminRouter = require('./routes/admin');

app.use('/api', apiRouter);
app.use('/admin', adminRouter);

// handle errors and forward to error handler
app.get('*', function(req, res, next) {
  var err = new error("INVALID REQUEST");
  next(error);
});

app.get('/', function(req, res, next) {
  var err = new error("INVALID REQUEST");
  next(error);
});

app.use((err, req, res, next) => {
  res.json({
    result: false,
    message: err.message,
  });
});


module.exports = app;