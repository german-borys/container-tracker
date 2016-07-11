var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    bcrypt = require('bcrypt-nodejs');

var ContainerSchema = new Schema({
  name: {
    type: String,
    required: true,
    index: { unique: true }
  },
  address: String,
  geolocation: String,
  description: String
});

module.exports = mongoose.model('Container', ContainerSchema);
