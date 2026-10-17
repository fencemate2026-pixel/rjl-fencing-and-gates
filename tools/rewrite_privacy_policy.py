#!/usr/bin/env python3
"""
rewrite_privacy_policy.py - rewrites the body of site/privacy-policy.html (same URL, same page chrome).

Wording checked against the site code on 16 Oct 2026: Google Analytics 4 only (assets/ga.js; no Google Ads
tag or enhanced-conversion/hashed-email code found, so that claim was removed), one Netlify Form
(photo-visualiser, incl. photo uploads), photo visualiser + object removal run on-device, "Ask RJL" chat
is keyword-only and sends nothing, quote form opens the visitor's email app, 3D designer uses browser
storage, outbound links to Google / Instagram / Facebook (no embeds). Updated 16 Oct 2026 for the optional
AI photo-real finish (ported from rjlcommercialgroup.com: Netlify AI Gateway -> Google Gemini, consent first).
DRAFT WORDING - to be reviewed by an Australian solicitor (Privacy Act 1988 / APPs).
Idempotent. Usage: python3 tools/rewrite_privacy_policy.py
"""
import html, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGE = os.path.join(ROOT, 'site', 'privacy-policy.html')
UPDATED = '16 October 2026'
EMAIL, PHONE = 'info@rjlfencing.com.au', '0412 467 840'

SECTIONS = [
    ('Who we are', [
        'This website is run by RJL FENCING PTY. LTD. (ABN 82 159 036 781), trading as RJL Fencing and Gates ("RJL", "we", "us"), '
        'Unit 1 / 12 Merchant Avenue, Thomastown VIC 3074. This policy explains what personal information we collect through '
        'rjlfencingandgates.com.au, why, who we share it with and how you can contact us about it. We handle personal information in '
        'line with the Australian Privacy Principles in the Privacy Act 1988 (Cth).']),
    ('What we collect', [
        'We only collect information you choose to give us, plus basic website usage information:',
        ('ul', [
            'Quote enquiries: your name, phone number, email, suburb or address, project details, approximate measurements and any photos '
            'or documents you send. The quote form opens your own email app with the details filled in; nothing is sent until you press '
            'send in your email app.',
            'Photo visualiser enquiries: your contact details, property address, design summary, the photo you upload and the concept '
            'picture made from it, and an AI photo-real picture if you choose to include one.',
            'Phone calls, texts and emails you send us, handled through our normal phone and email services.',
            'Website usage (Google Analytics): pages visited, approximate location (city level), device and browser type, and actions such '
            'as tapping our phone number or opening the chat. We do not use this to identify you.']),
        'We do not ask for payment card details on this website.']),
    ('How we use it', [
        ('ul', [
            'To respond to your enquiry, assess the job, prepare quotes and arrange site visits.',
            'To build, repair and support the work we do for you, and keep ordinary business and legal records.',
            'To understand which pages and enquiry options are useful, measure how well our advertising works, and improve the website.']),
        'We do not sell personal information. We will not use photos of your property in our marketing without your separate permission.']),
    ('The photo visualiser, designer and chat', [
        'The photo visualiser processes your photo on your own device: placing the fence, removing objects, lighting, video, AR and '
        '3D model downloads all happen in your browser and are not sent to us.',
        'Your photo is only sent to RJL if you submit the visualiser\'s quote form. It is then delivered to us through Netlify Forms (our '
        'website host) and kept with your enquiry.',
        'The AI photo-real finish is optional. Only if you choose it and agree to the notice shown at that point, a copy of your concept '
        'picture (your photo with the design on it) is sent through Netlify\'s AI service to Google\'s Gemini image model, which returns '
        'an edited picture. It is used only to make that one picture: our website does not store it, and Netlify\'s AI service uses '
        'providers that do not keep the data. The result is only sent to RJL if you choose to include it with your enquiry. Please do '
        'not use the AI finish on photos that show people\'s faces, number plates or anything private.',
        'The 3D fence designer keeps your design in your own browser\'s storage so it is there when you come back. It is not sent to us '
        'unless you send an enquiry.',
        'The "Ask RJL" chat answers common questions from a built-in list. What you type stays in your browser and is not sent to us or '
        'anyone else.']),
    ('Who we share it with', [
        'We use a small number of service providers to run the website. They may store or process information outside Australia, '
        'including in the United States:',
        ('ul', [
            'Netlify, Inc. - website hosting, delivery of photo visualiser enquiries and the optional AI service.',
            'Google LLC - Google Analytics, and the Gemini AI model used only if you choose the AI photo-real finish. We may also use '
            'Google Ads and link it with Analytics to see which ads lead to enquiries.',
            'Your own email provider, when you send us an email or use the quote form.']),
        'We may also share information with our own staff and subcontractors who carry out the work, or where the law requires it. Links '
        'to Google, Instagram and Facebook take you to services run by those companies, whose own privacy terms apply.']),
    ('Cookies', [
        'Google Analytics uses cookies to count visits and measure enquiries. If we run Google Ads, Google may also use cookies to measure '
        'and personalise ads. You can block or delete cookies in your browser, use Google\'s Analytics opt-out add-on '
        '(tools.google.com/dlpage/gaoptout) or manage ad settings at adssettings.google.com, and the site will still work.']),
    ('How we keep it safe and how long', [
        'We take reasonable steps to protect personal information from misuse, loss and unauthorised access. We keep enquiry information '
        'only as long as we need it for the job, our business records and our legal obligations, and then delete or de-identify it.']),
    ('Access, correction and complaints', [
        'You can ask what personal information we hold about you, ask us to correct it, or ask us to delete your photos or enquiry. '
        'Contact us using the details below and we will respond within a reasonable time, usually within 30 days.',
        'If you have a privacy concern, please contact us first so we can try to fix it. If you are not satisfied with our response, you '
        'can contact the Office of the Australian Information Commissioner (OAIC) at oaic.gov.au or on 1300 363 992.']),
    ('Contact us', [
        'RJL Fencing and Gates, Unit 1 / 12 Merchant Avenue, Thomastown VIC 3074',
        f'Email: {EMAIL} · Phone: {PHONE}']),
    ('Changes to this policy', [
        'We may update this policy when our website or services change. The latest version is always on this page.']),
]

LINKS = [
    (EMAIL, f'<a href="mailto:{EMAIL}">{EMAIL}</a>'),
    (PHONE, '<a href="tel:+61412467840">0412 467 840</a>'),
    ('oaic.gov.au', '<a href="https://www.oaic.gov.au/" rel="noopener">oaic.gov.au</a>'),
    ('tools.google.com/dlpage/gaoptout', '<a href="https://tools.google.com/dlpage/gaoptout" rel="noopener">tools.google.com/dlpage/gaoptout</a>'),
    ('adssettings.google.com', '<a href="https://adssettings.google.com/" rel="noopener">adssettings.google.com</a>'),
]


def body():
    out = [f'<p><strong>Last updated:</strong> {UPDATED}</p>']
    for h, items in SECTIONS:
        out.append(f'<h2>{html.escape(h)}</h2>')
        for it in items:
            if isinstance(it, tuple):
                out.append('<ul>' + ''.join(f'<li>{html.escape(x)}</li>' for x in it[1]) + '</ul>')
            else:
                t = html.escape(it)
                for k, v in LINKS:
                    t = t.replace(k, v)
                out.append(f'<p>{t}</p>')
    return ''.join(out)


def main():
    s = open(PAGE, encoding='utf-8').read()
    a = s.index('<div class="content-body">') + len('<div class="content-body">')
    b = s.index('</div>', a)
    if '<div' in s[a:b]:
        raise SystemExit('ABORT: unexpected nested div in content-body')
    s = s[:a] + body() + s[b:]
    s = s.replace('<p>RJL does not ask for payment-card details through this website.</p>',
                  '<p>We only collect what you choose to send us. We do not sell it.</p>')
    s = s.replace('<h2>Quote details are used to respond to your project.</h2>',
                  '<h2>Your details are used to respond to your project.</h2>')
    # older standalone visualiser section, now covered above
    s = re.sub(r'<section class="content-section"><div class="shell"><div class="content-body"><h2>Property photos and visualiser '
               r'enquiries</h2>.*?</section>', '', s, flags=re.S)
    open(PAGE, 'w', encoding='utf-8').write(s)
    print('privacy-policy.html rewritten,', UPDATED)


if __name__ == '__main__':
    main()
