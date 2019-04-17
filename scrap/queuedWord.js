const mongoose = require('mongoose');

var Schema = mongoose.Schema;

var queuedWordSchema = new Schema({
	word:  {
		type: String,
		index: true,
    unique: true
	},
  locked: {
    type: Boolean,
    default: false
  },
	createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

queuedWordSchema.index({"createdAt": 1});

const QueuedWord = mongoose.model('QueuedWord', queuedWordSchema);

module.exports = QueuedWord;
