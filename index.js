import fetch from 'node-fetch';
import Person from './db.js'; // Import the Person model
const firstPage = parseInt(process.argv[2], 10) || 1;
const baseUrl = 'https://hub-admin.talently.tech/api/v4/hire/candidates';
const params = {
  role_id: 4, 
  vetting: 1, 
  min_salary: 2000,
  max_salary: 7000,
  initial: 0,
  country: 'Argentina',
  work_offer_id: 23321,
  page: 1
};

const options = {
  method: 'GET',
  headers: {
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'es-ES,es;q=0.9,en;q=0.8,pt;q=0.7,gl;q=0.6,fr;q=0.5',
    'authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vaHViLWFkbWluLnRhbGVudGx5LnRlY2gvYXBpL3YzL2hpcmUvYXV0aC9sb2dpbiIsImlhdCI6MTcyNDg1MTk5MiwiZXhwIjoxNzI3NDc5OTkyLCJuYmYiOjE3MjQ4NTE5OTIsImp0aSI6IjBaOG5yWGFCRHJEWWlZWlciLCJzdWIiOjQwNTgsInBydiI6ImQxMGVmZmQ0Y2M1NWQ0MDllN2NmYTExODZkOWQ5ZTY3MDFkN2JhNDYifQ.I8z8ZgxHaZR8jt_iadiXK9pZwGGOgejPZLXSOk6bWws',
    'cache-control': 'no-cache',
    'lang': 'es',
    'origin': 'https://hire.talently.tech',
    'pragma': 'no-cache',
    'priority': 'u=1, i',
    'referer': 'https://hire.talently.tech/',
    'sec-ch-ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-site',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  }
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fetchCandidateDetails = async (candidateId) => {
  const candidateUrl = `https://hub-admin.talently.tech/api/v4/hire/candidate/${candidateId}?work_offer_id=${params.work_offer_id}&role_id=${params.role_id}`;
  try {
    const response = await fetch(candidateUrl, options);
    const data = await response.json();
    return data.result.match_user;
  } catch (error) {
    console.error(`Error fetching details for candidate ${candidateId}:`, error);
    return null;
  }
};

const fetchPage = async (page) => {
  params.page = page;
  const url = `${baseUrl}?stacks\[\]=14&stacks\[\]=708&stacks\[\]=14&stacks\[\]=86&vetting=1&english_proficiency_ids\[\]=3&${new URLSearchParams(params).toString()}`;
  console.log(url);
  try {
    console.log('fetching...')
    const response = await fetch(url, options);
    const data = await response.json();

    if (!data.result || !data.result.data) {
      console.error('No data found or error in response');
      return false;
    }

    for (const item of data.result.data) {
      try {
        // Check if the name already exists in the database
        const existingPerson = await Person.findOne({ name: item.name });
        if (existingPerson) {
          console.log(`Skipping: ${item.name} already exists in the database`);
          continue;
        }

        await delay(getRandomDelay(1, 2)); 
        const extraData = await fetchCandidateDetails(item.id);
        await Person.updateOne(
          { name: item.name }, // Assuming 'name' is the unique field
          { $set: { ...item, extra_data: extraData } },
          { upsert: true } // Create a new document if no match is found
        );
        console.log(`Saved/Updated: ${item.name} from ${item.country}`);

      } catch (error) {
        console.error(`Error saving ${item.name}:`, error);
      }
    }

    return data.result.data.length > 0; // Return true if there are more results
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
};
const getRandomDelay = (minx, maxx) => {
  const min = minx * 1000; // 5 seconds
  const max = maxx * 1000; // 15 seconds
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
const fetchAllPages = async () => {
  let hasMore = true;
  let page = firstPage;

  while (hasMore) {
    console.log(`Fetching page ${page}`);
    hasMore = await fetchPage(page);
    if (!hasMore) break;
    page++;
    await delay(getRandomDelay(1, 3)); // Wait for 10 seconds before fetching the next page
  }
};

fetchAllPages();