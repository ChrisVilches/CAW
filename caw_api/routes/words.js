const express = require('express');
const router = express.Router();
const Word = require('../models/word');
const axios = require('axios');
const R = require('ramda');

const JAPANESE_TOKENIZER_ENDPOINT = 'http://127.0.0.1:45678/important_words'; // TODO: .env

// Limit both full text char count, and individual words to be queried.
const TEXT_CHAR_LIMIT = 256;
const WORD_LIMIT = 10;

const limitWords = R.compose(
  R.take(WORD_LIMIT),
  R.uniq
);

router.get('/', async (req, res) => {
  let text = req.query.q || '';
  text = R.take(TEXT_CHAR_LIMIT, text);

  const tokenized = await axios.post(JAPANESE_TOKENIZER_ENDPOINT, { text });
  let wordsArray = limitWords(tokenized.data.result);

  const result = await Word.find({ word: { $in: wordsArray } });

  res.send(result);
});

module.exports = router;
