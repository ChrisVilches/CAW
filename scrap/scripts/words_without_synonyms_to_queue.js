const fs = require('fs');
const mongoose = require('mongoose');
const Word = require('../word');
const QueuedWord = require('../queuedWord');
const util = require('../util');

mongoose.connect('mongodb://127.0.0.1:27017');

async function backToQueue(){

  let noContent = await Word.find({
    synonyms: { $exists: true, $size: 0 }
  });

  let prevWordCount = await Word.count({});
  let prevQueueCount = await QueuedWord.count({});


  for(let i=0; i<noContent.length; i++){

    let word = noContent[i].word;

    let newQueuedWord = new QueuedWord({ word: word });
    await newQueuedWord.save();
    let updated = await QueuedWord.findOneAndUpdate({ word: word }, { createdAt: new Date("01-01-2011") });

    await Word.deleteOne({ word });

  }

  console.log(`Word count: ${prevWordCount} → ${(await Word.count({}))}`);
  console.log(`Queue count: ${prevQueueCount} → ${(await QueuedWord.count({}))}`);

  process.exit();

}

backToQueue();
