/* quote.js - RJL Commercial online quote: prefills the design from the 3D designer and builds an email.
 * Nothing is sent to a server; the visitor's email app sends it. */
(function(){
  'use strict';
  var EMAIL = 'info@rjlcommercialgroup.com', f = document.getElementById('c-quote'), msg = document.getElementById('c-msg');
  try { var d = JSON.parse(sessionStorage.getItem('rjl-design-quote') || 'null');
        if (d && d.text){ msg.value = d.text + '\n\n'; document.getElementById('c-note').hidden = false; sessionStorage.removeItem('rjl-design-quote'); } } catch(e){}
  f.addEventListener('submit', function(e){
    e.preventDefault(); if (!f.reportValidity()) return;
    var v = function(id){ return (document.getElementById(id).value || '').trim(); };
    var body = ['Hello RJL Commercial,', '', 'Please quote the following.', '', 'Name: ' + v('c-name'), 'Company: ' + v('c-company'),
      'Phone: ' + v('c-phone'), 'Email: ' + v('c-email'), 'Site address: ' + v('c-site'), '', v('c-msg')].join('\r\n');
    window.location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Online quote - 3D designer') + '&body=' + encodeURIComponent(body);
    document.getElementById('c-sent').hidden = false;
  });
})();
