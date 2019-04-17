const fs = require('fs');
const mongoose = require('mongoose');
const Word = require('../word');
const QueuedWord = require('../queuedWord');
const util = require('../util');

mongoose.connect('mongodb://127.0.0.1:27017');

async function addSynonymsToQueue(){

  let queueCount1 = await QueuedWord.count({});
  let skipped = 0;
  let added = 0;

  let alreadyAddedWords = new Set();

  let allWords = await Word.find({}).select({ word: 1, synonyms: 1 });

  for(let i=0; i<allWords.length; i++){
    alreadyAddedWords.add(allWords[i].word);
  }

  for(let i=0; i<allWords.length; i++){

    if(i%1000 === 0){
      console.log(`完成 ${(i/allWords.length) * 100}%`);
    }

    let allSynonyms = [];

    for(let j=0; j<allWords[i].synonyms.length; j++){
      allSynonyms = allSynonyms.concat(allWords[i].synonyms[j].synonyms);
      allSynonyms = util.removeDuplicates(allSynonyms);
    }

    for(let j=0; j<allSynonyms.length; j++){

      let word = allSynonyms[j].trim();

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
