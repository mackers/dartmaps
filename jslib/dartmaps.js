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

function initDartMaps(debug, serverTime)
{
	// resize map area to size of screen
	resizeMap();
	window.onresize = resizeMap;

	// create map object
	mapc = new MapController(document.getElementById("map"));
	mapc.gmap.setCenter(new GLatLng(53.34, -6.15), 11);

	mapc.yokeicon.image = "gicons/dartmaps/train1.png";
	mapc.yokeicon.shadow = "gicons/dartmaps/train_shadow.png";
	mapc.waypointDataFile = "data/stations.xml";
	mapc.waypointLargeImage = "gicons/dartmaps/station_large.png";
	mapc.waypointSmallImage = "gicons/dartmaps/station.png";

	mapc.routeWeight = 7;
	mapc.routeOpacity = 0.5;
	mapc.debug = debug;
	mapc.timeOffset = 0;

	useRealTime = 1;

	if (useRealTime)
	{
		mapc.yokeDataFile = "data/darts.xml";
		mapc.ignoreClockShift = 1;
		mapc.onReloadYokes = writeStats;
	}
	else
	{
		mapc.yokeDataFile = "darts.php";
		mapc.ignoreClockShift = 1;
	}

	mapc.initDate(serverTime);
	mapc.init();

	//setTimeout("writeStats()", 10000);
}

function resizeMap()
{
	var frameWidth;
	var frameHeight;

	if (self.innerWidth)
	{
		frameWidth = self.innerWidth;
		frameHeight = self.innerHeight;
	}
	else if (document.documentElement && document.documentElement.clientWidth)
	{
		frameWidth = document.documentElement.clientWidth;
		frameHeight = document.documentElement.clientHeight;
	}
	else if (document.body)
	{
		frameWidth = document.body.clientWidth;
		frameHeight = document.body.clientHeight;
	}

	document.getElementById("map").style.width = (frameWidth) + "px";
	document.getElementById("map").style.height = (frameHeight) + "px";
	//document.getElementById("infopanel").style.height = (frameHeight - 100) + "px";
}

function writeStats()
{
	var lastTime;

	if (!mapc || !mapc.yokes)
	{
		return;
	}

	var infopanel = window.infopanel.document;

	for (var i = 0; i < mapc.yokes.length; i++)
	{
		var tr = infopanel.createElement('tr');
	
		/*
		var td = document.createElement('td');
		td.appendChild(document.createTextNode(i));
		tr.appendChild(td);
		*/

		var td = infopanel.createElement('td')
		td.appendChild(infopanel.createTextNode(mapc.yokes[i].route.from));
		tr.appendChild(td);

		var td = infopanel.createElement('td')
		td.appendChild(infopanel.createTextNode(mapc.yokes[i].route.to));
		tr.appendChild(td);
		
		var td = infopanel.createElement('td')
		td.appendChild(infopanel.createTextNode(mapc.yokes[i].lastKnownWaypointName));
		tr.appendChild(td);
		
		if (!mapc.yokes[i].hasBeenMarked)
		{
			tr.setAttribute('class', 'statsdartnotmarked');
		}

		infopanel.getElementById('statstabletbody').appendChild(tr);

		lastTime = mapc.yokes[i].lastKnownTime;
	}

	infopanel.getElementById('statsnow').firstChild.nodeValue = lastTime;

	var now = new Date();
	var lastTimeDate = new Date(lastTime);

	if (lastTimeDate.getTime() < (now.getTime() - (60*60*1000)))
	{
		if (infopanel.getElementById('errorbox'))
		{
			infopanel.getElementById('errorbox').firstChild.nodeValue = "Data is > 1hr old: There must be a problem pulling the real-time data.";
		}
		
		//alert("The real-time data is over 1hr old. There must be a problem accessing the DART website for the times.");
	}
}


