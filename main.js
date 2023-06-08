function getAllClimbs(gymIDsArray,getAll=false) {
  let allClimbsJsonObj = [];
  if (getAll) {
    var jsonParams = JSON.stringify({"filters": {"live": true}});
  }
  else {
    var jsonParams = JSON.stringify({"filters": {"deleted": false, "live": true}});
  }
  for (let x = 0; x < gymIDsArray.length; x++) {
    let allClimbsResp = UrlFetchApp.fetch(`https://api.toplogger.nu/v1/gyms/${gymIDsArray[x]}/climbs.json?json_params=${encodeURIComponent(jsonParams)}`);
    let allClimbsRespText = JSON.parse(allClimbsResp.getContentText());
    allClimbsJsonObj = allClimbsJsonObj.concat(allClimbsRespText);
  }
  return allClimbsJsonObj;
}

function getAllMyClimbs(userIDStr, gymIDsArray, getAll=false) {
  let allClimbsJsonObj = [];
  for (let x = 0; x < gymIDsArray.length; x++) {
    if (getAll) {
      var jsonParams = JSON.stringify({
        "filters": {
          "used": true,
          "user": {"uid": userIDStr},
          "climb": {"gym_id": gymIDsArray[x], "live": true}
        }
      })
    }
    else {
      var jsonParams = JSON.stringify({
      "filters": {
        "used": true,
        "user": {"uid": userIDStr},
        "climb": {"gym_id": gymIDsArray[x], "deleted": false, "live": true}
      }
    })
    }
    let allClimbsResp = UrlFetchApp.fetch(`https://api.toplogger.nu/v1/ascends.json?json_params=${encodeURIComponent(jsonParams)}&serialize_checks=true`);
    let allClimbsRespText = allClimbsResp.getContentText();
    allClimbsJsonObj = allClimbsJsonObj.concat(JSON.parse(allClimbsRespText));
  }
  return allClimbsJsonObj;
}

function updateHeaders(tlHeadersArray,ssHeadersArray) {
  for (let x = 0; x < tlHeadersArray.length; x++) {
    if (!ssHeadersArray[0].includes(tlHeadersArray[x])) {
      if (ssHeadersArray[0].includes("")) {
        ssHeadersArray[0][ssHeadersArray[0].indexOf("")] = tlHeadersArray[x]
      }
      else {
        ssHeadersArray[0].push(tlHeadersArray[x]) 
      }
    }
  }
  return(ssHeadersArray)
}

function myFunction() {
  var scriptProperties = PropertiesService.getScriptProperties()
  var gymIDs = scriptProperties.getProperty("gymIDs")
  var userID = scriptProperties.getProperty("userID")
  var fileName = scriptProperties.getProperty("fileName")
  if (gymIDs == null) {
    throw new Error('Please create a script property for gymIDs e.g. ["1"] or ["1","2"]. In Apps Script go Settings > Script Properties. You can find your gyms gymID at this url: https://api.toplogger.nu/v1/gyms.json')
  }
  if (userID == null) {
    throw new Error("Please create a script property for userID e.g. 0000000000. In Apps Script go Settings > Script Properties. Sign in to toplogger.nu and go to your dashboard. Your user ID is in the URL as uid e.g. https://app.toplogger.nu/en-us/uprising/dashboard/boulders?uid=0000000000")
  }
  if (fileName == null) {
    fileName = "TopLoggerClimbs"
  }
  gymIDs = JSON.parse(gymIDs)
  var files = DriveApp.searchFiles('title contains "' + fileName + '"')
  //open or create
  if (files.hasNext()) {
    var firstRun = false
    var spreadsheet = SpreadsheetApp.open(files.next())
    var sheet = spreadsheet.getSheets()[0]
  }
  else {
    var firstRun = true
    var spreadsheet = SpreadsheetApp.create(fileName)
    var sheet = spreadsheet.getSheets()[0]
  }
  //Get climbs from toplogger
  let myClimbs = getAllMyClimbs(userID,gymIDs,getAll=firstRun)
  let allTlClimbs = getAllClimbs(gymIDs,getAll=firstRun)
  let tlHeaders = ["date_logged","checks"]
  for (var climbHeader in allTlClimbs[0]) {
    if (allTlClimbs[0].hasOwnProperty(climbHeader)) {
      tlHeaders.push(climbHeader)
    }
  }
  //update headers with latest from toplogger
  let numCols = Math.max(tlHeaders.length+1,sheet.getMaxColumns())
  var ssHeadersRange = sheet.getRange(1,1,1,numCols)
  var ssHeadersValues = ssHeadersRange.getValues()
  var ssHeaders = updateHeaders(tlHeaders,ssHeadersValues)
  ssHeadersRange.setValues(ssHeaders)
  if (firstRun) {
    var allRows = []
    var colLen = sheet.getLastColumn()
    //get all climbs into an array first then dump all at once
    for (let x = 0; x < myClimbs.length; x++) {
      let newRow = Array(colLen).fill("")
      //get climb that matches: 
      for (let y = 0; y < allTlClimbs.length;y++) {
        if (allTlClimbs[y]['id'] == myClimbs[x]['climb_id']) {
          var climbDetails = allTlClimbs[y]
        }
      }
      for (var key in myClimbs[x]) {
        if (myClimbs[x].hasOwnProperty(key) && key != "id") {
          newRow[ssHeaders[0].indexOf(key)] = myClimbs[x][key]
        }
      }
      for (var key in climbDetails) {
        if (climbDetails.hasOwnProperty(key)) {
          newRow[ssHeaders[0].indexOf(key)] = climbDetails[key]
        }
      }
      allRows.push(newRow)
    }
    let allRowsRange = sheet.getRange(2,1,allRows.length,colLen)
    allRowsRange.setValues(allRows)
  }
  else {
    //Read all climbs from ss
    let ssClimbsRange = sheet.getDataRange()
    let ssClimbs = ssClimbsRange.getValues()
    let ssClimbIds = []
    for (let x = 1; x < ssClimbs.length; x++) {
      ssClimbIds.push(ssClimbs[x][ssHeaders[0].indexOf('id')])
    }
    //Check if any TL climbs are not in ss
    for (let x = 0; x < myClimbs.length; x++) {
      if (!ssClimbIds.includes(myClimbs[x]['climb_id'])) {
        var newRowRange = sheet.getRange(sheet.getLastRow()+1,1,1,sheet.getLastColumn())
      }
      else {
        let rowNum = ssClimbIds.indexOf(myClimbs[x]['climb_id'])+2 //+2 is because of the header row and because the sheet rows start at 1
        var newRowRange = sheet.getRange(rowNum,1,1,sheet.getLastColumn())
      }
      //get climb that matches: 
      for (let y = 0; y < allTlClimbs.length;y++) {
        if (allTlClimbs[y]['id'] == myClimbs[x]['climb_id']) {
          var climbDetails = allTlClimbs[y]
        }
      }
      let newRow = newRowRange.getValues()
      for (var key in myClimbs[x]) {
        if (myClimbs[x].hasOwnProperty(key) && key != "id") {
          newRow[0][ssHeaders[0].indexOf(key)] = myClimbs[x][key]
        }
      }
      for (var key in climbDetails) {
        if (climbDetails.hasOwnProperty(key)) {
          newRow[0][ssHeaders[0].indexOf(key)] = climbDetails[key]
        }
      }
      newRowRange.setValues(newRow)
    }
  }
}
