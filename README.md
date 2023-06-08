# toplogger-logger
Google Apps Script for archiving climbs from TopLogger to a Google Sheet

Create a new Google Apps Script project (https://script.google.com/home) and paste the main.js code into the editor. 

Go to Settings > Script Properties and define these properties:
gymIDs = ["gymid1","gymid2"]
userID = 0000000000
fileName = "TopLoggerClimbs" (optional, will be TopLoggerClimbs by default)

Go to Triggers > Add Trigger
![image](https://github.com/hutchris/toplogger-logger/assets/10625129/2fd6a84c-2a53-4dbf-b02d-bd59c6997ce6)

Configure this to run the MyFunction function once per day.

The first time this runs (based on whether the Sheet document exists yet) it will download all your previous climbs. Subsequent runs will only download climbs that are still present in your gym.

It always puts the climb data in the first sheet of the document. If you want to analyse the data or add additional information you can either add a column to sheet1 or create a new sheet that references sheet1
