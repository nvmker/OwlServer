/**
 * @author Martin Klang <mars@pingdynasty.com>
 * @author Sam Artuso <sam@highoctanedev.co.uk>
 */

/**
 * @namespace
 */
var HoxtonOwl;
if (!HoxtonOwl) {
    HoxtonOwl = {};
}

/**
 * Conveniently groups some utility functions to handle patches.
 *
 * @namespace
 */
HoxtonOwl.patchManager = {

    sortPatchesByName: function () {

        if ('name' === window.patchSortOrder()) {
            return;
        }
        window.patchSortOrder ('name');
        window.patches.sort(function (left, right) {
            return left.name.localeCompare(right.name);
        });
    },

    sortPatchesByCreationTimeUtc: function () {

        if ('creationTimeUtc' === window.patchSortOrder()) {
            return;
        }
        window.patchSortOrder('creationTimeUtc');
        window.patches.sort(function (left, right) {
            return right.creationTimeUtc - left.creationTimeUtc;
        });
    },

    /**
     * Fetches a file from GitHub.
     *
     * @param {string} url
     *     The URL.
     * @param {Function} callback(content, filename, url)
     *     A callback returned data will be passed to.
     * @param {number} startLineNum
     *     Selection start.
     * @param {number} endLineNum
     *     Selection end.
     */
    getGithubFile: function(url, callback, startLineNum, endLineNum) {

        // hack to see if this file is hosted on GitHub
        var urlParser = document.createElement('a');
        urlParser.href = url;
        if (urlParser.host != 'github.com' && urlParser.host != 'www.github.com') {

            var pieces = urlParser.pathname.split('/');
            var filename = pieces[pieces.length - 1];

            $.ajax({
                type:     "GET",
                url:      url,
                dataType: "text",
                success:  function(data) {
                    HoxtonOwl.patchManager.getGithubFile.count++;
                    callback(data, filename, url, false);
                },
                error: function(data) {
                    HoxtonOwl.patchManager.getGithubFile.count++;
                    callback('// This file could not be fetched because of an unexpected error.', filename, url, false);
                }
            });
            return;
        }

        startLineNum = (typeof startLineNum == "undefined") ? 1 : startLineNum;
        endLineNum = (typeof endLineNum == "undefined") ? 0 : endLineNum;

        // input:
        //
        // https://github.com/pingdynasty/OwlPatches/blob/master/Contest/ConnyPatch.hpp
        //                    [+++++++++] [++++++++]      [++++] [++++++++++++++++++++]
        //                    owner       repo            branch file path
        //
        // output:
        // https://api.github.com/repos/pingdynasty/OwlPatches/contents/Contest/ConnyPatch.hpp?ref=master
        //                              [+++++++++] [++++++++]          [++++++++++++++++++++]     [++++]
        //                              owner       repo                path                       branch

        var bits     = url.split('/');
        var repo     = bits.slice(3,5).join('/');
        var branch   = bits[6];
        var path     = bits.slice(7).join('/');
        var filename = bits[bits.length-1];
        var endpoint = 'https://api.github.com/repos/' + repo + '/contents/' + path + '?ref=' + branch;

        $.ajax({
            type:     "GET",
            url:      endpoint,
            dataType: "jsonp",
            success:  function(data) {
                HoxtonOwl.patchManager.getGithubFile.count++;
                if (typeof data.data.content != "undefined") {
                    if (data.data.encoding == "base64") {

                        var base64EncodedContent = data.data.content;
                        base64EncodedContent = base64EncodedContent.replace(/\n/g, "");
                        var content = window.atob(base64EncodedContent);
                        var contentArray = content.split("\n");
                        if (endLineNum == 0) {
                            endLineNum = contentArray.length;
                        }

                        callback(contentArray.slice(startLineNum - 1, endLineNum).join("\n"), filename, url);
                        return;
                    }
                }
                callback('// This file could not be fetched. Is it from a public GitHub repository?', filename);
            },
            error: function(data) {
                HoxtonOwl.patchManager.getGithubFile.count++;
                callback('// This file could not be fetched because of an unexpected error.', filename);
            }
        });
    },

    updatePatchParameters: function () {
        var patch = HoxtonOwl.patchManager.testPatch;
        if (patch) {
            $('[id^=patch-parameter-]:visible').each(function (i, el) {
                var p = el.id.substr(-1, 1).charCodeAt(0) - 97; // "a".charCodeAt(0) === 97
                var $el = $(el);
                patch.update(p, $el.find('.knob').val() / 100);
            });
        }
    },

    /**
     * Contains the code that operates the patches page.
     *
     * @param {Object[]} patches
     *     An array of objects that represent patches.
     * @param {string[]} authors
     *     The authors.
     * @param {string[]} tags
     *     The tags.
     */
    main: function(patches, authors, tags) {

        var that = this;
        var pm = HoxtonOwl.patchManager;

        that.selectedPatch = ko.observable();       // currently selected patch
        that.patches = ko.observableArray(patches); // all patches
        that.authors = ko.observableArray(authors); // all authors
        that.tags = ko.observableArray(tags);       // all tags

        that.search = ko.observable();              // one of 'all', 'author', 'tag', 'patch' or 'myPatches'
        that.searchItems = ko.observableArray();
        that.patchSortOrder = ko.observable('name');

        that.filteredPatches = ko.computed(function() {
            //console.log('filteredPatches');
            //console.log(that.searchItems());
            return ko.utils.arrayFilter(that.patches(), function(r) {
                //console.log(that.searchItems);
                if (that.searchItems.indexOf("All") > -1) {
                    //return true;
                    return r.published;
                }
                if (that.search() === "tag") {
                    for (i=0; i<r.tags.length; ++i) {
                        if(that.searchItems.indexOf(r.tags[i]) > -1) {
                            return true;
                        }
                    }
                } else if (that.search() === "author") {
                    return that.searchItems.indexOf(r.author.name) > -1;
                } else if (that.search() === 'myPatches') {
                    return that.searchItems.indexOf(r.author.name) > -1;
                }
                return false;
            });
        });

        that.filteredPatchAuthorNo = ko.computed(function () {
            var stringified;
            var distinctAuthors = [];
            for (var i = 0, max = filteredPatches().length; i < max; i++) {
                stringified = JSON.stringify(filteredPatches()[i].author); // not very performant, but should be ok
                if (distinctAuthors.indexOf(stringified) == -1) {
                    distinctAuthors.push(stringified);
                }
            }
            return distinctAuthors.length;
        });

        that.selectAllPatches = function(dummy, e) {

            //console.log('selectAllPatches');

            //pm.updateBreadcrumbs();

            HoxtonOwl.patchManager['sortPatchesBy' + e.currentTarget.id.split('-')[3]]();

            that.selectedPatch(null);
            that.search('all');
            that.searchItems.removeAll();
            that.searchItems.push('All');
        };

        that.selectFilter = function(item) {
            //console.log("select filter "+item+" searching "+that.search());
            if(that.search() === "author") {
                return selectAuthor(item);
            } else {
                return selectTag(item);
            }
        };

        that.selectAuthor = function(author) {

            //console.log(author);

            //pm.updateBreadcrumbs();

            that.selectedPatch(null);
            if(that.search() != "author") {
                that.search("author");
                that.searchItems.removeAll();
                that.searchItems.push(author);
            } else if (that.searchItems.indexOf(author) > -1) {
                that.searchItems.remove(author);
                if(that.searchItems().length === 0) {
                    that.searchItems.push("All");
                }
            } else {
                if (author === "All") {
                    that.searchItems.removeAll();
                    that.searchItems.push('All'); // added by Sam
                } else {
                    that.searchItems.remove("All");
                    that.searchItems.push(author);
                }
            }
        };

        that.selectTag = function(tag) {
            //console.log("select tag " + tag);

            // console.log("select tag ");
            // console.log(tag);

            that.selectedPatch(null);
            if (that.search() != "tag") {
                that.search("tag");
                that.searchItems.removeAll();
                that.searchItems.push(tag);
            } else if (that.searchItems.indexOf(tag) > -1) {
                that.searchItems.remove(tag);
                if(that.searchItems().length == 0) {
                    that.searchItems.push("All");
                }
            } else {
                if (tag === "All") {
                    that.searchItems.removeAll();
                    that.searchItems.push('All'); // added by Sam
                } else {
                    that.searchItems.remove("All");
                    that.searchItems.push(tag);
                }
            }
        };

        that.selectOnlyTag = function(tag) {
            //console.log('selectOnlyTag');
            that.searchItems.removeAll();
            selectTag(tag);
        };

        that.selectAllTags = function(tag) {

            //console.log('selectAllTags');
            //pm.updateBreadcrumbs();

            HoxtonOwl.patchManager.sortPatchesByName();
            selectTag('All');
        };

        that.selectOnlyAuthor = function(authorsPatch) {
            that.searchItems.removeAll();
            selectAuthor(authorsPatch.author.name);
        };

        that.selectAllAuthors = function(tag) {

            //console.log('selectAllAuthors');
            //pm.updateBreadcrumbs();

            HoxtonOwl.patchManager.sortPatchesByName();
            selectAuthor('All');
        };

        that.selectMyPatches = function() {

            HoxtonOwl.patchManager.sortPatchesByName();
            that.search('myPatches');
            var author = $('#wordpress-username').text();
            //console.log(author);
            that.searchItems.removeAll();
            that.selectedPatch(null);
            that.searchItems.push(author);

        },

        that.selectPatch = function(patch) {

            //console.log(patch);

            //pm.updateBreadcrumbs(patch);

            var patchId = patch._id;
            var apiClient = new HoxtonOwl.ApiClient();
            var pdGraphs = [];
            apiClient.getSinglePatch(patchId, function(patch) {


                if (name.name) {
                    name = name.name;
                }
                //console.log("select patch "+name);
                that.search("patch");
                that.searchItems.removeAll();
                $("#gitsource").empty();
                that.selectedPatch(patch);

                //var url = "https://api.github.com/repos/" + that.selectedPatch().repo + "/contents/" + that.selectedPatch().github;

                $('#github-files').empty();
                $('#git-code').hide();
                if (that.selectedPatch().github.length) {
                    for (var i = 0, max = that.selectedPatch().github.length; i < max; i++) {

                        pm.getGithubFile(that.selectedPatch().github[i], function(contents, filename, url, actuallyFromGitHub) {

                            var cnt;

                            if (typeof(actuallyFromGitHub) === 'undefined') {
                                actuallyFromGitHub = true;
                            }

                            if (0 === $('#github-files > ul').length) {
                                $('#github-files').html('<ul></ul>');
                            }
                            cnt = $('#github-files > ul > li').length;

                            cnt++;
                            $('#github-files > ul').append('<li><a href="#tabs-' + cnt + '">' + filename + '</a></li>');
                            $('#github-files').append('<div id="tabs-' + cnt + '"><pre class="prettyprint"></pre></div>');
                            if (actuallyFromGitHub) {
                                $('#github-files #tabs-' + cnt).prepend('<a href="' + url + '" target="_new" class="github-link">Open this file in GitHub</a>');
                            }

                            if (/\.pd$/.test(filename)) {
                                var p = pdfu.parse(contents);
                                var r = pdfu.renderSvg(p, {svgFile: false});
                                pdGraphs[cnt] = r;
                                $('body').append('<div id="svg-' + cnt + '"></div>');
                            } else {
                                $('#github-files pre.prettyprint').eq(HoxtonOwl.patchManager.getGithubFile.count - 1).text(contents);
                            }

                            if (HoxtonOwl.patchManager.getGithubFile.count == max) { // no more files to be loaded

                                // Pretty print source code
                                prettyPrint();
                                $('#github-files').tabs({ active: 0 }); // jQuery-UI tabs
                                $('#git-code').show();

                                // Render PD patches
                                for (var key in pdGraphs) {
                                    var $tab = $('#tabs-' + key);
                                    $tab.find('pre.prettyprint').remove();
                                    $('#svg-' + key).html(pdGraphs[key]).appendTo($tab);
                                }
                            }
                        });
                    }
                }

                if (patch.parameters) {
                    for (var key in patch.parameters) {
                        $('#patch-parameter-' + key).show();
                    }
                    knobify();
                }

                // Show build download links
                if (that.selectedPatch().sysExAvailable) {
                    $('.sysExDownloadLink').attr('href', apiClient.apiEndPoint + '/builds/' + that.selectedPatch()._id + '?format=sysx&amp;download=1');
                }

                if (that.selectedPatch().jsAvailable) {
                    $('.jsDownloadLink').attr('href', apiClient.apiEndPoint + '/builds/' + that.selectedPatch()._id + '?format=js&amp;download=1');
                }

                // Patch test
                var testOk = true;
                if (!window.AudioContext) {
                    $('#patch-test-container').html('Your browser does not support the HTML5 Web Audio API.');
                    testOk = false;
                }
                if (testOk && !that.selectedPatch().jsAvailable) {
                    $('#patch-test-container').html('JavaScript build not available for this patch.');
                    testOk = false;
                }
                if (testOk) {
                    $('#patch-test-init').click(function () {

                        $('#patch-test-init').attr('value', 'Loading patch...');
                        $('#patch-test-init').prop('disabled', true);

                        var deferred1 = $.getScript($('.jsDownloadLink').attr('href'));
                        var deferred2 = $.getScript('/wp-content/themes/hoxton-owl-2014/page-patch-library/js/webaudio.js');

                        $.when(deferred1, deferred2).done(function () {

                            $('#patch-test-init-container').hide();
                            $('#patch-test-inner-container').show();
                            $('.knob').val(50).trigger('change');

                            $('#patch-test-source').change(function (e) {
                                var $target = $(e.target);
                                var $audio = $('#patch-test-audio');
                                var val = $(e.target).val();
                                var audioSampleBasePath = '/wp-content/themes/hoxton-owl-2014/page-patch-library/audio/';
                                $audio.find('source').remove();
                                if ('_' !== val.substr(0, 1)) {
                                    var html = '<source src="' + audioSampleBasePath + val + '.mp3" type="audio/mpeg"><source src="' + audioSampleBasePath + val + '.ogg" type="audio/ogg">';
                                    $(html).appendTo($audio);
                                }
                                $audio[0].load();
                                if ('_' !== val.substr(0, 1)) {
                                    $audio[0].play();
                                    patch.useFileInput();
                                } else if ('_clear' === val) {
                                    HoxtonOwl.patchManager.testPatch.clearInput();
                                } else if ('_mic' === val) {
                                    HoxtonOwl.patchManager.testPatch.useMicrophoneInput();
                                }
                            });

                            HoxtonOwl.patchManager.testPatch = owl.dsp();
                            var patch = HoxtonOwl.patchManager.testPatch;
                            HoxtonOwl.patchManager.updatePatchParameters();
                            patch.useFileInput();

                        });
                    });
                }

                // Show compile patch button:
                $('.compile-patch-container').css('display', 'none');
                var isAdmin = false;
                var $isAdmin = $('#wordpress-user-is-admin');
                if ($isAdmin) {
                    isAdmin = $isAdmin.text() == 1;
                }

                var authorWpId = null;
                $wpUserId = $('#wordpress-user-id');
                if ($wpUserId) {
                    authorWpId = $wpUserId.text();
                }

                // Patch compile button
                var github = that.selectedPatch().github;
                if (github && github.length && (isAdmin || that.selectedPatch().author.wordpressId == authorWpId)) {
                    $('tr.compile-patch-container').css('display', 'table-row');
                    $('span.compile-patch-container').css('display', 'inline');
                } else {
                    $('span.compile-patch-container').remove();
                }

            });
        };

        that.soundcloud = ko.computed(function() {
            if(that.selectedPatch() && that.selectedPatch().soundcloud && that.selectedPatch().soundcloud.length) {

                var iframeSrcs = [];
                for (var i = 0, max = that.selectedPatch().soundcloud.length; i < max; i++) {
                    iframeSrcs.push(
                        "https://w.soundcloud.com/player/?url=" +
                        encodeURIComponent(that.selectedPatch().soundcloud[i]) +
                        "&amp;auto_play=false&amp;hide_related=false&amp;show_comments=true&amp;show_user=true&amp;show_reposts=false&amp;visual=true"
                    );
                }
                return iframeSrcs;

            } else {
                return "";
            }
        });

        ko.applyBindings(that);

        /* patch compilation section */

        $('#compile-tabs').tabs();
        $('#compile-dialog-btn-done').click(function () {
            $('#compile-dialog').dialog('close');
            window.location.reload();
        });
        $(document).on('click', '.compileLink', function(e) {

            var target = 'sysx';
            if ($(e.target).hasClass('js')) {
                target = 'js';
            }

            if (!confirm('Are you sure you want to build this patch (' + target + ' target)?')) {
                return false;
            }

            $('#compile-dialog').dialog({
                width: 600,
                modal: true,
                closeOnEscape: false
            });
            $('#compile-dialog textarea').empty().text('Please wait...');

            var apiClient = new HoxtonOwl.ApiClient();
            apiClient.compilePatch($('#selected-patch-id').text(), target, function (data) {

                if (data.success === true) {
                    $('#compile-dialog textarea').first().text('Patch compiled successfully.');
                    $('#tabs-stdout textarea').text(data.stdout);
                    $('#tabs-stderr textarea').text(data.stderr);
                } else {
                    $('#compile-dialog textarea').first().text('Patch compilation failed. Please check the logs for errors.');
                    $('#tabs-stdout textarea').text(data.responseJSON.stdout);
                    $('#tabs-stderr textarea').text(data.responseJSON.stderr);
                }
            });

            return false;
        });

        /* end of patch compilation section */

        var url = location.pathname;
        var matches = url.match(/^\/patch-library\/patch\/.+\/?$/g);
        if (matches) {
            var seoName = url.split('/')[3];
            var apiClient = new HoxtonOwl.ApiClient();
            apiClient.getSinglePatchBySeoName(seoName, selectPatch);
        } else {
            selectTag("All");
            that.search("all");
            HoxtonOwl.patchManager.sortPatchesByCreationTimeUtc();
        }
    },

    /**
     * Navigates to a patch page.
     *
     * @param  {HoxtonOwl.Patch} patch
     *     The patch to view.
     */
    openPatch: function(patch) {
        location = '/patch-library/patch/' + patch.seoName;
    },

    /**
     * Navigates to the patch edit page.
     *
     * @param  {HoxtonOwl.Patch} patch
     *     The patch to edit.
     */
    editPatch: function(patch) {
        location = '/edit-patch/' + patch.seoName;
    },

    /**
     * Deletes a patch.
     *
     * @param  {HoxtonOwl.Patch} patch
     *     The patch to delete.
     */
    deletePatch: function(patch) {

        if (confirm('Are you sure you want to delete this patch?')) {

            var pm = HoxtonOwl.patchManager;
            var apiClient = new HoxtonOwl.ApiClient();
            apiClient.deletePatch(patch._id, function (success) {
                if (success) {
                    alert('Patch deleted successfully.');
                    location = '/patch-library';
                } else {
                    alert('Unexpected error. Patch could not be deleted.');
                }
            });
        }
    },

    /**
     * Adds a new patch
     */
    addPatch: function() {
        location = '/add-patch/';
    },

    //updateBreadcrumbs: function(patch) {
    //    $('#breadcrumbs li').slice(2).remove();
    //    if (patch) {
    //        document.title = 'The OWL | ' + patch.name;
    //        $('#breadcrumbs').append('<li><a href="/patch-library/" rel="category tag">Patches</a></li><li class="separator"> / </li><li>' + patch.name + '</li>');
    //    } else {
    //        $('#breadcrumbs').append('<li><strong>Patches</strong></li>');
    //        document.title = 'The OWL | Patch Library';
    //    }
    //}
};

HoxtonOwl.patchManager.getGithubFile.count = 0;

$(function() {

    var pm = HoxtonOwl.patchManager;
    var apiClient = new HoxtonOwl.ApiClient();
    apiClient.getAllPatches(pm.main);

});

// EOF
