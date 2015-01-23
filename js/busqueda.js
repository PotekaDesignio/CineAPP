
var aBusqueda=[];
$("#formularioBusqueda").submit(function(e){
	

	var nombrePelicula=document.getElementById("NombrePelicula").value;

	
	$.ajax({
    url: urlServerSearch+'/'+nombrePelicula,
    dataType: "json",
    success: function (aResponse) {
      aBusqueda=aResponse;

    	location.assign("#listado");
    	console.log(aBusqueda);
      	var page = document.getElementById("listado");
      	page.removeChild(document.getElementById("listado_peliculas"));
      	var list = document.createElement("div");
      	list.id = "listado_peliculas";
      	var i=-1;
		    aBusqueda.forEach(function(element) {
        	i++;
        	var sName = element.Nombre;
        	var d = document.createElement("div");
        	d.className = "Pelicula";
        	var a = document.createElement("a");
        	a.href = "javascript:pelicula_cartelera('"+ i +"',aBusqueda)";
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
    return false;
});