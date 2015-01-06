
function check_hangoutid_for_each_role(){

	var PM_id = gapi.hangout.data.getValue("RoleID_PM");
	console.log("PM_id is " + PM_id);
	var LO_id = gapi.hangout.data.getValue("RoleID_LO");
	console.log("LO_id is " + LO_id);
	var MG_id = gapi.hangout.data.getValue("RoleID_MG");
	console.log("MG_id is " + MG_id);
	var MO_id = gapi.hangout.data.getValue("RoleID_MO");
	console.log("MO_id is " + MO_id);
	var RPM_id = gapi.hangout.data.getValue("RoleID_RPM");
	console.log("RPM_id is " + RPM_id);
	var RLO_id = gapi.hangout.data.getValue("RoleID_RLO");
	console.log("RLO_id is " + RLO_id);
} 


function Mixidea_Event(){

	Parse.initialize("wxaNxdtmCOUJm8QHPYr8khYkFJiBTMvEnv1jCDZg", "OuSaCarL4ltnPsuwptJMBvoZ7v3071MCUE7Y5MfD");
	var appData = gadgets.views.getParams()['appData'];	
	console.log(appData);
	var appData_split = appData.split("_");

	this.info = {};
	this.info.user_id = appData_split[0];
	this.info.event_id = appData_split[1];
	console.log(this.info.user_id);
	console.log(this.info.event_id);

	this.obj = {};	
	this.obj.event = null;
	this.info.event_type = "";
	this.SetEventURL();
}

Mixidea_Event.prototype.SetEventURL = function(){

	var self = this;

	var query_event = new Parse.Query(MixideaEvent);
	query_event.get(self.info.event_id).then(function(event_obj){
		self.obj.event = event_obj;

		var hangout_url = event_obj.get("hangout_url");
		console.log(hangout_url);
		if(!hangout_url){
			hangout_url = gapi.hangout.getHangoutUrl();
			event_obj.set("hangout_url", hangout_url);
			console.log(hangout_url);
		}
		return event_obj.save()
	}).then(function(){
		console.log("event has been registered to parse");
		self.ShareUserData_on_Event();
	});
}


Mixidea_Event.prototype.ShareUserData_on_Event = function(){

	var self = this;
	self.info.event_type = self.obj.event.get("event_type");

	switch(self.info.event_type){
		case "NA":
			self.ShareUserData_on_Event_NA();
			break;
		case "BP":
			self.ShareUserData_on_Event_BP();
			break;
		case "discussion":
			self.ShareUserData_on_Event_discuss();
			break;
		default: 
			self.ShareUserData_on_Event_NA();
	}

}

Mixidea_Event.prototype.ShareUserData_on_Event_NA = function(){
	var self = this;

	var Local_Participant_Id = gapi.hangout.getLocalParticipantId();
	console.log(" local participant id is" + Local_Participant_Id);

	var participants = [];
	var participant_role = [];

	var participant_PM = self.obj.event.get("PrimeMinister");
	if(participant_PM){
		participants.push(participant_PM);
		if(participant_PM.id == self.info.user_id){
			console.log("setvalue of local participant");
			gapi.hangout.data.setValue( "RoleID_PM", Local_Participant_Id);

		}
	}

}


Mixidea_Event.prototype.ShareUserData_on_Event_BP = function(){
}

Mixidea_Event.prototype.ShareUserData_on_Event_discussion = function(){
}


Mixidea_Event.prototype.UpdateMixideaStatus = function(){
	check_hangoutid_for_each_role()
}


function init() {
  gapi.hangout.onApiReady.add(function(e){
    console.log("hangout api ready");
    if(e.isApiReady){
    	var mixidea_object = new Mixidea_Event();

    	gapi.hangout.data.onStateChanged.add(function(stateChangedEvent) {
    	  	mixidea_object.UpdateMixideaStatus();
        });
    	
    }
  });

};

