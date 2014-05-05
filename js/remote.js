if(!window.scriptHasRun) { 
	window.scriptHasRun = true; 
	var COMMAND_TOGGLE = 19;
	var COMMAND_GET_GROUP = 282;
	var MY_DEVICE_ID = 164;
	var  GROUP_SELECT_MODE = 100;
	var GROUP_NO_SELECTED = 0;
	var DIM_NO_SELECTED = 19;

	//var myurl = '/cronjobs/process.php';
	var myurl = '/cronjobs/70D455DC-ACB4-4525-8A85-E6009AE93AF4/process.php';

	var lastKey = null;
	window.addEvent('domready', function(){

		//launchFullScreen(document.documentElement) // the whole page	
		//toggleFullScreen(); does not allow auto :)
		
		//checkInstalled();

		$$('.click-down').removeEvents('mousedown');
		$$('.click-down').addEvent('mousedown', function(event){
			event.stop();
			var params = {caller: MY_DEVICE_ID, messtype: 'MESS_TYPE_REMOTE_KEY', remotekey: this.get("remotekey"), mouse: 'down'};
			callAjax (params) ;
		});	

		$$('.click-down').removeEvents('mouseup');
		$$('.click-down').addEvent('mouseup', function(event){
			event.stop();
			var params = {caller: MY_DEVICE_ID, messtype: 'MESS_TYPE_REMOTE_KEY', remotekey: this.get("remotekey"), mouse: 'up'};
			callAjax (params) ;
		});	

		$$('.click-up').removeEvents('click');
		$$('.click-up').addEvent('click', function(event){
			event.stop();
			if ($$('#group').get('myvalue') !=  GROUP_SELECT_MODE) {
				var commandvalue = 100;
				if (document.id('dim')) { 
					commandvalue = parseInt($$('#dim').get('myvalue'));
					if (commandvalue ==  DIM_NO_SELECTED) commandvalue = 100;
				}
				var params = {caller: MY_DEVICE_ID, messtype: 'MESS_TYPE_REMOTE_KEY', remotekey: this.get("remotekey"), commandvalue: commandvalue};
				resetSelection();
				this.addClass('group-select');
				callAjax (params) ;
			} else {
				this.toggleClass('group-select');
			}
		});	

		$$('#group li a').removeEvents('click');
		$$('#group li a').addEvent('click', function(event){
//			event.stop();
			//var params = {caller: MY_DEVICE_ID, messtype: 'MESS_TYPE_REMOTE_GROUP', remotekey: this.get("remotekey"), group:this.get('value')};
			var mbut = this.parentNode.parentNode.parentNode.firstChild;
			mbut.firstChild.textContent = ' '+this.text;
//			var params = {caller: MY_DEVICE_ID, messtype: 'MESS_TYPE_COMMAND', command: COMMAND_GET_GROUP, value:this.get('value').substring(1)};
			var selected = this.getAttribute('value');
			this.parentNode.parentNode.setAttribute('myvalue', selected);
			if (selected == GROUP_SELECT_MODE)  {			// Select Mode 
				mbut.removeClass('btn-info');
				mbut.addClass('btn-success');
			} else if (selected == GROUP_NO_SELECTED){
				mbut.addClass('btn-info');
				mbut.removeClass('btn-success');
				resetSelection();
			} else {
				mbut.addClass('btn-info');
				mbut.removeClass('btn-success');
			}
//			callAjax (params) ; 		// get group members here and set select
		});

		$$('#dim li a').removeEvents('click');
		$$('#dim li a').addEvent('click', function(event){
//			event.stop();
			//var params = {caller: MY_DEVICE_ID, messtype: 'MESS_TYPE_REMOTE_GROUP', remotekey: this.get("remotekey"), group:this.get('value')};
			var mbut = this.parentNode.parentNode.parentNode.firstChild;
			mbut.firstChild.textContent = ' '+this.text;
			var selected = this.getAttribute('value');
			this.parentNode.parentNode.setAttribute('myvalue', selected);
			//$$('#dim').set('value', selected);

			// now find all selected button and send dim value (Either selected over click or over group)
			var selection = [];
			var elArray = $$('.group-select');
			var arrayLength = elArray.length;
			if (arrayLength > 0 && selected != "19") {				// some selections
				for (var i = 0; i < arrayLength; i++) {
					selection.push(elArray[i].get('remotekey'));
				}
				var params = {caller: MY_DEVICE_ID, messtype: 'MESS_TYPE_MULTI_KEY', selection: selection, commandvalue: parseInt(selected)};
				callAjax (params) ;
				//alert ('Now all selected lights ('+sel+') in custom group will be set to same dim-value, optimize order (i.e. use X10 group dim)');
				// resetSelection(elArray); actually not here, but when toggling back to ???
			}
			if (selected == "19") {					// On/Off toggle
				mbut.addClass('btn-info');
				mbut.removeClass('btn-warning');
			} else {								// dim value
				if (arrayLength = 0) alert ('Please select light you want to dim or on/off together');
				mbut.removeClass('btn-info');
				mbut.addClass('btn-warning');
			}

			
			var d = this.getAttribute('value');
			var t = this.get('value');
//			callAjax (params) ;
		});
		
		//Dropdowns, either be command or scheme, if scheme Scommand, if with command then key needed as well 
		$$('.controlselect-button').removeEvents('change');
		$$('.controlselect-button').addEvent('change', function(event){
			event.stop();
			if (this.get('value').charAt(0) == 'S') {
				var params = {caller: MY_DEVICE_ID, messtype: 'MESS_TYPE_SCHEME', remotekey: this.get("remotekey"), scheme:this.get('value').substring(1)};
			} else {
				var params = {caller: MY_DEVICE_ID, messtype: 'MESS_TYPE_REMOTE_KEY', remotekey: this.get("remotekey"), command:this.get('value')};
			}
			callAjax (params) ;
		});	

		//this is the function that dropdown's button either schemes or commands
		$$('.jump-button').removeEvents('click');
		$$('.jump-button').addEvent('click', function(event){
			event.stop();
			if (this.getPrevious('.controlselect-button').value.charAt(0) == 'S') {
				var params = {caller: MY_DEVICE_ID, messtype: 'MESS_TYPE_SCHEME', scheme:this.getPrevious('.controlselect-button').value.substring(1)};
			} else {
				var params = {caller: MY_DEVICE_ID, messtype: 'MESS_TYPE_REMOTE_KEY', remotekey: this.get("remotekey"), command:this.getPrevious('.controlselect-button').value};
			}
			callAjax (params) ;

		//Run scheme button (
		$$('.scheme-button').removeEvents('click');
		$$('.scheme-button').addEvent('click', function(event){
			event.stop();
			var params = {caller: MY_DEVICE_ID, messtype: 'MESS_TYPE_SCHEME', scheme:this.get('value')};
			callAjax (params) ;
		});	

		//Run command button (
		$$('.command-button').removeEvents('click');
		$$('.command-button').addEvent('click', function(event){
			event.stop();
			var params = {caller: MY_DEVICE_ID, messtype: 'MESS_TYPE_COMMAND', command:this.get('value')};
			callAjax (params) ;
		});	

		});	
		

		// switching tabs
		$$('#myTab a').removeEvents('click');
		$$('#myTab a').addEvent('click', function(event){
			$$('#system-message').set('html', '');
			$$('#dim li a[value='+DIM_NO_SELECTED+']').fireEvent('click');
			$$('#group li a[value='+GROUP_NO_SELECTED+']').fireEvent('click');
			resetSelection();
		})
	});

	function launchFullScreen(element) {
		if(element.requestFullscreen) {
			element.requestFullscreen();
		} else if(element.mozRequestFullScreen) {
			element.mozRequestFullScreen();
		} else if(element.webkitRequestFullscreen) {
			element.webkitRequestFullscreen();
		} else if(element.msRequestFullscreen) {
			element.msRequestFullscreen();
		}
	}
	
	function callAjax (params) {
	
       var shoutsRequest = new Request.JSON({
				url: 	myurl,
				method: 'post',
				data: params,
				onRequest: function(){
					$$('#system-message').set('html', '');
					document.getElementById('spinner').style.display = 'block';
				},
				onSuccess: function(data)
				{
					processData(data);
					document.getElementById('spinner').style.display = 'none';
				},
				onError: function(text, error)
				{
					$$('#system-message').set('html', text+'</br>'+error);
					document.getElementById('spinner').style.display = 'none';
				},
			}
        ).send();
	};
	
		
	function callAjaxSync (params) {
	
       var shoutsRequest = new Request.JSON({
				url: 	myurl,
				method: 'post',
				data: params,
				async: false,
				onRequest: function(){
					$$('#system-message').set('html', '');
					document.getElementById('spinner').style.display = 'block';
				},
				onSuccess: function(data)
				{
					processData(data);
					document.getElementById('spinner').style.display = 'none';
				},
				onError: function(text, error)
				{
					$$('#system-message').set('html', text);
					document.getElementById('spinner').style.display = 'none';
				},
			}
        ).send();
	};

	function showMessage(message) {
		if (message.length > 0) {
			$$('#system-message').set('html','<div class="alert alert-message"><a data-dismiss="alert" class="close" href="#">&times</a>'+message+'</div>');
		}
	}
	
/*	function processData1(data) {

		var temp = new Array();
		var pos = data.indexOf("OK;");

		console.log(data);

		if (pos > 0) {	// not first position
			showAlert(data.substring(0,pos));
			data = data.substring(pos);
		}
		data.each(temp, function(arr) {
				var temp1 = new Array();
				temp1 = arr.split(' ');
				temp1.push(null);
				if (temp1[0].indexOf('OK') > -1) return;
				if (temp1[2] != null) 
				{
					//$('[remotekey=' + temp1[0] + ']').val(temp1[2]);
					$$('[remotekey=' + temp1[0] + ']').each(function(index){
							$(index).set('html',temp1[2]);
						});
				} else {
					$$('[remotekey=' + temp1[0] + ']').each(function(index){
							$(index).removeClass("off");
							$(index).removeClass("on");
							$(index).removeClass("error");
							$(index).removeClass("undefined");
							$(index).removeClass("unknown");
							$(index).addClass(temp1[1]);
						});
				}
				return (arr.length !== 0); // will stop running after "three"
			});
		};
	}*/
	
	function processData(data) {
				
		Object.each(data, function(item, key){
			// check for message
			if (key == 'message') {
				showMessage(item);
			}
			$$('[remotekey=' + item.remotekey + ']').each(function(index){
				if (typeof item.status !== 'undefined') {
					$(index).removeClass("off");
					$(index).removeClass("on");
					$(index).removeClass("error");
					$(index).removeClass("undefined");
					$(index).removeClass("unknown");
					$(index).addClass(item.status);
				} else if (typeof item.commandvalue !== 'undefined') {
					$(index).set('html',item.commandvalue);
				} 
			});
		});
	};
	
	function resetSelection() {
		$$('.group-select').each(function(el) {
			el.removeClass('group-select');
		});
	}
}