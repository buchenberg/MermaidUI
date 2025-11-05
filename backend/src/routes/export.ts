import express, { Request, Response } from 'express';
import puppeteer from 'puppeteer';
import { runQuery } from '../database';
import { Diagram } from '../database';

const router = express.Router();

// Export diagram as SVG
router.post('/svg/:id', async (req: Request, res: Response) => {
  let browser: any = null;
  try {
    const diagram = await runQuery<Diagram>(
      'SELECT * FROM diagrams WHERE id = ?',
      [req.params.id]
    );
    if (!diagram) {
      return res.status(404).json({ error: 'Diagram not found', details: 'Diagram not found' });
    }

    console.log(`Rendering diagram ${diagram.id} as SVG`);
    
    // Use Puppeteer to render Mermaid since it needs a DOM environment
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
          <style>
            body { margin: 0; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="mermaid">
${diagram.content}
          </div>
          <script>
            mermaid.initialize({ startOnLoad: true, theme: 'default' });
          </script>
        </body>
      </html>
    `);
    
    // Wait for Mermaid to render
    await page.waitForSelector('.mermaid svg', { timeout: 10000 });
    
    // Get the SVG content
    const svg = await page.evaluate(() => {
      const svgElement = document.querySelector('.mermaid svg');
      if (!svgElement) throw new Error('SVG element not found');
      return svgElement.outerHTML;
    });
    
    await browser.close();
    browser = null;
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  } catch (error: any) {
    if (browser) {
      await browser.close().catch(() => {});
    }
    console.error('Export SVG error:', error);
    res.status(500).json({ 
      error: 'Failed to generate SVG', 
      details: error.message || 'Unknown error' 
    });
  }
});

// Export diagram as PNG
router.post('/png/:id', async (req: Request, res: Response) => {
  let browser: any = null;
  try {
    const diagram = await runQuery<Diagram>(
      'SELECT * FROM diagrams WHERE id = ?',
      [req.params.id]
    );
    if (!diagram) {
      return res.status(404).json({ error: 'Diagram not found' });
    }

    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
          <style>
            body { margin: 0; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="mermaid">
${diagram.content}
          </div>
          <script>
            mermaid.initialize({ startOnLoad: true, theme: 'default' });
          </script>
        </body>
      </html>
    `);
    
    // Wait for Mermaid to render
    await page.waitForSelector('.mermaid svg', { timeout: 10000 });
    
    const screenshot = await page.screenshot({ type: 'png', fullPage: true });
    await browser.close();
    browser = null;

    res.setHeader('Content-Type', 'image/png');
    res.send(screenshot);
  } catch (error: any) {
    if (browser) {
      await browser.close().catch(() => {});
    }
    console.error('Export PNG error:', error);
    res.status(500).json({ error: 'Failed to generate PNG', details: error.message });
  }
});

// Export diagram as PDF
router.post('/pdf/:id', async (req: Request, res: Response) => {
  let browser: any = null;
  try {
    const diagram = await runQuery<Diagram>(
      'SELECT * FROM diagrams WHERE id = ?',
      [req.params.id]
    );
    if (!diagram) {
      return res.status(404).json({ error: 'Diagram not found' });
    }

    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
          <style>
            body { margin: 0; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="mermaid">
${diagram.content}
          </div>
          <script>
            mermaid.initialize({ startOnLoad: true, theme: 'default' });
          </script>
        </body>
      </html>
    `);
    
    // Wait for Mermaid to render
    await page.waitForSelector('.mermaid svg', { timeout: 10000 });
    
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();
    browser = null;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${diagram.name}.pdf"`);
    res.send(pdf);
  } catch (error: any) {
    if (browser) {
      await browser.close().catch(() => {});
    }
    console.error('Export PDF error:', error);
    res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
  }
});

export default router;

