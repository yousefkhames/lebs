/*
 * Second demo config: "Noor Boutique". Same app, different brand, colors, currency, language and catalog.
 * Open the app with ?demo=noor to see it. This is what rebranding for a client looks like.
 */
(function () {
  function daysAgo(n) { var d = new Date(Date.now() - n * 86400000); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  window.LEBS_CONFIG = {
    brand: { name: { en: 'Noor Boutique', ar: 'نور بوتيك' }, tagline: { en: 'Modest fashion, modern lines', ar: 'احتشام بخطوط عصرية' }, logo: 'examples/noor-logo.svg', favicon: 'examples/noor-logo.svg' },
    theme: { paper: '#ECEFF3', card: '#F8F9FB', ink: '#14213D', accent: '#B8881C', accent2: '#0B6E4F', line: '#B9C2D0' },
    defaultLang: 'en',
    whatsapp: { number: '971500000000', defaultCountryCode: '971' },
    reservationHoldHours: 24, newArrivalsDays: 21,
    currency: { code: 'AED', symbol: { en: 'AED', ar: 'د.إ' } },
    delivery: { fee: 15, freeOver: 300, note: { en: 'Delivery across Dubai the next day.', ar: 'التوصيل داخل دبي في اليوم التالي.' } },
    sizeOrder: ['S', 'M', 'L', 'XL', 'Free'],
    hero: { kicker: { en: 'New season', ar: 'موسم جديد' }, title: { en: 'Quiet clothes, loud confidence.', ar: 'ملابس هادئة وثقة عالية.' },
      text: { en: 'Abayas, dresses and scarves in soft colors. Reserve online and try on in the boutique.', ar: 'عبايات وفساتين وأوشحة بألوان ناعمة. احجز أونلاين وجرّب في البوتيك.' } },
    about: { title: { en: 'About Noor', ar: 'عن نور' }, text: { en: 'A boutique for modest everyday and occasion wear.', ar: 'بوتيك للملابس المحتشمة اليومية وللمناسبات.' } },
    contact: { address: { en: 'Al Wasl Road, Dubai', ar: 'شارع الوصل، دبي' }, hours: { en: 'Daily 10:00 to 22:00', ar: 'يومياً من ١٠ صباحاً إلى ١٠ مساءً' }, instagram: '' },
    perks: [{ en: 'Reserve and try in store', ar: 'احجز وجرّب في المتجر' }, { en: 'Next-day delivery', ar: 'توصيل لليوم التالي' }],
    categories: [{ id: 'abayas', name: { en: 'Abayas', ar: 'عبايات' } }, { id: 'dresses', name: { en: 'Dresses', ar: 'فساتين' } }, { id: 'scarves', name: { en: 'Scarves', ar: 'أوشحة' } }],
    palette: {
      ink: { hex: '#1B1B1F', en: 'Black', ar: 'أسود' }, navy: { hex: '#1F2F57', en: 'Navy', ar: 'كحلي' }, mocha: { hex: '#7A5C48', en: 'Mocha', ar: 'موكا' },
      pearl: { hex: '#E8E2D6', en: 'Pearl', ar: 'لؤلؤي' }, emerald: { hex: '#1F6B54', en: 'Emerald', ar: 'زمردي' }, blush: { hex: '#E3B8B0', en: 'Blush', ar: 'وردي هادئ' }
    },
    products: [
      { id: 'classic-abaya', art: 'abaya', category: 'abayas', price: 420, added: daysAgo(2), name: { en: 'Classic crepe abaya', ar: 'عباية كريب كلاسيك' }, desc: { en: 'Everyday crepe abaya with a clean open front.', ar: 'عباية كريب يومية بأمام مفتوح وخط بسيط.' }, colors: ['ink', 'navy', 'mocha'], sizes: { Free: 12 } },
      { id: 'butterfly-abaya', art: 'abaya', category: 'abayas', price: 560, added: daysAgo(5), name: { en: 'Butterfly sleeve abaya', ar: 'عباية بأكمام فراشة' }, desc: { en: 'Wide sleeves that move when you walk.', ar: 'أكمام واسعة تتحرك مع خطواتك.' }, colors: ['emerald', 'ink'], sizes: { Free: 6 } },
      { id: 'satin-dress', art: 'dress', category: 'dresses', price: 380, compareAt: 460, added: daysAgo(9), name: { en: 'Satin midi dress', ar: 'فستان ساتان ميدي' }, desc: { en: 'Soft satin, lined, with long sleeves.', ar: 'ساتان ناعم مبطن بأكمام طويلة.' }, colors: ['blush', 'emerald', 'navy'], sizes: { S: 2, M: 4, L: 3 } },
      { id: 'linen-dress', art: 'dress', category: 'dresses', price: 340, added: daysAgo(30), name: { en: 'Linen shirt dress', ar: 'فستان قميص كتان' }, desc: { en: 'Breathable linen blend for warm days.', ar: 'خليط كتان يتنفس للأيام الحارة.' }, colors: ['pearl', 'mocha'], sizes: { S: 3, M: 3, L: 0 } },
      { id: 'silk-scarf', art: 'scarf', category: 'scarves', price: 120, added: daysAgo(1), name: { en: 'Satin silk scarf', ar: 'وشاح حرير ساتان' }, desc: { en: 'Smooth finish that stays in place.', ar: 'ملمس ناعم يثبت في مكانه.' }, colors: ['blush', 'pearl', 'navy', 'emerald'], sizes: { Free: 25 } },
      { id: 'jersey-scarf', art: 'scarf', category: 'scarves', price: 70, added: daysAgo(40), name: { en: 'Jersey scarf', ar: 'وشاح جيرسيه' }, desc: { en: 'Stretch jersey, no pins needed.', ar: 'جيرسيه مطاط بدون الحاجة لدبابيس.' }, colors: ['ink', 'mocha', 'pearl'], sizes: { Free: 40 } }
    ]
  };
})();
