import puppeteer, { Browser } from 'puppeteer';

class PuppeteerManager {
  private static instance: Browser | null = null;

  private static async getBrowser(): Promise<Browser> {
    if (!this.instance) {
      this.instance = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      this.instance.on('disconnected', () => {
        this.instance = null;
      });
    }
    return this.instance;
  }

  public static async generatePDF(html: string): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await page.close();
    }
  }

  public static async closeBrowser() {
    if (this.instance) {
      await this.instance.close();
      this.instance = null;
    }
  }
}

export default PuppeteerManager;
