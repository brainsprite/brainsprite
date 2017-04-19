
var name = 'basic';

if (casper.cli.has('name')) {
  name = casper.cli.get('name')
}

var errors = [];
casper.test.begin('example_' + name , 1 , function suite(test) {
  casper.start('example_' + name + '.html');
  casper.on("remote.message", function trackConsole(msg) {
    casper.echo(msg);
    errors.push(msg);
  });
  casper.then(function(){
    casper.page.render('example_' + name + '.png');
    test.assertEquals(errors.length,0,"Clean load of page example_" + name + ".html");
  });
  casper.run(function(){test.done();});
});
