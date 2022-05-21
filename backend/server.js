const express = require("express");
const app = express();
var cors = require('cors')
app.use(cors())
var path=require("path");
var nodemailer = require('nodemailer');

var dirname= __dirname; // the path to the current JS
app.use(express.static(path.join(__dirname,'Hotspot Backend')));
const errors = require("./middlewares/errors.js");
// app.post('/hotspot/login', function(req, res){
//   console.log("I RAN!")
//     res.sendFile(__dirname + '/login.html');
// });
// 
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'sumeet@inet.africa',
        pass: 'rbhelvpajpaaatvl'
    }
});
app.use(express.json());

// initialize routes
app.use("/hotspot", require("./routes/users.routes"));

/**
 * Backup database to email
 */
app.get('/backup', (req, res) => {
    var mailOptions = {
        from: 'services@inet.africa',
        to: 'sumeet@inet.africa',
        subject: 'RADIUS DB BACKUP',
        text: 'That was easy!',
        attachments: [{ // utf-8 string as an attachment
            filename: 'db.stormdb.txt',
            path: `${__dirname}/services/db_hs.stormdb`
        }]
    };

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
            res.send("OK")
        }
    });
})


// middleware for error responses
app.use(errors.errorHandler);

// listen for requests
app.listen(process.env.port || 4000, function () {
  console.log("Ready to Go!");
});