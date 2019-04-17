const fs = require('fs');
const mongoose = require('mongoose');
const request = require('request');
const Word = require('../word');
const { from, Subject } = require('rxjs');
const { map, concatMap } = require('rxjs/operators');
const QueuedWord = require('../queuedWord');
const readline = require('readline');
const util = require('../util');

mongoose.connect('mongodb://127.0.0.1:27017');

let allWords = null;
let wordSet = new Set();

let subject = new Subject();

let n = 1;

let queue$ = from(subject).pipe(

  map(text => {
    console.log("キューに追加...", text.substr(0, 15) + "...");
    return text;
  }),

  concatMap(text => {
    console.log(`#${n++} 開始中...`, text.substr(0, 15) + "...");
    return tokenizeAndQueue(text);
  })
);

queue$.subscribe(ret => {
  console.log(`追加された (${ret.added}), スキップされた (${ret.skipped})`);
});

function tokenizeAndQueue(text){

  let options = {
    url: "http://localhost:9200/library/_analyze",
    method: 'GET',
    json: {
      "tokenizer": "kuromoji_tokenizer",
      "text": text
    }
  };

  return new Promise(function(resolve){

    request(options, async function (error, response, body) {
      if(error){
        console.log(error);
        process.exit();
      }

      body = body.tokens.map(t => t.token);
      body = util.removeDuplicates(body);

      let skipped = 0;
      let added = 0;

      allWords.map(w => {
        wordSet.add(w.word);
      });

      for(let i=0; i<body.length; i++){

        let word = body[i];

        if(wordSet.has(word)){
          skipped++;
          continue;
        }

        try{
          let newQueueWord = new QueuedWord({ word });
          await newQueueWord.save();
          added++;
        }catch(e){
          skipped++;
        }
      }

      resolve({
        added,
        skipped
      });
    });
  });
}


async function main(){

  allWords = await Word.find({}).select({ word: 1 });

  console.log("文書を入力してください");

  let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  rl.on('line', function(line){

    line = line.trim();

    if(line.length === 0) return;

    subject.next(line);
  });

}


main();
