
var settings = require('../utils/settings')
var fs = require('fs');
const { match } = require('assert');

var path = require('path');
var appDir = path.dirname(require.main.filename)

class utils {

  constructor() {
    this.matchCreateQue = []
    console.log(this.matchCreateQue == undefined)
  }

  // gets the working path for files
  getIOPath() {
    return process.env.PWD + '/io/'
  }

  // appends the given str to the projects working file path
  getPath(str) {
    return this.getIOPath() + str;
  }

  // onLineRead params: bool error, tring line , int lineNum, int bytesRead
  readFile(filePath, chunkSize, onLineRead) {
    var offset = 0;
    var chunkSize = chunkSize;
    var chunkBuffer = new Buffer(chunkSize);
    var fp = fs.openSync(filePath, 'r');
    if (fp == null) {
      onLineRead(true);
      return;
    }
    var bytesRead = 0;
    var lineNum = 0;
    while(bytesRead = fs.readSync(fp, chunkBuffer, 0, chunkSize, offset)) {
    var str = chunkBuffer.slice(0, bytesRead).toString();
    var arr = str.split('\n');

    if(bytesRead = chunkSize) offset -= arr.pop().length
    for (var i = 0 ; i < arr.length; i++) {
        onLineRead(false, arr[i], lineNum++, bytesRead);
      }
    }
  }

  // given a password return true if it is acceptable
  // TODO: implement
  validPasswordFormat(pass) {
    return true
  }

  // returns TRUE if the obj is valid for loadout data
  // TODO: implement
  validLoadoutData() {
    return true
  }

  // given a username retrun true if it is acceptable
  // TODO: implement
  validUsername() {
    return true
  }

  // returns the credentials from a given username or password
  // or null
getCredential(username, password = null) {
  if (!this.hasUser(username, password)) return null
  return this.getUser(username, password).credential
}

  // gets all usernames and passwords for a credential type
  getAllCredentials(credential) {
    var users = []
    var passwords = []
    for (var i = 0; i < settings.settings.settings.users.length; i++) {
      var user = settings.settings.settings.users
      if (user.credential == credential) {
        user.push(users + "")
        passwords.push(user.password)
      }
    }
    return {users, passwords}
  }

  // returns true or false if the given username/combo exists
  hasUser(username, password = null) {
    for (var i = 0; i < settings.settings.settings.users.length; i++) {
      var user = settings.settings.settings.users[i]
      if (user.uid == username && (user.password == password && password != null)) return true
    }
    return false
  }

  // returns an obj containing the user attribute given a username/password pair
  // or null
  getUser(username, password = null) {
    for (var i = 0; i < settings.settings.settings.users.length; i++) {
      var user = settings.settings.settings.users[i]
      if (user.uid == username && (user.password == password && password != null)) return user
    }
    return null
  }

  // given a version return the object with that title
  getVersion(version) {
    for (var i = 0; i < settings.settings.settings.users.length; i++) {
      var v = settings.settings.settings.versions[i]
      if (v.title == version) return v
    }
    return null
  }

  // returns true if auth is enabled for version
  // false if not or if version dont exist
  authEnabled(version) {
    var v = this.getVersion(version)
    return v == null ? false : v.authEnabled
  }
  // returns true if match is enabled for version
  // false if not or if version dont exist
  matchEnabled(version) {
    var v = this.getVersion(version)
    return v == null ? false : v.matchEnabled
  }

  // onRead params: bool error, string data
  readFile(filePath, onRead) {
    fs.readFile(filePath, "utf8", function(err, data) {
      if (err) {
        onRead(true);
        return
      }
      onRead(false, data);
    });
  }

  // returns encoded string from json object
  encodeJSON(obj) {
    return new Buffer(JSON.stringify(obj)).toString('base64')
  }

  // returns json object from encoded string
  decodeJSON(str) {
    return JSON.parse(new Buffer(str, "base64").toString('ascii'))
  }
  
  // given a base obj and a secondary obj, update any fields exisitng in both
  // from secondary to base
  // returns true if any field was updated
  mergeJSON(objBase, objSec) {
    var updated = false
    for (var key in objSec) {
      if (objBase[key] != null) {
        updated = true
        objBase[key] = objSec[key];
      }
    }
    return updated
  }

  // generates a uid from a->a,A->A,1->9 of 'uidLength' length
  genUID() {
    var text = "";
    var charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for (var i = 0; i < settings.settings.settings.uidLength; i++) text += charset.charAt(Math.floor(Math.random() * charset.length));
    return text;
  }

  // // generates a token from a->a,A->A,1->9 of 'tokenLEngth' length
  genToken() {
    var text = "";
    var charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for (var i = 0; i < settings.settings.settings.tokenLength; i++) text += charset.charAt(Math.floor(Math.random() * charset.length));
    return text;
  }

  // generates a uid from a->a,A->A,1->9 of 'matchUIDLength' length
  genMatchUID() {
    var text = "";
    var charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for (var i = 0; i < settings.settings.settings.matchUIDLength; i++) text += charset.charAt(Math.floor(Math.random() * charset.length));
    return text;
  }

  // generates a uidfrom a->a,A->A,1->9 of 'uidLength' length
  genRefereeUID() {
    var text = "RRRRRR";
    var charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for (var i = 0; i < settings.settings.settings.uidLength; i++) text += charset.charAt(Math.floor(Math.random() * charset.length));
    return text;
  }

  // return true if uid is a referee uid
  isReferee(uid) {
    return uid.startsWith("RRRRRR")
  }

  // start match que loop manually since the settings loaded is a prereq
  startMatchQueLoop() {
    console.log("fck you " + (this.matchCreateQue == undefined))
    this.matchCreateQue = []
    setTimeout(this.checkMatchQue, settings.settings.settings.matchCreateQueAutoTime)
  }

  // gets a match que obj given a puid
  getMatchQue(uid) {
    for (var i in this.matchCreateQue) {
      if (i.uid == uid) return i
    }
    return null
  }
  
    // destroys items in the match que who is older than settings.matchCreateQueTime
    checkMatchQue() {
      console.log('checkin')
      for (var i = this.matchCreateQue.length - 1; i >= 0; i--) {
        if (this.time() > this.matchCreateQue[i].time + settings.settings.settings.matchCreateQueTime) { 
            this.matchCreateQue.splice(i, 1);
        }
      }
    }

  // retruns true if the given match uid and player uid exist in the que
  hasMatchQue(muid, puid) {
    for (var i = 0; i < this.matchCreateQue.length; i++) {
      if (this.matchCreateQue[i]["uid"] == puid && this.matchCreateQue[i]["muid"] == muid) return true
    }
    return false
  }

  // removes a match que given the player uid
  removeMatchQue(uid) {
    for (var i = this.matchCreateQue.length - 1; i >= 0; i--) {
      if (this.matchCreateQue[i].uid == uid) { 
          this.matchCreateQue.splice(i, 1);
      }
    }
    return true
  }
  

  // given a uid create match uid and add to que
  grabMatchUID(uid) {
    var muid = this.genMatchUID();
    var v = { "uid" : uid, "muid" : muid, "timestamp" : this.time() }
    this.matchCreateQue.push(v)
    return muid
  }

  // returns true only if the param is not null, equal to '' or equal to 'undefined'
  paramExists(param) {
    return !(param == null || param == '' || param == 'undefined');
  }

  // returns time in seconds
  time() {
    if (this.timeDiff == undefined) this.timeDiff = 0
    if (Math.floor(new Date() / 1000) - this.timeDiff > 100000000) this.timeDiff = Math.floor(new Date() / 1000) - 10000
    return Math.floor(new Date() / 1000) - this.timeDiff
  }
}

module.exports = new utils()