<?php
$dev_server_ip = "192.168.2.139";

$suspects = file('suspects.txt');
$suspects = array_map(rtrim, $suspects);

if (
	in_array(getenv("REMOTE_ADDR"), $suspects) ||
	preg_match("/^194.106.151/", getenv("REMOTE_ADDR")) ||
	#preg_match("/^10.10.20/", getenv("REMOTE_ADDR")) ||
	0
)
{
  echo file_get_contents('cie.txt');
  exit();
}
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml"  xmlns:v="urn:schemas-microsoft-com:vml">
	<head>
		<title>dartmaps</title>
		<!--<script src="http://maps.google.com/maps?file=api&amp;v=2&amp;key=ABQIAAAAVb9iQ6PaJkrj5HICABppoBSVMOhal6MfnISVS8LYai7yw7q2zRQDRF78F8REEbUamsJZsdSQopACvw" type="text/javascript"></script>-->
		<meta http-equiv="Refresh" content="900"/>
<?php
	if (getenv("SERVER_ADDR") == $dev_server_ip)
	{
		echo '<script src="http://maps.google.com/maps?file=api&amp;v=2&amp;key=ABQIAAAAVb9iQ6PaJkrj5HICABppoBQRRX_skTFB1TOdJdWTgE_TCyf37xTMZeSJ_b2J0M5V3lB-FpfYIaWJNA" type="text/javascript"></script>';
	}
	else
	{
		echo '<script src="http://maps.google.com/maps?file=api&amp;v=2&amp;key=ABQIAAAAVb9iQ6PaJkrj5HICABppoBS3MerXi6WcJeZulIJMmgE7CTFRdxRos3a2jSK2ahG42jnSdhUojt1_UQ" type="text/javascript"></script>';
	}
?>
		<script src="./jslib/mapcontroller.js" type="text/javascript"></script>
		<script src="./jslib/dartmaps.js" type="text/javascript"></script>
		<script type="text/javascript">
			//<![CDATA[
		    
			window.onload = init;
			window.onresize = resizeMap;
			//window.onerror = null;

			function init()
			{
				if (GBrowserIsCompatible())
				{
					<?php
						echo "var debug = " . (getenv("SERVER_ADDR") == $dev_server_ip?"true":"false") . ";\n"; 
						echo "\t\t\t\t\tvar serverTime = " . time() . ";\n";
					?>
					initDartMaps(debug, serverTime);
				}
				else
				{
					window.alert("Your browser is not compatible with Google Maps. Bad browser, no biscuit.");
				}
			}
		    
			//]]>
		</script>
		<link type="text/css" href="styles/screen.css" rel="stylesheet" />
	</head>
	<body>
		<div id="mappanel">
			<div id="map" style="width: 500px; height: 550px"></div>
		</div>

		<div id="infopanel">
		<iframe name="infopanel" src="infopanel.php" width"200" height="600" frameborder="0"/>
		</div>


	</body>
</html>
