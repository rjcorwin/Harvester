 var couchapp = require('couchapp')
  , path = require('path')
  ;

ddoc = 
  { _id:'_design/harvester'
  , rewrites : 
    [ {from:"/", to:'app.html'}
    , {from:"/api", to:'../../'}
    , {from:"/api/*", to:'../../*'}
    , {from:"/*", to:'*'}
    ]
  }
  ;

ddoc.views = {
  by_week_number: {
    map: function(doc) {
      if(doc.Date && doc.Cost) {
        var date = new Date(doc.Date)
        var oneJan = new Date(date.getFullYear(),0,1)
        var dayDiff = date - oneJan
        // Using ceiling because your timezone will always put you back a day 
        // from the beginning of the day at UTC
        var dayOfYear =  Math.ceil(dayDiff / 86400000)
        var weekOfYear = Math.floor(dayOfYear / 7)
        emit(weekOfYear, parseFloat(doc.Cost))
      }
    },
    reduce: "_sum" 
  },
  // _design/harvester/_view/by_week_monday?group=true
  by_week_monday: {
    map: function(doc) {
      if(doc.Date && doc.Cost) {
        var start = 1;
        var today = new Date(doc.Date);
        today.setHours(0, 0, 0, 0)
        var day = today.getDay() - start;
        var date = today.getDate() - day;

        // Grabbing Start/End Dates
        var StartDate = new Date(today.setDate(date));
        var EndDate = new Date(today.setDate(date + 6));
        //emit([StartDate.getFullYear(), StartDate.getMonth()+1, StartDate.getDate()], parseFloat(doc.Cost) )
        emit(StartDate.getTime(), parseFloat(doc.Cost) )
      }
    },
    reduce: "_sum" 
  }
};

ddoc.validate_doc_update = function (newDoc, oldDoc, userCtx) {   
  if (newDoc._deleted === true && userCtx.roles.indexOf('_admin') === -1) {
    throw "Only admin can delete documents on this database.";
  } 
}

couchapp.loadAttachments(ddoc, path.join(__dirname, 'attachments'));

module.exports = ddoc;
