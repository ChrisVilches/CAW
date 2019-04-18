var express = require('express');
var router = express.Router();
var Word = require('../models/word');

router.get('/', async (req, res) => {

  wordsArray = req.query.q.split(",");

  let word = await Word.find({ word: { $in: wordsArray } });

  res.send(word);
});

module.exports = router;
