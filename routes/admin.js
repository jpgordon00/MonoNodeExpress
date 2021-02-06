var express = require('express');
const { exists } = require('fs');
var router = express.Router();
var utils = require('../utils/utils.js')
var database = require('../db/admindb')
var mdatabase = require('../db/matchdb');
var ldatabase = require('../db/logdb');
var loadoutdatabase = require('../db/loadoutdb');
var settings = require('../utils/settings.js');

// update settings
router.get('/updatesettings', function(req, res, next) {
    if (!utils.paramExists(req.query.username) || !utils.paramExists(req.query.pass) || !utils.paramExists(req.query.fields)) {
        return next(new error("Username, Password, fields must exist"));
    }
    database.validateAdmin(req.query.username, req.query.pass, onSuccessUpdateSettingsValidate, onFailSettingsUpdateValidate, req, res)
  });

  // merge with settings and return true
function onSuccessUpdateSettingsValidate(req, res) {
    res.json({"result" : true, "fieldChanged" : utils.mergeJSON(settings.settings.settings, utils.decodeJSON(req.query.fields))});
    settings.settings.save()
}

  // fail admin validation for update
function onFailSettingsUpdateValidate(msg, req, res) {
    res.json({"result" : false, "msg" : msg})
}

// grabs settings
router.get('/settings', function(req, res, next) {
    if (!utils.paramExists(req.query.username) || !utils.paramExists(req.query.pass)) {
        return next(new error("Username, Password"));
    }
    database.validateAdmin(req.query.username, req.query.pass, onSuccessSettingsValidate, onFailSettingsValidate, req, res)
  });

// respond w the settings obj in full
function onSuccessSettingsValidate(req, res) {
    var data = JSON.parse(JSON.stringify(settings.settings.settings));
    data["result"] = true;
    res.json(data);
}

  // fail admin validation for settings
function onFailSettingsValidate(msg, req, res) {
    res.json({"result" : false, "msg" : msg})
}

// logs data given data
// auths first
router.get('/log', function(req, res, next) {
    if (!utils.paramExists(req.query.username) || !utils.paramExists(req.query.pass) || !utils.paramExists(req.query.data)) {
        return next(new error("Username, Password, Data"));
    }
    database.validateAdmin(req.query.username, req.query.pass, onSuccessLogValidate, onFailLogValidate, req, res)
  });

  function onSuccessLogValidate(req, res) {
    ldatabase.log(utils.decodeJSON(req.query.data), onSuccessLog, onFailLog, req, res)
  }



  function onFailLogValidate(msg, req, res) {
    res.json({"result" : false, "msg" : msg})
  }

  // print succesful log
  function onSuccessLog(req, res) {
    res.json({"result" : false, "msg" : "Logged succesfully"})

  }

  function onFailLog(msg, req, res) {
    res.json({"result" : false, "msg" : msg})
  }

  

// update a player given their uid and any fields to update
//  must include a username and password
router.get('/player/update', function(req, res, next) {
    if (!utils.paramExists(req.query.username) || !utils.paramExists(req.query.pass) || !utils.paramExists(req.query.uid) || !utils.paramExists(req.query.fields)) {
        return next(new error("Username, Password, PUID, and Fields must exist"));
    }
    database.validateAdmin(req.query.username, req.query.pass, onSuccessUpdateValidate, onFailUpdateValidate, req, res)
  });

// calls update player given 'fields'
function onSuccessUpdateValidate(req, res) {
    database.updatePlayer(req.query.uid, req.query.fields, onSuccessUpdate, onFailUpdate, req, res)
}

// fail admin validation for update
function onFailUpdateValidate(msg, req, res) {
    res.json({"result" : false, "msg" : msg})
}

// update req complete
function onSuccessUpdate(req, res) {
    res.json({"result" : true})
}

// update req faied after admin val
function onFailUpdate(msg, req, res) {
    res.json({"result" : false, "msg" : msg})
}

// retrieves player data given admin username pass and uid
router.get('/player/get', function(req, res, next) {
    if (!utils.paramExists(req.query.username) || !utils.paramExists(req.query.pass) || !utils.paramExists(req.query.uid)) {
        return next(new error("Username, Password and PUID must exist"));
    }
    database.validateAdmin(req.query.username, req.query.pass, onSuccessPlayerGetValidate, onFailPlayerGetValidate, req, res)
  });

  // fail admin validation for player get
function onFailPlayerGetValidate(msg, req, res) {
    res.json({"result" : false, "msg" : msg})
}


// retrieves data from player
function onSuccessPlayerGetValidate(req, res) {
    database.grabPlayerData(req.query.uid, onSuccessPlayerGet, onFailPlayerGet, req, res)
}

function onSuccessPlayerGet(data, req, res) {
    data["result"] = true;
    res.json(data);
}

function onFailPlayerGet(msg, req, res) {
    res.json({"result" : false, "msg" : msg})
}

// gens a new match uid
// must include admin usernasme and password
// must include player uid to ensure correct matchuid from list
router.get('/match/create', function(req, res, next) {
    if (!utils.paramExists(req.query.username) || !utils.paramExists(req.query.pass) || !utils.paramExists(req.query.uid) || !utils.paramExists(req.query.puid)) {
        return next(new error("Username, Password, PUID, and UID must exist"));
    }
    database.validateAdmin(req.query.username, req.query.pass, onSuccessMatchCreateValidate, onFailMatchCreateValidate, req, res)
  });

  // grab players version
  // creates match assuming admin valid
  // ensure puid and uid exists in list
  function onSuccessMatchCreateValidate(req, res) {
    if (!utils.hasMatchQue(req.query.uid, req.query.puid)) return res.json({"result" : false, "msg" : "does not exist in match que"});
    utils.removeMatchQue(req.query.puid)
    database.grabPlayerData(req.query.puid, onSuccessMatchCreateGet, onFailMatchCreateGet, req, res)
}

// pass version to createMatch
function onSuccessMatchCreateGet(data, req, res) {
    mdatabase.createMatch(req.query.uid, data.LoggedVersion, onSuccessMatchCreate, onFailMatchCreate, req, res, null);
}

// fail match create get for bad player data
function onFailMatchCreateGet(msg, req, res) {
    res.json({"result" : false, "msg" : msg})
}

// fail admin validation for update
function onFailMatchCreateValidate(msg, req, res) {
    res.json({"result" : false, "msg" : msg})
}

//match create request complete
// TODO: check valid muid here
function onSuccessMatchCreate(req, res, extraData) {
    res.json({"result" : true});
}

//fail match create req
function onFailMatchCreate(msg, req, res) {
    res.json({"result" : false, "msg" : msg})
}

// updates a match given a match uid
// fields for Players and MatchState
// must include admin usernasme and password
router.get('/match/update', function(req, res, next) {
    if (!utils.paramExists(req.query.username) || !utils.paramExists(req.query.pass) || !utils.paramExists(req.query.uid) || !utils.paramExists(req.query.fields)) {
        return next(new error("Username, Password, PUID, and Fields must exist"));
    }
    database.validateAdmin(req.query.username, req.query.pass, onSuccessMatchUpdateValidate, onFailMatchUpdateValidate, req, res)
  });

  // updates match assuming admin valid 
  function onSuccessMatchUpdateValidate(req, res) {
    mdatabase.updateMatch(req.query.uid, req.query.fields, onSuccessMatchUpdate, onFailMatchUpdate, req, res)
}

// fail admin validation for update
function onFailMatchUpdateValidate(msg, req, res) {
    res.json({"result" : false, "msg" : msg})
}

//match update requestcomplete
function onSuccessMatchUpdate(req, res) {
    res.json({"result" : true})
}

//fail match update req
function onFailMatchUpdate(msg, req, res) {
    res.json({"result" : false, "msg" : msg})
}

// deletes a match given a match uid
// must include admin usernasme and password
router.get('/match/delete', function(req, res, next) {
    if (!utils.paramExists(req.query.username) || !utils.paramExists(req.query.pass) || !utils.paramExists(req.query.uid)) {
        return next(new error("Username, Password, PUID must exist"));
    }
    database.validateAdmin(req.query.username, req.query.pass, onSuccessMatchDeleteValidate, onFailMatchDeleteValidate, req, res)
  });

  // deletes match assuming admin valid 
  function onSuccessMatchDeleteValidate(req, res) {
    mdatabase.deleteMatch(req.query.uid, onSuccessMatchDelete, onFailMatchDelete, req, res)
}

// fail admin validation for update
function onFailMatchDeleteValidate(msg, req, res) {
    res.json({"result" : false, "msg" : msg})
}

//match delete requestcomplete
function onSuccessMatchDelete(req, res) {
    res.json({"result" : true})
}

//fail match delete req
function onFailMatchDelete(msg, req, res) {
    res.json({"result" : false, "msg" : msg})
}

// gets a match given a match uid
// must include admin usernasme and password
router.get('/match/get', function(req, res, next) {
    if (!utils.paramExists(req.query.username) || !utils.paramExists(req.query.pass) || !utils.paramExists(req.query.uid)) {
        return next(new error("Username, Password, PUID must exist"));
    }
    database.validateAdmin(req.query.username, req.query.pass, onSuccessMatchGetValidate, onFailMatchGetValidate, req, res)
  });

  // gets match assuming admin valid 
  function onSuccessMatchGetValidate(req, res) {
    mdatabase.getMatch(req.query.uid, onSuccessMatchGet, onFailMatchGet, req, res)
}

// fail admin validation for get
function onFailMatchGetValidate(msg, req, res) {
    res.json({"result" : false, "msg" : msg})
}

//match get requestcomplete
function onSuccessMatchGet(data, req, res) {
    res.json({"result" : true, "Players" : data.players, "MatchState" : data.matchState})
}

//fail match get req
function onFailMatchGet(msg, req, res) {
    res.json({"result" : false, "msg" : msg})
}

// modify loadout
router.get('/ld/modify', function(req, res, next) {
    if (!utils.paramExists(req.query.username) || !utils.paramExists(req.query.pass) || !utils.paramExists(req.query.uid) || !utils.paramExists(req.query.index) || !utils.paramExists(req.query.data)) {
        return next(new error("Username, Password and PUID must exist"));
    }
    database.validateAdmin(req.query.username, req.query.pass, onSuccessLdModifyValidate, onFailLdModifyValidate, req, res)
  });

  function onSuccessLdModifyValidate(req, res) {
      loadoutdatabase.modifyLoadout({"UID" : req.query.uid, "Index" : req.query.index, "Data" : req.query.data}, onSuccesLdModify, onFailLdModify, req, res)
  }

  function onFailLdModifyValidate(msg, req, res) {
    res.json({"result" : false, "msg" : msg})
  }

  function onSuccesLdModify(req, res) {
    res.json({"result" : true})
  }

  function onFailLdModify(msg, req, res) {
    res.json({"result" : false, "msg" : msg})
  }

  // grab loadouts
router.get('/ld/grab', function(req, res, next) {
    if (!utils.paramExists(req.query.username) || !utils.paramExists(req.query.pass) || !utils.paramExists(req.query.uid)) {
        return next(new error("Username, Password and PUID must exist"));
    }
    database.validateAdmin(req.query.username, req.query.pass, onSuccessLdGrabValidate, onFailLdGrabValidate, req, res)
  });

  function onSuccessLdGrabValidate(req, res) {
    loadoutdatabase.grabLoadouts({"UID" : req.query.uid}, onSuccesLdGrab, onFailLdGrab, req, res)
  }

  function onFailLdGrabValidate(msg, req, res) {
    res.json({"result" : false, "msg" : msg})
  }

  function onSuccesLdGrab(data, req, res) {
    data.loadouts["result"] = true
    res.json(data.loadouts)
  }

  function onFailLdGrab(msg, req, res) {
    res.json({"result" : false, "msg" : msg})
  }





module.exports = router;
