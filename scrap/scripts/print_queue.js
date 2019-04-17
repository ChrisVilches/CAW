const fs = require('fs');
const mongoose = require('mongoose');
const Word = require('../word');
const QueuedWord = require('../queuedWord');
const util = require('../util');

mongoose.connect('mongodb://127.0.0.1:27017');

async function print(){

  let all = await QueuedWord.find({}).sort({ createdAt: 1 });

  for(let i=0; i<all.length; i++){
    console.log(all[i].word);
  }

  process.exit();

}

print();
