import { Page, Locator } from '@playwright/test';

/**
 * BasePage - shared behaviour for every Page Object.
 *
 * Provides:
 *  - Navigation helpers (open, goto).
 *  - The ParaBank global header / footer link locators (Solutions menu,
 *    "Admin Page" link, footer links) which exist on every page.
 *  - Common error-message and panel helpers used by many pages.
 */
export class BasePage {
  /** Canonical ParaBank base URL used by every Page Object. */
  static readonly BASE_URL = 'https://parabank.parasoft.com/parabank';

  readonly page: Page;

  /**
   * The base URL every POM uses for navigation. Defaults to the public
   * ParaBank demo, but tests can override it for the lifetime of a page
   * by calling `setBaseUrl(...)` — useful when a spec runs against the
   * local Docker instance instead of the cloud demo.
   */
  private baseUrl: string = BasePage.BASE_URL;

  // Global header
  readonly logoLink: Locator;
  readonly aboutUsLink: Locator;
  readonly servicesLink: Locator;
  readonly adminPageLink: Locator;

  // Global footer
  readonly footerHomeLink: Locator;
  readonly footerAboutUsLink: Locator;
  readonly footerServicesLink: Locator;
  readonly footerSiteMapLink: Locator;
  readonly footerContactLink: Locator;
  readonly footerForumLink: Locator;

  // Panels shown on errors / notifications
  readonly errorPanel: Locator;
  readonly title: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header - use visible-only selectors so we don't match the hidden
    // Solutions dropdown items.
    this.logoLink = page.locator('img[alt="ParaBank"]');
    this.aboutUsLink = page.locator('#headerPanel a[href*="about.htm"]:visible, #headerPanel a:has-text("About Us"):visible').first();
    this.servicesLink = page.locator('#headerPanel a[href*="services.htm"]:visible, #headerPanel a:has-text("Services"):visible').first();
    this.adminPageLink = page.locator('#headerPanel a:has-text("Admin Page")').first();

    // Footer links - text-based matches against the visible footer list.
    this.footerHomeLink = page.locator('#footerPanel a:has-text("Home")').first();
    this.footerAboutUsLink = page.locator('#footerPanel a:has-text("About Us")').first();
    this.footerServicesLink = page.locator('#footerPanel a:has-text("Services")').first();
    this.footerSiteMapLink = page.locator('#footerPanel a:has-text("Site Map")').first();
    this.footerContactLink = page.locator('#footerPanel a:has-text("Contact"):visible').first();
    this.footerForumLink = page.locator('#footerPanel a:has-text("Forum")').first();

    // Notification / error panels (right column) used after submitting forms
    this.errorPanel = page.locator('.error');
    this.title = page.locator('#rightPanel h1, .title');
  }

  /** Override the base URL for this instance. Affects all `goto()` calls on this POM. */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /** Wait for the public demo bank's Cloudflare rate limit to lift. */
  static async waitForRateLimit(): Promise<void> {
    const res = await fetch(`${BasePage.BASE_URL}/index.htm`, { method: 'GET' });
    if (res.status === 200) return;
    // 429/403/etc — wait longer than the previous attempt before retrying.
    const waitMs = 30_000;
    console.warn(`[BasePage] Public demo busy (HTTP ${res.status}); waiting ${waitMs / 1000}s…`);
    await new Promise((r) => setTimeout(r, waitMs));
  }

  /** Maximum number of retries for transient Cloudflare rate-limit responses. */
  static readonly MAX_NAV_RETRIES = 4;
  /** Initial wait between nav retries. Doubled each attempt. */
  static readonly NAV_RETRY_DELAY_MS = 10_000;

  /**
   * Returns true when the current page is the Cloudflare 1015 rate-limit
   * "You are being rate limited" page. Tests use this to skip gracefully.
   */
  async isRateLimited(): Promise<boolean> {
    return await this.page
      .locator('text=/Error 1015|being rate limited/i')
      .first()
      .isVisible({ timeout: 500 })
      .catch(() => false);
  }

  /**
   * Navigate to the supplied path (resolved against BASE_URL).
   *
   * Retries on Cloudflare rate-limit (Error 1015) with exponential backoff.
   * If the rate limit doesn't lift, leaves the error page in place — tests
   * can detect it via `isRateLimited()` and self-skip.
   */
  async goto(path = ''): Promise<void> {
    const cleaned = path.startsWith('/') ? path.slice(1) : path;
    const base = this.baseUrl;
    const absolute = new URL(
      cleaned,
      base.endsWith('/') ? base : base + '/',
    ).toString();

    for (let attempt = 0; attempt < BasePage.MAX_NAV_RETRIES; attempt++) {
      try {
        await this.page.goto(absolute, { waitUntil: 'load', timeout: 25_000 });
      } catch {
        // goto failure - fall through to the rate-limit / retry check below
      }
      if (!(await this.isRateLimited())) return;
      const backoff = BasePage.NAV_RETRY_DELAY_MS * Math.pow(2, attempt);
      console.warn(
        `[BasePage] Rate-limited on attempt ${attempt + 1}/${BasePage.MAX_NAV_RETRIES}; backing off ${backoff / 1000}s`,
      );
      await this.page.waitForTimeout(backoff);
    }
  }

  /** Get the current page title (the <title> tag). */
  async getPageTitle(): Promise<string> {
    return await this.page.title();
  }

  /** Get the visible page heading (the right-panel <h1>). */
  async getPageHeading(): Promise<string> {
    const heading = this.page.locator('#rightPanel h1').first();
    return (await heading.textContent())?.trim() ?? '';
  }

  /** Click the logo and return to the home page. */
  async clickLogo(): Promise<void> {
    await this.logoLink.click();
  }

  /** Returns the visible error/notification text (empty string if none). */
  async getErrorMessage(): Promise<string> {
    const err = this.errorPanel.first();
    if (await err.isVisible().catch(() => false)) {
      return ((await err.textContent()) ?? '').trim();
    }
    return '';
  }

  /** True when the ParaBank error panel is currently visible. */
  async hasError(): Promise<boolean> {
    return await this.errorPanel.first().isVisible().catch(() => false);
  }
}
