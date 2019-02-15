var express = require("express");
var bodyParser = require("body-parser");
var app = express();

var request = require('request');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const https = require("https"),
fs = require('fs');
var AdmZip = require('adm-zip');

var DOWNLOAD_DIR = './backend/download/fundconnext/';

const https_options = {
  pfx: fs.readFileSync("merchantasset_CA/mpam_key.pfx"),
  passphrase: "PP@ssw0rdmpam2017**##"  
};

var routes = require("./routes/routes.js")(app);


var server = app.listen(3000, function () {
    console.log("Listening on port %s...", server.address().port);

    var URL_FUNDCONNEXT = 'https://demo.fundconnext.com';
    var URL_AUTH_API = `${URL_FUNDCONNEXT}/api/auth`
    var URL_FILES_API = `${URL_FUNDCONNEXT}/api/files`

    var loginData = {
        "username": "API_MPAM01",
        "password": "nj6c^$QaQPwXreFP"
        }

        /* 
            /api/auth 
        */ 
        request.post({url:URL_AUTH_API, form: loginData}, function(err,httpResponse,body){ 

            var info = JSON.parse(body);

            console.log(`Authen success \\ USER NAME: ${info.username}  ;SA CODE: ${info.saCode}`);

            // Download API FundMapping
            // 1. Fund Data* 
            //   FundMapping  // OK
            //   FundProfile  // OK
            //   FundHoliday
            //   SwitchingMatrix
            //   TradeCalendar
            // 2. Account Data* 
            //   AccountProfile
            //   UnitholderMapping
            //   BankAccountUnitholder
            //   CustomerProfile 
            // 3. Confirmation** 
            //   Nav
            //   UnitholderBalance
            //   AllottedTransactions
            // 4.Dividend** 
            //   “DividendNews” 
            //   “DividendTransactions”

            // var _fileName = 'FundMapping.zip';    //OK
            // var _fileName ='FundProfile.zip' //OK
            // var _fileName ='FundHoliday.zip' //OK
            // var _fileName ='SwitchingMatrix.zip' //Fail
            // var _fileName ='TradeCalendar.zip' //OK

            // var _fileName ='AccountProfile.zip' //OK
            // var _fileName ='UnitholderMapping.zip' //OK
            // var _fileName ='BankAccountUnitholder.zip' //OK            
            // var _fileName ='CustomerProfile.zip' //Fail            

            var _fileName ='Nav.zip' // OK
            // var _fileName ='UnitholderBalance.zip' // OK
            // var _fileName ='AllottedTransactions.zip'  // OK

            // var _fileName ='DividendNews.zip' // Fail
            // var _fileName ='DividendTransactions.zip'  // Fail

            var _dataDate = '20181001';
            var targetfile_name = _dataDate+'_'+_fileName;

            var FundMapping_Options = {
              url: `${URL_FILES_API}/${_dataDate}/${_fileName}`,
              method: "GET",
              headers: {    
                'Content-Type':'application/json',
                'x-auth-token': info.access_token
              }
            };

            request(FundMapping_Options)
            .pipe(fs.createWriteStream(DOWNLOAD_DIR+targetfile_name))
            .on('close', function () {

              console.log('ON close success save file ' + targetfile_name);
              var zip = new AdmZip(DOWNLOAD_DIR + targetfile_name);

              zip.extractAllTo(/*target path*/DOWNLOAD_DIR, /*overwrite*/true);

              var zipEntries = zip.getEntries();

              // extracts the specified file to the specified location
              // zip.extractEntryTo(/*entry name*/DOWNLOAD_DIR+extract_fileName, /*target path*/DOWNLOAD_DIR, /*maintainEntryPath*/false, /*overwrite*/true);    
              // zip.extractEntryTo(/*entry name*/"some_folder/my_file.txt", /*target path*/"/home/me/tempfolder", /*maintainEntryPath*/false, /*overwrite*/true);
              zipEntries.forEach(function(zipEntry) {
                
                // console.log(zipEntry.toString());
                var fileName = zipEntry.entryName

                    //READ DATA
                    fs.readFile(DOWNLOAD_DIR + fileName, function(err, data) {
                      if(err) {
                        console.log('Was error !!! ' + err);
                        // logger.error(err);
                        throw err;
                      }
                      var data_array = data.toString().split("\n");
                      var attr = data_array[0].split("|") ;

                      console.log('attr>> ' + attr)

                      if ( attr[2] != (data_array.length - 1 ) ){
                        console.log('Download data missing. Try again')
                        // logger.error('Download data missing. Try again');
                        return ;
                      }

                      //GET DATA
                      data_array.shift(); //removes the first array element
                      console.log('Data Array>>' + data_array);

                      // DELETE extracted file after finish
                      // fs.unlink(DOWNLOAD_DIR + fileName, (err) => {
                      //   if (err) throw err;
                      //   console.log( DOWNLOAD_DIR + fileName +'t was deleted');
                      // });

                    });

            });

            });;

        })
});

// var https_server = https.createServer(https_options, app).listen(3100, function () {
//     console.log("HTTPS Listening on port %s...", https_server.address().port);

//     var FUNDCONNEXT_URL = 'https://demo.fundconnext.com/#/login'

//     //Login 
//     var formData ={
//             "username": "API_MPAM02",
//             "password": "mBp6q)5UE!gk=:Lu",
//         };
//     request.post({url:FUNDCONNEXT_URL,https_options, formData: formData}, function optionalCallback(err, httpResponse, body) {
//     if (err) {
//         return console.error('upload failed:', err);
//     }
//     console.log('Upload successful!  Server responded with:', body);
//     });
// });
