var express = require('express');
var router = express.Router();
var database = require('../db/playerdb')
var adatabase = require('../db/admindb')
var mdatabase = require('../db/matchdb')
var ldatabase = require('../db/logdb')
var loadoutdatabase = require('../db/loadoutdb')
var settings = require('../utils/settings')
var utils = require('../utils/utils');
const playerdb = require('../db/playerdb');

// start auth proccess
router.get('/auth', function(req, res, next) {
    if (!utils.paramExists(req.query.uid) || !utils.paramExists(req.query.pass) || !utils.paramExists(req.query.version)) {
        res.json({
            "result": false
        });
        return;
    }
    // handle registrationor
    // query logs with a matching uid and of LogType=PLAYER_LOCKOUT
    // Author, IPAddress, LogType, WithinTime(t1,t2), BeforeTime(t), AfterTime(t)
    if (req.query.uid == 'INVALID') return database.validateOrGenerate(req.query.uid, req.query.pass, req.query.version, onSuccessAuth, onFailAuth, req, res)
    var data = { "Author" : req.query.uid, "LogType" : ldatabase.LogType.ApiAuthLockout }
    ldatabase.queryLogs(data, onAuthLogQuerySuccess, onAuthLogQueryFail, req, res)
});
 
// authenticate players if no lockout
function onAuthLogQuerySuccess(data, req, res) {
    if (data.logs.length != 0) return res.json({result: false,'msg': "Account Locked :P"})
    database.validateOrGenerate(req.query.uid, req.query.pass, req.query.version, onSuccessAuth, onFailAuth, req, res)
}

// failed query of log data for auth
function onAuthLogQueryFail(msg, req, res) {
    res.json({
        'result': false,
        'msg': msg
    })
}

// authentication success grab data
// if new account registration then push progression loadout
function onSuccessAuth(data, req, res) {
    if (data.newUID) {
        var pgld = {"Type" : 0, "UID" : data.uid, "Index" : 0, "Data" :
        utils.encodeJSON({
            //           white hero                                 blue hero                               red hero
            "heroes" : [ {"id" : 0, "quantity" : 1, "level" : 0}, {"id" : 1, "quantity" : 1, "level" : 0}, {"id" : 2, "quantity" : 1, "level" : 0} ],
            //           core                                      wood                                     stone
            "defense" : [{"id" : 0, "quantity" : 2, "level" : 0}, {"id" : 1, "quantity" : 2, "level" : 0}, {"id" : 2, "quantity" : 2, "level" : 0}]})}
        return loadoutdatabase.addLoadout(pgld, onSuccessAddLoadoutAuth, onFailAddLoadoutAuth, req, res, data)
    }
    database.grabPlayerData(data.uid, onSuccessGrabAuth, onFailGrabAuth, req, res, data)
}

// grab player data as normal
function onSuccessAddLoadoutAuth(req, res, data) {
    database.grabPlayerData(data.uid, onSuccessGrabAuth, onFailGrabAuth, req, res, data)
}

function onFailAddLoadoutAuth(msg, req, res) {
    res.json({"result" : false, "msg" : msg})
}

// authentication fail
// log a fail for player and check for logout
//if not registration
function onFailAuth(msg, req, res) {
    if (req.query.uid == 'INVALID') return res.json({"result" : false, "msg" : msg}) 
    var data = {"Author" : req.query.uid, "LogType" : ldatabase.LogType.ApiAuthFail, "ExpTime" : settings.settings.settings.maxFailedAttemptsTime}
    ldatabase.log(data, onSuccessLogAuth, onFailLogAuth, req, res)
}

// check if failed > settings.maxFailedAttempts
function onSuccessLogAuth(req, res) {
    var data = {"Author" : req.query.uid, "LogType" : ldatabase.LogType.ApiAuthFail}
    ldatabase.queryLogs(data, onSuccessLogGrab, onFaulLogGrab, req, res)
}

// could not grab any locokouts
function onFailLogAuth(msg, req, res) {
    res.json({
        result: false,
        'msg': msg
    })
}

function onSuccessLogGrab(data, req, res) {
        // establish lockout
        if (data.logs.length >= settings.settings.settings.maxFailedAttempts) {
            var d = {"Author" : req.query.uid, "LogType" : ldatabase.LogType.ApiAuthLockout, "ExpTime" : settings.settings.settings.maxFailedAttemptsLockoutTime}
            return ldatabase.log(d, onSuccessLogLockAuth, onFailLogLockAuth, req, res)
         }
         res.json({
            result: false,
            'msg' : "No lockout established"
        })
}

function onFaulLogGrab(data, req, res) {
     res.json({
        result: false,
        'msg' : null
    })
}

// finish authentication
function onSuccessLogLockAuth(req, res) {
    res.json({
        result: false,
        'msg': "Account is now LOCKED"
    })
}

// could not log a lockout, continue
function onFailLogLockAuth(msg, req, res) {
    res.json({
        result: true,
        'msg': msg
    })
}

// check for concurrent logins (TODO: log fail)
// if player state not active then set state to 1(0)
// if player state is active then block login
// if player state in game then keep current state
function onSuccessGrabAuth(data, req, res, extraData) {
    if (!settings.settings.settings.concurrentLogins && data.playerState == 1) return res.json({'result' : false, 'msg' : 'Concurrent Login DISABLEd'})
    adatabase.updatePlayer(extraData.uid, (data.playerState == 2 ? utils.encodeJSON({"PlayerState": data.playerState}) : utils.encodeJSON({ "PlayerState" : 1 })), onSuccessAuthUpdate, onFailAuthUpdate, req, res, extraData)
}

// failed player grab for auth
function onFailGrabAuth(msg, req, res) {
    res.json({
        result: false,
        'msg': msg
    });
}

function onSuccessAuthUpdate(req, res, data) {
    res.json({
        'result' : true,
        'newUID': data.newUID,
        'newToken': data.newToken,
        'uid': data.uid,
        'token': data.token,
        'inGame' : data.inGame
    });
}

function onFailAuthUpdate(msg, req, res) {
    res.json({
        result: false,
        'msg': msg
    });
}

// photon network validate as long as state is == 1
// and match is enabled for their version
// if referee token then grab match and assert matching referee data
router.get('/punauth', function(req, res, next) {
    if (!utils.paramExists(req.query.uid)) {
        res.json({
            "resultCode": 2
        });
        return;
    }
    if (utils.isReferee(req.query.uid)) return mdatabase.getMatch(req.query.uid, onSuccessMGetPun, onFailMGetPun)
    if (!utils.paramExists(req.query.token)) return res.json({"resultCode": 2});
    database.validate(req.query.token, onSuccessPunAuth, onFailPunAuth, req, res)
});


// assert referee token to be true
function onSuccessMGetPun(data, req, res) {
    return data.referee == req.query.uid ? res.json({"resultCode": 1}) : res.json({"resultCode": 2});
}

function onFailMGetPun(msg, req, res) {
    res.json({
        result: false,
        'msg': msg
    });
}

// grab player data
function onSuccessPunAuth(req, res) {
    database.grabPlayerData(req.query.uid, onSuccessPunAuthGrab, onFailPunAuthGrab, req, res)
}

function onFailPunAuth(msg, req, res) {
    res.json({"resultCode" : 2})
}

function onSuccessPunAuthGrab(data, req, res) {
    if (data.playerState != 1 || !utils.matchEnabled(data.loggedVersion)) {
        res.json({"resultCode" : 2})
        return
    } 
    res.json({"resultCode" : 1, "UserId" : req.query.uid})
}


function onFailPunAuthGrab(msg, req, res) {
    res.json({"resultCode" : 2})
}

// grabs the full player data
// given a uid/token combo
router.get('/pd', function(req, res, next) {
    if (!utils.paramExists(req.query.uid) || !utils.paramExists(req.query.token)) {
        res.json({
            "result": false
        });
        return;
    }
    database.validate(req.query.token, onSuccessPDAuth, onFailPDAuth, req, res)
});

function onSuccessPDAuth(req, res) {
    database.grabPlayerData(req.query.uid, onPDSuccess, onPDFail, req, res)
}

function onFailPDAuth(msg, req, res) {
    res.json({
        'result': false,
        'msg' : msg
    })
}

// player data success response
// if player is in match attach 'matchUID' to PD
function onPDSuccess(data, req, res) {
    var extraData = {
        'result': true,
        'masterServerAddress': settings.settings.settings.masterServerAddress,
        'inMatch' : data.playerState == 2,
        'loggedVersion' : data.loggedVersion,
        'playerState': data.playerState,
        'username': data.username,
        'level': data.level,
        'currency': data.currency,
        'currency2': data.currency2,
        'currency3': data.currency3,
        'mmr': data.mmr
    }
    if (data.playerState == 2) {
        mdatabase.findMatch(req.query.uid, onSuccessFindReconnect, onFailFindReconnect, req, res, extraData)
    } else {
        res.json(extraData);
    }
}

// player data fail
function onPDFail(msg, req, res) {
    res.json({
        'result': false,
        'msg' : msg
    })
}

// match uid is data.matchUID
function onSuccessFindReconnect(data, req, res, extraData) {
    extraData["matchUID"] = data.matchUID;
    res.json(extraData);
}

function onFailFindReconnect(msg, req, res) {
    res.json({
        result: false,
        'msg': msg
    });
}

// player requests a logout with valid uid/token
// a succesful logout requires PlayerState=1
router.get('/logout', function(req, res, next) {
    if (!utils.paramExists(req.query.token) || !utils.paramExists(req.query.uid)) {
        res.json({
            "result": false
        });
        return;
    }
    database.validate(req.query.token, onSuccessAuthLogout, onFailAuthLogout, req, res)
});

// authentication success
// grab player data
function onSuccessAuthLogout(req, res) {
    database.grabPlayerData(req.query.uid, onSuccessGrabLogout, onFailGrabLogout, req, res, null)
}

// authentication fail
function onFailAuthLogout(msg, req, res) {
    res.json({
        result: false,
        'msg': msg
    });
}

// attempt to update player state & token
// for player state is not active, ignore/log (0)
// for player state is active, set state to 0, invalidate token (1)
// for player state is in match, invalidate token (2)
function onSuccessGrabLogout(data, req, res, extraData) {
    if (data.playerState == 0) {
        res.json({
            result: false
        });
        return;
    }
    var updateData = data.playerState == 2 ? utils.encodeJSON({"Token":settings.settings.settings.invalidStr, "LoggedVersion":settings.settings.settings.invalidStr}) : utils.encodeJSON({"PlayerState" : 0, "Token":settings.settings.settings.invalidStr, "LoggedVersion":settings.settings.settings.invalidStr})
    adatabase.updatePlayer(req.query.uid, updateData, onSuccessGrabUpdate, onFailGrabUpdate, req, res, null)
}

function onFailGrabLogout(req, res, msg) {
    res.json({
        result: false,
        'msg': msg
    });
}

// finally inform player of succesful logout
function onSuccessGrabUpdate(req, res, extraData) {
    res.json({
        result: true
    });
}

// should not be invoked for logout
function onFailGrabUpdate(msg, req, res) {
    res.json({
        result: false,
        'msg': msg
    });
}

// requests a match uid for the player
// validates token, grab pd and ensure state = 1
router.get('/reqmuid', function(req, res, next) {
    if (!utils.paramExists(req.query.uid) || !utils.paramExists(req.query.token)) {
        res.json({
            "result": false
        });
        return;
    }
    database.validate(req.query.token, onSuccessAuthRMUID, onFailAuthRMUID, req, res)
});

function onSuccessAuthRMUID(req, res) {
    database.grabPlayerData(req.query.uid, onSuccessGrabRMUID, onFailGrabRMUID, req, res, null)
}

// authentication fail
function onFailAuthRMUID(msg, req, res) {
    res.json({
        result: false,
        'msg': msg
    });
}

// TODO: better checks for existing pairs
function onSuccessGrabRMUID(data, req, res, extraData) {
    if (data.playerState == 1) {
        var exists = utils.hasMatchQue(req.query.uid)
        var muid = exists ? utils.getMatchQue(req.query.uid).muid : utils.grabMatchUID(req.query.uid)
        if (exists) utils.getMatchQue(req.query.uid).timestamp = utils.time(); // reset time on existing for new items
        return res.json({
            "result": true,
            "matchUID" : muid,
        });
    }
    res.json({
        "result": false
    });
}

// grab pd fail
function onFailGrabRMUID(msg, req, res) {
    res.json({
        result: false,
        'msg': msg
    });
}

// grab all loadouts given uid and token
router.get('/loadouts', function(req, res, next) {
    if (!utils.paramExists(req.query.uid) || !utils.paramExists(req.query.token)) {
        res.json({
            "result": false
        });
        return;
    }
    database.validate(req.query.token, onSuccessAuthLoadout, onFailAuthLoadout, req, res)
});

function onSuccessAuthLoadout(req, res) {
    loadoutdatabase.grabLoadouts({"UID" : req.query.uid}, onSuccessGrabLoadout, onFailGrabLoadout, req, res, null)
}

// authentication fail for loadout
function onFailAuthLoadout(msg, req, res) {
    res.json({
        result: false,
        'msg': msg
    });
}

// return all loadouts
function onSuccessGrabLoadout(data, req, res, extraData) {
    data.loadouts["result"] = true
    res.json(data.loadouts)
}

// failed grab loadouts
function onFailGrabLoadout(msg, req, res) {
    res.json({"result" : false, "msg" : msg})
}

// push new loadout given uid, token, index, data
router.get('/pushloadout', function(req, res, next) {
    if (!utils.paramExists(req.query.uid) || !utils.paramExists(req.query.token) || !utils.paramExists(req.query.data)) {
        res.json({
            "result": false
        });
        return;
    }
    database.validate(req.query.token, onSuccessAuthPushLoadout, onFailAuthLoadoutPushLoadout, req, res)
});

// grab loadout data
function onSuccessAuthPushLoadout(req, res) {
    loadoutdatabase.grabLoadouts({"UID" : req.query.uid}, onSuccessGrabPushLoadout, onFailGrabPushLoadout, req, res, null)
}

function onFailAuthLoadoutPushLoadout(msg, req, res) {
    res.json({"result" : false, "msg" : msg})
}

// check for loadouts < settings.maxLoadouts
// TODO: check for level restrictions
// push new loadout bruh i just wanna fucking stop writing code jesus fucking christ i hate coding so much
function onSuccessGrabPushLoadout(data,req, res) {
    if (data.loadouts.length >= settings.settings.settings.maxLoadouts) return res.json({"result" : false, "msg" : "Too many loadouts @ " + data.loadouts.length})
    //var prgld = utils.decodeJSON(data.loadouts[0]) // TODO: implement
    if (!utils.paramExists(req.query.index)) {
        loadoutdatabase.addLoadout({"UID" : req.query.uid, "Index" :  data.loadouts.length, "Type" : 1, "Data" : req.query.data},  onSuccessPushLoadout, onFailPushLoadout, req, res)
        return;
    }
    if (data.loadouts.length <= req.query.index) { //  not in loadouts
        loadoutdatabase.addLoadout({"UID" : req.query.uid, "Index" :  data.loadouts.length, "Type" : 1, "Data" : req.query.data},  onSuccessPushLoadout, onFailPushLoadout, req, res)
        return;
    }
    loadoutdatabase.modifyLoadout({"UID" : req.query.uid, "Index" :  req.query.index, "Type" : 1, "Data" : req.query.data},  onSuccessPushLoadout, onFailPushLoadout, req, res)
} 

function onFailGrabPushLoadout(msg, req, res) {
    res.json({"result" : false, "msg" : msg})
}

function onSuccessPushLoadout(req, res) {
    res.json({"result" : true})
}

function onFailPushLoadout(msg, req, res) {
    res.json({"result" : false, "msg" : msg})
}

// delete new loadout given uid, token, index
router.get('/deleteloadout', function(req, res, next) {
    if (!utils.paramExists(req.query.uid) || !utils.paramExists(req.query.token) || !utils.paramExists(req.query.index)) {
        res.json({
            "result": false
        });
        return;
    }
    database.validate(req.query.token, onSuccessAuthDeleteLoadout, onFailAuthDeleteLoadout, req, res)
});

// submit delete
function onSuccessAuthDeleteLoadout(req, res) {
    loadoutdatabase.deleteLoadout({"UID" : req.query.uid, "Index" : req.query.index, "Type" : 1},  onSuccessDeleteLoadout, onFailDeleteLoadout, req, res)
}

function onFailAuthDeleteLoadout(msg, req, res) {
    res.json({"result" : false, "msg" : msg})
}

function onSuccessDeleteLoadout(req, res) {
    res.json({"result" : true})
}

function onFailDeleteLoadout(msg, req, res) {
    res.json({"result" : false, "msg" : msg})
}

// modify loadout given uid, token, index, data
router.get('/deleteloadout', function(req, res, next) {
    if (!utils.paramExists(req.query.uid) || !utils.paramExists(req.query.token) || !utils.paramExists(req.query.index) || !utils.paramExists(req.query.data)) {
        res.json({
            "result": false
        });
        return;
    }
    database.validate(req.query.token, onSuccessAuthModifyLoadout, onFailAuthModifyLoadout, req, res)
});

// submit modify
function onSuccessAuthModifyLoadout(req, res) {
    loadoutdatabase.modifyLoadout({"UID" : req.query.uid, "Index" : req.query.index, "Data" : req.query.data}, onSuccesModifyLoadout, onFailModifyLoadout, req, res)
}

function onFailAuthModifyLoadout(msg, req, res) {
    res.json({"result" : false, "msg" : msg})
}

function onSuccesModifyLoadout(req, res) {
    res.json({"result" : true});
}

function onFailModifyLoadout(msg, req, res) {
    res.json({"result" : false, "msg" : msg})

}


module.exports = router;