$("#show-submit-job-form").click(function() {
  $("#submit-job").slideDown();
  return false;
});

$("#submit-job").submit(function() {
  var commitRE = /^https?:\/\/github\.com\/(.+)\/(.+)\/commit\/([0-9a-f]+)$/;
  try {
    var commitURL = $("#commit-url").val();
    var postEndpoint = $("#post-endpoint").val();
    var match = commitURL.match(commitRE);

    if (!match) {
      alert("Invalid commit URL!");
      return false;
    }

    var username = match[1];
    var reponame = match[2];
    var commit = match[3];

    // Based on https://help.github.com/articles/post-receive-hooks
    var githubPayload = {payload: JSON.stringify({
      "repository": {
        "url": "http://github.com/" + username + "/" + reponame,
        "name": reponame,
        "description": "manually submitted job",
        "owner": {
          "name": username
        }
      },
      "commits": [],
      "after": commit,
      "ref": "refs/heads/UNKNOWN"
    })};
    jQuery.ajax({
      type: 'POST',
      url: postEndpoint,
      data: JSON.stringify(githubPayload),
      error: function() {
        alert('Alas, an error occurred.');
      },
      success: function(data) {
        if (window.console)
          console.log(data);
        refreshData();
      },
      dataType: 'text',
      contentType: 'application/json'
    });
    $(this).slideUp();
  } catch (e) {
    if (window.console)
      console.error(e);
  }
  
  return false;
});

$(window).ready(function() {
  var REFRESH_DATA_INTERVAL = 60000;
  var statusRequest = null;
  var logRequest = null;

  var refreshData = window.refreshData = function() {
    if (statusRequest)
      statusRequest.abort();
    statusRequest = jQuery.getJSON('/status', function(info) {
      statusRequest = null;
      var activeJobs = info.activeJobs == 0 ? "no" : info.activeJobs;
      $(".active-jobs").text(activeJobs);
    });

    if (logRequest)
      logRequest.abort();
    if (window.location.search == "?sampledata=1")
      logRequest = jQuery.getScript("js/sample-log.js", function() {
        logRequest = null;
        showLog(SAMPLE_LOG, $("#entries"));
      });
    else
      logRequest = jQuery.get("log.json", function(log) {
        logRequest = null;
        showLog(log, $("#entries"));
      });
  }

  setInterval(refreshData, REFRESH_DATA_INTERVAL);
  refreshData();
});
