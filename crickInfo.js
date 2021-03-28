const cheerio = require('cheerio');
const request = require('request');
const fs = require('fs');
const path = require('path');
const iplFolderName = 'ipl_2020';

const url =
  'https://www.espncricinfo.com/series/ipl-2020-21-1210595/match-results';

request(url, function (err, response, html) {
  if (err) {
    console.log(err);
  } else {
    allMatches(html);
  }
});

function allMatches(html) {
  let selTool = cheerio.load(html);
  let allMatches = selTool('.match-info-link-FIXTURES'); // anchor tag of all matches( ie 60!)
  iplDirectory();
  for (let i = 0; i < allMatches.length; i++) {
    let matchLink = selTool(allMatches[i]).attr('href');
    let fullLink = 'https://www.espncricinfo.com' + matchLink;
    matchLinks(fullLink);
  }
}

function matchLinks(fullLink) {
  request(fullLink, function (err, response, html) {
    if (err) {
      console.log(err);
    } else {
      allMatchLinks(html);
    }
  });
}

function allMatchLinks(html) {
  let selTool = cheerio.load(html);
  let bothTeams = selTool('.name-link .name');
  let team1_Name = selTool(bothTeams[0]).text();
  let team2_Name = selTool(bothTeams[1]).text();
  createDirectory(team1_Name);
  createDirectory(team2_Name);
  let batsmenContainer = selTool('.table.batsman');
  for (let i = 0; i < batsmenContainer.length; i++) {
    let currentTeam_batsmen = selTool(batsmenContainer[i]).find('tbody tr');

    for (let j = 0; j < currentTeam_batsmen.length - 1; j += 2) {
      let batsmenAnchor = selTool(currentTeam_batsmen[j]).find('a');
      let batsmanName = selTool(batsmenAnchor).text();
      createJSON(selTool(bothTeams[i]).text(), batsmanName);
      if (i == 0) {
        jsonFiller(
          selTool(bothTeams[i]).text(),
          selTool(bothTeams[1]).text(),
          batsmanName,
          currentTeam_batsmen[j],
          selTool
        );
      } else {
        jsonFiller(
          selTool(bothTeams[i]).text(),
          selTool(bothTeams[0]).text(),
          batsmanName,
          currentTeam_batsmen[j],
          selTool
        );
      }
    }
  }
}

function iplDirectory() {
  let folderPath = path.join(__dirname, iplFolderName);
  if (fs.existsSync(folderPath) == false) {
    fs.mkdirSync(folderPath);
  }
}

function createDirectory(teamName) {
  let folderPath = path.join(__dirname, iplFolderName, teamName);
  if (fs.existsSync(folderPath) == false) {
    fs.mkdirSync(folderPath);
  }
}

function createJSON(teamName, batsmenName) {
  let filePath = path.join(
    __dirname,
    iplFolderName,
    teamName,
    batsmenName + '.json'
  );
  if (fs.existsSync(filePath) == false) {
    let file = fs.createWriteStream(filePath);
    file.end();
  }
}

function jsonFiller(
  batsmanTeam,
  opponentTeam,
  batsmanName,
  currentTeam_batsmenRow,
  selTool
) {
  let batsmanRow = selTool(currentTeam_batsmenRow).find('td');
  let opponentName = opponentTeam;
  let runs = selTool(batsmanRow[2]).text();
  let balls = selTool(batsmanRow[3]).text();
  let fours = selTool(batsmanRow[5]).text();
  let sixes = selTool(batsmanRow[6]).text();
  let sr = selTool(batsmanRow[7]).text();
  let description = selTool('.match-info.match-info-MATCH .description')
    .text()
    .split(',');
  let date = description[2];
  let venue = description[1];
  let result = selTool('.match-info.match-info-MATCH .status-text').text();
  let objArr = [];
  let obj = {
    'Team Name': batsmanTeam,
    "Opponent's Team Name": opponentName,
    Runs: runs,
    Balls: balls,
    '4s': fours,
    '6s': sixes,
    SR: sr,
    Date: date,
    Venue: venue,
    Result: result,
  };
  objArr.push(obj);
  let file_path = path.join(
    __dirname,
    iplFolderName,
    batsmanTeam,
    batsmanName + '.json'
  );
  if (fs.existsSync(file_path) == false) {
    fs.writeFileSync(file_path, JSON.stringify(objArr));
  } else {
    let data = fs.readFileSync(file_path, 'UTF-8');
    if (data.length == 0) {
      data = [];
    } else {
      data = JSON.parse(data);
    }
    data.push(obj);
    fs.writeFileSync(file_path, JSON.stringify(data));
  }
}
