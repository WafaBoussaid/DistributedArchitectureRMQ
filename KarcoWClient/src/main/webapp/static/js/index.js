var demande = {};
var itiniraire = [];
var server  = "http://localhost:9999";
var mqServer  = "http://localhost:8080";
$(document).ready(function()
{
  hundleLoginForm();
  getVehiculeType();
  prepareAddressFinder();
  hundleCompareTime();
  hundleCovoitureur();
  hundleValidateRequest();

 $('.date-fr').bootstrapMaterialDatePicker
    ({
        format: 'DD/MM/YYYY HH:mm',
        lang: 'fr',
        weekStart: 1, 
        cancelText : 'ANNULER',
        nowButton : true,
        switchOnClick : true,
        minDate : new Date()
    });
    $('.date-fr').val(new Date().toLocaleString());

    $.material.init()
});




  
 function initSearchForm(){
   getVehiculeType();
   prepareAddressFinder();
 }

function getVehiculeType(){

    //appel du web service recuperation de type vehicule
    $.ajax( {
		    type:'Get',
		    url:server + '/vehicules',       
		    dataType: 'json',
		    success:function (responseData, textStatus, errorThrown) {
		    	
		    	$.each( responseData, function( index, vehicule ){
		    		$('#vehiculeTypeSelect').append($('<option>', {
			            value: vehicule.maxPassenger,
			            text: vehicule.type
			        }));
		    	});
		    	
		    	
			    },
	    	error: function (responseData, textStatus, errorThrown) {
	   		    alert('Erruer de recuperation de type de vehicule !');
	    	}
	
    	})
    
    }

function prepareAddressFinder(){
	$( "#departureAddressInput,#arrivalAddressInput" ).autocomplete({
	      source: function( request, response ) {
	    	  var url = mqServer + "/address?voie="+request.term; 
	        $.ajax({
	          url: url,
	          dataType: "json",
	          data: {
	            q: request.term
	          },
	          success: function( data ) {
	        	var addressList = [];
	        	  $.each(data,function(index,address){
	        		 var value = address.numero + "," + address.voie + "," + address.code_post;
	        		 addressList.push({value : value, lon : address.lon, lat : address.lat}); 
	        	  });
	            response( addressList );
	          }
	        });
	      },
	      minLength: 5,
	      select: function( event, ui ) {

	        itiniraire.push(ui.item.lon);
	        itiniraire.push(ui.item.lat);
	        
	        toastr.success("lon : " + ui.item.lon +"<br/>" +"lat : " +ui.item.lat  );
	      },
	      open: function() {
	        $( this ).removeClass( "ui-corner-all" ).addClass( "ui-corner-top" );
	      },
	      close: function() {
	        $( this ).removeClass( "ui-corner-top" ).addClass( "ui-corner-all" );
	      }
	    }).data( "ui-autocomplete" )._renderItem = function( ul, item ) {
			  return $( "<li>" )
			    .append( "<span class='proposition' >" + item.value + "</span>" )
			    .appendTo( ul );
			};
}


function hundleCovoitureur(){
	$("#covoitureurs").change(function(){
			var number = $("#covoitureurs").val();	
	var capacity = $("#vehiculeTypeSelect option:selected").val();
	if(capacity < number)
		toastr.warning("Vous avez dépassé la capacité du véhicule");
	});
}

function hundleCompareTime(){
	$('.date-fr').change(function(){

		var depart = $('#departureTime').val().replace('à','');
		var arrivee = $('#arrivalTime').val().replace('à','');;
		if(arrivee < depart){
			toastr.warning("Horaire d'arrivée doit être superieure à l'horaire' de départ")
		}
	});
}


function hundleLoginForm(){

    $('#login-form-link').click(function(e) {
		$("#login-form").delay(100).fadeIn(100);
 		$("#register-form").fadeOut(100);
		$('#register-form-link').removeClass('active');
		$(this).addClass('active');
		e.preventDefault();
	});
	$('#register-form-link').click(function(e) {
		$("#register-form").delay(100).fadeIn(100);
 		$("#login-form").fadeOut(100);
		$('#login-form-link').removeClass('active');
		$(this).addClass('active');
		e.preventDefault();
	});
}

function hundleValidateRequest(){
	 $("#searchBtn").click(function(){
		 
		 
		 demande.max_price = $("#max_price").val();
		 demande.max_passeneger = $("#covoitureurs").val();
		 demande.max_delay = $("#deviation-time").val();
		 demande.dep_lon = itiniraire[0];
		 demande.dep_lat = itiniraire[1];
		 demande.arr_lon = itiniraire[2];
		 demande.arr_lat = itiniraire[3];
		 demande.vehiculeType = $("#vehiculeTypeSelect option:selected").text();
		 //demande.vehiculeType ="Citadine";
		 
		 $("#spinnerLoader").removeClass("hidden");
		 $("#resultSuggestion").addClass("hidden");
		 $("#noSuggestion").addClass("hidden");
		 $("#waitingModal").modal();
		 
		 $.ajax( {
			 	beforeSend: function(xhrObj){
			        xhrObj.setRequestHeader("Content-Type","application/json");
			        xhrObj.setRequestHeader("Accept","application/json");
			    },
			    type:'Post',
			    url:mqServer +"/suggestions",       
			    //dataType: 'application/json',
			    data : JSON.stringify(demande),
			    success:function (responseData, textStatus, errorThrown) {
			    	if(responseData.demandeDistance!= undefined)
			    	{
			    	$("#demandePrice").html(demande.max_price);
			    	$("#demandePassenger").html(demande.max_passeneger);
			    	$("#demandeDelay").html(demande.max_delay);
			    	
			    	
			    	$("#suggestionPrice").html(responseData.max_price);
			    	$("#suggestionPassenger").html(responseData.max_passenger);
			    	$("#suggestionDelay").html(responseData.max_delay);
			    	$("#suggestionVehicule").html(responseData.vehiculeType);
			    	$("#suggestionDistance").html(responseData.demandeDistance +  " Km");
			    	$("#suggestionDuration").html(responseData.demandeDuration + " min");
			    	
			    	$("#spinnerLoader").addClass("hidden");
			    	$("#resultSuggestion").removeClass("hidden");
			    	
			    	if(parseInt(responseData.max_passenger) <= parseInt(demande.max_passeneger))
			    		$("#suggestionPassenger").addClass("success");
			    	else
			    		$("#suggestionPassenger").addClass("warning");
			    	if(parseInt(responseData.max_price) <= parseInt(demande.max_price))
			    		$("#suggestionPrice").addClass("success");
			    	else
			    		$("#suggestionPrice").addClass("warning");
			    	if(parseInt(responseData.max_delay) <= parseInt(demande.max_delay))
			    		$("#suggestionDelay").addClass("success");
			    	else
			    		$("#suggestionDelay").addClass("warning");
			    }
			    	else{
			    		$("#spinnerLoader").addClass("hidden");
				    	$("#noSuggestion").removeClass("hidden");
			    	}
			    },error: function (responseData, textStatus, errorThrown) {
			    	toastr.warning("Erreur lors du calcul de votre itinéraire !");
		    	}
		 });
		 
		 /*
	 	var url = 'https://router.project-osrm.org/route/v1/driving/' + itiniraire[1] +',' + itiniraire[0] +';' + itiniraire[3] +',' + itiniraire[2] +'?overview=false';
	 	 //var url = 'http://router.project-osrm.org/route/v1/driving/' + itiniraire[0] +',' + itiniraire[1] +';' + itiniraire[2] +',' + itiniraire[3] +'?overview=false';
	 	 //url = 'https://router.project-osrm.org/route/v1/driving/2.4177585,48.8685127;2.470517,48.941244?overview=false';
	 	 
	 	
		 $.ajax( {
			    type:'Get',
			    url:url,       
			    dataType: 'json',
			    success:function (responseData, textStatus, errorThrown) {
			    	var distance = Number((responseData.routes[0].distance /1000).toFixed(1));
			    	
			    	var minutes = Math.floor( responseData.routes[0].duration / 60);          
    				var hours = Math.floor( minutes / 60);          ;

    				var time = minutes;
    				if(hours>0) time = "" + hours +":"+minutes;

					var depart = $('#departureTime').val().replace('à','').split(" ")[1];
					var arrivee = $('#arrivalTime').val().replace('à','').split(" ")[1];
					var minuteDepart = depart.split(":")[1];
					var hourDepart = depart.split(":")[0];

					var minuteArival = arrivee.split(":")[1];
					var hourArival = arrivee.split(":")[0];

					var couldGo = true;
					var diffHour = 0;
					var diffMinutes = 0;	
					if(hourArival>=hourDepart)
					{
						diffHour = (60 * parseFloat(hourArival)) - (60 * parseFloat(hourDepart)) ; 
						diffMinutes =  parseFloat(minuteArival) - parseFloat(minuteDepart)   + diffHour;
						if(minutes > diffMinutes)
							couldGo = false;
					}else{
						couldGo = false;
					}


					if(!couldGo){
						toastr.warning("La durée de la course demandée ne peut pas être satistfaite")
					}else{

					toastr.info("Distance : " + distance + " km<br/>" + "Durée : " + time+ "min")	
					}
			    	},
		    	error: function (responseData, textStatus, errorThrown) {
		   		    alert('Erruer de recuperation du résultat!');
		    	}

			});
		  	*/ ////: end ajax
	 });
	 
}



