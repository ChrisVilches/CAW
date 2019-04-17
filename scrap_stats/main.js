const fastify = require('fastify')({
  logger: true
});

const moment = require('moment');
const QueuedWord = require('./queuedWord');
const readline = require('readline');
const fs = require('fs');
const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017');

var Schema = mongoose.Schema;

var wordSchema = new Schema({
	word:  {
		type: String,
		index: true,
    unique: true
	},
	extra: [String],
	synonyms: [Object],
  wiki: [String]
}, {
  strict: false,
  timestamps: true
});

wordSchema.index({"createdAt": 1});

const Word = mongoose.model('Word', wordSchema);


/*
* 用例
* GET     http://localhost:3001/export
* GET     http://localhost:3001/ （統計情報）
* POST    http://localhost:3001/?fileName=data.db
* DELETE  http://localhost:3001/?secondsNow=58　（パソコン時間の秒数と同じじゃないと削除しない）
* GET     http://localhost:3001/find?word=思い
* GET     http://localhost:3001/no_extra_yet?p=20
*
*/


fastify.get('/export', async (request, reply) => {

  let timestamp = moment(new Date()).format('YYYY-MM-DD.HH.mm.ss');

  let fileName = `data.backup.${timestamp}.db`;

  let allWords = await Word.find({}).sort({ createdAt: 1 });

  var stream = fs.createWriteStream(fileName);

  stream.once('open', function(fd) {
    for(let i=0; i<allWords.length; i++){
      let word = allWords[i].toObject();
      delete word._id;
      delete word.__v;
      stream.write(JSON.stringify(word) + "\n");
    }
    stream.end();
  });

  reply.send({
    message: `File written: ${fileName}`,
    totalCount: allWords.length
  });

});

fastify.post('/', async (request, reply) => {

  if(typeof request.query.fileName === "undefined"){
    return reply.send({
      message: "Needs fileName param. (It'll read from the JS server directory)"
    });
  }

  const rl = readline.createInterface({
    input: fs.createReadStream(request.query.fileName),
    crlfDelay: Infinity
  });

  rl.on('line', (line) => {

    line = line.trim();

    if(line.length === 0) return;

    let json = JSON.parse(line);

    if(!json.hasOwnProperty("extra")){
      json.hasntGotExtraYet = true;
    }

    if(json.hasOwnProperty("$$indexCreated")) return;
    delete json._id;

    let word = new Word(json);

    word.save();
  });

  rl.on('close', async () => {
    let count = await Word.estimatedDocumentCount();
    setTimeout(function(){
      reply.send({
        message: "Bulk import completed",
        totalCount: count
      });
    }, 2000);
  });
});


fastify.delete('/', async (request, reply) => {

  if(request.query){

    let secondsNow = (new Date()).getSeconds();
    if(+request.query.secondsNow === secondsNow){

      await Word.deleteMany({});
      let count = await Word.estimatedDocumentCount();

      reply.send({
        message: "Deleted",
        count: count
      });
    }
  }

  reply.send({
    message: "Parameter secondsNow must be set, and be equal to the current seconds value in the PC clock."
  });

});



fastify.get('/', async (request, reply) => {

  let count = await Word.estimatedDocumentCount();
  let queueCount = await QueuedWord.estimatedDocumentCount();
  let queueLocked = await QueuedWord.find({ locked: true }).select({ word: 1 });
  let queueLockedCount = await QueuedWord.count({ locked: true });

  queueLocked = queueLocked.map(w => w.word);

  let extraButNoSynonymsQuery = {
    synonyms: { $exists: true, $size: 0 },
    extra: { $exists: true, $not: { $size: 0 } }
  };

  let latestWords = await Word.find({}).select({ word: 1 }).limit(5).sort({ createdAt: -1 });
  latestWords = latestWords.map(w => w.word);

  let noContentCount = await Word.count({
    synonyms: { $exists: true, $size: 0 },
    $and: [
      {
        $or: [
          { wiki: { $size: 0 } },
          { wiki: { $exists: true, $size: 0 } }
        ]
      },
      {
        $or: [
          { extra: { $size: 0 } },
          { extra: { $exists: true, $size: 0 } }
        ]
      }
    ]
  });

  let hasntGotExtraYetCount = await Word.count({
    hasntGotExtraYet: true
  });

  let extraButNoSynonymsCount = await Word.count(extraButNoSynonymsQuery);

  let extraButNoSynonymsTopFive = await Word.find(extraButNoSynonymsQuery)
  .select('word')
  .limit(5)
  .sort({ createdAt: -1 });

  let MS_PER_MINUTE = 60000;
  let minutesAgo = 10;
  let someTimeAgo = new Date(new Date() - (minutesAgo * MS_PER_MINUTE));

  let howManyWereAddedTheseFewMinutes = await Word.count({ createdAt: { $gt: someTimeAgo } });
  let wordsPerMinute = howManyWereAddedTheseFewMinutes/minutesAgo;

  let wordsOneMinAgo = await Word.count({ createdAt: { $gt: new Date(new Date() - (1 * MS_PER_MINUTE)) } });

  reply.send({
    totalWords: count,
    wordsWithoutContent: noContentCount,
    queueCount: queueCount,
    queueLockedCount: queueLockedCount,
    queueLocked: queueLocked,
    latestWords: latestWords,
    hasntGotExtraYetCount: hasntGotExtraYetCount,
    speed: `These past ${minutesAgo} minutes, ${howManyWereAddedTheseFewMinutes} words were added. Speed is ${wordsPerMinute} words per minute.`,
    wordsOneMinAgo: wordsOneMinAgo,
    extraButNoSynonyms: {
      topFive: extraButNoSynonymsTopFive,
      count: extraButNoSynonymsCount
    }
  });

});


fastify.get('/find', async (request, reply) => {

  fastify.log.info(`request ${request.query.word}. Date: ${new Date()}`);

  let word = await Word.findOne({ word: request.query.word })
  .limit(1);
  reply.send(word);
});


fastify.get('/no_extra_yet', async (request, reply) => {

  let p = 0;

  if(typeof request.query.p !== "undefined"){
    p = +request.query.p;
  }

  let word = await Word.find({ hasntGotExtraYet: true })
  .sort({ createdAt: 1 }).skip(p * 100).limit(100);
  reply.send(word);
});


// Run the server!
fastify.listen(3000, (err, address) => {
  if (err) throw err
  fastify.log.info(`server listening on ${address}`)
});
