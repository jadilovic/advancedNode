$(document).ready(function () {
	// Form submittion with new message in field with id 'm'
	/* Global io */
	let socket = io();
	socket.on('user count', function (data) {
		console.log(data);
	});

	$('form').submit(function () {
		var messageToSend = $('#m').val();

		$('#m').val('');
		return false; // prevent form submit from refreshing page
	});
});
