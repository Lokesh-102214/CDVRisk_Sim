const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  const html = `
    <!DOCTYPE html>
    <html>
    <body>
      <iframe
        id="api-frame"
        src="https://sketchfab.com/models/a3f0ea2030214a6bbaa97e7357eebd58/embed"
        allow="autoplay; fullscreen"
        frameborder="0"
      ></iframe>
      <script src="https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js"></script>
      <script>
        window.annotationsResult = null;
        const iframe = document.getElementById('api-frame');
        const client = new Sketchfab(iframe, {
          success: function(api) {
            api.start(function() {
              api.addEventListener('viewerready', function() {
                api.getAnnotationList(function(err, annotations) {
                  if (err) {
                    window.annotationsResult = { error: err.toString() };
                    return;
                  }
                  window.annotationsResult = annotations;
                });
              });
            });
          }
        });
      </script>
    </body>
    </html>
  `;
  
  await page.setContent(html);
  
  console.log("Waiting for annotations...");
  
  await page.waitForFunction('window.annotationsResult !== null', { timeout: 30000 });
  
  const annotations = await page.evaluate(() => window.annotationsResult);
  fs.writeFileSync('annotations.json', JSON.stringify(annotations, null, 2));
  console.log("Saved annotations to annotations.json");
  
  await browser.close();
})();
