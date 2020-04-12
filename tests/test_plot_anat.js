const path = require('path');
const http = require('http');
const file = 'plot_anat.html'

describe('index page', () => {
  let page;

  beforeAll(async () => {
    page = await __BROWSER__.newPage();
    await page.goto('http://localhost:8080/' + file);
    await page.screenshot({
      clip: { x: 0, y: 0, width: 800, height: 340 },
      path: `${path.resolve(__dirname)}/plot_anat.png`,
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
        path: '/plot_anat.html'
    },
    (response) => {
      expect(response.statusCode).toBe(200);
      done();
    }).end();
  });
});
