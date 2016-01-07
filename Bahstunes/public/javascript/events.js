var UPDATED_EVENTS = [];

/**
 * Toggle color of attend button to demonstrate the user would like to attend. 
 *	User not added to database unless they save it
 *	Also toggles whether or not save button is disabled
 *
 */
$(document).ready(function() {
	$('.attend_btn button.btn').on('click', function(e) {
		$(this).toggleClass('btn-warning');
		var changed = $(".btn-warning").map(function() {return 1;}).get();
		(changed.length != 0) ? $('#events_save_changes').removeClass('disabled') : 
								$('#events_save_changes').addClass('disabled');
	});
});



/**
 * Add or remove events depending on 'type'
 *
 * @param {Object} Type of save that is being completed
 */	
function SaveEventChanges(type) {
	UPDATED_EVENTS = [];
	$(".btn-warning").map(function() {
			var arr = $(this).dataByPrefix("_");
			UPDATED_EVENTS.push(arr);
	});
	$('#savingChanges').modal('show');
	$.ajax({
  		type: "POST",
  		async: true,
  		url: (type == "new") ? "/attendEvents" : "/removeEvents",
  		data: {data:UPDATED_EVENTS},
	}).done(function(resp) {
		window.location = resp.redirect;
	});

}


/**
 * Get all data attributes with specific prefix.
 *
 * @param {Object} prefix to use.
 */	
$.fn.dataByPrefix = function( pr ){
	var d=this.data(), r=new RegExp("^"+pr), ob={};
  	for(var k in d) if(r.test(k)) ob[k]=d[k];
  	return ob;
};

