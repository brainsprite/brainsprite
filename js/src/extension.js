if (window.require) {
    window.require.config({
        map: {
            "*" : {
                "brainsprite": "nbextensions/brainsprite/widget",
            }
        }
    });
}

module.exports = {
    load_ipython_extension: function() {}
};
