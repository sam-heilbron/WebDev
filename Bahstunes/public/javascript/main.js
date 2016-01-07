jQuery(function($) {

	//Preloader
	var preloader = $('.preloader');
	$(window).load(function(){
		preloader.remove();
	});

	// Menu	
	$('#header .nav-button').on('click',function(){
		$('#navigation').fadeIn();
	});

	$('#hidemenu').on('click', function(){
		$('#navigation').fadeOut();
	});

	$('.main-nav ul li a').on('click', function(){
		$('#navigation').fadeOut();
	});

	var slider = $('#page-slider .carousel-inner').find('.item');
	$('#page-slider').on('slid.bs.carousel', function () {
		var curIndex 	= slider.filter('.active').index();
		var menuItems 	= $('.main-nav ul').find('li');
		menuItems.removeClass('active').eq(curIndex).addClass('active');
	});

	//Contact Form
	var form = $('#contact-form');
	form.submit(function(event){
		event.preventDefault();
		var form_status = $('.form-status');
		$.ajax({
			type: "POST",
			url: "/messageBahstunes",
		}).done(function(){
			form_status.find('.form-status-content').html('<p class="text-success">Thank you for contacting us. We will get back to you as soon as possible</p>').delay(5000).fadeOut();
		});
	});

});