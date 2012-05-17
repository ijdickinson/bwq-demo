/**
 * Utilities for interacting with a remote LDA end-point.
 *
 * This code should be kept separate from client- or application
 * specific code, so that it can be re-used on other projects.
 *
 * Ian Dickinson, ian@epimorphics.com
 * v0.1
 * 7 March 2012
 *
 * Changelog:
 *
 */
"use strict";

var LDA_API = function() {
    /** Largest page we can retrieve */
    var MAX_PAGE = 200;

    /** Fetch JSON data from the given URL, and either invoke the success or error callback */
    var fetchJSON = function( url, options, onSuccess, onError, context ) {
        var ctx = context || {};

        $.ajax($.extend(ctx, {
            url : url,
            dataType : 'json',
            data : options,
            success : onSuccess,
            error : onError
        }));
    };

    /**
     * Extract the contents of a payload returned from a linked
     * data API endpoint. If an error occurs, call the onError callback
     * with two arguments: a message and a data item, and then return null.
     * @param data The message payload
     * @param onError Optional callback to invoke in case of error.
     */
    var msgContent = function( data, onError ) {
        if (! isLinkedDataAPIPayload( data )) {
            if (onError) {
                onError.call( data, "This value does not appear to be from a linked data API instance:" );
            }
            return null;
        }
        else {
            var result = data.result;
            return isSingleItemPayload( result ) ? result.primaryTopic : result.items;
        }
    };

    /** Return true if an object appears to be a return payload from an LDA endpoint */
    var isLinkedDataAPIPayload = function( obj ) {
        return obj.format == "linked-data-api";
    };

    /**
     * Return true if a payload contains a single item description. If false,
     * it contains an array of item descriptions
     */
    var isSingleItemPayload = function( obj ) {
        return obj.primaryTopic != null;
    };

    /**
     * Fetch a single page of results from the given LDA endpoint.
     *
     * @param args Hash of arguments
     *
     * Expected args:
     * * url - end-point URL
     * * onSuccess - callback to invoke if data returned successfully. Should take
     *               two arguments, data and context
     * * onError - callback to invoke if data not returned successfully
     *
     * Optional args:
     * * options - will be passed to JQuery Ajax call
     */
    var fetchPage = function( args ) {
        var onError = args.onError;

        fetchJSON( args.url,
                   args.options,
                   function( result ) {
                        var data = msgContent( result, onError );
                        if (data) {
                            args.onSuccess.call( this, data, result.result );
                        }
                   },
                   onError,
                   args.context);
    };

    /**
     * Fetch all results from a list end-point, which may involve multiple
     * Ajax calls to get all pages.
     *
     * @param args Hash of arguments
     *
     * Expected arguments:
     * * url - the LDA end-point URL
     *
     * Optional arguments:
     * * onSuccess - callback to invoke if data is retrieved successfully. Will
     *               be passed an array of all data items in the order they were
     *               retrieved from the end-point
     * * each - callback to invoke on each data item as it is retrieved. This callback
     *          will only get single items, so it will be invoked multiple times per
     *          page for a list endpoint.
     * * onError - callback to invoke if an error occurs during processing
     * * options - hash of options to pass to the underlying JQuery Ajax call
     * * _page - page number to start from; defaults to zero
     * * _pageSize - number of items per page to retrieve
     * * context - object which will be part of the Ajax callback context. E.g. passing
     *             context: {foo: "bar"} will mean that `this.foo` will return "bar"
     *             in the callback.
     */
    var fetchAll = function( args ) {
        var allData = [];
        var onAllSuccess = args.onSuccess;

        // set default page size, is overridden by page size in options
        args.options = $.extend( {_pageSize: MAX_PAGE}, args.options );

        var worker = function( data, context ) {
            var values = $.isArray( data ) ? data : [data];

            if (args.each) {
                $.each( values, args.each );
            }

            if (onAllSuccess) {
                append( allData, values );
            }

            if (context.next) {
                delete args._pageSize;  // will now be baked into the context.next URL
                fetchPage( $.extend( args, {url: context.next} ) );
            }
            else {
                if (onAllSuccess) {
                    onAllSuccess.call( args, allData );
                }
            }
        };

        // start by retrieving the first page
        fetchPage( $.extend( args, {onSuccess: worker} ) );
    };

    /**
     * Extend array a by copying to the end of a the contents of array b.
     * @param a An array, which will be side-effected to add the contents of b
     * @param b An array, which will not be changed
     */
    var append = function( a, b ) {
        for (var i = 0; i < b.length; i++) {
            a.push( b[i] );
        }
    };

    /* exports from module */
    return {
        fetchAll: fetchAll,
        fetchPage: fetchPage,
        msgContent: msgContent,
        fetchJSON: fetchJSON
    };
}();
