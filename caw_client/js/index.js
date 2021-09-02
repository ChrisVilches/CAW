const API_URL = 'http://cloud.chrisvilches.com/caw/api';

var modalPagesStack = [];

$("#input-form").on("submit", function(ev){
  ev.preventDefault();

  $("#get-btn").hide();
  $("#get-btn-loading").show();

  let text = $("#words-textarea").val();

  localStorage.setItem("previousText", text);

  query = text
  .split("\n")
  .map(l => l.trim())
  .filter(l => l.length > 0)
  .join(",");

  $.ajax({
    type: 'GET',
    url: API_URL + '/words?q=' + query,
    processData: false
  })
  .done(res => {
    localStorage.setItem("previousResult", JSON.stringify(res));
    displayResults(res);
  })
  .catch(alert)
  .done(() => {
    $("#get-btn").show();
    $("#get-btn-loading").hide();
  });

});


function displayResults(res){
  var html = getWords2HTML(res);
  $('#result').hide();
  $('#result').html(html);
  $('#result').fadeIn();
}

$('#input-form').keydown(function(event) {
  if (event.ctrlKey && event.keyCode === 13) {
    $(this).trigger('submit');
  }
});

$('#right-modal').modal({ show: false});

function getWords2HTML(wordsArray){
  var template = $('#word-result-template').html();
  var html = Mustache.to_html(template, wordsArray);
  return html;
}

function displayModal(modalTitle, modalContent, animation = false){
  function animate(el){
    if(!animation) return;

    el.animate({ marginLeft: "90", opacity: 0 }, 0, function(){
      el.animate({ marginLeft: "0", opacity: 1 }, 800);
    });
  }

  function setBody(value, domId){
    var el = $(domId);
    if(typeof value === "function"){
      el.html("Loading...");
      value(val => {
        el.html(val);
        animate(el);
      });
    } else {
      el.html(value);
      animate(el);
    }
  }

  $("#modal-title").html(modalTitle);
  setBody(modalContent, "#modal-content");

  var modalEl = $("#right-modal");

  if(!(modalEl.data('bs.modal') || {})._isShown){
    modalEl.modal('show');
  }

  modalPagesStack.push({
    title: modalTitle,
    content: modalContent
  });

  if(modalPagesStack.length == 1){
    $("#modal-back-btn").hide();
    $("#modal-close-btn").show();
  } else {
    $("#modal-back-btn").show();
    $("#modal-close-btn").hide();
  }
}

function displayModalShowWord(word){

  word = word.trim();

  displayModal(word, function(cb){

    $.ajax({
      type: 'GET',
      url: API_URL + '/words?q=' + word,
      processData: false
    })
    .done(res => {
      var html = getWords2HTML(res);
      cb(html);
    })
    .catch(alert)
    .done(() => {

    });

  }, true);
}

function goBack(){

  modalPagesStack.pop();

  if(modalPagesStack.length == 0){
    $("#right-modal").modal('hide');
    return;
  }

  var last = modalPagesStack.pop();

  displayModal(last.title, last.content);
}

$("#right-modal").on("hidden.bs.modal", function() {
  modalPagesStack = [];
});

$(document).ready(function(){

  var previousText = localStorage.getItem("previousText") || "";
  var previousResult = localStorage.getItem("previousResult");
  $("#words-textarea").val(previousText);

  if(previousResult != null){
    displayResults(JSON.parse(previousResult));
  }
});
