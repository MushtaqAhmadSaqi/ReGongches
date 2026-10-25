import glob
import re

phone_raw = "923408500976"
phone_formatted = "+92 340 8500976"
phone_input = "0340-8500976"

files = glob.glob('*.html')

clean_footer = '''  <!-- Illustrative Dark-Blue Site Footer (.site-footer) -->
  <footer class="site-footer" id="colophon">
    <!-- Layered Mountain Silhouette SVG -->
    <div class="site-footer__mountains" aria-hidden="true">
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none" fill="none">
        <path d="M0 120 L0 72 L210 24 L420 82 L690 12 L960 76 L1210 18 L1440 68 L1440 120 Z" fill="#1F3A5F" opacity="0.45" />
        <path d="M0 120 L160 48 L390 92 L620 28 L890 88 L1140 34 L1440 84 L1440 120 Z" fill="#13243B" />
      </svg>
    </div>

    <div class="rg-container">
      <!-- Minimal Essential Footer Grid -->
      <div class="site-footer__grid" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));">
        <div class="site-footer__col">
          <h3>Shop</h3>
          <ul>
            <li><a href="shop.html">All Mountain Catalogue</a></li>
            <li><a href="category.html?cat=Traditional+Dresses">Traditional Dresses</a></li>
            <li><a href="category.html?cat=Caps+%26+Headwear">Gilgiti &amp; Hunza Caps</a></li>
            <li><a href="category.html?cat=Shawls+%26+Scarves">Hand-Woven Wool Shawls</a></li>
            <li><a href="category.html?cat=Waistcoats+%26+Outerwear">Pattu Waistcoats &amp; Jackets</a></li>
          </ul>
        </div>

        <div class="site-footer__col">
          <h3>Help &amp; Policies</h3>
          <ul>
            <li><a href="size-guide.html">Size Guide</a></li>
            <li><a href="shipping-policy.html">Shipping &amp; Delivery</a></li>
            <li><a href="returns-exchange.html">Returns &amp; Exchanges</a></li>
            <li><a href="account.html">Track Your Order</a></li>
            <li><a href="faq.html">FAQs</a></li>
          </ul>
        </div>

        <div class="site-footer__col">
          <h3>About</h3>
          <ul>
            <li><a href="our-story.html">Our Story</a></li>
            <li><a href="artisans.html">Meet the Artisans</a></li>
            <li><a href="authenticity.html">How We Verify Origin</a></li>
            <li><a href="contact.html">Contact Us</a></li>
          </ul>
        </div>

        <div class="site-footer__col">
          <h3>Contact</h3>
          <ul>
            <li><a href="https://wa.me/923408500976" target="_blank" rel="noopener">WhatsApp: +92 340 8500976</a></li>
            <li><a href="tel:03408500976">Call: 0340-8500976</a></li>
            <li><a href="mailto:care@regongches.store">Email: care@regongches.store</a></li>
          </ul>
          <p class="urdu-text" style="font-size:var(--text-sm);color:var(--rg-antique-gold);margin-block-start:12px;margin-block-end:0;">
            پہاڑی ورثے کے دھاگے — گلگت بلتستان کی مستند دستکاری
          </p>
        </div>
      </div>

      <!-- Payment & Copyright Row -->
      <div class="site-footer__badges">
        <div class="rg-pay-badges" aria-label="Supported Payment Options">
          <span class="rg-pay-badge">Cash on Delivery (COD)</span>
          <span class="rg-pay-badge">Bank Transfer (IBFT)</span>
          <span class="rg-pay-badge">Easypaisa</span>
          <span class="rg-pay-badge">JazzCash</span>
        </div>
        <div style="font-size:var(--text-xs);color:rgba(247,244,238,0.78);">
          © 2026 ReGongches · <a href="privacy.html" style="text-decoration:underline;">Privacy</a> · <a href="terms.html" style="text-decoration:underline;">Terms</a>
        </div>
      </div>
    </div>

    <!-- Giant Wordmark -->
    <div class="site-footer__wordmark" aria-hidden="true">ReGongches</div>
  </footer>
  <!-- RG:FOOTER END -->'''

footer_regex = re.compile(r'(\s*<!-- Illustrative Dark-Blue Site Footer.*?<!-- RG:FOOTER END -->)', re.DOTALL)
wa_regex = re.compile(r'https://wa\.me/923000000000')

updated_count = 0
for f in files:
    with open(f, 'r', encoding='utf-8') as fp:
        c = fp.read()
    
    # 1. Replace footer block
    if footer_regex.search(c):
        c = footer_regex.sub(clean_footer, c)
    else:
        print(f"Warning: footer regex did not match in {f}")

    # 2. Replace any remaining WhatsApp link with user's number
    c = wa_regex.sub(f'https://wa.me/{phone_raw}', c)
    
    # 3. Replace any old phone text
    c = c.replace('+92 300 0000000 [verify]', phone_formatted)
    c = c.replace('+92 300 0000000', phone_formatted)
    
    with open(f, 'w', encoding='utf-8') as fp:
        fp.write(c)
    updated_count += 1
    print(f"Updated footer and contacts in {f}")

print(f"Finished updating {updated_count} files.")
