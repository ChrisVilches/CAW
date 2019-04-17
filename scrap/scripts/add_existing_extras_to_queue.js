const fs = require('fs');
const mongoose = require('mongoose');
const Word = require('../word');
const QueuedWord = require('../queuedWord');
const util = require('../util');
const XRegExp = require('xregexp');

mongoose.connect('mongodb://127.0.0.1:27017');

const hasAtLeastOneKanji = XRegExp('^.*[\\p{Han}]+.*$');
const onlyJapaneseLetters = XRegExp('^[\\p{Han}\\p{Katakana}\\p{Hiragana}]+$');

function filter(word){
  if(!hasAtLeastOneKanji.test(word)) return false;
  if(!onlyJapaneseLetters.test(word)) return false;
  return true;
}

console.assert(filter('Русский') == false);
console.assert(filter('asdfg') == false);
console.assert(filter('漢字ひらがなカタカナa') == false);
console.assert(filter('漢字ひらがなカタカナ') == true);
console.assert(filter('漢字ひらがな') == true);
console.assert(filter('漢字') == true);
console.assert(filter('ひらタカ') == false);
console.assert(filter('タカ') == false);
console.assert(filter('ひら') == false);
console.assert(filter('タカ語') == true);
console.assert(filter('ひ語ら') == true);
console.assert(filter('タカ語a') == false);
console.assert(filter('aひ語ら') == false);
console.assert(filter('タaカ語') == false);
console.assert(filter('ひ語aら') == false);


async function addSynonymsToQueue(){

  let queueCount1 = await QueuedWord.count({});
  let skipped = 0;
  let added = 0;

  let alreadyAddedWords = new Set();

  let allWords = await Word.find({}).select({ word: 1, extra: 1 });

  for(let i=0; i<allWords.length; i++){
    alreadyAddedWords.add(allWords[i].word.trim());
  }

  for(let i=0; i<allWords.length; i++){

    if(i%1000 === 0){
      console.log(`完成 ${(i/allWords.length) * 100}%`);
    }

    let filteredWords = [];

    for(let j=0; j<allWords[i].extra.length; j++){

      let extraWord = allWords[i].extra[j].trim();

      if(filter(extraWord)){
        filteredWords.push(extraWord);
      }

    }

    for(let j=0; j<filteredWords.length; j++){

      let word = filteredWords[j];

      if(word.length === 0) continue;

      if(alreadyAddedWords.has(word)){
        skipped++;
        continue;
      }

      let newQueueWord = new QueuedWord({ word });

      try {
        await newQueueWord.save();
        added++;
        alreadyAddedWords.add(word);
      } catch(e){
        skipped++;
      }
    }
  }


  let queueCount2 = await QueuedWord.count({});

  console.log(`Queue count ${queueCount1} → ${queueCount2}. Added (${added}), skipped (${skipped})`);

  process.exit();

}


addSynonymsToQueue();
