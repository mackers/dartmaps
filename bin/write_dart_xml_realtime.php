<?

require_once 'phplib/dart_realtime.inc.php';
require_once 'XML/Util.php';

$debug = 0;

$agents = array(
        "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)",
        "Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0)",
        "Mozilla/4.0 (compatible; MSIE 5.5; Windows NT 4.0)",
        "Mozilla/4.0 (compatible; MSIE 5.5; Windows NT 5.0)",
        "Mozilla/4.0 (compatible; MSIE 5.5; Windows NT 5.1)",
        "Mozilla/4.0 (compatible; MSIE 5.21; Mac_PowerPC)",
        "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; Q321120)",
        "Mozilla/4.0 (compatible; MSIE 6.0; Windows 98)",
        "Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.7.5) Gecko/20041107 Firefox/1.0",
        "Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.0.1) Gecko/20020823 Netscape/7.0",
        "Mozilla/5.0 (X11; U; SunOS sun4u; en-US; rv:1.1) Gecko/20020827",
        "Mozilla/5.0 (X11; U; NetBSD i386; rv:1.7.3) Gecko/20041104 Firefox/0.10.1",
        "Opera/6.05 (Windows 2000; U)  [en]",
        "Opera/7.0 (Windows 2000; U)",
        "Mozilla/5.0 (Macintosh; U; PPC Mac OS X; en) AppleWebKit/125.5.5 (KHTML, like Gecko) Safari/125.11"
	);

if (!$debug)
{
	$sleep = rand(30,600);
	sleep($sleep);
}

if (!$debug)
{
	$http_proxy_host = 'proxy.33eels.com'; $http_proxy_port = 8118; 
	$http_user_agent = $agents[rand(0,count($agents)-1)];
}

$darts_connolly = get_realtime_dart_info('Connolly');

if ($debug)
{
	print_r($darts_connolly);
}

if (is_null($darts_connolly) || !is_array($darts_connolly))
{
	trigger_error("[dartmaps] Can't get realtime dart info", E_USER_ERROR);
}

$darts_howth_jct = get_realtime_dart_info('Howth Jct');
$darts_bray = get_realtime_dart_info('Bray');
#$darts_bray = get_realtime_dart_info('Maynooth');

$darts = $darts_connolly + $darts_howth_jct + $darts_bray;

$out = XML_Util::getXMLDeclaration() . "\n";

$out .= XML_Util::createStartElement(
	"yokes", 
	#array("version"=>"0.9", "latitude"=>"53.346452", "longitude"=>"-6.221820", "zoomlevel"=>"6")
	array("createdTime"=>gmdate('r', time()))
	) . "\n";

foreach ($darts as $dart)
{
	if (!station_is_supported($dart["destination_station"]))
	{
		continue;
	}

	if (!station_is_supported($dart["current_location"]))
	{
		continue;
	}

	$dart["current_location"] = get_station_alias($dart["current_location"]);

#	if ($geo = get_station_geo($dart->current_location))
#	{
#		$out .= XML_Util::createTag(
#			"yoke",
#			array("latitude"=>$geo->x, "longitude"=>$geo->y, "currentLocation"=>$dart->current_location, "originWaypoint"=>$dart->origin_station, "destinationWaypoint"=>$dart->destination_station)
#			);
#		$out .= "\n";
#	}

	$out .= XML_Util::createTag(
		"yoke",
		array	(
			#"currentLocation"=>$dart["current_location"],
			"originWaypoint"=>$dart["origin_station"],
			"destinationWaypoint"=>$dart["destination_station"],
			"markerWaypoint"=>$dart["station_at_marker"],
			"timeToMarker"=>$dart["time_to_marker"]
			)
		);
	$out .= "\n";
}

$out .= XML_Util::createEndElement(
	"yokes"
	) . "\n";

$parser = xml_parser_create();

if (!xml_parse($parser, $out))
{
	trigger_error("[dartmaps] Problem creating xml to write.", E_USER_ERROR);
}

if (!$fh = fopen('data/darts.xml', 'w'))
{
	trigger_error("[dartmaps] Can't write to data file 'data/darts.xml'", E_USER_ERROR);
}

fwrite($fh, $out);
fclose($fh);

if ($debug)
{
	echo "\nDone\n";
}

?>
