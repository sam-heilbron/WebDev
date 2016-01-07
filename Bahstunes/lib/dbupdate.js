var request = require('request');
var cheerio = require('cheerio');
/* 
 *	Script to Update "Performances" collection in database
 * 	
 *	Scrapes info off of various websites.
 * 	Should be the only file needed to edit if we want to access more sites info
 */
 
var DB_INFO = [];
var DONE_FLAG = 0;
var t = "t";
function COMPLETE(cb, arr) {
	console.log("COMPLETED WEB SCRAPING");
	DONE_FLAG = 1;
}
 
 
/************************************************************************************************************************/
/****************************************************** STEP 1 **********************************************************/
/************************************************************************************************************************/
function JohnnyDs_helper(cb, arr) {
	if(arr.length == 82) cb(ThunderRoadClub, null);
	else {
		request(arr[0], function(error, response, html){
        	if(!error){
            	var $ = cheerio.load(html);
            	var d, object, p="";
            	d = JSON.parse($('div.pageContentBody script').text());
            	if((d[0].startDate != undefined) && (d[0].performer != undefined)) {
            		var performers = d[0].performer;
            		for(var i in performers) {p += (performers[i].name + ((i==performers.length-1)?"":" / "))}
            		var date = d[0].startDate.split(/[:|[T]|-| ]/);
            		var dt = new Date(parseInt(date[0]), parseInt(date[1])-1, parseInt(date[2]), parseInt(date[3]), parseInt(date[4]), 0);
            		var et = new Date(dt);
            		et.setHours ( dt.getHours() + 2);
        			object = {
        				"_performer":p,
        				"_location":"Johnny D's: " + d[0].location.address, 
        				"_start":dt.toISOString(),
        				"_end":et.toISOString()
        			};
        			DB_INFO.push(object);
        		}
        		JohnnyDs_helper(cb, arr.slice(1,arr.length));
        	}
    	});
    }
}


function JohnnyDs(cb, arr) {
	console.log("johnny ds");
	var urls2visit = []
	homeurl = 'http://johnnyds.tunestub.com/shows.cfm';
	request(homeurl, function(error, response, html){
        if(!error){
            var $ = cheerio.load(html);
            $('div.pageContent ul.showListing').find('li').each(function(){
            	var alink = $(this).children().first().children().first().attr("href");
                urls2visit.push(alink);
            });
            cb(Toad, urls2visit);
        }
    });
} 
 
/************************************************************************************************************************/
/****************************************************** STEP 2 **********************************************************/
/************************************************************************************************************************/ 


function Toad(cb, arr) {
	console.log("toad: cambridge");
	var url = "http://www.toadcambridge.com/calendar";
	request(url, function(error, response, html){
        if(!error){
            var $ = cheerio.load(html);
            var Month = $('select#tec-events-month option[selected]').attr('value');
            $('table.tec-calendar tbody').find('tr').each(function(){
            	$(this).find('td.tec-thismonth.tec-future').each(function() {
            		var Day = $(this).find('div.daynum.tec-event').text();
            		$(this).find('div.tec-event.cat_Events').each(function() {
            			var time = $(this).find('span').text().split(/[: ]/);
            			var dt = new Date(2015, (parseInt(Month) -1), Day, parseInt(time[0]) + ((time[2]=="pm")?12:0), time[1], 0);
            			if(dt != "Invalid Date") {
            				var et = new Date(dt);
            				et.setHours ( dt.getHours() + 2);
            				object = {
        						"_performer":$(this).find('a').text(),
        						"_location":"Toad: 1912 Mass Ave Cambridge, MA 02140",
        						"_start": dt.toISOString(),
        						"_end":et.toISOString()
        					};
        					DB_INFO.push(object);
            			}
            		});
            	});	
            });
            cb(COMPLETE, null); 
        }
    });	

}


/************************************************************************************************************************/
/****************************************************** STEP 3 **********************************************************/
/************************************************************************************************************************/ 

function ThunderRoadClub(cb, arr) {
	console.log("thunder road club");
	url = 'http://thunderroadclub.com/events/';
	request(url, function(error, response, html){
        if(!error){
            var $ = cheerio.load(html);
            $('div.tribe-events-loop.vcalendar').find('div.hentry.vevent').each(function(){
            	var c = $(this).find('div.eventContent');
            	var d_text = c.find('span.date-start.dtstart').text().split(/[: ]/);
            	var dt = new Date(2015, 11 , d_text[2], parseInt(d_text[4]) + ((d_text[6]=="pm")?12:0), d_text[5], 0);
            	var name = c.find('h2.entry-title.summary a.url').text(); //still need to remove /t and /r
            	if(dt != "Invalid Date") {
            		var et = new Date(dt);
            		et.setHours ( dt.getHours() + 2);
            		object = {
        				"_performer":name,
        				"_location":"Thunder Road Club: 379 Somerville Ave, Somerville, MA",
        				"_start": dt.toISOString(),
        				"_end": et.toISOString()
        			};
        			DB_INFO.push(object);
        		}
            });
            cb(null, null);
        }
    });	
}




/************************************************************************************************************************/
/******************************************************* INIT ***********************************************************/
/************************************************************************************************************************/

/* Main function to update info */
/* Return array of infomation to be added to db using {upsert, true} so duplicates aren't added */
function update(callback) {
	console.log("Update function called");
	JohnnyDs(JohnnyDs_helper, null);
	
	//check every 5 seconds that operation is complete  	
  	var refreshId = setInterval(function() {
  		if (DONE_FLAG == 1) {callback(DB_INFO); clearInterval(refreshId);}
	}, 5000);
	
}


exports.run = update;
