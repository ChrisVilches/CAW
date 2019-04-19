$("#input-form").on("submit", function(ev){
  ev.preventDefault();

  $("#get-btn").hide();
  $("#get-btn-loading").show();

  let text = $("#words-textarea").val();
  text = text.split("\n");

  query = text
  .map(l => l.trim())
  .filter(l => l.length > 0)
  .join(",");

  $.ajax({
    type: 'GET',
    url: "http://www.felovilches.com/caw/api/words?q=" + query,
    processData: false
  })
  .done(res => {
    var template = $('#word-result-template').html();
    var html = Mustache.to_html(template, res);
    $('#result').hide();
    $('#result').html(html);
    $('#result').fadeIn();
  })
  .catch(alert)
  .done(() => {
    $("#get-btn").show();
    $("#get-btn-loading").hide();
  });

});

$('#input-form').keydown(function(event) {
  if (event.ctrlKey && event.keyCode === 13) {
    $(this).trigger('submit');
  }
});
