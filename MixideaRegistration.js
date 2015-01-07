
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
	this.ownrole = {};
	this.SetEventURL();

	this.participants_obj = [];
	this.participant_role = [];
	this.participants_profile = [];


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
			self.RetrieveParticipantsData_on_Event_NA();
			break;
		case "BP":
			self.RetrieveParticipantsData_on_Event_BP();
			break;
		case "discussion":
			self.RetrieveParticipantsData_on_Event_discussion();
			break;
		default: 
			self.RetrieveParticipantsData_on_Event_NA();
	}

}

Mixidea_Event.prototype.RetrieveParticipantsData_on_Event_NA = function(){
	var self = this;

	var Local_Participant_Id = gapi.hangout.getLocalParticipantId();
	console.log(" local participant id is" + Local_Participant_Id);

	var parse_role_name = new Array("PrimeMinister","LeaderOpposition","MemberGovernment","MemberOpposition","ReplyPM","LOReply");
	var hangout_role_name = new Array("PrimeMinister","LeaderOpposition","MemberGovernment","MemberOpposition","ReplyPM","LOReply");
	

	self.participants_obj[0] = self.obj.event.get("PrimeMinister");
	if(self.participants_obj[0]){
		if(self.participants_obj[0].id == self.info.user_id){
			console.log("setvalue of local participant");
			gapi.hangout.data.setValue( "RoleID_PM", Local_Participant_Id);
			self.ownrole["PM"] = true;
		}
	}

	var f1 = function(){
		if(i<6){
			self.participants_obj[i] = self.obj.event.get(parse_role_name[i]);
			if(self.participants_obj[i]){
				gapi.hangout.data.setValue( hangout_role_name[i], Local_Participant_Id);
				var user_query = new Parse.Query(MixideaUser);
				user_query.equalTo("objectId", self.participants_obj[i].id);
				var query_promise = user_query.find({
					success: function(participant_o){
						self.participants_profile[i] = {"FirstName":participant_o[0].get("FirstName"),
										   "LastName":participant_o[0].get("LastName"),
										   "Profile_picture":participant_o[0].get("Profile_picture")
										   };
						i++;
					}
				})
				query_promise.done(f1);
			}else{
				self.participants_profile[i] = {"FirstName":"no one apply",
										"LastName":"-",
										"Profile_picture":"#"
										};
				i++;
				f1();
			}
		}else if(i == 6){
			console.log("retrieving participant object finish");
			self.prepareAppDOM_for_NA();
		}
	}
	var i=0;
	f1();
}

Mixidea_Event.prototype.prepareAppDOM_for_NA = function(){

	var self = this;
	var eachfeed_td = {};
	var eachfeed_element = {};
	var profile_pict_element = {};
	var profile_name_element = {};
	var role_name = new Array("PM","LO","MG","MO","PMR","LOR");

	for(i=0;i<6;i++){
		eachfeed_td[i] = $("<td>");
		eachfeed_element[i] = $("<div>");
		eachfeed_element[i].attr({'id': role_name[i]});
		profile_pict_element[i] = $("<img>");
		profile_pict_element[i].attr({'src': self.participants_profile[i].Profile_picture});
		profile_name_element[i] = $("<p>");
		profile_name_element[i].append( self.participants_profile[i].FirstName + self.participants_profile[i].LastName );
		eachfeed_element[i].append(profile_pict_element[i]);
		eachfeed_element[i].append(profile_name_element[i]);
		eachfeed_td[i].append(eachfeed_element[i]);
		console.dirxml(eachfeed_td[i]);
	}
	table_element = $("<table>");
	table_element.attr({'border': '1'});
	first_row = $("<tr>");
	first_row.append(eachfeed_td[0]);
	first_row.append(eachfeed_td[1]);
	second_row = $("<tr>");
	second_row.append(eachfeed_td[2]);
	second_row.append(eachfeed_td[3]);
	third_row = $("<tr>");
	third_row.append(eachfeed_td[4]);
	third_row.append(eachfeed_td[5]);

	table_element.append(first_row);
	table_element.append(second_row);
	table_element.append(third_row);

	console.dirxml(table_element);
	$("span#feed").append(table_element);

}

Mixidea_Event.prototype.RetrieveParticipantsData_on_Event_BP = function(){
}

Mixidea_Event.prototype.RetrieveParticipantsData_on_Event_discussion = function(){
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

