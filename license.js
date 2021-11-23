define([], function () {

	function hx(s) { 
	// creates a hash (integer) from a given string s
	  var x = 0;
	  for (var j = 0; j < s.length; j++) {
		x  = ((x << 5) - x) + s.charCodeAt(j)
		x |= 0;
	  }
	  return Math.abs(x);
	}

	function hm(h,e) {  
	// creates a hashstring from hostname h and extension name e
		const o = hx(h);
		const u = hx(e);
		var cmap = [];
		var n;
		var i;
		for (n = 0; n < h.length; n++) for (i = 11; i <= 36; i++) if(cmap.length<0x130) 
			cmap.push((Math.E.toString().substr(2,8)* h.charCodeAt(n) + o + u).toString(i));
		return cmap.join('');
	}


    function patternize(hn, p) {
	// returns the pattern p if the hostname is like the pattern, or the original hostname if not
		var rgx = new RegExp('^' + p.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
		return hn.match(rgx) == null ? hn : p
    }

	function isValid(l,c,h,e) {
		// provide function with l=license, c=checksum, h=hostname, e=extension name 
			//console.log('license check(',l,c,h,e,')')
			var ret = {valid: 0==1, expiry: null, licenseOk: 1==0};
			if (l && c ) {
				const mx = hm(h,e);
				const p = Math.sqrt(parseInt(c,8)-0x6AC);
				const mm = (p/2-0x32)%12;
				ret.expiry =  new Date(p<0x64?0x270f:(0x7e6+Math.floor((p-1e2)/24)),
					p>=1e2?Math.floor(mm):11, p<1e2?0x1e:(mm%1*30)) * 1;
				ret.expiry += 0x5265BFF;
				ret.licenseOk = mx.substr(p||1e6,7) == (l*1).toString(36);
				ret.valid = ret.licenseOk && Date.now() <= ret.expiry;
			}
			return ret;
		}


	return {

		chkLicenseJson: function(lstr, ext, pHostname, asHtml) {
			// returns a boolean or a html report after iterating through the license array "lstr" (provide as string)
			// and checking if any of the licenses contained within that array are applicable for the given "pHostname" 
			// and a valid license for extension "ext"
			const hostname = pHostname || location.hostname; // use current url's hostname if no hostname param provided
			var report = '<p>Checking license for hostname "' + hostname + '"</p><br>'
					+ '<table><tr><th>Domain</th><th>Applies?</th><th>License No.</th><th>CheckSum</th><th>Expires</th><th>Valid?</th></tr>';
			var anyApplicable = false;
			var anyValid = false;
			try {
				const j = JSON.parse(lstr);
				for (const ho in j) {
					const applicable = ho == patternize(hostname, ho);
					anyApplicable = anyApplicable || applicable;
					const isValidRes = isValid(j[ho][0], j[ho][1], ho, ext);
					anyValid = anyValid || isValidRes.valid;
					report += (`<tr><td>${ho}</td><td>${applicable}</td><td>${j[ho][0]}</td><td>${j[ho][1]}</td>`
						+ `<td>${new Date(isValidRes.expiry).toDateString()}</td><td>${isValidRes.valid}</td></tr>`);
				}
				report += '</table><br><p>'	+ (anyValid && anyApplicable ? 
					'<strong>&#10003;</strong> You have a valid and applicable license' 
					: '&#10060; Your license is not valid or not applicable') + '</p>';
				return asHtml ? report : (anyValid && anyApplicable)
			}
			catch (err) {
				return asHtml ? "<p>Error: This isn't a valid license.</p>" : false;
			}
		}
	}
})
