import fetch from 'node-fetch';
import Person from './db.js'; // Import the Person model

const baseUrl = 'https://hub-admin.talently.tech/api/v4/hire/candidates';
const params = {
  role_id: 2,
  stacks: [51],
  vetting: 1,
  english_proficiency_ids: [3],
  min_salary: 2000,
  max_salary: 5000,
  initial: 0,
  work_offer_id: 23321,
  page: 1 // Start with page 1
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

const fetchPage = async (page) => {
  params.page = page;
  const url = `${baseUrl}?${new URLSearchParams(params).toString()}`;

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!data.result || !data.result.data) {
      console.error('No data found or error in response');
      return false;
    }

    for (const item of data.result.data) {
      try {
        await Person.updateOne(
          { name: item.name }, // Assuming 'name' is the unique field
          { $set: item },
          { upsert: true } // Create a new document if no match is found
        );
        console.log(`Saved/Updated: ${item.name}`);
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

const fetchAllPages = async () => {
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    console.log(`Fetching page ${page}`);
    hasMore = await fetchPage(page);
    if (!hasMore) break;
    page++;
    await delay(10000); // Wait for 10 seconds before fetching the next page
  }
};

fetchAllPages();