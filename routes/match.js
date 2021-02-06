var express = require('express');
const { exists } = require('fs');
var router = express.Router();
var utils = require('../utils/utils.js')
var database = require('../db/matchdb')
var pdatabase = require('../db/playerdb')

 
router.get('/', function(req, res, next) {
});