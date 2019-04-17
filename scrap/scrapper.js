const request = require('request');
const cheerio = require('cheerio');
const http = require('http');
const util = require('./util');

function scrapWordAux(html){

	let $ = cheerio.load(html);

	let $sections = $(".kijiWrp, .Wrugj");

	let allResults = [];

	let extra = [];

	$sections.each(function(i, elem){

		//let sectionWord = $(this).find(".midashigo").text();

		// If for some reason the section title is different from the word I want to scrap, then don't do it.
		//if(sectionWord !== word) return;

		let 意義素 = [];

		let 類語 = [];

		// All values in the left column (word meaning)
		$(this).find(".nwntsL").each(function(i, elem){
			意義素.push($(this).text());
		});

		// All values in the right column (word synonyms)
		$(this).find(".nwntsR").each(function(i, elem){
			類語.push($(this).text());
		});

		意義素.shift();
		類語.shift();

		let addedHere = false;

		// Similar for another type of table
		$(this).find(".wrugjL").each(function(i, elem){
			意義素.push($(this).text());
			addedHere = true;
		});

		$(this).find(".wrugjR").each(function(i, elem){
			類語.push($(this).text());
			addedHere = true;
		});

		if(addedHere){
			意義素.shift();
			類語.shift();
		}


		let sectionExtra = [];

		if($(this).has(".Wrigo")){
			$(this).find(".thesaurusComment").remove();
			sectionExtra = $(this).find(".Wrigo").first().text();
			sectionExtra = sectionExtra.split("、")
			.filter(e => e.length > 0)
			.map(e => e.trim());
			extra = extra.concat(sectionExtra);
		}


		if($(this).hasClass("Wrugj") && $(this).find("table").length === 0){
			$(this).find(".thesaurusComment").remove();

			sectionExtra = $(this).text();

			sectionExtra = sectionExtra.split(/、|・/)
			.map(e => e.trim())
			.filter(e => e.length > 0);
			extra = extra.concat(sectionExtra);
		}


		// Re-arrange results
		let sectionResult = [];

		for(let i=0; i<意義素.length; i++){

			let synonyms = new Set(類語[i].split(" ・ ").map(w => w.trim()).filter(w => w.length > 0));

			let found = allResults.find(function(element) {
				return element.meaning == 意義素[i];
			});

			if(!found){
				sectionResult.push({
					meaning: 意義素[i],
					synonyms: Array.from(synonyms)
				});
			}


		}

		allResults = allResults.concat(sectionResult);


	});

	extra = util.removeDuplicates(extra);

	return {
		results: allResults, extra
	};

}

function scrapWord(word){

	let url = "https://thesaurus.weblio.jp/content/" + encodeURI(word);

	return new Promise(function(resolve){

		request(url, function (error, response, body) {
			if(error){
				console.log(error);
				process.exit();
			}

			let result = scrapWordAux(body);
			result.word = word;
			resolve(result);

		});
	});

}

module.exports = {
  scrapWord,
	scrapWordAux
};
