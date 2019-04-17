const fs = require('fs');
const mongoose = require('mongoose');
const Word = require('../word');
const QueuedWord = require('../queuedWord');
const util = require('../util');

mongoose.connect('mongodb://127.0.0.1:27017');

async function cleanAlreadyScraped(){
  let allQueue = await QueuedWord.find({});
  let duplicateCount = 0;

  let wordCount = await Word.count({});

  for(let i=0; i<allQueue.length; i++){

    if(i % 2000 == 0){
      console.log("Progress:", ((i/allQueue.length)*100) + "%");
    }

    let found = await Word.findOne({ word: allQueue[i].word });

    if(found != null){
      duplicateCount++;

      console.log(`Already scraped word found in queue (${found.word}), it was added to Queue and Word collection with a time distance of ${Math.abs(found.createdAt - allQueue[i].createdAt)} ms. (${found.createdAt} and ${allQueue[i].createdAt})`);

      await Word.deleteMany({ word: allQueue[i].word });
    }
  }

  let newQueueCount = await QueuedWord.count({});

  console.log(`Queue total count: ${allQueue.length}, duplicates: ${duplicateCount}`);
  console.log("New queue count:", newQueueCount);
  console.log(`Word total count: ${wordCount} → ${await Word.count({})}`);
}

async function unlockAll(){
  let lockedCount1 = await QueuedWord.count({ locked: true });
  await QueuedWord.updateMany({ locked: true }, { locked: false });
  let lockedCount2 = await QueuedWord.count({ locked: true });
  console.log(`There were ${lockedCount1} locked words, and now there are ${lockedCount2}.`);
}



async function main(){

  console.log("------------------------------------------------------");
  console.log("(Now it deletes from Word, so it can be added again freshly) Remove from queue all words that are already scraped. (I'm not sure→) Sometimes, words that are about to be removed (by the scraper itself) are removed (concurrency problems)");
  console.log("------------------------------------------------------");
  await cleanAlreadyScraped();

  console.log("------------------------------------------------------");
  console.log("Unlock words from the queue so they can be grabbed by a scraping process again");
  console.log("This will unlock words that are being processed by scraping processes, meaning they might be grabbed again and added (causing a dup key error), but database integrity will be kept (i.e. there won't be duplicates)");
  console.log("------------------------------------------------------");
  await unlockAll();

  console.log("Fin");

  process.exit();

}


main();
