const fs = require('fs');
const mongoose = require('mongoose');
const Word = require('../word');
const QueuedWord = require('../queuedWord');
const util = require('../util');

mongoose.connect('mongodb://127.0.0.1:27017');

let fileName = process.argv[2];

if(typeof fileName === "undefined"){
  console.log("Needs a filename as parameter.");
  process.exit();
}

console.log("Filename:", fileName);


async function addQueueToBeginning(){

  var fs = require('fs');

  try {
    var array = fs.readFileSync(fileName).toString().split("\n")
    .map(el => el.trim())
    .filter(el => el.length > 0);

  } catch(e){
    console.log(e);
    process.exit();
  }

  let failed = 0;
  let success = 0;
  let alreadyAdded = 0;
  let alreadyQueuedCount = 0;
  let queueCount1 = await QueuedWord.count({});

  for(let i=0; i<array.length; i++){

    let word = array[i];

    if(await Word.findOne({ word })){
      alreadyAdded++;
      continue;
    }

    if(await QueuedWord.findOne({ word })){
      alreadyQueuedCount++;
    }

    await QueuedWord.deleteOne({ word: word });

    try{
      let newQueuedWord = new QueuedWord({ word: word });
      await newQueuedWord.save();
      let updated = await QueuedWord.findOneAndUpdate({ word: word }, { createdAt: new Date("01-11-2010") });
      success++;
    } catch(e){
      console.log(e);
      failed++;
    }

  }

  let queueCount2 = await QueuedWord.count({});

  console.log(`Added correctly: ${success}, already queued: ${alreadyQueuedCount} (it was readded again), failed adds: ${failed}, and ${alreadyAdded} are already added in Word collection`);
  console.log(`Queue count ${queueCount1} → ${queueCount2}`);

  process.exit();
}


console.log("------------------------------------------------------");
console.log("Add the words in the file to the beginning of the queue");
console.log("------------------------------------------------------");
addQueueToBeginning();
