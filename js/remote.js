
if(!window.scriptHasRun) { 
	window.scriptHasRun = true; 
	var COMMAND_TOGGLE = 19;
	var COMMAND_GET_GROUP = 282;
	var COMMAND_GET_VALUE = 136;
	var MY_DEVICE_ID = 164;
	var  GROUP_SELECT_MODE = 100;
	var GROUP_NO_SELECTED = 0;
	var DIM_NO_SELECTED = 19;

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

		$$('.btndropdown li a').removeEvents('click');
		$$('.btndropdown li a').addEvent('click', function(event){
			//event.stop();
			var mbut = this.parentNode.parentNode.parentNode.firstChild;
			mbut.firstChild.textContent = this.text+' ';
			var selected = this.getAttribute('value');
			this.parentNode.parentNode.setAttribute('myvalue', selected);
			if (selected.charAt(0) == 'S') {
				var params = {caller: MY_DEVICE_ID, messtype: 'MESS_TYPE_SCHEME', remotekey: this.parentNode.parentNode.get("remotekey"), scheme:selected.substring(1)};
			} else if (selected.charAt(0) == 'C') {
				var params = {caller: MY_DEVICE_ID, messtype: 'MESS_TYPE_REMOTE_KEY', remotekey: this.parentNode.parentNode.get("remotekey"), command:selected.substring(1)};
			} else {
				var params = {caller: MY_DEVICE_ID, messtype: 'MESS_TYPE_REMOTE_KEY', remotekey: this.parentNode.parentNode.get("remotekey"), commandvalue:selected};
			}
			callAjax (params) ;
		});

		$$('#group li a').removeEvents('click');
		$$('#group li a').addEvent('click', function(event){
//			event.stop();
			var mbut = this.parentNode.parentNode.parentNode.firstChild;
			mbut.firstChild.textContent = ' '+this.text;
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
				resetSelection();
				var params = {caller: MY_DEVICE_ID, messtype: 'MESS_TYPE_COMMAND', command: COMMAND_GET_GROUP, commandvalue: this.getAttribute('value').substring(1)};
				callAjax (params) ; 		// get group members here and set select
			}
		});

		
		$$('#dim li a').removeEvents('click');
		$$('#dim li a').addEvent('click', function(event){
//			event.stop();
			var mbut = this.parentNode.parentNode.parentNode.firstChild;
			mbut.firstChild.textContent = ' '+this.text;
			var selected = this.getAttribute('value');
			this.parentNode.parentNode.setAttribute('myvalue', selected);

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
		});
		
		//Dropdowns, either be command or scheme, if scheme Scommand, if with command then key needed as well 
		// Update same as latest button dropdown, allow S C or Value
		$$('.controlselect-button').removeEvents('change');
		$$('.controlselect-button').addEvent('change', function(event){
			event.stop();
			var selected = this.get('value');
			if (selected.charAt(0) == 'S') {
				var params = {caller: MY_DEVICE_ID, messtype: 'MESS_TYPE_SCHEME', remotekey: this.get("remotekey"), scheme:selected.substring(1)};
			} else if (selected.charAt(0) == 'C') {
				var params = {caller: MY_DEVICE_ID, messtype: 'MESS_TYPE_REMOTE_KEY', remotekey: this.get("remotekey"), command:selected.substring(1)};
			} else {
				var params = {caller: MY_DEVICE_ID, messtype: 'MESS_TYPE_REMOTE_KEY', remotekey: this.get("remotekey"), commandvalue:selected};
			}
			callAjax (params) ;
		});	

		//this is the function that dropdown's button either schemes or commands
		// Update same as latest button dropdown, allow S C or Value
		$$('.jump-button').removeEvents('click');
		$$('.jump-button').addEvent('click', function(event){
			event.stop();
			var selected = this.getPrevious('.controlselect-button').value;
			if (selected.charAt(0) == 'S') {
				var params = {caller: MY_DEVICE_ID, messtype: 'MESS_TYPE_SCHEME', scheme:selected.substring(1)};
			} else if (selected.charAt(0) == 'C'){
				var params = {caller: MY_DEVICE_ID, messtype: 'MESS_TYPE_REMOTE_KEY', remotekey: this.get("remotekey"), command:selected.substring(1)};
			} else {
				var params = {caller: MY_DEVICE_ID, messtype: 'MESS_TYPE_REMOTE_KEY', remotekey: this.get("remotekey"), command:selected};
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
			$$('#system-message-container').set('html', '');
			$$('#dim li a[value='+DIM_NO_SELECTED+']').fireEvent('click');
			$$('#group li a[value='+GROUP_NO_SELECTED+']').fireEvent('click');
			resetSelection();
		})
		
		window.setInterval(function(){
			refreshDiv();
		}, 10000);
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
	
	
	var currentDiv;
	
	function refreshDiv () {

		if ($('autorefresh') == null || $('autorefresh').hasClass('active')) {
			var selection = [];
			var elArray = $$('.rem-button.on, .rem-button.off, , .rem-button.error, .rem-button.undefined, .rem-button.unknown, field');
			var arrayLength = elArray.length;
			if (arrayLength > 0) {				// some selections
				for (var i = 0; i < arrayLength; i++) {
					selection.push(elArray[i].get('remotekey'));
				}
				var params = {caller: MY_DEVICE_ID, messtype: 'MESS_TYPE_MULTI_KEY', selection: selection, command: COMMAND_GET_VALUE};
				callAjaxNoSpin (params) ;
			}
		}
	};

	function callAjax (params) {
	
       var keysRequest = new Request.JSON({
				url: 	myurl,
				method: 'post',
				data: params,
				onRequest: function(){
					$$('#system-message-container').set('html', '');
					document.getElementById('spinner').style.display = 'block';
				},
				onSuccess: function(data)
				{
					processData(data);
					document.getElementById('spinner').style.display = 'none';
				},
				onError: function(text, error)
				{
					$$('#system-message-container').set('html', text+'</br>'+error);
					document.getElementById('spinner').style.display = 'none';
				},
			}
        ).send();
	};

	function callAjaxNoSpin (params) {
	
       var keysRequest = new Request.JSON({
				url: 	myurl,
				method: 'post',
				data: params,
				onRequest: function(){
					$$('#system-message-container').set('html', '');
				},
				onSuccess: function(data)
				{
					processData(data);
				},
				onError: function(text, error)
				{
					$$('#system-message-container').set('html', text+'</br>'+error);
				},
			}
        ).send();
	};
	
		
	function callAjaxSync (params) {
	
       var keysRequest = new Request.JSON({
				url: 	myurl,
				method: 'post',
				data: params,
				async: false,
				onRequest: function(){
					$$('#system-message-container').set('html', '');
					document.getElementById('spinner').style.display = 'block';
				},
				onSuccess: function(data)
				{
					processData(data);
					document.getElementById('spinner').style.display = 'none';
				},
				onError: function(text, error)
				{
					$$('#system-message-container').set('html', text);
					document.getElementById('spinner').style.display = 'none';
				},
			}
        ).send();
	};

	function showMessage(message) {
		if (message.length > 0) {
			$$('#system-message-container').set('html','<div class="alert alert-message"><a data-dismiss="alert" class="close" href="#">&times</a>'+message+'</div>');
		}
	}

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
				} else if (typeof item.groupselect !== 'undefined') {
					$(index).addClass('group-select');
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