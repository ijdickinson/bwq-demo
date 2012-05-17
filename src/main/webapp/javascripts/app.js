var BwqDemo = function() {
    var LDA = "http://environment.data.gov.uk";
    var bwPage = 0;

    /** Module initialization */
    var init = function() {
        loadBathingWaters();
        $("#bw-select-action").click( selectBathingWaters );
    };

    /** Load the bathing waters from the environment.data.gov.uk API */
    var loadBathingWaters = function() {
        LDA_API.fetchPage( {url: LDA + "/doc/bathing-water",
                            onSuccess: renderBathingWaters,
                            onError: function( e) {alert( e );},
                            options: {_view: "bathing-water",
                                      _pageSize: 5,
                                      _page: bwPage,
                                      _properties: ["latestProfile.webResImage",
                                                    "latestSampleAssessment.sampleDateTime.inXSDDateTime"].join(","),
                                     } } );
    };

    /** render the bathing waters into the carousel */
    var renderBathingWaters = function( data, context ) {
        $.each( data, function( i, bw ) {
            var bwId = bw.eubwidNotation;

            var caption = sprintf( "<span class='orbit-caption' id='%s-caption'>", bwId );
            caption = caption + sprintf( "<h3>Bathing water at %s</h3>", bw.name._value );
            caption = caption + sprintf( "<div>Latest water quality assessment: %s on %s</div>",
                                         bw.latestSampleAssessment.sampleClassification.name._value,
                                         bw.latestSampleAssessment.sampleDateTime.inXSDDateTime
                                         );
            caption = caption + "</span>";

            $("#bathing-waters").parent().append( caption );

            var html = sprintf( "<img src='%s' alt='' data-caption='#%s-caption'/>",
                    bw.latestProfile.webResImage, bwId );
            $("#bathing-waters").append( html );
        } );

        showCarousel();
    };

    /** Display the image carousel */
    var showCarousel = function() {
        $("#bathing-waters").removeClass( "hidden" )
                            .orbit( {
                "bullets" : true,
                "animation" : "horizontal-push"
        });

    };

    /** Pick a different selection of bathing waters to display */
    var selectBathingWaters = function( e ) {
        e.preventDefault();
        bwPage = Math.round( Math.random() * 102 );

        // probably an easier way to do this ...
        $("#bathing-waters").parent().empty().html("<div id='bathing-waters' class='hidden'></div>");
        loadBathingWaters();
    };

    /* Module exports */
    return {
        init: init
    };
}();

// initialise the module when jQuery is ready
$(function() {
    BwqDemo.init();
});



