//debug con alerts
var alertDebug = 0;
// segundos a grabar
var recTotalTime = 30;
//var recTotalTime = 3;
var DBSize = 200000;//bytes
//var audioRecFile = "audio-org-1739rec"; //extension segun plataforma
var audioRecFile = "audio-org-1739rec"; 
var urlServer = "http://104.236.115.104/cineapp";
//var urlServer = "http://192.168.0.19/cineapp";
var urlAudioDescServerUpload = urlServer + "/servidor/index.php/transfer/do_upload";
var urlAudioDescServerCartelera = urlServer +  "/servidor/index.php/cartelera/lista";
var urlServerSearch = urlServer +  "/servidor/index.php/cartelera/search";
var urlAudioDescServerDownload = urlServer + "/servidor/index.php/transfer/download";
var urlServerSubtitleXml = urlServer + "/servidor/uploads/subtitulos";
var urlAudioStream = urlServer + "/servidor/index.php/transfer/download";
var sWorkingDir = ".cineAPP/";
var currentPelicula;
var id_currentPelicula;

var workingDirEntry;
var tempDirEntry;

var recDirEntry;
var delay;
//array con la informacion de la cartelera recivida del servidor
var aCartelera;
var aBusqueda;
var mediaAudio;
//parar el proceso de sincronizacion y reproduccion
var forceStop;

var timeStamp; // inicio de la captura


//activacion de pasos para la reproduccion
var bRecordAudio;
var bUploadFile;
var bDownloadAudio;
var bPlayAudio;
var bPlaySubtitle;


$( document ).ready(function() {
  document.addEventListener("deviceready", onDeviceReady, false);
});
optimizeSpeed();
$( document ).delegate("#mispeliculas", "pageshow", misPeliculas);
$( document ).delegate("#cartelera", "pageshow", cartelera);



function onDeviceReady() {

  window.plugins.insomnia.keepAwake();

  var db = window.openDatabase("cineappDB", "1.0", "peliculas_local", DBSize);
  
  db.transaction(eraseAllPeliculasDB, onError);

  document.addEventListener("backbutton", backButtonHandler, false);
  // CREAR ESTRUCTURA DE DIRECTORIOS
  if (device.platform == "Android"){
    audioRecFile = audioRecFile + ".amr";
    var audioDirEntry = cordova.file.externalRootDirectory;
    window.resolveLocalFileSystemURL(audioDirEntry, 
      function(dirEntry){
        if (alertDebug == 1) 
          alert(dirEntry.toURL());

        dirEntry.getDirectory(
            "Android/",
            {create: true},
            function(dirEntry){

	             if (alertDebug == 1) 
	               alert(dirEntry.toURL());	  
               dirEntry.getDirectory(
                  "data/",
                  {create: true},

                  function(dirEntry){
	                   if (alertDebug == 1) 
		                   alert(dirEntry.toURL());
	                   dirEntry.getDirectory(
                      sWorkingDir,
                      {create: true},
		                  function(dirEntry){
		                    if (alertDebug == 1) 
                          alert(dirEntry.toURL());
		                    workingDirEntry = dirEntry;
		                     dirEntry.getDirectory(
                            "rec/",
                            {create: true},
      			                 function(dirEntry){
      			                   if (alertDebug == 1) 
      				                  alert(dirEntry.toURL());
      			                   recDirEntryPath = dirEntry.toURL();
			                       },
			                       onError
		                      );

		                  },
		                onError
	                 );
	                },

	               onError
	           );

	         },
	     onError
	     );
      },
    onError);
  
  }else{

    audioRecFile = audioRecFile + ".wav";
/*-----------------------------------------------------------
 * 
 *         PROBAR CAMBIO DE TEMP A DATA EN IOS    
 *-----------------------------------------------------------*/
    audioDirEntry = cordova.file.dataDirectory ;
    window.resolveLocalFileSystemURL(
      audioDirEntry, 
      function(dirEntry){
        dirEntry.getDirectory(
          sWorkingDir,
          {create: true},
          function(dirEntry){
	         window.resolveLocalFileSystemURL(
            audioDirEntry+sWorkingDir, 
            function(dirEntry){
              if (alertDebug == 1) 
                alert(dirEntry.toURL());
              workingDirEntry = dirEntry;
              dirEntry.getDirectory(
                "rec/",
                {create: true},
  		          function(dirEntry){
  		            if (alertDebug == 1) 
  		              alert(dirEntry.toURL());
  		            recDirEntryPath = cordova.file.documentsDirectory+"/";
  		          },
  		        onError
  	         );
	          },
	       onError);
	     },
	   onError
     );
    },
    onError
    );
    window.resolveLocalFileSystemURL(cordova.file.tempDirectory, function(dirEntry){
      tempDirEntry = dirEntry;
    },
    onError);
  }
  
}


function pelicula_reproducir(){
  bRecordAudio=1;
  bUploadFile=1;
  bDownloadAudio=0;
  bPlayAudio=1;

  bDownloadSubtitle=0;
  bPlaySubtitle=0;

  recordAudio();
}

function pelicula_descargar_reproducir(){
  bRecordAudio=1;
  bUploadFile=1;
  bDownloadAudio=1;
  bPlayAudio=1;
  
  bDownloadSubtitle=0;
  bPlaySubtitle=0;

  recordAudio();
}

function subtitulos_reproducir(){
  bRecordAudio=1;
  bUploadFile=1;
  bDownloadAudio=0;
  bPlayAudio=0;

  bDownloadSubtitle=0;
  bPlaySubtitle=1;

  recordAudio();
}

function subtitulos_descargar_reproducir(){
  bRecordAudio=1;
  bUploadFile=1;
  bDownloadAudio=0;
  bPlayAudio=0;

  bDownloadSubtitle=1;
  bPlaySubtitle=1;

  recordAudio();
}


function pelicula_descargar(){
  bRecordAudio=0;
  bUploadFile=0;
  bDownloadAudio=1;
  bPlayAudio=0;

  bDownloadSubtitle=0;
  bPlaySubtitle=0;

  downloadAudio();
}

function subtitulos_descargar(){
  bRecordAudio=0;
  bUploadFile=0;
  bDownloadAudio=0;
  bPlayAudio=0;

  bDownloadSubtitle=1;
  bPlaySubtitle=0;

  downloadAudio();
}

function pelicula_borrar(){
  workingDirEntry.getFile( currentPelicula +".mp3", {create: true, exclusive: false}, 
    function (fileEntry){//success
      fileEntry.remove(
	     function(){
	       var db = window.openDatabase("cineappDB", "1.0", "peliculas_local", DBSize);
	       db.transaction(
          deleteCurrentPeliculaDB, 
          onError, 
          function(){ //success
	         backButtonHandler();
	         });
	     },
	     onError
      );
    },
    onError
  );
  
}
/*
Dibuja cada pelicula
*/
function pelicula_cartelera(id,arraybusqueda){

  var page = document.getElementById("pelicula_cartelera");
  nombre = arraybusqueda[id].Nombre;
  currentPelicula =  arraybusqueda[id].File;
  var d = document.getElementById("titulo_cartelera");
  var p = document.getElementById("titulop_cartelera");
  d.removeChild(p);
  p = document.createElement("p");
  p.id = "titulop_cartelera";
  var t = document.createTextNode(arraybusqueda[id].Nombre);
  p.appendChild(t);
  d.appendChild(p);
//descripcion
  var d1 = document.getElementById("descripcion_cartelera");
  var p1 = document.getElementById("descripcionp_cartelera");
  d1.removeChild(p1);
  p1 = document.createElement("p");
  p1.id = "descripcionp_cartelera";
  var t1 = document.createTextNode(arraybusqueda[id].Descripcion);
  p1.appendChild(t1);
  d1.appendChild(p1);
  location.assign("#pelicula_cartelera");

}

function cartelera(){
  $.ajax({
    url: urlAudioDescServerCartelera,
    dataType: "jsonp",
    success: function (aResponse) {
      aCartelera = aResponse;
      console.log(aCartelera);
      var page = document.getElementById("cartelera");
      page.removeChild(document.getElementById("cartelera_peliculas"));
      var list = document.createElement("div");
      list.id = "cartelera_peliculas";
      var i=-1;
      aCartelera.forEach(function(element) {
        i++;
        var sName = element.Nombre;
        var d = document.createElement("div");
        d.className = "Pelicula";
        var a = document.createElement("a");
        a.href = "javascript:pelicula_cartelera('"+ i +"',aCartelera)";
        //titulo
        var p = document.createElement("p");
        var t = document.createTextNode(sName);
        p.appendChild(t); 
        a.appendChild(p); 
        // 	  a.appendChild(p1); 
        d.appendChild(a); 
        list.appendChild(d);
      });
      page.appendChild(list);
    },
    error: function(e, text){
      console.log(text);
    }
    
  });
  
}

function misPeliculas(){
  
  var db = window.openDatabase("cineappDB", "1.0", "peliculas_local", DBSize);
  db.transaction(listPeliculaDB, onError);
}
    
function pelicula_local(file){
  var page = document.getElementById("pelicula_local");
  currentPelicula = file;

  
  var db = window.openDatabase("cineappDB", "1.0", "peliculas_local", DBSize);
  db.transaction(loadCurrentPeliculaDB, onError, function(){ //success
    location.assign("#pelicula_local");
  });

}
    
function optimizeSpeed() {
  var hoverDelay = $.mobile.buttonMarkup.hoverDelay = 0;

  $.mobile.defaultPageTransition = 'none';
  $.mobile.defaultDialogTransition = 'none';
  }

function backButtonHandler() {
  console.log($('.ui-page-active').attr('id'));
  switch ( $('.ui-page-active').attr('id') ){
    case 'inicio':
      //navigator.app.exitApp();
      navigator.Backbutton.goHome(
        function() {
          console.log('success')
        }, 
        function() {
  	       console.log('fail')
        });
      break;
    case 'play':
    case 'capture':
      forceStop = 1;
      mediaAudio.stop();
      mediaAudio.stopRecord();
      mediaAudio.release();
    case 'download':
    case 'sync':
      location.assign("#inicio");
    case 'play_subtitle':
      screen.unlockOrientation();
      clearInterval(SubInterval);
      location.assign("#inicio");
    break;
    default:
      if (device.platform == "Android"){
	       navigator.app.backHistory();
      }else{
	       location.assign("#inicio");
      }
    break;
  }

}
// Record audio
//
function recordAudio() {
  forceStop = 0;
  if (bRecordAudio){
    document.getElementById('rec_position').innerHTML = 0;
    location.assign("#capture");
    var workDirPath;
    if (device.platform == "Android"){
      workDirPath = recDirEntryPath;
    }else{
      workDirPath = recDirEntryPath.slice(7,-1);

    }
    mediaAudio = new Media(

      workDirPath + audioRecFile, 
			function(){//success
        console.log("recordAudio():Audio Success");
        if (alertDebug == 1) alert("recordAudio():Audio Success");
			   clearInterval(recInterval);
			   if (!forceStop)
          uploadFile();

      }, 
      onError);

    if (alertDebug == 1) alert( workDirPath + audioRecFile);  
    // Record audio
    var d = new Date();
    timeStamp = d.getTime();// inicio de la captura
    mediaAudio.startRecord();
    // grabar recTotalTime segundos
    var recTimeSec = 0;
    var recInterval = setInterval(function() {
      recTimeSec = recTimeSec + 1;
      setAudioPosition(recTimeSec, 30, 'rec');
      if (recTimeSec >= recTotalTime) {
        clearInterval(recInterval);
        mediaAudio.stopRecord();
        mediaAudio.release();
      }
    }, 1000);

  }else{

    uploadFile();
 
 }
}

// onError Callback
//
function onError(error, text) {
  alert('code: '    + error.code    + '\n' +
  'message: ' + error.message + '\n' + text);
  
}

// Set audio position
//
function setAudioPosition(position, duration, id) {
  var min = Math.floor(position/60);
  var sec = Math.floor(position - min*60);
  var time;
  
  if (sec < 10) {
    time = min + ":0" + sec;
  }else{
    time = min + ":" + sec;
  }
  
  document.getElementById(id+'_position').innerHTML = time;

}


function uploadFile() {
  forceStop = 0;
  if (bUploadFile){
    location.assign("#sync");
    mediaFile = audioRecFile;
    if (alertDebug == 1) alert (workingDirEntry.toURL() + mediaFile);
    var options = new FileUploadOptions();
    options.fileKey = "userfile";
    options.fileName = mediaFile;
//   options.mimeType = "audio/amr";
    var ft = new FileTransfer();

    ft.upload(
      recDirEntryPath + mediaFile,
      urlAudioDescServerUpload+"/"+currentPelicula,
      function(result) {
        console.log('Upload success: ' + result.responseCode);
	      console.log(result.response);
        console.log(result.bytesSent + ' bytes sent');

	      if (alertDebug == 1) alert( result.response );
        
        delay = parseFloat(result.response);

        if (!forceStop) {
          if (bPlaySubtitle===1) {
            downloadSubtitleXml()
          }else{
            downloadAudio();
          }

        }
      },
	    function(error) {
	      console.log('Error uploading file ' + ': ' + error.code);
	      onError(error);
	    },
	    options);
 }else{
  if (bPlaySubtitle===1) {
 
      downloadSubtitleXml()
    }else{
 
      downloadAudio();
    }
   
 }
}

function downloadAudio(){
 forceStop= 0;
 if (bDownloadAudio){
  location.assign("#download");
  var ft = new FileTransfer();
  if (alertDebug == 1) alert ("begining download");
  ft.download(
    urlAudioDescServerDownload+"/"+currentPelicula,
    workingDirEntry.toURL() + currentPelicula +".mp3", 
    function(entry) {//success
		  console.log("download complete: " + entry.fullPath);
      
		  var db = window.openDatabase("cineappDB", "1.0", "peliculas_local", DBSize);
      
		  db.transaction(saveCurrentPeliculaDB, onError, function(){ //success
  		  if (!forceStop)
  		    playAudio();
  		  }
      );
	   },
    function(error) {//error
		  console.log("download error source " + error.source);
		  console.log("download error target " + error.target);
		  console.log("upload error code" + error.code);
		  onError(error);
	   },
	   false,
	   {
		  headers: {
		    "Authorization": "Basic dGVzdHVzZXJuYW1lOnRlc3RwYXNzd29yZA=="
		  }
	   }
  );
 }else{
   playAudio();
 }
}
function downloadSubtitleXml(){
  forceStop= 0;
  bDownloadSubtitle=1;
  if (bDownloadSubtitle){
    location.assign("#download_sub");
    var ft = new FileTransfer();
    if (alertDebug == 1) alert ("begining download");
  
  
    ft.download(
      urlServerSubtitleXml+"/"+currentPelicula+".xml",
      workingDirEntry.toURL() + currentPelicula +".xml", 
      function(entry) {//success
        console.log("download complete: " + entry.fullPath);
        PlaySubtitles();
        /*var db = window.openDatabase("cineappDB", "1.0", "peliculas_local", DBSize);
        db.transaction(
          saveCurrentSubtitleDB, 
          onError, 
          function(){ //success
            if (!forceStop){
              
              //playAudio();
            }
          }
        )*/
      },      
      function(error) {//error
        console.log("download error source " + error.source);
        console.log("download error target " + error.target);
        console.log("upload error code" + error.code);
        console.log(error);
        onError(error);
      },
      false,
      {
        headers: {
          "Authorization": "Basic dGVzdHVzZXJuYW1lOnRlc3RwYXNzd29yZA=="
        }
      }
    );
  }else{
    PlaySubtitles();
    //     playAudio();
  }
}

function playAudio(){
  forceStop = 0;
  if (bPlayAudio){
    document.getElementById('play_position').innerHTML = 0;
    location.assign("#play");
    var d;
    if (device.platform == 'Android'){
      mediaAudio = new Media(
        workingDirEntry.fullPath + currentPelicula + ".mp3", 
        function(){//success
          clearInterval(mediaTimer);
          console.log("Audio play success!!");
          if (alertDebug == 1) alert("Audio play success!!");
          mediaAudio.release()
        },
        onError,
        function(status){
          if ( status == Media.MEDIA_RUNNING ){
            d = new Date();
            if (device.platform == "Android"){
              //reproducir desde "delay" segundos + timepo de captura y proceso
              mediaAudio.seekTo(parseFloat((delay)*1000)+(d.getTime()-timeStamp)+64000); 
            }else{
              mediaAudio.seekTo(parseFloat((delay)*1000)+(d.getTime()-timeStamp)); //reproducir desde "delay" segundos + timepo de captura y proceso
            }	
	           //if (alertDebug == 1) alert(parseFloat((delay)*1000)+ " " +(d.getTime()-timeStamp));
          }
        });
      mediaAudio.play();
      var mediaTimer = setInterval(
        function () {
          // get media position
          mediaAudio.getCurrentPosition(
          // success callback
            function (position) {
              if (position > -1) {
                console.log((position) + " sec");
                setAudioPosition(position, mediaAudio.getDuration(), 'play');
              }
            },
            // error callback
            function (e) {
              console.log("Error getting pos=" + e);
              onError(e);
            }
          );
        }, 
      1000);
    }else{
      workingDirEntry.getFile(
        currentPelicula +".mp3", {create: true, exclusive: false}, 
        function (fileEntry){//success
          fileEntry.copyTo(
            tempDirEntry,
            "",
						function(fileEntry){
              mediaAudio = new Media(tempDirEntry.fullPath + currentPelicula + ".mp3", function(){//success
                clearInterval(mediaTimer);
                console.log("Audio play success!!");
						    if (alertDebug == 1) 
                  alert("Audio play success!!");				    									 
						      mediaAudio.release();
						      fileEntry.remove();
                },
                onError,
                function(status){
						      if ( status == Media.MEDIA_RUNNING ){
						        d = new Date();
						        if (device.platform == "Android"){
                      mediaAudio.seekTo(parseFloat((delay)*1000)+(d.getTime()-timeStamp)+4500); //reproducir desde "delay" segundos + timepo de captura y proceso
                    }else{
                      mediaAudio.seekTo(parseFloat((delay)*1000)+(d.getTime()-timeStamp)); //reproducir desde "delay" segundos + timepo de captura y proceso
                    }
                    // if (alertDebug == 1) alert(parseFloat((delay)*1000)+ " " +(d.getTime()-timeStamp));
						      }
						    });
						    mediaAudio.play();
                var mediaTimer = setInterval(function () {
						    // get media position
                  mediaAudio.getCurrentPosition(
                    // success callback
						        function (position) {
                      if (position > -1) {
                        console.log((position) + " sec");
                        setAudioPosition(position, mediaAudio.getDuration(), 'play');
                      }
						        },
					       // error callback
					         function (e) {
                      console.log("Error getting pos=" + e);
                      onError(e);
                    }
						    );
						    }, 1000);
						},
						onError);
        },
        onError
      );
    }
  }else{
    if (bDownloadAudio) 
      alert("Audiodescripción descargada exitosamente.");
    backButtonHandler();
  }
}


function saveCurrentPeliculaDB(tx) {
  var aArray=[];
  if (typeof aCartelera !== 'undefined') {
    aArray=aCartelera;
  }else{
    if (typeof aBusqueda !== 'undefined') {
      aArray=aBusqueda;
    }
    
  }
  aArray.forEach(function (element){
 
    if (element.File == currentPelicula){
      tx.executeSql('CREATE TABLE IF NOT EXISTS peliculas_local (id auto_increment, Nombre, Descripcion, File,audiodescripcion,original,subtitulo,EnCartelera)');
      tx.executeSql('SELECT * FROM peliculas_local WHERE File=?', [currentPelicula],function(tx, results){
        if (results.rows.length===0) {
          tx.executeSql("INSERT INTO peliculas_local (Nombre, Descripcion, File) VALUES ('"+element.Nombre+"','"+element.Descripcion +"','"+ currentPelicula+"')");
        };
      });
    }
  });
}
function saveCurrentSubtitleDB(tx) {
  aCartelera.forEach(function (element){
    if (element.File == currentPelicula){
      tx.executeSql('CREATE TABLE IF NOT EXISTS peliculas_local (id auto_increment, Nombre, Descripcion, File,audiodescripcion,original,subtitulo,EnCartelera)');
      tx.executeSql("INSERT INTO peliculas_local (Nombre, Descripcion, File, SubtitleDownload) VALUES ('"+element.Nombre+"','"+element.Descripcion +"','"+ currentPelicula+"',1)");
    }
  });
}
function loadCurrentPeliculaDB(tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS peliculas_local (id auto_increment, Nombre, Descripcion, File,audiodescripcion,original,subtitulo,EnCartelera)');
  tx.executeSql('SELECT * FROM peliculas_local WHERE File="'+currentPelicula +'"', [],function(tx, results){
    //titulo
    var d = document.getElementById("titulo");
    var p = document.getElementById("titulop");
    d.removeChild(p);
    p = document.createElement("p");
    p.id = "titulop";
    var t = document.createTextNode(results.rows.item(0).Nombre);
    p.appendChild(t);
    d.appendChild(p);
    //descripcion
    var d1 = document.getElementById("descripcion_local");
    var p1 = document.getElementById("descripcionp_local");
    d1.removeChild(p1);
    p1 = document.createElement("p");
    p1.id = "descripcionp_local";
    var t1 = document.createTextNode(results.rows.item(0).Descripcion);
    p1.appendChild(t1);
    d1.appendChild(p1);  
  }, 
  onError);
}

function deleteCurrentPeliculaDB(tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS peliculas_local (id auto_increment, Nombre, Descripcion, File,audiodescripcion,original,subtitulo,EnCartelera)');
  tx.executeSql("DELETE FROM peliculas_local WHERE File='"+currentPelicula+"'");
}
function eraseAllPeliculasDB(tx){
  tx.executeSql('CREATE TABLE IF NOT EXISTS peliculas_local (id auto_increment, Nombre, Descripcion, File,audiodescripcion,original,subtitulo,EnCartelera)');
  tx.executeSql('DELETE FROM peliculas_local;');
  
}
function listPeliculaDB(tx){
  tx.executeSql('CREATE TABLE IF NOT EXISTS peliculas_local (id auto_increment, Nombre, Descripcion, File,audiodescripcion,original,subtitulo,EnCartelera)');
  tx.executeSql('SELECT * FROM peliculas_local', [],function(tx, results){//success
    
    var page = document.getElementById("mispeliculas");
    page.removeChild(document.getElementById("mispeliculas_peliculas"));
    var list = document.createElement("div");
    list.id = "mispeliculas_peliculas";
    
//    var directoryReader = workingDirEntry.createReader();
    for (var i=0; i<results.rows.length; i++){
      var fileName = results.rows.item(i).File;
      var d = document.createElement("div");
      d.className = "Pelicula";
      var a = document.createElement("a");
      a.href = "javascript:pelicula_local('"+fileName+"')";
      var p = document.createElement("p");
      var t = document.createTextNode(results.rows.item(i).Nombre);
      p.appendChild(t); 
      a.appendChild(p); 
      d.appendChild(a); 
      list.appendChild(d);
    }
    page.appendChild(list);
  }, onError);
}
