$(document).ready(function() {

	var closeServiceChooser = function(selectedServiceName) {
		if (selectedServiceName) {
			$(".selected_service_name").text(selectedServiceName);
		}
		
		var $selectedLabel = $(".selected_service");
		$selectedLabel.css({
			display: "block",
			opacity: "0"
		});
		var height = $selectedLabel[0].offsetHeight;

		$(".service_info").animate({height: height + "px"});
		$selectedLabel.animate({opacity: "1"});
		$(".service_chooser").animate({opacity: "0"});
	};

	var openServiceChooser = function() {
		var $selectedLabel = $(".selected_service");
		var $serviceChooser = $(".service_chooser");

		$serviceChooser.css({display: "block", opacity: "0"});
		var height = $serviceChooser[0].scrollHeight;
		$(".service_info").animate({height: height + "px"});
		$selectedLabel.fadeOut();
		$serviceChooser.animate({opacity: "1"});
	};

	var getAttributeData = function(serviceId) {
		$.ajax({
			url: BASE_URL + "services/" + serviceId + ".json",
			dataType: "json",
			success: function(data, status, xhr) {
				showSrAttributes(data);
			},
			error: function(xhr, status, error) {
				// FIXME: need to actually handle errors
				alert("Something broke!");
			}
		});
	};

	var showSrAttributes = function(srDefinition) {
		console.log("SR Definition:", srDefinition);

		var attributes = srDefinition.attributes;
		attributes.sort(function(a, b) {
			return a.order - b.order;
		});

		
		var fragment = document.createDocumentFragment();
		for (var i = 0, len = attributes.length; i < len; i++) {
			fragment.appendChild(createAttributeForm(attributes[i]));
		}

		$(".sr_attributes").empty().append(fragment);
	};

	var createAttributeForm = function(attribute) {
		var attributeId = "attribute_" + attribute.code;
		var container = document.createElement("div");
		container.className = "sr_attribute";

		if (attribute.variable) {
			// label
			var label = document.createElement("label");
			label.setAttribute("for", attributeId);
			label.appendChild(document.createTextNode(attribute.description));

			if (attribute.required) {
				var requiredNote = document.createElement("span");
				requiredNote.className = "required_note";
				requiredNote.appendChild(document.createTextNode("(required)"));
				label.appendChild(requiredNote);
			}

			container.appendChild(label);

			// input
			var input = createInputForAttribute(attributeId, attribute);
			container.appendChild(input);
		}
		else {
			container.appendChild(document.createTextNode(attribute.description));
		}

		return container;
	};

	var createInputForAttribute = function(attributeId, attribute) {
		var input;

		if (attribute.datatype === "text") {
			input = document.createElement("textarea");
		}
		else if (attribute.datatype.indexOf("valuelist") > -1) {
			input = document.createElement("select");
			if (attribute.datatype === "multivaluelist") {
				input.multiple = true;
			}

			var values = attribute.values;
			for (var i = 0, len = values.length; i < len; i++) {
				var option = document.createElement("option");
				option.value = values[i].key;
				option.appendChild(document.createTextNode(values[i].name));
				input.appendChild(option);
			}
		}
		else {
			var inputType = {
				number: "number",
				datetime: "datetime"
			}[attribute.datatype] || "text";

			input = document.createElement("input");
			input.type = inputType;

			if (inputType === "datetime" && !("valueAsDate" in input)) {
				input.placeholder = "Needs a picker.";
			}
		}

		if (attribute.required) {
			input.required = true;
		}

		input.id = attributeId;
		return input;
	};


	$(".selected_service").on("click", openServiceChooser);

	$(".service_group .service").on("click", function(event) {
		event.preventDefault();

		var $this = $(this);
		if (!$this.hasClass("selected")) {
			$(".service_group .service").removeClass("selected");
			$this.addClass("selected");

			var serviceId = this.getAttribute("data-service-id");
			getAttributeData(serviceId);

			closeServiceChooser($this.text());
		}
	});

	var map;
	var locationMarker;
	var geocoder = new google.maps.Geocoder();
	var initMap = function(position, zoom) {
		if (position) {
			var center = new google.maps.LatLng(position.latitude, position.longitude);
		}
		else {
			var center = new google.maps.LatLng(41.8838, -87.632344);
		}

		var mapOptions = {
			center: center,
			zoom: 17,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		};
		map = new google.maps.Map(document.getElementById("sr_map"), mapOptions);
	};

	var setMapLatLng = function(position) {
		var point = new google.maps.LatLng(position.latitude, position.longitude);
		map.setCenter(point);
		if (locationMarker) {
			locationMarker.setPosition(point);
		}
		else {
			locationMarker = new google.maps.Marker({
				position: point,
				map: map
			});
		}
	};

	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(function(position) {
			initMap(position.coords);
		}, function(error) {
			initMap();
		});

		$(".gps_button").show().on("click", function(event) {
			event.preventDefault();

			navigator.geolocation.getCurrentPosition(function(position) {
				setMapLatLng(position.coords);
				var point = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
				geocoder.geocode({latLng: point}, function(results, status) {
					if (status === google.maps.GeocoderStatus.OK && results.length) {
						$("#sr_location").val(results[0].formatted_address);
					}
				});
			});
		});

		$("#sr_location").on("keypress", function(event) {
			if (event.keyCode === 13) {
				event.preventDefault();

				geocoder.geocode({address: this.value}, function(results, status) {
					if (status === google.maps.GeocoderStatus.OK && results.length) {
						console.log(results);
						var location = results[0].geometry.location;
						setMapLatLng({
							latitude: location.lat(),
							longitude: location.lng()
						});
						// $("#sr_location").val(results[0].formatted_address);
					}
				});
			}
		});
	}
	else {
		initMap();
	}
	
});