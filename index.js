
var jquery = require("jquery")
,   isArray = require("isarray")
,   duct = {
        nowModules:     null
    ,   onloadModules:  null
    ,   $:              jquery
    ,   doc:            document
    ,   conf:           null
    }
;

function extractConfiguration () {
    if (duct.conf) return;
    duct.conf = {};
    try {
        jquery("script[type='application/duct+json']")
            .each(function () {
                jquery.extend(duct.conf, JSON.parse($(this).text()));
            });
    }
    catch (e) {
        // XXX error
    }
}

function runPipe (pipe) {
    var step = 0
    ,   doNext = function () {
            if (step === pipe.length) return;
            step++;
            try {
                pipe[step - 1](duct, doNext);
            }
            catch (e) {
                // XXX error
            }
        }
    ;
    doNext();
}

// these get run ASAP (e.g. to avoid FOUC)
//  the DOM may not be available
exports.now = function (mods) {
    if (!mods) return;
    duct.nowModules = isArray(mods) ? mods : [mods];
    extractConfiguration();
    runPipe(duct.nowModules);
};

// these get run at load
exports.onload = function (mods) {
    if (!mods) return;
    duct.onloadModules = isArray(mods) ? mods : [mods];
};


jquery(function () {
    extractConfiguration();
    runPipe(duct.onloadModules);
});
