// db.js
import mongoose from 'mongoose';

const uri = 'your_mongodb_connection_string'; // Replace with your MongoDB connection string

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });

const personSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  // Add other fields as per your data structure
});

const Person = mongoose.model('Person', personSchema);

export default Person;