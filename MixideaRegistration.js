
	var parse_role_name = new Array("PrimeMinister","LeaderOpposition","MemberGovernment","MemberOpposition","ReplyPM","LOReply");
	var hangout_role_name = new Array("PrimeMinister","LeaderOpposition","MemberGovernment","MemberOpposition","ReplyPM","LOReply");
	var role_button_id = new Array("btn_PrimeMinister","btn_LeaderOpposition","btn_MemberGovernment","btn_MemberOpposition","btn_ReplyPM","btn_LOReply");
	var role_speaker = new Array("speaker_PrimeMinister","speaker_LeaderOpposition","speaker_MemberGovernment","speaker_MemberOpposition","speaker_ReplyPM","speaker_LOReply");

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

	this.local = {};
	this.local.current_speaker = null;
	this.local.Participant_Id = gapi.hangout.getLocalParticipantId();

	this.obj = {};	
	this.obj.event = null;
	this.info.event_type = "";
	this.ownrole = [];
	this.ownrole_number = [];


	this.participants_obj = [];
	this.participant_role = [];
	this.participants_profile = [];
	this.feed;
	this.canvas;

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

//	var Local_Participant_Id = gapi.hangout.getLocalParticipantId();
	console.log(" local participant id is" + self.local.Participant_Id);
	
	for(j=0;j<6;j++){
		self.participants_obj[j] = self.obj.event.get(parse_role_name[j]);
		if(self.participants_obj[j]){
			if(self.participants_obj[j].id == self.info.user_id){
				gapi.hangout.data.setValue( hangout_role_name[j], self.local.Participant_Id);
				//self.ownrole.push( hangout_role_name[j] );
				self.ownrole_number.push(j);
			}
		}
	}

	var f1 = function(){
		if(i<6){
			self.participants_obj[i] = self.obj.event.get(parse_role_name[i]);
			if(self.participants_obj[i]){
				gapi.hangout.data.setValue( hangout_role_name[i], self.local.Participant_Id);
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
	var participant_container = $("<div>");
	participant_container.attr({'align':'center'});

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
	var table_element = $("<table>");
	table_element.attr({'border': '1'});

	var table_caption_element = $("<caption>");
	table_caption_element.append("participants");

	table_header_row = $("<tr>"); 
	table_header_left = $("<th>"); 
	table_header_left.append("prop");
	table_header_right = $("<th>"); 
	table_header_right.append("opp");
	table_header_row.append(table_header_left);
	table_header_row.append(table_header_right);


	first_row = $("<tr>");
	first_row.append(eachfeed_td[0]);
	first_row.append(eachfeed_td[1]);
	second_row = $("<tr>");
	second_row.append(eachfeed_td[2]);
	second_row.append(eachfeed_td[3]);
	third_row = $("<tr>");
	third_row.append(eachfeed_td[4]);
	third_row.append(eachfeed_td[5]);

	table_element.append(table_caption_element);
	table_element.append(table_header_row);
	table_element.append(first_row);
	table_element.append(second_row);
	table_element.append(third_row);

	participant_container.append(table_element);
	$("div#common_feed").append(participant_container);
	self.PrepareDom_forPersonalFeed();
}

Mixidea_Event.prototype.PrepareDom_forPersonalFeed = function(){

	var self = this;

	var all_button_elements = $("<div/>");
	all_button_elements.attr({'align': 'center'});
	for(i=0;i <self.ownrole_number.length; i++){
		var one_button_element = $("<button/>");
		one_button_element.addClass('btn btn-success');
		one_button_element.attr({'id': role_button_id[self.ownrole_number[i]] });
		one_button_element.append("speaker as" + hangout_role_name[self.ownrole_number[i]]);
		all_button_elements.append(one_button_element);	
		all_button_elements.append("<br><br>");	
	}

	$("div#personal_feed").append("<h3>Click to be a speaker</h3>");
	$("div#personal_feed").append(all_button_elements);
	
	$("button#" + role_button_id[0] ).click(function(){
			console.log(hangout_role_name[0])
			gapi.hangout.data.submitDelta({
			"CurrentSpeakerId": self.local.Participant_Id,
			"CurrentSpeakerName": hangout_role_name[0]
			});
	})
	$("button#" + role_button_id[1] ).click(function(){
			console.log(hangout_role_name[1])
			gapi.hangout.data.submitDelta({
			"CurrentSpeakerId": self.local.Participant_Id,
			"CurrentSpeakerName": hangout_role_name[1]
			});
	})
	$("button#" + role_button_id[2] ).click(function(){
			console.log(hangout_role_name[2])
			gapi.hangout.data.submitDelta({
			"CurrentSpeakerId": self.local.Participant_Id,
			"CurrentSpeakerName": hangout_role_name[2]
			});
	})
	$("button#" + role_button_id[3] ).click(function(){
			console.log(hangout_role_name[3])
			gapi.hangout.data.submitDelta({
			"CurrentSpeakerId": self.local.Participant_Id,
			"CurrentSpeakerName": hangout_role_name[3]
			});
	})
	$("button#" + role_button_id[4] ).click(function(){
			console.log(hangout_role_name[4])
			gapi.hangout.data.submitDelta({
			"CurrentSpeakerId": self.local.Participant_Id,
			"CurrentSpeakerName": hangout_role_name[4]
			});
	})
	$("button#" + role_button_id[5] ).click(function(){
			console.log(hangout_role_name[5]);
			gapi.hangout.data.submitDelta({
			"CurrentSpeakerId": self.local.Participant_Id,
			"CurrentSpeakerName": hangout_role_name[5]
			});
	})

	self.DrawVideoFeed();

}

Mixidea_Event.prototype.DrawVideoFeed = function(){

	self = this;
	self.canvas = gapi.hangout.layout.getVideoCanvas();

	var hangout_shared_current_speaker = gapi.hangout.data.getValue('CurrentSpeakerId');
	if(hangout_shared_current_speaker){
		self.feed = gapi.hangout.layout.createParticipantVideoFeed(hangout_shared_current_speaker);
		self.canvas.setVideoFeed(feed);
		self.local.current_speaker = hangout_shared_current_speaker;
	}else{
		self.feed = gapi.hangout.layout.getDefaultVideoFeed();
		self.local.current_speaker = null;
	}

 	self.canvas.setVideoFeed(self.feed);
 	self.canvas.setWidth(400);
 	self.canvas.setPosition(3,3);
 	self.canvas.setVisible(true);
}

Mixidea_Event.prototype.RetrieveParticipantsData_on_Event_BP = function(){
}

Mixidea_Event.prototype.RetrieveParticipantsData_on_Event_discussion = function(){
}

Mixidea_Event.prototype.UpdateMixideaStatus = function(){

	self = this;
	check_hangoutid_for_each_role();

	var hangout_shared_current_speaker = gapi.hangout.data.getValue('CurrentSpeakerId');
	console.log(hangout_shared_current_speaker);
	if(self.local.current_speaker != hangout_shared_current_speaker){
		self.local.current_speaker  = hangout_shared_current_speaker;
 		self.canvas.setVideoFeed(hangout_shared_current_speaker);
	}
}

function init() {
  gapi.hangout.onApiReady.add(function(e){
    console.log("hangout api ready");
    if(e.isApiReady){
    	var mixidea_object = new Mixidea_Event();
    	gapi.hangout.data.onStateChanged.add(function(event) {
    	  	mixidea_object.UpdateMixideaStatus(event);
        });
    }
  });
}
