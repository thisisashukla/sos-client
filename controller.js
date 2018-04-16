// Variable definitions
var map
const ndbc_sos = 'https://sdf.ndbc.noaa.gov/sos/server.php?request=GetCapabilities&service=SOS'
const describeStationURL = 'https://sdf.ndbc.noaa.gov/sos/server.php?request=DescribeSensor&service=SOS&version=1.0.0&outputformat=text/xml;subtype=%22sensorML/1.0.1%22&procedure=urn:ioos:station:wmo:'
const local_sos = 'https://'
var GetCapabilitiesXML
var markerJSON
var stationCount
var stationArray = []
var stationGroups = L.markerClusterGroup({chunkedLoading: true});
var minDate = '';
var maxDate = '';

const obsPropMap = {
  'sea_floor_depth_below_sea_surface': 'Sea Floor Depth Below Sea Surface',
  'air_pressure_at_sea_level': 'Air Pressure At Sea Level',
  'sea_water_temperature': 'Sea Water Temperature',
  'sea_water_salinity': 'Sea Water Salinity',
  'air_temperature': 'Air Temperature',
  'currents': 'Currents',
  'waves': 'Waves',
  'winds': 'Winds'
}

function isInArray(value, array) {
  return array.indexOf(value) > -1;
}

// create popup contents
// var customPopup = "Mozilla Toronto Offices<br/><img src='http://joshuafrazier.info/images/maptime.gif' alt='maptime logo gif' width='350px'/>";

// specify popup options
// const customOptions = {
//   'maxWidth': '1200',
//   'className' : 'customPopup'
// }

var stationMarker
var map = L.map('map').setView([
  19.228825, 72.854110
], 1.5);

var OSMLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 10
});

map.addLayer(OSMLayer);

function getObservationURL(id, property) {
  // console.log(property)
  return 'https://sdf.ndbc.noaa.gov/sos/server.php?request=GetObservation&service=SOS&version=1.0.0&offering=urn:ioos:station:wmo:' + id + '&observedproperty=' + property + '&responseformat=text/xml;subtype=\"om/1.0.0\"&eventtime=latest';
}

function StringToXMLDom(string) {
  var xmlDoc = null;
  if (window.DOMParser) {
    parser = new DOMParser();
    xmlDoc = parser.parseFromString(string, "text/xml");
  } else {
    xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
    xmlDoc.async = "false";
    xmlDoc.loadXML(string);
  }
  return xmlDoc;
}

function getPropertyData(getObservationXML) {
  observedProperty = StringToXMLDom(getObservationXML);
  // console.log(getObservationXML)
}

function getProperties(observedProps) {
  var props = [];
  for (var i = 0; i < observedProps.length; i++) {
    propName = observedProps[i].outerHTML.split('/').slice(-2, -1)[0].split('"')[0]
    // console.log(propName);
    props.push(propName);
  }
  // console.log(props);
  return props;
}

function describeStation(stationXML, stationID, propList) {
  var props = [];
  // console.log(propList, propList.length)
  for (var i = 0; i < propList.length; i++) {
    // propName = observedProps[i].outerHTML.split('/').slice(-2, -1)[0].split('"')[0]
    // console.log(propList[i])
    observationURL = getObservationURL(stationID, propList[i])
    $.get(observationURL).done(function(data) {
      observedPropertyData = getPropertyData(data);

    });
    props.push('<tr><td width=\'15%\'><img src=\'./images/' + propList[i] + '.png\' width=\'30\' height=\'30\' align=\'left\'/></td><td width=\'85%\'><a href=\'' + observationURL + '\' target=\'_blank\'>   ' + obsPropMap[propList[i]] + '</a></td></tr>');
  }
  // console.log(props)
  var stationInfo = stationXML.children[0].children[0].children[0].children;
  // console.log(stationInfo)
  if (stationInfo.length > 0) {
    // var stationDes = {
    //   id: stationID,
    //   description: stationInfo[0].innerHTML,
    //   name: 'Station-' + stationID,
    //   beginTime: -1,
    //   endTIme: -1
    // }
    // if (stationInfo.length == 13) {
    //   stationDes['beginTime'] = stationInfo[5].children[0].children[0].innerHTML;
    //   stationDes['endTime'] = stationInfo[5].children[0].children[1].innerHTML;
    // }
    // console.log(stationDes);
    // TODO: optimize next statement by rendering stationXML variable in new tab
    var des = '<table style=\'width:100%\' border=\'0\'><tr><td><h1 style=\'font-size=50%;margin-top:0.5em;\'>NDBC</h1></td><td><img src=\'./images/ndbc_logo.png\' width=\'40\' height=\'40\' align=\'right\'></td></tr><tr><td colspan=\'2\'><h1>Station-' + stationID + '</h1></td></tr>' + props.join('\n') + '</table>';
    // var des = '<h1>Station-' + stationID + '</h1> <p>Hi, I am Station ' + stationID + '\nTo know more about me <a href=\'' + describeStationURL + stationID + '\' target=\'_blank\'>click here</a>,\n<p>To get my observations click on the respective links</a>' + '\n<ol>' + props.join('\n')+'</ol>';
    // var des = '<iframe src=\"http://www.ndbc.noaa.gov/widgets/station_page.php?station='+stationID+'\" style=\"border: solid thin #3366ff; width:300px; height:300px\"></iframe>'
    return des;
  } else {
    return '<p>Sorry, I am lost :('
  }
}

var co;

function spatialFiltering(state) {
  // pankaj's code here
};

L.Control.TemporalControl = L.Control.extend({
  options: {
    // topright, topleft, bottomleft, bottomright
    position: 'bottomleft',
    cluster: null,
    minValue: -1,
    maxValue: -1,
  },
  initialize: function (options) {
    // constructor
    L.Util.setOptions(this,options);
    this._cluster = this.options.cluster;
  },

  onAdd: function (map) {
    // happens after added to map
    this.options.map = map;

    var sliderContainer = L.DomUtil.create('div','slider', this._container);
    $(sliderContainer).append('<div id="leaflet-slider" style="width:200px"><div class="ui-slider-handle"></div><div id="slider-timestamp" style="width:200px; margin-top:10px;background-color:#FFFFFF"></div></div>');
    //Prevent map panning/zooming while using the slider
    $(sliderContainer).mousedown(function () {
        map.dragging.disable();
    });
    $(document).mouseup(function () {
        map.dragging.enable();
        //Only show the slider timestamp while using the slider
        $('#slider-timestamp').html('');
    });

    // calculate min and max value for the slider from GetCapabilities


  },
  onRemove: function (map) {
    // when removed
  }
});

L.control.sample = function(id, options) {
  return new L.Control.Sample(id, options);
}


function propertyFiltering(prop) {
  if(prop!='RESET') {
    for(i=0;i<stationCount-1;i++) {
      if(!isInArray(prop,stationArray[i].marker.options.observedProps)) {
        stationGroups.removeLayer(stationArray[i].marker);
        stationGroups.refreshClusters();
      }else {
        if(!stationGroups.hasLayer(stationArray[i].marker)) {
          stationGroups.addLayer(stationArray[i].marker);
          stationGroups.refreshClusters();
        }
      }
    }
  }else {
    for(i=0;i<stationCount-1;i++) {
      if(!stationGroups.hasLayer(stationArray[i].marker)) {
        stationGroups.addLayer(stationArray[i].marker);
      }
    }
    stationGroups.refreshClusters();
  }
};

$('#spatialFilter').change(function() {
  if ($('#spatialFilter').prop('checked')) {
    spatialFiltering(true);
  } else {
    spatialFiltering(false)
  }
});

$('#temporalFilter').change(function() {
  if ($('#temporalFilter').prop('checked')) {
    temporalFiltering(true);
  } else {
    temporalFiltering(false)
  }
});

$('#propertyFilter').change(function() {
  if ($('#propertyFilter').prop('checked')) {
    $('#propSelect').prop('disabled', false);
    $('#propSelect').on('change', function() {
      propertyFiltering($('#propSelect').val())
    })
  } else {
    $('#propSelect').prop('disabled', true);
    propertyFiltering('RESET')
  }
});

$.ajax({
  url: ndbc_sos,
  dataType: 'text',
  success: function(result) {
    // console.log(result);
    GetCapabilitiesXML = StringToXMLDom(result);

    // console.log(GetCapabilitiesXML)
    var capabilities = GetCapabilitiesXML.getElementsByTagName('sos:Capabilities')[0]
    // console.log(capabilities)
    var observationOfferingList = capabilities.children[3].children[0].children;
    // console.log(observationOfferingList)
    stationCount = observationOfferingList.length
    var stationCoordinates;
    var stationDetails;
    for (i = 1; i < stationCount; i++) {
      var stationHTML = '<p>Station Description: ' + observationOfferingList[i].children[0].innerHTML + '</p>';
      var stationID = observationOfferingList[i].children[1].innerHTML.split(':').pop()

      stationHTML += '<p>StationID: ' + stationID + '</p>';
      stationCoordinates = observationOfferingList[i].children[3].children[0].children[0].innerHTML.split(' ');

      stationMarker = L.marker([
        stationCoordinates[0], stationCoordinates[1]
      ], {
        stationID: stationID,
        observedProps: getProperties(observationOfferingList[i].getElementsByTagName("sos:observedProperty")),
        observedPropsXML: observationOfferingList[i].getElementsByTagName("sos:observedProperty"),
        beginTime: moment(observationOfferingList[i].getElementsByTagName("gml:beginPosition")[0].innerHTML),
        endTime: moment(observationOfferingList[i].getElementsByTagName("gml:endPosition")[0].innerHTML),
        enabled: true
      });

      // console.log(moment(observationOfferingList[i].getElementsByTagName("gml:beginPosition")[0].innerHTML)<moment(observationOfferingList[i].getElementsByTagName("gml:endPosition")[0].innerHTML))
      if(minDate == '' || moment(observationOfferingList[i].getElementsByTagName("gml:beginPosition")[0].innerHTML)<minDate) minDate = moment(observationOfferingList[i].getElementsByTagName("gml:beginPosition")[0].innerHTML)
      // if(maxDate == '' || moment(observationOfferingList[i].getElementsByTagName("gml:endPosition")[0].innerHTML)>minDate) minDate = moment(observationOfferingList[i].getElementsByTagName("gml:endPosition")[0].innerHTML)
      const popupHeading = '<p>Please wait, I am looking for my SensorML</p>'
      stationMarker.bindPopup(popupHeading);
      stationMarker.on('click', function(e) {
        // console.log(e.target.options.beginTime, e.target.options.endTime);
        var id = this.options.stationID;
        var observedProps = this.options.observedProps
        var popup = e.target.getPopup();
        setTimeout(function() {
          // console.log(e.target, e.target.options.stationID)
          $.get(describeStationURL + id).done(function(data) {
            // console.log(data)
            stationData = describeStation(data, id, observedProps);
            popup.setContent(stationData);
            popup.update();
          });
          //your code to be executed after 0.15 second
        }, 150);

      })
      stationArray.push({marker: stationMarker, id: i-1, detail: stationHTML});
      stationGroups.addLayer(stationMarker);
    }

    maxDate = moment();

    console.log(minDate, maxDate);

    // console.log('adding to layer')
    map.addLayer(stationGroups);
  },
  error: function(xhr, staus, error) {
    console.log('error in ajax', status, error);
  }
});
