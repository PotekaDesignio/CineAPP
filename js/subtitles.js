
var SubInterval=function  () {
};
var counter_sub;
var miliseconds_counter;

function PlaySubtitles () {

	if (bPlaySubtitle){

		document.getElementById('sub_position').innerHTML = 0;
		location.assign("#play_subtitle");
		//leer xml
		xhttp = new XMLHttpRequest();
		var subtitle_file=workingDirEntry.toURL() + currentPelicula +".xml";
		xhttp.overrideMimeType('text/xml');
		xhttp.open("GET", subtitle_file, false);
		xhttp.send(null);
		SubtitleXml = xhttp.responseXML;
		screen.lockOrientation('landscape');
		counter_sub=0;
		miliseconds_counter=Math.floor( delay*100);
		var id_container='container_subtitles';
	
		//Buscar subtitulo donde inicia
		var subtitles_legth=SubtitleXml.getElementsByTagName("Subtitle").length;
		for (var i= 0;subtitles_legth>i;i++) { 
			var subtitle=SubtitleXml.getElementsByTagName("Subtitle")[counter_sub];
			var TimeOut=hmsm_to_miliseconds(subtitle.getAttribute('TimeOut'));
			if (TimeOut>miliseconds_counter) { 
				var Timein=hmsm_to_miliseconds(subtitle.getAttribute('TimeIn'));
				if (Timein<miliseconds_counter) {
					var container=document.getElementById(id_container);
					draw_subtitles (subtitle,container);
					counter_sub++;
				};
				break;
			}
			counter_sub++;
			
		}


		//Funciona cada milisegundo;
		//
		SubInterval =setInterval(function(){
			if (SubtitleXml.getElementsByTagName("Subtitle").length>counter_sub) {

				window.miliseconds_counter++;
				var subtitle = SubtitleXml.getElementsByTagName("Subtitle")[counter_sub];
				var Timein = hmsm_to_miliseconds(subtitle.getAttribute('TimeIn'));
				var TimeOut = hmsm_to_miliseconds(subtitle.getAttribute('TimeOut'));
				var Texts = subtitle.getElementsByTagName('Text');
				var container =document.getElementById(id_container);
				
				setAudioPosition(miliseconds_counter/100, 30, 'sub');
				if (Timein===miliseconds_counter) {
						
					draw_subtitles (subtitle,container);
					counter_sub++;
					
					
				}else{
					if (TimeOut===miliseconds_counter) {
						container.innerHTML = "";
					};
				}
				
			}else{	
				clearInterval(SubInterval);
			}

		}, 10);
	}
	
}

function draw_subtitles (subtitle,container) {
	
	var Texts=subtitle.getElementsByTagName('Text');
	container.innerHTML ='';
	/*a veces el nodo puede tener varios subnodos otras veces no*/
	for (var i = 0; i < Texts.length; i++) {
		if (Texts[i].getElementsByTagName('Font').length==0) {
			var subText=Texts[i].textContent;
			console.log(subText);
			container.innerHTML = container.innerHTML+'<p style="color:white">'+subText+'</p>';
						
		}else{
			if (Texts[i].getElementsByTagName('Font')[0].getAttribute('Color')==null) {
				var colorText='style="color:white"';
			}else{
				var subColor =Texts[i].getElementsByTagName('Font')[0].getAttribute('Color').slice(2,8);;
				var colorText='style="color:rgb('+parseInt(subColor.slice(0,2),16)+','+parseInt(subColor.slice(2,4),16)+','+parseInt(subColor.slice(4,6),16)+');"';
			}
			var subText=Texts[i].getElementsByTagName('Font')[0].textContent;
			console.log(subText);
			container.innerHTML = container.innerHTML+'<p '+colorText+' >'+subText+'</p>';
		}
	}
}


function hmsm_to_miliseconds (hms) {

	var a = hms.split(':'); 
	var seconds=  (+a[0]) * 60 * 60 *100+ (+a[1]) * 60 *100+ (+a[2])*100+ Math.floor(a[3]/10); 
	return seconds;
}