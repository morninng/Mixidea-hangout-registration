
	var parse_role_name = new Array("PrimeMinister","LeaderOpposition","MemberGovernment","MemberOpposition","ReplyPM","LOReply");
	var hangout_role_name = new Array("PrimeMinister","LeaderOpposition","MemberGovernment","MemberOpposition","ReplyPM","LOReply");
	var role_button_id = new Array("btn_PrimeMinister","btn_LeaderOpposition","btn_MemberGovernment","btn_MemberOpposition","btn_ReplyPM","btn_LOReply");
	var role_speaker = new Array("speaker_PrimeMinister","speaker_LeaderOpposition","speaker_MemberGovernment","speaker_MemberOpposition","speaker_ReplyPM","speaker_LOReply");

	var hangout_POI_role = new Array("Poi_PM","Poi_LO","Poi_MG","Poi_MO","PoiRPM","Poi_LOR");
	var poi_button_name = new Array("bt_Poi_PM","bt_Poi_LO","bt_Poi_MG","bt_Poi_MO","bt_PoiRPM","bt_Poi_LOR");
	var hangout_POI_RoleID_Key = new Array("RoleID_PM","RoleID_LO","RoleID_MG","RoleID_MO","RoleID_RPM","RoleID_RLO");

//	enum ROUND_MODE(SPEAKER, DISCUSSION,AUDIENCE,POI_TAKEN_SPEAKER, POE_TAKEN_AUDIENE, POI_SPEAKER);

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
	this.local.current_personalfeed_ui = null;
	this.local.Participant_Id = gapi.hangout.getLocalParticipantId();
	this.local.ui_mode = "";	// speaker, discussion, poi_taken_speaker, audience. poi_taken_audience

	this.obj = {};	
	this.obj.event = null;
	this.info.event_type = "";
	this.ownrole = [];
	this.ownrole_number = [];
	this.participants_hangoutid_array = [];
	this.participants_hangoutid_array = gapi.hangout.getParticipants();

	this.participants_obj = [];
	this.participant_role = [];
	this.participants_profile_EachRole = [];
	this.feed;
	this.canvas = gapi.hangout.layout.getVideoCanvas();

	//initial setting 
	this.SetEventURL();
	this.Check_OwnRole_and_Share();

	this.RetrieveParticipantsData_on_Event_NA();
	//this.prepareDOM_ParticipantField_NA();

	this.PrepareDom_forPersonalFeed();
	this.DrawVideoFeed();

}

/////////////initial setting ///////////

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
		return event_obj.save();
		
	}).then(function(){
		console.log("event has been registered to parse");
	});
}

Mixidea_Event.prototype.Check_OwnRole_and_Share = function(){
	var self = this;
	console.log(" local participant id is" + self.local.Participant_Id);
	for(j=0;j<6;j++){
		self.participants_obj[j] = self.obj.event.get(parse_role_name[j]);
		if(self.participants_obj[j]){
			if(self.participants_obj[j].id == self.info.user_id){
				gapi.hangout.data.setValue( hangout_role_name[j], self.local.Participant_Id);
				self.ownrole_number.push(j);
			}
		}
	}
}

Mixidea_Event.prototype.RetrieveParticipantsData_on_Event_NA = function(){
	var self = this;

	var f1 = function(){
		if(i<6){
			self.participants_obj[i] = self.obj.event.get(parse_role_name[i]);
			if(self.participants_obj[i]){
				gapi.hangout.data.setValue( hangout_role_name[i], self.local.Participant_Id);
				var user_query = new Parse.Query(MixideaUser);
				user_query.equalTo("objectId", self.participants_obj[i].id);
				var query_promise = user_query.find({
					success: function(participant_o){
						self.participants_profile_EachRole[i] = {"FirstName":participant_o[0].get("FirstName"),
										   "LastName":participant_o[0].get("LastName"),
										   "Profile_picture":participant_o[0].get("Profile_picture")
										   };
						i++;
					}
				})
				query_promise.done(f1);
			}else{
				self.participants_profile_EachRole[i] = {"FirstName":"no one apply",
										"LastName":"-",
										"Profile_picture":"#"
										};
				i++;
				f1();
			}
		}else if(i == 6){
			console.log("retrieving participant object finish");
			self.prepareDOM_ParticipantField_NA();
			return;
		}
	}
	var i=0;
	f1();
}



Mixidea_Event.prototype.prepareDOM_ParticipantField_NA = function(){

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
		profile_pict_element[i].attr({'src': self.participants_profile_EachRole[i].Profile_picture});
		profile_name_element[i] = $("<p>");
		profile_name_element[i].append( self.participants_profile_EachRole[i].FirstName + self.participants_profile_EachRole[i].LastName );
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

}

Mixidea_Event.prototype.PrepareDom_forPersonalFeed = function(){

	var hangout_shared_current_POI_speaker = gapi.hangout.data.getValue('CurrentPoiId');
	var hangout_shared_current_speaker = gapi.hangout.data.getValue('CurrentSpeakerId');

	if(hangout_shared_current_POI_speaker && self.hangout_id_exist(hangout_shared_current_POI_speaker)){
		self.PrepareDom_forPersonalFeed_PoiListener_Audience();	
	
	}else if(hangout_shared_current_speaker  && self.hangout_id_exist(hangout_shared_current_speaker)){
		self.PrepareDom_forPersonalFeed_Listener();
	
	}else{
		self.PrepareDom_forPersonalFeed_Discussion();
	}
}



//personal feed drawing
Mixidea_Event.prototype.PrepareDom_forPersonalFeed_Discussion = function(){

	var self = this;

	$("div#personal_control").html("");

	var StartSpeech_button_elements = $("<div/>");
	StartSpeech_button_elements.attr({'align': 'center'});
	for(i=0;i <self.ownrole_number.length; i++){
		var one_button_element = $("<button/>");
		one_button_element.addClass('btn btn-success');
		one_button_element.attr({'id': role_button_id[self.ownrole_number[i]] });
		one_button_element.append("speaker as" + hangout_role_name[self.ownrole_number[i]]);
		StartSpeech_button_elements.append(one_button_element);	
		StartSpeech_button_elements.append("<br><br>");	
	}

	$("div#personal_control").append("<h3>Click to be a speaker</h3>");
	$("div#personal_control").append(StartSpeech_button_elements);
	
	$("button#" + role_button_id[0] ).click(function(){
			console.log(hangout_role_name[0])
			gapi.hangout.data.submitDelta({
			"CurrentSpeakerId": self.local.Participant_Id,
			"CurrentSpeakerRole": hangout_role_name[0]
			});
			self.PrepareDom_forPersonalFeed_Speaker();
	})
	$("button#" + role_button_id[1] ).click(function(){
			console.log(hangout_role_name[1])
			gapi.hangout.data.submitDelta({
			"CurrentSpeakerId": self.local.Participant_Id,
			"CurrentSpeakerRole": hangout_role_name[1]
			});
			self.PrepareDom_forPersonalFeed_Speaker();
	})
	$("button#" + role_button_id[2] ).click(function(){
			console.log(hangout_role_name[2])
			gapi.hangout.data.submitDelta({
			"CurrentSpeakerId": self.local.Participant_Id,
			"CurrentSpeakerRole": hangout_role_name[2]
			});
			self.PrepareDom_forPersonalFeed_Speaker();
	})
	$("button#" + role_button_id[3] ).click(function(){
			console.log(hangout_role_name[3])
			gapi.hangout.data.submitDelta({
			"CurrentSpeakerId": self.local.Participant_Id,
			"CurrentSpeakerRole": hangout_role_name[3]
			});
			self.PrepareDom_forPersonalFeed_Speaker();
	})
	$("button#" + role_button_id[4] ).click(function(){
			console.log(hangout_role_name[4])
			gapi.hangout.data.submitDelta({
			"CurrentSpeakerId": self.local.Participant_Id,
			"CurrentSpeakerRole": hangout_role_name[4]
			});
			self.PrepareDom_forPersonalFeed_Speaker();
	})
	$("button#" + role_button_id[5] ).click(function(){
			console.log(hangout_role_name[5]);
			gapi.hangout.data.submitDelta({
			"CurrentSpeakerId": self.local.Participant_Id,
			"CurrentSpeakerRole": hangout_role_name[5]
			});
			self.PrepareDom_forPersonalFeed_Speaker();
	})
	self.local.current_personalfeed_ui = "Discussion";
}


//personal feed drawing
Mixidea_Event.prototype.PrepareDom_forPersonalFeed_Speaker = function(){

	var self = this;
	$("div#personal_control").html("");
	
	var CompleteSpeech_elements = $("<div/>");
	CompleteSpeech_elements.attr({'align': 'center'});

	var complete_button_element = $("<button/>");
	complete_button_element.addClass('btn btn-primary');
	complete_button_element.attr({'id': 'CompleteSpeech'});
	complete_button_element.append("complete your speech");

	CompleteSpeech_elements.append("<h3>Click to finish speach</h3>");
	CompleteSpeech_elements.append(complete_button_element);
	$("div#personal_control").append(CompleteSpeech_elements);

	$("button#CompleteSpeech").click(function(){
		console.log("complete speech");
		gapi.hangout.data.submitDelta({
			"CurrentSpeakerId": "",
			"CurrentSpeakerName": ""
		});
		$("div#personal_control").html("");
		self.PrepareDom_forPersonalFeed_Discussion();
	});


	var PoiFeed_elements = $("<div/>");
	PoiFeed_elements.attr({'align':'left'});
	var ul_poi_user_elements = $("<ul/>");


	for(i=0;i <6; i++){
		var role_flag = gapi.hangout.data.getValue(hangout_POI_role[i]);
		if(role_flag){
			var poi_role_li = $("<li/>");
			var poi_button = $("<button/>");
			poi_button.attr({'id': poi_button_name[i]});
			poi_button.addClass('btn btn-success');
			poi_button.append('TakePoi');
			poi_role_li.append(poi_button);
			poi_role_li.append(self.participants_profile_EachRole[i].Profile_picture);
			poi_role_li.append(self.participants_profile_EachRole[i].FirstName);
			poi_role_li.append(self.participants_profile_EachRole[i].LastName);
			ul_poi_user_elements.append(poi_role_li);
		}
	}

	//繰り返し設定予定

	$("button#" + poi_button_name[0] ).click(function(){
			console.log(poi_button_name[0]);
			var poi_speaker_id = hangout.data.get(hangout_POI_RoleID_Key[0]);
			gapi.hangout.data.submitDelta({
			"CurrentPoiId": poi_speaker_id,
			"CurrentSpeakerRole": self.participants_profile_EachRole[0].FirstName + self.participants_profile_EachRole[0].LastName
			});
			self.PrepareDom_forPersonalFeed_PoiListener_speaker();
	})

	self.local.current_personalfeed_ui = "Speaker";

}
//personal feed drawing
Mixidea_Event.prototype.PrepareDom_forPersonalFeed_Listener = function(){

	var self = this;
	$("div#personal_control").html("");
	
	var Poi_element = $("<div/>");
	Poi_element.attr({'align': 'center'});
	var Poi_button = $("<div/>");
	Poi_button.attr({'align': 'center'});	

	var poi_button_element = $("<button/>");
	poi_button_element.addClass('btn btn-primary');
	poi_button_element.attr({'id': 'Poi'});
	poi_button_element.append("Poi!!");
	$("div#personal_control").append(poi_button_element);

	$("button#Poi").click(function(){
		console.log("poi")
		poi_button_element.html("");
		poi_button_element.attr({'id': 'Poi_cancel'});
		poi_button_element.append("Cancel Poi!!");
		gapi.hangout.data.setValue(
			hangout_POI_role[self.local.ownrole_number], self.local.Participant_Id
		);
	});

	$("button#Poi_cancel").click(function(){
		console.log("poi_cancel");
		poi_button_element.html("");
		poi_button_element.attr({'id': 'Poi'});
		gapi.hangout.data.setValue(
			hangout_POI_role[self.local.ownrole_number], null
		);
	});

	self.local.current_personalfeed_ui = "Listener";
}

//personal feed drawing
Mixidea_Event.prototype.PrepareDom_forPersonalFeed_PoiSpeaker = function(){
	self.local.current_personalfeed_ui = "PoiSpeaker";

}
//personal feed drawing
Mixidea_Event.prototype.PrepareDom_forPersonalFeed_PoiListener_Audience = function(){
	self.local.current_personalfeed_ui = "PoiListener_Audience";
}
//personal feed drawing
Mixidea_Event.prototype.PrepareDom_forPersonalFeed_PoiListener_speaker = function(){
	var self = this;
	$("div#personal_control").html("");
	
	var PoiFinish_elements = $("<div/>");
	PoiFinish_elements.attr({'align': 'center'});

	var PoiFinish_button_element = $("<button/>");
	PoiFinish_button_element.addClass('btn btn-primary');
	PoiFinish_button_element.attr({'id': 'PoiFinish'});
	PoiFinish_button_element.append("Close Poi Speech");

	PoiFinish_elements.append("<h3>Click to Close Poi speach</h3>");
	PoiFinish_elements.append(PoiFinish_button_element);
	$("div#personal_control").append(PoiFinish_elements);

	$("button#PoiFinish").click(function(){
		console.log("Close Poi speech");
		gapi.hangout.data.submitDelta({
		"CurrentPoiId": null,
		"CurrentSpeakerRole": null
		});

		$("div#personal_control").html("");
		self.PrepareDom_forPersonalFeed_Speaker();
	})
	
	self.local.current_personalfeed_ui = "PoiListener_speaker ";

}

//video feed
Mixidea_Event.prototype.DrawVideoFeed = function(){

	self = this;
	var hangout_shared_current_POI_speaker = gapi.hangout.data.getValue('CurrentPoiId');
	var hangout_shared_current_speaker = gapi.hangout.data.getValue('CurrentSpeakerId');

	if(hangout_shared_current_POI_speaker && self.hangout_id_exist(hangout_shared_current_POI_speaker)){
		self.feed = gapi.hangout.layout.createParticipantVideoFeed(hangout_shared_current_POI_speaker);
		self.local.current_speaker = hangout_shared_current_POI_speaker;


	}else if(hangout_shared_current_speaker  && self.hangout_id_exist(hangout_shared_current_speaker)){
			self.feed = gapi.hangout.layout.createParticipantVideoFeed(hangout_shared_current_speaker);
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

Mixidea_Event.prototype.hangout_id_exist = function(in_id){

	self = this;
	var i = 0;
	for(i=0;i<self.participants_hangoutid_array.length; i++){
		if(self.participants_hangoutid_array[i].id == in_id){
			return true;
		}
	}
	return false;

}

Mixidea_Event.prototype.UpdateMixideaStatus = function(){

	self = this;
	var hangout_shared_current_POI_speaker = gapi.hangout.data.getValue('CurrentPoiId');
	var hangout_shared_current_speaker = gapi.hangout.data.getValue('CurrentSpeakerId');

//////update video feed//////

// PoiSpeakerを設定するべきで、現在Poiスピーカーが設定されていない
	if(hangout_shared_current_POI_speaker && self.hangout_id_exist(hangout_shared_current_POI_speaker)){
		if(hangout_shared_current_POI_speaker != self.local.current_speaker){
			self.feed = gapi.hangout.layout.createParticipantVideoFeed(hangout_shared_current_POI_speaker);
			self.local.current_speaker = hangout_shared_current_POI_speaker;
			self.canvas.setVideoFeed(self.feed);
		}
	}
//Speakerを設定するべきで、現在Speakerが設定されていない
	else if( hangout_shared_current_speaker  && self.hangout_id_exist(hangout_shared_current_speaker )){
		if( hangout_shared_current_speaker != self.local.current_speaker){
			self.feed = gapi.hangout.layout.createParticipantVideoFeed(hangout_shared_current_speaker);
			self.local.current_speaker = hangout_shared_current_speaker;
			self.canvas.setVideoFeed(self.feed);
		}
	}
//Discussioモード設定するべきで、現在Speakerが設定されている
	else{
		if(self.local.current_speaker){
			self.feed = gapi.hangout.layout.getDefaultVideoFeed();
			self.local.current_speaker = null;
			self.canvas.setVideoFeed(self.feed);
		}
	}

//////update personal ui //////
// PoiSpeakerを設定するべきで、Poiスピーカーがログインしている
	if(hangout_shared_current_POI_speaker && self.hangout_id_exist(hangout_shared_current_POI_speaker)){
		
		//POIスピーカーのとき
		if(hangout_shared_current_POI_speaker  == self.local.Participant_Id){
			if(current_personalfeed_ui != "POI_speaker"){
				self.PrepareDom_forPersonalFeed_PoiListener_speaker();	
			}	
		//スピーカーのとき
		}else if(hangout_shared_current_speaker == self.local.Participant_Id){
			if(current_personalfeed_ui != "PoiListener_speaker"){
				self.PrepareDom_forPersonalFeed_PoiListener_speaker();
			}
		//その他のAudience
		}else{
			if(current_personalfeed_ui != "PoiListener_Audience"){
				self.PrepareDom_forPersonalFeed_PoiListener_Audience();	
			}
		}
	}

//Speakerを設定するべきで、現在Speakerがログインしている
	else if(hangout_shared_current_speaker  && self.hangout_id_exist(hangout_shared_current_speaker)){
		//スピーカーのとき
		if(hangout_shared_current_speaker == self.local.Participant_Id){
			if(current_personalfeed_ui != "Speaker"){
				self.PrepareDom_forPersonalFeed_Speaker();
			}
		//その他のAudience
		}else{
			if(current_personalfeed_ui != "Listener"){
				self.PrepareDom_forPersonalFeed_Listener();
			}
		}
	}
//Discussioモード設定するべきで、現在Speakerが設定されている
	else{
		if(current_personalfeed_ui != "Discussion"){
			self.PrepareDom_forPersonalFeed_Discussion();
		}
	}

//////////update local setting/////////
	if(hangout_shared_current_POI_speaker){
		self.local.current_speaker = hangout_shared_current_POI_speaker;
	}else{
		self.local.current_speaker = hangout_shared_current_speaker;
	}
}


//add

Mixidea_Event.prototype.ParticipantsAdded = function(added_participants){

	console.log(" participant added");
	var participant_array = added_participants.participants;

	if(!participant_array){ return;}

	for(i=0;i<participant_array.length; i++){
		console.log(participant_array[i].id);
	}
}
//remove

Mixidea_Event.prototype.ParticipantsRemoved = function(removed_participants){
	console.log(" participant removed");
	var participant_array = removed_participants.participants;

	if(!participant_array){ return;}

	for(i=0;i<participant_array.length; i++){
		console.log(participant_array[i].id);
	}
}
//change

Mixidea_Event.prototype.ParticipantsChanged = function(changed_participants){

	self = this;
	console.log("participant changed");
	self.participants_hangoutid_array = changed_participants.participants;

	if(!self.participants_hangoutid_array ){ return;}

	for(i=0;i<self.participants_hangoutid_array.length; i++){
		console.log(participant_array[i].id);
	}
}
//Enable
Mixidea_Event.prototype.EnableParticipants = function(enabled_participants){

	console.log(" participant enabled");
	var enabled_participant_array = enabled_participants.enabledParticipants;
	for(i=0;i<enabled_participant_array.length; i++){
		console.log(enabled_participant_array[i].id);
	}
}


//disable
Mixidea_Event.prototype.ParticipantsDisabled = function(disabled_participants){

	console.log("participant disabled");
	var participant_array = disabled_participants.participants;

	if(!participant_array){ return;}

	for(i=0;i<participant_array.length; i++){
		console.log(participant_array[i].id);
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

        gapi.hangout.onParticipantsAdded.add(function(participant_add) {
          mixidea_object.ParticipantsAdded(participant_add);
        });

        gapi.hangout.onParticipantsRemoved.add(function(participant_removed) {
          mixidea_object.ParticipantsRemoved(participant_removed);
        });

        gapi.hangout.onParticipantsChanged.add(function(participant_change) {
          mixidea_object.ParticipantsChanged(participant_change);
        });

        gapi.hangout.onEnabledParticipantsChanged.add(function(enabled_participant) {
          mixidea_object.EnableParticipants(enabled_participant);
        });

        gapi.hangout.onParticipantsDisabled.add(function(disabled_participant) {
          mixidea_object.ParticipantsDisabled(disabled_participant);
        });
    }
  });
}

