/* Summary
Meets Expectations:
- A Data folder is added if it does not exist.
- The scraper first get the urls for each shirt, and then scrapes each url
  individually.
- The information is added to the CSV file and added to the Data folder.
- The CSV is overwritten if the program run twice.
- A custom 404 message is added to the console.

Exceeds Expectations:
- You can start the app by using the "npm start" command.
- If an error occurs, the error message is added to the bottom of the
  "scraper-error" file.
*/

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const mkdirp = require('mkdirp');
const Json2csvParser = require('json2csv').Parser;
const urls = [];
const shirtArray = [];
const currentDate = getDate();
const currentTime = getTime();

// Checking if the folder does not exist, add a new one.
if (!fs.existsSync("./data")) {
  mkdirp('./data', function (err) {
    if (err) {
      errorFile(err);
    }
  });
}

// Find the shirt URLs on directory page
function getUrls() {
  axios.get("http://shirts4mike.com/shirts.php")
    .then((response) => {
      if(response.status === 200) {
        const html = response.data;
        const $ = cheerio.load(html);

        // Adding all urls to the url array
        $('.products').children().each(function(i, elem) {
          url = $(this).find('a').attr('href')
          urls.push(url);
        });
      }

      // Error in case the site is down
      if (response.status === 404){
        console.log("There’s been a 404 error. Cannot connect to http://shirts4mike.com. Please check your internet connection")
      }
      // Passing the urls to the getShirtInfo function
      getShirtInfo(urls)

    }).catch(function(err) {
      errorFile(err)
    });
}

// Find the shirt information on each shirt page
function getShirtInfo(array){
  array.forEach(function(i, elem){
    axios.get(`http://shirts4mike.com/${[i]}`)
      .then((response) => {
        if(response.status === 200) {
          const html = response.data;
          const $ = cheerio.load(html);

          // Making the objects and adding them to the array
          shirt = {
            "Title": $("#content h1").text().slice(4),
            "Price": $(".price").text(),
            "ImageURL": "http://shirts4mike.com/" + $("img").attr('src'),
            "URL": `http://shirts4mike.com/${[i]}`,
            "Time": `${currentDate} ${currentTime}`
          }
          shirtArray.push(shirt)
        }
      }).catch(function(err) {
        errorFile(err)
      });
  });

  // Waiting 1 second before saving the CSV file
  setTimeout(csvConverter, 1000);
};

// Running the getUrls function to start
getUrls()

// Convert the JSON to CSV and save the file
function csvConverter(){
  const fields = ['Title', 'Price', 'ImageURL', 'URL', 'Time'];
  const json2csvParser = new Json2csvParser({ fields });
  const csv = json2csvParser.parse(shirtArray);

  fs.writeFile(`data/${currentDate}.csv`, csv, function(err) {
    if (err) {
      errorFile(err)
    }
    console.log('Success - file saved!');
  });
}

// Time function
function getTime() {
  const d = new Date();
  const hours = d.getHours()
  const minutes = d.getMinutes()
  return `${hours}:${minutes}`;
}

// Date function
function getDate() {
  const d = new Date();
  const year = d.getFullYear()
  const month = d.getDate()
  const day = d.getDate()
  return `${year}-${month}-${day}`;
}

// Error message handler
function errorFile(message){
  let newError = `${currentDate} at ${currentTime}: ${message}` + "\n"

  fs.appendFile("scraper-error.log", newError, function(err) {
    if (err) {
      errorFile(err)
    }
    console.log('New error message - please look in the error log');
  });
}
