import Person from './db.js'; // Import the Person model
import fs from 'fs';
import axios from 'axios';
import path from 'path';

const getRandomDelay = () => {
  return Math.floor(Math.random() * 2000) + 1000; // Random delay between 1000ms (1s) and 3000ms (3s)
};

const download = async () => {
  const people = await Person.find({});
  for (const person of people) {
    if (!person.extra_data.cv_path) {
      console.log(`[no-cv] person ID: ${person.id} as cv_path does not exist.`);
      continue;
    }
    if (person.cv_downloaded_path) {
      console.log(`[skip] person ID: ${person.id} - already downloaded.`);
    //  continue;
    }
    
    const peopleName = person.name.replace(/ /g, '_');
    const fileName =  `${person.id}_${peopleName}cv.pdf`
    const filePath = path.resolve('./downloads', fileName);
    if (fs.existsSync(filePath)) {
      console.log(`[skip] person ID: ${person.id} - already downloaded. updating field in db.`);
      person.cv_downloaded_path = fileName;
      await person.save();
      continue;
    }
    const url = person.extra_data.cv_path;
    const writer = fs.createWriteStream(filePath);

    try {
      const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
      });

      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      console.log(`[success] file for person ID: ${person.id} to ${filePath}`);

      // Update the database with the downloaded file path
      person.cv_downloaded_path = filePath;
      await person.save();

      // Random delay between 1 and 3 seconds
      await new Promise(resolve => setTimeout(resolve, getRandomDelay()));
    } catch (error) {
      console.error(`Failed to download file for person ID: ${person.id}. Error: ${error.message}`);
    }
  }
  console.log('[process] done');
}

download();
