var fs = require('fs'), nodeio = require('node.io'), rucod = require('./store');

var basepath = '/var/www/isearch/client/cofetch/output';

var job = new nodeio.Job({
  recurse : true
}, {
  input : basepath,
  run : function(full_path) {

    var ext = (/[.]/.exec(full_path)) ? /[^.]+$/.exec(full_path) : undefined;
    console.log('ext: '+ext);
    if (ext == 'json') {
      console.log('Recreate file path       : ' + full_path);
      var context = this;
      
      fs.readFile(full_path, function(error, data) {
        if (error) {
          console.log('Recreate file read error : ' + error);
        } else {
          console.log(data);
          context.emit();/*
          rucod.store(data, true, true, false, function(error, data) {
            if (error) {
              console.log('Recreate store error     : ' + error);
            } else {
              console.log('Recreate store success   : ' + message);
            }
          });*/
        }
      });
    }

  }
});

nodeio.start(job, {});