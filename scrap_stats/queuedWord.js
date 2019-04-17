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
  }
}, {
  timestamps: true
});

queuedWordSchema.index({"createdAt": 1});

const QueuedWord = mongoose.model('QueuedWord', queuedWordSchema);

module.exports = QueuedWord;
