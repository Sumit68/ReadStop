const mongoose = require('mongoose');
const fs = require('fs');
const dotenv = require('dotenv');
const Book = require('../models/bookmodel');

dotenv.config({ path: './config.env' });
const DB = process.env.DATABASE.replace(
  '<password>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log('DB connection successful!'));

const books = JSON.parse(
  fs.readFileSync(`${__dirname}/book-data.json`, 'utf-8')
);

console.log(books);
const importdata = async () => {
  try {
    await Book.create(books);
    console.log('Data added successfully');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

const deletedata = async () => {
  try {
    await Book.deleteMany();
    console.log('Data deleted successfully');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

console.log(process.argv);
if (process.argv[2] === '--import') {
  importdata();
} else if (process.argv[2] === '--delete') {
  deletedata();
}
