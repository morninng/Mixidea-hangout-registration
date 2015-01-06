
function RetrieveEventInfo(){
	console.log("check user");
	Parse.initialize("wxaNxdtmCOUJm8QHPYr8khYkFJiBTMvEnv1jCDZg", "OuSaCarL4ltnPsuwptJMBvoZ7v3071MCUE7Y5MfD");

	var appData = gadgets.views.getParams()['appData'];	
	console.log(appData);
	var appData_split = appData.split("_");
	var user_id = appData_split[0];
	var event_id = appData_split[1];
	console.log(user_id);
	console.log(event_id);

	var title_element = document.getElementById('feed_title');
	var event_element = document.getElementById('event_table');

	var query_user = new Parse.Query(MixideaUser);
	query_user.get(user_id).then(function(user_data){
		var first_name = user_data.get("FirstName");
		var last_name = user_data.get("LastName");
		title_element.innerHTML="<h1>" + first_name + last_name + " have succesfully created a followtin event</h1>";
		var query_event = new Parse.Query(MixideaEvent);
		return query_event.get(event_id);
	}).then(function(event_obj){
		var hangout_url = gapi.hangout.getHangoutUrl();
		console.log(hangout_url);
		event_obj.set("hangout_url",hangout_url);

		var event_title = event_obj.get("title");
		var event_description = event_obj.get("description");
		var event_title = event_obj.get("title");
		var event_date = event_obj.get("date");
		var event_time = event_obj.get("StartTime");

		var html_table_open = "<table border = '1'>"
		var html_event_title = "<tr><td>event name </td><td>" + event_title + "</td></tr>";
		var html_event_description = "<tr><td>event description </td><td>" + event_description + "</td></tr>";
		var html_event_schedule = "<tr><td>event schedule </td><td>" + event_date +  event_time + "</td></tr>";
		var html_table_close = "</table>"
		event_element.innerHTML = html_table_open + html_event_title + html_event_description +  html_event_schedule + html_table_close;
		return event_obj.save()

	}).then(function(){
		console.log("event has been registered to parse");
	});
 }


function update_feed(){
    console.log("participants added callback");

}


function init() {
  gapi.hangout.onApiReady.add(function(e){
    console.log("hangout api ready");
    if(e.isApiReady){

     console.log("call check user")
     RetrieveEventInfo();
    }
  });

  gapi.hangout.onParticipantsAdded.add(function(e){
    console.log("participants added")
  
  });

  gapi.hangout.onParticipantsChanged.add(function(e){
    console.log("participants changed")
    update_feed();
  });

  gapi.hangout.onParticipantsEnabled.add(function(e){
    console.log("participants enabled")
    update_feed();
  });

  gapi.hangout.onParticipantsDisabled.add(function(e){
    console.log("participants disabled")
    update_feed();
  });
};

