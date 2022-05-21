// const User = require("../models/user.model");
// const bcrypt = require("bcryptjs");
// const auth = require("../middlewares/auth.js");

const otpGenerator = require("otp-generator");
const crypto = require("crypto");
const key = "verysecretkey"; // Key for cryptograpy. Keep it secret
var msg91 = require("msg91")("1", "1", "1");
const axios = require('axios');
const https = require('https');
// Saving data to database
const StormDB = require("stormdb");
// At request level
const agent = new https.Agent({
  rejectUnauthorized: false
});
// start async local file engine
const engine = new StormDB.localFileEngine(`${__dirname}/db_hs.stormdb`, {
  async: true,
});
const db = new StormDB(engine);
console.log(db)
db.default({ users: {} });

function generateOTP() {

  // Declare a digits variable 
  // which stores all digits
  var digits = '0123456789';
  let OTP = '';
  for (let i = 0; i < 4; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
}

async function createNewOTP(params, callback) {
  // Generate a 4 digit numeric OTP
  const otp = generateOTP();
  const ttl = 1440 * 60 * 1000; //5 Minutes in miliseconds
  const expires = Date.now() + ttl; //timestamp to 5 minutes in the future
  const data = `${params.phone}.${otp}.${expires}`; // phone.otp.expiry_timestamp
  const hash = crypto.createHmac("sha256", key).update(data).digest("hex"); // creating SHA256 hash of the data
  const fullHash = `${hash}.${expires}`; // Hash.expires, format to send to the user


  let messageSent = `Your OTP is ${otp}. it will expire in 24 hours`;
  await sendSms(params.phone, messageSent, `${params.last_name}`);
  console.log(`Your OTP is ${otp}. it will expire in 24 hours`);


  db.get("users").set(
    params.phone, {
      first_name: `${params.first_name}`,
      last_name: `${params.last_name}`,
      email: `${params.email}`,
      area: `${params.area}`,
      awareness: `${params.awareness}`,
      phone: `${params.phone}`,
      isVerified: false,
      DoB: `${params.DoB}`,
      current_isp: `${params.current_isp}`,
      sessionID: fullHash,
      otp: otp
    });

  // asynchronous database save
  db.save() // equals "Promise { <pending> }"
    .then(function() {
      console.log("Finished Saving Database!");
      resp = { "id": fullHash, "phone": `${params.phone}` }
      return callback(null, resp);
    });

}

async function sendSms(num, content, name = "Customer") {
  try {
    if (!content) {
      throw new Error("Must have content");
    }
    console.log("\n\n")
    let msg = `Dear ${name},\n\n${content}\n\nKind Regards,\niNet Africa`

    let apikey = "3855be93db6b7fc92fc9e8a010be74ef"
    let partnerID = 1322
    let shortcode = "iNetAfrica"
    let mobile = num.replace(/\s/g, '');

    let url = 'https://mysms.celcomafrica.com/api/services/sendsms/'
    let myobj = {
      'partnerID': "1322",
      'apikey': apikey,
      'mobile': mobile,
      'message': msg,
      'shortcode': shortcode,
      'pass_type': 'plain'
    }

    console.log("agent")
    console.log(agent)


    let res = await axios.post(url, myobj, { httpsAgent: agent })
    // console.log(res.data)
    // console.log(name + " " + num)
    // console.log("\n\n")
  } catch (e) {
    console.log(e)
  }
}

async function verifyOTP(params, callback) {
  // Separate Hash value and expires from the hash returned from the user
  let [hashValue, expires] = params.hash.split(".");
  let phone = params.phone;
  // Check if expiry time has passed
  let now = Date.now();
  if (now > parseInt(expires)) return callback("OTP Expired");
  // Calculate new hash with the same key and the same algorithm
  let data = `${params.phone}.${params.otp}.${expires}`;
  let newCalculatedHash = crypto
    .createHmac("sha256", key)
    .update(data)
    .digest("hex");
  // Match the hashes
  if (newCalculatedHash === hashValue) {
    let users = db.get("users").value();
    let user = users[phone];

    user.isVerified = true;
    db.get("users").set(phone, user);
    db.save();
    return callback(null, "Success");
  }
  return callback("Invalid OTP");
}

module.exports = {
  createNewOTP,
  verifyOTP,
};