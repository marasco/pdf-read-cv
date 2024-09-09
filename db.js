import mongoose from 'mongoose';

const uri = 'mongodb://127.0.0.1:27017/talently'; // Replace with your MongoDB connection string

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.error('MongoDB connection error:', err));

const personSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  age: Number,
  email: String,
  // Add other fields as per your data structure
  // For example:
  // role: String,
  // salary: Number,
  // etc.
}, { strict: false }); // Use strict: false to allow saving fields not defined in the schema

const Person = mongoose.model('Person', personSchema);

export default Person;