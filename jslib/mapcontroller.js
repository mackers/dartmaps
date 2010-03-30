/*
    http://dartmaps.mackers.com/

    This file is part of dartmaps.

    dartmaps is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    dartmaps is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with dartmaps.  If not, see <http://www.gnu.org/licenses/>.
*/

// static map controller object
var mapc;

/*
 * the MapController class
 */
function MapController(gmapElem)
{
	this.showSmallControl = false;
	this.showLargeControl = true;
	this.showMapTypeControl = true;
	this.showRoutes = true;
	this.showWaypoints = true;
	this.showYokes = true;

	this.yokeDataFile = "";
	this.waypointDataFile = "";
	this.waypointLargeImage = "";
	this.waypointSmallImage = "";

	this.previousZoomLevel = 10;

	this.gmap = null;
	this.gmapSmallControl = null;
	this.gmapLargeControl = null;
	this.gmapMapTypeControl = null;

	this.waypoints = new Array();
	this.routes = new Array();
	this.yokes = new Array();

	this.init = _mapcontroller_init;
	this.initDate = _mapcontroller_initDate;
	this.getDate = _mapcontroller_getDate;
	this.reloadGMapControls = _mapcontroller_reloadGMapControls;
	this.reloadWaypointsAndRoutes = _mapcontroller_reloadWaypointsAndRoutes;
	this.redrawWaypointsAndRoutes = _mapcontroller_redrawWaypointsAndRoutes;
	this.reloadYokes = _mapcontroller_reloadYokes;
	this.redrawYokes = _mapcontroller_redrawYokes;
	this.getRoute = _mapcontroller_getRoute;
	this.cancelFollows = _mapcontroller_cancelFollows;
	this.setYokeLabelText = _mapcontroller_setYokeLabelText;
	this.logDebug = _mapcontroller_logDebug;
	this.logError = _mapcontroller_logError;
	this.onReloadYokes = function() {};

	// create new gmap in map area
	this.gmap = new GMap2(gmapElem);

	this.gmapSmallControl = new GSmallMapControl();
	this.gmapLargeControl = new GLargeMapControl();
	this.gmapMapTypeControl = new GMapTypeControl();
	this.reloadGMapControls();
	
	this.gmap.setCenter(new GLatLng(53.34, -6.15), 11);

	GEvent.addListener(this.gmap, 'zoomend', function() {
		mapc.redrawWaypointsAndRoutes();
		mapc.cancelFollows();
		mapc.setYokeLabelText("");
	});

	// yoke icon
	this.yokeicon = new GIcon();
	this.yokeicon.iconSize = new GSize(22, 19);
	this.yokeicon.shadowSize = new GSize(0, 0);
	this.yokeicon.iconAnchor = new GPoint(6, 20);
	this.yokeicon.infoWindowAnchor = new GPoint(5, 1);

	this.yokeLabel = document.createElement("div");
	this.yokeLabel.appendChild(document.createTextNode("dartmaps"));
	this.yokeLabel.setAttribute("id", "yokeLabel");
	document.getElementsByTagName("body").item(0).appendChild(this.yokeLabel);
}

function _mapcontroller_logDebug(msg)
{
	if (mapc.debug) GLog.write(msg);
}

function _mapcontroller_logError(msg)
{
	if (mapc.debug) GLog.write(msg);
}

function _mapcontroller_init()
{
	if (mapc.debug) mapc.logDebug("starting dartmaps debug mode");

	// load waypoints and routes
	this.reloadWaypointsAndRoutes();

	// draw waypoints and routes
	this.redrawWaypointsAndRoutes();

	// load yokes
	//this.reloadYokes();

	// draw yokes 
	//redrawYokes();
}

function _mapcontroller_initDate(st)
{
	if (this.ignoreClockShift)
	{
		mapc.logDebug("ignoring clock shift factors");
		return;
	}
	
	var client = new Date();

	var server = new Date();
	server.setTime(st*1000);

	this.timeOffset = client.getTime() - server.getTime();

	mapc.logDebug("client time is " + client);
	mapc.logDebug("server time is " + server);
}

function _mapcontroller_getDate()
{
	var now = new Date();
	now.setTime(now.getTime() - this.timeOffset);
	return now;
}

function _mapcontroller_setYokeLabelText(msg)
{
	if (msg == "")
	{
		this.yokeLabel.setAttribute("style", "display: none;");
		this.yokeLabel.style.display = 'none';
	}
	else
	{
		this.yokeLabel.setAttribute("style", "display: block;");
		this.yokeLabel.style.display = 'block';

		if (this.yokeLabel.firstChild)
			this.yokeLabel.firstChild.nodeValue = msg;
	}
}

function _mapcontroller_cancelFollows()
{
	for (var i = 0; i < this.yokes.length; i++)
	{
		this.yokes[i].following = false;
	}
}

function _mapcontroller_getRoute(originWaypoint, destinationWaypoint)
{
	for (var i = 0; i < this.routes.length; i++)
	{
		if (this.routes[i].from == originWaypoint && this.routes[i].to == destinationWaypoint)
		{
			return this.routes[i];
		}
		else if (this.routes[i].to == originWaypoint && this.routes[i].from == destinationWaypoint)
		{
			return this.routes[i].getReverseRoute();
		}
	}

	mapc.logError("No route found between " + originWaypoint + " and " + destinationWaypoint);

	return null;
}

function _mapcontroller_reloadYokes()
{
	this.yokes = new Array();

	var request = GXmlHttp.create();
	request.open("GET", this.yokeDataFile, true);
	request.onreadystatechange = function()
	{
		if (request.readyState == 4)
		{
			var xmlDoc = request.responseXML;
			var xmlYokes = xmlDoc.documentElement.getElementsByTagName("yoke");

			var createdTime = new Date();

			//if (!mapc.ignoreClockShift)
				createdTime.setTime(Date.parse(xmlDoc.documentElement.getAttribute("createdTime")));

			for (var i = 0; i < xmlYokes.length; i++)
			{
				var yoke = new Yoke(0,0,createdTime);

				yoke.route = mapc.getRoute(
						xmlYokes[i].getAttribute("originWaypoint"),
						xmlYokes[i].getAttribute("destinationWaypoint")
				);

				if (yoke.route == null)
				{
					continue;
				}

				if (xmlYokes[i].getAttribute("currentLocation"))
				{
					yoke.setLastKnownWaypointName(xmlYokes[i].getAttribute("currentLocation"));
				}
				else
				{
					var l = yoke.route.findWaypointName(xmlYokes[i].getAttribute("markerWaypoint"), xmlYokes[i].getAttribute("timeToMarker"));

					if (l != "")
					{
						yoke.setLastKnownWaypointName(l);
						mapc.logDebug("Yoke arriving at " + xmlYokes[i].getAttribute("markerWaypoint") + " in " + (xmlYokes[i].getAttribute("timeToMarker")/60) + " mins is probably currently at " + l);
					}
				}

				//yoke.lastKnownWaypointName = xmlYokes[i].getAttribute("currentLocation");
				//yoke.lastKnownTime = createdTime;

				mapc.yokes.push(yoke);
			}

			mapc.redrawYokes();

			mapc.onReloadYokes();
		}
	}
	request.send(null);
}

function _mapcontroller_redrawYokes()
{
	for (var i = 0; i < this.yokes.length; i++)
	{
		if (this.showYokes)
		{
			this.yokes[i].plot(this.gmap);
		}
		else
		{
			this.gmap.removeOverlay(this.yokes[i].getGMarker());
		}
	}

	if (this.showYokes)
	{
		setTimeout('mapc.redrawYokes()', 1000);
	}
}

function _mapcontroller_reloadWaypointsAndRoutes()
{
	this.waypoints = new Array();
	this.routes = new Array();

	var request = GXmlHttp.create();

	if (request == null)
	{
		window.alert("Can't create GXmlHttp object -- unsupported by browser?");
		return;
	}
	
	request.open("GET", this.waypointDataFile, true);
	request.onreadystatechange = function()
	{
		if (request.readyState == 4)
		{
			var xmlDoc = request.responseXML;
			var xmlWaypoints = xmlDoc.documentElement.getElementsByTagName("waypoint");

			for (var i = 0; i < xmlWaypoints.length; i++)
			{
				var waypoint = new Waypoint(parseFloat(xmlWaypoints[i].getAttribute("latitude")),
						parseFloat(xmlWaypoints[i].getAttribute("longitude")),
						xmlWaypoints[i].getAttribute("name"));

				waypoint.largeImage = mapc.waypointLargeImage;
				waypoint.smallImage = mapc.waypointSmallImage;

				mapc.waypoints.push(waypoint);
			}

			var xmlRoutes = xmlDoc.documentElement.getElementsByTagName("route");

			for (var i = 0; i < xmlRoutes.length; i++)
			{
				var route = new Route(xmlRoutes[i].getAttribute("from"), xmlRoutes[i].getAttribute("to"));

				route.display = xmlRoutes[i].getAttribute("display");
				route.name = xmlRoutes[i].getAttribute("name");

				if (xmlRoutes[i].getAttribute("duration"))
				{
					route.duration = parseInt(xmlRoutes[i].getAttribute("duration"));
				}

				var xmlLocations = xmlRoutes[i].getElementsByTagName("location")

				for (var j = 0; j < xmlLocations.length; j++)
				{
					if (waypoint = xmlLocations[j].getAttribute("waypoint"))
					{
						for (var k = 0; k < mapc.waypoints.length; k++)
						{
							if (mapc.waypoints[k].name == xmlLocations[j].getAttribute("waypoint"))
							{
								route.addPoint(mapc.waypoints[k].GLatLng.lat(), mapc.waypoints[k].GLatLng.lng(), mapc.waypoints[k].name);
							}
						}
					}
					else if (xmlLocations[j].getAttribute("longitude"))
					{
						route.addPoint(parseFloat(xmlLocations[j].getAttribute("latitude")), parseFloat(xmlLocations[j].getAttribute("longitude")), "");
					}
					else if (xmlLocations[j].getAttribute("routefrom"))
					{
						for (var k = 0; k < mapc.routes.length; k++)
						{
							if (mapc.routes[k].from == xmlLocations[j].getAttribute("routefrom") &&
								mapc.routes[k].to == xmlLocations[j].getAttribute("routeto"))
							{
								route.concatRoute(mapc.routes[k]);
							}
						}
					}
				}

				mapc.routes.push(route);
			}

			// display waypoints and routes
			mapc.redrawWaypointsAndRoutes();

			// routes are loaded -- now do yokes
			mapc.reloadYokes();
		}
	}

	request.send(null);
}

function _mapcontroller_redrawWaypointsAndRoutes()
{
	for (var i = 0; i < this.routes.length; i++)
	{
		if (this.routes[i].display != 'none')
		{
			this.gmap.removeOverlay(this.routes[i].getGPolyline());

			if (this.showRoutes)
			{
				this.gmap.addOverlay(this.routes[i].getGPolyline());
			}
		}
	}

	for (var i = 0; i < this.waypoints.length; i++)
	{
		this.gmap.removeOverlay(this.waypoints[i].getGMarker());

		if (this.showWaypoints)
		{
			this.gmap.addOverlay(this.waypoints[i].getGMarker(true));
		}
	}
}

function _mapcontroller_reloadGMapControls()
{
	this.gmap.removeControl(this.gmapSmallControl);
	this.gmap.removeControl(this.gmapLargeControl);
	this.gmap.removeControl(this.gmapMapTypeControl);

	if (this.showSmallControl) this.gmap.addControl(this.gmapSmallControl);
	if (this.showLargeControl) this.gmap.addControl(this.gmapLargeControl);
	if (this.showMapTypeControl) this.gmap.addControl(this.gmapMapTypeControl);
}

/* 
 * the yoke class 
 */
function Yoke(latitude, longitude, when)
{
	//this.longitude = 0;
	//this.latitude = 0;

	this.route = null;

	this.lastKnownLocation = null;
	this.lastKnownWaypointName = "";
	this.lastKnownTime = when;
	this.hasBeenMarked = false;
	this.following = false;

	this.GLatLng = null;
	this.GMarker = null;

	this.plot = _yoke_plot;
	this.getGMarker = _yoke_getGMarker;
	this.onMapClick = _yoke_onMapClick;
	this.onInfoWindowClose = _yoke_onInfoWindowClose;
	this.setLastKnownWaypointName = _yoke_setLastKnownWaypointName;
	this.setLocation = _yoke_setLocation;
	//this.showInfoWindow = _yoke_showInfoWindow;

	this.setLocation(latitude, longitude);
}

function _yoke_setLocation(latitude, longitude)
{
	//this.longitude = longitude;
	//this.latitude = latitude;
	this.lastKnownLocation = new GLatLng(latitude, longitude);
	this.GLatLng = new GLatLng(latitude, longitude);
}

function _yoke_setLastKnownWaypointName(name)
{
	this.lastKnownWaypointName = name;

	for (var i = 0; i < mapc.waypoints.length; i++)
	{
		if (mapc.waypoints[i].name == name)
		{
			this.setLocation(mapc.waypoints[i].GLatLng.lat(), mapc.waypoints[i].GLatLng.lng());

			return;
		}
	}

	mapc.logError("Unable to plot yoke at '" + name + "'");
}

function _yoke_plot(onGMap)
{
	if (this.route == null)
	{
		return;
	}

	if (this.lastKnownWaypointName == this.route.from)
	{
		// yoke is stationary, don't move
		//this.longitude = this.route.points[0].longitude;
		//this.latitude = this.route.points[0].latitude;
		this.GLatLng  = new GLatLng(this.route.points[0].lat(), this.route.points[0].lng());
	}
	else
	{
		var now = mapc.getDate();

		//now.setTime(now.getTime() - (1000*60*10));

		var secondsSinceLastKnownLocation = Math.floor((now.getTime() - this.lastKnownTime.getTime()) / 1000);
		if (secondsSinceLastKnownLocation < 0) secondsSinceLastKnownLocation = 0;

		var distanceSinceLastKnownLocation = secondsSinceLastKnownLocation * (this.route.distance / this.route.duration);

		var plotting = false;

		for (var i = 0; i < this.route.points.length; i++)
		{
			if (plotting || 
				(this.lastKnownLocation.lat() == this.route.points[i].lat() && 
				this.lastKnownLocation.lng() == this.route.points[i].lng()))
			{
				plotting = true;

				if (i+1 < this.route.points.length)
				{
					var distanceToNextPoint = Math.sqrt(
						Math.pow(this.route.points[i].lng() - this.route.points[i+1].lng(), 2) +
						Math.pow(this.route.points[i].lat() - this.route.points[i+1].lat(), 2)
						);

					if (distanceSinceLastKnownLocation < distanceToNextPoint)
					{
						x0 = this.route.points[i].lng();
						y0 = this.route.points[i].lat();
		
						x1 = this.route.points[i+1].lng();
						y1 = this.route.points[i+1].lat();

						e = distanceSinceLastKnownLocation;
						d = distanceToNextPoint;

						x2 = x0 + ((x1-x0)*(e/d));
						y2 = y0 + ((y1-y0)*(e/d));
				
						//this.longitude = x2;
						//this.latitude = y2;
						this.GLatLng = new GLatLng(y2, x2);
			
						break;
					}
					else
					{
						// point is in next segment
						distanceSinceLastKnownLocation -= distanceToNextPoint;
						//this.longitude = this.route.points[i].longitude;
						//this.latitude = this.route.points[i].latitude;
						this.GLatLng = new GLatLng(this.route.points[i].lat(), this.route.points[i].lng());
					}
				}
				else
				{
					//this.longitude = this.route.points[this.route.points.length-1].longitude;
					//this.latitude = this.route.points[this.route.points.length-1].latitude;
					this.GLatLng = new GLatLng(this.route.points[this.route.points.length-1].lat(), this.route.points[this.route.points.length-1].lng());
				}
			}
		}
	}

	var bounds = mapc.gmap.getBounds();

	// don't draw if it's not visible
	if (bounds.contains(this.GLatLng))
	{
		if (!this.hasBeenMarked)
		{
			this.GMarker = this.getGMarker();
			onGMap.addOverlay(this.GMarker);
			this.hasBeenMarked = true;
		}

		this.GMarker.setPoint(this.GLatLng);

		if (this.following)
		{
			mapc.gmap.panTo(this.GLatLng);
		}
	}
}

function _yoke_getGMarker()
{
	if (this.GLatLng == null)
	{
		return null;
	}

	if (this.GMarker)
	{
		return this.GMarker;
	}

	this.GMarker = new GMarker(this.GLatLng, mapc.yokeicon);

	if (this.route != null)
	{
		GEvent.bind(this.GMarker, "click", this, this.onMapClick);
	}

	return this.GMarker;
}

function _yoke_onMapClick()
{

if (mapc.debug)
{
mapc.logDebug("yoke is " + this.lastKnownWaypointName + ", " + this.GLatLng.toString());
this.route.draw();
}
	if (this.following)
	{
		this.onInfoWindowClose();
		mapc.setYokeLabelText("");
	}
	else
	{
		mapc.cancelFollows();

		var previousZoomLevel = mapc.gmap.getZoom();

		if (previousZoomLevel == 15)
		{
			mapc.gmap.panTo(this.GLatLng);
		}
		else
		{
			mapc.previousZoomLevel = previousZoomLevel;
			mapc.gmap.setCenter(this.GLatLng, 15);
		}

		mapc.setYokeLabelText(this.route.getDescription());

		this.following = true;
	}
}

/*
function _yoke_showInfoWindow()
{
	this.cancelIWClose = true;
	mapc.gmap.closeInfoWindow();
	this.cancelIWClose = false;

	var lastDesc = "<strong>" + this.route.getDescription() + "</strong>";
	mapc.gmap.openInfoWindowHtml(this.GLatLng, lastDesc);

	mapc.infowinevent = GEvent.bind(mapc.gmap, 'infowindowclose', this, this.onInfoWindowClose);

	//this.cancelIWClose = false;
}
*/

function _yoke_onInfoWindowClose()
{
	//if (this.cancelIWClose) return;

	this.following = false;

	mapc.gmap.setZoom(mapc.previousZoomLevel);

	//this.route.undraw();
}

/*
 * the point class
 */
function Point(latitude, longitude, name)
{
	this.longitude = longitude;
	this.latitude = latitude;
	this.name = name;

	this.lng = _point_lng;
	this.lat = _point_lat;
	this.toString = _point_toString;
}

function _point_toString()
{
	return this.latitude + "," + this.longitude;
}

function _point_lng()
{
	return this.longitude;
}

function _point_lat()
{
	return this.latitude;
}

/* 
 * the waypoint class 
 */
function Waypoint(latitude, longitude, name)
{
	//this.longitude = longitude;
	//this.latitude = latitude;
	this.name = name;
	this.GMarker = null;
	this.GLatLng = new GLatLng(latitude, longitude);

	this.getGMarker = _waypoint_getGMarker;
	this.onMapClick = _waypoint_onMapClick;
}

function _waypoint_getGMarker(redraw)
{
	if (!this.GMarker || redraw)
	{
		var icon = new GIcon();

		if (mapc.gmap.getZoom() < 5)
		{
			icon.image = this.largeImage;
			icon.iconSize = new GSize(10, 10);
		}
		else
		{
			icon.image = this.smallImage;
			icon.iconSize = new GSize(5, 5);
		}

		icon.iconAnchor = new GPoint(0, 0);
		icon.infoWindowAnchor = new GPoint(0, 0);

		this.GMarker = new GMarker(this.GLatLng, icon);

		GEvent.bind(this.GMarker, "click", this, this.onMapClick);
	}

	return this.GMarker;
}

function _waypoint_onMapClick()
{
	var lastDesc = "<strong>" + this.name + "</strong>";

	this.GMarker.openInfoWindowHtml(lastDesc);
}

/* 
 * the route class
 */
function Route(from, to)
{
	this.from = from;
	this.to = to;
	this.points = new Array();
	this.display = '';
	this.name = '';
	this.distance = 0;
	this.duration = 0;

	this.GPolyline = null;

	this.addPoint = _route_addPoint;
	this.concatRoute = _route_concatRoute;
	this.getReverseRoute = _route_getReverseRoute;
	this.getDescription = _route_getDescription;

	this.draw = _route_draw;
	this.undraw = _route_undraw;
	this.getGPolyline = _route_getGPolyline;
	this.getPoint = _route_getPoint;
	this.toString = _route_toString;

	this.findWaypointName = _route_findWaypointName;
}

function _route_getPoint(i)
{
	var p =this.GPolyline.getPoint(i);
	mapc.gmap.addOverlay(new GMarker(p));
}

function _route_toString()
{      
	return "'" + this.name + "': " + this.from + /*" (" + this.points[0].toString() + ")" +*/ " to " + this.to + /*" (" + this.points[this.points.length-1].toString() + ")" + */ ", duration " + this.duration/3600 + " hours";
}  

function _route_addPoint(latitude, longitude, name)
{
	var newPoint = new Point(latitude, longitude, name);

	//mapc.logDebug("added point " + newPoint.toString() + " to route " + this.toString());

	var numPoints = this.points.push(newPoint);

	if (numPoints > 1)
	{
		var lastPoint = this.points[numPoints-2];
		
		this.distance += Math.sqrt(
					Math.pow(newPoint.lng() - lastPoint.lng(), 2) +
					Math.pow(newPoint.lat() - lastPoint.lat(), 2)
					);
	}

	this.GPolyline = null;
}

function _route_getDescription()
{
	return this.from + " to " + this.to;
}

function _route_concatRoute(route)
{
	this.points = this.points.concat(route.points);

	this.distance += route.distance;
	
	this.duration += route.duration;

	this.GPolyline = null;
}

function _route_getReverseRoute()
{
	var newRoute = new Route(this.to, this.from);

	newRoute.duration = this.duration;

	for (var i = this.points.length; i > 0; i--)
	{
		newRoute.addPoint(this.points[i-1].lat(), this.points[i-1].lng(), this.points[i-1].name);
	}
	
	return newRoute;
}

function _route_draw()
{
	if (this.GPolyline == null)
	{
		this.getGPolyline();
	}

	if (this.GPolyline != null)
	{
		mapc.gmap.addOverlay(this.GPolyline);
	}
}

function _route_undraw()
{
	if (this.GPolyline == null)
	{
		this.getGPolyline();
	}

	mapc.gmap.removeOverlay(this.GPolyline);
}

function _route_getGPolyline()
{
	if (this.GPolyline != null)
	{
		return this.GPolyline;
	}
	
	var gpoints = new Array(this.points.length);

	for (var i = 0; i < this.points.length; i++)
	{
		gpoints[i] = new GLatLng(this.points[i].lat(), this.points[i].lng());
	}

	if (this.display != 'none')
	{
		color = this.display;
	}

	this.GPolyline =  new GPolyline(gpoints, color, 7, 0);

	return this.GPolyline;
}

function _route_findWaypointName(marker, time)
{
	var markerPoint = -1;
	var timeDec = time;

	for (var i = 0; i < this.points.length; i++)
	{
		if (this.points[i].name == marker)
		{
			markerPoint = i;
		}
	}

	if (markerPoint == -1)
	{
		mapc.logError("No waypoint found named '" + marker + "'");
		return "";
	}

	for (var i = markerPoint; i >= 0; i--)
	{
		if (timeDec < 0 && this.points[i].name != "")
		{
			return this.points[i].name;
		}
		
		var distanceFromLastPoint = 0;

		if (this.points[i+1])
		{
			distanceFromLastPoint = Math.sqrt(
					Math.pow(this.points[i].lng() - this.points[i+1].lng(), 2) +
					Math.pow(this.points[i].lat() - this.points[i+1].lat(), 2)
					);
		}

		var routeVelocity = (this.distance / this.duration);

		var timeFromLastPoint = distanceFromLastPoint / routeVelocity;

		timeDec -= timeFromLastPoint;
	}

	mapc.logError("Ran out of waypoints in " + this.getDescription() + " for " + marker + "/" + (time/60));

	return "";
}

