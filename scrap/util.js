function removeDuplicates(list){
	let set = new Set(list);
	return Array.from(set);
}

function wikiFilterCleanWords(array, omitWord){
	return removeDuplicates(array
	.map(x => x.trim())
	.map(x => x.split(/\（|\,|\、|\/|\(|\・/)[0])
	.filter(x => x != omitWord)
	.filter(x => x.length > 0));
}


module.exports = {
  removeDuplicates,
	wikiFilterCleanWords
};
