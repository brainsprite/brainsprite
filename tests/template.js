const path = require('path');
const http = require('http');

const build_out = function (file, prefix, suffix) {
  const file_base = file.split('.')[0]
  return `${path.resolve(__dirname)}/` + prefix + file_base + suffix + '.png'
}

module.exports.screenshot = (file, clip, file_out) => {

  describe('index page', () => {
    let page;
    beforeAll(async () => {
      page = await __BROWSER__.newPage();
      await page.goto('http://localhost:8080/' + file);

      await page.screenshot({
        clip: clip,
        path: file_out,
      });

    }, 5000);

    afterAll(async () => {
      await page.close();
    });

    it(
      'loads the index page HTTP',
      (done) => {
        http.request({
          hostname: 'localhost',
          port: 8080,
          path: '/' + file
      },
      (response) => {
        expect(response.statusCode).toBe(200);
        done();
      }).end();
    });
  });
}


module.exports.fullTest = (file, clip) => {
  if ('TEST_RUN' in process.env && process.env.TEST_RUN === 'init') {
    let img_ref = build_out(file, '', '_reference')
    module.exports.screenshot(file, clip, img_ref)
  }

  let img = build_out(file, '', '')
  module.exports.screenshot(file, clip, img)

  let img_thumb = build_out(file, '../docs/build/html/_images/sphx_glr_', '_thumb')
  module.exports.screenshot(file, clip, img_thumb)
}
