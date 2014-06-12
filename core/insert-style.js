
exports.run = function (ctx) {
    if (!ctx.configuration.insertStyle) return;
    ctx.conf.insertStyle.forEach(function (res) {
        if (!ctx.resources[res]) throw new Error("Resource not found: " + res);
        $("<style></style>")
            .text(ctx.resources[res])
            .appendTo($("head", ctx.doc));
    });
};
