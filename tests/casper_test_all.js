
var list_test = [ 'basic' , 'overlay' , 'full' , 'colormap' , 'click' ,  'slice_coordinates' , 'slice_numbers' , 'value' , 'white'];
list_test.forEach( function(name){
  casper.test.begin('test_' + name , 1 , function (test) {
    var errors = [];
    casper.start('example_' + name + '.html');

    casper.on("remote.message", function(msg) {
      casper.echo(msg);
      errors.push(msg);
    });

    casper.then(function(){
      casper.page.render('example_' + name + '.png');
      test.assertEquals(errors.length,0,"Clean load of page example_" + name + ".html");
    });

    casper.run(function() {
      test.done();
    });
  });
});
