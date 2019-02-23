const socket = io('http://localhost:80')

// Send page 
$('#sendNextBtn').on('click', function() {
  var parent_fieldset = $(this).parents('fieldset');
  var next_step = true;
  // navigation steps / progress steps
  var current_active_step = $(this).parents('.f1').find('.f1-step.active');
  var progress_line = $(this).parents('.f1').find('.f1-progress-line');

  
  socket.emit('toServer', $('#userInvoice').val().trim())

  socket.on('toClient', (serverMsg) => {
    if (serverMsg.status === 'send') {
      // display invoice
      $('#serverInvoice').html(serverMsg.message)

      // next screen
      parent_fieldset.fadeOut(400, function() {
        // change icons
        current_active_step.removeClass('active').addClass('activated').next().addClass('active');
        // progress bar
        bar_progress(progress_line, 'right');
        // show next step
        $(this).next().fadeIn();
        // scroll window to beginning of the form
        scroll_to_class( $('.f1'), 20 );
      })
    }
  })

})

// Pay page
$('#payNextBtn').on('click', function() {
  var parent_fieldset = $(this).parents('fieldset');
  // navigation steps / progress steps
  var current_active_step = $(this).parents('.f1').find('.f1-step.active');
  var progress_line = $(this).parents('.f1').find('.f1-progress-line');

  console.log('1212121212')
    // next screen
    parent_fieldset.fadeOut(400, function() {
      // change icons
      current_active_step.removeClass('active').addClass('activated').next().addClass('active');
      // progress bar
      bar_progress(progress_line, 'right');
      // show next step
      $(this).next().fadeIn();
      // scroll window to beginning of the form
      scroll_to_class( $('.f1'), 20 );
    })
})


socket.on('toClient', (serverMsg) => {
  var parent_fieldset = $(this).parents('fieldset');
  // navigation steps / progress steps
  var current_active_step = $(this).parents('.f1').find('.f1-step.active');
  var progress_line = $(this).parents('.f1').find('.f1-progress-line');

  if (serverMsg.status === 'pay') {
    // echo page
    alert('echooooooo')

    // next screen
    parent_fieldset.fadeOut(400, function() {
      // change icons
      current_active_step.removeClass('active').addClass('activated').next().addClass('active');
      // progress bar
      bar_progress(progress_line, 'right');
      // show next step
      $(this).next().fadeIn();
      // scroll window to beginning of the form
      scroll_to_class( $('.f1'), 20 );
    })
  }
})