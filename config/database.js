const mongoose = require('mongoose');

const DB_URL = 'mongodb+srv://'+process.env.DB_USERNAME+':'+process.env.DB_PASSWORD+'@cluster0.lkbzv3j.mongodb.net/' + process.env.DB_NAME + '?retryWrites=true&w=majority';


let option = {
  useNewUrlParser: true,
  useUnifiedTopology: true
}

module.exports = () => {
  try {
     mongoose.connect(DB_URL, option);
    console.log('DB connected successfully');
  } catch (error) {
    console.error(error);
  }
}