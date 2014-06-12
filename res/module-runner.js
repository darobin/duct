/*global Promise */

function duct (modules, resources, conf) {
    var context = {
            modules:    modules
        ,   resources:  resources
        ,   conf:       conf
        ,   doc:        document
        ,   start:  function (name) { console.log("> " + name);}
        ,   error:  function (name, err) { console.error("[ERROR] " + name + ": " + err);}
        }
    ,   seq = Promise.resolve()
    ;
    for (var k in modules) {
        (function (name, mod) {
            seq = seq.then(function () {
                    context.start(name);
                    mod.run(context);
                    return context;
                }).catch(function (err) {
                    context.error(name, err);
                });
        })(k, modules[k]);
    }
    seq.catch(function (err) {
        context.error("duct", err);
    });
}
duct;
