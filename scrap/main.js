const fs = require('fs');
const mongoose = require('mongoose');
const scrapper = require('./scrapper');
const Word = require('./word');
const QueuedWord = require('./queuedWord');
const request = require('request');
const util = require('./util');
mongoose.connect('mongodb://127.0.0.1:27017');

const POLL_SECONDS = 120;

async function createNewEntry(_word){

	_word = _word.trim();

	let { word, results, extra } = await scrapper.scrapWord(_word);

	let doc = {
		word: word,
		synonyms: results,
		extra: extra
	};

	let allSynonyms = [];

	for(let i=0; i<results.length; i++){
		allSynonyms = allSynonyms.concat(results[i].synonyms);
	}

	// Remove duplicates
	allSynonyms = util.removeDuplicates(allSynonyms);

	let wordDoc = new Word(doc);

	try{
		await wordDoc.save();
	} catch(e){
		console.log(e);
		console.log("Error when doing → await wordDoc.save();");
	}

	return {
		word,
		allSynonyms,
		extra
	};
}

function scrapWiki(keyword){

	if(keyword == null || keyword.length == 0){
		throw new Error("Keyword is empty or null");
	}

	return new Promise(function(resolve){

		let url = "https://ja.wikipedia.org/w/api.php?action=opensearch&format=json&formatversion=2&search="+ encodeURI(keyword) +"&namespace=0&limit=10&suggest=true";
		let addedWiki = 0;
		let failedWiki = 0;
		let skippedWiki = 0;
		let wikiTexts = [];

		request(url, async function (error, response, body) {
			if(error){
				console.log(error);
				console.log("Exit wiki");
				process.exit();
			}

			body = JSON.parse(body);

			if(body.hasOwnProperty('error') && body.error.code === 'nosearch'){
				console.log("Wiki error, code 'nosearch'. Word → " + keyword);
				process.exit();
				/*return resolve({
					addedWiki, failedWiki, skippedWiki, wikiTexts
				});*/
			}

			wikiTexts = body[2];

			let relatedWords = null;

			try {
				relatedWords = util.wikiFilterCleanWords(body[1], keyword);
			} catch(e){

				console.log("Using wikiFilterCleanWords causes this error");
				console.log("word (length " + keyword.length + "): " + keyword);
				console.log("body content:");
				console.log(body);
				console.log("body[1]:");
				console.log(body[1]);
				process.exit();

			}

			for(let i=0; i<relatedWords.length; i++){
				let word = relatedWords[i].trim();

				let foundInWord = (await Word.findOne({ word })) != null;
				let foundInQueue = (await QueuedWord.findOne({ word })) != null;

				if(!foundInWord && !foundInQueue){
					try {
						let newQueueWord = new QueuedWord({ word });
						await newQueueWord.save();
						addedWiki++;
					} catch(e){
						failedWiki++;
					}
				} else {
					skippedWiki++;
				}
			}

			resolve({
				addedWiki, failedWiki, skippedWiki, wikiTexts
			});
		});
	});
}


function waitMs(ms){
	return new Promise(function(resolve){
		let timeout = setTimeout(function(){ resolve(); }, ms * 1000);
	});
}

async function iterate(n = 0){

	let queueWord = null;
	let word = null;
	let wordBeforeTrimming = null;

	while(true){
		queueWord = await QueuedWord.findOneAndUpdate({ locked: false }, { $set: { locked: true } }).sort({ createdAt: 1 });

		wordBeforeTrimming = queueWord.word;

		if(queueWord == null || queueWord.word.trim().length === 0){
			console.log("Polling for new queue words.");
			await waitMs(POLL_SECONDS);
		} else {
			word = queueWord.word.trim();
			break;
		}
	}


	let wikiResults = {};

	word = word.trim();

	let allSynonyms = 0;
	let extra = [];

	let alreadyAddedFlag = (await Word.findOne({ word: word })) !== null;
	let addedToQueue = 0;
	let alreadyInQueueCount = 0;
	let failAddQueue = 0;
	let wordAlreadyAddedCount = 0;
	let wikiTexts = [];



	if(!alreadyAddedFlag){
		let result = await createNewEntry(word);

		try{
			wikiResults = await scrapWiki(word);
		} catch(e){
			console.log(e);
			console.log("WIKI FAIL");
		}

		wikiTexts = wikiResults.wikiTexts
		.map(x => x.trim())
		.filter(x => x.length > 0);


		let updated = await Word.findOneAndUpdate({ word }, { $set: { wiki: wikiTexts } });

		allSynonyms = result.allSynonyms;
		extra = result.extra;

		for(let i=0; i<allSynonyms.length; i++){
			let newQueueWord = new QueuedWord({ word: allSynonyms[i] });

			let alreadyScraped = await Word.findOne({ word: allSynonyms[i] });

			if(alreadyScraped != null){
				wordAlreadyAddedCount++;
				continue;
			}

			let alreadyInQueue = await QueuedWord.findOne({ word: allSynonyms[i] });

			if(alreadyInQueue != null){
				alreadyInQueueCount++;
				continue;
			}

			try{
				await newQueueWord.save();
				addedToQueue++;
			} catch(e){
				failAddQueue++;
			}
		}

	}

	try{
		await QueuedWord.deleteOne({
			$or: [
				{
					word: word
				},
				{
					word: wordBeforeTrimming
				}
			]
		});
	} catch(e){
		console.log(e);
		console.log("Couldn't delete word from Queue after adding it to the word collection.");
	}

	console.log(`---------------------------- `);
	console.log(`--- #${n} ${word}`);
	console.log(`---------------------------- `);
	if(alreadyAddedFlag){
		console.log(`${word} is already stored.`);
	} else {
		console.log("基本情報");
		console.log("\tSynonyms:", allSynonyms.length);
		console.log("\tExtras:", extra.length);
		console.log("キューに追加された単語");
		console.log(`\tAdded: ${addedToQueue}`);
		console.log(`\tAlready queued: ${alreadyInQueueCount}`);
		console.log(`\tAlready in Words: ${wordAlreadyAddedCount}`);
		console.log(`\tFailed: ${failAddQueue}`);
		console.log(`Wikipediaの検索結果`);
		console.log(`\tTexts (${wikiTexts.length})`);
		console.log(`\tAdded (${wikiResults.addedWiki})`);
		console.log(`\tFailed (${wikiResults.failedWiki})`);
		console.log(`\tSkipped (${wikiResults.skippedWiki})`);
	}
	console.log();



	iterate(n+1);

}


iterate();
