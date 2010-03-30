<?

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

require_once 'HTTP/Request.php';
   
function station_is_supported($station_name)
{
	$unsupported_stations = array('Maynooth', 'Balbriggan', 'Drogheda', 'Rush & Lusk', 'Salthill', 'Enfield', 'Mosney', 'Up Sligo CTC', 'Gormanston', 'Glasnevin GSR', 'Donabate', 'Nth Strand GS', 'Longford', 'Gorey', 'Dundalk', 'Balbrig South', 'Mullingar', 'Laytown', 'Skerries', 'Drumcondra');

	return  (!in_array($station_name, $unsupported_stations));
}

function get_station_alias($station_name)
{
	$station_aliases = array('Bray South' => 'Bray', 'Bray Head' => 'Bray', 'Store Street' => 'Tara Street', 'Gardiner St' => 'Tara Street');

	if (array_key_exists($station_name, $station_aliases)) $station_name = $station_aliases[$station_name];

	return $station_name;
}

function get_realtime_dart_info($station_name = NULL, $html_filename = NULL)
{
	global $http_proxy_host, $http_proxy_port, $http_user_agent, $debug;

	if (!is_null($station_name))
	{
		$drt_url = "http://www.irishrail.ie/your_journey/results.asp";

		$drt_station_codes['Balbriggan'] = 'BBDN,BBUP';
		$drt_station_codes['Bayside'] = 'BSDN,BSUP';
		$drt_station_codes['Blackrock'] = 'BKDN,BKUP';
		$drt_station_codes['Booterstown'] = 'BNDN,BNUP';
		$drt_station_codes['Bray'] = 'BRDN,BRUP';
		$drt_station_codes['Clontarf Road'] = 'FVDN,FVUP';
		$drt_station_codes['Connolly'] = 'CYP1,CYP2,CYP3,CYP4,CYP5,CYP6,CYP7';
		$drt_station_codes['Dalkey'] = 'DKDN,DKUP';
		$drt_station_codes['Donabate'] = 'DEDN,DEUP';
		$drt_station_codes['Drogheda'] = 'DADH,DA41';
		$drt_station_codes['Drumcondra'] = 'DCDN,DCUP';
		$drt_station_codes['Dun Laoghaire'] = 'DLP1,DLP2,DLDN,DLUP';
		$drt_station_codes['Glenageary'] = 'GYDN,GYUP';
		$drt_station_codes['Gormanston'] = 'GNDN,GNUP';
		$drt_station_codes['Gd Canal Dock'] = 'PE44,PE43';
		$drt_station_codes['Greystones'] = 'GSFB';
		$drt_station_codes['Harmonstown'] = 'HMDN,HMUP';
		$drt_station_codes['Howth Jct'] = 'HJDB,HJDM,HJUB,HJUM';
		$drt_station_codes['Howth'] = 'HTP1,HTP2';
		$drt_station_codes['Kilbarrack'] = 'KKDN,KKUP';
		$drt_station_codes['Killester'] = 'KRDN,KRUP';
		$drt_station_codes['Killiney'] = 'KYDN,KYUP';
		$drt_station_codes['Lansdowne Rd'] = 'LRDN,LRUP';
		$drt_station_codes['Laytown'] = 'LNDN,LNUP';
		$drt_station_codes['Malahide'] = 'MHDN,MHUP';
		$drt_station_codes['Pearse'] = 'PEP5,PEDN,PEUP';
		$drt_station_codes['Portmarnock'] = 'PKDN,PKUP';
		$drt_station_codes['Raheny'] = 'RYDN,RYUP';
		$drt_station_codes['Rush & Lusk'] = 'RLDN,RLUP';
		$drt_station_codes['Salthill'] = 'SLDN,SLUP';
		$drt_station_codes['Sandycove'] = 'SVDN,SVUP';
		$drt_station_codes['Sandymount'] = 'SMDN,SMUP';
		$drt_station_codes['Seapoint'] = 'MSDN,MSUP';
		$drt_station_codes['Shankill'] = 'SKDN,SKUP';
		$drt_station_codes['Skerries'] = 'SSDN,SSUP';
		$drt_station_codes['Sutton'] = 'SNDN,SNUP';
		$drt_station_codes['Sydney Parade'] = 'SPDN,SPUP';

		$drt_data['thispage'] = '1';
		$drt_data['station_name'] = $station_name;
		$drt_data['station'] = $drt_station_codes[$station_name];
		$drt_data['direction'] = 'A';
		$drt_data['mins'] = '60';
		$drt_data['image1.x'] = '20';
		$drt_data['image1.y'] = '15';
		$drt_data['radioservice'] = '1';
		$drt_data['radioservice1'] = '1';

		$req =& new HTTP_Request($drt_url);

		if ($http_proxy_host)
			$req->setProxy($http_proxy_host, $http_proxy_port);

		if (!$http_user_agent)
			$http_user_agent = 'Mozilla/5.0 (Macintosh; U; PPC Mac OS X Mach-O; en-US; rv:1.8.0.3) Gecko/20060426 Firefox/1.5.0.3';

		$req->addHeader('User-Agent',		$http_user_agent);
		$req->addHeader('Referer',		'http://www.irishrail.ie/home/');

		$req->addHeader('Accept',		'text/xml,application/xml,application/xhtml+xml,text/html;q=0.9,text/plain;q=0.8,image/png,*/*;q=0.5');
		$req->addHeader('Accept-Language',	'en-us,en;q=0.5');
		$req->addHeader('Accept-Encoding', 	'gzip,deflate');
		$req->addHeader('Accept-Charset',	'ISO-8859-1,utf-8;q=0.7,*;q=0.7');
		$req->addHeader('Content-Type',		'application/x-www-form-urlencoded');
		$req->addHeader('Cache-Control',	' max-age=0');

		#$req->addHeader('Keep-Alive',		'300');
		#$req->addHeader('Connection',		'keep-alive');
		#$req->addHeader('Content-Length',	'151');

		#$content_length = 0;
		#foreach ($drt_data as $key => $val)
		#{
		#	$content_length += strlen($key) + 1 + strlen($val);
		#}
		#$req->addHeader('Content-Length',	$content_length);

		$req->setMethod(HTTP_REQUEST_METHOD_POST);

		foreach ($drt_data as $key => $val)
		{
			$req->addPostData($key, $val);
		}

		/*
		   foreach ($drt_cookies as $key => $val)
		   {
		   $req->addCookie($key, $val);
		   }
		 */

		if ($debug)
		{
			echo "\n>>>> Request >>>>\n\n";
			echo $req->_buildRequest();
			echo "\n";
		}

		if (PEAR::isError($req->sendRequest()))
		{
			trigger_error("[dartmaps] Error during HTTP request", E_USER_WARNING);
			return NULL;
		}

		$html = $req->getResponseBody();

		if ($debug)
		{
			echo "\n>>>> All HTML >>>>\n\n";
			echo $html;
		}
	}
	elseif (!is_null($html_filename))
	{
		if (!($html = file_get_contents($html_filename)))
		{
			trigger_error("[dartmaps] Error open HTML file", E_USER_WARNING);
			return NULL;
		}
	}
	else
	{
		trigger_error("[dartmaps] Invalid parameters", E_USER_WARNING);
		return NULL;
	}

	if (preg_match("/There are no trains running/", $html))
	{
		return array();
	}
	
	if (!preg_match("/Due in(.*)(javascript:history.go\(-1\);|spacer\.gif|Active Server Pages)/ism", $html, $matches))
	{
		trigger_error("[dartmaps] Failed first HTML parse while requesting '$station_name' .", E_USER_WARNING);
		
		return NULL;
	}

	$html_juicy = $matches[1];

	if ($debug)
	{
		echo "\n>>>> Juicy HTML >>>>\n\n";
		echo $html_juicy;
	}

	/*
                                                                <tr>

                                                                        <td>Maynooth to Pearse</td>
                                                                        <td align="center">14:43</td>
                                                                        <td align="center">14:43</td>
                                                                        <td align="center">5 </td>
                                                                        <td align="center">57 Mins</td>
                                                                        <td>Maynooth            </td>
                                                                </tr>
	*/

       	$regex = "/<tr>\s*<td>(.*?)\s+to\s+(.*?)\s*<\/td>\s*<td align=\"center\">(\d{1,2}:\d\d)<\/td>\s*<td align=\"center\">(\d{1,2}:\d\d)<\/td>\s*<td align=\"center\">\s*(\d+)\s*<\/td>\s*<td align=\"center\">(\d+)\s*Mins<\/td>\s*<td>(.*?)<\/td>\s*<\/tr>/smi";

	if (!preg_match_all($regex, $html_juicy, $matches, PREG_SET_ORDER))
	{
		trigger_error("[dartmaps] Failed second HTML parse.", E_USER_WARNING);
		return NULL;
	}

	$darts = array();
		
	foreach ($matches as $val)
	{
		$dart = array();

		$dart["current_location"] = $val[7];
		$dart["origin_station"] = $val[1];
		$dart["destination_station"] = $val[2];
		$dart["platform"] = $val[5];
		$dart["destination_eta_time"] = $val[3];
		$dart["destination_scheduled_time"] = $val[4];
		$dart["time_to_marker"] = $val[6] * 60;
		$dart["station_at_marker"] = $station_name;

		$key = $dart["origin_station"] . '-' . $dart["station_at_marker"] . '-' . $dart["destination_station"];

		$darts[$key] = $dart;
	}

	return $darts;

}

?>
