/**
 * @author Sam Artuso <sam@highoctanedev.co.uk>
 */

var patchModel = {

    fields: {

        _id: {
            required: false,
            validate: function(val) {

                var err = { type: 'not_valid', field: '_id', error: { status: 400 }};

                if (typeof val !== 'string' || !(/^[0-9a-f]{24}$/i.test(val))) {
                    err.message = 'Value not valid.';
                    throw err;
                }
            }
        },

        name: {
            required: true,
            validate: function(val) {

                var err = { type: 'not_valid', field: 'name', error: { status: 400 }};

                if (typeof val !== 'string') {
                    err.message = 'Value not valid.';
                    throw err;
                };

                if(val.length < 1 || val.length > 255) {
                    err.message = 'This field should be at least 1 and at most 255 characters long.';
                    throw err;
                }
            },
            sanitize: function(val) { return val.trim(); }
        },

        seoName: {
            required: false,
            validate: function(val) {

                var err = { type: 'not_valid', field: 'seoName', error: { status: 400 }};

                if (typeof val !== 'string' || !(/^[a-z0-9\_]+$/i.test(val))) {
                    err.message = 'Value not valid.';
                    throw err;
                }

                if(val.length < 1 || val.length > 255) {
                    err.message = 'This field should be at least 1 and at most 255 characters long.';
                    throw err;
                }
            }
        },

        author: {
            required: true,
            validate: function (val) {

                var err = { type: 'not_valid', field: 'parameters', error: { status: 400 }};

                if (typeof val !== 'object') {
                    err.message = 'Value not valid.';
                    throw err;
                }

                if (!('name' in val) || typeof val.name !== 'string' ||
                    val.name.length < 1 || val.name.length > 255) {
                    err.message = 'Invalid author name.';
                    throw err;
                }

                if ('type' in val && val.type !== 'wordpress') {
                    err.message = 'Invalid author name.';
                    throw err;
                }

                if ('type' in val && 'wordpress' === val.type) {
                    if (!('wordpressId' in val)) {
                        err.message = 'Wordpress user ID not specified.';
                        throw err;
                    }
                }

                if ('wordpressId' in val) {
                    if (!('type' in val) || val.type !== 'wordpress') {
                        err.message = 'Invalid author object';
                        throw err;
                    }
                }
            },
            sanitize: function (val) {
                for (var key in val) {
                    if ('type' !== key && 'wordpressId' !== key && 'name' !== key) {
                        delete val[key];
                    }
                }
                if ('wordpressId' in val) {
                    val.wordpressId = parseInt(val.wordpressId);
                }
                return val;
            }
        },

        description: {
            required: true,
            validate: function(val) {

                var err = { type: 'not_valid', field: 'description', error: { status: 400 }};

                if (typeof val !== 'string') {
                    err.message = 'Value not valid.';
                    throw err;
                }

                if(val.length < 1 || val.length > 1023) {
                    err.message = 'This field should be at least 1 and at most 1023 characters long.';
                    throw err;
                }
            },
            sanitize: function(val) { return val.trim(); }
        },

        instructions: {
            required: true,
            validate: function(val) {

                var err = { type: 'not_valid', field: 'instructions', error: { status: 400 }};

                if (typeof val !== 'string') {
                    err.message = 'Value not valid.';
                    throw err;
                }

                if(val.length < 1 || val.length > 1023) {
                    err.message = 'This field should be at least 1 and at most 1023 characters long.';
                    throw err;
                }
            },
            sanitize: function(val) { return val.trim(); }
        },

        parameters: {
            required: false,
            validate: function(val) {

                var err = { type: 'not_valid', field: 'parameters', error: { status: 400 }};

                if (typeof val !== 'object') {
                    err.message = 'Value not valid.';
                    throw err;
                }
                for (var key in val) {
                    if (key !== 'a' && key !== 'b' && key !== 'c' && key !== 'd' && key !== 'e') {
                        err.message = 'Value not valid.';
                        throw err;
                    }
                    if (typeof val[key] !== 'string' || val[key].length < 1 || val[key] > 255) {
                        err.message = 'This field should be at least 1 and at most 255 characters long.';
                        err.parameter = key;
                        throw err;
                    }
                }
            },
            sanitize: function(val) {
                for (var key in val) {
                    if (key !== 'a' && key !== 'b' && key !== 'c' && key !== 'd' && key !== 'e') {
                        delete val[key];
                    }
                    val[key] = val[key].trim();
                }
                return val;
            }
        },

        inputs: {
            required: true,
            validate: function(val) {

                var err = { type: 'not_valid', field: 'inputs', error: { status: 400 }};

                if (val != 0 && val != 1 && val != 2) {
                    err.message = 'Value not valid.';
                    throw err;
                }
            },
            sanitize: function(val) {
                return parseInt(val);
            }
        },

        outputs: {
            required: true,
            validate: function(val) {

                var err = { type: 'not_valid', field: 'inputs', error: { status: 400 }};

                if (val != 0 && val != 1 && val != 2) {
                    err.message = 'Value not valid.';
                    throw err;
                }
            },
            sanitize: function(val) {
                return parseInt(val);
            }
        },

        soundcloud: {
            required: false,
            validate: function(val) {

                if ('undefined' === typeof val) {
                    return;
                }

                var err = { type: 'not_valid', field: 'soundcloud', error: { status: 400 }};

                if ('object' !== typeof val || val.constructor !== Array) {
                    err.message = 'Value not valid.';
                    throw err;
                }
                for (var i = 0, max = val.length; i < max; i++) {
                    if (typeof val[i] !== 'string') {
                        err.message = 'Value not valid.';
                        throw err;
                    }
                    // https://soundcloud.com/hoxtonowl/johan-larsby-conny-distortion
                    if (!/^https?:\/\/(?:www\.)?soundcloud\.com\/.+\/.+$/i.test(val[i])) {
                        err.message = 'URL does not seem a valid SoundCloud track.';
                        err.index = i;
                        throw err;
                    }
                }
            }
        },

        github: {
            required: false,
            validate: function(val) {

                if ('undefined' === typeof val) {
                    return;
                }

                var err = { type: 'not_valid', field: 'github', error: { status: 400 }};

                if ('object' !== typeof val || val.constructor !== Array) {
                    err.message = 'Value not valid.';
                    throw err;
                }
                for (var i = 0, max = val.length; i < max; i++) {
                    if (typeof val[i] !== 'string') {
                        err.message = 'Value not valid.';
                        throw err;
                    }
                    // https://github.com/pingdynasty/OwlPatches/blob/master/PhaserPatch.hpp
                    if (!/^https?:\/\/(?:www\.)?github\.com\/.+\/.+\/blob\/.+\/.+$/i.test(val[i])) {
                        err.message = 'URL does not seem a valid GitHub blob.';
                        err.index = i;
                        throw err;
                    }
                }
            }
        },

        cycles: {
            required: false,
            validate: function(val) {

                var err = { type: 'not_valid', field: 'cycles', error: { status: 400 }};

                if (val < 0) {
                    err.message = 'Value not valid.';
                    throw err;
                }
            },
            sanitize: function(val) {
                return Math.round(val);
            }
        },

        bytes: {
            required: false,
            validate: function(val) {

                var err = { type: 'not_valid', field: 'bytes', error: { status: 400 }};

                if (val < 0) {
                    err.message = 'Value not valid.';
                    throw err;
                }
            },
            sanitize: function(val) {
                return Math.round(val);
            }
        },

        tags: {
            required: false,
            validate: function(val) {

                var err = { type: 'not_valid', field: 'tags', error: { status: 400 }};

                if ('object' !== typeof val || val.constructor !== Array) {
                    err.message = 'Value not valid.';
                    throw err;
                }
                for (var i = 0, max = val.length; i < max; i++) {
                    if (typeof val[i] !== 'string') {
                        err.message = 'Value not valid.';
                        throw err;
                    }
                    if ('' === val) {
                        err.message = 'Value not valid.';
                        throw err;
                    }
                }
            },
            sanitize: function(val) {
                for (var i = 0, max = val.length; i < max; i++) {
                    val[i] = val[i].trim();
                }
                return val;
            }
        }
    },

    validate: function(patch) {

        for (var key in patchModel.fields) {

            var err = { type: 'not_valid', error: { status: 400 }};

            // Check if patch is an object
            if (typeof patch !== 'object') {
                err.message = 'Invalid data.';
                throw err;
            }

            if (typeof patch[key] === 'undefined') {
                // Check for required fields
                if (patchModel.fields[key].required === true) {

                    err.message = 'This field is required.';
                    err.type = 'field_required';
                    err.field = key;
                    throw err;
                }
            } else {
                // Validate single fields
                patchModel.fields[key].validate(patch[key]);
                if (patchModel.fields[key].sanitize) {
                    // if a sanitization function exist, call it and then revalidate
                    // just in case...
                    patch[key] = patchModel.fields[key].sanitize(patch[key]);
                    patchModel.fields[key].validate(patch[key]);
                }
            }
        }
    },

    sanitize: function(patch) {

        var keys = Object.keys(patchModel.fields);

        for (key in patch) {
            if (-1 === keys.indexOf(key)) {
                delete patch[key];
            }
        }

        return patch;
    },

    generateSeoName: function(patch) {
        return patch.name.replace(/[^a-z0-9]/i, '_');
    }
};

module.exports = patchModel;

// EOF