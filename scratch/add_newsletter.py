import glob
import re

newsletter_html = '''    <!-- NEWSLETTER: LETTERS FROM THE NORTH -->
    <section class="rg-section rg-newsletter-section" id="rg-newsletter-block" style="background:var(--brand-primary);color:#F7F4EE;padding-block:clamp(48px, 6vw, 72px);border-block-start:1px solid rgba(184,145,58,0.3);">
      <div class="rg-container">
        <div style="max-width:680px;margin-inline:auto;text-align:center;">
          <span class="rg-badge rg-badge--handmade" style="background:rgba(184,145,58,0.2);color:var(--rg-antique-gold);border-color:rgba(184,145,58,0.4);margin-block-end:14px;">Dispatch From The Valleys</span>
          <h2 style="font-family:var(--font-display);font-size:clamp(1.8rem, 3.2vw, 2.4rem);color:#F7F4EE;margin-block-end:10px;">Letters from the North</h2>
          <p style="font-size:var(--text-sm);color:rgba(247,244,238,0.85);margin-block-end:24px;line-height:1.6;">
            New collections, maker stories, and care tips—delivered twice a month. No spam, unsubscribe anytime.
          </p>
          <form class="rg-newsletter-form" onsubmit="event.preventDefault();if(window.RG&&window.RG.ui){window.RG.ui.toast('You\\'re in. Your first letter arrives with our next collection.');this.reset();}" style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;max-width:520px;margin-inline:auto;">
            <input type="email" required placeholder="Enter your email address" aria-label="Email for Letters from the North" style="flex:1;min-width:240px;padding:12px 18px;border-radius:var(--radius-editorial);border:1px solid rgba(247,244,238,0.3);background:rgba(255,255,255,0.08);color:#F7F4EE;font-size:var(--text-sm);">
            <button type="submit" class="rg-btn rg-btn--secondary" style="background:var(--brand-secondary);color:#FFFFFF;padding:12px 24px;font-weight:600;">Subscribe</button>
          </form>
          <div style="display:flex;align-items:center;justify-content:center;gap:18px;margin-block-start:18px;font-size:12px;color:rgba(247,244,238,0.7);">
            <span>✓ No spam guarantee</span>
            <span>·</span>
            <span>✓ Easy 1-click unsubscribe</span>
            <span>·</span>
            <span>✓ Early collection access</span>
          </div>
        </div>
      </div>
    </section>
  </main>'''

skip_pages = {'checkout.html', 'order-confirmation.html', 'cart.html'}

files = glob.glob('*.html')
count = 0
for f in files:
    if f in skip_pages:
        continue
    with open(f, 'r', encoding='utf-8') as fp:
        c = fp.read()
    if 'rg-newsletter-block' in c:
        continue
    if '</main>' in c:
        c = c.replace('</main>', newsletter_html, 1)
        with open(f, 'w', encoding='utf-8') as fp:
            fp.write(c)
        count += 1
        print(f"Added newsletter to {f}")

print(f"Finished adding newsletter to {count} files.")
