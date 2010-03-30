/** GPlotter - Plotter interface for use with Google Maps - offwhite@gmail.com - 2005-07-24        **
 ** Code licensed under Creative Commons Attribution-ShareAlike License      **
 ** http://creativecommons.org/licenses/by-sa/2.0/                           **/
function GPlotter() {

  this.VERSION = "0.5";
  this.initialized = false;
  this.mapDocument = "";
  this.maxIconNumber = 50;
  this.baseIcon = new GIcon();
  this.markers = new Array();
  this.baseIcon.shadow = "http://www.google.com/mapfiles/shadow50.png";
  this.baseIcon.iconSize = new GSize(20, 34);
  this.baseIcon.shadowSize = new GSize(37, 34);
  this.baseIcon.iconAnchor = new GPoint(9, 34);
  this.baseIcon.infoWindowAnchor = new GPoint(9, 2);
  this.baseIcon.infoShadowAnchor = new GPoint(18, 25);
  this.iconUrl = "/maps/icons/";

  this.RED = "r";
  this.GREEN = "g";
  this.BLUE = "b";
  this.color = this.GREEN;

  this.runPlotter = function(map, xmlDoc)
  {
    this.mapDocument = xmlDoc;
    var root = xmlDoc.getElementsByTagName("locations")[0];
    version = root.getAttribute("version");
    if (version == "0.9") {
      this.runPlotter09(map, xmlDoc);
    }
    else {
      alert("Locations version not supported");
    }
  }

  this.setIconUrl = function(url)
  {
    this.iconUrl = url;
  }

  this.setColor = function(c)
  {
    if (c == this.RED) {
      this.color = this.RED;
    }
    else if (c == this.GREEN) {
      this.color = this.GREEN;
    }
    else if (c == this.BLUE) {
      this.color = this.BLUE;
    }
    else {
      alert("Color not supported: " + c);
    }
  }

  this.runPlotter09 = function(map, xmlDoc)
  {
    var innerHTML = "";
    var cLat, cLong, zoomLevel;
    var root = xmlDoc.getElementsByTagName("locations")[0];
    cLat = root.getAttribute("latitude");
    cLong = root.getAttribute("longitude");
    zoomLevel = root.getAttribute("zoomlevel");
    var centerPoint = new GPoint(cLong, cLat);
    map.centerAndZoom(centerPoint, zoomLevel);

    // TODO limit to maxIconNumber 
    var locations = xmlDoc.getElementsByTagName("location");
    for (var i=0;i<locations.length;i++) {
      var node = locations[i];
      var label = node.getAttribute("label");
      var latitude = node.getAttribute("latitude");
      var longitude = node.getAttribute("longitude");

      var number = i + 1
      innerHTML = innerHTML + number + ". " + label + "<br />";
      var icon = new GIcon(this.baseIcon);
      icon.image = this.iconUrl + "icon" + this.color + ".png";
      var marker = this.createMarker09(label, longitude, latitude, icon);
      map.addOverlay(marker);
    }

    if (this.links) {
      this.links.innerHTML = innerHTML;
    }
  }

  this.createMarker09 = function(label, longitude, latitude, icon)
  {
    var point = new GPoint(longitude, latitude);
    var marker = new GMarker(point, icon);
    GEvent.addListener(marker, "click", function() {
      marker.openInfoWindowHtml("<b>" + label + "</b>");
    });
    this.markers[this.markers.length] = marker;
    return marker;
  }

  this.plot = function(themap, linksDivId, url)
  {
    if (!this.initialized) {
      var plotter = this;
      this.links = document.getElementById(linksDivId);

      var map = themap;

      var myConn = new XHConn();
      if (!myConn) {
        alert("Ajax is not supported!");
      }
      else {
        var fnWhenDone = function (oXML) { plotter.runPlotter(map, oXML.responseXML); };
        myConn.connect(url, "GET", "", fnWhenDone);
      }
      this.initialized = true;
    }
  }
}

