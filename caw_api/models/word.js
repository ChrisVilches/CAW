const mongoose = require('mongoose');

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
  timestamps: true
});

wordSchema.index({"createdAt": 1});

const Word = mongoose.model('Word', wordSchema);

module.exports = Word;
