const utils = require('../utils/utils')
const fs = require('fs')
const filename = "adminsettings.txt";

const logdb = require('../db/logdb')

const dir = __dirname

  // onRead params: bool error, string data
  function readFile(filePath, onRead) {
    fs.readFile(filePath, "utf8", function(err, data) {
      if (err) {
        onRead(true);
        return
      }
      onRead(false, data);
    });
}

  // gets the working path for files
  function getIOPath() {
    return dir + "/"
  }

  // appends the given str to the projects working file path
  function getPath(str) {
    return getIOPath() + str;
  }

const settings = class {

  constructor() {
      this.settings = {}
    }

    start() {
      readFile(getPath(filename), (error, data) => {
        if (error) throw new Error ("Cannot laod settings file")
      this.settings = JSON.parse(data);
      // TODO: log perhaps or reset settings file manually
      if (this.settings == null) {
          throw new Error ("Settings file corrupt!")
      }
      setInterval(this.int, this.settings.matchCreateQueAutoTime)
      setInterval(this.int2, this.settings.logCleanupAutoTime)
      })
    }

    save() {
        fs.writeFile(getPath(filename), JSON.stringify(this.settings), function (err) {
            if (err) return console.log(err);
          });
    }

    int() {
      utils.checkMatchQue()
    }

    int2() {
      logdb.preformLogCleanup(this.onSucc, this.onFail)
    }

    onSucc() {

    }

    onFail() {

    }
}

module.exports.settings = new settings();
module.exports.settings.utils = utils
module.exports.settings.start()