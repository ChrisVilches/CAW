var express = require('express');
var router = express.Router();
var Word = require('../models/word');
const axios = require('axios');

const JAPANESE_TOKENIZER_ENDPOINT = 'http://127.0.0.1:45678/important_words'; // TODO: .env

// Limit both full text char count, and individual words to be queried.
const TEXT_CHAR_LIMIT = 256;
const WORD_LIMIT = 10;

const stringTake = (string, n) => {
  return string.substr(0, n);
}

const arrayTake = (array, n) => {
  return array.slice(0, n);
};

router.get('/', async (req, res) => {
  let text = req.query.q || '';
  text = stringTake(text, TEXT_CHAR_LIMIT);

  const tokenized = await axios.post(JAPANESE_TOKENIZER_ENDPOINT, { text });
  let wordsArray = tokenized.data.result;
  wordsArray = arrayTake(wordsArray, WORD_LIMIT);

  const result = await Word.find({ word: { $in: wordsArray } });

  res.send(result);
});

module.exports = router;
